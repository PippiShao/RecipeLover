var mongoose = require("mongoose");
mongoose.plugin(schema => { schema.options.usePushEach = true });
var passportLocalMongoose = require("passport-local-mongoose");

var userSchema = new mongoose.Schema({
    username: String,
    email: String,
    password: String,
    resetPasswordToken:Object,
    resetPasswordExpires:Object,
});

userSchema.plugin(passportLocalMongoose);
module.exports = mongoose.model("User", userSchema);