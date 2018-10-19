import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { AppRoutingModule } from '../app-routing.module';

import { PriceDbPage } from './pricedb';
import { PriceModal } from './price-modal';


@NgModule({
  declarations: [
    PriceDbPage,
    PriceModal
  ],
  imports: [
    BrowserModule,
    NgbModule,
    ReactiveFormsModule,
    SharedModule,
    AppRoutingModule
  ],
  providers: [],
  entryComponents: [PriceModal]
})
export class PriceModule { }