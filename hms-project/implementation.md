# Hospital Management System Implementation Guidelines

## Next.js Implementation (v15.0.4)

### Project Structure
- Follow the App Router pattern used in the WowDash template
- Organize pages under `src/app` directory with route-based folder structure
- Use the following structure for new modules:
  ```
  src/
  ├── app/
  │   ├── [module-name]/
  │   │   ├── page.jsx         # Main page component
  │   │   ├── layout.jsx       # Optional module-specific layout
  │   │   └── loading.jsx      # Optional loading state
  ├── components/
  │   ├── [ModuleName]/        # Module-specific components
  │   └── child/               # Reusable child components
  ├── masterLayout/            # Main layout components
  ├── helper/                  # Utility functions and helpers
  └── hook/                    # Custom React hooks
  ```

### Component Development
- Use the "use client" directive for client-side components
- Leverage server components for data fetching and static content
- Follow the existing component patterns in the WowDash template:
  - Dashboard components in `src/components/`
  - Child components in `src/components/child/`
  - Layout components in `src/masterLayout/`
- Utilize the existing theme components documented in Components.md

### Data Fetching
- Use React Server Components for initial data loading
- Implement API routes under `src/app/api/` for backend functionality
- Use the following pattern for PostgreSQL integration:
  ```javascript
  // In API route handler
  import { db } from '@/lib/db';
  
  export async function GET(request) {
    const data = await db.table_name.findMany();
    return Response.json({ data });
  }
  ```

### Authentication Implementation
- Implement JWT authentication with Next.js middleware
- Create authentication API routes under `src/app/api/auth/`
- Use NextAuth.js for Google and Facebook OAuth integration
- Implement role-based access control through middleware:
  ```javascript
  // In middleware.js
  export function middleware(request) {
    const token = request.cookies.get('token');
    const user = verifyToken(token);
    
    if (!user || !hasPermission(user.role, request.nextUrl.pathname)) {
      return NextResponse.redirect(new URL('/sign-in', request.url));
    }
    
    return NextResponse.next();
  }
  
  export const config = {
    matcher: ['/dashboard/:path*', '/admin/:path*'],
  };
  ```

### State Management
- Use React Context API for global state management
- Implement custom hooks for reusable state logic
- Follow this pattern for context creation:
  ```javascript
  // In context/AuthContext.js
  'use client';
  
  import { createContext, useContext, useState } from 'react';
  
  const AuthContext = createContext();
  
  export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    
    const login = async (credentials) => {
      // Implementation
    };
    
    return (
      <AuthContext.Provider value={{ user, login }}>
        {children}
      </AuthContext.Provider>
    );
  }
  
  export const useAuth = () => useContext(AuthContext);
  ```

### PostgreSQL Integration
- Use Prisma ORM for data modeling, migrations, and database access
- Create schema definitions in `prisma/schema.prisma`
- Implement database client with connection pooling:
  ```javascript
  // In lib/db.js
  import { PrismaClient } from '@prisma/client';

  const globalForPrisma = global as unknown as { prisma: PrismaClient };

  export const db = globalForPrisma.prisma || new PrismaClient();

  if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
  ```
- Use migrations for schema changes:
  ```bash
  # Generate migration
  npx prisma migrate dev --name init
  
  # Apply migrations
  npx prisma migrate deploy
  
  # Generate Prisma client
  npx prisma generate
  ```
- Implement data models with relations:
  ```prisma
  // Example schema.prisma model definitions
  model User {
    id        Int      @id @default(autoincrement())
    email     String   @unique
    name      String?
    role      String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    patients  Patient[]
  }

  model Patient {
    id          Int      @id @default(autoincrement())
    firstName   String
    lastName    String
    dateOfBirth DateTime
    gender      String
    contactNo   String
    address     String?
    doctorId    Int
    doctor      User     @relation(fields: [doctorId], references: [id])
    createdAt   DateTime @default(now())
    updatedAt   DateTime @updatedAt
  }
  ```

### API Development
- Create RESTful API endpoints under `src/app/api/`
- Use route handlers with HTTP methods (GET, POST, PUT, DELETE)
- Implement proper error handling and validation:
  ```javascript
  // In src/app/api/patients/route.js
  import { db } from '@/lib/db';
  import { NextResponse } from 'next/server';
  
  export async function GET(request) {
    try {
      const patients = await db.patients.findMany();
      return NextResponse.json({ patients });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch patients' },
        { status: 500 }
      );
    }
  }
  ```

### Frontend Development
- Use the WowDash template components documented in Components.md
- Maintain responsive design using the Bootstrap 5 grid system
- Follow the design patterns established in the template
- Implement form validation using React Hook Form
- Create consistent UI/UX across all modules using the theme's design system

### Performance Optimization
- Implement image optimization using Next.js Image component
- Use dynamic imports for code splitting
- Optimize component rendering with React.memo and useMemo
- Implement proper caching strategies for API responses
- Use Incremental Static Regeneration (ISR) for semi-static pages

### Security Considerations
- Implement proper authentication and authorization
- Use HTTPS for all communications
- Sanitize all user inputs with validation libraries
- Implement rate limiting for API endpoints
- Create proper error handling without exposing sensitive information
- Implement audit logging for sensitive operations
- Use environment variables for sensitive configuration

### Testing Strategy
- Implement unit tests with Jest and React Testing Library
- Create API integration tests
- Use Cypress for end-to-end testing
- Implement continuous integration with GitHub Actions

### Deployment Considerations
- Use Vercel for frontend deployment
- Configure PostgreSQL for database hosting
- Implement proper environment variable management
- Set up monitoring and logging with Vercel Analytics
- Create backup and restore procedures for PostgreSQL