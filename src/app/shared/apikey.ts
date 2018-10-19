export class ApiKey {
  id: string;
  inserted: Date;
  updated: Date;
  userId: string;
  label: string;

  constructor(options: any = {}) {
    this.id = options.id;
    this.inserted = options.inserted ? new Date(options.inserted) : null;
    this.updated = options.updated ? new Date(options.updated) : null; 
    this.userId = options.userId;
    this.label = options.label;
  }
}