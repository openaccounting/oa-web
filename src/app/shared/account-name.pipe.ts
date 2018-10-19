import { Pipe, PipeTransform } from '@angular/core';

@Pipe({name: 'accountName'})
export class AccountNamePipe implements PipeTransform {
  constructor() {
  }

  transform(name: string, depth: number): string {
    let parts = name.split(':');

    let accountString = '';

    if(!depth) {
      depth = 1;
    }

    parts = parts.slice(depth - 1, parts.length);

    return parts.join(':');
  }
}