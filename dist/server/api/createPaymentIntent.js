import stripe from './stripeConfig';
export const createPaymentIntentHandler = async (req, res) => {
    try {
        const { amount, currency, description, mentorStripeAccountId } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: 'Valid amount is required' });
        }
        // Create a payment intent with capture_method: manual
        // This allows us to authorize the payment without capturing it immediately
        const paymentIntent = await stripe.paymentIntents.create({
            amount, // amount in cents
            currency: currency || 'usd',
            description,
            capture_method: 'manual', // This puts the payment in an authorized but uncaptured state
            metadata: {
                description,
                mentorStripeAccountId
            }
        });
        // Return the client secret to the client
        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status
        });
    }
    catch (error) {
        console.error('Error creating payment intent:', error);
        res.status(500).json({ error: 'Failed to create payment intent' });
    }
};
