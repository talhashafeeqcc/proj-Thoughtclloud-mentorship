import stripe from "./stripeConfig.js";

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

    // In a real implementation, you would first query your database to get the mentor's Stripe account ID
    // For example: const mentorStripeAccountId = await getMentorStripeAccountId(mentorId);

    // For this example, we're assuming the mentorId passed is actually the Stripe account ID
    const mentorStripeAccountId = mentorId;

    // Retrieve the balance from Stripe
    const balance = await stripe.balance.retrieve({
      stripeAccount: mentorStripeAccountId,
    });

    console.log(`Balance retrieved for mentor: ${mentorId}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        available: balance.available,
        pending: balance.pending,
      }),
    };
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
