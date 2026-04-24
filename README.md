# SubTenants

A mobile-first Next.js application for connecting interns with sublease opportunities. Built with TypeScript, Tailwind CSS, and shadcn/ui.

## Features

- **Find Tenants**: Browse and search for interns looking for subleases
- **Find Subleases**: Discover available rooms and apartments
- **Tenant Profiles**: Detailed view of tenant preferences and requirements
- **Room Listings**: Comprehensive room information with images and amenities
- **Create Listings**: Post tenant profiles or room listings
- **User Authentication**: Secure login and registration
- **User Profile**: Manage account information and listings

## Tech Stack

- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React
- **Database**: MySQL
- **Security**: bcryptjs, JWT, rate limiting

## Security Features

### Application-Level Security

- **Password Hashing**: All passwords are hashed using bcrypt with 10 salt rounds
- **JWT Authentication**: Secure token-based authentication with 7-day expiration
- **Input Sanitization**: All user inputs are sanitized to prevent XSS attacks
- **Rate Limiting**: API endpoints are rate-limited to prevent abuse
- **Email Validation**: Strict email format validation
- **Password Strength**: Enforces strong password requirements (8+ chars, uppercase, lowercase, number)

### Database-Level Security

See `database-security.sql` for recommended database security measures including:
- Limited privilege database users
- SSL/TLS connections
- Views for data exposure control
- Stored procedures for safe operations
- Triggers for data integrity
- Check constraints for validation
- Indexes for performance

## Database Schema

The application uses the following MySQL tables:

- `Account` - User profiles
- `Tenant` - Tenant listings
- `Subleasor` - Subleasor profiles
- `Property` - Property information
- `SuiteInfo` - Suite/apartment details
- `Amenity` - Available amenities
- `RoomInfo` - Room listings
- `RoomAmenity` - Room-amenity relationships
- `ListingPhoto` - Room photos
- `Application` - Rental applications
- `Contract` - Lease contracts

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- MySQL database access

### Installation

1. Navigate to the project directory:
```bash
cd subtenants
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables in `.env`:
```env
DB_HOST=your-host
DB_PORT=3306
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=subtenant
JWT_SECRET=your-secret-key
NODE_ENV=development
```

4. Run database security scripts (optional but recommended):
```bash
mysql -u your-user -p subtenant < database-security.sql
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
subtenants/
├── app/                      # Next.js App Router pages
│   ├── api/                  # API routes
│   │   ├── auth/             # Authentication endpoints
│   │   ├── tenants/          # Tenant endpoints
│   │   ├── rooms/            # Room endpoints
│   │   └── amenities/        # Amenity endpoints
│   ├── find-tenants/         # Browse tenants page
│   ├── find-subleases/       # Browse rooms page
│   ├── tenant/[id]/          # Tenant detail page
│   ├── sublease/[id]/        # Room detail page
│   ├── create-listing/       # Create new listings
│   ├── profile/              # User profile page
│   ├── login/                # Login page
│   ├── register/             # Registration page
│   ├── layout.tsx            # Root layout with navigation
│   └── page.tsx              # Home page
├── components/               # Reusable components
│   ├── ui/                   # shadcn/ui components
│   ├── layout/               # Navigation and layout components
│   ├── tenant/               # Tenant-specific components
│   └── sublease/             # Sublease-specific components
├── lib/                      # Utilities and API layer
│   ├── types/                # TypeScript interfaces
│   ├── api/                  # Database API functions
│   ├── api-auth.ts           # API authentication helpers
│   ├── auth-context.tsx      # React authentication context
│   ├── db.ts                 # MySQL connection pool
│   ├── security.ts           # Security utilities
│   ├── rate-limit.ts         # Rate limiting middleware
│   └── utils.ts              # Utility functions
├── middleware.ts             # Next.js middleware for auth
├── database-security.sql     # Database security scripts
└── public/                   # Static assets
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login and get JWT token

### Tenants
- `GET /api/tenants` - List all tenants
- `POST /api/tenants` - Create new tenant (requires auth)
- `GET /api/tenants/:id` - Get tenant by ID
- `PUT /api/tenants/:id` - Update tenant (requires auth)
- `DELETE /api/tenants/:id` - Delete tenant (requires auth)

### Rooms
- `GET /api/rooms` - List all rooms
- `POST /api/rooms` - Create new room (requires auth)
- `GET /api/rooms/:id` - Get room by ID
- `PUT /api/rooms/:id` - Update room (requires auth)
- `DELETE /api/rooms/:id` - Delete room (requires auth)

### Amenities
- `GET /api/amenities` - List all amenities

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Mobile-First Design

The application is designed with a mobile-first approach:
- Bottom navigation bar on mobile devices
- Responsive card layouts
- Touch-friendly buttons and inputs
- Optimized for 18-25 year old demographic

## License

MIT
