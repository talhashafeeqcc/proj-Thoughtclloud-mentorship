import stripe from './stripeConfig.js';

// Netlify function for creating mentor Stripe accounts
export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Handle OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Extract mentorId from path parameters
  const path = event.path;
  const mentorId = path.split('/').pop();

  if (!mentorId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Mentor ID is required' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    const { email, country, business_type } = body;

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' })
      };
    }

    console.log(`Creating Stripe account for mentor: ${mentorId}`);
    
    // Create a standard Stripe account for the mentor
    const account = await stripe.accounts.create({
      type: 'standard',
      email,
      country: country || 'US',
      business_type: business_type || 'individual',
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        mentorId
      }
    });

    console.log(`Stripe account created for mentor: ${account.id}`);
    
    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/mentor/onboarding/refresh`,
      return_url: `${process.env.VITE_APP_URL || 'http://localhost:3000'}/mentor/onboarding/complete`,
      type: 'account_onboarding',
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        accountId: account.id,
        accountLink: accountLink.url
      })
    };
  } catch (error) {
    console.error(`Error creating Stripe account for mentor ${mentorId}:`, error);
    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({
        error: `Failed to create Stripe account: ${error.message}`
      })
    };
  }
}; 