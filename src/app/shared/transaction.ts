export class Transaction {
  id: string;
  orgId: string;
  userId: string;
  date: Date;
  inserted: Date;
  updated: Date;
  description: string;
  data: any;
  deleted: boolean;
  splits: Split[];
  constructor(options: any = {}) {
    this.id = options.id;
    this.orgId = options.id;
    this.userId = options.id;
    this.date = options.date ? new Date(options.date) : null;
    this.inserted = options.inserted ? new Date(options.inserted) : null;
    this.updated = options.updated ? new Date(options.updated) : null;
    this.description = options.description;
    this.data = options.data;
    this.deleted = options.deleted;
    this.splits = options.splits ? options.splits.map(split => new Split(split)) : [];
  }

  getData(): any {
    try {
      return JSON.parse(this.data);
    } catch(e) {
      return {};
    }
  }

  setData(data: any) {
    this.data = JSON.stringify(data);
  }

  // constructor(init?:Partial<Transaction>) {
  //   Object.assign(this, init);
  // }
}

export class Split {
  accountId: string;
  amount: number;
  nativeAmount: number;
  constructor(init?:Partial<Split>) {
    Object.assign(this, init);
  }
}