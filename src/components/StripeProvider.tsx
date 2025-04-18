import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '../services/stripe/config';

interface StripeProviderProps {
  children: React.ReactNode;
}

const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  // Get the cached stripe instance
  const stripePromise = getStripe();

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export default StripeProvider; 