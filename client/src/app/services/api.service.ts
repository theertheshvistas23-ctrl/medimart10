import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl =
    'http://localhost:8081/api';

  constructor(
    private http: HttpClient
  ) {}

  // REGISTER
  register(data: any) {

    return this.http.post(

      `${this.baseUrl}/register`,

      data
    );
  }

  // LOGIN
  login(data: any) {

    return this.http.post(

      `${this.baseUrl}/auth/login`,

      data
    );
  }

    // MEDICINES
  getMedicines() {

    return this.http.get(

      `${this.baseUrl}/medicines`
    );
  }

  // PENDING CASHIERS
  getPendingCashiers() {

    return this.http.get(

      `${this.baseUrl}/admin/cashiers/pending`
    );
  }

  // APPROVE CASHIER
  approveCashier(id: number) {

    return this.http.put(

      `${this.baseUrl}/admin/cashiers/approve/${id}`,

      {}
    );
  }
}