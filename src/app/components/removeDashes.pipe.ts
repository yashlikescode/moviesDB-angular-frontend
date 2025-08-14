import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'removeTrailingDashes'
})
export class RemoveTrailingDashesPipe implements PipeTransform {
  transform(value: unknown): string {
    const s = (value ?? '').toString();
    // Hyphen-minus -, en dash \u2013, em dash \u2014, spaces (incl. NBSP)
    return s.replace(/[-\u2013\u2014\s\u00A0]+$/u, '');
  }
}
