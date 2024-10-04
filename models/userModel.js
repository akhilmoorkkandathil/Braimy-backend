const mongoose = require("mongoose");
const { Schema } = mongoose;

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    class: {
        type: Number
    },
    password: {
        type: String
    },
    phone: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    photoUrl: {
        type: String
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    coordinator: {
        type: Schema.Types.ObjectId,
        ref: 'Coordinator' 
    },
    isAdmin: {
        type: Boolean,
        default: false
    },
    subscription: {
        type: Object,
        default: null
    },
    rechargedHours:{
        type:Number,
        default:0
    },
    about:{
        type:String
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
