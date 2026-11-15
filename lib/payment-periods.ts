/** Payment frequency for insurance and gas bills; older records default to month/year. */
export const paymentPeriodOptions = [
  { value: "week", label: "Each week" },
  { value: "fortnight", label: "Every fortnight" },
  { value: "month", label: "Each month" },
  { value: "quarter", label: "Every 3 months" },
  { value: "half_year", label: "Every 6 months" },
  { value: "year", label: "Each year" },
] as const;
export type PaymentPeriod = typeof paymentPeriodOptions[number]["value"];
const paymentsPerYear: Record<PaymentPeriod, number> = {
  week: 52, fortnight: 26, month: 12, quarter: 4, half_year: 2, year: 1,
};
const periodNames: Record<PaymentPeriod, string> = {
  week: "week", fortnight: "fortnight", month: "month",
  quarter: "3 months", half_year: "6 months", year: "year",
};
export function isPaymentPeriod(value: unknown): value is PaymentPeriod {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(paymentsPerYear, value);
}
export function periodLabel(period: PaymentPeriod): string { return periodNames[period]; }
export function annualisePayment(amount: number, period: PaymentPeriod): number {
  return Math.round((amount * paymentsPerYear[period] + Number.EPSILON) * 100) / 100;
}
