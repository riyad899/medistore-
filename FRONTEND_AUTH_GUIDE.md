# MediStore Frontend Authentication Guide 🔐

This guide explains how to implement authentication in your frontend (React, Next.js, Vue, etc.) using the MediStore backend.

---

## 🎯 Quick Overview

Your backend uses **Better Auth** with **session-based authentication** via **HttpOnly Cookies**.

### Key Points
- **Sessions**: HttpOnly cookies stored automatically (secure, not accessible via JS)
- **No JWT tokens** in localStorage (we handle sessions server-side)
- **CORS credentials**: Must send `credentials: 'include'` in all requests
- **Base URL**: `http://localhost:5001` (development) or your backend domain
- **Email verification**: New users must verify email before login
- **Roles**: `CUSTOMER`, `SELLER`, `ADMIN`

---

## 📡 Available Auth Endpoints

| Endpoint | Method | Purpose | Request Body |
|----------|--------|---------|--------------|
| `/api/auth/sign-up` | `POST` | Register new user | `{ email, password, name, role? }` |
| `/api/auth/sign-in` | `POST` | Login user | `{ email, password }` |
| `/api/auth/get-session` | `GET` | Check if logged in | N/A |
| `/api/auth/sign-out` | `POST` | Logout | `{}` |
| `/api/auth/forget-password` | `POST` | Request password reset | `{ email }` |
| `/api/auth/reset-password` | `POST` | Complete password reset | `{ token, newPassword }` |
| `/api/auth/verify-email` | `POST` | Verify email token | `{ token }` |

---

## 1️⃣ Setup API Client (Axios)

Create a base API client that automatically includes session cookies:

### File: `src/lib/api.ts`

```typescript
import axios, { AxiosError } from 'axios';

// Create API instance with credentials enabled
const API = axios.create({
    baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
    withCredentials: true, // CRITICAL: Include cookies in all requests
    headers: {
        'Content-Type': 'application/json',
    },
});

// Optional: Add response interceptor to handle 401 (session expired)
API.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Session expired, redirect to login
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default API;
```

**Why `withCredentials: true`?**
- Better Auth stores session as an HttpOnly cookie
- Without this flag, cookies won't be sent/received
- Server won't recognize you as authenticated

---

## 2️⃣ Create Auth Context (React)

Store user and session state globally:

### File: `src/context/AuthContext.tsx`

```typescript
import React, { createContext, useState, useEffect, ReactNode } from 'react';
import API from '../lib/api';

interface User {
    id: string;
    email: string;
    name: string;
    role: 'CUSTOMER' | 'SELLER' | 'ADMIN';
    emailVerified: boolean;
    image?: string;
    phone?: string;
    address?: string;
}

interface Session {
    user: User | null;
    isLoading: boolean;
    error: string | null;
}

interface AuthContextType extends Session {
    login: (email: string, password: string) => Promise<User>;
    signup: (email: string, password: string, name: string, role?: string) => Promise<User>;
    logout: () => Promise<void>;
    refreshSession: () => Promise<User | null>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Check if user is already logged in (on app mount)
    useEffect(() => {
        checkSession();
    }, []);

    const checkSession = async () => {
        try {
            setIsLoading(true);
            const { data } = await API.get('/api/auth/get-session');
            if (data?.user) {
                setUser(data.user);
                setError(null);
            } else {
                setUser(null);
            }
        } catch (err) {
            console.log('No active session');
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, password: string): Promise<User> => {
        try {
            setIsLoading(true);
            setError(null);
            const { data } = await API.post('/api/auth/sign-in', {
                email,
                password,
            });

            if (data?.user) {
                setUser(data.user);
                return data.user;
            }
            throw new Error('Login failed');
        } catch (err: any) {
            const message = err.response?.data?.error || 'Login failed';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const signup = async (
        email: string,
        password: string,
        name: string,
        role: string = 'CUSTOMER'
    ): Promise<User> => {
        try {
            setIsLoading(true);
            setError(null);
            const { data } = await API.post('/api/auth/sign-up', {
                email,
                password,
                name,
                role,
            });

            if (data?.user) {
                // Note: emailVerified will be false; user must verify email
                setUser(data.user);
                return data.user;
            }
            throw new Error('Signup failed');
        } catch (err: any) {
            const message = err.response?.data?.error || 'Signup failed';
            setError(message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            await API.post('/api/auth/sign-out', {});
            setUser(null);
            setError(null);
        } catch (err: any) {
            console.error('Logout error:', err);
            setUser(null); // Clear state even if API call fails
        }
    };

    const refreshSession = async (): Promise<User | null> => {
        try {
            const { data } = await API.get('/api/auth/get-session');
            if (data?.user) {
                setUser(data.user);
                return data.user;
            }
            setUser(null);
            return null;
        } catch (err) {
            setUser(null);
            return null;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                error,
                login,
                signup,
                logout,
                refreshSession,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use Auth context
export const useAuth = (): AuthContextType => {
    const context = React.useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
```

