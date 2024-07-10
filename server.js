const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');

require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/arggame', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Middleware
app.use(express.json());
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
})

app.get('/search', (req, res) => {
    res.render("search", { user: req.user });
})

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
    res.render('playerinfo')
})

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
