const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/User');
const CommunityPosts = require('./models/communityPosts');
const PlayerChoice = require('./models/PlayerChoice');
const TroopInfo = require('./models/TroopInfo');
const LevelInfo = require('./models/LevelInfo');
const PostLikes = require('./models/PostLikes');
const cors = require('cors');
const multer = require('multer');
// const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
                res.redirect('/playersetup');
            } else {
                res.redirect('/playerinfo');
            }
        } catch(err){
            console.error(err);
            res.redirect('/login');
        }
    }
);

app.get('/playersetup', (req, res) => {
    if (req.isAuthenticated()){
        res.render('playersetup')
    } else {
        res.redirect("/login");
    }
});

app.post('/playersetup/setup', async (req, res) => {
    if (req.isAuthenticated()){
        try {
            const userId = req.user.googleId; 
            const { name, campus, school } = req.body;
    
            
            const updatedUser = await User.findOneAndUpdate(
                { googleId: userId },
                { 
                    name: name, 
                    campus: campus, 
                    school: school, 
                    newUser: false 
                }, 
                { new: true } 
            );
    
            if (!updatedUser) {
                return res.status(404).json({ success: false, message: 'User not found.' });
            }
    
            res.json({ success: true, message: 'User updated successfully.', user: updatedUser });
    
        } catch (err) {
            console.error('Error updating user:', err);
            res.status(500).json({ success: false, message: 'Error updating user.' });
        }
    }
    
});

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
        req.session.crosswordCount = 0;
        res.render("crossword", {user: req.user});
    } else{
        res.redirect("/login");
    }
});

