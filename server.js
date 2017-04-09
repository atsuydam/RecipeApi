
// load the express package and create our app
var express = require('express');
var app 	= express();
var path 	= require('path');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var morgan = require('morgan');
var jwt = require('jsonwebtoken'); // for user authentication
//HEADS UP about where you ahve these on your local machine change accordingly, mine are a few files down.
var Recipe = require('./app/models/recipe');
var User = require('./app/models/USER')
var superSecret = 'iwishihadapersonalchef'; // for our jwt
// connect to the database at mongolab.
 mongoose.connect('mongodb://AwesomeAmanda:dave4275@ds143980.mlab.com:43980/movies');

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
//console logging
app.use(morgan('dev'));

// grab our index homepage
app.get('/', function(req, res) {
	res.sendFile(path.join(__dirname + '/index.html'));
});

var apiRouter = express.Router();

// a console notification that all is working
apiRouter.use(function(req, res, next){
	// logging
	console.log('Someone is visiting');
	next();
});

//*************************************************************************************************************
// Amanda Added here
//************************************************************************************************************

// enter user routes from here down

// our authentication route that user will go through in order to access their page
// to check token on user only pages look at code on page 102 of mean machines
apiRouter.post('/login', function(req, res) {
    User.findOne({username: req.body.username}, 'name username password', function(err, user){
        if (err) throw err;
        if (!user) {
            res.json({ success: false, message: 'authentication failed: user not found'});
        } else if (user) {
            var validPassword = user.comparePassword(req.body.password);
            if (!validPassword) {
                res.json({ success: false, message: "Authentication failed: Wrong password"});
            } else {
                var token = jwt.sign({
                    name: user.name,
                    username: user.username}, superSecret, { expiresIn: '72h' //three days
                    });
                res.json({ success: true, message: 'Access granted', token: token});
            }
        }
    });
    });
// Path to join the api, enters user in user database
apiRouter.route('/users')
	.post(function(req, res){
		var user = new User;

		user.name = req.body.name;
		user.username = req.body.username;
		user.password = req.body.password;
		user.email = req.body.email;

		user.save(function(err) {
			if (err) {
				//duplicate entry
				if (err.code == 11000)
					return res.json({ success: false, message: "That username or email is in use"});
				else
					return res.send(err);
			}
			res.json({ message: 'User created!'})
		});

	})
//****************************************************************************************************************
// grabbed from Kelsey
//returns all the users
.get(function(req, res){
    User.find(function(err, users){
        if(err) res.send(err);

        res.json(users);
    });
});


apiRouter.route('/recipes')

// makes a single recipe
    .post(function(req, res){

        var recipe = new Recipe({
            name: req.body.name,
            //postedBy: user._id,
            ingredients: [{
                in_name: req.body.ingredient,
                measurement: req.body.measurement,
                amount: req.body.amount
            }]
        });

        recipe.save(function(err){
            if (err) res.json(err);
            else res.json({ message: 'Recipe created!'});
        });
    })

    //returns all the recipes
    .get(function(req, res){
        Recipe.find(function(err, recipes){
            if(err) res.send(err);

            res.json(recipes);
        });
    });

apiRouter.route('/recipes/:recipe_id')

// deletes a recipe by id
    .delete(function (req, res) {
        Recipe.remove({
            _id: req.params.recipe_id
        }, function(err, movie){
            if (err) return res.send(err);

            res.json({message: 'Successfully deleted'});
        });
    });
//using base path
app.use('/', apiRouter);
// start the server
app.listen(1337);
console.log('1337 is the magic port!');