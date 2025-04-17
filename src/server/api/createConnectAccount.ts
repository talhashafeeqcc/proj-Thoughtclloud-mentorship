import { Request, Response } from 'express';
import stripe from './stripeConfig';

export const createConnectAccountHandler = async (req: Request, res: Response) => {
  try {
    const { mentorId, email, country } = req.body;

    if (!mentorId || !email) {
      return res.status(400).json({ error: 'Mentor ID and email are required' });
    }

    // Create a Standard connected account
    const account = await stripe.accounts.create({
      type: 'standard',
      email,
      country: country || 'US',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        mentorId
      }
    });

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.protocol}://${req.get('host')}/onboarding/refresh`,
      return_url: `${req.protocol}://${req.get('host')}/onboarding/complete`,
      type: 'account_onboarding',
    });

    // Return the account info and onboarding link
    res.status(200).json({
      accountId: account.id,
      status: account.details_submitted ? 'complete' : 'pending',
      accountLink: accountLink.url
    });
  } catch (error) {
    console.error('Error creating Connect account:', error);
    res.status(500).json({ error: 'Failed to create Connect account' });
  }
}; 