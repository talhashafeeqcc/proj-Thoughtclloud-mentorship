import stripe from "./stripeConfig.js";

// Netlify function for creating Stripe Connect accounts
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

  try {
    const body = JSON.parse(event.body);
    const { email, country, type } = body;

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Email is required" }),
      };
    }

    console.log(
      `Creating Stripe Connect account for ${email} in ${country || "US"}`
    );

    // Create a new Stripe Connect account
    const account = await stripe.accounts.create({
      type: type || "express", // 'express' for simplified onboarding
      country: country || "US",
      email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    });

    console.log(`Stripe Connect account created: ${account.id}`);

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${
        process.env.VITE_APP_URL || "http://localhost:3000"
      }/onboarding/refresh`,
      return_url: `${
        process.env.VITE_APP_URL || "http://localhost:3000"
      }/onboarding/complete`,
      type: "account_onboarding",
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        accountId: account.id,
        accountLink: accountLink.url,
      }),
    };
  } catch (error) {
    console.error("Error creating connect account:", error);
    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({
        error: `Failed to create connect account: ${error.message}`,
      }),
    };
  }
};
