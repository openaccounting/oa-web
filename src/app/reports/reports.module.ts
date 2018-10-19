import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReportsPage } from './reports';
import { IncomeReport } from './income';
import { BalanceSheetReport } from './balancesheet';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from '../app-routing.module';
import { SharedModule } from '../shared/shared.module';


@NgModule({
  declarations: [
    ReportsPage,
    IncomeReport,
    BalanceSheetReport
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AppRoutingModule,
    SharedModule
  ],
  providers: []
})
export class ReportsModule { }