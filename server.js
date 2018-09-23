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

//upon registering a new user
app.post('/newuser', function(req,res,next){
	//construct a new user based on info from form
	var enteredUser = {
		email: req.body.email,
		password: req.body.password,
		fullname: req.body.fullname,
		mlsaved: 0
	};


	var existing = users.find({"email": req.body.email}).count().then(function(login){
		console.log("checking if user exists for registration");
		existing = login;
		existCheck(req,res,next,existing,enteredUser);
	});

});

function existCheck(req,res,next,existing,enteredUser){
	if (existing == 0){
		console.log("user not found, creating new user");
		users.insertOne(enteredUser, (err,result) => {
			if (err) console.log(err);
		});
		console.log("new user registered");
		res.send("passed");
		res.end();
	}
	else if(existing == 1){
		console.log("user already exists");
		res.send("failed");
		res.end();
	}
	else{
		console.log("something went wrong with user check");
		console.log("existing is: " + existing);
		res.end();
	}
};

//when an existing user logs in
app.post('/login',function(req,res,next){
	var enteredUser = {
		email: req.body.email,
		password: req.body.password
	};

	var existing = users.find(enteredUser).count().then(function(login){
		console.log("checking if user exists for login");
		existing = login;
		loginCheck(req,res,next,existing,enteredUser);
	});

});

function loginCheck(req,res,next,existing,enteredUser){
	if(existing == 1){
		console.log("valid user has logged in");
		res.end();
	}
	else if(existing == 0){
		console.log("user does not exist");
		res.end();
	}
	else{
		console.log("something went wrong with user check");
		console.log("existing is: " + existing);
		res.end();
	}

}

//updating ml saved
app.post('/mlsaved', function(req,res,next){
	var toSearchfor = { "email": req.body.email };
	var toSet = { $set: { "mlsaved" : req.body.mlsaved } };

	users.update(toSearchfor,toSet,function(err,res){
		if(err) throw err;
		console.log("user pref updated");
	});
});



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