**What this does:**
- `checkSession()`: Runs on app load to see if user is logged in
- `login()`: Posts email/password, stores user in state
- `signup()`: Creates account (email will need verification)
- `logout()`: Clears session and user state
- `refreshSession()`: Manually refresh to get latest user data
- `useAuth()`: Hook to access auth anywhere in your app

---

## 3️⃣ Login Component

### File: `src/pages/Login.tsx`

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const user = await login(email, password);
            console.log('Login successful:', user);

            // Redirect based on role
            if (user.role === 'ADMIN') {
                navigate('/admin/dashboard');
            } else if (user.role === 'SELLER') {
                navigate('/seller/dashboard');
            } else {
                navigate('/customer/medicines');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <h2>Login to MediStore</h2>
            <form onSubmit={handleLogin}>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                {error && <p className="error">{error}</p>}
            </form>
            <p>
                Don't have an account? <a href="/signup">Sign up</a>
            </p>
        </div>
    );
};
```

---

## 4️⃣ Signup Component

### File: `src/pages/Signup.tsx`

```typescript
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const SignupPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [role, setRole] = useState<'CUSTOMER' | 'SELLER'>('CUSTOMER');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const navigate = useNavigate();
    const { signup } = useAuth();

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const user = await signup(email, password, name, role);
            console.log('Signup successful:', user);
            setSuccess(true);

            // Show message and redirect after delay
            setTimeout(() => {
                alert('Check your email to verify your account before logging in.');
                navigate('/login');
            }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Signup failed');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return <p>✅ Signup successful! Check your email to verify.</p>;
    }

    return (
        <div className="signup-container">
            <h2>Create MediStore Account</h2>
            <form onSubmit={handleSignup}>
                <input
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                <select value={role} onChange={(e) => setRole(e.target.value as any)}>
                    <option value="CUSTOMER">Customer</option>
                    <option value="SELLER">Seller</option>
                </select>
                <button type="submit" disabled={loading}>
                    {loading ? 'Creating account...' : 'Sign Up'}
                </button>
                {error && <p className="error">{error}</p>}
            </form>
            <p>
                Already have an account? <a href="/login">Login</a>
            </p>
        </div>
    );
};
```

---

## 5️⃣ Protected Route Component

Prevent unauthenticated users from accessing protected pages:

### File: `src/components/ProtectedRoute.tsx`

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requiredRole?: 'CUSTOMER' | 'SELLER' | 'ADMIN';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
    children,
    requiredRole,
}) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <p>Loading...</p>;
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (requiredRole && user.role !== requiredRole) {
        return <Navigate to="/unauthorized" />;
    }

    return <>{children}</>;
};
```

**Usage in routes:**
```typescript
<ProtectedRoute requiredRole="CUSTOMER">
    <CustomerDashboard />
</ProtectedRoute>

<ProtectedRoute requiredRole="SELLER">
    <SellerDashboard />
</ProtectedRoute>

<ProtectedRoute requiredRole="ADMIN">
    <AdminDashboard />
</ProtectedRoute>
```

---

## 6️⃣ App Setup (React Router)

### File: `src/App.tsx`

