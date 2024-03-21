import { Injectable } from '@angular/core'

@Injectable({
  providedIn: 'root'
})

export class VerificarFormulario {
  setCookie(name: string, val: string) {
    const date = new Date();
    const value = val;
    // Set it expire in 1 minute
    date.setTime(date.getTime() + 60 * 1000);
    // Set it
    document.cookie =
      name + '=' + value + '; expires=' + date.toUTCString() + '; path=/';
  }
}
