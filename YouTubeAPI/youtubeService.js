const { google } = require('googleapis');

// Put the following at the top of the file
// right below the'googleapis' import
const util = require('util');
const fs = require('fs');
const { type } = require('os');

let liveChatId; // Where we'll store the id of our liveChat
let nextPage; // How we'll keep track of pagination for chat messages
const intervalTime = 5000; // Miliseconds between requests to check chat messages
let interval; // variable to store and control the interval that will check messages
let chatMessages = []; // where we'll store all messages

const writeFilePromise = util.promisify(fs.writeFile);
const readFilePromise = util.promisify(fs.readFile);

const save = async (path, str) => {
  await writeFilePromise(path, str);
  console.log('Successfully Saved');
};

const read = async path => {
  const fileContents = await readFilePromise(path);
  return JSON.parse(fileContents);
};

const youtube = google.youtube('v3');
const OAuth2 = google.auth.OAuth2;

const clientId = '818143313128-4li55gp8rqfu5qa6ibte206lrbefh286.apps.googleusercontent.com';
const clientSecret = 'l-92SJ49hRvohx-QoQCImabW';
const redirectURI = 'http://localhost:3000/callback';

// Permissions needed to view and submit live chat comments
const scope = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/youtube',
  'https://www.googleapis.com/auth/youtube.force-ssl'
];

const auth = new OAuth2(clientId, clientSecret, redirectURI);

const youtubeService = {};

youtubeService.getCode = response => {
  const authUrl = auth.generateAuthUrl({
    access_type: 'offline',
    scope
  });
  response.redirect(authUrl);
};

// Request access from tokens using code from login
youtubeService.getTokensWithCode = async code => {
  const credentials = await auth.getToken(code);
  youtubeService.authorize(credentials);
};

// Storing access tokens received from google in auth object
youtubeService.authorize = ({ tokens }) => {
  auth.setCredentials(tokens);
  console.log('Successfully set credentials');
  console.log('tokens:', tokens);
  save('./tokens.json', JSON.stringify(tokens));
};

youtubeService.findActiveChat = async () => {
  const response = await youtube.liveBroadcasts.list({
    auth,
    part: 'snippet',
    mine: 'true'
  });
  const latestChat = response.data.items[0];

  if (latestChat && latestChat.snippet.liveChatId) {
    liveChatId = latestChat.snippet.liveChatId;
    console.log("Chat ID Found:", liveChatId);
    save('./text.json', JSON.stringify(liveChatId));
    //save('./text.json',JSON.stringify(latestChat));
  } else {
    console.log("No Active Chat Found");
  }
};

// Update the tokens automatically when they expire
auth.on('tokens', tokens => {
  if (tokens.refresh_token) {
    // store the refresh_token in my database!
    save('./tokens.json', JSON.stringify(auth.tokens));
    console.log(tokens.refresh_token);
  }
  console.log(tokens.access_token);
});

// Read tokens from stored file
const checkTokens = async () => {
  const tokens = await read('./tokens.json');
  if (tokens) {
    auth.setCredentials(tokens);
    console.log('tokens set');
  } else {
    console.log('no tokens set');
  }
};
let b = []; //store all live comment
var IDandAllAttempt = [];
const respond = newMessages => {
  let a = []; //store only new comment  
  newMessages.forEach(message => {
    const messageText = message.snippet.displayMessage.toLowerCase();
    console.log(messageText);
    const author = message.authorDetails.displayName;
    const authorID = message.authorDetails.channelId;
    const checkattempt = require('../spellcorrector/usertest.json');
    var IDandUser = [];
    var i ;
    for(i = 0 ; i < checkattempt.length ; i++){
        IDandUser.push({"userID": checkattempt[i].userID, "attempt" : parseInt(checkattempt[i].attempt)})
    }
    //console.log(IDandUser);
    IDandUser.forEach(function(item){
        var j = IDandAllAttempt.findIndex(x => x.userID == item.userID);
        if(j <= -1){
            IDandAllAttempt.push({"userID": item.userID, "attempt" : item.attempt});
        }else IDandAllAttempt[j].attempt = IDandAllAttempt[j].attempt + item.attempt;

        if(IDandAllAttempt[j].attempt == 2){
          youtubeService.banUser(JSON.stringify(IDandAllAttempt[j].userID));
          IDandAllAttempt[j].attempt = IDandAllAttempt[j].attempt + 1;
        }
    });
    console.log(IDandAllAttempt);
    if(messageText.includes('fcuk')){
      //const response = `Not good ${author}!`;
      //youtubeService.insertMessage(response);
      
      //youtubeService.banUser(response);
    }
    if(!a.length){
    a.push({"user": author, "userID": authorID, "message": messageText, "attempt": "0"});
    save('./message.json', JSON.stringify(a));
    }
    console.log(JSON.stringify(messageText));
    b.push({"user": author, "userID": authorID, "message": messageText, "attempt": "0"});
  });
  console.log(a);
  save('./all_message.json', JSON.stringify(b));
};

const getChatMessages = async () => {
  const response = await youtube.liveChatMessages.list({
    auth,
    part: 'snippet,authorDetails',
    liveChatId,
    pageToken: nextPage
  });
  const { data } = response;
  const newMessages = data.items;
  chatMessages.push(...newMessages);
  nextPage = data.nextPageToken;
  console.log('Total Chat Messages:', chatMessages.length);
  respond(newMessages);
  //console.log(newMessages);
};

youtubeService.startTrackingChat = () => {
  interval = setInterval(getChatMessages, intervalTime);
};

youtubeService.stopTrackingChat = () => {
  clearInterval(interval);
};

youtubeService.insertMessage = messageText => {
  youtube.liveChatMessages.insert(
    {
      auth,
      part: 'snippet',
      resource: {
        snippet: {
          type: 'textMessageEvent',
          liveChatId,
          textMessageDetails: {
            messageText
          }
        }
      }
    },
    () => {}
  );
};

youtubeService.banUser = channelId => {
  youtube.liveChatBans.insert(
    {
      auth,
      part: 'snippet',
      resource: {
        snippet: {
          liveChatId,
          type: 'temporary',
          banDurationSeconds: 30,
          bannedUserDetails: {
            channelId
          }
        }
      }
    },
    () => {}
  );
};

youtubeService.banPermanentUser = channelId => {
  youtube.liveChatBans.insert(
    {
      auth,
      part: 'snippet',
      resource: {
        snippet: {
          liveChatId,
          type: 'permanent',
          banDurationSeconds: 30,
          bannedUserDetails: {
            channelId
          }
        }
      }
    },
    () => {}
  );
};
checkTokens();

// As we progress throug this turtorial, Keep the following line at the nery bottom of the file
// It will allow other files to access to our functions
module.exports = youtubeService;
