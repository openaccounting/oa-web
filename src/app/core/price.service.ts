import { Injectable } from '@angular/core';
import { Logger } from './logger';
import { ApiService } from './api.service';
import { SessionService } from './session.service';
import { WebSocketService } from './websocket.service';
import { Price } from '../shared/price';
import { Org } from '../shared/org';
import { Message } from '../shared/message';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/merge';
import { Util } from '../shared/util';

@Injectable()
export class PriceService {
  private org: Org;
  private priceSubscription: Subscription;
  private newPrices: Subject<Price>;
  private deletedPrices: Subject<Price>;

  constructor(
    private log: Logger,
    private apiService: ApiService,
    private wsService: WebSocketService,
    private sessionService: SessionService) {

    this.newPrices = new Subject<Price>();
    this.deletedPrices = new Subject<Price>();

    this.sessionService.getSessions().subscribe(([user, org]) => {
      this.log.debug('priceService new session');

      // cleanup after old session
      if(this.priceSubscription) {
        this.wsService.unsubscribe('price', this.org.id);
        this.priceSubscription.unsubscribe();
        this.priceSubscription = null;
      }

      this.org = org;

      if(org) {
        // subscribe to web socket
        let priceWs$ = this.wsService.subscribe('price', org.id);

        this.priceSubscription = priceWs$.subscribe(message => {
          let price = null;

          if(message.data) {
            price = new Price(message.data);
          }

          switch(message.action) {
            case 'create':
              this.newPrices.next(price);
              break;
            case 'delete':
              this.deletedPrices.next(price);
              break;
          }
        });
      }
    });
  }

  getNewPrices(): Observable<Price> {
    return this.newPrices.asObservable();
  }

  getDeletedPrices(): Observable<Price> {
    return this.deletedPrices.asObservable();
  }

  getPricesNearestInTime(date: Date): Observable<Price[]> {
    // TODO make more efficient by mutating state as needed instead of full api call
    // on every price change
    let newPrices$ = this.getNewPrices();
    let deletedPrices$ = this.getDeletedPrices();

    let stream$ = Observable.of(null).concat(newPrices$.merge(deletedPrices$));

    return stream$.switchMap(() => {
      return this.apiService.getPricesNearestInTime(date);
    });
  }

  getPricesByCurrency(currency: string): Observable<Price[]> {
    return this.apiService.getPricesByCurrency(currency);
  }

  newPrice(price: Price): Observable<Price> {
    return this.apiService.postPrice(price);
  }

  deletePrice(id: string): Observable<any> {
    return this.apiService.deletePrice(id);
  }

  updatePrice(price: Price): Observable<Price> {
    return this.apiService.deletePrice(price.id).switchMap(() => {
      let newPrice = new Price(price);
      newPrice.id = Util.newGuid();
      return this.apiService.postPrice(newPrice);
    });
  }
}