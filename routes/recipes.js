var express = require("express");
var router  = express.Router({mergeParams : true});
var cloudinary = require('cloudinary'); // for content modereation
var Recipe = require("../models/recipe");
var middleware = require("../middleware");

cloudinary.config({
    cloud_name: process.env.cloudinary_name,
    api_key: process.env.cloudinary_api_key,
    api_secret: process.env.cloudinary_api_secret
});

var getDate = function(){
    var monthNames = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        date = new Date,  day = date.getDate(), month = monthNames[ date.getMonth() ], year = date.getFullYear();
    return month+"/"+day+"/"+year;
};
var moderate_updated_image = function(recipeId, new_recipe, callback) {
    // find recipe and compare old img url with new url
    Recipe.findById(recipeId).exec(function(err,old_recipe) {
        if(err){
            req.flash("errorArr",err.message);
            res.redirect("/recipes");
        }
        else {
            // if change is detected, send it for moderation, and save changes to the original recipe
            if(old_recipe.image != new_recipe.image)
                moderate_image(new_recipe, function(moderated_recipe) {
                    callback(moderated_recipe);
                });
            else
                callback(new_recipe);
        }
    });
}

//INDEX - show all recipes
router.get("/", function(req, res){
    // Get all recipes from DB
    Recipe.find({}, function(err, allRecipes){
       if(err){
           console.log(err);
       } else {
          res.render("recipes/index",{recipes:allRecipes});
       }
    });
});

//NEW - show form to create new recipe
router.get("/new", middleware.isLoggedIn, function(req, res){
    res.render("recipes/new");
});


router.get("/:id",function(req,res) {
    //  populating comments and  upvotes and downvotes for each comment
    Recipe.findById(req.params.id).populate({
        path: 'comments',
        populate : {
            path : 'upvotes',
            model : 'User'}}).exec(function(err,foundRecipe) {
        if(err) {
            if (err.name && err.name == 'CastError') {
                if(err.message) console.log(err.message);
                console.log("Recipe not found!");
                res.status(404).send("Recipe not found!");
            }
            else {
                console.log(err);
                res.status(500).send("Sorry! an error occurred!");
            }
        } else if(!foundRecipe) {
            console.log("Recipe not found!");
            res.status(404).send("Recipe not found!");
        } else {
            //populate upvotes and downvotes in foundRecipe
            Recipe.populate(foundRecipe, {
                path: 'comments.downvotes',
                model: 'User',
            }, function(err, popRecipe) {
                if (err) {
                    console.log(err);
                    res.status(500).send("Sorry! an error occurred!");
                }
                else
                    res.render("recipes/show",{recipe : popRecipe});
            });
        }
    });
});


function moderate_image(recipe, callback) {
    if(recipe.image) {
        if(process.env.MODERATION_ENABLED === "true") {
            console.log("mod enabled");
            cloudinary.v2.uploader.upload( recipe.image, { moderation: "aws_rek" }, function(err, result) {
                if(err) {
                    console.log("Error while moderating image: ", err);
                    callback(recipe);
                } else {
                    console.log("Moderation result:", result);
                    if(result.moderation && result.moderation.length > 0) {
                        let verdict = result.moderation[0].status;
                        recipe.image_approved = verdict === "approved";
                        callback(recipe);
                    } else {
                        console.log("Wrong format of Moderation response.. Rejecting image..")
                        recipe.image_approved = false;
                        callback(recipe);
                    }
                }
            });
        } else {
            console.log("Moderation disabled! Image will be shown!");
            recipe.image_approved = true;
            callback(recipe);
        }
    } else {
        console.log("No image specified!");
        // remove "image_approved" key from recipe, so no need to display moderation result
        recipe.image_approved = false;
        callback(recipe);
    }
}

//CREATE - add new recipe to DB
router.post("/", middleware.isLoggedIn, function(req, res){
    // get data from form and add to recipes array
    var newRecipe = {
        name: req.body.name,
        image: req.body.image,
        description: req.body.description,
        ingredient: req.body.ingredient.split(/[,;\t\n]+/),
        author: {
            id: req.user._id,
            username: req.user.username
        },
        date_created: getDate(),
        rating_avg: "N/A"
    };
    if(newRecipe.image.length) {
        moderate_image(newRecipe, function(moderated_recipe) {
            Recipe.create(moderated_recipe ,function(err,recipe) {
                if(err) {
                    req.flash("errorArr",err.message);
                } else {
                    req.flash("successArr","New Campground added successfully! Awaiting image moderation..");
                    res.redirect("/recipes/"+recipe._id);
                }
            });
        });
    } else {
        // Create a new recipe and save to DB
        Recipe.create(newRecipe, function (err, newlyCreated) {
            if (err) {
                req.flash("error", err.message);
            } else {
                //redirect back to recipes page
                req.flash("success", "New recipe added! Waiting for image.");
                res.redirect("/recipes/" + newlyCreated._id);
            }
        });
    }
});

// SHOW - shows more info about one recipe
router.get("/:id", function(req, res) {
    //find the recipe with the provided ID, then populate the comments for that recipe,
    // then execute the query.
    Recipe.findById(req.params.id).populate("comments").exec(function(err, foundRecipe) {
        if (err) {
            console.log(err);
        } else {
            // render the show template with that campground
            res.render("recipes/show", {recipe: foundRecipe});
        }
    });
});
// EDIT RECIPE ROUTE
router.get("/:id/edit", middleware.checkRecipeOwnership, function(req, res){
    Recipe.findById(req.params.id, function(err, foundRecipe){
        res.render("recipes/edit", {recipe: foundRecipe});
    });
});

// UPDATE RECIPE ROUTE
router.put("/:id", function(req,res) {    // find and update the correct recipe
    moderate_updated_image(req.params.id, req.body.recipe, function(moderated_recipe) {
        Recipe.findByIdAndUpdate(req.params.id, moderated_recipe, function(err) {
            if(err) {
                req.flash("errorArr",err.message);
                res.redirect("/recipes");
            } else {  // redirect somewhere
                req.flash("success","Recipe Updated!");
                res.redirect("/recipes/"+req.params.id);
            }
        });
    });
});

// DESTROY RECIPE ROUTE
router.delete("/:id",middleware.checkRecipeOwnership, function(req, res){
    Recipe.findByIdAndRemove(req.params.id, function(err){
      if(err){
          res.redirect("/recipes");
      } else {
          req.flash("success","Recipe Deleted!");
          res.redirect("/recipes");
      }
   });
});

module.exports = router;

