import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { LoginPage } from './login';
import { LogoutPage } from './logout';
import { VerifyUserPage } from './verify';
import { ResetPasswordPage } from './reset';
import { ReactiveFormsModule } from '@angular/forms';
import { AppRoutingModule } from '../app-routing.module';


@NgModule({
  declarations: [
    LoginPage,
    LogoutPage,
    VerifyUserPage,
    ResetPasswordPage
  ],
  imports: [
    BrowserModule,
    ReactiveFormsModule,
    AppRoutingModule
  ],
  providers: []
})
export class UserModule { }