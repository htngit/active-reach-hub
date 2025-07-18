# Authentication System Usage Guide

## 🚀 Quick Start

Sistem autentikasi Active Reach Hub telah ditingkatkan dengan error handling yang komprehensif, validasi input yang ketat, dan user experience yang lebih baik.

## 📋 Prerequisites

- Node.js 18+
- Supabase project configured
- Environment variables set up

## 🔧 Setup

### 1. Environment Configuration

Pastikan file `.env.local` berisi:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Development Server

```bash
npm run dev
```

## 🎯 Using the Authentication System

### 1. Basic Authentication Hook

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { 
    user, 
    loading, 
    signIn, 
    signUp, 
    signOut,
    resetPassword,
    updatePassword 
  } = useAuth();

  // Your component logic
}
```

### 2. Advanced Validation Hook

```typescript
import { useAuthValidation } from '@/hooks/useAuthValidation';

function LoginForm() {
  const {
    emailError,
    passwordError,
    passwordStrength,
    isRateLimited,
    rateLimitTimeRemaining,
    validateEmail,
    validatePassword,
    signInWithValidation
  } = useAuthValidation();

  const handleSubmit = async (email: string, password: string) => {
    const success = await signInWithValidation(email, password);
    if (success) {
      // Handle successful login
    }
  };
}
```

### 3. Direct Service Usage

```typescript
import { AuthService } from '@/services/authService';

