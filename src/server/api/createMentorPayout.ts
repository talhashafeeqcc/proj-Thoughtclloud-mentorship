import { Request, Response } from 'express';
import stripe from './stripeConfig';
import { getDocument, COLLECTIONS } from '../../services/firebase';

// Define the interface for a mentor document
interface MentorDocument {
  id: string;
  userId?: string;
  stripeAccountId?: string;
  [key: string]: any;
}

export const createMentorPayoutHandler = async (req: Request, res: Response) => {
  try {
    const { mentorId } = req.params;
    const { amount, currency = 'usd' } = req.body;

    if (!mentorId) {
      return res.status(400).json({ error: 'Mentor ID is required' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    // Get the mentor document
    const mentor = await getDocument<MentorDocument>(COLLECTIONS.MENTORS, mentorId);
    
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    if (!mentor.stripeAccountId) {
      return res.status(404).json({ error: 'Mentor has no connected Stripe account' });
    }

    // Check if the mentor has sufficient balance
    const balance = await stripe.balance.retrieve({
      stripeAccount: mentor.stripeAccountId
    });

    // Find available balance in the requested currency
    const availableBalance = balance.available.find(bal => bal.currency === currency);
    
    if (!availableBalance || availableBalance.amount < amount) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        available: availableBalance ? availableBalance.amount : 0
      });
    }

    // Create a payout
    const payout = await stripe.payouts.create({
      amount: amount,
      currency: currency,
      statement_descriptor: 'THOUGHTCLOUD PAYOUT',
    }, {
      stripeAccount: mentor.stripeAccountId
    });

    return res.status(201).json({
      payoutId: payout.id,
      amount: payout.amount,
      currency: payout.currency,
      status: payout.status,
      arrivalDate: payout.arrival_date
    });
  } catch (error) {
    console.error('Error creating payout for mentor:', error);
    res.status(500).json({ error: 'Failed to create payout' });
  }
}; 