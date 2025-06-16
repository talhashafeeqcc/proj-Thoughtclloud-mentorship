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

export const getStripeInstance = async () => {
  if (stripeInitialized && stripe) {
    return stripe;
  }

  try {
    console.log('📦 Attempting to import Stripe...');
    
    let StripeConstructor;

    // Helper to extract constructor from a module/object
    const extractStripeCtor = (mod) => {
      if (!mod) return undefined;
      if (typeof mod === 'function') return mod; // CommonJS default export
      if (typeof mod.default === 'function') return mod.default; // ESM default export is fn
      if (typeof mod.Stripe === 'function') return mod.Stripe; // named export
      if (mod.default && typeof mod.default.Stripe === 'function') return mod.default.Stripe; // nested
      return undefined;
    };
    
    try {
      // Method 1: Dynamic import (ESM)
      console.log('🔄 Trying dynamic import of "stripe" ...');
      const stripeModule = await import('stripe');
      StripeConstructor = extractStripeCtor(stripeModule);
      if (StripeConstructor) {
        console.log('✅ Dynamic import provided valid constructor');
      } else {
        console.warn('⚠️ Dynamic import succeeded but did not return constructor. Trying fallback...');
      }
    } catch (dynamicError) {
      console.error('❌ Dynamic import failed:', dynamicError.message);
    }

    // Fallback to require if constructor still not found
    if (!StripeConstructor) {
      console.log('🔄 Attempting require fallback for "stripe" ...');
      try {
        // Use createRequire to support ESM
        const { createRequire } = await import('module');
        const req = createRequire(import.meta.url);
        const reqStripe = req('stripe');
        StripeConstructor = extractStripeCtor(reqStripe);
        if (StripeConstructor) {
          console.log('✅ Require fallback provided valid constructor');
        } else {
          console.error('❌ Require fallback did not return constructor');
        }
      } catch (requireError) {
        console.error('❌ Require fallback failed:', requireError.message);
      }
    }

    // Final validation
    if (!StripeConstructor || typeof StripeConstructor !== 'function') {
      throw new Error(`Stripe constructor could not be resolved. Final type: ${typeof StripeConstructor}`);
    }
    console.log('✅ Stripe constructor resolved successfully');
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
};

