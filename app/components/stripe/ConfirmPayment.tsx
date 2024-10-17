import { useStripe } from '@stripe/react-stripe-js';
import { FC, useEffect, useRef, useState } from 'react';
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
  const hasHandledNextAction = useRef(false)
  useEffect(() => {
    if (!paymentIntent.next_action || !stripe) return;
    if (hasHandledNextAction.current) return;
    hasHandledNextAction.current = true
    stripe.handleNextAction({
      clientSecret: paymentIntent.client_secret || '',
    });
  }, [paymentIntent, stripe]);
  if (!stripe) return null;
  if (
    !paymentIntent.payment_method_options?.card?.installments ||
    !paymentIntent.payment_method_options?.card?.installments.available_plans ||
    paymentIntent.payment_method_options?.card?.installments.available_plans?.length < 1
  ) {
    return <p>処理中です。少々お待ちください。</p>;
  }
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
      <Label>このカードは分割払いがご利用いただけます。回数を選択してください。</Label>
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
                const value = ((plan: Stripe.PaymentIntent.PaymentMethodOptions.Card.Installments.AvailablePlan) => {
                  // @ts-expect-error
                  if (plan.type === 'bonus') {
                    return 'ボーナス払い'
                  }
                  // @ts-expect-error
                  if (plan.type === 'revolving') {
                    return 'リボルビング払い'
                  }
                  return `${plan.count}回払い`
                })(plan)
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
        注文する
      </Button>
    </Form>
  );
};
