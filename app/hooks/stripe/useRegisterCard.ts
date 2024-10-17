import { useCallback } from 'react';
import { useSubmit } from '@remix-run/react';
import { useElements, useStripe } from '@stripe/react-stripe-js';
import { CardElement } from '@stripe/react-stripe-js';

export const useRegisterCard = ({
  setError,
  customerId,
}: {
  setError: (message: string) => void;
  customerId?: string;
}) => {
  const submit = useSubmit();
  const elements = useElements();
  const stripe = useStripe();
  const handleRegisterCard = useCallback(async () => {
    const cardElement = elements?.getElement(CardElement);
    if (!cardElement) return;
    if (!stripe) return;
    if (!customerId) {
      throw new Error('customerId is required');
    }
    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
    });
    if (error && error.message) {
      setError(error.message);
      return;
    }
    if (!paymentMethod) return;
    const formData = new FormData();
    formData.append('payment_method_id', paymentMethod.id);
    formData.append('action_type', 'register_card');
    formData.append('customer_id', customerId);
    submit(formData, {
      method: 'POST',
    });
  }, [elements, stripe, customerId, setError, submit]);
  return {
    handleRegisterCard,
  };
};
