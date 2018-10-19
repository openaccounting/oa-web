import { Pipe, PipeTransform } from '@angular/core';
import { CurrencyFormatPipe } from './currency-format.pipe';
import { Account } from './account';

@Pipe({name: 'accountBalance'})
export class AccountBalancePipe implements PipeTransform {
  constructor(private currencyFormatPipe: CurrencyFormatPipe) {
  }

  transform(account: Account, balanceType = 'price'): string {
    let sign = account.debitBalance ? 1 : -1;

    let nativeBalance = 0;

    switch(balanceType) {
      case 'cost':
        nativeBalance = account.totalNativeBalanceCost;
        break;
      case 'price':
        nativeBalance = account.totalNativeBalancePrice;
        break;
      default:
        throw new Error('Invalid balance type ' + balanceType);
    }

    return this.currencyFormatPipe.transform(sign * nativeBalance, account.orgPrecision, account.orgCurrency);
  }
}