import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { CoreModule } from './core/core.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AccountModule } from './account/account.module';
import { UserModule } from './user/user.module';
import { RegisterModule } from './register/register.module';
import { OrgModule } from './org/org.module';
import { TransactionModule } from './transaction/transaction.module';
import { ReportsModule } from './reports/reports.module';
import { SettingsModule } from './settings/settings.module';
import { ReconcileModule } from './reconcile/reconcile.module';
import { PriceModule } from './price/price.module';


@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    NgbModule.forRoot(),
    AppRoutingModule,
    CoreModule.forRoot(),
    DashboardModule,
    AccountModule,
    UserModule,
    RegisterModule,
    OrgModule,
    TransactionModule,
    ReportsModule,
    SettingsModule,
    ReconcileModule,
    PriceModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
