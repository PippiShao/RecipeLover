var mongoose = require("mongoose");
mongoose.plugin(schema => { schema.options.usePushEach = true });
var recipeSchema = new mongoose.Schema({
   name: String,
   image: String,
   date_created: String,
   rating_avg: String,
   description: String,
   ingredient: [String],
   author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      username: String
   },
   comments: [
      {
         type: mongoose.Schema.Types.ObjectId,
         ref: "Comment"
      },
   ]
});

module.exports = mongoose.model("Recipe", recipeSchema);