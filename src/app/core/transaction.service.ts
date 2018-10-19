import { Injectable } from '@angular/core';
import { Logger } from './logger';
import { ApiService } from './api.service';
import { WebSocketService } from './websocket.service';
import { SessionService } from './session.service';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import { Transaction } from '../shared/transaction';
import { Account } from '../shared/account';
import { Org } from '../shared/org';
import { Message } from '../shared/message';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/merge';
import 'rxjs/add/operator/filter';

@Injectable()
export class TransactionService {
  private transactionLastUpdated: Date;
  private cache: any;
  private recentTransactions: Transaction[] = null;
  private newTxs: Subject<Transaction>;
  private deletedTxs: Subject<Transaction>;
  private org: Org;
  private txSubscription: Subscription;

  constructor(
    private log: Logger,
    private apiService: ApiService,
    private wsService: WebSocketService,
    private sessionService: SessionService) {
    this.newTxs = new Subject<Transaction>();
    this.deletedTxs = new Subject<Transaction>();
    this.transactionLastUpdated = new Date(0);

    this.sessionService.getSessions().subscribe(([user, org]) => {
      this.log.debug('transactionService new session');

      // cleanup from old session
      if(this.txSubscription) {
        this.wsService.unsubscribe('transaction', this.org.id);
        this.txSubscription.unsubscribe();
        this.txSubscription = null;
      }

      this.org = org;

      if(org) {
        this.recentTransactions = null;

        let txMessages$ = this.wsService.subscribe('transaction', org.id);

        this.txSubscription = txMessages$.subscribe(message => {
          let tx = null;
          if(message.data) {
            tx = new Transaction(message.data);
          }

          if(tx && tx.updated) {
            this.transactionLastUpdated = tx.updated;
          }

          switch(message.action) {
            case 'create':
              if(this.recentTransactions) {
                this.recentTransactions.push(tx);
              }

              this.newTxs.next(tx);
              break;
            case 'update':
              if(this.recentTransactions) {
                for(let i = 0; i < this.recentTransactions.length; i++) {
                  if(this.recentTransactions[i].id === tx.id) {
                    this.recentTransactions[i] = tx;
                    break;
                  }
                }
              }

              this.deletedTxs.next(tx);
              this.newTxs.next(tx);
              break;
            case 'delete':
              if(this.recentTransactions) {
                for(let i = 0; i < this.recentTransactions.length; i++) {
                  if(this.recentTransactions[i].id === tx.id) {
                    this.recentTransactions.splice(i, 1);
                    break;
                  }
                }
              }
              this.deletedTxs.next(tx);
              break;
            case 'reconnect':
              this.log.debug('Resyncing transactions');
              this.log.debug('Fetching transactions since ' + this.transactionLastUpdated);
              let options = {sinceUpdated: this.transactionLastUpdated.getTime(), sort: 'updated-asc', includeDeleted: 'true'};
              this.apiService.getTransactions(options).subscribe(txs => {
                txs.forEach(tx => {
                  this.transactionLastUpdated = tx.updated;
                  if(tx.deleted) {
                    if(this.recentTransactions) {
                      for(let i = 0; i < this.recentTransactions.length; i++) {
                        if(this.recentTransactions[i].id === tx.id) {
                          this.recentTransactions.splice(i, 1);
                          break;
                        }
                      }
                    }
                    this.deletedTxs.next(tx);
                  } else {
                    if(this.recentTransactions) {
                      this.recentTransactions.push(tx);
                    }
                    this.newTxs.next(tx);
                  }
                });
              });
              break;
          }
        });
      }
    });
  }

  getNewTransactions(): Observable<Transaction> {
    return this.newTxs.asObservable();
  }

  getDeletedTransactions(): Observable<Transaction> {
    return this.deletedTxs.asObservable();
  }

  getRecentTransactions(): Observable<Transaction[]> {
    if(this.recentTransactions) {
      return Observable.of(this.recentTransactions);
    }

    return this.apiService.getTransactions({limit: 50}).do(transactions => {
      this.recentTransactions = transactions;
      transactions.forEach(tx => {
        if(tx.updated > this.transactionLastUpdated) {
          this.transactionLastUpdated = tx.updated;
        }
      });
    });
  }

  getLastTransactions(count: number): Observable<Transaction[]> {
    return this.getRecentTransactions()
      .map(txs => {
        return txs.sort((a, b) => {
          return b.date.getTime() - a.date.getTime();
        });
      })
      .map(txs => {
        return txs.slice(0, count);
      })
      .switchMap(initialTxs => {
        let txs = initialTxs;

        return Observable.of(initialTxs)
          .concat(this.getNewTransactions()
            .map(tx => {
              // TODO check date
              txs.unshift(tx);
              txs.pop();
              return txs;
            }).merge(this.getDeletedTransactions()
              .map(tx => {
                for(let i = 0; i < txs.length; i++) {
                  if(txs[i].id === tx.id) {
                    txs.splice(i, 1);
                  }
                }

                return txs;
              })
            )
          );
      });
  }

  getNewTransactionsByAccount(accountId: string): Observable<Transaction> {
    return this.getNewTransactions().filter(tx => {
      for(let split of tx.splits) {
        if(split.accountId === accountId) {
          return true;
        }
      }

      return false;
    });
  }

  getDeletedTransactionsByAccount(accountId: string): Observable<Transaction> {
    return this.getDeletedTransactions().filter(tx => {
      for(let split of tx.splits) {
        if(split.accountId === accountId) {
          return true;
        }
      }

      return false;
    });
  }

  getTransactionsByAccount (accountId: string, options: any = {}): Observable<Transaction[]> {
    return this.apiService.getTransactionsByAccount(accountId, options);
  }

  getTransactions(options: any = {}): Observable<Transaction[]> {
    return this.apiService.getTransactions(options);
  }

  newTransaction(transaction: Transaction): Observable<Transaction> {
    return this.apiService.postTransaction(transaction);
  }

  putTransaction(oldId: string, transaction: Transaction): Observable<Transaction> {
    return this.apiService.putTransaction(oldId, transaction);
  }

  deleteTransaction(id: string): Observable<any> {
    return this.apiService.deleteTransaction(id);
  }
}