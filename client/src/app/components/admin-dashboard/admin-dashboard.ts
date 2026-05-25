import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.html',
  styleUrls: ['./admin-dashboard.css']
})
export class AdminDashboardComponent implements OnInit {

  pendingCashiers: any[] = [];

  constructor(
    private api: ApiService
  ) {}

  ngOnInit(): void {

    this.loadPendingCashiers();
  }

  loadPendingCashiers() {

    this.api.getPendingCashiers()
      .subscribe((res: any) => {

        this.pendingCashiers = res;
      });
  }

  approveCashier(id: number) {

    this.api.approveCashier(id)
      .subscribe(() => {

        alert('Cashier Approved');

        this.loadPendingCashiers();
      });
  }
}