var http = require('http');
var express = require('express');
var path = require('path');
var MongoClient = require('mongodb').MongoClient;

var app = express();
var port = process.env.PORT || 3000;

var dburl = "mongodb://admin:a12345@ds052837.mlab.com:52837/vanhacksjagms";
var database;
var users;
var postings;
var stats;
MongoClient.connect(dburl, function(err, client){
  if (err) console.log(err);
  console.log('database connected');
  database = client.db('vanhacksjagms'); 
  users = database.collection('solomon'); 
});

app.use(express.json());
app.use(express.urlencoded( { extended:false} ));

var options = {
  dotfiles: 'ignore',
  etag: false,
  extensions: ['htm','html'],
  index: "index.html"
}

//viewing the request in console
app.use('/', function(req,res,next){
  console.log(req.method, 'request:', req.url, JSON.stringify(req.body));
  next();
});

app.use(express.json());

//for testing only:
//view all users
app.get('/displayall', function(req,res,next){
  var userArray;
  users.find({}).toArray()
  .then(function(tempArray){
    userArray = tempArray;
    loadThisThing(req,res,next,userArray);
  });
});


//sends whatever object(toLoad) is passed through this function
function loadThisThing(req,res,next,toLoad){
  console.log(toLoad);
  console.log("above object loaded");
  res.send(toLoad);
  res.end();
}


//dealing with 404 page
app.use(function (req, res, next) {
  res.status(404).send("Error!");
});


http.createServer(app).listen(port);
console.log('running on port',port);