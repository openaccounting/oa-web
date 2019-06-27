import { Component, Input } from '@angular/core';
import { Logger } from '../core/logger';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TxItem } from './txitem';
import { Transaction, Split } from '../shared/transaction';
import { Account, AccountTree } from '../shared/account';
import { Org } from '../shared/org';
import { AppError } from '../shared/error';
import {
  FormControl,
  FormGroup,
  FormArray,
  Validators,
  FormBuilder,
  AbstractControl
} from '@angular/forms';
import { Util } from '../shared/util';
import { OrgService } from '../core/org.service';
import { TransactionService } from '../core/transaction.service';

@Component({
  selector: 'advancededit',
  templateUrl: './advancededit.html',
  styleUrls: ['./advancededit.scss']
})
export class AdvancedEdit {
  public form: FormGroup;
  public error: AppError;
  private item: TxItem;
  private accountTree: AccountTree;
  private selectAccounts: Account[];
  private org: Org;
  private visibleDebits: any = {};
  private visibleCredits: any = {};

  constructor(
    public activeModal: NgbActiveModal,
    private log: Logger,
    private fb: FormBuilder,
    private orgService: OrgService,
    private txService: TransactionService
  ) {}

  setData(item: TxItem, accountTree: AccountTree) {
    this.item = item;
    this.accountTree = accountTree;
    this.selectAccounts = accountTree.getFlattenedAccounts().filter(account => {
      return !account.children.length;
    });

    this.org = this.orgService.getCurrentOrg();

    let dateString = Util.getLocalDateString(item.tx.date, this.org.timezone);

    this.form = new FormGroup({
      date: new FormControl(dateString),
      description: new FormControl(item.tx.description),
      splits: this.fb.array([])
    });

    let orgPrecision = this.org.precision;

    let splits = this.form.get('splits') as FormArray;
    for(let split of item.tx.splits) {
      let precision = orgPrecision;
      let account = this.accountTree.accountMap[split.accountId];

      if(account) {
        precision = account.precision;
      }

      let control = new FormGroup({
        accountId: new FormControl(split.accountId),
        debit: new FormControl(
          split.amount >= 0 ? split.amount / Math.pow(10, precision) : null
        ),
        credit: new FormControl(
          split.amount < 0 ? -split.amount / Math.pow(10, precision) : null
        ),
        debitNative: new FormControl(
          split.nativeAmount >= 0 ? split.nativeAmount / Math.pow(10, orgPrecision) : null
        ),
        creditNative: new FormControl(
          split.nativeAmount < 0 ? -split.nativeAmount / Math.pow(10, orgPrecision) : null
        )
      }, {updateOn: 'blur'});

      // control.valueChanges.subscribe(val => {
      //   this.solveEquations(item);
      //   this.fillEmptySplit(item);
      // });

      splits.push(control);

      console.log(splits);

      //this.fillEmptySplit(item);
    }
  }

  getCurrency(accountId: string) {
    let account = this.accountTree.accountMap[accountId];
    return account ? account.currency : '';
  }

  submit() {
    console.log('submit');
    console.log(this.form.value);

    this.error = null;

    let date = this.item.tx.id ? this.item.tx.date : new Date();
    let formDate = Util.getDateFromLocalDateString(this.form.value.date, this.org.timezone);

    date = Util.computeTransactionDate(formDate, date, this.org.timezone);

    let tx = new Transaction({
      id: this.item.tx.id,
      date: date,
      description: this.form.value.description,
      splits: []
    });

    for(let i = 0; i < this.form.value.splits.length; i++) {
      let split = this.form.value.splits[i];
      let account = this.accountTree.accountMap[split.accountId];

      if(!account) {
        this.error = new AppError('Invalid account');
        return;
      }

      let amount = split.debit ? parseFloat(split.debit) : -parseFloat(split.credit);
      amount = Math.round(amount * Math.pow(10, account.precision));

      let nativeAmount = split.debitNative ? parseFloat(split.debitNative) : -parseFloat(split.creditNative);
      nativeAmount = Math.round(nativeAmount * Math.pow(10, this.org.precision))

      tx.splits.push(new Split({
        accountId: split.accountId,
        amount: amount,
        nativeAmount: nativeAmount
      }));
    }

    this.log.debug(tx);

    if(tx.id) {
      // update tx
      let oldId = tx.id;
      tx.id = Util.newGuid();

      this.txService.putTransaction(oldId, tx)
        .subscribe(tx => {
          this.activeModal.close();

        }, error => {
          this.error = error;
        });
    } else {
      // new tx

      tx.id = Util.newGuid();
      this.txService.newTransaction(tx)
        .subscribe(tx => {
          this.activeModal.close();

        }, error => {
          this.error = error;
        });
    }
    
  }

  addSplit() {
    this.log.debug('add split');

    let splits = this.form.get('splits') as FormArray;

    let control = new FormGroup({
      accountId: new FormControl(),
      debit: new FormControl(),
      credit: new FormControl(),
      debitNative: new FormControl(),
      creditNative: new FormControl()
    }, {updateOn: 'blur'});

    // control.valueChanges.subscribe(val => {
    //   this.solveEquations(item);
    //   this.fillEmptySplit(item);
    // });
    splits.push(control);

    // this.fillEmptySplit(item);
  }

  deleteSplit(index) {
    this.log.debug('delete split');

    let splits = this.form.get('splits') as FormArray;

    splits.removeAt(index);
    this.visibleDebits = {};
    this.visibleCredits = {};

  }

  getSplitControls(): AbstractControl[] {
    return (this.form.get('splits') as FormArray).controls;
  }

  debitVisible(index: number) {
    let splits = this.getSplitControls();

    return this.visibleDebits[index] || splits[index].value.debit;
  }

  creditVisible(index: number) {
    let splits = this.getSplitControls();

    return this.visibleCredits[index] || splits[index].value.credit;
  }

  showDebit(index: number) {
    this.visibleDebits[index] = true;
    this.visibleCredits[index] = false;
  }

  showCredit(index: number) {
    this.visibleCredits[index] = true;
    this.visibleDebits[index] = false;

  }
}