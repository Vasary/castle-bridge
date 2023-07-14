import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'unique'
})
export class UniquePipe implements PipeTransform {

  transform(value: any[]): any[] {
    return value.filter((value, index, array) => array.indexOf(value) === index);
  }

}
