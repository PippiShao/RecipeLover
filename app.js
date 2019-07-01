//NPM packages
//============================================================
var express     = require("express"),
    app         = express(),
    bodyParser  = require("body-parser"),
    mongoose    = require("mongoose"),
    flash       = require("connect-flash"),
    passport    = require("passport"),
    LocalStrategy = require("passport-local"),
    methodOverride = require("method-override"),
    dotenv = require('dotenv').config(), // for managing environment variables stored in .env file
    methodoverride = require("method-override");


// models
//============================================================
var Recipe  = require("./models/recipe"),
    Comment     = require("./models/comment"),
    User        = require("./models/user"),
    seedDB      = require("./seeds");

//requiring routes
//============================================================
var commentRoutes    = require("./routes/comments"),
    recipeRoutes = require("./routes/recipes"),
    indexRoutes      = require("./routes/index");

//Add mongoose and connect our DB
//============================================================
// environment variable for database url (safety purpose : to prevent users from deleting others' data )
var url = process.env.DATABASEURL || 'mongodb://localhost/yelp_camp';
mongoose.Promise = global.Promise;
mongoose.set('debug', false);
// fix deprecation warnings
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);

mongoose.connect(url, (err) => {
    if(err) console.log("Error occurred while connecting to DB:", err);
    else  console.log("DB connected successfully!");
});

//Express Settings
//============================================================
//Parses data input inside the body
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

//serve contents of the home page
app.set("view engine","ejs");
app.use(express.static(__dirname + '/public'));
app.use(methodoverride("_method"));   // new
app.use(flash());
//============================================================

seedDB(); //seed the database


app.use(require("express-session")({
    secret: "my cat is cute",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.error = req.flash("error");
   res.locals.success = req.flash("success");
   next();
});

//use imports from routes folder
//============================================================
app.use("/", indexRoutes);
app.use("/recipes", recipeRoutes);
app.use("/recipes/:id/comments", commentRoutes);


app.listen(3001, 'localhost', function(){
    console.log("server start");
});
