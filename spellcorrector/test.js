const add = require('./test1');
const speller = require('./spellchecker')
const { Console } = require('console');
const fs = require('fs');
const checkattempt = require('./usertest.json');


function pushresult(b){
  var IDandUser = [];
  var i ;
  for(i = 0 ; i < b.length ; i++){
    IDandUser.push({"userID": b[i].userID, "attempt" : parseInt(b[i].attempt)})
  }
  console.log(IDandUser);
}
//console.log(IDandUser);
pushresult(checkattempt);
console.log(checkattempt);
//expexted output : ({UserID: 'Pachara Bunmalert', Attempt: 1},{UserID: 'Steve Mask', Attempt: 2})
var IDandAllAttempt = [];
checkattempt.forEach(function(item){
    var j = IDandAllAttempt.findIndex(x => x.userID == item.userID);
    if(j <= -1){
        IDandAllAttempt.push({"userID": item.userID, "attempt" : item.attempt});
    }else IDandAllAttempt[j].attempt = IDandAllAttempt[j].attempt + item.attempt;
});
console.log(IDandAllAttempt);
//speller.add(3,5);
module.exports = { pushresult };


