import getStripeInstance from "./stripeConfig.js";
import { getMentorById } from "./firestoreHelpers.js";

// Netlify function for creating mentor payouts
export const handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  // Handle OPTIONS request
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  // Extract mentorId from path parameters
  const path = event.path;
  const mentorId = path.split("/").pop();

  if (!mentorId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Mentor ID is required" }),
    };
  }

  try {
    // Initialize Stripe
    const stripe = await getStripeInstance();
    
    const body = JSON.parse(event.body);
    const { amount, currency, description } = body;

    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Valid amount is required" }),
      };
    }

    console.log(
      `Creating payout of ${amount} ${
        currency || "usd"
      } for mentor: ${mentorId}`
    );

    // Get the mentor document from Firebase
    const mentor = await getMentorById(mentorId);
    
    if (!mentor) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "Mentor not found" }),
      };
    }

    if (!mentor.stripeAccountId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          error: "Mentor has no connected Stripe account. Please connect your account first." 
        }),
      };
    }

    // Create a payout using the mentor's actual Stripe account ID
    const payout = await stripe.payouts.create(
      {
        amount,
        currency: currency || "usd",
        description: description || `Payout for mentor ${mentor.name || mentorId}`,
      },
      {
        stripeAccount: mentor.stripeAccountId,
      }
    );

    console.log(`Payout created: ${payout.id}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: payout.id,
        amount: payout.amount,
        status: payout.status,
        arrivalDate: payout.arrival_date,
      }),
    };
  } catch (error) {
    console.error(`Error creating payout for mentor ${mentorId}:`, error);
    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({
        error: `Failed to create payout: ${error.message}`,
      }),
    };
  }
};
