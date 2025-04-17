import { Request, Response } from 'express';
import stripe from './stripeConfig';

// Set the webhook signing secret provided by Stripe CLI
const endpointSecret = process.env.VITE_STRIPE_WEBHOOK_SECRET || 
  'whsec_7c86e9664e7ef6bf9d733dd5bed87664056f6bb4b04d11412ec8c13621025cd2';

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify the event came from Stripe
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      console.log('✅ Webhook signature verified');
    } else {
      // If we don't have the secret (dev environment), just parse the event
      event = JSON.parse(req.body.toString());
      console.warn('⚠️ Webhook signature not verified (missing secret or signature)');
    }

    // Handle the event based on its type
    console.log(`Received event of type: ${event.type}`);
    
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(`PaymentIntent ${paymentIntent.id} was successful!`);
        // You could update your database here to mark the payment as succeeded
        break;
        
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log(`Payment failed for PaymentIntent ${failedPayment.id}`);
        // Update your database to mark the payment as failed
        break;
        
      case 'payment_intent.canceled':
        const canceledPayment = event.data.object;
        console.log(`PaymentIntent ${canceledPayment.id} was canceled`);
        // Update your database to mark the payment as canceled
        break;
        
      case 'account.updated':
        const account = event.data.object;
        console.log(`Stripe account ${account.id} was updated`);
        // Update mentor account status in your database
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
}; 