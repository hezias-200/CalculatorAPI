import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RegisterRequest } from '../../interfaces/registerRequest';
import { Auth } from '../../services/auth.service';


@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register implements OnInit {
  @Input() isModal: boolean = false;
  @Input() hideTerms: boolean = false;
  @Output() onRegisterSuccess = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();

  registerForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  passwordStrength: 'weak' | 'medium' | 'strong' | '' = '';
  constructor(
    private fb: FormBuilder,
    private authService: Auth,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Redirect if already logged in
    if (!this.isModal && this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }

    this.registerForm = this.fb.group({
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]],
      role: ['User', [Validators.required]],
      acceptTerms: [false, this.hideTerms ? [] : [Validators.requiredTrue]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]],
      confirmPassword: ['', [
        Validators.required
      ]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Watch password changes for strength indicator
    this.registerForm.get('password')?.valueChanges.subscribe(password => {
      this.updatePasswordStrength(password);
    });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  updatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength = '';
      return;
    }

    let strength = 0;

    // Length check
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;

    // Complexity checks
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;

    if (strength <= 2) {
      this.passwordStrength = 'weak';
    } else if (strength <= 3) {
      this.passwordStrength = 'medium';
    } else {
      this.passwordStrength = 'strong';
    }
  }

  get username() {
    return this.registerForm.get('username');
  }
  get role() {
    return this.registerForm.get('role');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }

  get acceptTerms() {
    return this.registerForm.get('acceptTerms');
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const userData: RegisterRequest = {
        username: this.registerForm.value.username,
        email: this.registerForm.value.email || '',
        password: this.registerForm.value.password,
        role: this.registerForm.value.role || 'User'
      };

      this.authService.register(userData).subscribe({
        next: (response) => {
          this.isLoading = false;

          if (this.isModal) {
            // ✅ Modal mode - emit success and let parent handle
            this.successMessage = 'User added successfully!';
            setTimeout(() => {
              this.onRegisterSuccess.emit();
            }, 1000);
          } else {
            // ✅ Page mode - redirect to login
            this.successMessage = 'Registration successful! Redirecting to login...';
            this.registerForm.reset();
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          }
        },
        error: (error) => {
          this.isLoading = false;

          // Handle different error scenarios
          if (error.status === 400) {
            this.errorMessage = error.error?.message || 'Invalid registration data';
          } else if (error.status === 409) {
            this.errorMessage = 'Username or email already exists';
          } else {
            this.errorMessage = 'Registration failed. Please try again.';
          }

          console.error('Registration error:', error);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
    }
  }
  cancel(): void {
    this.onCancel.emit();
  }
}