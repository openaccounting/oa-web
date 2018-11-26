import { Component, ViewEncapsulation, ViewChild } from '@angular/core';
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
  selector: 'app-txnew',
  templateUrl: 'new.html',
  styleUrls: ['./new.scss'],
  encapsulation: ViewEncapsulation.None
})
export class NewTransactionPage {

  public form: FormGroup;
  public type: string;
  public typeDescription: string;
  public secondDescription: string;
  public firstAccountPrimary: string;
  public selectAccounts: any[];
  public error: AppError;
  public numAccountsShown: number;
  public expenseAccounts: any[] = [];
  public incomeAccounts: any[] = [];
  public paymentAccounts: any[] = [];
  public assetAccounts: any[] = [];
  public expenseAccountsAll: any[] = [];
  public incomeAccountsAll: any[] = [];
  public paymentAccountsAll: any[] = [];
  public assetAccountsAll: any[] = [];
  private accountTree: AccountTree;
  @ViewChild('acc') acc: any;

  constructor(
    private router: Router,
    private accountService: AccountService,
    private orgService: OrgService,
    private fb: FormBuilder) {

    this.numAccountsShown = 3;

    let org = this.orgService.getCurrentOrg();

    let dateString = Util.getLocalDateString(new Date());
    this.form = fb.group({
      'type': ['', Validators.required],
      'firstAccountPrimary': [null, Validators.required],
      'firstAccountSecondary': [null],
      'secondAccountPrimary': [null, Validators.required],
      'secondAccountSecondary': [null],
      'amount': [null, Validators.required],
      'description': [''],
      'date': [dateString, Validators.required]
    });

    this.accountService.getAccountTree().subscribe(tree => {
      this.accountTree = tree;
      this.selectAccounts = tree.getFlattenedAccounts().filter(account => {
        let isAsset = account.fullName.match(/^Assets/);
        let isLiability = account.fullName.match(/^Liabilities/);
        return !account.children.length && (isAsset || isLiability);
      });

      this.getExpenseAccounts();
      this.getIncomeAccounts();
      this.getPaymentAccounts();
      this.getAssetAccounts();
    });

    this.form.get('type').valueChanges.subscribe(val => {
      if(val === 'openingBalance') {
        this.acc.collapse('toggle-1');
        this.acc.expand('toggle-2');
        this.form.patchValue({description: 'Opening Balance'});
      }
    })

    this.form.get('firstAccountPrimary').valueChanges.subscribe(val => {
      if(val === 'other') {
        return;
      }

      this.acc.collapse('toggle-1');
      this.acc.expand('toggle-2');
    });

    this.form.get('firstAccountSecondary').valueChanges.subscribe(val => {
      this.acc.collapse('toggle-1');
      this.acc.expand('toggle-2');
    });

    this.form.get('secondAccountPrimary').valueChanges.subscribe(val => {
      if(val === 'other') {
        return;
      }

      this.acc.collapse('toggle-2');
      this.acc.expand('toggle-3');
      this.acc.expand('toggle-4');
    });

    this.form.get('secondAccountSecondary').valueChanges.subscribe(val => {
      this.acc.collapse('toggle-2');
      this.acc.expand('toggle-3');
      this.acc.expand('toggle-4');
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

  getExpenseAccounts() {
    // Get most used expense accounts

    let expenseAccounts = this.accountTree.getAccountAtoms(
      this.accountTree.getAccountByName('Expenses', 1)
    );

    this.processAccounts('expenseAccounts', expenseAccounts, 2);
  }

  getIncomeAccounts() {
    // Get most used income accounts

    let incomeAccounts = this.accountTree.getAccountAtoms(
      this.accountTree.getAccountByName('Income', 1)
    );

    this.processAccounts('incomeAccounts', incomeAccounts, 2);
  }

  getPaymentAccounts() {
    // Get most used asset / liability accounts

    let assetAccounts = this.accountTree.getAccountAtoms(
      this.accountTree.getAccountByName('Assets', 1)
    );

    let liabilityAccounts = this.accountTree.getAccountAtoms(
      this.accountTree.getAccountByName('Liabilities', 1)
    );

    let paymentAccounts = assetAccounts.concat(liabilityAccounts);

    this.processAccounts('paymentAccounts', paymentAccounts, 3);
  }

  getAssetAccounts() {
    // Get most used asset accounts

    let assetAccounts = this.accountTree.getAccountAtoms(
      this.accountTree.getAccountByName('Assets', 1)
    );

    this.processAccounts('assetAccounts', assetAccounts, 3);
  }

  processAccounts(variable, data, depth) {
    data.sort((a, b) => {
      return b.recentTxCount - a.recentTxCount;
    });

    let dataWithLabels = data.map((account, i) => {
      return {
        id: account.id,
        name: account.name,
        label: this.accountTree.getAccountLabel(account, depth),
        hidden: i < this.numAccountsShown ? false: true
      }
    });

    let firstAccounts = dataWithLabels.slice(0, this.numAccountsShown);
    let nextAccounts = dataWithLabels.slice(this.numAccountsShown);

    nextAccounts.sort((a, b) => {
      let aAlpha = a.label.charCodeAt(0) >= 65 && a.label.charCodeAt(0) <= 122;
      let bAlpha = b.label.charCodeAt(0) >= 65 && b.label.charCodeAt(0) <= 122;

      if(!aAlpha && bAlpha) {
        return 1;
      }

      if(aAlpha && !bAlpha) {
        return -1;
      }

      if(a.label > b.label) {
        return 1;
      }

      if(a.label < b.label) {
        return -1;
      }

      return 0;
    });

    this[variable] = firstAccounts;
    this[variable + 'All'] = nextAccounts;
  }

  getToggle1Title() {
    let account = this.getFirstAccount();

    let str = 'What type of transaction? ';

    let type = this.form.value.type;

    if(type) {
      str += type.charAt(0).toUpperCase() + type.substr(1);
      if(account) {
        str += ' (' + account.name + ')';
      }
    }

    return str;
  }

  getTitle() {
    let account = this.getSecondAccount();
  
    if(this.form.value.type === 'income') {
      return 'Where was the money sent? ' + (account ? account.name : '');
    } else if(this.form.value.type === 'openingBalance') {
      return 'What account? ' + (account ? account.name : '');
    }

    return 'How did you pay? ' + (account ? account.name : '');
  }

  getFirstAccount() {
    if(!this.accountTree) {
      return null;
    }

    if(this.form.value.firstAccountPrimary && this.form.value.firstAccountPrimary !== 'other') {
      return this.accountTree.accountMap[this.form.value.firstAccountPrimary];
    }

    return this.accountTree.accountMap[this.form.value.firstAccountSecondary];
  }

  getSecondAccount() {
    if(!this.accountTree) {
      return null;
    }

    if(this.form.value.secondAccountPrimary && this.form.value.secondAccountPrimary !== 'other') {
      return this.accountTree.accountMap[this.form.value.secondAccountPrimary];
    }

    return this.accountTree.accountMap[this.form.value.secondAccountSecondary];
  }




}