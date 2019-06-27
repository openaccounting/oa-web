import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment-timezone/builds/moment-timezone-with-data-2012-2022.min';
//import * as moment from 'moment-timezone';

@Pipe({name: 'datetz'})
export class DateTzPipe implements PipeTransform {
  constructor() {
  }

  transform(date: Date, format: string, tz: string): string {
    let m = moment(date).tz(tz || moment.tz.guess());
    return m.format(format);
  }
}