app.post('/crossword/complete', async (req, res) => {
    if(req.isAuthenticated()){
        const userId = req.user.googleId; 
        const today = new Date();
        const yyyy = today.getFullYear();
        let mm = today.getMonth() + 1; // Months start at 0!
        let dd = today.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        const formattedToday = dd + '-' + mm + '-' + yyyy;
        try {
            const updates = {
                'levelCompletionDates.3': formattedToday
            }

            const result = await User.findOneAndUpdate(
                { googleId: userId },
                {currentLevel: 4, $push: {completedLevels: 3, unlockedLevels: 4}, $set: updates },
                { new: true }
            );
            
            if (!result) {
                console.log('User not found or update failed.');
            } else{
                console.log('User is updated');
            }
            res.status(200).send({ message: 'Troop and avatar updated' });
        } catch (error) {
            console.log(error);
            res.status(500).send({ message: 'Error updating troop and avatar' });
        }
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

    if(result){
        req.session.crosswordCount++;
    }
    res.json({ correct: result, correctAnswer: correctAnswer, count: req.session.crosswordCount });
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
            { playerTroop: troopName, playerAvatar: avatar, currentLevel: 2, $push: {completedLevels: 1, unlockedLevels: 2} },
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

        res.status(200).send({ message: 'Data and image uploaded'});
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

app.post('/reimagine/step6', upload.single('playerImage'), async (req, res) => {
    const { landmark, alpacaPrompt } = req.body;

    try {
        const imageFilePath = req.file.path;
        // const fileId = await uploadFileToDrive(imageFilePath, req.file.filename);

        const result = await PlayerChoice.findOneAndUpdate(
            { userId: String(req.user.googleId) },
            { $push: { reimagineStep6: [landmark, alpacaPrompt, imageFilePath] } },
            { new: true, upsert: true }
        );

        if (!result) {
            console.log('User not found or update failed.');
        } else {
            console.log('User is updated');
        }

        res.status(200).send({ message: 'Data and image uploaded'});
    } catch (error) {
        res.status(500).send({ message: 'Error updating data and uploading image' });
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
    2: ["the ai imperative: uniting education, business and government", "the ai imperative: uniting education business and government", "the ai imperative uniting education, business and government", "the ai imperative uniting education business and government"], 
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

app.get('/community', async (req, res) => {
    const communityPosts = await CommunityPosts.findOne().exec();

    if (!communityPosts) {
        res.redirect('/');
    }

    const innovatePosts = communityPosts ? communityPosts.innovatePosts : [];
    const reimaginePosts = communityPosts ? communityPosts.reimaginePosts : [];

    const troopCounts = {
        Tempus: 0,
        Empathia: 0,
        Neurona: 0,
        Memoria: 0
    };

    const users = await User.find({}).exec();
    users.forEach(user => {
        const troop = user.playerTroop;
        if (troopCounts.hasOwnProperty(troop)) {
            troopCounts[troop]++;
        }
    });

    res.render('community', {user: req.user, innovatePosts, reimaginePosts, troopCounts});
});

app.get('/community/:imageName', async (req, res) => {
    try {
        const imageName = `uploads/${req.params.imageName}`;
        const communityPost = await CommunityPosts.findOne();

        if (communityPost) {
            // Check if the post is in innovatePosts
            const innovatePost = communityPost.innovatePosts.find(p => p.includes(imageName));
            if (innovatePost) {
                // Render the communityPostInnovate view if the image is found in innovatePosts
                return res.render('communityPostInnovate', {user: req.user, post: innovatePost });
            }
    
            // Check if the post is in reimaginePosts
            const reimaginePost = communityPost.reimaginePosts.find(p => p.includes(imageName));
            if (reimaginePost) {
                // Render the communityPostReimagine view if the image is found in reimaginePosts
                return res.render('communityPostReimagine', {user: req.user, post: reimaginePost });
            }
    
            // If the image was not found in either array
            res.status(404).send('Post not found');
        } else {
            res.status(404).send('Post not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

app.post('/likePost', async (req, res) => {
    const postUrl = req.body.postUrl; // Assuming postUrl is sent in the body of the request
    const userId = req.user.googleId;

    try {
        // Find the PostLikes document for the postUrl
        let postLikes = await PostLikes.findOne({ postUrl });

        if (!postLikes) {
            // If no document exists for the postUrl, create a new one
            postLikes = new PostLikes({ postUrl });
        }

        if (!postLikes.likedUsers.includes(userId)) {
            // Add the user to the likedUsers array
            postLikes.likedUsers.push(userId);

            // Increment the like counter in the CommunityPosts table
            const communityPost = await CommunityPosts.findOne();

            if (communityPost) {
                const reimaginePost = communityPost.reimaginePosts.find(p => p[3] === postUrl);
                
                if (reimaginePost) {
                    reimaginePost[4] = parseInt(reimaginePost[4]) + 1; // Increment the like counter
                    await communityPost.save(); // Save the updated communityPost document
                }
            }

            // Save the updated PostLikes document
            await postLikes.save();

            res.status(200).send({ success: true, message: 'Post liked!' });
        } else {
            res.status(200).send({ success: false, message: 'Post already liked.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
});

app.get('/admin', async (req, res) => {
    if (req.isAuthenticated() && req.user.admin) {

        const playerChoices = await PlayerChoice.find({}).exec();


        let innovateImages = [];
        let reimagineImages = [];

        playerChoices.forEach(playerChoice => {
            if (playerChoice.innovateStep6.length > 0){
                const lastInnovateArray = playerChoice.innovateStep6[playerChoice.innovateStep6.length - 1];
                lastInnovateArray[lastInnovateArray.length - 1] = lastInnovateArray[lastInnovateArray.length - 1].replace(/\\/g, '/');
                innovateImages.push([playerChoice.userId, lastInnovateArray]);
            }

            if (playerChoice.reimagineStep6.length > 0) {
                const lastReimagineArray = playerChoice.reimagineStep6[playerChoice.reimagineStep6.length -1];
                lastReimagineArray[lastReimagineArray.length - 1] = lastReimagineArray[lastReimagineArray.length - 1].replace(/\\/g, '/');
                reimagineImages.push([playerChoice.userId, lastReimagineArray]);
            }
        });

        res.render('admin', {innovateImages, reimagineImages});
    } else {
        res.redirect('/');
    }
});

app.post('/approveInnovate', async (req, res) => {
    try {
        const { userId, arrayData } = req.body;
        const user = await User.findOne({ googleId: userId }).exec();
        if (user) {
            const userName = user.displayName;
            arrayData.unshift(userName);

            await CommunityPosts.updateOne({}, { $push: { innovatePosts: arrayData } }, { upsert: true });
            res.status(200).send('Approved');
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Approval failed');
    }
});

app.post('/approveReimagine', async (req, res) => {
    try {
        const { userId, arrayData } = req.body;
        const user = await User.findOne({ googleId: userId }).exec();
        if (user) {
            const userName = user.displayName;
            arrayData.unshift(userName);

            arrayData.push(0) //Likes counter

            await CommunityPosts.updateOne({}, { $push: { reimaginePosts: arrayData } }, { upsert: true });
            res.status(200).send('Approved');
        } else {
            res.status(404).send('User not found');
        }
    } catch (error) {
        console.error(error);
        res.status(500).send('Approval failed');
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
