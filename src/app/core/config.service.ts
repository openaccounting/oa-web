import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Org } from '../shared/org';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';


@Injectable()
export class ConfigService {
  private config: any;

  constructor() {}

  init(): Observable<any> {
    return this.load();
  }

  get(key: string): any {
    return this.config[key];
  }

  put(key: string, value: any) {
    this.config[key] = value;
    this.save();
  }

  clear() {
    this.config = {
      server: this.config.server
    };

    this.save();
  }

  save(): Observable<any> {
    localStorage.setItem('config', JSON.stringify(this.config));

    return Observable.of(this.config);
  }

  load(): Observable<any> {
    try {
      this.config = JSON.parse(localStorage.getItem('config')) || {};
    } catch(e) {
      this.config = {};
    }
    
    return Observable.of(null);
  }

}