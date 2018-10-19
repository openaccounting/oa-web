export class Org {
  id: string;
  inserted: Date;
  updated: Date;
  name: string;
  currency: string;
  precision: number;
  constructor(options: any = {}) {
    this.id = options.id;
    this.inserted = options.inserted ? new Date(options.inserted) : null;
    this.updated = options.updated ? new Date(options.updated) : null;
    this.name = options.name;
    this.currency = options.currency;
    this.precision = options.precision && parseInt(options.precision);
  }
}