import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { SettingsPage } from './settings';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    SettingsPage,
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule
  ],
  providers: []
})
export class SettingsModule { }