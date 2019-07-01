var express = require("express");
var router  = express.Router({mergeParams: true});
var Recipe = require("../models/recipe");
var Comment = require("../models/comment");
var middleware = require("../middleware");

//Calculate rating function=================================================
var calculateAverageRating = function (comment) {
    if(comment.length==0) return 0.0;
    var sum=0.0 , avg = 0.0;
    for(var i=0; i<comment.length; i++) {
        // console.log(comment[i].rating_value);
        sum += parseFloat(comment[i].rating_value, 10);
    }
    // convert string to base 10 float
    avg  = sum / comment.length;
    avg = Math.round(avg*10)/10;
    return avg;
};
// save calculated average rating:
var saveAverageRating = function(req,res) {
    Recipe.findById(req.params.id).populate("comments").exec(function(err,recipe) {
        if(err){
            req.flash("error",err.message);	res.redirect("/recipes");
        } else {
            console.log(recipe.comments);
            var avg = calculateAverageRating(recipe.comments);
            recipe.rating_avg = avg;
            recipe.save(); // save all changes in current recipe
        }
    });
};
var searchId = function(arr,val) {
    for(var i=0;i<arr.length;i++) {
        if(arr[i].equals(val)) {
            return i;
        }
    }
    return -1;
}
var increaseUpvotes = function(req,res) {
    Comment.findById(req.params.comment_id).exec(function(err,comment) {
        if(err) {
            req.flash("error",err.message);	res.redirect("/recipes");
        } else {
            if(searchId(comment.upvotes,req.user._id)==-1) {
                // add user to that comment's upvotes list
                comment.upvotes = comment.upvotes.concat(req.user);
                // remove user from downvotes list, if they already downvoted the comment
                var index = searchId(comment.downvotes,req.user._id);
                if(index!=-1) comment.downvotes.splice(index,1);
                comment.save();
            }
        }
    });
};
var decreaseUpvotes = function(req,res) {
    Comment.findById(req.params.comment_id).exec(function(err,comment) {
        if(err){
            req.flash("error",err.message);	res.redirect("/recipes");	}
        else { // remove user from that comment's upvotes list
            var index = searchId(comment.upvotes,req.user._id);
            if(index!=-1) {
                comment.upvotes.splice(index,1);
                comment.save();
            }
        }
    });
};
var increaseDownvotes = function(req,res) {
    Comment.findById(req.params.comment_id).exec(function(err,comment) {
        if(err){
            req.flash("error",err.message);
            res.redirect("/recipes");
        } else {
            if(searchId(comment.downvotes,req.user._id)==-1) {
                // add user to that comment's downvotes list
                comment.downvotes = comment.downvotes.concat(req.user);
                // remove user from upvotes list, if they already upvoted the comment
                var index = searchId(comment.upvotes,req.user._id);
                if(index!=-1)
                    comment.upvotes.splice(index,1);
                comment.save();
            }
        }
    });
};
var decreaseDownvotes = function(req,res) {
    Comment.findById(req.params.comment_id).exec(function(err,comment) {
        if(err){
            req.flash("error",err.message);
            res.redirect("/recipes");
        } else {
            // remove user from that comment's downvotes list
            var index = searchId(comment.downvotes,req.user._id);
            if(index!=-1) {
                comment.downvotes.splice(index,1);
                comment.save();
            }
        }
    });
};
var getDate = function(){
    var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        date = new Date,  day = date.getDate(), month = monthNames[ date.getMonth() ], year = date.getFullYear();
    return month+"/"+day+"/"+year;

};
//======================================================
//Comments New
router.get("/new",middleware.isLoggedIn, function(req, res){
    // find recipe by id
    Recipe.findById(req.params.id, function(err, recipe){
        if(err){
            req.flash("error",err.message);
            res.redirect("/recipes");
        } else {
            res.render("comments/new", {recipe: recipe});
        }
    })
});

//Comments Create
router.post("/", middleware.isLoggedIn ,function(req,res) {
    // find recipes by id and we have to populate with comments in order to calculate avg rating from all comments
    Recipe.findById( req.params.id ).populate("comments").exec( function(err,recipe) {
        if(err){
            req.flash("error",err.message);
            res.redirect("/recipes");
        } else {
            Comment.create(req.body.comment,function(err,comment) {
                if(err){
                    req.flash("errorArr",err.message);
                    res.redirect("/recipes");
                } else {
                    //add username ,id  and date to comment
                    comment.author.id = req.user._id;
                    comment.author.username = req.user.username;
                    comment.date = getDate();
                    //save comment
                    comment.save();
                    recipe.comments = recipe.comments.concat(comment); // add comment to array of comments in current campground
                    // average rating calculation
                    var avg = calculateAverageRating(recipe.comments);
                    console.log(comment);
                    recipe.rating_avg = avg;
                    recipe.save(); // save all changes in current recipe
                    req.flash("successArr","Comment Added!");
                    res.redirect('/recipes/' + recipe._id);  // redirect after saving
                }
            });
        }
    });
});

// COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, function(req, res){
   Comment.findById(req.params.comment_id, function(err, foundComment){
      if(err){
          req.flash('error', err.message);
          res.redirect("back");
      } else {
        res.render("comments/edit", {recipe_id: req.params.id, comment: foundComment});
      }
   });
});

// COMMENT UPDATE
router.post("/:comment_id", middleware.checkCommentOwnership, function(req, res){    // put//post
   Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
      if(err){
          req.flash('error', err.message);
          res.redirect("back");
      } else {
          req.flash('success', "Comment updated");
          saveAverageRating(req, res);
          res.redirect("/recipes/" + req.params.id );
      }
   });
});

//  comment upvote and downvote
router.post("/:comment_id/upvote",middleware.isLoggedIn,function(req,res) {
    increaseUpvotes(req, res);
    res.redirect("/recipes/"+req.params.id);
});
router.post("/:comment_id/downvote",middleware.isLoggedIn,function(req,res) {
    increaseDownvotes(req, res);
    res.redirect("/recipes/"+req.params.id);
});
router.post("/:comment_id/undoupvote",middleware.isLoggedIn,function(req,res) {
    decreaseUpvotes(req, res);
    res.redirect("/recipes/"+req.params.id);
});
router.post("/:comment_id/undodownvote",middleware.isLoggedIn,function(req,res) {
    decreaseDownvotes(req, res);
    res.redirect("/recipes/"+req.params.id);
});

// COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, function(req, res){
    //findByIdAndRemove
    Comment.findByIdAndRemove(req.params.comment_id, function(err){
       if(err){
           req.flash('error', err.message);
           res.redirect("back");
       } else {
           req.flash("success", "Comment deleted");
           saveAverageRating(req,res);
           res.redirect("/recipes/" + req.params.id);
       }
    });
});

module.exports = router;