import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { UserSubscriber } from "../models/usuario";

@Injectable({
  providedIn: "root",
})
export class ImplicitAutenticationService {
  private userSubject = new BehaviorSubject({} as UserSubscriber);
  public user$ = this.userSubject.asObservable();

  constructor() {
    const user = localStorage.getItem("user")!;
    this.userSubject.next(JSON.parse(atob(user)));
  }

  public getDocument() {
    return new Promise<string>((resolve) => {
      this.user$.subscribe(({ userService }) => {
        resolve(userService.documento);
      });
    });
  }
}
