const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const PaymentSchema = mongoose.Schema({
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'Student',
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
  required: true
}
});

const Payment = mongoose.model('Payment', PaymentSchema);

module.exports = Payment;
