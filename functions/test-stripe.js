import getStripeInstance from './stripeConfig.js';

export const handler = async (event, context) => {
  console.log('🧪 Stripe Test Function Started');
  
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    // Environment check
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasStripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
      hasViteStripeSecretKey: !!process.env.VITE_STRIPE_SECRET_KEY,
      stripeEnvVars: Object.keys(process.env).filter(key => key.includes('STRIPE')),
      totalEnvVars: Object.keys(process.env).length
    };

    console.log('Environment Check:', JSON.stringify(envCheck, null, 2));

    // Try to import Stripe directly
    let stripeImportResult = null;
    try {
      const StripeLib = await import('stripe');
      stripeImportResult = {
        success: true,
        hasDefault: !!StripeLib.default,
        defaultType: typeof StripeLib.default,
        defaultName: StripeLib.default?.name,
        isFunction: typeof StripeLib.default === 'function',
        moduleKeys: Object.keys(StripeLib)
      };
    } catch (importError) {
      stripeImportResult = {
        success: false,
        error: importError.message,
        stack: importError.stack
      };
    }

    // Try to use our stripe config
    let stripeConfigResult = null;
    try {
      console.log('Testing stripe config...');
      const stripe = await getStripeInstance();
      stripeConfigResult = {
        success: true,
        hasInstance: !!stripe,
        instanceType: typeof stripe,
        constructorName: stripe?.constructor?.name,
        hasPaymentIntents: !!stripe?.paymentIntents,
        paymentIntentsType: typeof stripe?.paymentIntents,
        hasCreateMethod: typeof stripe?.paymentIntents?.create === 'function',
        createMethodType: typeof stripe?.paymentIntents?.create
      };
      
      // Try to list available methods
      if (stripe?.paymentIntents) {
        stripeConfigResult.paymentIntentsMethods = Object.getOwnPropertyNames(stripe.paymentIntents)
          .filter(prop => typeof stripe.paymentIntents[prop] === 'function');
      }
      
    } catch (configError) {
      stripeConfigResult = {
        success: false,
        error: configError.message,
        stack: configError.stack
      };
    }

    const result = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      stripeDirectImport: stripeImportResult,
      stripeConfig: stripeConfigResult,
      netlifyContext: {
        functionName: context.functionName,
        functionVersion: context.functionVersion,
        invokedFunctionArn: context.invokedFunctionArn,
        awsRequestId: context.awsRequestId
      }
    };

    console.log('🔍 Full diagnostic result:', JSON.stringify(result, null, 2));

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result, null, 2)
    };

  } catch (error) {
    console.error('❌ Test function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Test function failed',
        message: error.message,
        stack: error.stack
      }, null, 2)
    };
  }
}; 