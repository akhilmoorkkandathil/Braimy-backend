import mongoose from "mongoose";
const { Schema } = mongoose;



const PaymentSchema = mongoose.Schema({
  orderId:{
    type:String
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planSelected: {
    type: String,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  isDeleted:{
    type:Boolean,
  },
  date: {
    type: String,
    default: Date.now,
  },
  status: {
  type: String,
  enum: ['completed', 'cancelled'],
  default:'cancelled'
},
timeRecharged:{
  type:Number
}
});

const paymentModel = mongoose.model('Payment', PaymentSchema);

export default paymentModel;
