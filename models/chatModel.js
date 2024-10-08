import mongoose from "mongoose";
const { Schema } = mongoose;


const chatSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    tutorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tutor',
        required: true
    },
    senderType: {
        type: String,
        enum: ['User', 'Tutor'],
        required: true
    },
    message: {
        type: String,
        required: true
    },
},
{
    timestamps: true
});

const chatModel= mongoose.model('Chat',chatSchema);

export default chatModel;