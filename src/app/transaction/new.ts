import { Component, ViewEncapsulation, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import {
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  FormArray,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { AccountService } from '../core/account.service';
import { TransactionService } from '../core/transaction.service';
import { OrgService } from '../core/org.service';
import { Account, AccountApi, AccountTree } from '../shared/account';
import { Util } from '../shared/util';
import { AppError } from '../shared/error';
import { Transaction, Split } from '../shared/transaction';
import { Logger } from '../core/logger';
import { Org } from '../shared/org';

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
  public openingBalances: Account;
  public accountTree: AccountTree;
  public accountMap: any;
  public org;
  @ViewChild('acc') acc: any;
  @ViewChild('amount') amount: ElementRef

  // TODO This code needs to be cleaned up

  constructor(
    private router: Router,
    private accountService: AccountService,
    private txService: TransactionService,
    private orgService: OrgService,
    private fb: FormBuilder,
    private log: Logger) {
    this.numAccountsShown = 3;
    this.org = this.orgService.getCurrentOrg();

    let dateString = Util.getLocalDateString(new Date(), this.org.timezone);
    this.form = this.fb.group({
      type: ['', Validators.required],
      firstAccountPrimary: [null, Validators.required],
      firstAccountSecondary: [null],
      secondAccountPrimary: [null, Validators.required],
      secondAccountSecondary: [null],
      amount: [null, Validators.required],
      description: [''],
      date: [dateString, Validators.required],
      splits: fb.array([]),
    });

    this.addSplit();
    this.addSplit();

    this.accountService.getAccountTree().take(1).subscribe(tree => {
      this.accountTree = tree;
      this.accountMap = tree.accountMap;
      this.selectAccounts = tree.getFlattenedAccounts().filter(account => {
        return !account.children.length;
      });

      this.getExpenseAccounts();
      this.getIncomeAccounts();
      this.getPaymentAccounts();
      this.getAssetAccounts();

      this.openingBalances = tree.getAccountByName('Opening Balances', 2);
    });

    this.form.get('firstAccountPrimary').valueChanges.subscribe(val => {
      if (val === 'other') {
        return;
      }

      this.acc.collapse('toggle-1');
      this.acc.expand('toggle-2');

      let splits = this.form.get('splits') as FormArray;

      if (splits.length > 0) {
        splits.at(0).patchValue({
          accountId: val
        });
      }
    });

    this.form.get('firstAccountSecondary').valueChanges.subscribe(val => {
      if (this.form.value.type === 'openingBalance') {
        this.acc.collapse('toggle-1');
        this.acc.expand('toggle-3');
        this.acc.expand('toggle-4');
        this.form.patchValue({
          description: 'Opening Balance',
          firstAccountPrimary: 'other',
          secondAccountPrimary: this.openingBalances.id
        });
        this.focusAmount();
        let splits = this.form.get('splits') as FormArray;

        if (splits.length > 1) {
          let firstAccount = this.getFirstAccount();
          let secondAccount = this.openingBalances;
          splits.at(0).patchValue({
            accountId: firstAccount.id
          });
          splits.at(1).patchValue({
            accountId: secondAccount.id
          });
        }
        return;
      }

      this.acc.collapse('toggle-1');
      this.acc.expand('toggle-2');

      let splits = this.form.get('splits') as FormArray;

      if (splits.length > 0) {
        splits.at(0).patchValue({
          accountId: val
        });
      }
    });

    this.form.get('secondAccountPrimary').valueChanges.subscribe(val => {
      if (val === 'other') {
        return;
      }

      this.acc.collapse('toggle-2');
      this.acc.expand('toggle-3');
      this.acc.expand('toggle-4');
      this.focusAmount();

      let splits = this.form.get('splits') as FormArray;

      if (splits.length > 1) {
        splits.at(1).patchValue({
          accountId: val
        });
      }
    });

    this.form.get('secondAccountSecondary').valueChanges.subscribe(val => {
      this.acc.collapse('toggle-2');
      this.acc.expand('toggle-3');
      this.acc.expand('toggle-4');
      this.focusAmount();

      let splits = this.form.get('splits') as FormArray;

      if (splits.length > 1) {
        splits.at(1).patchValue({
          accountId: val
        });
      }
    });

    this.form.get('amount').valueChanges.subscribe(amount => {
      let type = this.form.get('type').value;
      let splits = this.form.get('splits') as FormArray;

      if (type === 'expense') {
        splits.at(0).patchValue({
          debit: amount
        });
        splits.at(1).patchValue({
          credit: amount
        });
      } else if (type === 'income') {
        splits.at(0).patchValue({
          credit: amount
        });
        splits.at(1).patchValue({
          debit: amount
        });
      } else if (type === 'openingBalance') {
        let firstAccount = this.getFirstAccount();

        if (firstAccount.debitBalance) {
          splits.at(0).patchValue({
            debit: amount
          });
          splits.at(1).patchValue({
            credit: amount
          });
        } else {
          splits.at(0).patchValue({
            credit: amount
          });
          splits.at(1).patchValue({
            debit: amount
          });
        }
      }
    });
  }

  onSubmit() {
    this.error = null;

    let date = new Date();
    let formDate = Util.getDateFromLocalDateString(this.form.value.date, this.org.timezone);

    date = Util.computeTransactionDate(formDate, date, this.org.timezone);

    let tx = new Transaction({
      id: Util.newGuid(),
      description: this.form.value.description,
      date: date,
      splits: []
    });

    for (let i = 0; i < this.form.value.splits.length; i++) {
      let split = this.form.value.splits[i];
      let account = this.accountTree.accountMap[split.accountId];

      if (!account) {
        this.error = new AppError('Invalid account');
        return;
      }

      let amount = split.debit ? parseFloat(split.debit) : -parseFloat(split.credit);
      amount = Math.round(amount * Math.pow(10, account.precision));

      tx.splits.push(new Split({
        accountId: split.accountId,
        amount: amount,
        nativeAmount: amount
      }));
    }

    this.log.debug(tx);

    this.txService.newTransaction(tx)
      .subscribe(tx => {
        this.router.navigate(['/dashboard']);
      }, error => {
        this.error = error;
      });
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
        hidden: i < this.numAccountsShown ? false : true
      }
    });

    let firstAccounts = dataWithLabels.slice(0, this.numAccountsShown);
    let nextAccounts = dataWithLabels.slice();

    nextAccounts.sort((a, b) => {
      let aAlpha = a.label.charCodeAt(0) >= 65 && a.label.charCodeAt(0) <= 122;
      let bAlpha = b.label.charCodeAt(0) >= 65 && b.label.charCodeAt(0) <= 122;

      if (!aAlpha && bAlpha) {
        return 1;
      }

      if (aAlpha && !bAlpha) {
        return -1;
      }

      if (a.label > b.label) {
        return 1;
      }

      if (a.label < b.label) {
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

    if (type) {
      switch(type) {
        case 'expense':
          str += 'Expense';
          break;
        case 'income':
          str += 'Income';
          break;
        case 'openingBalance':
          str += 'Opening Balance';
          break;
      }
      if (account) {
        str += ' (' + account.name + ')';
      }
    }

    return str;
  }

  getToggle2Title() {
    let account = this.getSecondAccount();

    if (this.form.value.type === 'income') {
      return 'Where was the money sent? ' + (account ? account.name : '');
    } else if (this.form.value.type === 'openingBalance') {
      return 'What account? ' + (account ? account.name : '');
    }

    return 'How did you pay? ' + (account ? account.name : '');
  }

  getFirstAccount() {
    if (this.form.value.firstAccountPrimary && this.form.value.firstAccountPrimary !== 'other') {
      return this.accountTree.accountMap[this.form.value.firstAccountPrimary];
    }

    return this.accountTree.accountMap[this.form.value.firstAccountSecondary];
  }

  getFirstAccountAmount() {
    let account = this.getFirstAccount();

    switch (this.form.value.type) {
      case 'expense':
        return this.form.value.amount * Math.pow(10, account.precision);
      case 'income':
        return -this.form.value.amount * Math.pow(10, account.precision);
      case 'openingBalance':
        return this.form.value.amount * Math.pow(10, account.precision)
          * (account.debitBalance ? 1 : -1);
    }
  }

  getSecondAccount() {
    if (this.form.value.secondAccountPrimary && this.form.value.secondAccountPrimary !== 'other') {
      return this.accountTree.accountMap[this.form.value.secondAccountPrimary];
    }

    return this.accountTree.accountMap[this.form.value.secondAccountSecondary];
  }

  getSecondAccountAmount() {
    let firstAccount = this.getFirstAccount();
    let secondAccount = this.getSecondAccount();

    switch (this.form.value.type) {
      case 'expense':
        return -this.form.value.amount * Math.pow(10, secondAccount.precision);
      case 'income':
        return this.form.value.amount * Math.pow(10, secondAccount.precision);
      case 'openingBalance':
        return this.form.value.amount * Math.pow(10, secondAccount.precision)
          * (firstAccount.debitBalance ? -1 : 1);
    }
  }

  addSplit() {
    let splits = this.form.get('splits') as FormArray;

    let control = new FormGroup({
      accountId: new FormControl(),
      debit: new FormControl(),
      credit: new FormControl()
    }, { updateOn: 'blur' });

    control.valueChanges.subscribe(val => {
      this.fillEmptySplit();
    });
    splits.push(control);

    this.fillEmptySplit();
  }

  fillEmptySplit() {
    // Total up splits and fill in any empty split with the leftover value
    let splits = this.form.get('splits') as FormArray;
    let amount = 0;
    let emptySplit: AbstractControl;
    for (let i = 0; i < splits.length; i++) {
      let split = splits.at(i);
      amount += parseFloat(split.get('debit').value) || 0;
      amount -= parseFloat(split.get('credit').value) || 0;

      if (!split.get('debit').value && !split.get('credit').value) {
        emptySplit = split;
      }
    }

    if (emptySplit) {
      let precision = 2;

      let accountId = emptySplit.get('accountId').value;
      let account = null;

      if (this.accountTree && accountId) {
        account = this.accountTree.accountMap[emptySplit.get('accountId').value];
      }

      if (account) {
        precision = account.precision;
      }

      amount = this.round(-amount, precision);

      if (amount) {
        emptySplit.patchValue({
          debit: amount >= 0 ? amount : '',
          credit: amount < 0 ? -amount : ''
        });
      }
    }
  }

  round(amount, precision) {
    return Math.round(amount * Math.pow(10, precision)) / Math.pow(10, precision);
  }

  focusAmount() {
    // TODO Not sure how to get rid of this hack
    setTimeout(() => {
      if (this.amount) {
        this.amount.nativeElement.focus();
      }
    }, 1);
  }


}