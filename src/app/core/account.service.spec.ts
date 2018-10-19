import { AccountService } from './account.service';
import { ApiService } from './api.service';
import { WebSocketService } from './websocket.service';
import { TransactionService } from './transaction.service';
import { PriceService } from './price.service';
import { SessionService } from './session.service';
import { Observable } from 'rxjs/Observable';
import { EmptyObservable } from 'rxjs/observable/EmptyObservable';
import { Logger } from '../core/logger';

import { AccountApi } from '../shared/account';
import { Transaction } from '../shared/transaction';
import { Price } from '../shared/price';
import { Org } from '../shared/org';

var rawAccounts = [
  new AccountApi({
    id: '1',
    orgId: '1',
    name: 'Root',
    currency: 'USD',
    precision: 2,
    debitBalance: true
  }),
  new AccountApi({
    id: '2',
    orgId: '1',
    name: 'Assets',
    currency: 'USD',
    precision: 2,
    debitBalance: true,
    parent: '1'
  }),
  new AccountApi({
    id: '3',
    orgId: '1',
    name: 'Liabilities',
    currency: 'USD',
    precision: 2,
    debitBalance: false,
    parent: '1'
  }),
  new AccountApi({
    id: '4',
    orgId: '1',
    name: 'Equity',
    currency: 'USD',
    precision: 2,
    debitBalance: false,
    parent: '1'
  }),
  new AccountApi({
    id: '5',
    orgId: '1',
    name: 'Bitcoin',
    currency: 'BTC',
    precision: 8,
    debitBalance: true,
    parent: '2',
    balance: 1000000,
    nativeBalance: 7000
  }),
  new AccountApi({
    id: '6',
    orgId: '1',
    name: 'Current Assets',
    currency: 'USD',
    precision: 2,
    debitBalance: true,
    parent: '2'
  }),
  new AccountApi({
    id: '7',
    orgId: '1',
    name: 'Checking',
    currency: 'USD',
    precision: 2,
    debitBalance: true,
    parent: '6',
    balance: 1000,
    nativeBalance: 1000
  }),
  new AccountApi({
    id: '8',
    orgId: '1',
    name: 'Savings',
    currency: 'USD',
    precision: 2,
    debitBalance: true,
    parent: '6',
    balance: 2000,
    nativeBalance: 2000
  })
];

class Mock {

}

class ApiMock  {
  getAccounts() {
    return Observable.of(rawAccounts);
  }
}

class SessionMock {
  getSessions() {
    return new EmptyObservable();
  }
}

class TransactionMock {
  getNewTransactions() {
    return new EmptyObservable();
  }

  getDeletedTransactions() {
    return new EmptyObservable();
  }

  getRecentTransactions() {
    let txs = [
      new Transaction({
        id: '1',
        date: new Date('2018-09-24'),
        splits: [
          {
            accountId: '7',
            amount: -1000,
            nativeAmount: -1000
          },
          {
            accountId: '4',
            amount: 1000,
            nativeAmount: 1000
          }
        ]
      })
    ];
    return Observable.of(txs);
  }
}

class PriceMock {
  getPricesNearestInTime() {
    let prices = [
      new Price({
        id: '1',
        currency: 'BTC',
        date: new Date('2018-09-24'),
        price: 10000
      })
    ];
    return Observable.of(prices);
  }
}

describe('AccountService', () => {
  describe('#getAccountTree', () => {
    it('should correctly create an AccountTree', (done) => {
      let as = new AccountService(
        new Logger,
        new ApiMock() as ApiService,
        new Mock() as WebSocketService,
        new TransactionMock() as any,
        new PriceMock() as any,
        new SessionMock() as any
      );

      as['accountWs$'] = Observable.empty();

      as['org'] = new Org({
        id: '1',
        currency: 'USD',
        precision: 2
      });

      as.getAccountTree().subscribe(tree => {
        console.log(tree);
        expect(tree.rootAccount.name).toEqual('Root');
        expect(tree.rootAccount.depth).toEqual(0);
        expect(tree.rootAccount.totalBalance).toEqual(3000);
        expect(tree.rootAccount.totalNativeBalanceCost).toEqual(10000);
        expect(tree.rootAccount.totalNativeBalancePrice).toEqual(13000);
        expect(tree.rootAccount.children.length).toEqual(3);
        expect(tree.rootAccount.children[0].name).toEqual('Assets');
        expect(tree.rootAccount.children[0].fullName).toEqual('Assets');
        expect(tree.rootAccount.children[0].depth).toEqual(1);
        expect(tree.rootAccount.children[0].totalBalance).toEqual(3000);
        expect(tree.rootAccount.children[0].totalNativeBalanceCost).toEqual(10000);
        expect(tree.rootAccount.children[0].totalNativeBalancePrice).toEqual(13000);
        expect(tree.rootAccount.children[1].name).toEqual('Equity');
        expect(tree.rootAccount.children[1].fullName).toEqual('Equity');
        expect(tree.rootAccount.children[1].depth).toEqual(1);
        expect(tree.rootAccount.children[1].totalBalance).toEqual(0);
        expect(tree.rootAccount.children[2].name).toEqual('Liabilities');
        expect(tree.rootAccount.children[2].fullName).toEqual('Liabilities');
        expect(tree.rootAccount.children[2].depth).toEqual(1);
        expect(tree.rootAccount.children[2].totalBalance).toEqual(0);
        let assets = tree.rootAccount.children[0];
        expect(assets.children.length).toEqual(2);
        expect(assets.children[0].name).toEqual('Bitcoin');
        expect(assets.children[0].fullName).toEqual('Assets:Bitcoin');
        expect(assets.children[0].depth).toEqual(2);
        expect(assets.children[0].totalBalance).toEqual(1000000);
        expect(assets.children[0].totalNativeBalanceCost).toEqual(7000);
        expect(assets.children[0].totalNativeBalancePrice).toEqual(10000);
        expect(assets.children[1].name).toEqual('Current Assets');
        expect(assets.children[1].fullName).toEqual('Assets:Current Assets');
        expect(assets.children[1].depth).toEqual(2);
        expect(assets.children[1].totalBalance).toEqual(3000);
        let currentAssets = assets.children[1];
        expect(currentAssets.children.length).toEqual(2);
        expect(currentAssets.children[0].name).toEqual('Checking');
        expect(currentAssets.children[0].fullName).toEqual('Assets:Current Assets:Checking');
        expect(currentAssets.children[0].depth).toEqual(3);
        expect(currentAssets.children[0].totalBalance).toEqual(1000);
        expect(currentAssets.children[1].name).toEqual('Savings');
        expect(currentAssets.children[1].fullName).toEqual('Assets:Current Assets:Savings');
        expect(currentAssets.children[1].depth).toEqual(3);
        expect(currentAssets.children[1].totalBalance).toEqual(2000);

        done();
      });
    });
  });
  
  describe('#getRawAccountMap', () => {
    it('should correctly create a raw account map', (done) => {
      let as = new AccountService(
        new Logger,
        new ApiMock() as ApiService,
        new Mock() as WebSocketService,
        new TransactionMock() as any,
        new PriceMock() as any,
        new SessionMock() as any
      );

      as['accountWs$'] = Observable.empty();

      as.getRawAccountMap().subscribe(accountMap => {
        expect(Object.keys(accountMap).length).toEqual(rawAccounts.length);
        expect(accountMap['5'].price).toEqual(10000);
        expect(accountMap['7'].recentTxCount).toEqual(1);
        expect(accountMap['8'].recentTxCount).toEqual(0);
        done();
      }, (err) => {
        throw err;
      });

    });
  });
});