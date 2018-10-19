import { Component, Input } from '@angular/core';
import { Logger } from '../core/logger';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AppError } from '../shared/error';
import {
  FormControl,
  FormGroup,
  FormArray,
  Validators,
  FormBuilder,
  AbstractControl
} from '@angular/forms';
import { Util } from '../shared/util';
import { PriceService } from '../core/price.service';
import { Price } from '../shared/price';
import { Observable } from 'rxjs/Observable';

@Component({
  selector: 'price-modal',
  templateUrl: './price-modal.html',
  styleUrls: ['./price-modal.scss']
})
export class PriceModal {
  public form: FormGroup;
  public error: AppError;
  private originalDate: Date;

  constructor(
    public activeModal: NgbActiveModal,
    private log: Logger,
    private priceService: PriceService,
    private fb: FormBuilder
  ) {
    let dateString = Util.getLocalDateString(new Date());

    this.form = fb.group({
      'id': [null],
      'currency': ['', Validators.required],
      'date': [dateString, Validators.required],
      'price': [null, Validators.required]
    });
  }

  setData(data: any) {
    console.log(data);
    this.originalDate = data.date;
    this.form.patchValue({
      id: data.id,
      currency: data.currency,
      date: Util.getLocalDateString(data.date),
      price: data.price
    });
  }

  save() {
    this.error = null;

    let date = this.form.value.id ? this.originalDate : new Date();
    let formDate = Util.getDateFromLocalDateString(this.form.value.date);

    if(formDate.getTime()) {
      // make the time be at the very end of the day
      formDate.setHours(23, 59, 59, 999);
    }

    let sameDay = formDate.getFullYear() === date.getFullYear() &&
      formDate.getMonth() === date.getMonth() &&
      formDate.getDate() === date.getDate();

    if(formDate.getTime() && !sameDay) {
      date = formDate;
    }

    let price = new Price(this.form.value);
    price.date = date;

    if(this.form.value.id) {
      // update
      this.priceService.updatePrice(price).subscribe(price => {
        this.activeModal.close();
      }, err => {
        this.error = err;
      });

      return;
    }

    // new price
    price.id = Util.newGuid();

    this.priceService.newPrice(price).subscribe(price => {
      this.activeModal.close();
    }, err => {
      this.error = err;
    });
  }
}