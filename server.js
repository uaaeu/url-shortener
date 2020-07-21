'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
const bodyParser = require("body-parser");

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});

let urlSchema = new mongoose.Schema({
  original: {type: String, required: true },
  short: {type: Number}
})

let url = mongoose.model('Url', urlSchema);

let resObj = {};

app.post('/api/shorturl/new', bodyParser.urlencoded({ extended: false }), (req,res)=>{
  
  let inputUrl = req.body.url
  
  const regex = new RegExp(/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi);
  
  if(!inputUrl.match(regex)){
    res.json({ error:"Invalid URL"})
    return;
  }
  
  resObj["original_url"] = inputUrl;
  
  let shortUrl = 1
  
  url.findOne({})
      .sort({short: 'desc'})
      .exec((err,result)=>{
        if(!err && result != undefined){
          shortUrl = result.short + 1;
        }
        if(!err){
          url.findOneAndUpdate(
            {original: inputUrl},
            {original: inputUrl, short: shortUrl},
            {new: true, upsert: true},
            (err, savedUrl)=>{
              if(!err){
                resObj["short_url"] = savedUrl.short
                res.json(resObj)
              }
            }
          )
        }
  })
})

app.get('/api/shorturl/:input', (req,res)=>{
  let input = req.params.input
  
  url.findOne({short: input}, (err,result)=>{
    if(!err && result != undefined){
      res.redirect(result.original)
    }else{
      res.json('URL not Found')
    }
  })
})