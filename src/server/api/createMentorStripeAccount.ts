import { Request, Response } from 'express';
import stripe from './stripeConfig';
import { getDocument, updateDocument, COLLECTIONS } from '../../services/firebase';

// Define the interface for a mentor document
interface MentorDocument {
  id: string;
  userId?: string;
  stripeAccountId?: string;
  email?: string;
  [key: string]: any;
}

// Define the interface for a user document
interface UserDocument {
  id: string;
  email: string;
  name: string;
  role: string;
  [key: string]: any;
}

export const createMentorStripeAccountHandler = async (req: Request, res: Response) => {
  try {
    const { mentorId } = req.params;

    if (!mentorId) {
      return res.status(400).json({ error: 'Mentor ID is required' });
    }

    // Get the mentor document
    const mentor = await getDocument<MentorDocument>(COLLECTIONS.MENTORS, mentorId);
    
    if (!mentor) {
      return res.status(404).json({ error: 'Mentor not found' });
    }

    // If mentor already has a Stripe account, return it
    if (mentor.stripeAccountId) {
      return res.status(200).json({ 
        accountId: mentor.stripeAccountId,
        message: 'Mentor already has a Stripe account'
      });
    }

    // Get the user associated with this mentor to access email
    const user = mentor.userId 
      ? await getDocument<UserDocument>(COLLECTIONS.USERS, mentor.userId)
      : null;

    if (!user) {
      return res.status(404).json({ error: 'User associated with mentor not found' });
    }

    // Create a Stripe Connect Express account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US', // Default to US, can be made configurable
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      business_profile: {
        name: user.name,
        url: `${process.env.VITE_APP_URL || 'https://thoughtcloud-mentorship.com'}/mentor/${mentorId}`,
      },
      metadata: {
        mentorId: mentorId
      }
    });

    // Update the mentor document with the Stripe account ID
    await updateDocument(COLLECTIONS.MENTORS, mentorId, {
      stripeAccountId: account.id,
      updatedAt: Date.now()
    });

    // Create an account link for onboarding (optional for mentor)
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.VITE_APP_URL || 'https://thoughtcloud-mentorship.com'}/dashboard`,
      return_url: `${process.env.VITE_APP_URL || 'https://thoughtcloud-mentorship.com'}/dashboard`,
      type: 'account_onboarding',
    });

    return res.status(201).json({
      accountId: account.id,
      accountLink: accountLink.url
    });
  } catch (error) {
    console.error('Error creating Stripe account for mentor:', error);
    res.status(500).json({ error: 'Failed to create Stripe account' });
  }
}; 