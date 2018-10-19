import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { 
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { AccountService } from '../core/account.service';
import { OrgService } from '../core/org.service';
import { Account, AccountApi, AccountTree } from '../shared/account';
import { Util } from '../shared/util';
import { AppError } from '../shared/error';

@Component({
  selector: 'app-accounts-new',
  templateUrl: 'new.html'
})
export class NewAccountPage {

  public form: FormGroup;
  public selectAccounts: any[];
  public error: AppError;
  private accountTree: AccountTree;

  constructor(
    private router: Router,
    private accountService: AccountService,
    private orgService: OrgService,
    private fb: FormBuilder) {

    let org = this.orgService.getCurrentOrg();
    this.form = fb.group({
      'name': ['', Validators.required],
      'currency': [org.currency],
      'precision': [org.precision],
      'parent': [null, Validators.required]
    });

    this.accountService.getAccountTree().subscribe(tree => {
      this.accountTree = tree;
      this.selectAccounts = tree.getFlattenedAccounts();
    });
  }

  onSubmit() {
    let account = new AccountApi(this.form.value);
    account.id = Util.newGuid();
    let parentAccount = this.accountTree.accountMap[account.parent];

    if(!parentAccount) {
      this.error = new AppError('Invalid parent account');
      return;
    }

    let org = this.orgService.getCurrentOrg();
    account.orgId = org.id;
    account.debitBalance = parentAccount.debitBalance;
    account.currency = account.currency || parentAccount.currency;
    account.precision = account.precision !== null ? account.precision : parentAccount.precision;

    this.accountService.newAccount(account)
      .subscribe(
        account => {
          this.router.navigate(['/accounts']);
        },
        err => {
          this.error = err;
        }
    );
  }

}