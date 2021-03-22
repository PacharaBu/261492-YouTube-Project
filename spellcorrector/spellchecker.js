const { Console } = require('console');
const fs = require('fs');
const { digitalassetlinks } = require('googleapis/build/src/apis/digitalassetlinks');
const reflist = require('./reflist.json');
var speller = {};
speller.train = function (text) {
  var m;
  re = RegExp('[a-z]+', 'g');
  text = text.toLowerCase();
  while ((m = re.exec(text)) !== null) {
    speller.nWords[m[0]] = speller.nWords.hasOwnProperty(m[0]) ? speller.nWords[m[0]] + 1 : 1;
  }
};
speller.correct = function (word) {
  if (speller.nWords.hasOwnProperty(word)) return word;
  var candidates = {}, list = speller.edits(word);
  list.forEach(function (edit) {
    if (speller.nWords.hasOwnProperty(edit)) candidates[speller.nWords[edit]] = edit;
  });
  if (speller.countKeys(candidates) > 0) return candidates[speller.max(candidates)];
  list.forEach(function (edit) {
    speller.edits(edit).forEach(function (w) {
      if (speller.nWords.hasOwnProperty(w)) candidates[speller.nWords[w]] = w;
    });
  });
  return speller.countKeys(candidates) > 0 ? candidates[speller.max(candidates)] : word;
};
speller.nWords = {};
speller.countKeys = function (object) {
  var attr, count = 0;
  for (attr in object)
    if (object.hasOwnProperty(attr))
      count++;
  return count;
};
speller.max = function (candidates) {
  var candidate, arr = [];
  for (candidate in candidates)
    if (candidates.hasOwnProperty(candidate))
      arr.push(candidate);
  return Math.max.apply(null, arr);
};
speller.letters = "abcdefghijklmnopqrstuvwxyz".split("");
speller.edits = function (word) {
  var i, results = [];
  for (i=0; i < word.length; i++)
    results.push(word.slice(0, i) + word.slice(i+1));
  for (i=0; i < word.length-1; i++)
    results.push(word.slice(0, i) + word.slice(i+1, i+2) + word.slice(i, i+1) + word.slice(i+2));
  for (i=0; i < word.length; i++)
    speller.letters.forEach(function (l) {
      results.push(word.slice(0, i) + l + word.slice(i+1));
    });
  for (i=0; i <= word.length; i++)
    speller.letters.forEach(function (l) {
      results.push(word.slice(0, i) + l + word.slice(i));
    });
  return results;
};

//push wordlist in text , tokenize and clean it
 speller.cleantext = function (userdata,wordlist){
  var k;
  for(k = 0 ; k < userdata.length ; k++){
    wordlist[k] = userdata[k].message.toLowerCase();
    wordlist[k] =  wordlist[k].replace(/0/g, "o");
    wordlist[k] =  wordlist[k].replace(/1/g, "i");
    wordlist[k] =  wordlist[k].replace(/3/g, "e");
    wordlist[k] =  wordlist[k].replace(/4/g, "a");
    wordlist[k] =  wordlist[k].replace(/5/g, "s");
    wordlist[k] =  wordlist[k].replace(/7/g, "t");
    wordlist[k] =  wordlist[k].replace("+", "t");
    wordlist[k] =  wordlist[k].replace(/!/g, "i");
    wordlist[k] =  wordlist[k].replace(/_/g, " ");
    wordlist[k] =  wordlist[k].replace(/-/g, " ");
    wordlist[k] =  wordlist[k].replace(/'/g, " ");
  }
}

  //clean text only one words
  speller.cleantextonlyonewords = function (word){
    word = word.replace(/0/g, "o");
    word = word.replace(/1/g, "i");
    word = word.replace(/3/g, "e");
    word = word.replace(/4/g, "a");
    word = word.replace(/5/g, "s");
    word = word.replace(/7/g, "t");
    word = word.replace("+", "t");
    word = word.replace(/!/g, "i");
    word = word.replace(/_/g, " ");
    word = word.replace(/-/g, " ");
    word = word.replace(/'/g, " ");
    console.log(word);
  }

//check if word after correction in reflist : plus attempt to 
speller.countattempt = function(list_sentence,wordlist){
  var i ;
  var ii;
  for(i = 0 ; i < wordlist.length ; i++){
    list_sentence = wordlist[i].split(" ");
    for(ii = 0 ; ii < list_sentence.length ; ii++){
        if(reflist.includes(speller.correct(list_sentence[ii]))){
          userdata[i].attempt = 1;
        }else userdata[i].attempt = 0;
      console.log(speller.correct(list_sentence[ii]));
    }
    console.log(userdata[i]);
  } 
}

speller.countattempttest = function(wordlist,detected){
  var list_sentence =[];
  var ii;
    list_sentence = wordlist.split(" ");
    for(ii = 0 ; ii < list_sentence.length ; ii++){
        if(reflist.includes(speller.correct(list_sentence[ii]))){
          detected.iscaught = true;
          console.log(speller.correct(list_sentence[ii]))
          break;
        }
    }
    console.log(detected);
}


speller.countattempttest2 = function(wordlist){
  var list_sentence =[];
  var ii;
    list_sentence = wordlist.split(" ");
    for(ii = 0 ; ii < list_sentence.length ; ii++){
        if(reflist.includes(speller.correct(list_sentence[ii]))){
          console.log("1");
          console.log(speller.correct(list_sentence[ii]))
          break;
        }
    }
}

speller.makefuzzy = function (userdata,wordlist){
  var k;
  for(k = 0 ; k < userdata.length ; k++){
    wordlist[k] = userdata[k].message.toLowerCase();
    wordlist[k] =  wordlist[k].replace(/o/g, "0");
    wordlist[k] =  wordlist[k].replace(/i/g, "1");
    wordlist[k] =  wordlist[k].replace(/e/g, "3");
    wordlist[k] =  wordlist[k].replace(/a/g, "4");
    wordlist[k] =  wordlist[k].replace(/s/g, "5");
    wordlist[k] =  wordlist[k].replace(/t/g, "7");
    wordlist[k] =  wordlist[k].replace(/i/g, "!");
    wordlist[k] =  wordlist[k].replace(/_/g, " ");
    wordlist[k] =  wordlist[k].replace(/-/g, " ");
    wordlist[k] =  wordlist[k].replace(/'/g, " ");
  }
}

speller.countattemptresult = function(list_sentence,wordlist){
  var i ;
  var ii;
  var countresult = 0;
  for(i = 0 ; i < wordlist.length ; i++){
    list_sentence = wordlist[i].split(" ");
    for(ii = 0 ; ii < list_sentence.length ; ii++){
        if(reflist.includes(speller.correct(list_sentence[ii]))){
          countresult++;
          console.log({"detected number": i, "word_detect": speller.correct(list_sentence[ii])});
          break;
        }else countresult = countresult;
    }

  } 
console.log(countresult);
}


module.exports =  {speller};
