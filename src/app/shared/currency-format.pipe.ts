import { Pipe, PipeTransform } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Pipe({name: 'currencyFormat'})
export class CurrencyFormatPipe implements PipeTransform {
  constructor(private decimalPipe: DecimalPipe) {
  }

  transform(amount: number, precision: number, currency = 'USD'): string {
    if(amount === null || amount === undefined) {
      return '';
    }

    let prefix = amount < 0 ? '-' : '';

    if(currency === 'USD') {
      prefix += '$';
    }

    let minDigits = Math.min(2, precision);
    
    return prefix + 
      this.decimalPipe.transform(
        Math.abs(amount) / Math.pow(10, precision),
        '1.' + minDigits + '-' + precision);
  }
}