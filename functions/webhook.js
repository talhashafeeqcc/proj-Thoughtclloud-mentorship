import getStripeInstance from './stripeConfig.js';

// Set the webhook signing secret provided by Stripe
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.VITE_STRIPE_WEBHOOK_SECRET;

// Netlify function for handling Stripe webhooks
export const handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
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

  const sig = event.headers["stripe-signature"];
  const rawBody = event.body; // Netlify provides the raw body

  try {
    // Initialize Stripe
    const stripe = await getStripeInstance();
    
    let stripeEvent;

    // Verify the event came from Stripe
    if (endpointSecret && sig) {
      stripeEvent = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        endpointSecret
      );
      console.log("✅ Webhook signature verified");
    } else {
      // If we don't have the secret (dev environment), just parse the event
      stripeEvent = JSON.parse(rawBody);
      console.warn(
        "⚠️ Webhook signature not verified (missing secret or signature)"
      );
    }

    // Handle the event based on its type
    console.log(`Received event of type: ${stripeEvent.type}`);

    switch (stripeEvent.type) {
      case "payment_intent.succeeded":
        const paymentIntent = stripeEvent.data.object;
        console.log(`PaymentIntent ${paymentIntent.id} was successful!`);
        // You could update your database here to mark the payment as succeeded
        break;

      case "payment_intent.payment_failed":
        const failedPayment = stripeEvent.data.object;
        console.log(`Payment failed for PaymentIntent ${failedPayment.id}`);
        // Update your database to mark the payment as failed
        break;

      case "payment_intent.canceled":
        const canceledPayment = stripeEvent.data.object;
        console.log(`PaymentIntent ${canceledPayment.id} was canceled`);
        // Update your database to mark the payment as canceled
        break;

      case "account.updated":
        const account = stripeEvent.data.object;
        console.log(`Stripe account ${account.id} was updated`);
        // Update mentor account status in your database
        break;

      default:
        console.log(`Unhandled event type: ${stripeEvent.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ received: true }),
    };
  } catch (error) {
    console.error("Webhook error:", error);
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: `Webhook Error: ${error.message}` }),
    };
  }
};
