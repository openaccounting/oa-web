export class AccountApi {
  id: string;
  orgId: string;
  inserted: Date;
  updated: Date;
  name: string;
  parent: string;
  currency: string;
  precision: number;
  debitBalance: boolean;
  balance: number;
  nativeBalance: number;
  readOnly: boolean;
  recentTxCount: number;
  price: number;
  constructor(options: any = {}) {
    this.id = options.id;
    this.orgId = options.orgId;
    this.inserted = options.inserted ? new Date(options.inserted): null;
    this.updated = options.updated ? new Date(options.updated): null;
    this.name = options.name;
    this.parent = options.parent ? options.parent : '';
    this.currency = options.currency;
    this.precision = options.precision ? parseInt(options.precision) : 0;
    this.debitBalance = options.debitBalance;
    this.balance = options.balance;
    this.nativeBalance = options.nativeBalance;
    this.readOnly = options.readOnly;
    this.recentTxCount = options.recentTxCount ? parseInt(options.recentTxCount) : 0;
    this.price = options.price;
  }
}

export class Account {
  id: string;
  orgId: string;
  inserted: Date;
  updated: Date;
  name: string;
  fullName: string;
  parent: Account;
  currency: string;
  precision: number;
  debitBalance: boolean;
  balance: number;
  totalBalance: number;
  nativeBalanceCost: number;
  totalNativeBalanceCost: number;
  nativeBalancePrice: number;
  totalNativeBalancePrice: number;
  price: number;
  orgCurrency: string;
  orgPrecision: number;
  readOnly: boolean;
  depth: number;
  recentTxCount: number;
  children: Account[];
  constructor(options: any = {}) {
    this.id = options.id;
    this.orgId = options.orgId;
    this.inserted = options.inserted ? new Date(options.inserted) : null;
    this.updated = options.updated ? new Date(options.updated) : null;
    this.name = options.name;
    this.fullName = options.fullName;
    this.parent = options.parent;
    this.currency = options.currency;
    this.precision = options.precision ? parseInt(options.precision) : 0;
    this.debitBalance = options.debitBalance || false;
    this.balance = options.balance || 0;
    this.totalBalance = options.totalBalance || 0;
    this.nativeBalanceCost = options.nativeBalance || 0;
    this.totalNativeBalanceCost = options.totalNativeBalanceCost || options.totalNativeBalance || 0;
    this.nativeBalancePrice = options.nativeBalancePrice || 0;
    this.totalNativeBalancePrice = options.totalNativeBalancePrice || 0;
    this.price = options.price || 0;
    this.orgCurrency = options.orgCurrency;
    this.orgPrecision = options.orgPrecision ? parseInt(options.orgPrecision) : 0;
    this.readOnly = options.readOnly;
    this.depth = options.depth;
    this.recentTxCount = options.recentTxCount || 0;
    this.children = options.children || [];
  }
}

export class AccountTree {
  accountMap: { [accountId: number]: Account; };
  rootAccount: Account;

  constructor(options: any = {}) {
    this.accountMap = options.accountMap;
    this.rootAccount = options.rootAccount;
  }

  getFlattenedAccounts(node?: Account): Account[] {
    if(!node) {
      node = this.rootAccount;
    }

    let flattened = [];

    for(let account of node.children) {
      flattened.push(account);
      flattened = flattened.concat(this.getFlattenedAccounts(account));
    }

    return flattened;
  }

  getAccountByName (name: string, depth?: number): Account {
    for(let id in this.accountMap) {
      let account = this.accountMap[id];

      if(account.name === name) {
        if(!depth || account.depth === depth) {
          return account;
        }
      }
    }

    return null;
  }

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

  getAccountAtoms(node?: Account): Account[] {
    if(!node) {
      node = this.rootAccount;
    }

    let accounts = [];

    for(let i = 0; i < node.children.length; i++) {
      let child = node.children[i];
      if(!child.children.length) {
        accounts.push(child);
      } else {
        accounts = accounts.concat(this.getAccountAtoms(child));
      }
    }

    return accounts;
  }

  getAccountLabel(account: Account, depth: number) {
    let node = account;

    let accountArray = [account.name];

    while(node.parent.depth >= depth) {
      node = node.parent;
      accountArray.unshift(node.name);
    }

    return accountArray.join(':');
  }
}