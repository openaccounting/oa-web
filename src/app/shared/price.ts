export class Price {
  id: string;
  currency: string;
  date: Date;
  inserted: Date;
  updated: Date;
  price: number;

  constructor(options: any = {}) {
    this.id = options.id;
    this.currency = options.currency;
    this.date = options.date ? new Date(options.date) : null;
    this.inserted = options.inserted ? new Date(options.inserted) : null;
    this.updated = options.updated ? new Date(options.updated) : null; 
    this.price = options.price;
  }
}