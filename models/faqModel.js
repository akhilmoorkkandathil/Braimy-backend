import mongoose from "mongoose";
const { Schema } = mongoose;


const FaqSchema = new Schema({
    question: {
        type: String,
        required: true, 
    },
    answer: {
        type: String,
        required: true, 
    },
    createdAt: {
        type: Date,
        default: Date.now, 
    },
});

const FaqModel = mongoose.model('Faq', FaqSchema);

export default FaqModel;