const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');
const PlayerChoice = require('./models/PlayerChoice');
const TroopInfo = require('./models/TroopInfo');
const LevelInfo = require('./models/LevelInfo');
const cors = require('cors');
const multer = require('multer');
// const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.use(cors());


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ storage: storage });

// const oauth2Client = new google.auth.OAuth2(
//     process.env.GOOGLE_CLIENT_ID,
//     process.env.GOOGLE_CLIENT_SECRET,
//     '/auth/google/callback'
// );

// oauth2Client.setCredentials({
//     refresh_token: process.env.GOOGLE_REFRESH_TOKEN
// });

// const drive = google.drive({ version: 'v3', auth: oauth2Client });

// async function uploadFileToDrive(filePath, fileName) {
//     console.log("Checkpoint 1");
//     console.log(filePath);
//     console.log(fileName);

//     const fileMetadata = {
//         'name': fileName,
//         'parents': ['1YQONuONhnVJvb_X3gmvy6ywHEYNp881V'] // Ensure this ID is correct and you have access
//     };
//     const media = {
//         mimeType: 'image/png', // Adjust this if the file type varies
//         body: fs.createReadStream(filePath)
//     };

//     try {
//         const response = await drive.files.create({
//             resource: fileMetadata,
//             media: media,
//             fields: 'id'
//         });

//         console.log("Checkpoint 2");
//         console.log(response.data);
//         return response.data.id;
//     } catch (error) {
//         console.error("Error during file upload:", error);
//     }
// }

// // Connect to MongoDB
// mongoose.connect('mongodb://localhost:27017/arggame', {
//     useNewUrlParser: true,
//     useUnifiedTopology: true
// });


mongoose.connect('mongodb+srv://' + process.env.MONGODBUSER + ':' + process.env.MONGODBPASSWORD + '@cluster0.jt3qbmd.mongodb.net/ARG-Website?retryWrites=true&w=majority&appName=Cluster0');

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

app.get('/playerinfo', async (req, res) => {
    if (req.isAuthenticated()) {
        const user = req.user;
        let troopInfo = null;

        if (user.playerTroop) {
            troopInfo = await TroopInfo.findOne({ name: user.playerTroop });
        }

        res.render('playerinfo', { user, troopInfo });
    } else {
        res.redirect("/login");
    }
});

app.get('/levels', async (req, res) => {
    if(req.isAuthenticated()){

        const levelDetails = await LevelInfo.find().lean();

        res.render('levels', {
            user: req.user,
            unlockedLevels: req.user.unlockedLevels,
            completedLevels: req.user.completedLevels,
            levelCompletionDates: req.user.levelCompletionDates,
            levelDetails: levelDetails
        });
    }else{
        res.redirect('/login');
    }
});

