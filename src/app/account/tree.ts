import { Component, Input, OnInit } from '@angular/core';
import { Logger } from '../core/logger';
import { Router } from '@angular/router';
import { Account } from '../shared/account';
import { Org } from '../shared/org';
import { AccountService } from '../core/account.service';
import { OrgService } from '../core/org.service';
import { ConfigService } from '../core/config.service';
import { SessionService } from '../core/session.service';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'account-tree',
  templateUrl: 'tree.html',
  styleUrls: ['./tree.scss']
})
export class TreeComponent implements OnInit {
  public accounts$: Observable<Account[]>;
  private accounts: any[];
  private expandedAccounts: any = {};
  private visibleAccounts: any = {};
  private org: Org;

  constructor(
    private log: Logger,
    private router: Router,
    private accountService: AccountService,
    private orgService: OrgService,
    private configService: ConfigService,
    private sessionService: SessionService) {
  }

  ngOnInit() {
    this.sessionService.setLoading(true);
    this.org = this.orgService.getCurrentOrg();
    this.expandedAccounts = this.configService.get('expandedAccounts') || {};
    this.visibleAccounts = {};

    this.log.debug('tree init');
    this.accounts$ = this.accountService.getFlattenedAccounts()
      .do(accounts => {
        this.log.debug('NEW TREE');
        this.sessionService.setLoading(false);
        this.expandTopLevel(accounts);
      }
    );
  }


  expandTopLevel(accounts: Account[]) {

    for(let account of accounts) {
      if(account.depth === 1 && this.isExpanded(account)) {
        this.showExpandedDescendants(account);
      } else if(account.depth === 1) {
        this.showAccount(account);
      }
    }
  }

  isExpanded(account) {
    return this.expandedAccounts[account.id];
  }

  toggleExpanded(account) {
    this.expandedAccounts[account.id] = !this.expandedAccounts[account.id];
    this.configService.put('expandedAccounts', this.expandedAccounts);
  }

  isVisible(account) {
    return this.visibleAccounts[account.id];
  }

  hideAccount(account) {
    this.visibleAccounts[account.id] = false;
  }

  showAccount(account) {
    this.visibleAccounts[account.id] = true;
  }

  click(account) {
    if(account.children.length) {
      this.toggleExpanded(account);

      if(this.isExpanded(account)) {
        this.showExpandedDescendants(account);
      } else {
        this.hideDescendants(account);
      }
    } else {
      this.router.navigate(['/accounts/' + account.id + '/transactions']);
    }
  }

  edit(account: Account) {
    // let modal = this.modalCtrl.create(EditAccountPage, {account: account});
    // modal.present();
    // modal.onWillDismiss(() => {
    //   this.ngOnChanges();
    // });
  }

  hideDescendants(account: Account) {
    account.children.forEach(child => {
      this.hideAccount(child);
      this.hideDescendants(child);
    });
  }

  showExpandedDescendants(account: Account) {
    this.showAccount(account);

    account.children.forEach(child => {
      this.showAccount(child);

      if(this.isExpanded(child)) {
        this.showExpandedDescendants(child);
      }
    });
  }

}