import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,

  imports: [
    FormsModule,
    CommonModule,
    RouterModule
  ],

  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  formData = {

    email: '',
    password: ''
  };

  errorMessage = '';

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  login() {

    console.log(this.formData);

    this.api.login(this.formData)
      .subscribe({

      next: (res: any) => {

        console.log(res);

        localStorage.setItem(
          "role",
          res.role
        );

        if (res.role === 'ADMIN') {

          this.router.navigate(['/admin']);

        } else if (res.role === 'CASHIER') {

          this.router.navigate(['/cashier']);

        } else {

          this.router.navigate(['/customer']);
        }
      },

      error: (err: any) => {

        console.log(err);

        if (err.error) {

          this.errorMessage =
            err.error;

        } else {

          this.errorMessage =
            "Login Failed";
        }
      }
    });
  }
}