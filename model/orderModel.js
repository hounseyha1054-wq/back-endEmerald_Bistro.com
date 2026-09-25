import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true },
  name: { type: String, required: true },
  unitPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  transactionId: { type: String, required: true, unique: true, index: true },
  customer: {
    id: { type: String, default: '' },
    name: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  items: { type: [orderItemSchema], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'cancelled'],
    default: 'pending',
    index: true,
  },
  payment: {
    status: { type: String, default: '' },
    type: { type: String, default: '' },
    approvalCode: { type: String, default: '' },
    bankReference: { type: String, default: '' },
    paidAt: { type: Date },
  },
}, { timestamps: true });

const Order = mongoose.models.order || mongoose.model('order', orderSchema);

export default Order;
