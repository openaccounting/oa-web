import { Injectable } from '@angular/core';
import { Logger } from './logger';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { WebSocketSubject } from 'rxjs/observable/dom/WebSocketSubject';
import { Message } from '../shared/message';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/retryWhen';
import 'rxjs/add/operator/repeatWhen';
import 'rxjs/add/operator/delay';

var version = '^1.0.0';

@Injectable()
export class WebSocketService {

  private socket$: WebSocketSubject<Message>;
  private outputSocket$: Subject<Message>;
  private subscriptions: Message[];
  private reconnected: boolean;
  private sequenceNumber: number;
  private lastPongDate: Date;
  private closed: boolean;
  private authErrorCount: number;

  constructor(private log: Logger) {
    this.reconnected = false;
    this.subscriptions = [];
    this.outputSocket$ = new Subject<Message>();
    this.authErrorCount = 0;
  }

  init(url: string, key: string) {
    this.closed = false;
    this.socket$ = new WebSocketSubject({
      url: url,
      openObserver: {
        next: value => {
          this.log.debug('websocket connected!');
          this.sequenceNumber = -1;
          this.detectSleep();

          if(this.reconnected) {
            this.authenticate(key);
            this.sendReconnectMessage();

            this.log.debug('resubscribing to events');
            this.subscriptions.forEach(message => {
              this.log.debug(message);
              this.socket$.next(message);
            })
          }
        }
      },
      closeObserver: {
        next: value => {
          this.log.debug('websocket closed!');
          this.log.debug(value);

          if(value.code === 4000) {
            // authentication error
            // this could be because the socket got reconnected and we need
            // to send an authenticate message
            this.authErrorCount++;

            if(this.authErrorCount >= 3) {
              this.closed = true;
            }
          }

          if(value.code >= 4001) {
            // other intentional errors we should just stop trying to reconnect
             this.closed = true;
           }
        }
      }
    });

    this.socket$.retryWhen(errors$ => {
      if(this.closed) {
        throw new Error('closed');
      }

      return errors$.delay(1000).do(err => {
        this.log.debug('Websocket error');
        this.log.debug(err);

        this.reconnected = true;
      });      
    }).repeatWhen(completed => {
      if(this.closed) {
        throw new Error('closed');
      }

      return completed.delay(1000).do(err => {
        this.log.debug('Reconnecting to websocket because it closed');
        this.reconnected = true;
      })
    }).subscribe(message => {
      this.log.debug('Received message. Our sequenceNumber is ' + this.sequenceNumber);
      this.log.debug(message);

      this.authErrorCount = 0;

      if(message.type === 'pong') {
        this.lastPongDate = new Date();
      }

      if(message.sequenceNumber === 0 && this.sequenceNumber > 0) {
        // reconnected on us
        this.log.debug('Websocket reconnected on us');
        this.authenticate(key);
        this.sendReconnectMessage();
        this.sequenceNumber = 0;
        return;
      } else if(message.sequenceNumber !== this.sequenceNumber + 1) {
        // got a bad sequence number
        // need to reconnect and resync
        this.log.debug('Websocket out of sync');
        this.socket$.error({code: 3791, reason: 'Out of sync'});
        return;
      }

      this.sequenceNumber = message.sequenceNumber;
      this.outputSocket$.next(message);
    }, err => {
      this.log.error(err);
    }, () => {
      this.log.debug('Websocket complete.');
    });

    this.authenticate(key);
  }

  subscribe(type: string, orgId: string): Observable<Message> {
    let message = new Message({
      version: version,
      sequenceNumber: -1,
      type: type,
      action: 'subscribe',
      data: orgId
    });

    this.socket$.next(message);

    this.subscriptions.push(message);

    return this.outputSocket$.filter(message => {
      return message.type === type || message.type === 'reconnect';
    });
  }

  unsubscribe(type: string, orgId: string) {
    let message = new Message({
      version: version,
      sequenceNumber: -1,
      type: type,
      action: 'unsubscribe',
      data: orgId
    });

    this.socket$.next(message);

    this.subscriptions = this.subscriptions.filter(message => {
      return !(message.type === type && message.data === orgId);
    });
  }

  detectSleep() {
    let lastDate = new Date();
    let interval = setInterval(() => {
      let currentDate = new Date();
      if(currentDate.getTime() - lastDate.getTime() > 10000) {
        // Detected sleep
        this.log.debug('Sleep detected! Sending ping.');
        let date = new Date();

        let message = new Message({
          version: version,
          sequenceNumber: -1,
          type: 'ping',
          action: 'ping',
          data: null
        });

        this.socket$.next(message);

        setTimeout(() => {
          this.checkForPong(date);
        }, 5000);
      }

      lastDate = currentDate;
    }, 5000);
  }

  checkForPong(date: Date) {
    if(!this.lastPongDate || this.lastPongDate.getTime() < date.getTime()) {
      this.log.debug('no pong response');
      this.socket$.error({code: 3792, reason: 'No pong response'});
    }
  }

  sendReconnectMessage() {
    this.log.debug('notifiyng subscribers of reconnect event');
    let message = new Message({
      version: version,
      sequenceNumber: -1,
      type: 'reconnect',
      action: 'reconnect',
      data: null
    });

    this.outputSocket$.next(message);
  }

  close() {
    this.log.debug('Closed websocket');
    this.closed = true;
    this.socket$.unsubscribe();
  }

  authenticate(key: string) {
    let message = new Message({
      version: version,
      sequenceNumber: -1,
      type: 'authenticate',
      action: 'authenticate',
      data: key
    });

    this.socket$.next(message);
  }
}
