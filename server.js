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
mongoose.connect('mongodb://Amanda:WebAPI3800@ds117311.mlab.com:17311/pantry');

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, PUT');
    next();
});
//console logging
app.use(morgan('dev'));

// grab our index homepage
app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});

var apiRouter = express.Router();

apiRouter.route('/recipes')
//returns all the recipes, no need to login
    .get(function(req, res){
        Recipe.find(function(err, recipes){
            if(err) res.send(err);

            res.json(recipes);
        });
    });


// *************************************************************************************************************
//	Kelsey's section
// *************************************************************************************************************

// both of these search functions work in exactly the same way
// these will search for a recipe/ingredient with any part of the search string matching
// the searched for string should be located in the query parameters

apiRouter.route('/search/recipes')
    .get(function(req, res){
        Recipe.find(
            { "title": { $regex: req.query.name, $options: 'i' }  },
            function(err, found){
                if(err) return res.send(err);
                res.json(found);
            }
        )
    });

apiRouter.route('/search/ingredients')
    .get(function(req, res){
        Recipe.find(
            { "ingredients": { $regex: req.query.name, $options: 'i' } },
            function(err, found){
                if(err) return res.send(err);
                res.json(found);
            }
        )
    });

apiRouter.route('/search/recipes_by_user')
    .get(function(req, res){
        Recipe.find(
            { "postedBy": req.query.name },
            function(err, found){
                if(err) return res.send(err);
                res.json(found);
            }
        )
    });


// For testing purposes only - take out of final project ----------------------------------------------------

// This is so I can add and test stuff without messing with being a user

apiRouter.route('/recipes/:recipe_id')
//returns the recipe by id
    .get(function(req, res){
        Recipe.find({
            _id: req.params.recipe_id
        }, (function(err, recipes){
            if(err) return res.send(err);

            res.json(recipes);
        }));
    })

    .delete(function (req, res) {
        Recipe.remove({
            _id: req.params.recipe_id
        }, function(err, recipe){
            if (err) return res.send(err);

            res.json({message: 'Successfully deleted'});
        });
    });

// this is the same as the one in the users section - just a function here
// so I can add a recipe without being a user
apiRouter.route('/recipes')
    .post(function(req, res, next){
        var recipe = new Recipe({
            title: req.body.title,
            postedBy: "Dev",
            ingredients: req.body.ingredient,
            direction: req.body.direction
        });
        recipe.save(function(err){
            if (err) res.json(err);
            else res.json({ message: 'Recipe created!'});
        });
    });


// For testing purposes only - take out of final project ----------------------------------------------------

// Kelsey - deleted a block here that was a repeat of some code below

// *************************************************************************************************************
// End Kelsey's section
// *************************************************************************************************************




//*************************************************************************************************************
// Amanda Added here
//************************************************************************************************************

// enter user routes from here down
// Path to join the api, enters user in user database
apiRouter.post('/users', (function(req, res) {
    var user = new User;

    user.name = req.body.name;
    user.username = req.body.username;
    user.password = req.body.password;
    user.email = req.body.email;

    user.save(function (err) {
        if (err) {
            //duplicate entry
            if (err.code == 11000)
                return res.json({success: false, message: "That username or email is in use"});
            else
                return res.send(err);
        }
        res.json({message: 'User created!'})
    })
}));
//returns all the users
apiRouter.get('/users', function(req, res){
    User.find(function(err, users){
        if(err) res.send(err);

        res.json(users);
    });
});

// our authentication route that user will go through in order to access their page
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
                res.json({ success: true, message: 'Access granted', token: token, username: req.body.username});
            }
        }
    });
});

apiRouter.use(function(req, res, next) {
    // logging
    console.log('Someone is visiting');
    // route middleware to verify a token
    //apiRouter.use(function (req, res, next) {
    // check header or url parameters or post parameters for token
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    // decode token
    if (token) {
        // verifies secret and checks exp
        jwt.verify(token, superSecret, function (err, decoded) {
            if (err) {
                return res.status(403).send({
                    success: false,
                    message: 'Failed to authenticate token.'
                });
            } else {
                // if everything is good, save to request for use in other routes
                req.decoded = decoded;
                next();
            }
        });
    } else {
        // if there is no token
        // return an HTTP response of 403 (access forbidden) and an error message
        return res.status(403).send({
            success: false,
            message: 'No token provided.'
        });
    }
});
// these routes are register user only
apiRouter.route('/user_recipes')
// User posts a single recipe to the database
    .post(function(req, res, next){
        var recipe = new Recipe({
            title: req.body.title,
            postedBy: req.headers['username'],
            // Made some changes for testing, couldn't get ref to work so chaining username from login

            // edited by kelsey
            ingredients: req.body.ingredient,

            direction: req.body.direction
        });
        recipe.save(function(err){
            if (err) res.json(err);
            else res.json({ message: 'Recipe created!'});
        });
    })
    .get(function (req, res){
        console.log('here');
        Recipe.find({postedBy: req.headers['username']}, 'title postedBy ingredients direction', function (err, data){
            if (err)
                res.send(err);
            else if (!data)
                return res.send({message: 'No recipes found'});
            else
                res.json(data);

        });
    })
    // update a user's recipe

    // this function needs some love
    .put(function (req, res) {

        // use the user model to find the user we want
        Recipe.findOne({title: req.body.recipe_name}, function (err, recipe) {
                recipe.ingredient = req.body.ingredient;
            if (recipe.direction != req.body.direction)
                recipe.direction = req.body.direction;
            recipe.save(function (err) {
                if (err) res.send(err);

                // return a message
                res.json({message: 'The Recipe was updated!'});
            });
        })
    })
    // User deletes a single recipe in the database
    // kelsey - not sure what's going on with this function //Fixed: .remove wasn't a function
    .delete(function (req, res) {
         Recipe.findOneAndRemove({title: req.body.recipe_name}, function(err) {
             if (err)
                 return res.send({message: 'not deleted, who knows why. database demons, probably'});
             res.json({message: 'Successfully deleted by Name'});
         })
   });


//using base path
app.use('/', apiRouter);
// start the server
app.listen(1337);
console.log('1337 is the magic port!');