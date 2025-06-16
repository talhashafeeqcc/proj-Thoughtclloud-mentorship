// Import Stripe with proper error handling for Netlify functions
import Stripe from 'stripe';

// For Netlify functions, environment variables are injected automatically
// No need for dotenv in production
console.log('🔄 Loading Stripe configuration...');

// Get the Stripe secret key from environment variables
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;

// Debug environment variables (without exposing sensitive data)
console.log('🔍 Environment Debug:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Available env vars containing STRIPE:', Object.keys(process.env).filter(key => key.includes('STRIPE')));
console.log('STRIPE_SECRET_KEY available:', !!process.env.STRIPE_SECRET_KEY);
console.log('VITE_STRIPE_SECRET_KEY available:', !!process.env.VITE_STRIPE_SECRET_KEY);

// Validate that the secret key exists
if (!stripeSecretKey) {
  console.error("❌ CRITICAL: Stripe secret key not found in environment variables");
  console.error("Available environment variables:", Object.keys(process.env).sort());
  console.error("You need to set STRIPE_SECRET_KEY in your Netlify environment variables");
  throw new Error("Stripe secret key is required but not found in environment");
}

// Validate the secret key format
if (!stripeSecretKey.startsWith('sk_')) {
  console.error("❌ CRITICAL: Invalid Stripe secret key format. Key should start with 'sk_'");
  console.error("Found key starts with:", stripeSecretKey.substring(0, 3));
  throw new Error("Invalid Stripe secret key format");
}

console.log("✅ Stripe secret key found and validated");
console.log("🔑 Key type:", stripeSecretKey.startsWith('sk_test_') ? 'TEST' : 'LIVE');
console.log("🔑 Key prefix:", stripeSecretKey.substring(0, 12) + "...");

// Initialize Stripe with your secret key
let stripe;
try {
  // Validate Stripe constructor
  if (typeof Stripe !== 'function') {
    console.error("❌ Stripe constructor details:");
    console.error("Type:", typeof Stripe);
    console.error("Value:", Stripe);
    console.error("Constructor name:", Stripe?.constructor?.name);
    throw new Error(`Stripe is not a constructor function. Type: ${typeof Stripe}`);
  }
  
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    typescript: false,
  });
  
  console.log("✅ Stripe initialized successfully");
  console.log("Stripe object type:", typeof stripe);
  console.log("Stripe constructor name:", stripe.constructor.name);
  console.log("Stripe has paymentIntents:", !!stripe.paymentIntents);
  console.log("paymentIntents.create type:", typeof stripe.paymentIntents?.create);
  
  // Additional validation
  if (!stripe.paymentIntents) {
    throw new Error("Stripe object missing paymentIntents property");
  }
  
  if (typeof stripe.paymentIntents.create !== 'function') {
    throw new Error(`stripe.paymentIntents.create is not a function. Type: ${typeof stripe.paymentIntents.create}`);
  }
  
  console.log("✅ All Stripe validations passed");
  
} catch (error) {
  console.error("❌ CRITICAL: Failed to initialize Stripe:", error);
  console.error("Stripe constructor:", Stripe);
  console.error("Error stack:", error.stack);
  throw new Error(`Stripe initialization failed: ${error.message}`);
}

export default stripe;
