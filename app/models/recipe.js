var mongoose = require('mongoose');
var RecipeSchema = new mongoose.Schema({
    name: String,
    postedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    ingredients: [{
        in_name: String,
        measurement: String,
        amount: String
    }]
});

// return the model
module.exports = mongoose.model('Recipe', RecipeSchema);


