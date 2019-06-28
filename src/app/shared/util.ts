export class Util {
  static newGuid() {
    let arr = new Uint8Array(16);
    window.crypto.getRandomValues(arr);

    return Array.prototype.map.call(arr, val => {
      return ('00' + val.toString(16)).slice(-2);
    }).join('');
  }
}