import Stripe from "stripe";

// For Netlify functions, we don't need dotenv as environment variables are injected
// Load environment variables only in development
if (process.env.NODE_ENV !== 'production') {
  try {
    const dotenv = await import('dotenv');
    dotenv.config();
  } catch (e) {
    console.log('Dotenv not available, using process.env directly');
  }
}

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
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2023-10-16',
    typescript: false,
  });
  console.log("✅ Stripe initialized successfully");
} catch (error) {
  console.error("❌ CRITICAL: Failed to initialize Stripe:", error);
  throw new Error(`Stripe initialization failed: ${error.message}`);
}

export default stripe;