```typescript
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/Login';
import { SignupPage } from './pages/Signup';
import { CustomerDashboard } from './pages/Customer/Dashboard';
import { SellerDashboard } from './pages/Seller/Dashboard';
import { AdminDashboard } from './pages/Admin/Dashboard';

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />

                    {/* Protected routes */}
                    <Route
                        path="/customer/dashboard"
                        element={
                            <ProtectedRoute requiredRole="CUSTOMER">
                                <CustomerDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/seller/dashboard"
                        element={
                            <ProtectedRoute requiredRole="SELLER">
                                <SellerDashboard />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/admin/dashboard"
                        element={
                            <ProtectedRoute requiredRole="ADMIN">
                                <AdminDashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
```

---

## 7️⃣ Example: Using Auth in Components

### File: `src/components/Header.tsx`

```typescript
import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
    const { user, logout, isLoading } = useAuth();

    const handleLogout = async () => {
        await logout();
        window.location.href = '/login';
    };

    if (isLoading) {
        return <header>Loading...</header>;
    }

    return (
        <header>
            <h1>MediStore</h1>
            {user ? (
                <div className="user-menu">
                    <p>Welcome, {user.name}!</p>
                    <p className="role">{user.role}</p>
                    <button onClick={handleLogout}>Logout</button>
                </div>
            ) : (
                <nav>
                    <a href="/login">Login</a>
                    <a href="/signup">Sign Up</a>
                </nav>
            )}
        </header>
    );
};
```

---

## 8️⃣ Making Authenticated API Calls

Once logged in, use the API client for all requests—cookies are sent automatically:

```typescript
import API from './lib/api';

// Get medicines (public)
const getMedicines = async () => {
    const { data } = await API.get('/api/medicines');
    return data;
};

// Create order (needs authentication)
const createOrder = async (items: any[]) => {
    const { data } = await API.post('/api/orders', {
        items,
        shippingAddress: '123 Main St',
        shippingCity: 'New York',
        shippingZip: '10001',
        shippingPhone: '+1234567890',
    });
    return data;
};

// Update user profile (needs authentication)
const updateProfile = async (phone: string, address: string) => {
    const { data } = await API.patch('/api/auth/profile', {
        phone,
        address,
    });
    return data;
};
```

---

## 9️⃣ Environment Variables

Create `.env` in your frontend:

```bash
REACT_APP_API_URL=http://localhost:5001
REACT_APP_ENV=development
```

---

## 🔟 Debugging Checklist

- ✅ **Server running?** Check `http://localhost:5001` returns API info
- ✅ **CORS enabled?** Backend should allow your frontend origin
- ✅ **Credentials flag?** Axios request must have `withCredentials: true`
- ✅ **Cookies visible?** Check browser DevTools → Application → Cookies for `better-auth.session_token`
- ✅ **Email verified?** New users need to verify email before full login
- ✅ **Session valid?** Call `/api/auth/get-session` to check logged-in status

---

## 📋 Test Flow

1. **Sign up** with your email
2. **Check email** for verification link (or use Ethereal preview if in dev)
3. **Verify email** via the link
4. **Login** with your credentials
5. **Access protected routes** as an authenticated user

---

## ❓ Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| 404 on `/api/auth/*` | Server not running or wrong port | Start backend: `PORT=5001 npm run dev` |
| 401 Unauthorized | Session expired or not authenticated | Redirect to login, user must re-authenticate |
| CORS error | Frontend and backend on different origins | Add frontend URL to `CORS_ORIGIN` in backend `.env` |
| Cookies not sent | `withCredentials` not set | Ensure `withCredentials: true` in API client |
| 422 on signup | Email already exists or validation failed | Check error message; use unique email |

---

## 🎓 Summary

1. **Create API client** with `withCredentials: true`
2. **Build Auth Context** to manage user state globally
3. **Create Login/Signup pages** to handle authentication
4. **Protect routes** with role-based access control
5. **Use `useAuth()` hook** in components to access user data
6. **All API requests** automatically include session cookies

Your authentication is now fully integrated! 🎉
