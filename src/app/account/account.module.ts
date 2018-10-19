import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../shared/shared.module';
import { AppRoutingModule } from '../app-routing.module';

import { AccountsPage } from './accounts';
import { NewAccountPage } from './new';
import { EditAccountPage } from './edit';
import { TreeComponent } from './tree';


@NgModule({
  declarations: [
    AccountsPage,
    NewAccountPage,
    EditAccountPage,
    TreeComponent
  ],
  imports: [
    BrowserModule,
    NgbModule,
    ReactiveFormsModule,
    SharedModule,
    AppRoutingModule
  ],
  exports: [TreeComponent],
  providers: []
})
export class AccountModule { }