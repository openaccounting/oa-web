import { Component } from '@angular/core';


@Component({
  selector: 'page-reports',
  templateUrl: 'reports.html'
})
export class ReportsPage {

  reports: Array<{title: string, url: string}>;

  constructor() {
    this.reports = [
      { title: 'Income Statement', url: '/reports/income' },
      { title: 'Balance Sheet', url: '/reports/balancesheet'}
    ];
  }
}