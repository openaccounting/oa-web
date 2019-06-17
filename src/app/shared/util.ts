//import * as moment from 'moment-timezone/builds/moment-timezone-with-data-2012-2022.min';
import * as moment from 'moment-timezone';

const defaultTz = moment.tz.guess();

export class Util {
  static getLocalDateString(input: Date, tz: string = defaultTz) {
    let m = moment(input).tz(tz);

    let year = m.format('YYYY');
    let month = m.format('MM');
    let date = m.format('DD');

    if(month.length < 2) {
      month = '0' + month;
    }

    if(date.length < 2) {
      date = '0' + date;
    }

    return year + '-' + month + '-' + date;
  }

  static getLocalDateStringExcl(input: Date, tz: string = defaultTz) {
    let m = moment(input.getTime() - 1).tz(tz);

    let year = m.format('YYYY');
    let month = m.format('MM');
    let date = m.format('DD');

    if(month.length < 2) {
      month = '0' + month;
    }

    if(date.length < 2) {
      date = '0' + date;
    }

    return year + '-' + month + '-' + date;
  }

  static getDateFromLocalDateString(input: string, tz: string = defaultTz) {
    let parts = input.split('-');

    let m = moment().tz(tz);
    m.hours(0);
    m.minutes(0);
    m.seconds(0);
    m.milliseconds(0);
    m.year(parseInt(parts[0]));
    m.month(parseInt(parts[1]) - 1);
    m.date(parseInt(parts[2]));

    return m.toDate();
  }

  static getDateFromLocalDateStringExcl(input: string, tz: string = defaultTz) {
    let parts = input.split('-');

    let m = moment().tz(tz);
    m.hours(0);
    m.minutes(0);
    m.seconds(0);
    m.milliseconds(0);
    m.year(parseInt(parts[0]));
    m.month(parseInt(parts[1]) - 1);
    m.date(parseInt(parts[2]) + 1);

    return m.toDate();
  }

  static setFirstOfMonth(input: Date, tz: string = defaultTz) {
    let m = moment(input).tz(tz);

    m.date(1);
    input.setTime(m.valueOf());
  }

  static setBeginOfDay(input: Date, tz: string = defaultTz) {
    let m = moment(input).tz(tz);

    m.hours(0);
    m.minutes(0);
    m.seconds(0);
    m.milliseconds(0);
    input.setTime(m.valueOf());
  }

  static setEndOfDay(input: Date, tz: string = defaultTz) {
    let m = moment(input).tz(tz);

    m.hours(23);
    m.minutes(59);
    m.seconds(59);
    m.milliseconds(999);
    input.setTime(m.valueOf());
  }

  static getOneMonthLater(input: Date, tz: string = defaultTz): Date {
    let m = moment(input).tz(tz);

    m.month(m.month() + 1);

    return m.toDate();
  }

  static computeTransactionDate(formDate: Date, txDate: Date, tz: string = defaultTz): Date {
    if(!formDate || !formDate.getTime()) {
      return txDate;
    }

    let formMoment = moment(formDate).tz(tz);
    let txMoment = moment(txDate).tz(tz);

    // make the time be at the very end of the day
    formMoment.hours(23);
    formMoment.minutes(59);
    formMoment.seconds(59);
    formMoment.milliseconds(999);

    let sameDay = formMoment.year() === txMoment.year() &&
      formMoment.month() === txMoment.month() &&
      formMoment.date() === txMoment.date();

    if(!sameDay) {
      return formMoment.toDate();
    }

    return txDate;
  }

  static newGuid() {
    let arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);

    return Array.prototype.map.call(arr, val => {
      return ('00' + val.toString(16)).slice(-2);
    }).join('');
  }
}