# MediStore Backend API 💊

> Your Trusted Online Medicine Shop - Backend API

A comprehensive backend API for an e-commerce platform specializing in over-the-counter (OTC) medicines. Built with Express.js, TypeScript, and PostgreSQL.

## 🚀 Features

### Role-Based Access Control
- **Customer**: Browse medicines, place orders, track deliveries, leave reviews
- **Seller**: Manage medicine inventory, view and fulfill orders
- **Admin**: Platform oversight, user management, category management

### Core Functionality
- ✅ JWT-based authentication with role-based access control
- ✅ Medicine catalog with search, filter, and pagination
- ✅ Category management
- ✅ Shopping cart and order placement (Cash on Delivery)
- ✅ Order tracking with status updates
- ✅ Customer reviews and ratings
- ✅ Seller inventory management
- ✅ Admin dashboard capabilities

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcrypt
- **Validation**: express-validator
- **File Upload**: multer

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   cd medistore-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

   Update the following variables in `.env`:
   - `DATABASE_URL`: Your PostgreSQL connection string
   - `JWT_SECRET`: A secure random string for JWT signing
   - `PORT`: Server port (default: 5000)

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate

   # Run migrations
   npm run prisma:migrate

   # Seed the database with initial data
   npm run prisma:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

   The API will be available at `http://localhost:5000`

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | Login user | Public |
| GET | `/api/auth/me` | Get current user | Authenticated |

### Medicine Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/medicines` | Get all medicines (with filters) | Public |
| GET | `/api/medicines/:id` | Get medicine details | Public |

**Query Parameters for GET /api/medicines:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `category`: Filter by category ID
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter
- `search`: Search by name, description, or manufacturer

### Category Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/categories` | Get all categories | Public |
| POST | `/api/categories` | Create category | Admin |
| PUT | `/api/categories/:id` | Update category | Admin |
| DELETE | `/api/categories/:id` | Delete category | Admin |

### Order Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/orders` | Create new order | Customer |
| GET | `/api/orders` | Get user's orders | Customer |
| GET | `/api/orders/:id` | Get order details | Customer/Seller/Admin |

### Seller Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/seller/medicines` | Get seller's medicines | Seller |
| POST | `/api/seller/medicines` | Add medicine | Seller |
| PUT | `/api/seller/medicines/:id` | Update medicine | Seller |
| DELETE | `/api/seller/medicines/:id` | Remove medicine | Seller |
| GET | `/api/seller/orders` | Get seller's orders | Seller |
| PATCH | `/api/seller/orders/:id` | Update order status | Seller |

### Admin Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/admin/users` | Get all users | Admin |
| PATCH | `/api/admin/users/:id` | Update user status | Admin |
| GET | `/api/admin/orders` | Get all orders | Admin |
| GET | `/api/admin/medicines` | Get all medicines | Admin |

### Review Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/reviews` | Create review | Customer |
| GET | `/api/reviews/medicine/:medicineId` | Get medicine reviews | Public |

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## 📊 Database Schema

### Models
- **User**: User accounts with role-based access
- **Category**: Medicine categories
- **Medicine**: Product inventory
- **Order**: Customer orders
- **OrderItem**: Order line items
- **Review**: Customer reviews

## 🧪 Testing Accounts

After running the seed script, you can use these test accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@medistore.com | Admin@123 |
| Seller | seller@medistore.com | Seller@123 |
| Customer | customer@example.com | Customer@123 |

## 📝 Scripts

- `npm run dev`: Start development server with hot reload
- `npm run build`: Build for production
- `npm start`: Start production server
- `npm run prisma:generate`: Generate Prisma client
- `npm run prisma:migrate`: Run database migrations
- `npm run prisma:seed`: Seed database with initial data
- `npm run prisma:studio`: Open Prisma Studio (database GUI)

## 🔄 Order Status Flow

```
PLACED → PROCESSING → SHIPPED → DELIVERED
   ↓
CANCELLED
```

## 🚦 Error Handling

The API uses standard HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `500`: Internal Server Error

Error responses follow this format:
```json
{
  "error": "Error message description"
}
```

## 📄 License

ISC

## 👥 Support

For issues and questions, please open an issue in the repository.

---

Built with ❤️ for MediStore
