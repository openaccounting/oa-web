import { Injectable } from '@angular/core';
import { Logger } from './logger';
import { ApiService } from './api.service';
import { WebSocketService } from './websocket.service';
import { TransactionService } from './transaction.service';
import { SessionService } from './session.service';
import { PriceService } from './price.service';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { concat } from 'rxjs/observable/concat';
import { merge } from 'rxjs/observable/merge';
import { Account, AccountApi, AccountTree } from '../shared/account';
import { Transaction } from '../shared/transaction';
import { Org } from '../shared/org';
import { Price } from '../shared/price';
import { Message } from '../shared/message';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/concat';
import 'rxjs/add/operator/shareReplay';
import 'rxjs/add/observable/empty';
import 'rxjs/add/operator/startWith';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/take';
import { Util } from '../shared/util';
import { personalAccounts } from '../fixtures/personalAccounts';
import { ErrorObservable } from 'rxjs/observable/ErrorObservable';

@Injectable()
export class AccountService {
  private rawAccountMap$: Observable<{[accountId: string]: AccountApi}>;
  private rawAccountMaps: any = {};
  private accountWs$: Observable<Message>;
  private accountSubscription: Subscription;
  private org: Org;

  constructor(
    private log: Logger,
    private apiService: ApiService,
    private wsService: WebSocketService,
    private txService: TransactionService,
    private priceService: PriceService,
    private sessionService: SessionService) {

    this.sessionService.getSessions().subscribe(([user, org, options]) => {
      this.log.debug('accountService new session');

      // cleanup after old session
      this.rawAccountMap$ = null;
      this.rawAccountMaps = {};

      if(this.accountWs$ && this.org) {
        this.wsService.unsubscribe('account', this.org.id);
        this.accountWs$ = null;
      }

      this.org = org;

      if(org) {
        // subscribe to web socket
        this.accountWs$ = this.wsService.subscribe('account', org.id);

        if(options.createDefaultAccounts) {
          this.getAccountTree().take(1).switchMap(tree => {
            return this.createDefaultAccounts(tree);
          }).subscribe(accounts => {
            log.debug('Created default accounts');
            log.debug(accounts);
          }, err => {
            log.error('Error creating default accounts');
            log.error(err);
          })
        }
      }
    });
  }

  getRawSocketAccounts(): Observable<AccountApi> {
    return this.accountWs$.filter(message => {
      return message.action === 'create' || message.action === 'update';
    }).map(message => {
      return new AccountApi(message.data);
    });
  }

  getRawAccountMap(): Observable<{[accountId: string]: AccountApi}> {
    this.log.debug('getRawAccountMap()');
    if(!this.rawAccountMap$) {
      let emptyTx$ = Observable.of(new Transaction({splits: []}));
      let newTxs$ = concat(emptyTx$, this.txService.getNewTransactions());
      let deletedTxs$ = concat(emptyTx$, this.txService.getDeletedTransactions());

      this.rawAccountMap$ = this.txService.getRecentTransactions().map(recentTxs => {
        this.log.debug('recentTxs');
        return recentTxs.reduce((acc, tx) => {
          tx.splits.forEach(split => {
            acc[split.accountId] = (acc[split.accountId] || 0) + 1;
          });

          return acc;
        }, {});
      })
      .switchMap(txCounts => {
        this.log.debug('txCounts');
        this.log.debug(txCounts);
        return this.apiService.getAccounts().map(rawAccounts => {
          let rawAccountMap = {};

          rawAccounts.forEach(rawAccount => {
            rawAccountMap[rawAccount.id] = rawAccount;
            rawAccount.recentTxCount = txCounts[rawAccount.id] || 0;
          })
          return rawAccountMap;
        })
      })
      .switchMap(rawAccountMap => {
        this.log.debug('rawAccountMap');
        this.log.debug(rawAccountMap);
        return concat(Observable.of(null), this.accountWs$).map(message => {
          if(message && message.data) {
            let rawAccount = new AccountApi(message.data);
            switch(message.action) {
              case 'create':
              case 'update':
                rawAccountMap[rawAccount.id] = rawAccount;
                break;
              case 'delete':
                delete rawAccountMap[rawAccount.id];
            }
          }

          return rawAccountMap;
        })
      })
      .switchMap(rawAccountMap => {
        return this.priceService.getPricesNearestInTime(new Date()).map(prices => {
          this.log.debug(prices);
          prices.forEach(price => {
            for(let id in rawAccountMap) {
              let rawAccount = rawAccountMap[id];
              if(rawAccount.currency === price.currency) {
                rawAccount.price = price.price;
              }
            }
          });

          return rawAccountMap;
        });
      })
      .switchMap(rawAccountMap => {
        this.log.debug('newtxs');
        return newTxs$.map(tx => {
          for(let split of tx.splits) {
            let rawAccount = rawAccountMap[split.accountId];
            if(rawAccount) {
              rawAccount.balance += split.amount;
              rawAccount.nativeBalance += split.nativeAmount;
              rawAccount.recentTxCount++;
            }
          }
          return rawAccountMap;
        })
      })
      .switchMap(rawAccountMap => {
        this.log.debug('deletedtxs');
        return deletedTxs$.map(tx => {
          for(let split of tx.splits) {
            let rawAccount = rawAccountMap[split.accountId];
            if(rawAccount) {
              rawAccount.balance -= split.amount;
              rawAccount.nativeBalance -= split.nativeAmount;
              rawAccount.recentTxCount--;
            }
          }
          return rawAccountMap;
        })
      })
      .debounceTime(500)
      .shareReplay(1);
    }

    return this.rawAccountMap$;
  }

