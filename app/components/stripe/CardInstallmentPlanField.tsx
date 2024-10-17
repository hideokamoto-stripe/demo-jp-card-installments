import { FC } from 'react';
import { PaymentIntent } from '~/types/stripe';

import {
    Select,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectItem,
  } from '~/components/ui/select';
import Stripe from 'stripe';
  
export const CardInstallmentPlanField: FC<{
    paymentIntent: PaymentIntent | null | undefined;
    setInstallmentPlan: (plan: string) => void;
  }> = ({ paymentIntent, setInstallmentPlan }) => {
    if (!paymentIntent) return null;
    if (!paymentIntent.payment_method_options?.card?.installments) return null;
    if (
      !paymentIntent.payment_method_options?.card?.installments.available_plans ||
      paymentIntent.payment_method_options?.card?.installments.available_plans
        ?.length < 1
    )
      return null;
    return (
      <Select
        onValueChange={(value) => {
          setInstallmentPlan(value === '1' ? '' : value);
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="１回払い" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={'1'}>１回払い</SelectItem>
          {paymentIntent.payment_method_options?.card?.installments.available_plans?.map(
            (plan) => {
              const { count, interval, type } = plan;
              const key = `${count || 0}-${interval || 0}-${type}`;
              const value = ((
                plan: Stripe.PaymentIntent.PaymentMethodOptions.Card.Installments.AvailablePlan
              ) => {
                // @ts-expect-error
                if (plan.type === 'bonus') {
                  return 'ボーナス払い';
                }
                // @ts-expect-error
                if (plan.type === 'revolving') {
                  return 'リボルビング払い';
                }
                return `${plan.count}回払い`;
              })(plan);
              return (
                <SelectItem key={`${key}`} value={`${key}`}>
                  {value}
                </SelectItem>
              );
            }
          )}
        </SelectContent>
      </Select>
    );
  };
  