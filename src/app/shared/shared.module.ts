import { NgModule } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { CurrencyFormatPipe } from './currency-format.pipe';
import { AccountNamePipe } from './account-name.pipe';
import { AccountBalancePipe } from './account-balance.pipe';
import { DateTzPipe } from './datetz.pipe';

@NgModule({
  imports: [],
  declarations: [CurrencyFormatPipe, AccountNamePipe, AccountBalancePipe, DateTzPipe],
  exports: [CurrencyFormatPipe, AccountNamePipe, AccountBalancePipe, DateTzPipe],
  providers: [DecimalPipe, CurrencyFormatPipe]
})
export class SharedModule { }