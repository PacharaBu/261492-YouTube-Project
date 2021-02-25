const { Console } = require('console');
const fs = require('fs');
const userdata = require('../YouTubeAPI/all_message.json');

const Dig = fs.readFileSync('Dig.txt', 'utf-8');
const bdk = fs.readFileSync('bdk.txt', 'utf-8'); 
const BDK = bdk.split("\n");

// Norvig Spellchecker Part
var speller = {};
speller.train = function (text) {
  var m;
  re = RegExp('[a-z]+', 'g');
  text = text.toLowerCase();
  while ((m = re.exec(text)) !== null) {
    //console.log(m[0]);
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

// train Data from Dig.txt
speller.train(Dig);

//push wordlist in text , tokenize and clean it
var k;
const wordlist = [];
for(k = 0 ; k < userdata.length ; k++){
  wordlist[k] = userdata[k].message.toLowerCase();
  wordlist[k] =  wordlist[k].replace("0", "o");
  wordlist[k] =  wordlist[k].replace("1", "i");
  wordlist[k] =  wordlist[k].replace("3", "e");
  wordlist[k] =  wordlist[k].replace("4", "a");
  wordlist[k] =  wordlist[k].replace("5", "s");
  wordlist[k] =  wordlist[k].replace("7", "t");
  wordlist[k] =  wordlist[k].replace("+", "t");
  wordlist[k] =  wordlist[k].replace("!", "t");
  wordlist[k] =  wordlist[k].replace("_", " ");
  wordlist[k] =  wordlist[k].replace("-", " ");
  wordlist[k] =  wordlist[k].replace("'", " ");
}

// store reference list from file bdk.txt
var j;
const reflist = [];
for(j = 0 ; j < BDK.length ; j++){
  BDK[j] = BDK[j].replace("\r","");
  reflist.push(BDK[j]);
}

//check if word after correction in reflist : plus attempt to user
var i ;
var ii;
var list_sentence = [];
for(i = 0 ; i < wordlist.length ; i++){
  list_sentence = wordlist[i].split(" ");
  for(ii = 0 ; ii < list_sentence.length ; ii++){
      console.log(speller.correct(list_sentence[ii]));
      if(reflist.includes(speller.correct(list_sentence[ii]))){
        userdata[i].attempt = 1;
      }
  }
} 
//console.log(userdata);
//save file 
fs.writeFileSync('usertest.json',JSON.stringify(userdata));

module.exports = speller;
