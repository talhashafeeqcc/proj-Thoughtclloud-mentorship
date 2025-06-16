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

    // Try to import Stripe
    let stripeImportResult = null;
    try {
      const StripeLib = await import('stripe');
      stripeImportResult = {
        success: true,
        hasDefault: !!StripeLib.default,
        type: typeof StripeLib.default,
        constructor: StripeLib.default?.name
      };
    } catch (importError) {
      stripeImportResult = {
        success: false,
        error: importError.message
      };
    }

    // Try to import our stripe config
    let stripeConfigResult = null;
    try {
      const stripeConfig = await import('./stripeConfig.js');
      stripeConfigResult = {
        success: true,
        hasDefault: !!stripeConfig.default,
        type: typeof stripeConfig.default,
        hasPaymentIntents: !!stripeConfig.default?.paymentIntents
      };
    } catch (configError) {
      stripeConfigResult = {
        success: false,
        error: configError.message
      };
    }

    const result = {
      timestamp: new Date().toISOString(),
      environment: envCheck,
      stripeImport: stripeImportResult,
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