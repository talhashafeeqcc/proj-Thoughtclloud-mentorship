import getStripeInstance from "./stripeConfig.js";

// Netlify function for processing refunds
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
    // Initialize Stripe
    const stripe = await getStripeInstance();
    const body = JSON.parse(event.body);
    const { paymentIntentId, amount, reason } = body;

    if (!paymentIntentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Payment Intent ID is required" }),
      };
    }

    console.log(`Processing refund for PaymentIntent: ${paymentIntentId}`);

    // Create the refund
    const refundParams = {
      payment_intent: paymentIntentId,
      reason: reason || "requested_by_customer",
    };

    // Add amount if specified (for partial refunds)
    if (amount && amount > 0) {
      refundParams.amount = amount;
      console.log(`Partial refund amount: ${amount} cents`);
    } else {
      console.log("Processing full refund");
    }

    const refund = await stripe.refunds.create(refundParams);

    console.log(`Refund processed successfully: ${refund.id}`);
    console.log(`Status: ${refund.status}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
      }),
    };
  } catch (error) {
    console.error("Error creating refund:", error);
    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({
        error: `Failed to create refund: ${error.message}`,
      }),
    };
  }
};
