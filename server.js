
// load the express package and create our app
var express = require('express');
var app 	= express();
var path 	= require('path');
// body parser allows us to pull post content?
// app.body use the body parser
var bodyParser = require('body-parser');
var mongoose = require('mongoose');

// for local testing
//mongoose.connect('mongodb://localhost/test');

// connect to the database at mongolab.
// mongoose.connect('put the database location infor here');

// Test for a successful connection
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
	console.log('connected successfully');
});

//body parser
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json());

app.use(function(req, res, next) {
	//not entirely confident on these since they are bring up undefined but from the book
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
	next();
});

// grab our index homepage
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/index.html'));
});

// get all the movies in the database collection
var apiRouter = express.Router();

apiRouter.use(function(req, res, next){
	// logging
	console.log('Someone is visiting the movie api');
	next();
});
apiRouter.get('/', function( req, res){
	res.json({message: "Hello"});
});

// start the server
app.listen(1337);
console.log('1337 is the magic port!');