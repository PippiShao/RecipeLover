var mongoose = require("mongoose");
mongoose.plugin(schema => { schema.options.usePushEach = true });

var commentSchema = mongoose.Schema({
    title:String,
    text:String,
    rating_value: String,
    date: String,
    upvotes : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    downvotes : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],
    author: {
        id: {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
        username: String
    }
});

module.exports = mongoose.model("Comment",commentSchema);