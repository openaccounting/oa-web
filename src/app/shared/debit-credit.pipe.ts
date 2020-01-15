import { Pipe, PipeTransform } from '@angular/core';
import { Account } from './account';

@Pipe({name: 'debitCredit'})
export class DebitCreditPipe implements PipeTransform {
  debitNames: any;
  creditNames: any;


  constructor() {
    this.debitNames = {
      'Assets': 'Deposit',
      'Liabilities': 'Payment',
      'Equity': 'Decrease',
      'Income': 'Deduction',
      'Expenses': 'Expense'
    };

    this.creditNames = {
      'Assets': 'Withdrawal',
      'Liabilities': 'Charge',
      'Equity': 'Increase',
      'Income': 'Income',
      'Expenses': 'Refund'
    };
  }

  transform(account: Account, type: string): string {
    if(!account) {
      return type === 'credit' ? 'Credit' : 'Debit';
    }

    let parent = account.fullName.split(':')[0];
    if(type === 'credit') {
      return this.creditNames[parent];
    } else {
      return this.debitNames[parent];
    }
  }
}