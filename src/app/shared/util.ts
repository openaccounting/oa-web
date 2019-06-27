//import * as moment from 'moment-timezone/builds/moment-timezone-with-data-2012-2022.min';
import * as moment from 'moment-timezone';

const defaultTz = moment.tz.guess();

export class Util {
  static getLocalDateString(input: Date, tz: string) {
    let m = moment(input).tz(tz || defaultTz);

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

  static getLocalDateStringExcl(input: Date, tz: string) {
    let m = moment(input.getTime() - 1).tz(tz || defaultTz);

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

  static getDateFromLocalDateString(input: string, tz: string) {
    let parts = input.split('-');

    let m = moment().tz(tz || defaultTz);
    m.hours(0);
    m.minutes(0);
    m.seconds(0);
    m.milliseconds(0);
    m.year(parseInt(parts[0]));
    m.month(parseInt(parts[1]) - 1);
    m.date(parseInt(parts[2]));

    return m.toDate();
  }

  static getDateFromLocalDateStringExcl(input: string, tz: string) {
    let parts = input.split('-');

    let m = moment().tz(tz || defaultTz);
    m.hours(0);
    m.minutes(0);
    m.seconds(0);
    m.milliseconds(0);
    m.year(parseInt(parts[0]));
    m.month(parseInt(parts[1]) - 1);
    m.date(parseInt(parts[2]) + 1);

    return m.toDate();
  }

  static setFirstOfMonth(input: Date, tz: string) {
    let m = moment(input).tz(tz || defaultTz);

    m.date(1);
    input.setTime(m.valueOf());
  }

  static setBeginOfDay(input: Date, tz: string) {
    let m = moment(input).tz(tz || defaultTz);

    m.hours(0);
    m.minutes(0);
    m.seconds(0);
    m.milliseconds(0);
    input.setTime(m.valueOf());
  }

  static setEndOfDay(input: Date, tz: string) {
    let m = moment(input).tz(tz || defaultTz);

    m.hours(23);
    m.minutes(59);
    m.seconds(59);
    m.milliseconds(999);
    input.setTime(m.valueOf());
  }

  static getOneMonthLater(input: Date, tz: string): Date {
    let m = moment(input).tz(tz || defaultTz);

    m.month(m.month() + 1);

    return m.toDate();
  }

  static computeTransactionDate(formDate: Date, txDate: Date, tz: string): Date {
    if(!formDate || !formDate.getTime()) {
      return txDate;
    }

    let formMoment = moment(formDate).tz(tz || defaultTz);
    let txMoment = moment(txDate).tz(tz || defaultTz);

    // make the time be at the very end of the day
    formMoment.hours(23);
    formMoment.minutes(59);
    formMoment.seconds(59);
    formMoment.milliseconds(999);

    let sameDay = formMoment.year() === txMoment.year() &&
      formMoment.month() === txMoment.month() &&
      formMoment.date() === txMoment.date();

    if(sameDay) {
      return txDate;
    }

    if(formDate < txDate) {
      // make time end of day for past dates
      formMoment.hours(23);
      formMoment.minutes(59);
      formMoment.seconds(59);
      formMoment.milliseconds(999);
    } else {
      // make time beginning of day for future dates
      formMoment.hours(0);
      formMoment.minutes(0);
      formMoment.seconds(0);
      formMoment.milliseconds(0);
    }

    return formMoment.toDate();
  }

  static isSameDay(date1: Date, date2: Date, tz: string) {
    let m1 = moment(date1).tz(tz || defaultTz);
    let m2 = moment(date2).tz(tz || defaultTz);

    return m1.year() === m2.year() &&
      m1.month() === m2.month() &&
      m1.date() === m2.date();
  }

  static getPeriodStart(tz: string): Date {
    let m = moment().tz(tz || defaultTz);
    m.date(1);
    m.hours(0);
    m.minutes(0);
    m.seconds(0);
    m.milliseconds(0);

    return m.toDate();
  }

  static getTimezones(): string[] {
    let timezones = [''];
    return timezones.concat(moment.tz.names());
  }

  static getDefaultTimezone(): string {
    return defaultTz;
  }

  static newGuid() {
    let arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);

    return Array.prototype.map.call(arr, val => {
      return ('00' + val.toString(16)).slice(-2);
    }).join('');
  }
}