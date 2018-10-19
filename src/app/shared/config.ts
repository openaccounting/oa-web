export class Config {
  server: string;
  email: string;
  password: string; // switch to session based auth
  defaultOrg: string;
  reportData: any;
  constructor(options: any = {}) {
    this.server = options.server || 'https://openaccounting.io:8080/api';
    this.email = options.email;
    this.password = options.password;
    this.defaultOrg = options.defaultOrg;
  }
}