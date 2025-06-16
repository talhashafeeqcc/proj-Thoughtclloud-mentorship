import stripe from './stripeConfig.js';

// Netlify function for creating payment intents
export const handler = async (event, context) => {
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  // Handle OPTIONS request (preflight CORS)
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    // Check if Stripe is properly configured
    if (!stripe) {
      console.error("Stripe is not properly configured");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Payment service configuration error" }),
      };
    }

    const body = JSON.parse(event.body);
    const { amount, currency, description, mentorStripeAccountId } = body;

    if (!amount || amount <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Valid amount is required" }),
      };
    }

    console.log(
      `Creating payment intent: ${amount} ${
        currency || "usd"
      } for ${description}`
    );

    // Create a payment intent with capture_method: manual
    // This allows us to authorize the payment without capturing it immediately
    const paymentIntent = await stripe.paymentIntents.create({
      amount, // amount in cents
      currency: currency || "usd",
      description,
      capture_method: "manual", // This puts the payment in an authorized but uncaptured state
      metadata: {
        description,
        mentorStripeAccountId,
      },
    });

    console.log(`Payment intent created: ${paymentIntent.id}`);

    // Return the client secret to the client
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      }),
    };
  } catch (error) {
    console.error("Error creating payment intent:", error);
    console.error("Error details:", error.message);
    console.error("Error code:", error.code);
    console.error("Error type:", error.type);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Failed to create payment intent",
        details: error.message || "Unknown error"
      }),
    };
  }
};
