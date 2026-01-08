import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatMessage',
  standalone: true
})
export class FormatMessagePipe implements PipeTransform {
  transform(value: string): string {
    // Convert **bold** to <strong>
    let formatted = value.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Convert line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    return formatted;
  }
}