import { Injectable } from '@angular/core'
import { environment } from 'src/environments/environment';
import * as CryptoJS from 'crypto-js'

@Injectable({
  providedIn: 'root'
})

export class VerificarFormulario {
  setCookie(name: string, val: string) {
    const date = new Date();
    const value = this.encriptar(val, environment.SECRET_KEY);
    // Set it expire in 30 seconds
    date.setTime(date.getTime() + 30 * 1000);
    // Set it
    document.cookie =
      name + '=' + value + '; expires=' + date.toUTCString() + '; path=/';
  }

  encriptar(texto: string, clave: string): string {
    return CryptoJS.AES.encrypt(texto, clave).toString();
  }
}
