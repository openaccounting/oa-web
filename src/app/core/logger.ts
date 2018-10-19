import { Injectable } from '@angular/core';


@Injectable()
export class Logger {

  private logLevel: number;

  static FATAL: number = 0;
  static ERROR: number = 1;
  static INFO: number = 2;
  static DEBUG: number = 3;

  constructor() {
    this.logLevel = Logger.INFO;
  }

  setLevel(logLevel: number) {
    this.logLevel = logLevel;
  }

  fatal(...params: any[]) {
    if(this.logLevel >= Logger.FATAL) {
      params.unshift(new Date().toLocaleString());
      console.error.apply(null, params);
    }
  }

  error(...params: any[]) {
    if(this.logLevel >= Logger.ERROR) {
      params.unshift(new Date().toLocaleString());
      console.error.apply(null, params);
    }
  }

  info(...params: any[]) {
    if(this.logLevel >= Logger.INFO) {
      params.unshift(new Date().toLocaleString());
      console.log.apply(null, params);
    }
  }

  debug(...params: any[]) {
    if(this.logLevel >= Logger.DEBUG) {
      params.unshift(new Date().toLocaleString());
      console.log.apply(null, params);
    }
  }

}