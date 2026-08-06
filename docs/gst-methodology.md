# GST Calculator methodology

## Scope

The calculator performs arithmetic on a user-selected amount, rate, calculation mode and supply-type allocation. It does not determine whether a supply is taxable, classify a product or service, select HSN/SAC, infer place of supply, decide CGST versus UTGST, or provide filing or tax advice.

## Formulas

For an exclusive amount, the entered amount is the taxable value:

```text
GST = taxable value × rate ÷ 100
Total = taxable value + GST
```

For an inclusive amount, the entered amount is the total:

```text
Taxable value = total ÷ (1 + rate ÷ 100)
GST = total − taxable value
```

For an intra-state display, the rounded CGST is half of the rounded total GST and the rounded SGST/UTGST remainder is total GST minus CGST. The UI intentionally says “SGST/UTGST” because no location model is present. For an inter-state display, the whole GST amount is labelled IGST. The total-only option does not allocate components.

## Precision and rounding

- Input currency accepts positive finite values up to ₹999,999,999,999,999.99 with at most two decimal places.
- Custom rates accept 0%–100% with at most two decimal places. A zero custom rate is arithmetic only and does not assert exemption.
- Decimal.js provides the internal decimal arithmetic. Native floating-point arithmetic is not used for tax calculations.
- Currency values are rounded to two decimal places with half-up rounding at the final currency boundary.
- Exclusive mode rounds GST first, then adds the rounded GST to the taxable value.
- Inclusive mode rounds taxable value first, then derives GST as the entered total minus that rounded taxable value.
- Component allocation uses the displayed total GST; the second component is the remainder so the displayed components always reconcile exactly.
- Half-paise results are assigned by half-up rounding to the first component and the remainder to the second component.
- The result reports when the unrounded tax and displayed tax differ. It does not hide a rounding adjustment.

## Policy and privacy

The two current presets are source-backed headline rates, not classifications. A custom rate is clearly marked and places responsibility for choosing the rate with the user. The active policy version, effective date, last verification date and official sources are visible on the result page.

All input and calculation work stays in the browser. No amount, percentage, tax component, mode or supply type is sent to analytics, a backend, a URL or a log.
