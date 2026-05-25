import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-cashier-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cashier-dashboard.html'
})
export class CashierDashboardComponent implements OnInit {

  medicines: any[] = [];

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.getAllMedicines();
  }

  getAllMedicines(): void {
    this.api.getMedicines().subscribe({
      next: (res: any) => {
        this.medicines = res;
      },
      error: (err) => {
        console.error('Error loading medicines:', err);
        this.medicines = [];
      }
    });
  }
}