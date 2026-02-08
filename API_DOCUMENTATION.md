# MediStore Backend - Comprehensive API Documentation

Welcome to the **MediStore** API documentation. This guide covers all available endpoints, authentication flows, and frontend implementation strategies using Better Auth.

## 📌 Base Configuration
- **Base URL:** `http://localhost:3001`
- **Auth Strategy:** Session-based (HttpOnly Cookies) via Better Auth.
- **Content-Type:** `application/json`

---

## 🔐 Authentication (Better Auth)

Better Auth provides standardized endpoints. For frontend integration, it's recommended to use the `@better-auth/client` SDK, but standard `fetch` also works.

### User Authentication Endpoints

| Endpoint | Method | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `/api/auth/sign-up` | `POST` | Register a new user | `{ "email", "password", "name", "role": "CUSTOMER" }` |
| `/api/auth/sign-in/email` | `POST` | Login with email | `{ "email", "password" }` |
| `/api/auth/sign-out` | `POST` | End session | `{}` |
| `/api/auth/get-session` | `GET` | Current user & session | N/A |
| `/api/auth/forget-password` | `POST` | Request reset email | `{ "email" }` |
| `/api/auth/reset-password` | `POST` | Set new password | `{ "token", "newPassword" }` |
| `/api/auth/verify-email` | `POST` | Verify account | `{ "token" }` |
| `/api/auth/login/google` | `GET` | Start Google OAuth | N/A |

### 💡 How to implement in Frontend (React/Next.js)

Better Auth uses **HttpOnly Cookies**. You **must** include `credentials: 'include'` in your fetch calls if your frontend is on a different port than your backend.

```javascript
// Example: Authentication Helper
const API_URL = 'http://localhost:3001';

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/api/auth/sign-in/email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return response.json();
};

export const checkSession = async () => {
  const response = await fetch(`${API_URL}/api/auth/get-session`, {
    credentials: 'include', // CRITICAL for cookie session
  });
  return response.json();
};
```

---

## 💊 Medicine Management

### Public Endpoints

| Endpoint | Method | Description | Query Parameters |
| :--- | :--- | :--- | :--- |
| `/api/medicines` | `GET` | Browse medicines | `search`, `category`, `minPrice`, `maxPrice`, `page`, `limit` |
| `/api/medicines/:id` | `GET` | Medicine details | N/A |

### Seller/Inventory Endpoints (Requires `SELLER` Role)

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/seller/medicines` | `GET` | View your inventory |
| `/api/seller/medicines` | `POST` | Add new medicine |
| `/api/seller/medicines/:id` | `PUT` | Update medicine |
| `/api/seller/medicines/:id` | `DELETE`| Remove medicine |

---

## 📂 Categories

| Endpoint | Method | Description | Role |
| :--- | :--- | :--- | :--- |
| `/api/categories` | `GET` | List all categories | Public |
| `/api/categories` | `POST` | Create category | Admin Only |
| `/api/categories/:id` | `PUT` | Update category | Admin Only |
| `/api/categories/:id` | `DELETE`| Delete category | Admin Only |

---

## 🛒 Orders & Checkout

### Customer Endpoints

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/orders` | `POST` | Place a new order |
| `/api/orders` | `GET` | View my order history |
| `/api/orders/:id` | `GET` | View order details |

### Seller Fulfillment

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/seller/orders` | `GET` | View orders for your items |
| `/api/seller/orders/:id` | `PATCH`| Update status (`SHIPPED`, `DELIVERED`, etc) |

---

## ⭐ Reviews

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/reviews` | `POST` | Submit a review (After delivery) |
| `/api/reviews/medicine/:id` | `GET` | Get reviews for a medicine |

---

## 🛡️ Admin Dashboard

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/admin/users` | `GET` | List all registered users |
| `/api/admin/users/:id` | `PATCH`| Activate/Deactivate user |
| `/api/admin/orders` | `GET` | View all platform orders |

---

## 🛠️ Complete Frontend Implementation Guide

### 1. Global API Consumer (Axios/Fetch)

It is highly recommended to create a custom hook or a base API client.

```typescript
// src/lib/api-client.ts
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  withCredentials: true, // Automatically includes Better Auth session cookies
});

export default api;
```

### 2. Example: Fetching Medicines with Search

```tsx
// src/components/MedicineGallery.tsx
import api from '../lib/api-client';

const fetchMedicines = async (keyword: string) => {
  const { data } = await api.get('/api/medicines', {
    params: { search: keyword }
  });
  return data.medicines;
};
```

### 3. Example: Handling Checkout

```tsx
const handleCheckout = async (cartItems, shippingDetails) => {
  try {
    const response = await api.post('/api/orders', {
      items: cartItems.map(item => ({ medicineId: item.id, quantity: item.qty })),
      ...shippingDetails
    });
    alert('Order Placed: ' + response.data.order.orderNumber);
  } catch (err) {
    alert('Checkout failed: ' + err.response.data.error);
  }
};
```

---

## 🧪 Test Credentials

You can use these accounts to explore role-based features:

- **Admin:** `admin@medistore.com` / `Admin@123`
- **Seller:** `seller@medistore.com` / `Seller@123`
- **Customer:** `customer@example.com` / `Customer@123`

---

## 🚨 Error Response Format

Errors always return a consistent JSON structure:
```json
{
  "error": "Detailed error message here"
}
```
Always verify HTTP status codes:
- `401 Unauthorized`: Session expired or not logged in.
- `403 Forbidden`: Trying to access seller/admin features as a customer.
- `404 Not Found`: Resource doesn't exist.
- `400 Bad Request`: Validation failure (e.g., missing phone number).
