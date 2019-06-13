import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewChecked, Renderer, HostListener} from '@angular/core';
import { Logger } from '../core/logger';
import { ActivatedRoute } from '@angular/router';
import { TransactionService } from '../core/transaction.service';
import { AccountService } from '../core/account.service';
import { Account, AccountTree } from '../shared/account';
import { Transaction, Split} from '../shared/transaction';
import { AppError } from '../shared/error';
//import { EditTxPage } from './edit';
import {
  FormControl,
  FormGroup,
  FormArray,
  Validators,
  FormBuilder,
  AbstractControl
} from '@angular/forms';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Util } from '../shared/util';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/mergeMap';
import { AdvancedEdit } from './advancededit';
import { TxItem } from './txitem';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-txlist',
  templateUrl: 'list.html',
  styleUrls: ['./list.scss']
})
export class TxListPage implements OnInit, AfterViewChecked {
  @ViewChild('body') body: ElementRef;
  @ViewChild('confirmDeleteModal') confirmDeleteModal: ElementRef;
  public account: Account;
  public items: TxItem[];
  public error: AppError;
  private accountId: string;
  private accountTree: AccountTree;
  private balance: number;
  private splits: any[];
  private selectAccounts: Account[];
  private needsScroll: boolean;
  private needsLittleScroll: boolean;
  private scrollLastHeight: number;
  private limit: number;
  private skip: number;
  private historyFinished: boolean;
  private fetching: boolean;
  private date: Date;
  private scrollSubject: Subject<any>;
  private hasScrolled: boolean;

  constructor(
    private log: Logger,
    private route: ActivatedRoute,
    private txService: TransactionService,
    private accountService: AccountService,
    private fb: FormBuilder,
    private renderer: Renderer,
    private modalService: NgbModal,
    private eRef: ElementRef
  ) {
    this.items = [];
    this.limit = 50;
    this.historyFinished = false;
    this.fetching = false;
    this.scrollSubject = new Subject<any>();
    this.hasScrolled = false;
  }

  ngOnInit() {
    this.accountId = this.route.snapshot.paramMap.get('id'); //+this.route.snapshot.paramMap.get('id');

    this.accountService.getAccountTree().subscribe(tree => {
      this.account = tree.accountMap[this.accountId];
      this.selectAccounts = tree.getFlattenedAccounts().filter(account => {
        return !account.children.length;
      });

      if(!this.accountTree) {
        this.accountTree = tree;

        this.skip = 0;
        this.date = new Date();

        let newTx = new Transaction({
          date: new Date(),
          splits: []
        });

        newTx.date.setHours(23, 59, 59, 999);

        newTx.splits.push(new Split({
          accountId: this.account.id
        }));
        newTx.splits.push(new Split());

        this.appendTransaction(newTx);

        let options = {limit: this.limit, beforeInserted: this.date.getTime()};
        let latestTxs$ = this.txService.getTransactionsByAccount(this.accountId, options).take(1);
        let newTxs$ = this.txService.getNewTransactionsByAccount(this.accountId);
        let deletedTxs$ = this.txService.getDeletedTransactionsByAccount(this.accountId);

        latestTxs$.mergeMap(txs => txs).concat(newTxs$)
          .subscribe(tx => {
            // insert tx into list
            this.addTransaction(tx);
          });

        deletedTxs$.subscribe(tx => {
          this.removeTransaction(tx);
          // remove tx from list
        });
      }

      this.accountTree = tree;
      this.updateBalances();
    });

    this.scrollSubject.debounceTime(100).subscribe(obj => {
      if(obj.percent < 0.2 && !this.fetching && !this.historyFinished) {
        this.fetchMoreTransactions();
      }
    });
  }

  @HostListener('document:click', ['$event'])
  clickout(event) {
    let clickedForm = false;
    let txId = undefined;
    let autocomplete = false;
    event.path.forEach((elem) => {
      if(elem.classList && elem.classList.contains('autocomplete')) {
        autocomplete = true;
      }
      if(elem.id && elem.id.indexOf('form') === 0) {
        clickedForm = true;
        if(elem.id.indexOf('undefined') === -1) {
          txId = elem.id.substring(4, 36);
        }
      }
    });

    if(autocomplete) {
      return;
    }

    this.items.forEach(item => {
      if(item.editing && (item.tx.id !== txId || !clickedForm)) {
        if(!item.form.pristine) {
          this.submit(item);
        }

        item.form = this.fb.group({
          splits: this.fb.array([])
        });

        item.editing = false;
      }
    });
  }

