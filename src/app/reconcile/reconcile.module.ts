import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { AppRoutingModule } from '../app-routing.module';

import { ReconcilePage } from './reconcile';
import { ReconcileModal } from './reconcile-modal';


@NgModule({
  declarations: [
    ReconcilePage,
    ReconcileModal
  ],
  imports: [
    BrowserModule,
    NgbModule,
    ReactiveFormsModule,
    SharedModule,
    AppRoutingModule
  ],
  providers: [],
  entryComponents: [ReconcileModal]
})
export class ReconcileModule { }