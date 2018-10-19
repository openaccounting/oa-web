export class SessionOptions {
  createDefaultAccounts: boolean;
  constructor(options: any = {}) {
    this.createDefaultAccounts = options.createDefaultAccounts;
  }
};