  fetchMoreTransactions() {
    this.fetching = true;
    this.log.debug('Fetching ' + this.limit + ' more transactions');
    this.skip += this.limit;
    let options = {limit: this.limit, skip: this.skip, beforeInserted: this.date.getTime()};
    this.txService.getTransactionsByAccount(this.accountId, options).subscribe(txs => {
      txs.forEach(tx => {
        this.addTransaction(tx);
      });

      if(txs.length < this.limit) {
        this.historyFinished = true;
      }

      this.fetching = false;
      this.needsScroll = false;
      this.needsLittleScroll = false;
      this.scrollLastHeight = this.body.nativeElement.scrollHeight;
    });
  }

  addTransaction(tx: Transaction) {
    this.insertTransaction(tx);
    // it should only scroll to bottom if the user has not scrolled yet
    if(!this.hasScrolled) {
      this.needsScroll = true;
    }
  }

  removeTransaction(tx: Transaction) {
    this.log.debug('remove tx');
    this.log.debug(tx);

    for(let i = 0; i < this.items.length; i++) {
      if(this.items[i].tx.id === tx.id) {
        this.items.splice(i, 1);
      }
    }

    this.sortItems();
    this.updateBalances();
  }

  ngAfterViewChecked() {
    if(this.needsLittleScroll) {
      this.scrollALittle();
      this.needsLittleScroll = false;
    }

    let lastItemEditing = this.items.length && this.items[this.items.length - 1].editing;

    if(this.needsScroll || lastItemEditing) {
      this.scrollToBottom();
      this.needsScroll = false;
    }

    if(this.scrollLastHeight) {
      this.scrollDiffHeight();
      this.scrollLastHeight = null;
    }

  }

  onScroll() {
    this.hasScrolled = true;
    let element = this.body.nativeElement;
    this.scrollSubject.next({
      scrollTop: element.scrollTop,
      scrollHeight: element.scrollHeight,
      clientHeight: element.clientHeight,
      percent: element.scrollTop / (element.scrollHeight - element.clientHeight)
    });
  }

  scrollToBottom() {
    let element = this.body.nativeElement;
    element.scrollTop = element.scrollHeight;
  }

  scrollALittle() {
    let element = this.body.nativeElement;
    element.scrollTop += 50;
  }

  scrollDiffHeight() {
    let element = this.body.nativeElement;
    let diff = element.scrollHeight - this.scrollLastHeight;
    element.scrollTop += diff;
  }

  sortItems() {
    this.items.sort((a, b) => {
      // sort in ascending order
      if(!a.tx.date) {
        return 1;
      }

      if(!b.tx.date) {
        return -1;
      }

      let dateDiff = a.tx.date.getTime() - b.tx.date.getTime();

      if(dateDiff) {
        return dateDiff;
      }

      let insertedDiff = a.tx.inserted.getTime() - b.tx.inserted.getTime();

      return insertedDiff;
    });
  }

  getTransferString(item: TxItem) {
    if(!item.tx.id) {
      return '';
    }

    let transferAccountId = this.getTransferAccountId(item);

    if(!transferAccountId) {
      return 'Split Transaction';
    }

    let transferAccount = this.accountTree.accountMap[transferAccountId];

    if(!transferAccount) {
      return 'Unidentified';
    }

    return transferAccount.fullName;
  }

  getTransferAccountId(item: TxItem): string {
    let transferAccountId = null;

    if(item.tx.splits.length === 2) {
      transferAccountId = item.tx.splits[0].accountId === this.account.id ?
        item.tx.splits[1].accountId :
        item.tx.splits[0].accountId;
    }

    return transferAccountId;
  }

  getDebit(item: TxItem) {
    return item.activeSplit.amount >= 0 ? item.activeSplit.amount : null;
  }

  getCredit(item: TxItem) {
    return item.activeSplit.amount < 0 ? -item.activeSplit.amount : null;
  }

  createTxItems(transaction: Transaction) {
    let items: TxItem[] = [];

    for(let i = 0; i < transaction.splits.length; i++) {
      let split = transaction.splits[i];

      if(split.accountId !== this.accountId) {
        continue;
      }

      let item = new TxItem();

      item.tx = transaction;
      item.form = this.fb.group({
        splits: this.fb.array([])
      });
      item.activeSplit = split;
      item.activeSplitIndex = i;
      item.balance = 0;
      item.editing = false;
      item.edit$ = new Subject<any>();

      items.push(item);
    }

    return items;
  }

  appendTransaction(transaction: Transaction) {
    let items = this.createTxItems(transaction);
    this.items = this.items.concat(items);
  }

