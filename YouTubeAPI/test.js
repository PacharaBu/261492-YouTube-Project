const { Console } = require('console');
const fs = require('fs');
const checkattempt = require('../spellcorrector/usertest.json');
var IDandUser = [];
var i , ii ;
for(i = 0 ; i < checkattempt.length ; i++){
    IDandUser.push({"userID": checkattempt[i].userID, "attempt" : parseInt(checkattempt[i].attempt)})
}
//console.log(IDandUser);

//expexted output : ({UserID: 'Pachara Bunmalert', Attempt: 1},{UserID: 'Steve Mask', Attempt: 2})
var IDandAllAttempt = [];
IDandUser.forEach(function(item){
    var j = IDandAllAttempt.findIndex(x => x.userID == item.userID);
    if(j <= -1){
        IDandAllAttempt.push({"userID": item.userID, "attempt" : item.attempt});
    }else IDandAllAttempt[j].attempt = IDandAllAttempt[j].attempt + item.attempt;
});
console.log(IDandAllAttempt);


  /*var data=[
    {id: 555, name: "Sales", person: "Jordan" },
    {id: 555, name: "Sales", person: "Bob" },
    {id: 555, name: "Sales", person: "John" },
    {id: 777, name: "Accounts Payable", person: "Rhoda" },
    {id: 777, name: "Accounts Payable", person: "Harry" },
    {id: 888, name: "IT", person: "Joe" },
    {id: 888, name: "IT", person: "Jake" },
    ];
    var resArr = [];
    data.forEach(function(item){
      var i = resArr.findIndex(x => x.name == item.name);
      if(i <= -1){
        resArr.push({id: item.id, name: item.name});
      }
    });
    console.log(resArr);*/
