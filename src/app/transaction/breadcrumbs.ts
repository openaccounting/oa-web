import { Component, Input } from '@angular/core';
import { Account } from '../shared/account';

@Component({
  selector: 'breadcrumbs',
  templateUrl: 'breadcrumbs.html',
  styleUrls: ['./breadcrumbs.scss']
})
export class Breadcrumbs {
  @Input() account: Account;
  public accountCrumbs: Account[];

  constructor() {
    this.accountCrumbs = [];
  }

  ngOnInit() {
    let currentAccount = this.account;
    while(currentAccount && currentAccount.depth > 0) {
      this.accountCrumbs.unshift(currentAccount);
      currentAccount = currentAccount.parent;
    }
  }

}