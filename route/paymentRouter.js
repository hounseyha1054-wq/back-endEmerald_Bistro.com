import express from 'express';
import { createPayment, paymentCallback, paymentStatus, createPaymentQr } from '../controller/paymentController.js';

const paymentRouter = express.Router();

paymentRouter.post('/create', createPayment);
paymentRouter.post('/create-qr', createPaymentQr);
paymentRouter.post('/callback', paymentCallback);
paymentRouter.get('/status/:transactionId', paymentStatus);

export default paymentRouter;
