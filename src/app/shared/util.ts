export class Util {
  static getLocalDateString(input: Date) {
    let year = input.getFullYear().toString();
    let month = (input.getMonth() + 1).toString();
    let date = input.getDate().toString();

    if(month.length < 2) {
      month = '0' + month;
    }

    if(date.length < 2) {
      date = '0' + date;
    }

    return year + '-' + month + '-' + date;
  }

  static getDateFromLocalDateString(input: string) {
    let parts = input.split('-');
    let date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setFullYear(parseInt(parts[0]));
    date.setMonth(parseInt(parts[1]) - 1);
    date.setDate(parseInt(parts[2]));

    return date;
  }

  static newGuid() {
    let arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);

    return Array.prototype.map.call(arr, val => {
      return ('00' + val.toString(16)).slice(-2);
    }).join('');
  }
}