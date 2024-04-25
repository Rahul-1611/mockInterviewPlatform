const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const statsSchema = new Schema({
    user: {
        type: String,
        required: [true]
    },
    first: Number,
    second: Number,
    third: Number,
    fourth: Number,
    meetingCount: {
        type: Number,
        default: 0
    },
    firstOv: Number,
    secondOv: Number,
    thirdOv: Number,
    fourthOv: Number,
})


module.exports = mongoose.model('Stats', statsSchema);