  getRawAccountMapAtDate(date: Date): Observable<{[accountId: string]: AccountApi}> {
    if(!this.rawAccountMaps[date.getTime()]) {

      let emptyTx$ = Observable.of(new Transaction({splits: []}));
      let newTxs$ = concat(emptyTx$, this.txService.getNewTransactions());
      let deletedTxs$ = concat(emptyTx$, this.txService.getDeletedTransactions());

      this.rawAccountMaps[date.getTime()] = this.apiService.getAccounts(date).map(rawAccounts => {
          let rawAccountMap = {};

          rawAccounts.forEach(rawAccount => {
            rawAccountMap[rawAccount.id] = rawAccount;
          })
          return rawAccountMap;
        })
        .switchMap(rawAccountMap => {
          return this.priceService.getPricesNearestInTime(date).map(prices => {
            this.log.debug(prices);
            prices.forEach(price => {
              for(let id in rawAccountMap) {
                let rawAccount = rawAccountMap[id];
                if(rawAccount.currency === price.currency) {
                  rawAccount.price = price.price;
                }
              }
            });

            return rawAccountMap;
          });
        })
        .switchMap(rawAccountMap => {
          this.log.debug('newtxs');
          return newTxs$.filter(tx => {
            return tx.date < date;
          }).map(tx => {
            for(let split of tx.splits) {
              let rawAccount = rawAccountMap[split.accountId];
              if(rawAccount) {
                rawAccount.balance += split.amount;
                rawAccount.nativeBalance += split.nativeAmount;
              }
            }
            return rawAccountMap;
          })
        })
        .switchMap(rawAccountMap => {
          this.log.debug('deletedtxs');
          return deletedTxs$.filter(tx => {
            return tx.date < date;
          }).map(tx => {
            for(let split of tx.splits) {
              let rawAccount = rawAccountMap[split.accountId];
              if(rawAccount) {
                rawAccount.balance -= split.amount;
                rawAccount.nativeBalance -= split.nativeAmount;
              }
            }
            return rawAccountMap;
          })
        })
        .debounceTime(500)
        .shareReplay(1);
    }

    return this.rawAccountMaps[date.getTime()];
  }

  getAccountTree(): Observable<AccountTree> {
    return this.getRawAccountMap()
      .map(rawAccountMap => {
        this.log.debug('accountTree: rawAccountMap');
        this.log.debug(rawAccountMap);
        let accountMap = {};
        let rootAccount = null;

        for(let id in rawAccountMap) {
          let rawAccount = rawAccountMap[id];
          let account = new Account(rawAccount);
          account.parent = null;
          account.orgCurrency = this.org.currency;
          account.orgPrecision = this.org.precision;
          accountMap[account.id] = account;
        }

        for(let id in rawAccountMap) {
          let rawAccount = rawAccountMap[id];
          let account = accountMap[id];

          if(accountMap[rawAccount.parent]) {
            account.parent = accountMap[rawAccount.parent];
            account.parent.children.push(account);
            // sort children alphabetically
            account.parent.children.sort((a, b) => {
              return a.name.localeCompare(b.name);
            });
          } else {
            rootAccount = account;
          }
        }

        this.log.debug('rootAccount', rootAccount);

        // cache account (for transaction consumers)

        return new AccountTree({
          rootAccount: rootAccount,
          accountMap: accountMap
        });
      })
      .map(tree => this._addDepths(tree))
      .map(tree => this._addFullNames(tree))
      .map(tree => this._updateBalances(tree));
  }