//Crossword Puzzle
app.get('/crossword', (req, res) =>{
    if(req.isAuthenticated()){
        res.render("crossword", {user: req.user});
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

app.get('/orientation', (req, res) => {
    if(req.isAuthenticated()){
        res.render('orientation', {user: req.user, userId: req.user.googleId});
    }else{
        res.redirect('/login');
    }
});

const troopNames = {"T": "Tempus", "N": "Neurona", "E": "Empathia", "M": "Memoria"};

app.post('/orientation/submit-answer', async (req, res) => {
    const { userId, answerText, troopValue } = req.body;
    try {
        // Update player choices
        await PlayerChoice.findOneAndUpdate(
            { userId },
            { $push: { choices: answerText } },
            { new: true, upsert: true }
        );

        // Initialize troopCounts array in session if not already initialized
        if (!req.session.troopCounts) {
            req.session.troopCounts = [];
        }

        // Add troopValue to session-specific troopCounts array
        req.session.troopCounts.push(troopValue);

        res.status(200).send({ message: 'Answer recorded' });
    } catch (error) {
        res.status(500).send({ message: 'Error recording answer' });
    }
});

app.post('/orientation/complete', async (req, res) => {
    const { userId } = req.body;
    try {
        const troopCounts = req.session.troopCounts || [];
        const troop = calculateTroop(troopCounts);
        const avatars = getAvatarsForTroop(troop);
        const troopName = troopNames[troop];

        req.session.troopCounts = [];

        res.status(200).send({ message: 'Troop assigned', troopName, avatars });
    } catch (error) {
        res.status(500).send({ message: 'Error completing level' });
    }
});

app.post('/orientation/updateTroop', async (req, res) => {
    const { userId, troopName, avatar } = req.body;
    try {
        // Update the user's troop and avatar in the database
        const result = await User.findOneAndUpdate(
            { googleId: String(userId) },
            { playerTroop: troopName, playerAvatar: avatar },
            { new: true }
        );
        
        if (!result) {
            console.log('User not found or update failed.');
        } else{
            console.log('User is updated');
        }
        res.status(200).send({ message: 'Troop and avatar updated' });
    } catch (error) {
        res.status(500).send({ message: 'Error updating troop and avatar' });
    }
});

function calculateTroop(troopCounts) {
    // Object to store the counts of each troop value
    const troopCountMap = {};

    // Count occurrences of each troop value
    troopCounts.forEach(troop => {
        if (troopCountMap[troop]) {
            troopCountMap[troop]++;
        } else {
            troopCountMap[troop] = 1;
        }
    });

    // Find the troop value with the maximum count
    let maxTroop = null;
    let maxCount = 0;

    for (const troop in troopCountMap) {
        if (troopCountMap[troop] > maxCount) {
            maxCount = troopCountMap[troop];
            maxTroop = troop;
        }
    }
    return maxTroop;
}

function getAvatarsForTroop(troop) {
    const avatars = [];
    for (let i = 1; i <= 6; i++) {
        avatars.push(`/images/${troop}_avatar${i}.png`);
    }
    return avatars;
}

app.get('/innovate', (req, res) => {
    if(req.isAuthenticated()){
        res.render('innovate', {user: req.user});
    }else{
        res.redirect('/login');
    }
});

app.post('/innovate/step1', async (req, res) => {
    const {playerInput} = req.body;
    try {
        // Update the user's troop and avatar in the database
        const result = await PlayerChoice.findOneAndUpdate(
            { userId: String(req.user.googleId) },
            {  $push: { innovateStep1: playerInput } },
            { new: true, upsert: true }
        );
        
        if (!result) {
            console.log('User not found or update failed.');
        } else{
            console.log('User is updated');
        }
        res.status(200).send({ message: 'Troop and avatar updated' });
    } catch (error) {
        res.status(500).send({ message: 'Error updating troop and avatar' });
    }
});

app.post('/innovate/step2', async (req, res) => {
    const {playerInput} = req.body;
    try {
        const result = await PlayerChoice.findOneAndUpdate(
            { userId: String(req.user.googleId) },
            {  $push: { innovateStep2: playerInput } },
            { new: true, upsert: true }
        );
        
        if (!result) {
            console.log('User not found or update failed.');
        } else{
            console.log('User is updated');
        }
        res.status(200).send({ message: 'Troop and avatar updated' });
    } catch (error) {
        res.status(500).send({ message: 'Error updating troop and avatar' });
    }
});

app.post('/innovate/step6', upload.single('playerImage'), async (req, res) => {
    const { problemDefinition, context, proposedSolution, alpacaPrompt } = req.body;

    try {
        const imageFilePath = req.file.path;
        // const fileId = await uploadFileToDrive(imageFilePath, req.file.filename);

        const result = await PlayerChoice.findOneAndUpdate(
            { userId: String(req.user.googleId) },
            { $push: { innovateStep6: [problemDefinition, context, proposedSolution, alpacaPrompt, imageFilePath] } },
            { new: true, upsert: true }
        );

        if (!result) {
            console.log('User not found or update failed.');
        } else {
            console.log('User is updated');
        }

        res.status(200).send({ message: 'Data and image uploaded' });
    } catch (error) {
        res.status(500).send({ message: 'Error updating data and uploading image' });
    }
});

app.get('/reimagine', (req, res) => {
    if(req.isAuthenticated()){
        res.render('reimagine', {user: req.user});
    }else{
        res.redirect('/login');
    }
});

app.get('/reimagine2', (req, res) => {
    if(req.isAuthenticated()){
        res.render('reimagine2', {user: req.user});
    }else{
        res.redirect('/login');
    }
});

app.get('/recognition', (req, res) => {
    if(req.isAuthenticated()){
        res.render('recognition', {user: req.user});
    }else{
        res.redirect('/login');
    }
});

const answers = {
    1: ["ai conference", "ai conferences", "conference", "conferences"],
    2: ["the ai imperative: uniting education business and government"], 
    3: ["purdue x google summit", "purduexgooglesummit", "#purduexgooglesummit"],
    4: ["hyatt", "hyatt regency"],
    5: ["indianapolis"],
    6: ["14 nov, 2024", "14 nov 2024", "14 november 2024", "14 november, 2024", "14th nov, 2024", "14th november, 2024", "14th november 2024"]
};

const hints = {
    1: "AI Conference",
    3: "Purdue X Google Summit",
    4: "Hyatt Regency",
    5: "Indianapolis",
    6: "14 November 2024"
};

app.post('/recognition/answers', (req, res) => {
    const { clueNumber, answer } = req.body;

    if (answers[clueNumber] && answers[clueNumber].includes(answer)) {
        return res.json({ correct: true, text: hints[clueNumber] });
    } else {
        return res.json({ correct: false });
    }
});

app.get('/decisions', (req, res) => {
    if(req.isAuthenticated()){
        res.render('decisions', {user: req.user});
    }else{
        res.redirect('/login');
    }
});

app.get('/echos', (req, res) => {
    if(req.isAuthenticated()){
        res.render('echos', {user: req.user});
    }else{
        res.redirect('/login');
    }
});

app.get('/test', (req, res) => {
    res.render('test');
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
