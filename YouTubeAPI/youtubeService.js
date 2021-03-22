const { google } = require('googleapis');

// Put the following at the top of the file
// right below the'googleapis' import
const util = require('util');
const fs = require('fs');
const { type } = require('os');
const spellcorrector = require('../spellcorrector/spellchecker'); // use module from spellchecker
const TrainDataFile = fs.readFileSync('Dig.txt', 'utf-8'); // train data file 

let liveChatId; // Where we'll store the id of our liveChat
let nextPage; // How we'll keep track of pagination for chat messages
const intervalTime = 3000; // Miliseconds between requests to check chat messages
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

//starting train data for spellcorrector
spellcorrector.speller.train(TrainDataFile);

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
    //save('./text.json', JSON.stringify(liveChatId));
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

let IDandAllAttempt = [];
const respond = newMessages => {
  let a = []; //store only new comment
  let detected = {"iscaught": false};  
  newMessages.forEach(message => {
    const messageText = message.snippet.displayMessage.toLowerCase();
    const author = message.authorDetails.displayName;
    const authorID = message.authorDetails.channelId;
    const messageID = message.id;
    spellcorrector.speller.cleantextonlyonewords(messageText);
    spellcorrector.speller.countattempttest(messageText,detected);
    console.log(detected);
    if(detected.iscaught){      
      a.push({"user": author, "userID": authorID, "message": messageText, "attempt": "1"});
      console.log("detected");
      youtubeService.deleteMessage(messageID);
    }else console.log("not detected");
  });
  a.forEach(item => {
    let j = IDandAllAttempt.findIndex(x => x.userID == item.userID);
      if(j <= -1){
          IDandAllAttempt.push({"userID": item.userID, "attempt" : item.attempt});
      }else IDandAllAttempt[j].attempt = IDandAllAttempt[j].attempt + "1";
      
      if(IDandAllAttempt[j].attempt == "11"){
        youtubeService.banUser(IDandAllAttempt[j].userID);
        IDandAllAttempt[j].attempt = IDandAllAttempt[j] + "1";
      }
      
      if(IDandAllAttempt[j].attempt == "[object Object]1111"){
        youtubeService.banPermanentUser(IDandAllAttempt[j].userID);
      }
  });
  console.log(IDandAllAttempt);
};

//--------------------------------------------------------------------------------//
const getChatMessages = async () => {
  const response = await youtube.liveChatMessages.list({
    auth,
    part: 'id,snippet,authorDetails',
    liveChatId,
    pageToken: nextPage
  });
  const { data } = response;
  const newMessages = data.items;
  chatMessages.push(...newMessages);
  nextPage = data.nextPageToken;
  console.log('Total Chat Messages:', chatMessages.length);
  respond(newMessages);
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

youtubeService.deleteMessage = id => {
  youtube.liveChatMessages.delete(
    {
      auth,
      part: 'id',
      id,
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
