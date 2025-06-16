import { getStripeInstance } from "./stripeConfig.js";
import { getMentorById } from "./firestoreHelpers.js";

// Netlify function for getting a mentor's Stripe balance
export const handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
  };

  // Handle OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // For GET requests, we need to extract parameters from the path
  const path = event.path;
  const mentorId = path.split("/").pop(); // Extract mentorId from the path

  if (!mentorId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Mentor ID is required" }),
    };
  }

  try {
    console.log(`Retrieving balance for mentor: ${mentorId}`);

    // Initialize Stripe
    const stripe = await getStripeInstance();

    // Get the mentor document from Firebase
    const mentor = await getMentorById(mentorId);
    
    if (!mentor) {
      console.log(`Mentor with ID ${mentorId} not found`);
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ 
          error: "Mentor not found",
          available: [{ amount: 0, currency: 'usd' }],
          pending: [{ amount: 0, currency: 'usd' }],
          connected: false
        }),
      };
    }

    // Check if mentor has a connected Stripe account
    if (!mentor.stripeAccountId) {
      console.log(`Mentor ${mentorId} doesn't have a connected Stripe account`);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          available: [{ amount: 0, currency: 'usd' }],
          pending: [{ amount: 0, currency: 'usd' }],
          connected: false,
          message: "Stripe account not connected. Connect your account to start receiving payments."
        }),
      };
    }

    try {
      // Try to retrieve the balance from Stripe using the mentor's actual Stripe account ID
      const balance = await stripe.balance.retrieve({
        stripeAccount: mentor.stripeAccountId,
      });

      console.log(`Balance retrieved for mentor: ${mentorId} (Stripe account: ${mentor.stripeAccountId})`);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          available: balance.available,
          pending: balance.pending,
          instant_available: balance.instant_available || [],
          connected: true,
          stripeAccountId: mentor.stripeAccountId
        }),
      };
    } catch (stripeError) {
      // If Stripe account doesn't exist or is invalid, return error with helpful message
      console.error(`Stripe error for mentor ${mentorId}:`, stripeError);
      
      // Check if it's an account not found error
      if (stripeError.code === 'account_invalid' || stripeError.code === 'account_not_found') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            available: [{ amount: 0, currency: 'usd' }],
            pending: [{ amount: 0, currency: 'usd' }],
            connected: false,
            message: "Stripe account is invalid or not found. Please reconnect your account.",
            error: stripeError.message
          }),
        };
      }

      // For other Stripe errors, return a generic error
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          available: [{ amount: 0, currency: 'usd' }],
          pending: [{ amount: 0, currency: 'usd' }],
          connected: false,
          message: "Unable to retrieve balance. Please try again later.",
          error: stripeError.message
        }),
      };
    }
  } catch (error) {
    console.error(`Error retrieving balance for mentor ${mentorId}:`, error);
    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({
        error: `Failed to retrieve mentor balance: ${error.message}`,
      }),
    };
  }
};
