const mongoose = require('mongoose');
const User = require('../models/user');

mongoose.connect('mongodb://localhost:27017/mockInterview', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log("Database Connected"))
    .catch(e => console.log("DB not Connected", e));

let name = ['Arvind', 'Shubham', 'Harsh', 'Pushpesh', 'Nikhil', 'Khush', 'Anjali', 'Alia', 'Janvhi', 'Priya'];
let usernames = ['arvindYadav', 'sd1234', 'desaiHarsh', 'mishraPushpesh', 'kargatiaNikhil', 'santokiKhush',
    'mehtaAnjali', 'bhattAlia', 'kapoorJanvhi', 'agarwalPriya'
]
const seedDB = async () => {
    for (let i = 0; i < 10; i++) {
        const user = new User({ name: name[i], username: usernames[i], password: name[i] })
        await user.save();
    }
}
seedDB().then(() => mongoose.connection.close());