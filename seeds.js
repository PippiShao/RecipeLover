var mongoose = require("mongoose");
var Recipe = require("./models/recipe");
var Comment   = require("./models/comment");

var data = [
    {
        name: "Fried Noodle",
        image: "https://www.daringgourmet.com/wp-content/uploads/2013/01/Shanghai-Noodles-6-sm.jpg",
        description: "Boil ramen noodles for 3 minutes, or until softened, without flavor packets. Reserve flavor packets. Drain noodles, and set aside.\n" +
            "Heat 1 tablespoon oil in a small skillet. Scramble eggs in a bowl. Cook and stir in hot oil until firm. Set aside.\n" +
            "In a separate skillet, heat 1 teaspoon of oil over medium heat. Cook and stir green onions in oil for 2 to 3 minutes, or until softened. Transfer to a separate dish, and set aside. Heat another teaspoon of cooking oil in the same skillet. Cook and stir the the carrots, peas, and bell peppers separately in the same manner, setting each aside when done.\n" +
            "Combine 2 tablespoons sesame oil with 1 tablespoon of vegetable oil in a separate skillet or wok. Fry noodles in oil for 3 to 5 minutes over medium heat, turning regularly. Sprinkle soy sauce, sesame oil, and desired amount of reserved ramen seasoning packets over noodles, and toss to coat. Add vegetables, and continue cooking, turning frequently, for another 5 minutes.\n",
        ingredient: ["ramen noodle", "eggs", "vegetable oil", "green onions", "carrot", "green peas", "bell pepper", "sesame oil", "soy sauce"]
    },
    {
        name: "Mac n Cheese",
        image: "https://images-gmi-pmc.edge-generalmills.com/0d175828-384a-44eb-abbb-0500c07cf397.jpg",
        description: "Bring a large pot of lightly salted water to a boil. Cook elbow macaroni in the boiling water, stirring occasionally until cooked through but firm to the bite, 8 minutes. Drain.\n" +
            "Melt butter in a saucepan over medium heat; stir in flour, salt, and pepper until smooth, about 5 minutes. Slowly pour milk into butter-flour mixture while continuously stirring until mixture is smooth and bubbling, about 5 minutes. Add Cheddar cheese to milk mixture and stir until cheese is melted, 2 to 4 minutes.\n" +
            "Fold macaroni into cheese sauce until coated.",
        ingredient: ["macaroni", "butter", "all-purpose flour", "salt & pepper", "milk", "cheddar cheese"]
    },
    {
        name: "Chocolate Brownie",
        image: "https://images-gmi-pmc.edge-generalmills.com/d48f476f-ab97-4edf-8d5b-d617e5f261d0.jpg",
        description: "Preheat oven to 350 degrees F (175 degrees C). Grease and flour an 8-inch square pan.\n" +
            "In a large saucepan, melt 1/2 cup butter. Remove from heat, and stir in sugar, eggs, and 1 teaspoon vanilla. Beat in 1/3 cup cocoa, 1/2 cup flour, salt, and baking powder. Spread batter into prepared pan.\n" +
            "Bake in preheated oven for 25 to 30 minutes. Do not overcook.\n" +
            "To Make Frosting: Combine 3 tablespoons softened butter, 3 tablespoons cocoa, honey, 1 teaspoon vanilla extract, and 1 cup confectioners' sugar. Stir until smooth. Frost brownies while they are still warm.",
        ingredient: ["butter", "sugar", "eggs", "cocoa powder", "all-purpose flour", "baking powder"]
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
