# Perfect Water Dashboard - Development Environment

This is the development environment for the Perfect Water Internal Dashboard, a modern web-based platform for managing franchise operations.

## 🏗️ Project Structure

```
perfect-water-dashboard/
├── apps/
│   ├── web/          # Next.js frontend + admin dashboard
│   └── api/          # NestJS backend API
├── packages/
│   ├── db/           # Prisma database schema & client
│   ├── ui/           # Shared UI components
│   └── lib/          # Shared utilities & types
├── package.json       # Root package.json with workspaces
└── README.md         # This file
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 8.0.0 or higher
- **MySQL** database (local or remote)

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:workspaces
```

### 2. Database Setup

```bash
# Navigate to database package
cd packages/db

# Copy environment file
cp env.example .env

# Edit .env with your database credentials
# DATABASE_URL="mysql://username:password@localhost:3306/perfect_water_dev"

# Generate Prisma client
npm run generate

# Run database migrations
npm run migrate:dev
```

### 3. Start Development Servers

```bash
# Start both frontend and backend (from root)
npm run dev

# Or start individually:
npm run dev:web    # Next.js on http://localhost:3000
npm run dev:api    # NestJS on http://localhost:3001
```

## 📱 Available Applications

### Web Application (Next.js)
- **URL**: http://localhost:3000
- **Features**: Public site, admin dashboard, authentication
- **Tech**: Next.js 14, Tailwind CSS, shadcn/ui components

### API Application (NestJS)
- **URL**: http://localhost:3001
- **Documentation**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/health
- **Tech**: NestJS, Prisma, JWT authentication

## 🛠️ Development Commands

### Root Commands
```bash
npm run dev              # Start both apps in development mode
npm run build            # Build all applications
npm run test             # Run tests across all packages
npm run lint             # Lint all code
npm run lint:fix         # Fix linting issues
npm run clean            # Clean all build artifacts
```

### Database Commands
```bash
npm run db:generate      # Generate Prisma client
npm run db:migrate       # Run database migrations
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database with sample data
```

### Individual App Commands
```bash
# Web app
npm run dev:web          # Start Next.js development server
npm run build:web        # Build Next.js app

# API app
npm run dev:api          # Start NestJS development server
npm run build:api        # Build NestJS app
```

## 🔧 Configuration

### Environment Variables

Create `.env` files in each app directory:

#### Web App (apps/web/.env.local)
```env
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001
```

#### API App (apps/api/.env)
```env
DATABASE_URL=mysql://username:password@localhost:3306/perfect_water_dev
JWT_SECRET=your-jwt-secret-here
PORT=3001
```

#### Database Package (packages/db/.env)
```env
DATABASE_URL=mysql://username:password@localhost:3306/perfect_water_dev
```

## 🗄️ Database

### Prisma Schema
The database schema is defined in `packages/db/prisma/schema.prisma` and includes:

- **Multi-tenant architecture** with franchise and store scoping
- **User management** with role-based access control
- **Customer management** with CRM features
- **Inventory tracking** with stock management
- **Sales & invoicing** with payment processing
- **Bank reconciliation** with transaction matching
- **Compliance tracking** with daily checklists
- **AI messaging** with audit logging

### Database Setup
1. Create a MySQL database
2. Update the `DATABASE_URL` in your environment files
3. Run `npm run db:migrate` to create tables
4. Run `npm run db:seed` to populate with sample data

## 🎨 UI Components

The `packages/ui` package contains shared UI components built with:
- **Radix UI** primitives for accessibility
- **Tailwind CSS** for styling
- **shadcn/ui** design system
- **Lucide React** for icons

## 📚 API Documentation

Once the API is running, visit http://localhost:3001/api for:
- Interactive API documentation
- Request/response examples
- Authentication requirements
- Endpoint testing

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

## 📦 Building for Production

```bash
# Build all applications
npm run build

# Build individual apps
npm run build:web
npm run build:api
```

## 🚀 Deployment

### cPanel Node.js App Manager
1. Build the applications locally
2. Upload the built files to your cPanel
3. Configure environment variables
4. Set up domain routing
5. Configure cron jobs for automated tasks

### Environment Variables for Production
- Set `NODE_ENV=production`
- Configure production database URLs
- Set secure JWT secrets
- Configure SMTP for email
- Set up OpenAI API keys for AI messaging

## 🔒 Security Features

- **JWT authentication** with secure token handling
- **Role-based access control** (RBAC) with fine-grained permissions
- **Password hashing** with Argon2id
- **CSRF protection** for forms
- **Input validation** with Zod schemas
- **Audit logging** for all critical actions
- **Data isolation** between franchises

## 📈 Performance Features

- **Incremental Static Regeneration** (ISR) for Next.js
- **Database indexing** on frequently queried fields
- **Pagination** for large data sets
- **Caching strategies** for frequently accessed data
- **Optimized database queries** with Prisma

## 🤝 Contributing

1. Follow the established code style (ESLint + Prettier)
2. Write tests for new features
3. Update documentation as needed
4. Use conventional commit messages

## 📞 Support

For development questions or issues:
1. Check the API documentation at `/api`
2. Review the Prisma schema for database structure
3. Check the health endpoint for system status
4. Review logs for detailed error information

## 🔄 Updates

To update dependencies:
```bash
# Update all packages
npm update

# Update specific packages
npm update @nestjs/common

# Check for outdated packages
npm outdated
```

---

**Happy coding! 🎉**
