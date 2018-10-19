export class Message {
  version: string;
  sequenceNumber: number;
  type: string;
  action: string;
  data: any;

  constructor(options: any = {}) {
    this.version = options.version;
    this.sequenceNumber = options.sequenceNumber;
    this.type = options.type;
    this.action = options.action;
    this.data = options.data;
  }

  toString(): string {
    return JSON.stringify(this);
  }
}