import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  baseUrl = 'http://localhost:8081/api';

  constructor(private http: HttpClient) {}

  login(data:any) {

    return this.http.post(
      `${this.baseUrl}/auth/login`,
      data
    );
  }

  register(user: any) {

    return this.http.post(
      `${this.baseUrl}/register`,
      user
    );
  }

  getMedicines() {

    return this.http.get(
      `${this.baseUrl}/admin/medicine`
    );
  }

  addMedicine(data:any) {

    return this.http.post(
      `${this.baseUrl}/admin/medicine`,
      data
    );
  }
}