  getAccountTreeAtDate(date: Date): Observable<AccountTree> {
    return this.getRawAccountMapAtDate(date).map(rawAccountMap => {
      this.log.debug('rawAccounts');
      this.log.debug(rawAccountMap);
      let accountMap = {};
      let rootAccount = null;

      for(let id in rawAccountMap) {
        let rawAccount = rawAccountMap[id];
        let account = new Account(rawAccount);
        account.orgCurrency = this.org.currency;
        account.orgPrecision = this.org.precision;
        accountMap[account.id] = account;
      }

      for(let id in rawAccountMap) {
        let rawAccount = rawAccountMap[id];
        let account = accountMap[id];

        if(accountMap[rawAccount.parent]) {
          account.parent = accountMap[rawAccount.parent];
          account.parent.children.push(account);
          // sort children alphabetically
          account.parent.children.sort((a, b) => {
            return a.name.localeCompare(b.name);
          });
        } else {
          rootAccount = account;
        }
      }

      return new AccountTree({
        rootAccount: rootAccount,
        accountMap: accountMap
      });
    })
    .map(tree => this._addDepths(tree))
    .map(tree => this._addFullNames(tree))
    .map(tree => this._updateBalances(tree));
  }

  getAccountTreeWithPeriodBalance(startDate: Date, endDate?: Date): Observable<AccountTree> {
    let startTree$ = this.getAccountTreeAtDate(startDate);
    let endTree$ = endDate ? this.getAccountTreeAtDate(endDate) : this.getAccountTree();

    return Observable.combineLatest(startTree$, endTree$)
      .map(([start, end]) => {
        // function is impure... but convenient
        // consider making it pure

        for(let accountId in end.accountMap) {
          let account = end.accountMap[accountId];
          let startAccount = start.accountMap[accountId];

          this.log.debug(account.name, startAccount ? startAccount.balance : 0, account.balance);

          // TODO maybe there is a better way of dealing with price / balance for non-native currencies
          let balancePriceDelta = account.balance * account.price - (startAccount ? startAccount.balance * startAccount.price : 0);
          let balanceDelta = account.balance - (startAccount ? startAccount.balance : 0);

          let weightedPrice = 0;
          if(balanceDelta) {
            weightedPrice = balancePriceDelta / balanceDelta;
          }

          account.balance -= startAccount ? startAccount.balance : 0;
          account.nativeBalanceCost -= startAccount ? startAccount.nativeBalanceCost : 0;
          account.nativeBalancePrice -= startAccount ? startAccount.nativeBalancePrice : 0;
          account.totalBalance -= startAccount ? startAccount.totalBalance : 0;
          account.totalNativeBalanceCost -= startAccount ? startAccount.totalNativeBalanceCost : 0;
          account.totalNativeBalancePrice -= startAccount ? startAccount.totalNativeBalancePrice : 0;
          account.price = weightedPrice;
        }

        this.log.debug('accountTreeWithPeriodBalance');
        this.log.debug(end);

        return end;
      });
  }

  getFlattenedAccounts(): Observable<any> {
    return this.getAccountTree().map(tree => {
      return this._getFlattenedAccounts(tree.rootAccount);
    });
  }

  getFlattenedAccountsWithPeriodBalance(startDate: Date, endDate?: Date): Observable<Account[]> {
    return this.getAccountTreeWithPeriodBalance(startDate, endDate).map(tree => {
      return this._getFlattenedAccounts(tree.rootAccount);
    });
  }

  _getFlattenedAccounts(node: Account): Account[] {
    let flattened = [];

    for(let account of node.children) {
      flattened.push(account);
      flattened = flattened.concat(this._getFlattenedAccounts(account));
    }

    return flattened;
  }

  getAccountByName (accounts: Account[], name: string): Account {
    for(let account of accounts) {
      // TODO pass in depth
      if(account.name === name && account.depth === 1) {
        return account;
      }
    }

    return null;
  }

  sortAccountsAlphabetically(accounts) {
    accounts.sort((a, b) => {
      let nameA = a.name.toLowerCase();
      let nameB = b.name.toLowerCase();
      if (nameA < nameB)
        return -1;
      if (nameA > nameB)
        return 1;
      return 0;
    });
  }

  _addDepths(tree: AccountTree): AccountTree {
    for(let id in tree.accountMap) {
      let account = tree.accountMap[id];
      let node = account;

      let depth = 0;
      while(node.parent) {
        depth++;
        node = node.parent;
      }

      account.depth = depth;
    }

    return tree;
  }

  _addFullNames(tree: AccountTree): AccountTree {
    for(let id in tree.accountMap) {
      let account = tree.accountMap[id];
      let node = account;

      let accountArray = [account.name];

      while(node.parent && node.parent.depth > 0) {
        node = node.parent;
        accountArray.unshift(node.name);
      }

      account.fullName = accountArray.join(':');
    }

    return tree;
  }

