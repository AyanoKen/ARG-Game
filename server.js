const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const cookieSession = require('cookie-session');
const User = require('./models/User'); // We'll define this model later

require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

const cookieKey = JSON.parse(process.env.COOKIE_KEYS);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/arggame', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Cookie session configuration
app.use(cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: cookieKey
}));

// Initialize passport
app.use(passport.initialize());
app.use(passport.session());

// Passport configuration
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
}, (accessToken, refreshToken, profile, done) => {
    User.findOne({ googleId: profile.id }).then((existingUser) => {
        if (existingUser) {
            done(null, existingUser);
        } else {
            new User({ googleId: profile.id, displayName: profile.displayName })
                .save()
                .then(user => done(null, user));
        }
    });
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then(user => {
        done(null, user);
    });
});

// Routes
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        // Successful authentication, redirect home.
        res.redirect('/');
    }
);

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
