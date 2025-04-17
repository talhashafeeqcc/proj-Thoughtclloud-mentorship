import { Request, Response } from 'express';
import stripe from './stripeConfig';

export const capturePaymentHandler = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // First check if the payment intent exists and is in the right state
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'requires_capture') {
      return res.status(400).json({ 
        error: `Payment cannot be captured: status is ${paymentIntent.status}` 
      });
    }

    // Capture the authorized payment
    const capturedPayment = await stripe.paymentIntents.capture(paymentIntentId);

    res.status(200).json({
      id: capturedPayment.id,
      amount: capturedPayment.amount,
      status: capturedPayment.status
    });
  } catch (error) {
    console.error('Error capturing payment:', error);
    res.status(500).json({ error: 'Failed to capture payment' });
  }
}; 