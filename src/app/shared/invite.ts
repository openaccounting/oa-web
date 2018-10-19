export class Invite {
  id: string;
  orgId: string;
  inserted: Date;
  updated: Date;
  email: string;
  accepted: boolean;

  constructor(options: any = {}) {
    this.id = options.id;
    this.orgId = options.orgId;
    this.inserted = options.inserted ? new Date(options.inserted) : null;
    this.updated = options.updated ? new Date(options.updated) : null; 
    this.email = options.email;
    this.accepted = options.accepted;
  }
}