  _updateBalances(tree: AccountTree): AccountTree {
    // TODO impure function

    // first zero out balances. not necessary if all functions are pure
    for(let accountId in tree.accountMap) {
      let account = tree.accountMap[accountId];

      account.totalBalance = account.balance;
      account.totalNativeBalanceCost = account.nativeBalanceCost;

      if(account.currency === this.org.currency) {
        account.nativeBalancePrice = account.balance;
      } else {
        account.nativeBalancePrice = account.balance * account.price / Math.pow(10, account.precision - this.org.precision);
      }

      account.totalNativeBalancePrice = account.nativeBalancePrice;
    }

    // update balances
    for(let accountId in tree.accountMap) {
      let account = tree.accountMap[accountId];

      if(!account.children.length) {
        let parent = account.parent;

        while(parent) {
          parent.totalNativeBalanceCost += account.totalNativeBalanceCost;
          parent.totalNativeBalancePrice += account.totalNativeBalancePrice;

          if(parent.currency === account.currency) {
            parent.totalBalance += account.totalBalance;
          }

          parent = parent.parent;
        }
      }
    }

    return tree;
  }

  getAccountTreeFromName(name: string, rootNode: Account) {
    for(var i = 0; i < rootNode.children.length; i++) {
      let child = rootNode.children[i];
      if(child.name === name) {
        return child;
      }

      try {
        let account = this.getAccountTreeFromName(name, child);
        return account;
      } catch(e) {
        // ignore
      }
    }

    throw new Error('Account not found ' + name);
  }

  getAccountAtoms(rootNode: Account): Account[] {
    let accounts = [];

    for(let i = 0; i < rootNode.children.length; i++) {
      let child = rootNode.children[i];
      if(!child.children.length) {
        accounts.push(child);
      } else {
        accounts = accounts.concat(this.getAccountAtoms(child));
      }
    }

    return accounts;
  }

  // getSelectBoxAccountAtoms(rootNode: Account): any[] {
  //   var data = [];

  //   for(let account of rootNode.children) {
  //     if(!account.children.length) {
  //       data.push({
  //         id: account.id,
  //         name: this.getAccountHierarchyString(account),
  //         debitBalance: account.debitBalance
  //       });
  //     }

  //     let childData = this.getSelectBoxAccountAtoms(account);
  //     data = data.concat(childData);
  //   }

  //   return data;
  // }

  accountIsChildOf(account: Account, parent: Account) {
    for(let child of parent.children) {
      if(child.id === account.id) {
        return true;
      }

      if(this.accountIsChildOf(account, child)) {
        return true;
      }
    }

    return false;
  }

  newAccount(account: AccountApi): Observable<Account> {
    return this.apiService.postAccount(account)
      .map(rawAccount => {
        let account = new Account(rawAccount);
        account.orgCurrency = this.org.currency;
        account.orgPrecision = this.org.precision;
        return account;
      });
  }

  putAccount(account: AccountApi): Observable<Account> {
    return this.apiService.putAccount(account)
      .map(rawAccount => {
        let account = new Account(rawAccount);
        account.orgCurrency = this.org.currency;
        account.orgPrecision = this.org.precision;
        return account;
      })
  }

  deleteAccount(id: string): Observable<any> {
    return this.apiService.deleteAccount(id);
  }

  createDefaultAccounts(tree: AccountTree): Observable<any> {
    let assetAccount = tree.getAccountByName('Assets', 1);
    let equityAccount = tree.getAccountByName('Equity', 1);
    let liabilityAccount = tree.getAccountByName('Liabilities', 1);
    let incomeAccount = tree.getAccountByName('Income', 1);
    let expenseAccount = tree.getAccountByName('Expenses', 1);

    let currency = assetAccount.currency;
    let precision = assetAccount.precision;

    let accountNameMap = {
      'Assets': [assetAccount.id, true],
      'Equity': [equityAccount.id, false],
      'Liabilities': [liabilityAccount.id, false],
      'Income': [incomeAccount.id, false],
      'Expenses': [expenseAccount.id, true]
    };

    let newAccounts;

    try {
      newAccounts = personalAccounts.map(data => {
        let id = Util.newGuid();
        let [parentId, debitBalance] = accountNameMap[data.parent];

        if(!parentId) {
          throw new Error('Parent does not exist ' + data.parent);
        }

        // TODO find a cleaner way of doing this without making assumptions
        if(['Assets', 'Equity', 'Liabilities', 'Income', 'Expenses'].indexOf(data.parent) > -1) {
          accountNameMap[data.name] = [id, debitBalance];
        }

        return new AccountApi({
          id: id,
          name: data.name,
          currency: currency,
          precision: precision,
          debitBalance: debitBalance,
          parent: parentId
        })
      });
    } catch(e) {
      return new ErrorObservable(e);
    }

    return this.apiService.postAccounts(newAccounts);
  }
}