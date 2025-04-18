import { Request, Response } from 'express';
import stripe from './stripeConfig.js';

export const createRefundHandler = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId, reason } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // Check the payment intent status first
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Handle different payment states
    if (paymentIntent.status === 'requires_capture') {
      // For authorized but not captured payments, we can cancel instead of refund
      const canceledPayment = await stripe.paymentIntents.cancel(paymentIntentId, {
        cancellation_reason: reason || 'requested_by_customer'
      });
      
      return res.status(200).json({
        id: canceledPayment.id,
        status: canceledPayment.status,
        canceled: true
      });
    } else if (paymentIntent.status === 'succeeded') {
      // For captured payments, we need to issue a refund
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        reason: reason || 'requested_by_customer'
      });
      
      return res.status(200).json({
        id: refund.id,
        payment_intent: refund.payment_intent,
        amount: refund.amount,
        status: refund.status,
        created: refund.created
      });
    } else {
      return res.status(400).json({ 
        error: `Payment cannot be refunded: status is ${paymentIntent.status}` 
      });
    }
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ error: 'Failed to process refund' });
  }
}; 