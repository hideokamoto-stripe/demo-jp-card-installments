import { FC } from 'react';
import { Form, useSubmit } from '@remix-run/react';
import { useElements, useStripe } from '@stripe/react-stripe-js';
import { CardElement } from '@stripe/react-stripe-js';

import { Button } from '~/components/ui/button';
export const CardForm: FC<{
  customerId: string;
  setError: (error: string) => void;
}> = ({ customerId, setError }) => {
  const submit = useSubmit();
  const elements = useElements();
  const stripe = useStripe();
  if (!elements || !stripe) return null;
  return (
    <Form
      method="POST"
      onSubmit={async (e) => {
        e.preventDefault();
        const cardElement = elements?.getElement(CardElement);
        if (!cardElement) return;
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
      }}
    >
      <CardElement
        className="my-4 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        options={{
          hidePostalCode: true,
        }}
      />
      <Button type="submit" className="w-full">
        Register card
      </Button>
    </Form>
  );
};