// Sign in with error handling
const response = await AuthService.signIn(email, password);
if (response.success) {
  console.log('Login successful');
} else {
  console.error('Login failed:', response.error);
}
```

## 🛡️ Error Handling Examples

### 1. Login Errors

```typescript
const handleLogin = async (email: string, password: string) => {
  try {
    const success = await signInWithValidation(email, password);
    
    if (!success) {
      // Error sudah ditangani oleh hook dan ditampilkan via toast
      return;
    }
    
    // Login berhasil
    navigate('/dashboard');
  } catch (error) {
    // Fallback error handling
    console.error('Unexpected error:', error);
  }
};
```

### 2. Registration with Validation

```typescript
const handleRegister = async (email: string, password: string, confirmPassword: string) => {
  // Validasi real-time
  const isEmailValid = validateEmail(email);
  const isPasswordValid = validatePassword(password);
  const isConfirmValid = validateConfirmPassword(password, confirmPassword);
  
  if (!isEmailValid || !isPasswordValid || !isConfirmValid) {
    // Error messages sudah ditampilkan via hook
    return;
  }
  
  // Rate limiting check
  if (isRateLimited) {
    toast({
      title: "Too Many Attempts",
      description: `Please wait ${Math.ceil(rateLimitTimeRemaining / 1000)} seconds`,
      variant: "destructive"
    });
    return;
  }
  
  const success = await signUpWithValidation(email, password, confirmPassword);
  if (success) {
    navigate('/verify-email');
  }
};
```

### 3. Password Reset Flow

```typescript
const handlePasswordReset = async (email: string) => {
  const success = await resetPasswordWithValidation(email);
  
  if (success) {
    // User akan menerima toast notification
    setShowResetForm(false);
  }
};
```

## 🎨 UI Components Integration

### 1. Password Strength Indicator

```typescript
function PasswordStrengthIndicator({ strength }: { strength: PasswordStrength }) {
  const getStrengthColor = () => {
    switch (strength.level) {
      case 'weak': return 'bg-red-500';
      case 'fair': return 'bg-yellow-500';
      case 'good': return 'bg-blue-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="mt-2">
      <div className="flex justify-between text-sm">
        <span>Password Strength</span>
        <span className="capitalize">{strength.level}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
        <div 
          className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
          style={{ width: `${strength.score * 25}%` }}
        />
      </div>
      {strength.suggestions.length > 0 && (
        <ul className="text-xs text-gray-600 mt-1">
          {strength.suggestions.map((suggestion, index) => (
            <li key={index}>• {suggestion}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### 2. Rate Limit Warning

```typescript
function RateLimitWarning({ isRateLimited, timeRemaining }: {
  isRateLimited: boolean;
  timeRemaining: number;
}) {
  if (!isRateLimited) return null;

  const minutes = Math.ceil(timeRemaining / 60000);
  
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mt-2">
      <div className="flex">
        <AlertTriangle className="h-5 w-5 text-yellow-400" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Too Many Attempts
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            Please wait {minutes} minute(s) before trying again.
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 3. Error Display Component

```typescript
function AuthErrorDisplay({ error }: { error: string }) {
  if (!error) return null;
  
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-3 mt-2">
      <div className="flex">
        <XCircle className="h-5 w-5 text-red-400" />
        <div className="ml-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    </div>
  );
}
```

## 🔍 Testing Your Implementation

### 1. Manual Testing Scenarios

#### Test Wrong Credentials
```typescript
// Test dengan email yang tidak terdaftar
const testWrongEmail = async () => {
  const result = await signInWithValidation('nonexistent@example.com', 'password123');
  // Expected: Error toast "Email tidak ditemukan"
};

// Test dengan password yang salah
const testWrongPassword = async () => {
  const result = await signInWithValidation('user@example.com', 'wrongpassword');
  // Expected: Error toast "Kata sandi salah"
};
```

#### Test Rate Limiting
```typescript
// Test rate limiting dengan 5 percobaan gagal berturut-turut
const testRateLimit = async () => {
  for (let i = 0; i < 6; i++) {
    await signInWithValidation('user@example.com', 'wrongpassword');
  }
  // Expected: Rate limit warning setelah percobaan ke-5
};
```

#### Test Password Validation
```typescript
// Test password lemah
const testWeakPassword = () => {
  const isValid = validatePassword('123');
  // Expected: false, dengan error message tentang kekuatan password
};

// Test password kuat
const testStrongPassword = () => {
  const isValid = validatePassword('MyStr0ng!P@ssw0rd');
  // Expected: true, dengan strength indicator "strong"
};
```

### 2. Automated Testing

```typescript
// Jest test example
describe('Authentication Error Handling', () => {
  test('should handle invalid email format', async () => {
    const { result } = renderHook(() => useAuthValidation());
    
    const isValid = result.current.validateEmail('invalid-email');
    expect(isValid).toBe(false);
    expect(result.current.emailError).toContain('Format email tidak valid');
  });
  
  test('should enforce password strength requirements', async () => {
    const { result } = renderHook(() => useAuthValidation());
    
    const isValid = result.current.validatePassword('weak');
    expect(isValid).toBe(false);
    expect(result.current.passwordStrength.level).toBe('weak');
  });
  
  test('should implement rate limiting', async () => {
    const { result } = renderHook(() => useAuthValidation());
    
    // Simulate multiple failed attempts
    for (let i = 0; i < 5; i++) {
      await result.current.signInWithValidation('test@example.com', 'wrong');
    }
    
    expect(result.current.isRateLimited).toBe(true);
  });
});
```

## 🚨 Common Issues & Solutions

### 1. Rate Limiting Issues

**Problem**: User terkena rate limit saat development

**Solution**:
```typescript
// Temporary disable rate limiting untuk development
const isDevelopment = process.env.NODE_ENV === 'development';

if (!isDevelopment && isRateLimited) {
  // Show rate limit warning
}
```

### 2. Toast Notifications Not Showing

**Problem**: Toast tidak muncul setelah error

**Solution**: Pastikan `Toaster` component sudah di-import di root app:
```typescript
// App.tsx
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <div className="App">
      {/* Your app content */}
      <Toaster />
    </div>
  );
}
```

### 3. Validation Not Working

**Problem**: Real-time validation tidak berfungsi

**Solution**: Pastikan hook dipanggil dengan benar:
```typescript
// ❌ Wrong
const validation = useAuthValidation;

// ✅ Correct
const validation = useAuthValidation();
```

### 4. Environment Variables

**Problem**: Supabase connection error

**Solution**: Periksa environment variables:
```bash
# Check if variables are loaded
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY);
```

## 📚 API Reference

### AuthService Methods

| Method | Parameters | Return Type | Description |
|--------|------------|-------------|-------------|
| `signIn` | `email: string, password: string` | `Promise<AuthResponse>` | Sign in user with validation |
| `signUp` | `email: string, password: string` | `Promise<AuthResponse>` | Register new user |
| `signOut` | None | `Promise<AuthResponse>` | Sign out current user |
| `resetPasswordForEmail` | `email: string` | `Promise<AuthResponse>` | Send password reset email |
| `updatePassword` | `newPassword: string` | `Promise<AuthResponse>` | Update user password |
| `getCurrentUser` | None | `Promise<AuthUser \| null>` | Get current authenticated user |
| `updateUserMetadata` | `metadata: Record<string, any>` | `Promise<AuthResponse>` | Update user metadata |

### useAuthValidation Hook

| Property | Type | Description |
|----------|------|-------------|
| `emailError` | `string` | Current email validation error |
| `passwordError` | `string` | Current password validation error |
| `confirmPasswordError` | `string` | Password confirmation error |
| `passwordStrength` | `PasswordStrength` | Password strength analysis |
| `isRateLimited` | `boolean` | Whether user is rate limited |
| `rateLimitTimeRemaining` | `number` | Time remaining in milliseconds |
| `validateEmail` | `(email: string) => boolean` | Validate email format |
| `validatePassword` | `(password: string) => boolean` | Validate password strength |
| `signInWithValidation` | `(email: string, password: string) => Promise<boolean>` | Sign in with validation |
| `signUpWithValidation` | `(email: string, password: string, confirmPassword: string) => Promise<boolean>` | Sign up with validation |
| `resetPasswordWithValidation` | `(email: string) => Promise<boolean>` | Reset password with validation |

## 🎯 Best Practices

### 1. Error Handling
- Always use the validation hooks untuk user input
- Provide clear, actionable error messages
- Don't expose sensitive information dalam error messages
- Log errors untuk debugging tapi jangan expose ke user

### 2. User Experience
- Show real-time validation feedback
- Use loading states untuk async operations
- Provide clear success confirmations
- Implement progressive enhancement

### 3. Security
- Always validate input di client dan server side
- Implement rate limiting untuk prevent abuse
- Use strong password requirements
- Sanitize all user inputs

### 4. Performance
- Debounce validation untuk avoid excessive API calls
- Use memoization untuk expensive computations
- Implement proper loading states
- Optimize bundle size dengan lazy loading

---

**Need Help?** Check the [Error Handling Documentation](./AUTH_ERROR_HANDLING.md) untuk detailed technical information.