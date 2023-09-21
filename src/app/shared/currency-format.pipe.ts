import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';

// Format the currency according to the user's browser locale.
//
// Some currencies share the same symbol (e.g. $ is used for USD and CAN).
// Ideally, the user experience should not be confusing if different accounts
// have conflicting symbols. One solution might be to always show the ISO
// currency code for accounts with mixes currencies. Another solution would be
// to let the user configure how the currency is displayed on a per-currency
// or per-account basis.

@Pipe({ name: 'currencyFormat' })
export class CurrencyFormatPipe implements PipeTransform {
  constructor(private decimalPipe: DecimalPipe) {
  }

  transform(amount: number, precision: number, currency = 'USD'): string {
    if(amount === null || amount === undefined) {
      return '';
    }

    // note: we can drop the cast to any if we change the ts target from es5 to es2020 or newer.
    return Intl.NumberFormat(navigator.language, {
      style: "currency",
      currency,
      minimumFractionDigits: precision,
      signDisplay: "negative",
    } as any).format(amount / Math.pow(10, precision));
  }
}