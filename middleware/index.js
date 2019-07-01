var Recipe = require("../models/recipe");
var Comment = require("../models/comment");

// all the middleware goes here
var middlewareObj = {};

middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to login first.");
    res.redirect("/login");
}

middlewareObj.checkRecipeOwnership = function(req, res, next) {
 if(req.isAuthenticated()){
     Recipe.findById(req.params.id, function(err, foundRecipe){
           if(err){
               req.flash("error", "Recipe not found");
               res.redirect("back");
           }  else {
               // does user own the recipe?
            if(foundRecipe.author.id.equals(req.user._id)) {
                next();
            } else {
                req.flash("error", "You don't have permission.");
                res.redirect("back");
            }
           }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
}

middlewareObj.checkCommentOwnership = function(req, res, next) {
 if(req.isAuthenticated()){
        Comment.findById(req.params.comment_id, function(err, foundComment){
           if(err){
               res.redirect("back");
           }  else {
               // does user own the comment?
            if(foundComment.author.id.equals(req.user._id)) {
                next();
            } else {
                req.flash("error", "You don't have permission.");
                res.redirect("back");
            }
           }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
}


module.exports = middlewareObj;
