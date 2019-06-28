import { Component, Input } from '@angular/core';
import { Logger } from '../core/logger';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
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
import { SessionService } from '../core/session.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/mergeMap';
import { Reconciliation } from './reconciliation';

class TxItem {
  tx: Transaction;
  amount: number;
  splitIndex: number;
  reconciled: boolean;
}

@Component({
  selector: 'reconcile-modal',
  templateUrl: './reconcile-modal.html',
  styleUrls: ['./reconcile-modal.scss']
})
export class ReconcileModal {

  public account: Account;
  public reconciliation: Reconciliation;
  public items: TxItem[];
  public inflows: TxItem[];
  public outflows: TxItem[];
  public form: FormGroup;
  public balance: number;
  public reconciled: number;
  public error: AppError;
  public org: Org;

  constructor(
    public activeModal: NgbActiveModal,
    private log: Logger,
    private txService: TransactionService,
    private sessionService: SessionService,
    private fb: FormBuilder
  ) {
    this.org = this.sessionService.getOrg();
  }

  setData(account: Account, rec: Reconciliation) {
    this.account = account;

    this.inflows = [];
    this.outflows = [];
    this.reconciliation = rec;

    this.balance = rec.endBalance;
    this.reconciled = rec.startBalance;

    let txs$ = this.txService.getTransactionsByAccount(this.account.id);
    let newTxs$ = this.txService.getNewTransactionsByAccount(this.account.id);
    let deletedTxs$ = this.txService.getDeletedTransactionsByAccount(this.account.id);

    txs$.mergeMap(txs => txs).concat(newTxs$)
      .filter(tx => {
        let data = tx.getData();
        let reconciled = true;

        let reconciledSplits = Object.keys(data.reconciledSplits || []).map(index => parseInt(index));
        tx.splits.forEach((split, index) => {
          if(split.accountId === this.account.id && reconciledSplits.indexOf(index) === -1) {
            reconciled = false;
          }
        });

        return !reconciled;
      })
      .subscribe(tx => {
        // insert tx into list
        this.addTransaction(tx);
      });

    deletedTxs$.subscribe(tx => {
      this.removeTransaction(tx);
      // remove tx from list
    });
  }

  addTransaction(tx: Transaction) {
    tx.splits.forEach((split, index) => {
      if(split.accountId !== this.account.id) {
        return;
      }

      let item = new TxItem();
      item.tx = tx;
      item.amount = Math.abs(split.amount);
      item.splitIndex = index;
      item.reconciled = false;

      if(split.amount >= 0) {
        this.inflows.push(item);
      } else {
        this.outflows.push(item);
      }
    });

    this.sort();
  }

  removeTransaction(tx: Transaction) {
    for(let i = 0; i < this.inflows.length; i++) {
      let item = this.inflows[i];

      if(item.tx.id === tx.id) {
        this.inflows.splice(i, 1);
      }
    }

    for(let i = 0; i < this.outflows.length; i++) {
      let item = this.outflows[i];

      if(item.tx.id === tx.id) {
        this.outflows.splice(i, 1);
      }
    }
  }

  sort() {
    this.inflows.sort((a, b) => {
      let dateDiff = a.tx.date.getTime() - b.tx.date.getTime();

      if(dateDiff) {
        return dateDiff;
      }

      let insertedDiff = a.tx.inserted.getTime() - b.tx.inserted.getTime();

      if(insertedDiff) {
        return insertedDiff;
      }
    });

    this.outflows.sort((a, b) => {
      let dateDiff = a.tx.date.getTime() - b.tx.date.getTime();

      if(dateDiff) {
        return dateDiff;
      }

      let insertedDiff = a.tx.inserted.getTime() - b.tx.inserted.getTime();

      if(insertedDiff) {
        return insertedDiff;
      }
    });
  }

  toggleReconciled(item: TxItem) {
    item.reconciled = !item.reconciled;

    let data = item.tx.getData();

    if(item.reconciled) {
      if(!data.reconciledSplits) {
        data.reconciledSplits = {};
      }

      data.reconciledSplits[item.splitIndex] = this.reconciliation.endDate;

      if(this.account.debitBalance) {
        this.reconciled += item.tx.splits[item.splitIndex].amount;
      } else {
        this.reconciled -= item.tx.splits[item.splitIndex].amount;
      }
    } else {
      if(!data.reconciledSplits) {
        return;
      }

      delete data.reconciledSplits[item.splitIndex];
      if(this.account.debitBalance) {
        this.reconciled -= item.tx.splits[item.splitIndex].amount;
      } else {
        this.reconciled += item.tx.splits[item.splitIndex].amount;
      }
    }

    item.tx.setData(data);
  }

  save() {
    if(this.balance !== this.reconciled) {
      this.error = new AppError('Reconciled amount doesn\'t match balance');
      return;
    }

    this.sessionService.setLoading(true);

    let txs = this.inflows.filter(item => item.reconciled).map(item => item.tx);

    txs = txs.concat(this.outflows.filter(item => item.reconciled).map(item => item.tx));

    Observable.from(txs).mergeMap(tx => {
      let oldId = tx.id;
      tx.id = Util.newGuid();

      return this.txService.putTransaction(oldId, tx);
    }, 8).subscribe(tx => {
      this.log.debug('Saved tx ' + tx.id);
    }, err => {
      this.error = err;
      this.sessionService.setLoading(false);
    }, () => {
      this.sessionService.setLoading(false);
      this.activeModal.close(txs);
    });
  }
}