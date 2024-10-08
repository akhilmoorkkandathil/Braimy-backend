import mongoose from "mongoose";
const { Schema } = mongoose;

const userOtpSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    OTP: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60  
    }
    
});
userOtpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 });

const userOtpModel= mongoose.model('UserOtp',userOtpSchema);

export default userOtpModel;