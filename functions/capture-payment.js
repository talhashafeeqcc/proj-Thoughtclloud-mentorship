import stripe from "./stripeConfig.js";

// Netlify function for capturing authorized payments
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
    const { paymentIntentId, applicationFee, mentorStripeAccountId } = body;

    if (!paymentIntentId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Payment Intent ID is required" }),
      };
    }

    console.log(`Capturing payment for PaymentIntent: ${paymentIntentId}`);
    console.log(`Application fee: ${applicationFee || 0} cents`);
    console.log(
      `Mentor Stripe account ID: ${mentorStripeAccountId || "Not provided"}`
    );

    // Retrieve the payment intent to get its amount
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Calculate application fee if necessary
    let captureParams = {};
    if (applicationFee && applicationFee > 0 && mentorStripeAccountId) {
      captureParams = {
        amount_to_capture: paymentIntent.amount,
        application_fee_amount: applicationFee,
        transfer_data: {
          destination: mentorStripeAccountId,
        },
      };
    }

    // Capture the payment
    const capturedPayment = await stripe.paymentIntents.capture(
      paymentIntentId,
      captureParams
    );

    console.log(`Payment captured successfully: ${capturedPayment.id}`);
    console.log(`Status: ${capturedPayment.status}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: capturedPayment.id,
        amount: capturedPayment.amount,
        status: capturedPayment.status,
      }),
    };
  } catch (error) {
    console.error("Error capturing payment:", error);
    return {
      statusCode: error.statusCode || 500,
      headers,
      body: JSON.stringify({
        error: `Failed to capture payment: ${error.message}`,
      }),
    };
  }
};
