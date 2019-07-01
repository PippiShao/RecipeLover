var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var Recipe = require("../models/recipe");
var middleware = require("../middleware");
var bcrypt = require('bcrypt-nodejs'),
    async = require('async'),
    crypto = require('crypto');
var helper = require('sendgrid').mail;

var getRatings=function(req,res) {
    Recipes.find().exec(function(err,foundRecipes)
    {
        if(err)
        {
            req.flash("error",err.message);
            res.redirect("/");
        }
        else
        {
            for(var i=0;i<foundRecipes.length;i++)
                if(foundRecipes[i].rating_avg=="N/A")
                    foundRecipes[i].rating_avg = -1;
            foundRecipes.sort(function(a, b) {
                return parseFloat(b.rating_avg,10) - parseFloat(a.rating_avg,10);
            });
            var s = foundRecipes;
            return s;
        }
    });
} ;

// ROOT ROUTE
router.get('/', (req, res) => res.render('landing'));

//ABOUT
router.get("/about", function(req, res) {
    res.render("about");
});

//FAVORITES
router.get("/favorites",function(req,res) {
    var recipeArr = getratings(req,res);
    res.render("favorites",{recipes : recipeArr});
});

router.get("/profiles/:username",function(req,res) {
    User.findOne({ username: req.params.username }, function(err, user) {
        if (!user) {
            req.flash('error',"user not found!");
            res.redirect('/recipes');
        }
        else {
            Recipe.find().populate("comments").exec(function(err,foundRecipes){
                if(err) console.log(err);
                else {
                    Recipe.find({"author.username":req.params.username}).populate("comments").exec(function(err,foundRecipe) {
                        if(err) console.log(err);
                        else {
                            res.render("profile",{user:user , recipe:foundRecipe, foundRecipes:foundRecipes});
                        }
                    });
                }
            });
        }
    });
});


// show register form
router.get("/register", function(req, res){
   res.render("register"); 
});

//handle sign up logic
router.post("/register", function(req, res){
    var newUser = new User(
        {
            username: req.body.username,
            email: req.body.email,
            resetPasswordToken : undefined,
            resetPasswordExpires : undefined
        });
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            if (err.name === 'MongoError' && err.code === 11000) {
                req.flash("error", "That email has already been registered.");
                return res.redirect("/register");
            }
            req.flash("error", "Something went wrong...");
            return res.redirect("/register");
        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "Share your recipe with the world!" + user.username);
            res.redirect("/recipes");
        });
    });
});

router.get("/login/success", function(req, res){
    req.flash("success", "Welcome to Recipe Lover!");
    console.log("success");
    res.redirect("/recipes");
});
//show login form
router.get("/login/fail", function(req, res){
    console.log("fail");
    req.flash("error", "Wrong Username/Password combination!");
    res.redirect("/recipes");
});

//SHOW LOGIN FORM
router.get("/login", function(req, res){
    res.render("login");
});

//LOGIN LOGIC
router.post("/login", passport.authenticate("local", {
        successRedirect: "/login/success",
        failureRedirect: "/login/fail"
    }), function(req, res){
});

//LOGOUT ROUTE
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "Logged you out!");
   res.redirect("/recipes");
});

// // CHANGE PASSWORD
// router.get("/change-password", middleware.isLoggedIn ,function(req,res) {
//     res.render('change-password');
// });
//
// router.post("/change-password",function(req,res) {
//     User.findById(req.user._id).exec(function(err,person) {
//         if(err) {
//             req.flash("errorArr",err.message);
//             res.redirect("/campgrounds");
//         } else {
//             if(req.body.password  == req.body.confirm) {
//                 // if both passwords match, then store new password, else redirect
//                 person.setPassword(req.body.password,function() {
//                     person.save();
//                     req.flash("successArr","Password Changed Successfully!");
//                     res.redirect("/campgrounds");
//                 });
//             } else {
//                 req.flash("errorArr","Password was not changed because they did not match");
//                 res.redirect('/campgrounds');
//             }
//         }
//     });
// });

// // FORGOT PASSWORD
// router.get("/forgot",function(req,res) {
//     res.render("forgot");
// });

