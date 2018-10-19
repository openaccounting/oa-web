import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RegisterPage } from './register';
import { ReactiveFormsModule } from '@angular/forms';


@NgModule({
  declarations: [
    RegisterPage
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule
  ],
  providers: []
})
export class RegisterModule { }