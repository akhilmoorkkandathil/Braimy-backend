import mongoose from "mongoose";
const { Schema } = mongoose;

const tutorSchema = mongoose.Schema({
    username:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
    },
    phone:{
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    photoUrl:{
        type:String
    },
    education:{
        type:String,
    }
    ,
    isBlocked: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    about:{
        type:String
    }
});
 const tutorModel= mongoose.model('Tutor',tutorSchema);
 export default tutorModel;
