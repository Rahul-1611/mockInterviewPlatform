const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const matchesSchema = new Schema({
    myID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    peerID: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    similarity: {
        type: Number,
    },
    status: {
        type: String,
        enum: ['accepted', 'requested'],
        default: 'requested'
    },
    code: {
        type: String,
        default: '----'
    }
})

module.exports = mongoose.model('Matches', matchesSchema);