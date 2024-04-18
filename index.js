let express = require('express');
let app = express();
const ejsMate = require('ejs-mate');
const path = require('path');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const User = require('./models/user');
const Preferences = require('./models/preferences');
const session = require('express-session');

mongoose.connect('mongodb://localhost:27017/mockInterview', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("Database Connected"))
    .catch(e => console.log("DB not Connected", e));

app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'notagoodsecret' }))

const requireLogin = (req, res, next) => {
    if (!req.session.user_id) {
        return res.redirect('/login')
    }
    next();
}
function calculateJaccardIndex(pref1, pref2, fields) {
    const setA = fields.map(field => pref1[field]);
    const setB = fields.map(field => pref2[field]);

    const intersection = setA.filter(value => setB.includes(value));
    const union = new Set([...setA, ...setB]);

    return intersection.length / union.size;
}

app.get('/', (req, res) => {
    res.render("webApp/dashboard", { foundUser: req.session.user });
})
app.get('/register', (req, res) => {
    res.render('webApp/register')
})

app.post('/register', async (req, res) => {
    const { name, password, username } = req.body;
    const user = new User({ name, username, password })
    await user.save();
    req.session.user_id = user._id;
    res.redirect('webApp/dashboard')
})

app.get('/login', (req, res) => {
    res.render('webApp/login');
})

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await User.findAndValidate(username, password);
    if (foundUser) {
        req.session.user = foundUser;
        req.session.user_id = foundUser._id;
        res.render('webApp/dashboard', { foundUser });
    }
    else {
        res.redirect('/login');
    }
})

app.get('/logout', (req, res) => {
    req.session.user_id = null;
    req.session.destroy();
    res.redirect('/login');
})

app.get('/preferences', (req, res) => {
    res.render('webApp/preferences');
})
app.post('/preferences', async (req, res) => {
    const { profile, jobType, interviewType, experience, language,
        duration } = req.body;
    let userID = req.session.user_id;
    await Preferences.findOneAndDelete({ user: userID })
    const pref = new Preferences({
        profile, jobType, interviewType, experience, language,
        duration, user: userID
    });
    await pref.save();
    res.redirect('/');
})
app.get('/candidates/:userId', async (req, res) => {
    const userPreferences = await Preferences.findOne({ user: req.params.userId });
    const otherUsersPreferences = await Preferences.find({ user: { $ne: req.params.userId } });

    const fieldsToCompare = ['duration', 'language', 'profile', 'jobType', 'interviewType', 'experience'];
    const matches = otherUsersPreferences.map(otherPref => {
        const similarity = calculateJaccardIndex(userPreferences, otherPref, fieldsToCompare);
        return { user: otherPref.user, similarity };
    }).filter(match => match.similarity >= 0.5);
    res.send(matches);

    // res.send(otherUsersPreferences);
    // res.render('webApp/candidates',{pref});
})
app.get('/lobby', (req, res) => {
    res.render('webApp/lobby');
})
app.post('/lobby', (req, res) => {
    let roomId = req.body.roomId;
    res.redirect(`/interview?roomId=${roomId}`);
});
app.get('/interview', (req, res) => {
    const roomId = req.query.roomId;
    res.render('webApp/video', { roomId });
})
app.get('/review', (req, res) => {
    res.render('webApp/reviewForm');
})

app.listen(4321, () => {
    console.log("Server is live");
})