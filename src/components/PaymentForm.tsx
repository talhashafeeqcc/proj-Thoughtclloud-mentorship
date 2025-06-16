import React, { useState, useEffect } from 'react';
import { createPaymentIntent, confirmPayment } from '../services/stripe';
import { processPayment } from '../services/paymentService';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { motion } from 'framer-motion';
import { FaCreditCard, FaLock } from 'react-icons/fa';

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
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    // Initialize Stripe
    const stripe = useStripe();
    const elements = useElements();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!stripe || !elements) {
            setErrorMessage('Stripe has not been initialized. Please try again later.');
            onError('Stripe has not been initialized');
            return;
        }

        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setErrorMessage('Card input not found. Please reload the page and try again.');
            onError('Card element not found');
            return;
        }

        setIsLoading(true);

        try {
            // Create a fresh PaymentMethod from the card element
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

            console.log('Created fresh PaymentMethod:', paymentMethod.id);

            // Process the payment using our service (this will handle PaymentIntent creation and confirmation)
            const payment = await processPayment(sessionId, amount, paymentMethod.id);
            
            // Call onSuccess with the payment ID
            onSuccess(payment.id);
        } catch (error) {
            console.error('Payment error:', error);
            const errorMessage = error instanceof Error ? error.message : 'An error occurred during payment processing';
            setErrorMessage(errorMessage);
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
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md mx-auto border border-gray-100 dark:border-gray-700"
        >
            <div className="flex items-center gap-2 mb-6">
                <FaCreditCard className="text-indigo-600 dark:text-indigo-400 text-xl" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Details</h2>
            </div>
            
            {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
                    <p className="text-sm">{errorMessage}</p>
                </div>
            )}
            
            <form onSubmit={handleSubmit}>
                {/* Card Holder Name */}
                <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2" htmlFor="name">
                        Card Holder Name
                    </label>
                    <motion.input
                        whileFocus={{ scale: 1.01 }}
                        transition={{ duration: 0.2 }}
                        id="name"
                        type="text"
                        className="appearance-none border dark:border-gray-600 rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 dark:bg-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-400"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>

                {/* Stripe Card Element */}
                <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2">
                        Card Details
                    </label>
                    <div className="border dark:border-gray-600 rounded p-3 dark:bg-gray-700">
                        <CardElement options={cardElementOptions} />
                    </div>
                </div>

                {/* Payment Button */}
                <div className="mt-6">
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className={`w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 shadow-sm transition-colors flex items-center justify-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        disabled={isLoading || !stripe}
                    >
                        {isLoading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Processing...
                            </span>
                        ) : (
                            <span className="flex items-center">
                                <FaLock className="mr-2 text-sm" />
                                {`Pay ${new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD'
                                }).format(amount)}`}
                            </span>
                        )}
                    </motion.button>
                </div>

                {/* Test Card Info */}
                {import.meta.env.DEV && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded text-xs"
                    >
                        <p className="font-semibold mb-1 dark:text-gray-200">Test Card Details:</p>
                        <p className="dark:text-gray-300">Card Number: 4242 4242 4242 4242</p>
                        <p className="dark:text-gray-300">Expiry: Any future date (e.g., 12/25)</p>
                        <p className="dark:text-gray-300">CVC: Any 3 digits</p>
                        <p className="dark:text-gray-300">ZIP: Any 5 digits</p>
                    </motion.div>
                )}

                {/* Terms */}
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-4">
                    By clicking the button above, you agree to our Terms of Service and authorize us to charge your card.
                </p>
            </form>
        </motion.div>
    );
};

export default PaymentForm; 