// router.post('/forgot', function(req, res, next) {
//     async.waterfall([
//         function(done) {
//             crypto.randomBytes(20, function(err, buf) {
//                 var token = buf.toString('hex');
//                 done(err, token);
//             });
//         },
//         function(token, done) {
//             user.findOne({ email: req.body.email }, function(err, user) {
//                 if (!user) {
//                     req.flash('errorArr', 'No account with that email address exists.');
//                     return res.redirect('/forgot');
//                 }
//                 user.resetPasswordToken = token;
//                 user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
//                 user.save(function(err) { done(err, token, user); });
//             });
//         },
//         function(token, user, done) {
//             // using SendGrid's v3 Node.js Library
//             // https://github.com/sendgrid/sendgrid-nodejs
//             var from_email = new helper.Email("registershao99@gmail.com"),
//                 to_email = new helper.Email(user.email),
//                 subject = "Forgot Password - yelpcamp",
//                 content = new helper.Content("text/plain",'You are receiving this because you have requested the reset of the password for your account.\n\n' +
//                     'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
//                     'http://' + req.headers.host + '/reset/' + token + '\n\n' +
//                     'If you did not request this, please ignore this email and your password will remain unchanged.\n' ),
//                 mail = new helper.Mail(from_email, subject, to_email, content);
//             var sg = require('sendgrid')(process.env.SENDGRIDAPIKEY);
//             var request = sg.emptyRequest({
//                 method: 'POST',
//                 path: '/v3/mail/send',
//                 body: mail.toJSON()
//             });
//
//             sg.API(request, function(error, response)
//             {/*console.log(response.statusCode)
//         console.log(response.body)
//         console.log(response.headers)*/
//                 req.flash('successArr', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
//                 res.redirect('/campgrounds');
//             });
//         }
//     ], function(err) {
//         if (err) return next(err);
//         res.redirect('/forgot');
//     });
// });

// RESET PASSWORD

// router.get('/reset/:token', function(req, res) {
//     user.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
//         if (!user) {
//             req.flash('errorArr', 'Password reset token is invalid or has expired.');
//             return res.redirect('/forgot');
//         }
//         res.render('reset', {
//             user: req.user,
//             token : req.params.token
//         });
//     });
// });
//
// router.post('/reset/:token', function(req, res)
// {
//     async.waterfall([
//         function(done) {
//             user.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
//                 if (!user) {
//                     req.flash('errorArr', 'Password reset token is invalid or has expired.');
//                     return res.redirect('back');
//                 }
//                 if(req.body.password  == req.body.confirm)
//                 { // if both passwords match, then store new password, else redirect
//                     user.setPassword(req.body.password,function()
//                     {
//                         user.resetPasswordToken = undefined;
//                         user.resetPasswordExpires = undefined;
//                         user.save(function(err)
//                         {
//                             req.logIn(user, function(err){  done(err, user);  });
//                         });
//                     });
//                 }
//                 else
//                 { res.redirect('/reset/:token');  }
//
//             });
//         },
//         function(user, done)
//         {
//             // using SendGrid's v3 Node.js Library
//             // https://github.com/sendgrid/sendgrid-nodejs
//             var from_email = new helper.Email("rama41296@gmail.com"),
//                 to_email = new helper.Email(user.email),
//                 subject = "Forgot Password - yelpcamp",
//                 content = new helper.Content("text/plain",'Hello,\n\n' +
//                     'This is a confirmation that the password for your account \"' + user.username+'\" <'+user.email+ '> has just been changed.\n' ),
//                 mail = new helper.Mail(from_email, subject, to_email, content);
//
//             var sg = require('sendgrid')(process.env.SENDGRIDAPIKEY);
//             var request = sg.emptyRequest({
//                 method: 'POST',
//                 path: '/v3/mail/send',
//                 body: mail.toJSON()
//             });
//
//             sg.API(request, function(error, response)
//             {/*console.log(response.statusCode)
//         console.log(response.body)
//         console.log(response.headers)*/
//                 req.flash('successArr', 'Password Changed Successfully!');
//                 res.redirect('/campgrounds');
//             });
//
//         }
//     ], function(err) {
//         res.redirect('/');
//     });
// });
//
// router.get("*",function(req,res) {
//     res.send("404 page not found");
// });

module.exports = router;