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

  public getRole() {
    const rolePromise = new Promise((resolve) => {
      this.user$.subscribe((data: any) => {
        // console.log('user data:', data);
        const { user, userService } = data;
        const roleUser = typeof user.role !== 'undefined' ? user.role : [];
        const roleUserService =
          typeof userService.role !== 'undefined' ? userService.role : [];
        const roles = roleUser
          .concat(roleUserService)
          .filter((data: any) => data.indexOf('/') === -1);
        resolve(roles);
      });
    });
    return rolePromise;
  }

  public getDocument() {
    return new Promise<string>((resolve) => {
      this.user$.subscribe(({ userService }) => {
        resolve(userService.documento);
      });
    });
  }
}
