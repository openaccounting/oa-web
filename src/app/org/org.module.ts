import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NewOrgPage } from './neworg';
import { OrgPage } from './org';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    NewOrgPage,
    OrgPage
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule
  ],
  providers: []
})
export class OrgModule { }