  replaceTransaction(transaction: Transaction) {
    let items = this.createTxItems(transaction);

    // remove tx from list
    for(let i = 0; i < this.items.length; i++) {
      if(this.items[i].tx.id === transaction.id) {
        this.items.splice(i, 1);
      }
    }

    // add new items
    this.items = this.items.concat(items);

    this.sortItems();
    this.updateBalances();
  }

  insertTransaction(transaction: Transaction) {
    this.appendTransaction(transaction);
    this.sortItems();
    this.updateBalances();
  }

  updateBalances() {
    let balance = this.account.debitBalance ? this.account.balance : -this.account.balance;

    for(let i = this.items.length - 1; i >= 0; i--) {
      let item = this.items[i];
      item.balance = balance;

      if(item.activeSplit.amount) {
        if(this.account.debitBalance) {
          balance -= item.activeSplit.amount;
        } else {
          balance += item.activeSplit.amount;
        }
      }
    }
  }

  onTransaction(transaction: Transaction) {
    this.insertTransaction(transaction);
  }

  editTransaction(item: TxItem, $event) {
    if(item.editing) {
      return;
    }

    this.log.debug($event);

    this.log.debug('edit tx');
    this.log.debug(item);

    item.editing = true;

    let dateString = Util.getLocalDateString(item.tx.date);

    this.log.debug(item);
    let debit = this.getDebit(item);
    let credit = this.getCredit(item);

    let transferAccountId = this.getTransferAccountId(item);

    if(item.tx.splits.length > 2) {
      transferAccountId = this.account.id;
    }

    item.form = new FormGroup({
      date: new FormControl(dateString),
      description: new FormControl(item.tx.description, {updateOn: 'change'}),
      debit: new FormControl(debit ? debit / Math.pow(10, this.account.precision) : null),
      credit: new FormControl(credit ? credit / Math.pow(10, this.account.precision) : null),
      accountId: new FormControl(transferAccountId),
      splits: this.fb.array([])
    }, {updateOn: 'blur'});

    let valueChanges = item.form.get('debit').valueChanges
      .merge(item.form.get('credit').valueChanges)
      .merge(item.form.get('splits').valueChanges);

    valueChanges.subscribe(val => {
      if(!val) {
        return;
      }

      this.log.debug('value changes', val);
      this.solveEquations(item);
      this.fillEmptySplit(item);
    });

    if(item.tx.splits.length > 2) {
      let splits = item.form.get('splits') as FormArray;
      for(let split of item.tx.splits) {
        if(split.accountId === this.accountId) {
          continue;
        }

        let control = new FormGroup({
          accountId: new FormControl(split.accountId),
          debit: new FormControl(
            split.amount >= 0 ? split.amount / Math.pow(10, this.account.precision) : null
          ),
          credit: new FormControl(
            split.amount < 0 ? -split.amount / Math.pow(10, this.account.precision) : null
          )
        }, {updateOn: 'blur'});

        control.valueChanges.subscribe(val => {
          this.solveEquations(item);
          this.fillEmptySplit(item);
        });
        splits.push(control);

        this.fillEmptySplit(item);
      }
    }

    setTimeout(() => {
      if($event && $event.target.className) {
        let cName = $event.target.classList[$event.target.classList.length - 1];
        try {
          this.renderer.selectRootElement('#form' + item.tx.id + item.activeSplitIndex + ' .' + cName + ' input').focus();
        } catch(e) {
          // don't do anything if the element doesn't exist
        }
      }
    }, 10);

    // let modal = this.modalCtrl.create(EditTxPage, {transaction: transaction});
    // modal.present();
    // modal.onWillDismiss(() => {
    //   this.loadData();
    // })
    item.edit$.next(null);
  }
  deleteSplit(item: TxItem, index) {
    item.form.markAsDirty();
    this.log.debug('delete split');

    let splits = item.form.get('splits') as FormArray;

    if(splits.length === 1) {
      item.form.patchValue({
        accountId: splits.at(0).get('accountId').value
      });
    }

    splits.removeAt(index); 

  }

  addSplit(item: TxItem) {
    item.form.markAsDirty();
    //item.form.pristine = false;
    this.log.debug('add split');

    // scroll down a little
    this.needsLittleScroll = true;

    let splits = item.form.get('splits') as FormArray;

    if(splits.length === 0) {
      this.addFirstSplit(item);
      return;
    }

    let control = new FormGroup({
      accountId: new FormControl(),
      debit: new FormControl(),
      credit: new FormControl()
    }, {updateOn: 'blur'});

    control.valueChanges.subscribe(val => {
      this.solveEquations(item);
      this.fillEmptySplit(item);
    });
    splits.push(control);

    this.fillEmptySplit(item);
    // TODO how to focus newly created split in non-hacky way?
    setTimeout(() => {
      let rows: HTMLElement[] = Array.from(document.querySelectorAll('#form' + item.tx.id + item.activeSplitIndex + ' .row'));
      let input: any = rows[rows.length - 1].querySelectorAll('.debit input')[0];
      input && input.focus();
    }, 10);
  }

