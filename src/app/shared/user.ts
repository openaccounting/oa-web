export class User {
  id: string;
  inserted: Date;
  updated: Date;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  agreeToTerms: boolean;
  emailVerified: boolean;
  signupSource: string;
  constructor(options: any = {}) {
    this.id = options.id || this.id;
    this.inserted = options.inserted ? new Date(options.inserted) : null;
    this.updated = options.updated ? new Date(options.updated) : null;
    this.firstName = options.firstName || this.firstName;
    this.lastName = options.lastName || this.lastName;
    this.email = options.email || this.email;
    this.password = options.password || this.password;
    this.agreeToTerms = options.agreeToTerms || false;
    this.emailVerified = options.emailVerified || this.emailVerified;
    this.signupSource = options.signupSource || this.signupSource;
  }
}