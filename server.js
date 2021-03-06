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
//note: passwords currently have no security
app.post('/newuser', function(req,res,next){
	//construct a new user based on info from form
	var enteredUser = {
		email: req.body.email,			//string
		password: req.body.password,	//string
		fullname: req.body.fullname,	//string
		mlsaved: "0"						//int
	};

	//check if user exists in databases
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
		//send back a successful status
		res.send({
			status: 1
		})
		res.end();
	}
	else if(existing == 1){
		console.log("user already exists");
		//send back a failiure status
		res.send({
			status: 0
		})
		res.end();
	}
	else{
		//code SHOULD NOT get to this point
		console.log("something went wrong with user check");
		console.log("existing is: " + existing);
		//send back a failiure status
		res.send({
			status: 0
		})
		res.end();
	}
};

//when an existing user logs in
app.post('/login',function(req,res,next){
	var enteredUser = {
		email: req.body.email,
		password: req.body.password
	};

	//find how many users with this username and password exist
	var existing = users.find(enteredUser).count().then(function(login){
		console.log("checking if user exists for login");
		existing = login;
		loginCheck(req,res,next,existing,enteredUser);
	});

});

//deal with whether the user exists or not
function loginCheck(req,res,next,existing,enteredUser){
	if(existing == 1){
		console.log("valid user has logged in");
		var tempuser;
		//send back the logged in user
		users.findOne(enteredUser).then(function(loadeduser){
			tempuser = loadeduser;
			loadThisThing(req,res,next,tempuser);
		});
	}
	else if(existing == 0){
		console.log("user does not exist");
		//send back a success status
		res.send({
			status: 0
		})
		res.end();
	}
	else{
		//code should not get to this point
		console.log("something went wrong with user check");
		console.log("existing is: " + existing);
		res.end();
	}

}

//updating ml saved
app.post('/mlsaved', function(req,res,next){
	var toSearchfor = { "fullname": req.body.name1 };
	var toSet = { $set: { "mlsaved" : req.body.mlsaved } };

	users.update(toSearchfor,toSet,function(err,res){
		if(err) throw err;
		console.log("user ml saved");
	});
	//send back nothing
	res.end();
});



//for testing only:
//view all users
app.get('/displayall', function(req,res,next){
	var userArray;
	users.find({}).toArray().then(function(tempArray){
    userArray = tempArray;
    loadThisThing(req,res,next,userArray);
  });
});

//viewing leaderboard of top 10 players
app.get('/leaderboard', function(req,res,next){
	var userArray;
	users.find({}).toArray().then(function(tempArray){
    userArray = tempArray;
    sortLeaderboard(req,res,next,userArray);
  });
});

//sorting and sending the sorted leaderboard of top 10 player
//warning: this sorting algorithm is stupidly inefficient,
//but it's a hackathon so gotta go fast
function sortLeaderboard(req,res,next,userArray){
	var leaderboard = {
		user0: "No user",
		user1: "No user",
		user2: "No user",
		user3: "No user",
		user4: "No user",
		score0: "0",
		score1: "0",
		score2: "0",
		score3: "0",
		score4: "0"
	}
	var count = 0;
	while(userArray.length > 0 && count<5){
		var max = 0;
		var indexToRemove = -1;
		var userString = "No User";
		var userScore = "0";
		for (var i = 0; i < userArray.length; i++){
			if (max <= parseInt(userArray[i].mlsaved,10)){
				max = userArray[i].mlsaved;
				userString = userArray[i].fullname;
				userScore = userArray[i].mlsaved;
				indexToRemove = i;
			}
		}
		if (indexToRemove != -1){
			userArray.splice(indexToRemove,1);
		}
		var toInsert = "user" + count;
		leaderboard[toInsert] = userString;
		toInsert = "score" + count;
		leaderboard[toInsert] = userScore;
		count++;
	}
	console.log(leaderboard);
	res.send(leaderboard);
	res.end();
};




//sends whatever object(toLoad) is passed through this function
function loadThisThing(req,res,next,toLoad){
  console.log(toLoad);
  console.log("above object loaded");
  res.send(toLoad);
  res.end();
}


//dealing with 404 page (not needed for final version)
app.use(function (req, res, next) {
  res.status(404).send("Error!");
});


http.createServer(app).listen(port);
console.log('running on port',port);