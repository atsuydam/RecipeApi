var mongoose = require('mongoose');
var RecipeSchema = new mongoose.Schema({
    title: {type: String, required: true, unique: true }, // Kelsey: made unique names a requirement
    postedBy: String,
    ingredients: { type: Array, min: 3, max: 10 },
    direction: {type: String, required: true} // changed by kelsey - should this be an array or single value?
});

// return the model
module.exports = mongoose.model('Recipe', RecipeSchema);
