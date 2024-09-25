import { useStripe } from '@stripe/react-stripe-js';
import { FC, useEffect, useState } from 'react';
import Stripe from 'stripe';
import { Form, useSubmit } from '@remix-run/react';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '~/components/ui/select';

export const ConfirmPayment: FC<{
  paymentIntent: Pick<
    Stripe.PaymentIntent,
    'next_action' | 'id' | 'client_secret' | 'payment_method_options'
  >;
}> = ({ paymentIntent }) => {
  const stripe = useStripe();
  const submit = useSubmit();
  const [installmentPlan, setInstallmentPlan] = useState<string>('');
  useEffect(() => {
    if (!paymentIntent.next_action || !stripe) return;
    stripe.handleNextAction({
      clientSecret: paymentIntent.client_secret || '',
    });
  }, [paymentIntent, stripe]);
  if (!stripe) return null;
  return (
    <Form
      method="POST"
      onSubmit={async (e) => {
        e.preventDefault();
        const [count, interval, type] = installmentPlan.split('-');
        const formData = new FormData();
        formData.append('payment_intent_id', paymentIntent.id);
        formData.append('installments_plan_count', count === '0' ? '' : count);
        formData.append(
          'installments_plan_interval',
          interval === '0' ? '' : interval
        );
        formData.append('installments_plan_type', type);
        formData.append('action_type', 'confirm_payment');
        submit(formData, {
          method: 'POST',
        });
      }}
    >
      <Label>Installments Plan</Label>
      {paymentIntent.payment_method_options?.card?.installments ? (
        <Select
          onValueChange={(value) => {
            setInstallmentPlan(value);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="choose plan" />
          </SelectTrigger>
          <SelectContent>
            {paymentIntent.payment_method_options?.card?.installments.available_plans?.map(
              (plan) => {
                const { count, interval, type } = plan;
                const key = `${count || 0}-${interval || 0}-${type}`;
                const value = [count, interval, count && interval ? null : type]
                  .filter(Boolean)
                  .join(' ');
                return (
                  <SelectItem key={`${key}`} value={`${key}`}>
                    {value}
                  </SelectItem>
                );
              }
            )}
          </SelectContent>
        </Select>
      ) : null}
      <Button type="submit" className="w-full">
        Order
      </Button>
    </Form>
  );
};
