var mongoose = require('mongoose');
var RecipeSchema = new mongoose.Schema({
    title: String,
    postedBy: String,
    ingredients: [{
        in_name: String,
        measurement: String,
        // amount really should be Number data but I'm getting a cast value issue in postman
        amount: String
    }]
});

// return the model
module.exports = mongoose.model('Recipe', RecipeSchema);