  addFirstSplit(item: TxItem) {
    let splits = item.form.get('splits') as FormArray;

    let accountId = item.form.get('accountId').value || null;
    let debit = item.form.get('debit').value || null;
    let credit = item.form.get('credit').value || null;

    item.form.patchValue({
      accountId: this.account.id
    });

    let control = new FormGroup({
      accountId: new FormControl(accountId),
      debit: new FormControl(credit),
      credit: new FormControl(debit)
    }, {updateOn: 'blur'});

    control.valueChanges.subscribe(val => {
      this.solveEquations(item);
      this.fillEmptySplit(item);
    });
    splits.push(control);

    this.fillEmptySplit(item);
  }

  fillEmptySplit(item: TxItem) {
    this.log.debug('fill empty split');

    // Total up splits and fill in any empty split with the leftover value
    let splits = item.form.get('splits') as FormArray;

    let emptySplit: AbstractControl;

    let amount = item.form.get('debit').value - item.form.get('credit').value;

    if(amount === 0) {
      emptySplit = item.form;
      this.log.debug('base split is empty');
    }

    for(let i = 0; i < splits.length; i++) {
      let split = splits.at(i);
      amount += parseFloat(split.get('debit').value) || 0;
      amount -= parseFloat(split.get('credit').value) || 0;

      if(!split.get('debit').value && !split.get('credit').value) {
        emptySplit = split;
      }
    }

    if(emptySplit) {
      let precision = 2;

      let account = this.accountTree.accountMap[emptySplit.get('accountId').value];
      if (account) {
        precision = account.precision;
      }

      amount = this.round(-amount, precision);
      this.log.debug('amount', amount);

      if(amount) {
        emptySplit.patchValue({
          debit: amount >= 0 ? amount  : '',
          credit: amount < 0 ? -amount : ''
        });
      }
    }
  }

  round(amount, precision) {
    return Math.round(amount * Math.pow(10, precision)) / Math.pow(10, precision);
  }

