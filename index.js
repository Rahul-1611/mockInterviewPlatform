let express = require('express');
let app = express();
const ejsMate = require('ejs-mate');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const methodOverride = require('method-override');
const User = require('./models/user');
const Stats = require('./models/stats');
const Preferences = require('./models/preferences');
const Matches = require('./models/matches');
const session = require('express-session');
let matches = [];

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
app.use('/review/css', express.static('public/css'));
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.json());
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

app.get('/', requireLogin, (req, res) => {
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
    matches = otherUsersPreferences.map(otherPref => {
        const similarity = calculateJaccardIndex(userPreferences, otherPref, fieldsToCompare);
        return { myID: req.params.userId, peerID: otherPref.user, similarity };
    }).filter(match => match.similarity >= 0.5);
    console.log(matches);
    // await Matches.deleteMany({ myID: req.params.userId });
    // await Matches.insertMany(matches);
    const usersToFind = matches.map(a => a.peerID);
    const candidates = await User.find({ _id: { $in: usersToFind } });
    console.log(candidates);
    const data = matches.map(d => {
        let us = candidates.find(c => c._id.equals(d.peerID));
        return {
            ...d, name: us.name, username: us.username
        }
    })
    console.log(data);

    console.log(req.params.userId);
    const matchesDb = await Matches.find({ myID: req.params.userId })
    console.log(matchesDb);
    res.render('webApp/candidates', { data, matchesDb });
})
app.post('/meetingCode', async (req, res) => {
    const myID = req.session.user_id;
    const { code, peerId } = req.query;
    console.log(myID, peerId);
    const nw = await Matches.findOneAndUpdate({ myID: myID, peerID: peerId }, { status: 'accepted', code });
    const nw3 = await Matches.findOneAndUpdate({ myID: peerId, peerID: myID }, { status: 'accepted', code });
    res.json("Data successfully reached");
})
app.get('/candidates', (req, res) => {
    res.render('webApp/candidates');
})
app.get('/lobby', (req, res) => {
    res.render('webApp/lobby');
})
app.post('/lobby', (req, res) => {
    let roomId = req.body.roomId;
    res.redirect(`/interview?roomId=${roomId}`);
});
app.get('/interview', (req, res) => {
    const { roomId, peerId } = req.query;
    req.session.peerID = peerId;
    res.render('webApp/video', { roomId, peerId });
})
app.get('/review/:peerId', async (req, res) => {
    const peer = await User.findOne({ _id: req.params.peerId });
    const peerN = peer.name;
    console.log(peer);
    res.render('webApp/reviewForm', { peer });
})
app.post('/review', async (req, res) => {
    const peer = await User.findOne({ _id: req.query.peerId });
    const data = req.body;
    for (let key in data) {
        if (!isNaN(data[key])) {
            data[key] = Number(data[key]);
        }
    }
    data.user = req.query.peerId;
    const update = {
        $set: {
            first: data.first,
            second: data.second,
            third: data.third,
            fourth: data.fourth,

        },
        $inc: {
            meetingCount: 1,
            firstOv: data.first,
            secondOv: data.second,
            thirdOv: data.third,
            fourthOv: data.fourth,
        }
    }
    const upd = await Stats.findOneAndUpdate({ user: req.query.peerId }, update, { upsert: true, new: true });
    console.log(upd);
    res.render('webApp/stats');
})
app.get('/stats', async (req, res) => {

    const scores = await Stats.findOne({ user: req.session.user_id });

    res.render('webApp/stats', { scores });
})

app.listen(4321, () => {
    console.log("Server is live");
})