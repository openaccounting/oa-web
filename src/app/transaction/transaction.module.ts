import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';
import { TxListPage } from './list';
import { SharedModule } from '../shared/shared.module';
import { AppRoutingModule } from '../app-routing.module';
import { AdvancedEdit } from './advancededit';
import { Autocomplete } from './autocomplete';
import { Breadcrumbs } from './breadcrumbs';
import { NewTransactionPage } from './new';


@NgModule({
  declarations: [
    TxListPage,
    AdvancedEdit,
    Autocomplete,
    Breadcrumbs,
    NewTransactionPage
  ],
  imports: [
    BrowserModule,
    NgbModule,
    ReactiveFormsModule,
    SharedModule,
    AppRoutingModule
  ],
  exports: [],
  providers: [],
  entryComponents: [AdvancedEdit]
})
export class TransactionModule { }