  submit(item: TxItem) {
    this.error = null;

    this.log.debug('submit!');
    this.log.debug(item.form.value);

    if(item.form.pristine) {
      item.editing = false;
      return;
    }

    let date = item.tx.id ? item.tx.date : new Date();
    let formDate = Util.getDateFromLocalDateString(item.form.value.date);

    date = this.computeTransactionDate(formDate, date);

    let tx = new Transaction({
      id: item.tx.id,
      date: date,
      description: item.form.value.description,
      splits: []
    });

    if(!item.form.value.splits.length) {
      let amount = item.form.value.debit ? parseFloat(item.form.value.debit) : -parseFloat(item.form.value.credit);
      amount = Math.round(amount * Math.pow(10, this.account.precision));

      tx.splits.push(new Split({
        accountId: this.account.id,
        amount: amount,
        nativeAmount: amount
      }));

      tx.splits.push(new Split({
        accountId: item.form.value.accountId,
        amount: -amount,
        nativeAmount: -amount
      }));
    } else {
      let amount = item.form.value.debit ? parseFloat(item.form.value.debit) : -parseFloat(item.form.value.credit);
      amount = Math.round(amount * Math.pow(10, this.account.precision));

      tx.splits.push(new Split({
        accountId: item.form.value.accountId,
        amount: amount,
        nativeAmount: amount
      }));
    }

    for(let i = 0; i < item.form.value.splits.length; i++) {
      let split = item.form.value.splits[i];
      let account = this.accountTree.accountMap[split.accountId];

      if(!account) {
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

    if(tx.id) {
      // update tx
      let oldId = tx.id;
      tx.id = Util.newGuid();

      this.txService.putTransaction(oldId, tx)
        .subscribe(tx => {
          // do nothing

        }, error => {
          this.error = error;
        });
    } else {
      // new tx

      let splits = item.form.get('splits') as FormArray;
      while(splits.length) {
        splits.removeAt(0);
      }

      item.form.reset();

      let newTx = new Transaction({
        date: new Date(),
        splits: []
      });

      newTx.date.setHours(23, 59, 59, 999);

      newTx.splits.push(new Split({
        accountId: this.account.id
      }));
      newTx.splits.push(new Split());
      item.tx = newTx;

      item.editing = false;
      item.activeSplit = newTx.splits[0];
      item.activeSplitIndex = 0;

      tx.id = Util.newGuid();

      this.txService.newTransaction(tx)
        .subscribe(tx => {
          // do nothing

        }, error => {
          this.error = error;
        });
    }
  }

  computeTransactionDate(formDate: Date, txDate: Date): Date {
    if(formDate.getTime()) {
      // make the time be at the very end of the day
      formDate.setHours(23, 59, 59, 999);
    }

    let sameDay = formDate.getFullYear() === txDate.getFullYear() &&
      formDate.getMonth() === txDate.getMonth() &&
      formDate.getDate() === txDate.getDate();

    if(formDate.getTime() && !sameDay) {
      txDate = formDate;
    }

    return txDate;
  }

  deleteTransaction(item) {
    this.modalService.open(this.confirmDeleteModal).result.then((result) => {
      this.log.debug('delete');
      this.txService.deleteTransaction(item.tx.id)
        .subscribe(() => {
          this.log.debug('successfully deleted transaction ' + item.tx.id);
        }, error => {
          this.error = error;
        })
    }, (reason) => {
      this.log.debug('cancel delete');
    });
  }

  advancedEdit(item) {
    let modal = this.modalService.open(AdvancedEdit, {size: 'lg'});

    modal.componentInstance.setData(item, this.accountTree);

    modal.result.then((result) => {
      this.log.debug('advanced edit save');
      this.log.debug(item.form);
    }, (reason) => {
      this.log.debug('cancel advanced edit');
    });
  }

  onEnter(item, $event) {
    this.submit(item);
  }

  solveEquations(item: TxItem) {
    this.log.debug('solveEquations');
    let originalDebit = item.form.get('debit').value;
    let originalCredit = item.form.get('credit').value;
    let precision = this.account.precision;
    let debit = originalDebit ? this.round(this.solve('' + originalDebit), precision) : '';
    let credit = originalCredit ? this.round(this.solve('' + originalCredit), precision) : '';

    if((originalDebit && debit !== originalDebit) || (originalCredit && credit !== originalCredit)) {
      this.log.debug('patch', debit, credit);
      this.log.debug('original', originalDebit, originalCredit);
      item.form.patchValue({
        debit: debit,
        credit: credit
      });
    }

    let splits = item.form.get('splits') as FormArray;

    for(let i = 0; i < splits.length; i++) {
      let split = splits.at(i);
      let originalDebit = split.get('debit').value;
      let originalCredit = split.get('credit').value;
      let debit = originalDebit ? this.round(this.solve('' + originalDebit), precision) : '';
      let credit = originalCredit ? this.round(this.solve('' + originalCredit), precision) : '';

      if((originalDebit && debit !== originalDebit) || (originalCredit && credit !== originalCredit)) {
        this.log.debug('patch', debit, credit);
        this.log.debug('original', originalDebit, originalCredit);
        split.patchValue({
          debit: debit,
          credit: credit
        });
      }
    }
  }

  solve(input: string) {
    // first pass: +-
    for(let i = input.length - 1; i >= 0; i--) {
      if(input.charAt(i) === '+') {
        return this.solve(input.slice(0, i)) + this.solve(input.slice(i + 1));
      } else if(input.charAt(i) === '-') {
        return this.solve(input.slice(0, i)) - this.solve(input.slice(i + 1));
      }
    }

    // second pass: */
    for(let i = input.length - 1; i >= 0; i--) {
      if(input.charAt(i) === '*') {
        return this.solve(input.slice(0, i)) * this.solve(input.slice(i + 1));
      } else if(input.charAt(i) === '/') {
        return this.solve(input.slice(0, i)) / this.solve(input.slice(i + 1));
      }
    }

    return parseFloat(input.trim()) || 0;
  }

  autocomplete(item: TxItem, tx: Transaction) {
    this.log.debug('chose tx', tx);

    let formDate = Util.getDateFromLocalDateString(item.form.value.date);
    item.tx = new Transaction(
      {
        id: item.tx.id,
        date: this.computeTransactionDate(formDate, new Date()),
        description: tx.description,
        splits: tx.splits
      }
    );

    for(let i = 0; i < tx.splits.length; i++) {
      let split = tx.splits[i];

      if(split.accountId !== this.accountId) {
        continue;
      }

      item.activeSplit = split;
      item.activeSplitIndex = i;
    }

    this.log.debug(tx);

    item.editing = false;
    this.editTransaction(item, {target: {className: 'description', classList: ['description']}});
    item.form.markAsDirty();
  }

}