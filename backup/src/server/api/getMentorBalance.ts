import { Request, Response } from 'express';
import stripe from './stripeConfig.js';
import { getDocument, COLLECTIONS } from '../../services/firebase/firestore.js';

// Define the interface for a mentor document from Firebase
interface MentorDocument {
  id: string;
  userId?: string;
  stripeAccountId?: string;
  expertise?: string[];
  bio?: string;
  sessionPrice?: number;
  balance?: number;
  [key: string]: any;
}

export const getMentorBalanceHandler = async (req: Request, res: Response) => {
  try {
    const { mentorId } = req.params;

    if (!mentorId) {
      return res.status(400).json({ error: 'Mentor ID is required' });
    }

    // Get the mentor's Stripe account ID from Firebase
    const mentor = await getDocument<MentorDocument>(COLLECTIONS.MENTORS, mentorId);
    
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    if (!mentor.stripeAccountId) {
      return res.status(404).json({ error: 'Mentor has no connected Stripe account' });
    }

    // Retrieve the balance from Stripe
    const balance = await stripe.balance.retrieve({
      stripeAccount: mentor.stripeAccountId
    });

    // Return the formatted balance
    return res.status(200).json({
      available: balance.available,
      pending: balance.pending,
      instant_available: balance.instant_available || []
    });
  } catch (error) {
    console.error('Error retrieving mentor balance:', error);
    res.status(500).json({ error: 'Failed to retrieve mentor balance' });
  }
}; 