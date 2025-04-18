import { Request, Response } from 'express';
import stripe from './stripeConfig.js';
import { getDocument, getDocuments, updateDocument, whereEqual, COLLECTIONS } from '../../services/firebase/firestore.js';

// Define the interface for a mentor document
interface MentorDocument {
  id: string;
  userId?: string;
  stripeAccountId?: string;
  [key: string]: any;
}

interface PaymentDocument {
  id: string;
  sessionId: string;
  mentorId: string;
  menteeId: string;
  amount: number;
  status: string;
  transactionId: string;
  paymentIntentId?: string;
  [key: string]: any;
}

// Define an interface for the expanded payment intent
// interface ExpandedPaymentIntent {
//   id: string;
//   amount: number;
//   currency: string;
//   charges: {
//     data: Array<{
//       id: string;
//       // other charge properties as needed
//     }>;
//   };
//   // Add other PaymentIntent properties you need
// }

export const capturePaymentHandler = async (req: Request, res: Response) => {
  try {
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // Retrieve payment intent to get full details
    const paymentIntentResponse = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['charges']
    });
    
    // Convert to a plain object to avoid TypeScript errors with expanded properties
    const paymentIntent = paymentIntentResponse as any;

    // Capture the payment
    const capturedPayment = await stripe.paymentIntents.capture(paymentIntentId);

    // Get the payment from our database to find the mentor
    const payments = await getDocuments<PaymentDocument>(
      COLLECTIONS.PAYMENTS, 
      [whereEqual('paymentIntentId', paymentIntentId)]
    );

    if (!payments || payments.length === 0) {
      return res.status(200).json(capturedPayment);
    }

    const payment = payments[0];
    
    // Get the mentor's Stripe account ID
    const mentor = await getDocument<MentorDocument>(COLLECTIONS.MENTORS, payment.mentorId);
    
    if (!mentor || !mentor.stripeAccountId) {
      // If no Stripe account, we can't transfer, so just return the captured payment
      return res.status(200).json(capturedPayment);
    }

    // Calculate platform fee (20% of the total amount)
    const amount = paymentIntent.amount;
    const platformFeePercent = 0.20; // 20%
    const platformFee = Math.round(amount * platformFeePercent);
    const mentorAmount = amount - platformFee;

    // Check if there are charges available
    if (!paymentIntent.charges?.data || paymentIntent.charges.data.length === 0) {
      // If there's no charge yet, return the captured payment
      return res.status(200).json(capturedPayment);
    }

    // Create a transfer to the mentor's connected account
    const transfer = await stripe.transfers.create({
      amount: mentorAmount,
      currency: paymentIntent.currency,
      destination: mentor.stripeAccountId,
      transfer_group: paymentIntentId,
      source_transaction: paymentIntent.charges.data[0].id,
      description: `Payment for session ${payment.sessionId}`,
    });

    // Update the payment with transfer info
    if (payment.id) {
      await updateDocument(COLLECTIONS.PAYMENTS, payment.id, {
        transferId: transfer.id,
        transferAmount: mentorAmount,
        platformFee: platformFee,
        transferStatus: 'pending',
        updatedAt: Date.now()
      });
    }

    res.status(200).json({
      ...capturedPayment,
      transfer: {
        id: transfer.id,
        amount: mentorAmount,
        status: 'pending'
      }
    });
  } catch (error) {
    console.error('Error capturing payment:', error);
    res.status(500).json({ error: 'Failed to capture payment' });
  }
}; 