import { useStripe } from '@stripe/react-stripe-js';
import { FC, useEffect, useRef } from 'react';
import Stripe from 'stripe';

export const ConfirmPayment: FC<{
  paymentIntent:
    | Pick<
        Stripe.PaymentIntent,
        'next_action' | 'id' | 'client_secret' | 'payment_method_options'
      >
    | null
    | undefined;
}> = ({ paymentIntent }) => {
  const stripe = useStripe();
  const hasHandleNextAction = useRef(false);
  useEffect(() => {
    if (hasHandleNextAction.current) return;
    if (!paymentIntent) return;
    if (!stripe) return;
    if (!paymentIntent.next_action || !paymentIntent.client_secret) return;
    hasHandleNextAction.current = true;
    stripe.handleNextAction({ clientSecret: paymentIntent.client_secret });
  }, [paymentIntent, stripe]);

  return null;
};
