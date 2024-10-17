import { FC, useState } from 'react';
import { Form, useSubmit } from '@remix-run/react';
import { useElements, useStripe } from '@stripe/react-stripe-js';
import { Button } from '~/components/ui/button';
import { CardField } from './CardField';
import { useRegisterCard } from '~/hooks/stripe/useRegisterCard';
import { ConfirmPayment } from './ConfirmPayment';
import { PaymentIntent } from '~/types/stripe';
import { CardInstallmentPlanField } from './CardInstallmentPlanField';

export const CardForm: FC<{
  customerId?: string;
  setError: (error: string) => void;
  paymentIntent:
    | PaymentIntent
    | null
    | undefined;
}> = ({ customerId, setError, paymentIntent }) => {
  const canOrder = !!paymentIntent?.client_secret;
  const { handleRegisterCard } = useRegisterCard({ setError, customerId });
  const submit = useSubmit();
  const elements = useElements();
  const stripe = useStripe();
  const [installmentPlan, setInstallmentPlan] = useState<string>('');
  if (!elements || !stripe) return null;
  return (
    <Form
      method="POST"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!paymentIntent) return;
        const formData = new FormData();
        formData.append('payment_intent_id', paymentIntent.id);
        formData.append('action_type', 'confirm_payment');
        if (installmentPlan && installmentPlan !== '') {
          const [count, interval, type] = installmentPlan.split('-');
          formData.append(
            'installments_plan_count',
            count === '0' ? '' : count
          );
          formData.append(
            'installments_plan_interval',
            interval === '0' ? '' : interval
          );
          formData.append('installments_plan_type', type);
        }
        submit(formData, {
          method: 'POST',
        });
      }}
    >
      <ConfirmPayment paymentIntent={paymentIntent} />
      <CardField handleSubmitForm={handleRegisterCard} />
      <CardInstallmentPlanField
        paymentIntent={paymentIntent}
        setInstallmentPlan={setInstallmentPlan}
      />
      <Button type="submit" className="w-full" disabled={!canOrder}>
        注文する
      </Button>
    </Form>
  );
};
