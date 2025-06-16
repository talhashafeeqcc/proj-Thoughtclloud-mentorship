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

// Initialize Stripe with better error handling
let stripe = null;
let stripeInitialized = false;

export async function getStripeInstance() {
  if (stripeInitialized && stripe) {
    return stripe;
  }

  try {
    console.log('📦 Attempting to import Stripe...');
    
    // Try different import methods for better compatibility
    let StripeConstructor;
    
    try {
      // Method 1: Dynamic import
      console.log('🔄 Trying dynamic import...');
      const stripeModule = await import('stripe');
      StripeConstructor = stripeModule.default;
      console.log('✅ Dynamic import successful');
      console.log('Module type:', typeof stripeModule);
      console.log('Default export type:', typeof stripeModule.default);
      console.log('Default export name:', stripeModule.default?.name);
    } catch (dynamicError) {
      console.error('❌ Dynamic import failed:', dynamicError.message);
      
      try {
        // Method 2: Static import fallback
        console.log('🔄 Trying require fallback...');
        StripeConstructor = require('stripe');
        console.log('✅ Require fallback successful');
      } catch (requireError) {
        console.error('❌ Require fallback failed:', requireError.message);
        throw new Error(`All import methods failed: Dynamic: ${dynamicError.message}, Require: ${requireError.message}`);
      }
    }
    
    // Validate the constructor
    if (!StripeConstructor) {
      throw new Error('Stripe constructor is null or undefined');
    }
    
    if (typeof StripeConstructor !== 'function') {
      console.error('❌ Stripe constructor validation failed:');
      console.error('Type:', typeof StripeConstructor);
      console.error('Value:', StripeConstructor);
      console.error('Constructor name:', StripeConstructor?.constructor?.name);
      throw new Error(`Stripe is not a constructor function. Type: ${typeof StripeConstructor}`);
    }
    
    console.log('✅ Stripe constructor validated');
    console.log('Constructor name:', StripeConstructor.name);
    
    // Initialize Stripe instance
    console.log('🔧 Creating Stripe instance...');
    stripe = new StripeConstructor(stripeSecretKey, {
      apiVersion: '2023-10-16',
      typescript: false,
    });
    
    console.log("✅ Stripe instance created successfully");
    console.log("Instance type:", typeof stripe);
    console.log("Instance constructor name:", stripe.constructor.name);
    console.log("Instance has paymentIntents:", !!stripe.paymentIntents);
    console.log("paymentIntents type:", typeof stripe.paymentIntents);
    console.log("paymentIntents.create type:", typeof stripe.paymentIntents?.create);
    
    // Additional validation
    if (!stripe.paymentIntents) {
      throw new Error("Stripe instance missing paymentIntents property");
    }
    
    if (typeof stripe.paymentIntents.create !== 'function') {
      throw new Error(`stripe.paymentIntents.create is not a function. Type: ${typeof stripe.paymentIntents.create}`);
    }
    
    console.log("✅ All Stripe validations passed");
    stripeInitialized = true;
    
    return stripe;
    
  } catch (error) {
    console.error("❌ CRITICAL: Failed to create Stripe instance:", error);
    console.error("Error stack:", error.stack);
    throw new Error(`Stripe initialization failed: ${error.message}`);
  }
}

// Default export for backward compatibility
export default getStripeInstance;
