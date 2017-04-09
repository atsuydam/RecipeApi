// schemas for out recipes and users here

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var UserSchema = new Schema({
    name : { type : String},
    username : { type: String, required: true, index: { unique: true}},
    // the stored password will be hashed
    password : { type: String, required: true },
    // no duplicate email addresses
    email : { type: String, required: true, index: { unique: true}}
});

UserSchema.pre('save', function(next){
    var user = this;
    if(!user.isModified('password')) return next();
    bcrypt.hash(user.password, null, null, function(err, hash) {
        if (err) return next(err);
        // change the password to hashed version
        user.password = hash;
        next();
    });
});

UserSchema.methods.comparePassword = function(password) {
    var user = this;
    return bcrypt.compareSync(password, user.password);
};

module.exports = mongoose.model('Users', UserSchema);