import express from 'express';
import { createPayment, paymentCallback, paymentStatus } from '../controller/paymentController.js';

const paymentRouter = express.Router();

paymentRouter.post('/create', createPayment);
paymentRouter.post('/callback', paymentCallback);
paymentRouter.get('/status/:transactionId', paymentStatus);

export default paymentRouter;
