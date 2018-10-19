import { Component } from '@angular/core';
import { Logger } from '../core/logger';
import { 
  FormGroup,
  FormControl,
  Validators,
  FormBuilder,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { SessionService } from '../core/session.service';
import { PriceService } from '../core/price.service';
import { Price } from '../shared/price';
import { Org } from '../shared/org';
import { AppError } from '../shared/error';
import { Util } from '../shared/util';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/forkJoin';
import { NgbModal, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { PriceModal } from './price-modal';

@Component({
  selector: 'app-pricedb',
  templateUrl: 'pricedb.html',
  styleUrls: ['./pricedb.scss']
})
export class PriceDbPage {
  public org: Org;
  public currencies$: Observable<string[]>;
  public prices$: {[currency: string]: Observable<Price[]>};
  public error: AppError;
  public multiplier: number;
  private expandedCurrencies: {[currency: string]: boolean};

  constructor(
    private log: Logger,
    private sessionService: SessionService,
    private priceService: PriceService,
    private modalService: NgbModal
  ) {
    this.org = sessionService.getOrg();
    this.multiplier = Math.pow(10, this.org.precision);
    this.expandedCurrencies = {};

    this.prices$ = {};

    this.currencies$ = this.priceService.getPricesNearestInTime(new Date()).map(prices => {
      return prices.map(price => {
        return price.currency;
      }).sort((a, b) => {
        return a.localeCompare(b);
      });
    }).do(currencies => {
      currencies.forEach(currency => {
        this.prices$[currency] = this.priceService.getPricesByCurrency(currency).do(prices => {
          this.log.debug('got prices for ' + currency);
        });
      });
    });
  }

  isExpanded(currency: string) {
    return this.expandedCurrencies[currency];
  }

  click(currency: string) {
    this.expandedCurrencies[currency] = !this.expandedCurrencies[currency];
  }

  newPrice() {
    let modal = this.modalService.open(PriceModal);

    modal.result.then((result) => {
      this.log.debug('price modal save');
    }, (reason) => {
      this.log.debug('cancel price modal');
    });
  }

  editPrice(price: Price) {
    let modal = this.modalService.open(PriceModal);

    modal.componentInstance.setData(price);

    modal.result.then((result) => {
      this.log.debug('price modal save');
    }, (reason) => {
      this.log.debug('cancel price modal');
    });
  }

  deletePrice(price: Price) {
    this.error = null;
    this.priceService.deletePrice(price.id).subscribe(() => {
      // do nothing
    }, err => {
      this.error = err;
    });
  }

}