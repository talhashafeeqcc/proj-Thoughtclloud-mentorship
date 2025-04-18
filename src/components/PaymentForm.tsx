import React, { useState, useEffect } from 'react';
import { createPaymentIntent, confirmPayment } from '../services/stripe';
import { processPayment } from '../services/paymentService';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface PaymentFormProps {
    sessionId: string;
    amount: number;
    onSuccess: (paymentId: string) => void;
    onError: (error: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
    sessionId,
    amount,
    onSuccess,
    onError
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    
    // Initialize Stripe
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            onError('Stripe has not been initialized');
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            onError('Card element not found');
            return;
        }

        setIsLoading(true);

        try {
            // Step 1: Create a PaymentMethod
            const { error: createPaymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
                billing_details: {
                    name: name,
                }
            });

            if (createPaymentMethodError) {
                throw new Error(createPaymentMethodError.message);
            }

            if (!paymentMethod) {
                throw new Error('Failed to create payment method');
            }

            // Step 2: Process the payment using our service
            const payment = await processPayment(sessionId, amount, paymentMethod.id);

            // Step 3: Call onSuccess with the payment ID
            onSuccess(payment.id);
        } catch (error) {
            console.error('Payment error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An error occurred during payment processing';
            onError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Card element styling
    const cardElementOptions = {
        style: {
            base: {
                color: '#32325d',
                fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                fontSmoothing: 'antialiased',
                fontSize: '16px',
                '::placeholder': {
                    color: '#aab7c4'
                }
            },
            invalid: {
                color: '#fa755a',
                iconColor: '#fa755a'
            }
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Payment Details</h2>
            <form onSubmit={handleSubmit}>
                {/* Card Holder Name */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                        Card Holder Name
                    </label>
                    <input
                        id="name"
                        type="text"
                        className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                {/* Stripe Card Element */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Card Details
                    </label>
                    <div className="border rounded p-3">
                        <CardElement options={cardElementOptions} />
                    </div>
                </div>

                {/* Payment Button */}
                <div className="mt-6">
                    <button
                        type="submit"
                        className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={isLoading || !stripe}
                    >
                        {isLoading ? 'Processing...' : `Pay ${new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                        }).format(amount)}`}
                    </button>
                </div>

                {/* Test Card Info */}
                {import.meta.env.DEV && (
                    <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
                        <p className="font-semibold mb-1">Test Card Details:</p>
                        <p>Card Number: 4242 4242 4242 4242</p>
                        <p>Expiry: Any future date (e.g., 12/25)</p>
                        <p>CVC: Any 3 digits</p>
                        <p>ZIP: Any 5 digits</p>
                    </div>
                )}

                {/* Terms */}
                <p className="text-xs text-gray-500 mt-4">
                    By clicking the button above, you agree to our Terms of Service and authorize us to charge your card.
                </p>
            </form>
        </div>
    );
};

export default PaymentForm; 