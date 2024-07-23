const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');
const PlayerChoice = require('./models/PlayerChoice');
const cors = require('cors');

require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.use(cors());

// Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/arggame', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// });

mongoose.connect('mongodb+srv://' + process.env.MONGODBUSER + ':' + process.env.MONGODBPASSWORD + '@cluster0.jt3qbmd.mongodb.net/ARG-Website?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Middleware
app.use(express.json());
app.use(bodyParser.json()); 
app.use(express.urlencoded({ extended: false }));

// Session management
app.use(session({
    secret: process.env.COOKIE_KEYS,
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({
        mongoUrl: 'mongodb://localhost:27017/arggame',
        collectionName: 'sessions'
    }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 1 day
    }
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());


// Passport configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    const existingUser = await User.findOne({ googleId: profile.id });

    if (existingUser) {
        return done(null, existingUser);
    }

    const newUser = new User({
        googleId: profile.id,
        displayName: profile.displayName,
        email: profile.emails[0].value,
        currentLevel: 0 // default value for currentLevel
    });

    await newUser.save();

    // Create a new entry in PlayerChoice for the new user
    const newPlayerChoice = new PlayerChoice({
        userId: profile.id,
        choices: []
    });

    await newPlayerChoice.save();
    done(null, newUser);
    
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});


// app.get('/', (req, res) => {
//     if(req.isAuthenticated()){
//         res.render("home");
//       }else{
//         res.redirect("/login");
//       }
// });

app.get('/', (req, res) =>{
    res.render("home", { user: req.user });
});

app.get('/search', (req, res) => {
    res.render("search", { user: req.user });
})

app.get('/lab', (req, res) => {
    res.render('lab');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    async (req, res) => {
        try{
            const user = await User.findById(req.user.id);
            if (user.newUser) {
                res.redirect('/playerinfo');
            } else {
                res.redirect('/');
            }
        } catch(err){
            console.error(err);
            res.redirect('/login');
        }
    }
);

app.get('/playerinfo', (req, res) => {
    if(req.isAuthenticated()){
        res.render('playerinfo', {user: req.user});
    }else{
        res.redirect("/login");
    }
});

app.get('/levels', (req, res) => {
    if(req.isAuthenticated()){
        res.render('levels', {
            user: req.user,
            unlockedLevels: req.user.unlockedLevels,
            completedLevels: req.user.completedLevels,
            levelCompletionDates: req.user.levelCompletionDates 
        });
    }else{
        res.redirect('/login');
    }
});

//Crossword Puzzle
app.get('/crossword', (req, res) =>{
    if(req.isAuthenticated()){
        res.render("crossword");
    } else{
        res.redirect("/login");
    }
});

const answersLayout = [
    ['$', 'S', 'C', 'H', 'O', 'L', 'A', 'R', '$', '$', '$', '$', '$', '$', '$', '$', '$', 'T', '$', '$', '$', '$'],
    ['$', '$', '$', '$', '$', '$', 'U', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', 'U', '$', '$', '$', '$'],
    ['$', 'S', 'A', 'M', 'A', 'L', 'T', 'M', 'A', 'N', '$', '$', '$', '$', '$', '$', '$', 'R', '$', '$', '$', '$'],
    ['$', '$', '$', '$', '$', '$', 'O', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', 'I', '$', '$', '$', '$'],
    ['$', '$', '$', '$', '$', '$', 'M', '$', '$', '$', '$', '$', '$', 'S', '$', '$', '$', 'N', '$', '$', '$', '$'],
    ['P', 'E', 'R', 'S', 'O', 'N', 'A', 'L', 'I', 'Z', 'A', 'T', 'I', 'O', 'N', '$', '$', 'G', '$', '$', '$', '$'],
    ['$', '$', '$', '$', '$', '$', 'T', '$', '$', '$', '$', '$', '$', 'P', '$', '$', '$', 'T', '$', '$', '$', '$'],
    ['$', '$', '$', '$', '$', 'G', 'E', 'M', 'I', 'N', 'I', '$', '$', 'H', '$', '$', '$', 'E', '$', '$', '$', '$'],
    ['$', '$', '$', '$', '$', '$', 'D', '$', '$', '$', '$', '$', '$', 'I', '$', '$', '$', 'S', '$', '$', '$', '$'],
    ['$', '$', 'H', '$', 'B', '$', 'G', '$', '$', 'N', 'E', 'U', 'R', 'A', 'L', 'N', 'E', 'T', 'W', 'O', 'R', 'K'],
    ['$', '$', 'A', '$', 'I', '$', 'R', '$', '$', '$', '$', '$', '$', '$', '$', 'L', '$', '$', '$', '$', '$', '$'],
    ['$', 'A', 'L', 'P', 'A', 'C', 'A', '$', '$', '$', '$', '$', '$', '$', '$', 'P', '$', '$', '$', '$', '$', '$'],
    ['$', '$', '9', '$', 'S', '$', 'D', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$'],
    ['$', '$', '0', '$', '$', '$', 'I', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$'],
    ['$', '$', '0', '$', '$', '$', 'N', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$'],
    ['$', '$', '0', '$', 'B', 'I', 'G', 'D', 'A', 'T', 'A', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$'],
    ['$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$'],
    ['$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$', '$']
];

app.post('/check', (req, res) => {
    const { row, cell, answer } = req.body;
    const correctAnswer = answersLayout[row][cell].toUpperCase();

    const result = correctAnswer === answer.toUpperCase();
    res.json({ correct: result, correctAnswer: correctAnswer });
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
