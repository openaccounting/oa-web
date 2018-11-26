import { NgModule }             from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardPage }   from './dashboard/dashboard';
import { AccountsPage } from './account/accounts';
import { NewAccountPage } from './account/new';
import { EditAccountPage } from './account/edit';
import { TxListPage } from './transaction/list';
import { LoginPage } from './user/login';
import { LogoutPage } from './user/logout';
import { VerifyUserPage } from './user/verify';
import { ResetPasswordPage } from './user/reset';
import { RegisterPage } from './register/register';
import { NewOrgPage } from './org/neworg';
import { OrgPage } from './org/org';
import { SettingsPage } from './settings/settings';
import { PriceDbPage } from './price/pricedb';
import { NewTransactionPage } from './transaction/new';

import { ReportsPage } from './reports/reports';
import { IncomeReport } from './reports/income';
import { BalanceSheetReport } from './reports/balancesheet';

import { ReconcilePage } from './reconcile/reconcile';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'user/verify', component: VerifyUserPage },
  { path: 'user/reset-password', component: ResetPasswordPage },
  { path: 'dashboard', component: DashboardPage },
  { path: 'accounts', component: AccountsPage },
  { path: 'accounts/new', component: NewAccountPage },
  { path: 'accounts/:id/transactions', component: TxListPage },
  { path: 'accounts/:id/edit', component: EditAccountPage },
  { path: 'reports', component: ReportsPage },
  { path: 'reports/income', component: IncomeReport },
  { path: 'reports/balancesheet', component: BalanceSheetReport },
  { path: 'login', component: LoginPage },
  { path: 'logout', component: LogoutPage },
  { path: 'register', component: RegisterPage },
  { path: 'orgs/new', component: NewOrgPage },
  { path: 'orgs', component: OrgPage },
  { path: 'settings', component: SettingsPage },
  { path: 'tools/reconcile', component: ReconcilePage },
  { path: 'prices', component: PriceDbPage },
  { path: 'transactions/new', component: NewTransactionPage }
];

@NgModule({
  imports: [ RouterModule.forRoot(routes, {initialNavigation: false}) ],
  exports: [ RouterModule ]
})
export class AppRoutingModule {}