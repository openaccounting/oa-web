export class SessionOptions {
  createDefaultAccounts: string;
  constructor(options: any = {}) {
    this.createDefaultAccounts = options.createDefaultAccounts;
  }
};