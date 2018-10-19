import { NgModule } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CurrencyFormatPipe } from './currency-format.pipe';
import { AccountNamePipe } from './account-name.pipe';
import { AccountBalancePipe } from './account-balance.pipe';

@NgModule({
  imports: [],
  declarations: [CurrencyFormatPipe, AccountNamePipe, AccountBalancePipe],
  exports: [CurrencyFormatPipe, AccountNamePipe, AccountBalancePipe],
  providers: [DecimalPipe, CurrencyFormatPipe]
})
export class SharedModule { }