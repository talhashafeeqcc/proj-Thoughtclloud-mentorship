import { Request, Response } from 'express';
import stripe from './stripeConfig.js';
import { getDocument, updateDocument, COLLECTIONS } from '../../services/firebase/firestore.js';

// Define the interface for a mentor document
interface MentorDocument {
  id: string;
  userId?: string;
  stripeAccountId?: string;
  [key: string]: any;
}

export const createConnectAccountHandler = async (req: Request, res: Response) => {
  try {
    const { mentorId, email, country } = req.body;

    if (!mentorId || !email) {
      return res.status(400).json({ error: 'Mentor ID and email are required' });
    }

    // Check if mentor already has a Stripe account
    const mentor = await getDocument<MentorDocument>(COLLECTIONS.MENTORS, mentorId);
    
    if (mentor && mentor.stripeAccountId) {
      return res.status(200).json({ 
        accountId: mentor.stripeAccountId,
        message: 'Mentor already has a Stripe account'
      });
    }

    // Create an Express connected account (more suitable for our use case)
    const account = await stripe.accounts.create({
      type: 'express',
      email,
      country: country || 'US',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        mentorId
      }
    });

    // Store the Stripe account ID in Firebase
    if (mentor) {
      await updateDocument(COLLECTIONS.MENTORS, mentorId, {
        stripeAccountId: account.id,
        updatedAt: Date.now()
      });
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.protocol}://${req.get('host')}/dashboard`,
      return_url: `${req.protocol}://${req.get('host')}/dashboard`,
      type: 'account_onboarding',
    });

    // Return the account info and onboarding link
    res.status(201).json({
      accountId: account.id,
      status: account.details_submitted ? 'complete' : 'pending',
      accountLink: accountLink.url
    });
  } catch (error) {
    console.error('Error creating Connect account:', error);
    res.status(500).json({ error: 'Failed to create Connect account' });
  }
}; 