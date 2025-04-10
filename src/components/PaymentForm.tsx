import React, { useState } from 'react';
import { getStripe } from '../services/stripe/config';
import { createPaymentIntent, confirmPayment } from '../services/stripe';
import { processPayment } from '../services/paymentService';

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
    const [paymentMethod, setPaymentMethod] = useState<string>('');
    const [cardNumber, setCardNumber] = useState<string>('');
    const [expiry, setExpiry] = useState<string>('');
    const [cvc, setCvc] = useState<string>('');
    const [name, setName] = useState<string>('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!cardNumber || !expiry || !cvc || !name) {
            onError('Please fill in all payment details');
            return;
        }

        setIsLoading(true);

        try {
            // In a real implementation, we would use Stripe.js to collect payment method details
            // and create a real payment method. For this demo, we're simulating the process.

            // 1. Simulate creating a payment method (in real code, this would use Stripe Elements)
            const paymentMethodId = `pm_${Math.random().toString(36).substring(2, 15)}`;
            setPaymentMethod(paymentMethodId);

            // 2. Process the payment with our backend
            const payment = await processPayment(sessionId, amount, paymentMethodId);

            // 3. Call the success callback with the payment ID
            onSuccess(payment.id);
        } catch (error) {
            console.error('Payment error:', error);
            onError(error.message || 'An error occurred during payment processing');
        } finally {
            setIsLoading(false);
        }
    };

    // Format card number with spaces
    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length) {
            return parts.join(' ');
        } else {
            return value;
        }
    };

    // Format expiry date (MM/YY)
    const formatExpiry = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');

        if (v.length >= 3) {
            return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
        }

        return value;
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

                {/* Card Number */}
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="card">
                        Card Number
                    </label>
                    <input
                        id="card"
                        type="text"
                        className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        placeholder="4242 4242 4242 4242"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        required
                    />
                </div>

                {/* Expiry and CVC */}
                <div className="flex mb-4">
                    <div className="w-1/2 mr-2">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="expiry">
                            Expiry Date
                        </label>
                        <input
                            id="expiry"
                            type="text"
                            className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="MM/YY"
                            value={expiry}
                            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                            maxLength={5}
                            required
                        />
                    </div>
                    <div className="w-1/2 ml-2">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cvc">
                            CVC
                        </label>
                        <input
                            id="cvc"
                            type="text"
                            className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            placeholder="123"
                            value={cvc}
                            onChange={(e) => setCvc(e.target.value.replace(/[^0-9]/g, ''))}
                            maxLength={3}
                            required
                        />
                    </div>
                </div>

                {/* Payment Button */}
                <div className="mt-6">
                    <button
                        type="submit"
                        className={`w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : `Pay ${new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD'
                        }).format(amount)}`}
                    </button>
                </div>

                {/* Terms */}
                <p className="text-xs text-gray-500 mt-4">
                    By clicking the button above, you agree to our Terms of Service and authorize us to charge your card.
                </p>
            </form>
        </div>
    );
};

export default PaymentForm; 