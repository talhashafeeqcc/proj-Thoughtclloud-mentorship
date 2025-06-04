import { Request, Response } from 'express';
import stripe from './stripeConfig.js';

export const createPaymentIntentHandler = async (req: Request, res: Response) => {
  // Explicitly add CORS headers for this critical endpoint
  const allowedOrigins = [
    'https://thoughtcloud-mentorship.netlify.app',
    'https://devserver-main--thoughtcloud-mentorship.netlify.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  // const origin = req.headers.origin;
  
  // console.log(`Payment intent request from origin: ${origin || 'undefined'}`);
  
  // // Always set CORS headers, even if origin is undefined
  res.header('Access-Control-Allow-Origin', allowedOrigins.join(','));
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');
  
  console.log('CORS headers set for payment intent endpoint');
  
  // Handle OPTIONS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Responding to OPTIONS preflight request for payment intent');
    return res.status(200).end();
  }

  console.log('Processing payment intent request:', req.body);
  
  try {
    const { amount, currency, description, mentorStripeAccountId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    console.log(`Creating payment intent: ${amount} ${currency || 'usd'} for ${description}`);

    // Create a payment intent with capture_method: manual
    // This allows us to authorize the payment without capturing it immediately
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // amount in cents
      currency: currency || 'usd',
      description,
      capture_method: 'manual', // This puts the payment in an authorized but uncaptured state
      metadata: {
        description,
        mentorStripeAccountId
      }
    });

    console.log(`Payment intent created: ${paymentIntent.id}`);

    // Return the client secret to the client
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
};