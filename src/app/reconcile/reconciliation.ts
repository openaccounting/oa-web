import { Transaction } from '../shared/transaction';

export class Reconciliation {
  startDate: Date;
  startBalance: number;
  endDate: Date;
  endBalance: number;
  net: number;
  txs: Transaction[] = [];
}