// For Netlify functions, environment variables are injected automatically
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

// Simplified Stripe initialization -----------------------------------
import Stripe from 'stripe';

// Initialize Stripe once at Cold-start time and reuse the instance for every invocation.
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  // We are in a JavaScript (not TypeScript) file, so disable type checks
  typescript: false,
});

console.log('✅ Stripe instance created (simplified initialisation)');

// Export a thin helper that always returns the already-initialised instance.
export const getStripeInstance = async () => stripe;
// --------------------------------------------------------------------

