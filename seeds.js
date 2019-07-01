var mongoose = require("mongoose");
var Recipe = require("./models/recipe");
var Comment   = require("./models/comment");

var data = [
    {
        name: "Fried Noodle",
        image: "https://www.daringgourmet.com/wp-content/uploads/2013/01/Shanghai-Noodles-6-sm.jpg",
        description: "Fried noodles are common throughout East and Southeast Asia. Many varieties, cooking styles, and ingredients exist."
    },
    {
        name: "Mac n Cheese",
        image: "https://images-gmi-pmc.edge-generalmills.com/0d175828-384a-44eb-abbb-0500c07cf397.jpg",
        description: "This baked mac and cheese is a family favorite recipe, loved by children and adults. My version uses a combination of cheeses for a gloriously cheesy dish!"
    },
    {
        name: "Chocolate Brownie",
        image: "https://images-gmi-pmc.edge-generalmills.com/d48f476f-ab97-4edf-8d5b-d617e5f261d0.jpg",
        description: "A chocolate brownie is a square, baked, chocolate dessert. Brownies come in a variety of forms and may be either fudgy or cakey, depending on their density. They may include nuts, frosting, cream cheese, chocolate chips, or other ingredients."
    }
];

function seedDB(){
   //Remove all recipes
   Recipe.remove({}, function(err){
        if(err){
            console.log(err);
        }
        console.log("removed recipes!");
         //add a few recipes
        data.forEach(function(seed){
            Recipe.create(seed, function(err, recipe){
                if(err){
                    console.log(err)
                } else {
                    console.log("added a recipe");
                    //create a comment
                    Comment.create(
                        {
                            text: "This is so delicious!",
                            author: "Homer"
                        }, function(err, comment){
                            if(err){
                                console.log(err);
                            } else {
                                recipe.comments.concat(comment);
                                recipe.save();
                                console.log("Created new comment");
                            }
                        });
                }
            });
        });
    }); 
    //add a few comments
}

module.exports = seedDB;
