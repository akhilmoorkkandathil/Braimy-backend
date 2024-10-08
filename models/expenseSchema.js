import mongoose from "mongoose";
const { Schema } = mongoose;

const ExpenseSchema = mongoose.Schema({
  amountPaidTo: {
    type: String,
    required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  reason: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  isDeleted:{
    type:Boolean,
    default:false
  },
  date: {
    type: String,
    default: Date.now,
  },
});

const expenceModel = mongoose.model('Expense', ExpenseSchema);

export default expenceModel;
