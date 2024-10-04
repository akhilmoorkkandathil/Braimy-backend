const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FaqSchema = new Schema({
    question: {
        type: String,
        required: true, // Make the question field required
    },
    answer: {
        type: String,
        required: true, // Make the answer field required
    },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set the creation date
    },
});

const Faq = mongoose.model('Faq', FaqSchema);

module.exports = Faq;