import stripeConfig from './stripeConfig.js';

// Netlify function for creating payment intents
export const handler = async (event, context) => {
  console.log('🚀 Payment intent function started');
  console.log('HTTP Method:', event.httpMethod);
  console.log('Headers:', JSON.stringify(event.headers, null, 2));
  
  // Set CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  // Handle OPTIONS request (preflight CORS)
  if (event.httpMethod === "OPTIONS") {
    console.log('✅ Handling OPTIONS request');
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  try {
    // Initialize Stripe
    console.log('🔧 Initializing Stripe...');
    const stripe = await stripeConfig.getInstance();
    
    // Comprehensive Stripe validation
    console.log('🔍 Stripe validation:');
    console.log('Stripe object exists:', !!stripe);
    console.log('Stripe type:', typeof stripe);
    console.log('Stripe constructor name:', stripe?.constructor?.name);
    console.log('paymentIntents exists:', !!stripe?.paymentIntents);
    console.log('paymentIntents.create exists:', typeof stripe?.paymentIntents?.create);

    if (!stripe) {
      console.error("❌ CRITICAL: Stripe object is null/undefined");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "Payment service configuration error",
          details: "Stripe object is not available"
        }),
      };
    }

    if (!stripe.paymentIntents) {
      console.error("❌ CRITICAL: stripe.paymentIntents is not available");
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "Payment service configuration error",
          details: "stripe.paymentIntents is not available"
        }),
      };
    }

    if (typeof stripe.paymentIntents.create !== 'function') {
      console.error("❌ CRITICAL: stripe.paymentIntents.create is not a function");
      console.error("Type of create:", typeof stripe.paymentIntents.create);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ 
          error: "Payment service configuration error",
          details: "stripe.paymentIntents.create is not a function"
        }),
      };
    }

    // Parse and validate request body
    console.log('📦 Request body:', event.body);
    console.log('📦 Request body type:', typeof event.body);
    console.log('📦 Request body length:', event.body?.length);
    
    let body;
    
    // Check if body exists and is not empty
    if (!event.body || event.body.trim() === '') {
      console.error("❌ Request body is empty or missing");
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Request body is required" }),
      };
    }
    
    try {
      body = JSON.parse(event.body);
    } catch (parseError) {
      console.error("❌ Invalid JSON in request body:", parseError);
      console.error("❌ Request body content:", event.body);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Invalid JSON in request body" }),
      };
    }

    const { amount, currency, description, mentorStripeAccountId } = body;
    console.log('💰 Payment details:', { amount, currency, description, mentorStripeAccountId });

    if (!amount || amount <= 0) {
      console.error("❌ Invalid amount:", amount);
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Valid amount is required" }),
      };
    }

    console.log(
      `💳 Creating payment intent: ${amount} ${
        currency || "usd"
      } for ${description}`
    );

    // Create a payment intent with capture_method: manual
    const paymentIntentData = {
      amount, // amount in cents
      currency: currency || "usd",
      description,
      capture_method: "manual", // This puts the payment in an authorized but uncaptured state
      metadata: {
        description,
        mentorStripeAccountId,
      },
    };

    console.log('📋 Payment intent data:', JSON.stringify(paymentIntentData, null, 2));

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    console.log(`✅ Payment intent created successfully: ${paymentIntent.id}`);
    console.log('Payment intent status:', paymentIntent.status);

    // Return the client secret to the client
    const response = {
      clientSecret: paymentIntent.client_secret,
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status,
    };

    console.log('📤 Sending response:', JSON.stringify(response, null, 2));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error("❌ CRITICAL ERROR in payment intent creation:");
    console.error("Error message:", error.message);
    console.error("Error code:", error.code);
    console.error("Error type:", error.type);
    console.error("Error stack:", error.stack);
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Additional Stripe-specific error handling
    if (error.type === 'StripeCardError') {
      console.error("Stripe Card Error - this is a card issue");
    } else if (error.type === 'StripeInvalidRequestError') {
      console.error("Stripe Invalid Request Error - check the request parameters");
    } else if (error.type === 'StripeAPIError') {
      console.error("Stripe API Error - there was an issue with Stripe's API");
    } else if (error.type === 'StripeConnectionError') {
      console.error("Stripe Connection Error - network issue");
    } else if (error.type === 'StripeAuthenticationError') {
      console.error("Stripe Authentication Error - check your API key");
    } else {
      console.error("Unknown error type");
    }
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: "Failed to create payment intent",
        details: error.message || "Unknown error",
        errorType: error.type || "Unknown",
        errorCode: error.code || "Unknown"
      }),
    };
  }
};
