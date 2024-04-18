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

app.get('/', (req, res) => {
    res.render("webApp/dashboard");
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
        req.session.user_id = foundUser._id;
        res.render('webApp/dashboard', { foundUser });
    }
    else {
        res.redirect('/login');
    }
})

app.post('/logout', (req, res) => {
    req.session.user_id = null;
    // req.session.destroy();
    res.redirect('/login');
})

app.get('/preferences', (req, res) => {
    res.render('webApp/preferences');
})
app.post('/preferences', async (req, res) => {
    // const { profile, jobType, interviewType, experience, language,
    //     duration } = req.body;
    // let userID = req.session.user_id;
    // const pref = new Preferences({
    //     profile, jobType, interviewType, experience, language,
    //     duration, user: userID
    // });
    // await pref.save();
    res.redirect('/');
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
    const roomId = req.query.roomId;
    res.render('webApp/video', { roomId });
})

app.listen(4321, () => {
    console.log("Server is live");
})