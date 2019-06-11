import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Logger } from '../core/logger';
import { TxItem } from './txitem';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import { TransactionService } from '../core/transaction.service';
import { Transaction } from '../shared/transaction';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'tx-autocomplete',
  templateUrl: 'autocomplete.html',
  styleUrls: ['./autocomplete.scss']
})
export class Autocomplete {
  @Input() item: TxItem;
  @Input() accountId: string;
  @Output() tx = new EventEmitter<Transaction>();
  @Output() interact = new EventEmitter<any>();
  public visible: boolean;
  public txs$: Observable<Transaction[]>;

  constructor(
    private log: Logger,
    private txService: TransactionService) {
  }

  ngOnInit() {
    this.txs$ = this.item.edit$
      .switchMap(() => {
        let control = this.item.form.get('description');
        return this.item.form.get('description').valueChanges;
      })
      .debounceTime(100)
      .filter(description => {
        if(!description || description.length < 3) {
          this.visible = false;
          return false;
        }

        return true;
      })
      .switchMap(description => {
        this.log.debug('autocomplete', description);

        let options = {limit: 5, descriptionStartsWith: description};
        return this.txService.getTransactionsByAccount(this.accountId, options);
      }).map(txs => {
        let txMap = {};
        return txs.filter(tx => {
          if(!txMap[tx.description]) {
            txMap[tx.description] = true;
            return true;
          }

          return false;
        });
      }).do((txs) => {
        if(txs.length) {
          this.visible = true;
        }
      });
  }

  click(tx: Transaction) {
    this.tx.emit(tx);
    this.visible = false;
  }

  preventBlur() {
    // used to notify parent that autocomplete has been interacted with and
    // that it should not try to do any onBlur() stuff
    this.interact.emit(true);
  }

}