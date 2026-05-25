import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-register',
  standalone: true,

  imports: [
    FormsModule,
    CommonModule,
    RouterModule
  ],

  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {

  roles = [
    'CUSTOMER',
    'CASHIER'
  ];

  formData = {

  username: '',
  email: '',
  phoneNumber: '',
  password: '',
  confirmPassword: '',
  role: 'CUSTOMER'
};

  errorMessage = '';

  constructor(
    private api: ApiService,
    private router: Router
  ) {}

  register() {

    this.errorMessage = '';

    if (
  !this.formData.username ||
  !this.formData.email ||
  !this.formData.phoneNumber ||
  !this.formData.password
) {

      this.errorMessage =
        'All fields are required';

      return;
    }

    if (
      this.formData.password !==
      this.formData.confirmPassword
    ) {

      this.errorMessage =
        'Passwords do not match';

      return;
    }

    const payload = {

  username: this.formData.username,

  email: this.formData.email,

  phoneNumber: this.formData.phoneNumber,

  password: this.formData.password,

  role: this.formData.role
};

    this.api.register(payload)
      .subscribe({

next: (res: any) => {

  if (this.formData.role === 'CASHIER') {

    this.errorMessage =
      'Cashier registration successful. Waiting for admin approval.';

  } else {

    this.errorMessage =
      'Customer registration successful.';
  }

  this.formData = {

    username: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'CUSTOMER'
  };

  setTimeout(() => {

    this.router.navigate(['/login']);

  }, 2000);
},

        error: (err: any) => {

          console.log(err);

          if (typeof err.error === 'string') {

            this.errorMessage =
              err.error;

          } else {

            this.errorMessage =
              'Registration Failed';
          }
        }
      });
  }
}