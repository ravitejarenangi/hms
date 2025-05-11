# Hospital Management System Development Tasks

This document outlines the step-by-step tasks required to build a comprehensive hospital management system using the Next.js with PostgreSQL as the database. Each task is designed to be completed sequentially, with clear instructions and focus areas.

## Phase 1: Project Setup and Configuration

**Node.js Version**: Use Node.js version 23 from NVM for this project.

### Task 1: Project Initialization
Let's begin by laying the foundation for our Hospital Management System. Your first task is Project Initialization. Please perform the following steps:

1. Clean the /app directory: Remove any pre-existing demo pages or boilerplate files within the /app directory to ensure a clean starting point.
   * Delete any example pages, components, or boilerplate code
   * Keep essential configuration files like layout.js and page.js but simplify them
   * Remove any demo styles or assets that aren't needed

2. Establish the core project structure: Create the basic folder organization that will house our hospital management modules. Think about logical groupings like patients, doctors, appointments, billing, etc. Please create these top-level module directories within the main project.
   * Create `/app/(dashboard)` for authenticated routes
   * Create `/app/(auth)` for authentication-related pages
   * Set up `/components` directory with subdirectories for UI components
   * Create `/lib` directory for utility functions and shared logic
   * Set up `/public` directory for static assets
   * Create `/styles` directory for global styles and theme configuration

3. Configure PostgreSQL with Prisma: Set up the connection to our PostgreSQL database using Prisma ORM. This involves:
   * Run `npm install prisma @prisma/client` to install Prisma
   * Initialize Prisma with `npx prisma init`
   * Modify the schema.prisma file to define our PostgreSQL provider and connection string
   * Use the following PostgreSQL connection details:
     * Host: localhost
     * Username: ravitejarenangi
     * Password: (no password)
     * Database name: hms
     * Connection string: `postgresql://ravitejarenangi@localhost:5432/hms`
   * Create initial schema models for core entities (users, roles, permissions)
   * Run `npx prisma generate` to generate the Prisma client

4. Manage environment variables: Create a .env file and configure the necessary environment variables, specifically including the PostgreSQL connection URL (DATABASE_URL). Ensure this file is properly set up to be read by our application.
   * Create `.env` file with DATABASE_URL pointing to your PostgreSQL instance
   * Add JWT_SECRET for authentication
   * Add environment variables for third-party services (SMS, email, etc.)
   * Create `.env.example` as a template for required variables
   * Ensure .env is in .gitignore to prevent secrets from being committed

5. Initialize package.json: Ensure a package.json file exists and initialize it with the essential dependencies required for Prisma and any other core functionalities we'll need at this stage (e.g., @prisma/client, @prisma/cli, dotenv). Install these initial dependencies.
   * Update package.json with scripts for development, building, and deployment
   * Add dependencies for Next.js, React, and other core libraries
   * Include development dependencies for testing and linting
   * Set up Husky for pre-commit hooks to ensure code quality
   * Configure ESLint and Prettier for code formatting

**Expected Deliverables:**
- Clean project structure with organized directories
- Configured Prisma with PostgreSQL connection
- Properly set up environment variables
- Updated package.json with all necessary dependencies
- Initial database schema for core entities

Please confirm completion of each step.

### Task 2: Authentication System Setup
Implement the authentication system with role-based access control (RBAC) for all user types: superadmin, admin, doctor, pharmacist, accountant, receptionist, pathologist, radiologist, nurse, and patient.

**Database Schema**: Review and verify that the necessary database schemas exist for authentication. If not, update the schema in `prisma/schema.prisma` to include:
- User model with fields for authentication (email, password hash, etc.)
- Role model with permissions
- User-Role relationships
- OAuth provider integration
- Two-factor authentication fields
- Password reset tokens
- Session management

1. Create user schema with role-based permissions
   * Define User model with fields: id, name, email, password (hashed), phone, status, createdAt, updatedAt
   * Create Role model with fields: id, name, description, permissions (JSON)
   * Implement UserRole junction table for many-to-many relationships
   * Define Permission model with granular access controls
   * Create database migrations and apply them

2. Implement JWT authentication
   * Set up JWT token generation with appropriate expiration
   * Create middleware for token verification
   * Implement refresh token mechanism for extended sessions
   * Add token blacklisting for logout functionality
   * Create secure HTTP-only cookie storage for tokens

3. Set up Google and Facebook OAuth integration
   * Register application with Google and Facebook developer consoles
   * Implement OAuth callback routes
   * Create user account linking with social providers
   * Handle first-time OAuth user registration
   * Implement profile data synchronization

4. Integrate 2FA with Google Authenticator app
   * Generate and store TOTP secrets for users
   * Create QR code generation for easy setup
   * Implement verification code validation
   * Add backup codes for account recovery
   * Create 2FA setup and management UI

5. Create login, registration, and password recovery pages
   * Design responsive login form with validation
   * Implement registration form with email verification
   * Create password reset workflow with secure tokens
   * Add account lockout after failed attempts
   * Implement remember me functionality

6. Implement role-based routing and page access
   * Create middleware for route protection
   * Implement permission checking for UI elements
   * Set up redirect logic for unauthorized access
   * Create role-specific navigation menus
   * Implement audit logging for authentication events

**Expected Deliverables:**
- Complete authentication system with JWT implementation
- Role-based access control for all user types
- OAuth integration with Google and Facebook
- Two-factor authentication with Google Authenticator
- Responsive login, registration, and password recovery pages
- Secure route protection based on user roles
- Database schema for users, roles, and permissions

### Task 3: Database Schema Design
Design and implement the PostgreSQL schemas for all entities in the hospital management system.

**Tools and Technologies:**
- Prisma ORM for schema definition and migrations
- PostgreSQL as the database engine
- Visual database design tools (optional: dbdiagram.io, Lucidchart)
- Version control for schema changes

1. Create schemas for users with different roles
   * Extend the User model from authentication system
   * Add role-specific fields for each user type (doctor specialization, nurse department, etc.)
   * Implement profile information storage (address, qualifications, experience)
   * Create staff directory schema with searchable fields
   * Add user preferences and settings storage

2. Design patient records schema
   * Create Patient model with personal and demographic information
   * Implement medical history storage with versioning
   * Design schema for storing patient documents and images
   * Create schema for patient-doctor relationships
   * Implement patient family relationships for family history
   * Add fields for insurance and payment information
   * Design schema for patient consent records

3. Create appointment and scheduling schemas
   * Design Appointment model with date, time, duration, and status
   * Implement recurring appointment patterns
   * Create schema for appointment types and categories
   * Design waiting list and queue management
   * Implement schema for appointment notes and follow-ups
   * Add fields for appointment reminders and confirmations
   * Create schema for tracking no-shows and cancellations

4. Design inventory and pharmacy schemas
   * 4.1. Create schema for operation theater equipment inventory
     * Equipment categorization and specifications
     * Maintenance history and scheduling
     * Usage tracking and availability status
     * Warranty and service contract information
   * 4.2. Design schema for medical gas cylinders tracking
     * Cylinder identification and capacity
     * Content type and pressure monitoring
     * Usage logs and refill scheduling
     * Safety certification and inspection records
   * 4.3. Implement schema for equipment maintenance scheduling
     * Preventive maintenance schedules
     * Maintenance task definitions
     * Technician assignments
     * Parts replacement tracking
   * 4.4. Create medicine inventory schema
     * Drug information (name, composition, manufacturer)
     * Batch tracking with expiry dates
     * Stock levels and reorder thresholds
     * Pricing and discount information

5. Create billing and accounting schemas
   * Design Invoice model with line items and tax calculations
   * Implement payment tracking and receipt generation
   * Create schema for insurance claims and processing
   * Design schema for financial transactions and ledger entries
   * Implement schema for expense tracking and categorization
   * Add fields for financial reporting and analytics
   * Create schema for discount management and approvals

6. Design laboratory and radiology schemas
   * Create Test/Procedure catalog with requirements and preparations
   * Implement sample collection and tracking
   * Design schema for test results with reference ranges
   * Create schema for imaging studies with DICOM metadata
   * Implement reporting templates and structured data
   * Add fields for critical values and alerts
   * Design schema for equipment usage and calibration

7. Create ambulance management schema
   * Design Ambulance model with vehicle details and equipment
   * Implement driver assignments and availability
   * Create schema for dispatch requests and tracking
   * Design schema for service history and maintenance
   * Implement GPS location tracking and history
   * Add fields for patient transport details and vitals
   * Create schema for billing and insurance for ambulance services

8. Design attendance tracking schema
   * 8.1. Include fields for biometric data and ZKTeco device integration
     * Biometric template storage (fingerprint, face)
     * Device mapping and configuration
     * Authentication logs and audit trails
   * 8.2. Design schema for storing fingerprint/face recognition logs
     * Time-stamped entry and exit records
     * Verification method and confidence scores
     * Exception handling and manual overrides
   * 8.3. Create schema for mapping biometric IDs to staff profiles
     * Multiple biometric identifiers per user
     * Enrollment status and quality metrics
     * Access level assignments by biometric
   * 8.4. Implement shift management and scheduling
     * Shift definitions and rotations
     * Time-off requests and approvals
     * Overtime calculation rules

9. Create TPA (Third Party Administrator) schema for insurance
   * Design TPA organization profile with contact details
   * Implement policy types and coverage details
   * Create schema for pre-authorization requests
   * Design claim submission and tracking
   * Add fields for payment reconciliation
   * Implement patient-policy relationships
   * Create schema for coverage verification and eligibility

10. Design duty roster schema for scheduling staff on duty
    * Create shift definitions and templates
    * Implement rotation patterns and rules
    * Design schema for staff preferences and constraints
    * Create schema for leave integration and coverage
    * Add fields for skill requirements and matching
    * Implement notification and confirmation tracking
    * Design schema for last-minute changes and swaps

11. Create human resource module schema for managing staff salaries, leaves, and other HR related tasks
    * Design employee profile with employment details
    * Implement salary structure and components
    * Create schema for leave types and balances
    * Design performance evaluation and metrics
    * Add fields for training and certification tracking
    * Implement document management for HR records
    * Create schema for grievances and resolutions

12. Design government subsidy scheme schema for managing various government healthcare programs
    * 12.1. Include fields for scheme name, eligibility criteria, coverage details
      * Scheme identification and official references
      * Target beneficiary demographics
      * Documentation requirements
    * 12.2. Add support for both percentage-based and fixed amount subsidies
      * Calculation rules and formulas
      * Service-specific coverage rates
      * Approval workflow and verification
    * 12.3. Include maximum coverage limits per patient/treatment
      * Period-based limits (annual, lifetime)
      * Service category sub-limits
      * Family vs. individual coverage tracking
    * 12.4. Design tracking system for subsidy utilization
      * Benefit consumption history
      * Remaining balance calculations
      * Renewal and reset rules
      * Reporting for government reimbursement

13. Create housekeeping management schema
    * 13.1. Design schema for tracking cleaning schedules and tasks
      * Room/area definitions and requirements
      * Frequency and priority settings
      * Checklist templates and compliance
    * 13.2. Implement schema for housekeeping staff assignments
      * Staff skills and specializations
      * Zone responsibilities and rotations
      * Workload balancing and optimization
    * 13.3. Create schema for cleaning verification and quality control
      * Inspection criteria and scoring
      * Issue categorization and resolution
      * Performance metrics and trends
    * 13.4. Design schema for inventory of cleaning supplies
      * Product catalog and specifications
      * Usage rates and forecasting
      * Reordering and stock management

**Expected Deliverables:**
- Complete Prisma schema file with all models defined
- Entity-relationship diagrams for major subsystems
- Database migration scripts for schema implementation
- Seed data scripts for testing and development
- Documentation of schema design decisions and relationships
- Indexing strategy for performance optimization
- Data validation rules and constraints

## Phase 2: Core Modules Development

### Task 4: Dashboard Implementation
Create role-specific dashboards for each user type with appropriate metrics, charts, and quick access features using components from `@/components`.

**Tools and Technologies:**
- Next.js for frontend and API routes
- React for UI components
- Server-Sent Events (SSE) for real-time updates
- Chart.js or Recharts for data visualization
- Prisma for database queries
- TailwindCSS for responsive layouts

1. Implement superadmin dashboard with hospital-wide metrics with backend API integration connect both frontend and backend, if you want to change database schema, please update it in `@/models`.

   **Database Schema**: Review and verify that the necessary database schemas exist for all dashboard metrics. If not, update the schema in `prisma/schema.prisma` to include:
   - Patient admission and discharge tracking
   - Revenue and expense records
   - Bed inventory and status tracking
   - Treatment outcomes tracking
   - Department patient flow metrics
   - Staff availability records
   - Inventory stock levels
   - Billing and payment status records
   - Employee role and department tracking
   - Department income records

   **Backend**: Implement using Next.js API routes with Server-Sent Events (SSE) for real-time updates. Create API routes in `/pages/api/dashboard/` for each metric (e.g., `/pages/api/dashboard/admission-discharge-rate-sse.js`). Each route should:
   - Establish an SSE connection (set appropriate headers).
   - Query the database (using Prisma) for the relevant data.
   - Send data as SSE events.
   - Handle client disconnection.
   - Implement error handling and reconnection logic.
   - Add caching for frequently accessed data.
   - Include data aggregation and transformation logic.

   **Frontend**: Create React components in `components/dashboard/` (e.g., `components/dashboard/AdmissionDischargeRateChart.js`) to:
   - Connect to the corresponding SSE endpoint using EventSource.
   - Update the chart data using useState on receiving SSE events.
   - Implement loading states and error handling.
   - Create responsive layouts that work on all device sizes.
   - Add interactive features like tooltips, zooming, and filtering.
   - Include print and export functionality for reports.

   * 1.1. Patient admissions and discharge rate with bar chart
     * Display daily/weekly/monthly admission and discharge counts
     * Include trend lines for historical comparison
     * Add filters for department, doctor, and date range
     * Implement drill-down capability to view detailed patient lists
     * Backend API Route: `/pages/api/dashboard/admission-discharge-rate-sse.js`
     * Frontend Component: `components/dashboard/AdmissionDischargeChart.js`

   * 1.2. Revenue and expenses comparison with donut chart
     * Show revenue vs. expenses breakdown by category
     * Include percentage indicators for profit margins
     * Add time period selector (daily, weekly, monthly, yearly)
     * Implement hover details for each segment
     * Backend API Route: `/pages/api/dashboard/revenue-expenses-sse.js`
     * Frontend Component: `components/dashboard/RevenueExpensesChart.js`

   * 1.3. Bed availability and occupied beds with gauge chart
     * Display real-time bed occupancy rates by category
     * Color-code based on occupancy thresholds
     * Include numeric indicators for available/total beds
     * Add ward/floor filtering options
     * Backend API Route: `/pages/api/dashboard/bed-availability-sse.js`
     * Frontend Component: `components/dashboard/BedAvailabilityGauge.js`

   * 1.4. Patient care and treatment outcome metrics with line chart
     * Track recovery rates, readmissions, and complications
     * Compare against benchmarks and historical data
     * Include filters for procedure types and departments
     * Add annotations for significant events or protocol changes
     * Backend API Route: `/pages/api/dashboard/treatment-outcomes-sse.js`
     * Frontend Component: `components/dashboard/TreatmentOutcomesChart.js`

   * 1.5. Department-wise patient flow and waiting time with stacked bar chart
     * Visualize patient volume by department
     * Show average waiting times with threshold indicators
     * Include peak hour analysis
     * Add drill-down to identify bottlenecks
     * Backend API Route: `/pages/api/dashboard/department-patient-flow-sse.js`
     * Frontend Component: `components/dashboard/PatientFlowChart.js`

   * 1.6. Doctor and nurse availability and on-duty status with heat map
     * Display staff availability across time slots
     * Color-code based on staffing adequacy
     * Include on-call and emergency coverage
     * Add filters for departments and specialties
     * Backend API Route: `/pages/api/dashboard/staff-availability-sse.js`
     * Frontend Component: `components/dashboard/StaffAvailabilityHeatmap.js`

   * 1.7. Inventory and stock levels with line chart
     * Track critical supplies and medications
     * Highlight items below reorder threshold
     * Show consumption trends and forecasts
     * Include expiry date warnings
     * Backend API Route: `/pages/api/dashboard/inventory-levels-sse.js`
     * Frontend Component: `components/dashboard/InventoryLevelsChart.js`

   * 1.8. Billing and payment status with bar chart
     * Visualize outstanding vs. collected payments
     * Show aging analysis of receivables
     * Include insurance claim status
     * Add filters for payment types and departments
     * Backend API Route: `/pages/api/dashboard/billing-payment-status-sse.js`
     * Frontend Component: `components/dashboard/BillingStatusChart.js`

   * 1.9. No of employees present in different roles in a pie chart
     * Display staff distribution by role
     * Include percentage and count labels
     * Add comparison with optimal staffing levels
     * Implement interactive legend with filtering
     * Backend API Route: `/pages/api/dashboard/employee-roles-sse.js`
     * Frontend Component: `components/dashboard/EmployeeRolesChart.js`

   * 1.10. No of employees present in different departments in a donut chart
     * Show departmental staff distribution
     * Include vacancy indicators
     * Add hover details with role breakdowns
     * Implement click-through to department details
     * Backend API Route: `/pages/api/dashboard/employee-departments-sse.js`
     * Frontend Component: `components/dashboard/EmployeeDepartmentsChart.js`

   * 1.11. Monthly income overview of different departments in a metrics widget
     * Display revenue by department with trend indicators
     * Include month-over-month growth percentages
     * Add YTD comparisons with previous year
     * Implement sorting by performance
     * Backend API Route: `/pages/api/dashboard/department-income-sse.js`
     * Frontend Component: `components/dashboard/DepartmentIncomeWidget.js`

2. Implement admin dashboard with administrative metrics along with backend API integration, if you want to change database schema, please update it in `@/models`.

   **Database Schema**: Review and verify that the necessary database schemas exist for admin dashboard metrics. If not, update the schema in `prisma/schema.prisma` to include:
   - Patient demographic information
   - Admission and discharge records
   - Revenue and expense tracking
   - Staff scheduling and availability
   - Department performance metrics
   - Patient flow and waiting time tracking

   **Backend**: Implement using Next.js API routes. Data should be fetched from the database using Prisma. Consider using SSE for metrics that need real-time updates (e.g., doctor/nurse availability).

   **Frontend**: Create React components in `components/dashboard/admin/` to display administrative metrics with appropriate visualizations and interactive features.

   * 2.1. Total patients with demographics (age, gender, state, city) in a table
     * Create sortable and filterable data table
     * Include demographic distribution charts
     * Add export functionality (CSV, Excel, PDF)
     * Implement pagination for large datasets
     * Backend API Route: `/pages/api/dashboard/admin/patients.js`
     * Frontend Component: `components/dashboard/admin/PatientDemographicsTable.js`

   * 2.2. Total admissions with details (date, doctor, department, reason) in a table
     * Display admission trends with time-series chart
     * Include filters for date range, department, and doctor
     * Add drill-down capability to view individual admission details
     * Implement status indicators for current inpatients
     * Backend API Route: `/pages/api/dashboard/admin/admissions.js`
     * Frontend Component: `components/dashboard/admin/AdmissionsTable.js`

   * 2.3. Total discharges with details (date, doctor, department, reason) in a table
     * Show discharge statistics with length-of-stay analysis
     * Include readmission rate indicators
     * Add filters for discharge type and department
     * Implement comparison with admission rates
     * Backend API Route: `/pages/api/dashboard/admin/discharges.js`
     * Frontend Component: `components/dashboard/admin/DischargesTable.js`

   * 2.4. Total revenue with breakdown (by department, by doctor, by date) in a table
     * Create multi-dimensional revenue analysis
     * Include trend indicators and growth metrics
     * Add interactive pivot table functionality
     * Implement graphical representation options
     * Backend API Route: `/pages/api/dashboard/admin/revenue.js`
     * Frontend Component: `components/dashboard/admin/RevenueBreakdownTable.js`

   * 2.5. Total expenses with breakdown (by department, by doctor, by date) in a table
     * Display expense categories with percentage distribution
     * Include budget variance analysis
     * Add cost center filtering
     * Implement expense forecasting based on trends
     * Backend API Route: `/pages/api/dashboard/admin/expenses.js`
     * Frontend Component: `components/dashboard/admin/ExpenseBreakdownTable.js`

   * 2.6. Doctor and nurse availability and on-duty status with heat map
     * Show real-time staff availability across departments
     * Include shift coverage analysis
     * Add understaffed area alerts
     * Implement staff allocation suggestions
     * Backend API Route: `/pages/api/dashboard/admin/staff-availability-sse.js`
     * Frontend Component: `components/dashboard/admin/StaffAvailabilityHeatmap.js`

   * 2.7. Department-wise patient flow and waiting time with stacked bar chart
     * Visualize patient volume and bottlenecks
     * Include waiting time thresholds and alerts
     * Add hourly breakdown for peak analysis
     * Implement resource allocation recommendations
     * Backend API Route: `/pages/api/dashboard/admin/department-flow-sse.js`
     * Frontend Component: `components/dashboard/admin/DepartmentFlowChart.js`

   * 2.8. Monthly income overview of different departments in a metrics widget
     * Display department revenue with performance indicators
     * Include target achievement percentages
     * Add year-over-year comparison
     * Implement department ranking by profitability
     * Backend API Route: `/pages/api/dashboard/admin/department-income.js`
     * Frontend Component: `components/dashboard/admin/DepartmentIncomeWidget.js`

3. Design doctor dashboard with patient and appointment metrics

   **Database Schema**: Review and verify that the necessary database schemas exist for doctor dashboard metrics. If not, update the schema in `prisma/schema.prisma` to include:
   - Doctor-specific patient assignments
   - OPD appointment scheduling
   - Patient waiting time tracking
   - Inpatient care assignments
   - Surgery scheduling and tracking
   - Patient outcome metrics

   **Backend**: Implement using Next.js API routes. Create API routes in `/pages/api/dashboard/doctor/` for each metric.

   **Frontend**: Create React components in `components/dashboard/doctor/` to display doctor-specific metrics with appropriate visualizations.

   * 3.1. OPD patient waiting time in a gauge chart
     * Display real-time average waiting time
     * Include threshold indicators (green/yellow/red)
     * Add historical comparison with previous days
     * Implement patient queue visualization
     * Backend API Route: `/pages/api/dashboard/doctor/waiting-time.js`
     * Frontend Component: `components/dashboard/doctor/WaitingTimeGauge.js`

   * 3.2. No of OPD patients seen today in a metrics widget
     * Show count with comparison to daily average
     * Include patient type breakdown
     * Add hourly distribution chart
     * Implement click-through to patient list
     * Backend API Route: `/pages/api/dashboard/doctor/patients-seen.js`
     * Frontend Component: `components/dashboard/doctor/PatientSeenWidget.js`

   * 3.3. No of OPD patient appointments scheduled today in a metrics widget
     * Display upcoming appointments with time slots
     * Include patient status indicators (arrived, waiting, in-progress)
     * Add quick actions (reschedule, cancel, add notes)
     * Implement time-remaining indicators
     * Backend API Route: `/pages/api/dashboard/doctor/appointments-today.js`
     * Frontend Component: `components/dashboard/doctor/AppointmentsWidget.js`

   * 3.4. No of Inpatients under doctor's care in a metrics widget
     * Show count with ward distribution
     * Include critical patient indicators
     * Add length-of-stay information
     * Implement quick access to patient records
     * Backend API Route: `/pages/api/dashboard/doctor/inpatients.js`
     * Frontend Component: `components/dashboard/doctor/InpatientsWidget.js`

   * 3.5. No of surgeries scheduled today in a metrics widget
     * Display surgery schedule with timing and location
     * Include procedure type and preparation status
     * Add team member information
     * Implement pre-surgery checklist access
     * Backend API Route: `/pages/api/dashboard/doctor/surgeries-scheduled.js`
     * Frontend Component: `components/dashboard/doctor/SurgeriesScheduledWidget.js`

   * 3.6. No of surgeries performed today in a metrics widget
     * Show completed surgeries with outcome status
     * Include duration and complexity metrics
     * Add post-operative care reminders
     * Implement quick access to surgery notes
     * Backend API Route: `/pages/api/dashboard/doctor/surgeries-performed.js`
     * Frontend Component: `components/dashboard/doctor/SurgeriesPerformedWidget.js`

   * 3.7. Patient outcome metrics with trend chart
     * Display recovery rates and treatment effectiveness
     * Include comparison with department/hospital averages
     * Add condition-specific outcome tracking
     * Implement patient satisfaction scores
     * Backend API Route: `/pages/api/dashboard/doctor/patient-outcomes.js`
     * Frontend Component: `components/dashboard/doctor/PatientOutcomesChart.js`

4. Implement nurse dashboard with patient care metrics

   **Database Schema**: Review and verify that the necessary database schemas exist for nurse dashboard metrics. If not, update the schema in `prisma/schema.prisma` to include:
   - Nurse-patient assignments
   - Vital signs monitoring
   - Medication administration records
   - Care plan tracking
   - Patient assessment data
   - Task scheduling and completion

   **Backend**: Implement using Next.js API routes. Create API routes in `/pages/api/dashboard/nurse/` for each component.

   **Frontend**: Create React components in `components/dashboard/nurse/` to display nursing-specific interfaces and metrics.

   * 4.1. Patient list with search and filters
     * Create ward/unit-specific patient lists
     * Include vital sign status indicators
     * Add care priority flags and alerts
     * Implement quick-access patient cards
     * Include task due indicators for each patient
     * Backend API Route: `/pages/api/dashboard/nurse/patient-list.js`
     * Frontend Component: `components/dashboard/nurse/PatientList.js`

   * 4.2. Appointment calendar with drag and drop
     * Display procedures and treatments schedule
     * Include resource allocation visualization
     * Add conflict detection for scheduling
     * Implement drag-and-drop rescheduling
     * Create color-coding by procedure type
     * Backend API Route: `/pages/api/dashboard/nurse/calendar.js`
     * Frontend Component: `components/dashboard/nurse/AppointmentCalendar.js`

   * 4.3. Patient details with medical history
     * Show comprehensive patient information
     * Include allergy and alert indicators
     * Add vital signs trend charts
     * Implement tabbed interface for different data categories
     * Create printable patient summary
     * Backend API Route: `/pages/api/dashboard/nurse/patient-details.js`
     * Frontend Component: `components/dashboard/nurse/PatientDetails.js`

   * 4.4. Prescription management
     * Display medication schedule with timing
     * Include administration status tracking
     * Add medication interaction warnings
     * Implement barcode scanning for verification
     * Create PRN medication tracking
     * Backend API Route: `/pages/api/dashboard/nurse/prescriptions.js`
     * Frontend Component: `components/dashboard/nurse/PrescriptionManagement.js`

   * 4.5. Appointment history
     * Show chronological treatment history
     * Include outcome documentation
     * Add procedure notes and follow-ups
     * Implement filtering by procedure type
     * Create timeline visualization
     * Backend API Route: `/pages/api/dashboard/nurse/appointment-history.js`
     * Frontend Component: `components/dashboard/nurse/AppointmentHistory.js`

   * 4.6. Patient communication interface
     * Create secure messaging with patients
     * Include template messages for common communications
     * Add read receipt tracking
     * Implement file and image sharing
     * Create voice/video call integration
     * Backend API Route: `/pages/api/dashboard/nurse/communication.js`
     * Frontend Component: `components/dashboard/nurse/PatientCommunication.js`

   * 4.7. Task management dashboard
     * Display scheduled and pending tasks
     * Include due time indicators and priorities
     * Add task completion tracking
     * Implement task assignment and delegation
     * Create recurring task templates
     * Backend API Route: `/pages/api/dashboard/nurse/tasks.js`
     * Frontend Component: `components/dashboard/nurse/TaskManagement.js`

   * 4.8. Care plan tracking
     * Show patient care plans with progress indicators
     * Include goal achievement tracking
     * Add intervention documentation
     * Implement care plan templates
     * Create interdisciplinary notes
     * Backend API Route: `/pages/api/dashboard/nurse/care-plans.js`
     * Frontend Component: `components/dashboard/nurse/CarePlanTracking.js`

5. Implement department-specific dashboards with data visualizations

   **Database Schema**: Review and verify that the necessary database schemas exist for department-specific dashboards. If not, update the schema in `prisma/schema.prisma` to include department-specific models for Pharmacy, Laboratory, and Radiology.

   **Backend**: Implement using Next.js API routes. Use SSE for real-time data in Pharmacy, Laboratory, and Radiology dashboards where applicable (e.g., real-time inventory updates, test result updates).

   **Frontend**: Create React components in `components/dashboard/departments/` for each department's specific visualization needs.

   * 5.1. Pharmacy dashboard
     * 5.1.1. Inventory and stock levels with line chart
       * Display real-time medication stock levels
       * Include reorder threshold indicators
       * Add expiry date warnings with color coding
       * Implement stock trend analysis and forecasting
       * Create category-based inventory visualization
       * Backend API Route: `/pages/api/dashboard/pharmacy/inventory-sse.js`
       * Frontend Component: `components/dashboard/departments/pharmacy/InventoryChart.js`

     * 5.1.2. Sales and revenue metrics with bar chart
       * Show daily/weekly/monthly sales trends
       * Include medication category breakdown
       * Add profit margin analysis
       * Implement comparison with previous periods
       * Create revenue forecast projections
       * Backend API Route: `/pages/api/dashboard/pharmacy/sales.js`
       * Frontend Component: `components/dashboard/departments/pharmacy/SalesChart.js`

     * 5.1.3. No of customers in a pie chart
       * Display customer type distribution
       * Include time-of-day analysis
       * Add customer demographic breakdown
       * Implement customer loyalty segmentation
       * Create prescription vs. OTC purchase ratio
       * Backend API Route: `/pages/api/dashboard/pharmacy/customers.js`
       * Frontend Component: `components/dashboard/departments/pharmacy/CustomerChart.js`

     * 5.1.4. Top selling medicines in a bar chart
       * Show bestselling medications with quantity and revenue
       * Include seasonal trend analysis
       * Add prescription frequency metrics
       * Implement stock-to-sales ratio indicators
       * Create drug class comparison
       * Backend API Route: `/pages/api/dashboard/pharmacy/top-medicines.js`
       * Frontend Component: `components/dashboard/departments/pharmacy/TopMedicinesChart.js`

     * 5.1.5. Prescription fulfillment dashboard
       * Display pending and completed prescriptions
       * Include verification status tracking
       * Add patient waiting time metrics
       * Implement pharmacist workload distribution
       * Create prescription error tracking
       * Backend API Route: `/pages/api/dashboard/pharmacy/prescriptions-sse.js`
       * Frontend Component: `components/dashboard/departments/pharmacy/PrescriptionDashboard.js`

   * 5.2. Laboratory dashboard
     * 5.2.1. Test catalog management
       * Create searchable test directory
       * Include test requirements and preparations
       * Add pricing and insurance coverage information
       * Implement test grouping and profiles
       * Create test procedure documentation
       * Backend API Route: `/pages/api/dashboard/laboratory/test-catalog.js`
       * Frontend Component: `components/dashboard/departments/laboratory/TestCatalog.js`

     * 5.2.2. Test request workflow
       * Display pending and in-progress test requests
       * Include priority and STAT indicators
       * Add estimated completion times
       * Implement workflow stage visualization
       * Create bottleneck identification
       * Backend API Route: `/pages/api/dashboard/laboratory/test-requests-sse.js`
       * Frontend Component: `components/dashboard/departments/laboratory/TestRequestWorkflow.js`

     * 5.2.3. Sample collection tracking
       * Show sample collection schedule and status
       * Include specimen type and requirements
       * Add barcode/ID tracking integration
       * Implement collection site assignment
       * Create specimen rejection tracking
       * Backend API Route: `/pages/api/dashboard/laboratory/sample-tracking-sse.js`
       * Frontend Component: `components/dashboard/departments/laboratory/SampleTracking.js`

     * 5.2.4. Result entry and validation system
       * Create structured result entry forms
       * Include reference range indicators
       * Add critical value alerts
       * Implement quality control tracking
       * Create result verification workflow
       * Backend API Route: `/pages/api/dashboard/laboratory/results-sse.js`
       * Frontend Component: `components/dashboard/departments/laboratory/ResultEntry.js`

     * 5.2.5. Result reporting with PDF export
       * Display formatted test reports
       * Include historical result comparison
       * Add digital signature integration
       * Implement multiple export formats
       * Create batch reporting capabilities
       * Backend API Route: `/pages/api/dashboard/laboratory/reports.js`
       * Frontend Component: `components/dashboard/departments/laboratory/ResultReporting.js`

     * 5.2.6. Laboratory performance metrics
       * Show turnaround time by test type
       * Include test volume and capacity analysis
       * Add quality metrics and error rates
       * Implement resource utilization tracking
       * Create cost per test analysis
       * Backend API Route: `/pages/api/dashboard/laboratory/performance.js`
       * Frontend Component: `components/dashboard/departments/laboratory/PerformanceMetrics.js`

   * 5.3. Radiology dashboard
     * 5.3.1. Imaging service catalog using DICOM standard
       * Create searchable imaging procedure directory
       * Include procedure requirements and preparations
       * Add equipment and resource requirements
       * Implement procedure documentation access
       * Create pricing and insurance information
       * Backend API Route: `/pages/api/dashboard/radiology/service-catalog.js`
       * Frontend Component: `components/dashboard/departments/radiology/ServiceCatalog.js`

     * 5.3.2. Imaging request workflow
       * Display scheduled and pending imaging requests
       * Include priority and urgency indicators
       * Add patient preparation status
       * Implement equipment allocation visualization
       * Create technologist assignment tracking
       * Backend API Route: `/pages/api/dashboard/radiology/request-workflow-sse.js`
       * Frontend Component: `components/dashboard/departments/radiology/RequestWorkflow.js`

     * 5.3.3. Image and video storage and viewing system using DICOM standard
       * Implement DICOM viewer integration
       * Include study comparison capabilities
       * Add measurement and annotation tools
       * Implement 3D reconstruction options
       * Create series navigation and manipulation
       * Backend API Route: `/pages/api/dashboard/radiology/image-viewer.js`
       * Frontend Component: `components/dashboard/departments/radiology/DicomViewer.js`

     * 5.3.4. Report generation system
       * Create structured reporting templates
       * Include voice recognition integration
       * Add key image capture and annotation
       * Implement report validation workflow
       * Create critical finding alert system
       * Backend API Route: `/pages/api/dashboard/radiology/reports-sse.js`
       * Frontend Component: `components/dashboard/departments/radiology/ReportGeneration.js`

     * 5.3.5. Radiology performance metrics
       * Show modality utilization rates
       * Include study volume by procedure type
       * Add radiologist productivity metrics
       * Implement report turnaround times
       * Create radiation dose tracking
       * Backend API Route: `/pages/api/dashboard/radiology/performance.js`
       * Frontend Component: `components/dashboard/departments/radiology/PerformanceMetrics.js`

6. Implement patient dashboard with appointment and medical record access

   **Database Schema**: Review and verify that the necessary database schemas exist for patient dashboard features. If not, update the schema in `prisma/schema.prisma` to include:
   - Patient-specific appointment records
   - Medical record access permissions
   - Prescription history and medication tracking
   - Patient education material assignments
   - Billing and payment history
   - Patient feedback and survey responses

   **Backend**: Implement using Next.js API routes. Create API routes in `/pages/api/dashboard/patient/` for each component.

   **Frontend**: Create React components in `components/dashboard/patient/` to display patient-specific interfaces and information.

   * 6.1. Create appointment history and upcoming appointments list
     * Display chronological appointment timeline
     * Include status indicators (completed, upcoming, canceled)
     * Add appointment details with provider information
     * Implement appointment booking and rescheduling
     * Create calendar integration with reminders
     * Backend API Route: `/pages/api/dashboard/patient/appointments.js`
     * Frontend Component: `components/dashboard/patient/AppointmentList.js`

   * 6.2. Implement medical record access with search and filters
     * Create secure medical record viewer
     * Include categorized medical information
     * Add search functionality across record types
     * Implement date range filtering
     * Create printable/downloadable record summaries
     * Backend API Route: `/pages/api/dashboard/patient/medical-records.js`
     * Frontend Component: `components/dashboard/patient/MedicalRecords.js`

   * 6.3. Add patient prescription history and medication reminders
     * Show active and past prescriptions
     * Include medication instructions and warnings
     * Add refill request functionality
     * Implement medication schedule with reminders
     * Create medication adherence tracking
     * Backend API Route: `/pages/api/dashboard/patient/prescriptions.js`
     * Frontend Component: `components/dashboard/patient/PrescriptionHistory.js`

   * 6.4. Implement nurse notes and patient education material access
     * Display care instructions and follow-up notes
     * Include categorized educational resources
     * Add multimedia content (videos, infographics)
     * Implement condition-specific resource recommendations
     * Create progress tracking for educational modules
     * Backend API Route: `/pages/api/dashboard/patient/education.js`
     * Frontend Component: `components/dashboard/patient/EducationMaterials.js`

   * 6.5. Add discharge summary and billing history access
     * Show discharge instructions and follow-up plans
     * Include itemized billing statements
     * Add payment history and outstanding balances
     * Implement online payment functionality
     * Create insurance claim status tracking
     * Backend API Route: `/pages/api/dashboard/patient/billing.js`
     * Frontend Component: `components/dashboard/patient/BillingHistory.js`

   * 6.6. Implement patient satisfaction survey and feedback system
     * Create customizable survey forms
     * Include rating scales and open-ended questions
     * Add survey completion incentives
     * Implement feedback response tracking
     * Create satisfaction trend analysis
     * Backend API Route: `/pages/api/dashboard/patient/feedback.js`
     * Frontend Component: `components/dashboard/patient/SatisfactionSurvey.js`

   * 6.7. Create patient health tracking dashboard
     * Display vital signs and health metrics
     * Include goal setting and progress tracking
     * Add integration with wearable devices
     * Implement trend visualization and alerts
     * Create health journal functionality
     * Backend API Route: `/pages/api/dashboard/patient/health-tracking.js`
     * Frontend Component: `components/dashboard/patient/HealthTracking.js`

   * 6.8. Implement telemedicine integration
     * Create video consultation scheduling
     * Include virtual waiting room
     * Add pre-consultation questionnaires
     * Implement secure messaging with providers
     * Create post-consultation follow-up tracking
     * Backend API Route: `/pages/api/dashboard/patient/telemedicine.js`
     * Frontend Component: `components/dashboard/patient/Telemedicine.js`

7. Add responsive charts and graphs using the theme's chart components
   * Implement responsive design for all dashboard components
   * Utilize the theme's chart components for consistent styling
   * Create reusable chart components with customizable options
   * Implement cross-browser compatibility testing
   * Add print-friendly versions of all charts and reports
   * Create chart export functionality (PNG, PDF, CSV)
   * Implement accessibility features for all visualizations

   **Frontend Components**:
   * `components/charts/BarChart.js`
   * `components/charts/LineChart.js`
   * `components/charts/PieChart.js`
   * `components/charts/DonutChart.js`
   * `components/charts/GaugeChart.js`
   * `components/charts/HeatMap.js`
   * `components/charts/ScatterPlot.js`
   * `components/charts/AreaChart.js`
   * `components/charts/RadarChart.js`
   * `components/charts/TreeMap.js`

**Expected Deliverables for Task 4:**
- Complete implementation of all dashboard types (superadmin, admin, doctor, nurse, department-specific, patient)
- Responsive and interactive data visualizations for all metrics
- Real-time data updates using Server-Sent Events where appropriate
- Comprehensive API routes for all dashboard data
- Reusable chart components with consistent styling
- Role-based access control for dashboard features
- Optimized database queries for dashboard performance
- Documentation for all dashboard components and API routes

### Task 5: User Management System
Implement the user management system for creating, editing, and managing users of all roles.

**Database Schema**: Review and verify that the necessary database schemas exist for user management. If not, update the schema in `prisma/schema.prisma` to include:
- User model with fields for authentication (email, password hash, etc.)
- Role-based permissions model
- User status tracking
- User profile information
- Permission assignments
- OAuth integration fields (Google, Facebook)
- Two-factor authentication fields

**Backend**: Implement using Next.js API routes for all operations (create, read, update, delete). Secure these routes with appropriate authentication and authorization.

**Frontend**: Create React components for user management interfaces.

1. Create user listing page
   * 1.1. Implement user listing table component
   * 1.2. Add user search bar
   * 1.3. Implement pagination

   **Backend API Route**: `/pages/api/users/index.js` (GET for listing, POST for creating)

2. Implement user creation form
   * 2.1. Create user registration form component
   * 2.2. Add input validation
   * 2.3. Implement password hashing
   * 2.4. Add role assignment dropdown
   * 2.5. Implement user creation logic

   **Backend API Route**: `/pages/api/users/create.js`

3. Design user profile pages
   * 3.1. Create user profile page component
   * 3.2. Add user information display
   * 3.3. Add role-specific information display

   **Backend API Route**: `/pages/api/users/[id].js` (GET for fetching, PUT for updating)

4. Create permission management interface
   * 4.1. Create permission management page component
   * 4.2. Add permission table component
   * 4.3. Implement permission editing

   **Backend API Route**: `/pages/api/permissions/index.js`

5. Implement user status management
   * 5.1. Add user status toggle
   * 5.2. Implement user status update logic

   **Backend API Route**: `/pages/api/users/status.js`

6. Add user search and filtering functionality
   * 6.1. Implement user search bar with search by name, appointment number, IPD number, reference number, father name, mobile number, etc.
   * 6.2. Create advanced filtering options (role, status, department)
   * 6.3. Implement saved searches functionality
   * 6.4. Add export functionality for search results
   * 6.5. Create user activity logs and audit trails

   **Backend API Route**: `/pages/api/users/search.js`
   **Frontend Component**: `components/users/UserSearch.js`

**Expected Deliverables for Task 5:**
- Complete user management system with CRUD operations
- Role-based permission management interface
- Secure authentication and authorization implementation
- User profile pages with role-specific information
- Comprehensive search and filtering functionality
- User status management with audit logging
- Database schema for users, roles, and permissions
- API documentation for all user management endpoints
### Task 6: Patient Management Module
Develop the patient management module for registering, tracking, and managing patient information.

**Database Schema**: Review and verify that the necessary database schemas exist for patient management. If not, update the schema in `prisma/schema.prisma` to include:
- Patient personal and demographic information
- Medical history records
- Document storage and metadata
- Appointment history linking
- Billing history linking
- Prescription history
- Government subsidy scheme eligibility and utilization
- Medication management and scheduling
- Patient-doctor relationships

**Backend**: Implement using Next.js API routes for all operations.

**Frontend**: Create React components for patient management interfaces.

1. Create patient registration form

   **Backend API Route**: `/pages/api/patients/register.js`

2. Implement patient listing with search and filters

   **Backend API Route**: `/pages/api/patients/index.js`

3. Design patient profile view with medical history

   **Backend API Route**: `/pages/api/patients/[id].js`

4. Create patient document upload system

   **Backend API Route**: `/pages/api/patients/documents/upload.js`

5. Implement patient appointment history

   **Backend API Route**: `/pages/api/patients/[id]/appointments.js`

6. Add patient billing history

   **Backend API Route**: `/pages/api/patients/[id]/billing.js`

7. Create patient prescription history

   **Backend API Route**: `/pages/api/patients/[id]/prescriptions.js`

8. Implement government subsidy scheme integration
   * 8.1. Create subsidy scheme eligibility verification during registration
   * 8.2. Add subsidy scheme selection interface with scheme details
   * 8.3. Implement subsidy limit tracking and visualization
   * 8.4. Create visual indicators (breadcrumbs) for subsidy status
   * 8.5. Design alerts for when patients approach or exceed subsidy limits
   * 8.6. Implement documentation upload for subsidy scheme eligibility proof

   **Backend API Route**: `/pages/api/patients/subsidy/index.js`

9. Design patient medication management
   * 9.1. Create prescription tracking system
     * Track active and historical prescriptions
     * Include medication details and dosage information
     * Add prescribing doctor and pharmacy information
   * 9.2. Implement medication schedule management
     * Create daily/weekly medication schedules
     * Include timing and special instructions
     * Add dependency rules between medications
   * 9.3. Design medication adherence monitoring
     * Track medication consumption confirmation
     * Include missed dose tracking and alerts
     * Add adherence statistics and reporting
   * 9.4. Create medication reminders via WhatsApp with confirmation
     * Implement scheduled reminder messages
     * Include dose confirmation responses
     * Add escalation for missed confirmations
   * 9.5. Implement medication history tracking
     * Record complete medication history
     * Include effectiveness and side effect tracking
     * Add medication changes with reasons

   **Backend API Route**: `/pages/api/patients/medications/index.js`
   **Frontend Component**: `components/patients/MedicationManagement.js`

**Expected Deliverables for Task 6:**
- Complete patient management system with registration and tracking
- Comprehensive patient profile view with medical history
- Document upload and management system
- Appointment and billing history integration
- Government subsidy scheme implementation
- Medication management with reminders and tracking
- Patient-doctor relationship management
- Search and filtering functionality for patient records
- Database schema for all patient-related entities
- API documentation for all patient management endpoints
### Task 7: Appointment System
Implement the appointment scheduling system for managing patient appointments with doctors.

**Database Schema**: Review and verify that the necessary database schemas exist for appointment management. If not, update the schema in `prisma/schema.prisma` to include:
- Appointment scheduling with date, time, and duration
- Doctor-patient relationship for appointments
- Appointment status tracking
- Notification preferences and history
- Inter-department referral tracking
- Co-consultation appointment linking
- Appointment history and reporting metrics
- Billing integration for appointments

**Backend**: Implement using Next.js API routes. Consider SSE for real-time updates to appointment calendars, if needed.

**Frontend**: Create React components for appointment management interfaces.

1. Create appointment booking interface

   **Backend API Route**: `/pages/api/appointments/create.js`

2. Implement calendar view for appointments

   **Backend API Route**: `/pages/api/appointments/calendar.js`

3. Design appointment confirmation and notification system
   * 3.1. Create email notification system
   * 3.2. Implement SMS notification systemg
   * 3.3. Design WhatsApp appointment reminders with interactive confirmation
   * 3.4. Create notification scheduling and timing preferences
   * 3.5. Implement multi-channel notification strategy

   **Backend API Route**: `/pages/api/appointments/notifications/index.js`

4. Create appointment rescheduling functionality

   **Backend API Route**: `/pages/api/appointments/reschedule.js`

5. Implement appointment status tracking

   **Backend API Route**: `/pages/api/appointments/status.js`

6. Add appointment history and reporting

   **Backend API Route**: `/pages/api/appointments/history.js`

7. Develop inter-department patient referral system
   * 7.1. Create doctor referral interface for redirecting patients to appropriate departments
   * 7.2. Implement referral workflow with reason documentation
   * 7.3. Design automatic appointment transfer to new department/doctor
   * 7.4. Create billing adjustment for referred appointments (visit counted for receiving doctor only)
   * 7.5. Implement notification system for both referring and receiving doctors
   * 7.6. Add referral tracking and analytics

   **Backend API Route**: `/pages/api/appointments/referrals/index.js`

8. Implement co-consultation management
   * 8.1. Create interface for requesting additional doctor consultations
     * Design consultation request workflow
     * Include reason and urgency indicators
     * Add availability checking for requested doctors
   * 8.2. Design parallel appointment scheduling for multiple doctors
     * Create synchronized scheduling system
     * Include conflict detection and resolution
     * Add resource allocation for shared appointments
   * 8.3. Implement multi-doctor visit tracking
     * Track participation of all doctors
     * Include time tracking for each doctor
     * Add role assignment within consultation
   * 8.4. Create billing system for multiple doctor consultations (billing calculated for all doctors)
     * Implement fee distribution rules
     * Include itemized billing for each doctor's services
     * Add insurance coding for multi-doctor visits
   * 8.5. Design consultation notes sharing between co-consulting doctors
     * Create collaborative note-taking interface
     * Include section ownership and attribution
     * Add change tracking and notifications
   * 8.6. Add co-consultation analytics and reporting
     * Track frequency and patterns of co-consultations
     * Include outcome analysis for team approaches
     * Add efficiency and cost-benefit metrics

   **Backend API Route**: `/pages/api/appointments/co-consultations/index.js`
   **Frontend Component**: `components/appointments/CoConsultation.js`

**Expected Deliverables for Task 7:**
- Complete appointment scheduling system with calendar interface
- Multi-channel notification system for appointments
- Appointment rescheduling and cancellation functionality
- Status tracking for all appointments
- Comprehensive reporting and analytics
- Inter-department referral system with tracking
- Co-consultation management with billing integration
- Real-time updates for appointment changes
- Database schema for all appointment-related entities
- API documentation for all appointment system endpoints
### Task 8: Doctor Management Module
Develop the doctor management module for scheduling, patient assignment, and performance tracking.

**Database Schema**: Review and verify that the necessary database schemas exist for doctor management. If not, update the schema in `prisma/schema.prisma` to include:
- Doctor profile information (specialization, qualifications, etc.)
- Doctor scheduling and availability
- Patient assignment and relationship tracking
- Performance metrics and KPIs
- Cross-department referral tracking
- Co-consultation management
- Doctor-specific reporting metrics
- Billing rates and distribution for co-consultations

**Backend**: Implement using Next.js API routes. Use SSE for real-time updates to doctor availability/status, if needed.

**Frontend**: Create React components for doctor management interfaces.

1. Create doctor profile management

   **Backend API Route**: `/pages/api/doctors/profile.js`

2. Implement doctor scheduling system

   **Backend API Route**: `/pages/api/doctors/schedule.js`

3. Design patient assignment interface

   **Backend API Route**: `/pages/api/doctors/patients/assign.js`

4. Create doctor availability management

   **Backend API Route**: `/pages/api/doctors/availability-sse.js` (using SSE for real-time updates)

5. Implement doctor performance metrics

   **Backend API Route**: `/pages/api/doctors/metrics.js`

6. Add doctor-specific reporting

   **Backend API Route**: `/pages/api/doctors/reports.js`

7. Develop cross-department referral management
   * 7.1. Create interface for initiating patient referrals to other departments
   * 7.2. Implement referral acceptance/rejection workflow
   * 7.3. Design referral reason documentation system
   * 7.4. Create referral performance metrics (exclude referred patients from original doctor metrics)
   * 7.5. Implement referral history in doctor dashboard
   * 7.6. Add department-wise referral analytics

   **Backend API Route**: `/pages/api/doctors/referrals/index.js`

8. Implement co-consultation management system
   * 8.1. Create interface for requesting and accepting co-consultations
     * Design request workflow with notifications
     * Include availability checking and scheduling
     * Add reason documentation and priority setting
   * 8.2. Design collaborative diagnosis and treatment planning tools
     * Create shared diagnosis workspace
     * Include differential diagnosis collaboration
     * Add treatment plan version control
   * 8.3. Implement shared patient notes for co-consulting doctors
     * Design multi-author note system
     * Include section ownership and attribution
     * Add real-time collaboration features
   * 8.4. Create performance metrics for co-consultations (visit counted for all doctors involved)
     * Track contribution metrics for each doctor
     * Include outcome analysis for team approaches
     * Add patient satisfaction metrics for team care
   * 8.5. Implement co-consultation billing distribution
     * Create fee distribution rules and templates
     * Include approval workflow for distributions
     * Add insurance coding for multi-doctor services
   * 8.6. Add co-consultation history and analytics in doctor dashboard
     * Display co-consultation frequency and patterns
     * Include specialty combination analysis
     * Add efficiency and outcome metrics

   **Backend API Route**: `/pages/api/doctors/co-consultations/index.js`
   **Frontend Component**: `components/doctors/CoConsultationManagement.js`

**Expected Deliverables for Task 8:**
- Complete doctor management system with profile management
- Scheduling system with availability tracking
- Patient assignment and relationship management
- Real-time availability updates with SSE
- Performance metrics and KPI dashboard
- Cross-department referral management system
- Co-consultation workflow and collaboration tools
- Comprehensive reporting and analytics
- Database schema for all doctor-related entities
- API documentation for all doctor management endpoints
## Phase 3: Department-Specific Modules

### Task 9: Pharmacy Management
Implement the pharmacy management system for inventory, prescriptions, and sales.

**Database Schema**: Review and verify that the necessary database schemas exist for pharmacy management. If not, update the schema in `prisma/schema.prisma` to include:
- Medicine inventory with stock levels
- Medicine details (name, composition, manufacturer, etc.)
- Prescription tracking and fulfillment
- Medicine dispensing workflow
- Stock alerts and thresholds
- Supplier management
- Purchase orders and receipts
- Pharmacy billing and sales
- Pharmacy analytics and reporting metrics

**Backend**: Implement using Next.js API routes. Use SSE for real-time inventory updates.

**Frontend**: Create React components for pharmacy management interfaces.

1. Create medicine inventory management

   **Backend API Route**: `/pages/api/pharmacy/inventory-sse.js` (using SSE for real-time updates)

2. Implement prescription management system

   **Backend API Route**: `/pages/api/pharmacy/prescriptions/index.js`

3. Design medicine dispensing workflow

   **Backend API Route**: `/pages/api/pharmacy/dispensing/index.js`

4. Create stock alerts and notifications
   * 4.1. Implement low stock threshold alerts
   * 4.2. Design expiry date notifications
   * 4.3. Create WhatsApp alerts for critical medicine shortages
   * 4.4. Implement batch recall notifications
   * 4.5. Design automated reordering notifications

   **Backend API Route**: `/pages/api/pharmacy/alerts/index.js`

5. Implement medicine purchase and supplier management

   **Backend API Route**: `/pages/api/pharmacy/suppliers/index.js`

6. Add pharmacy billing integration

   **Backend API Route**: `/pages/api/pharmacy/billing/index.js`

7. Create pharmacy reports and analytics
   * 7.1. Implement sales and revenue reports
     * Create daily, weekly, monthly, and annual reports
     * Include product category breakdown
     * Add trend analysis and forecasting
   * 7.2. Design inventory management reports
     * Track stock levels and movement
     * Include expiry tracking and wastage reports
     * Add supplier performance metrics
   * 7.3. Create prescription analytics
     * Analyze prescription patterns by doctor
     * Include medication frequency analysis
     * Add drug interaction monitoring
   * 7.4. Implement customer analytics
     * Track patient medication adherence
     * Include repeat prescription analysis
     * Add customer demographic insights

   **Backend API Route**: `/pages/api/pharmacy/reports/index.js`
   **Frontend Component**: `components/pharmacy/ReportsAnalytics.js`

**Expected Deliverables for Task 9:**
- Complete pharmacy management system with inventory tracking
- Real-time inventory updates with SSE
- Prescription management workflow
- Medicine dispensing system with verification
- Stock alerts and notification system
- Supplier management and ordering system
- Pharmacy billing integration with hospital billing
- Comprehensive reporting and analytics
- Database schema for all pharmacy-related entities
- API documentation for all pharmacy management endpoints
### Task 10: Laboratory Management
Develop the laboratory management system for test requests, results, and reporting.

**Database Schema**: Review and verify that the necessary database schemas exist for laboratory management. If not, update the schema in `prisma/schema.prisma` to include:
- Test catalog with test details and requirements
- Test request workflow and status tracking
- Sample collection tracking
- Result entry and validation
- Report generation and storage
- Laboratory billing integration
- Analytics and reporting metrics
- Notification system for test results
- Critical value alerts and escalation

**Backend**: Implement using Next.js API routes. Use SSE for real-time test result updates.

**Frontend**: Create React components for laboratory management interfaces.

1. Create test catalog management

   **Backend API Route**: `/pages/api/lab/catalog/index.js`

2. Implement test request workflow

   **Backend API Route**: `/pages/api/lab/requests/index.js`

3. Design sample collection tracking

   **Backend API Route**: `/pages/api/lab/samples/index.js`

4. Create result entry and validation system

   **Backend API Route**: `/pages/api/lab/results-sse.js` (using SSE for real-time updates)

5. Implement result reporting with PDF export

   **Backend API Route**: `/pages/api/lab/reports/export.js`

6. Add laboratory billing integration

   **Backend API Route**: `/pages/api/lab/billing/index.js`

7. Create laboratory analytics and reporting

   **Backend API Route**: `/pages/api/lab/analytics/index.js`

8. Develop test result notification system
   * 8.1. Create email notification system for test results
     * Design templated result emails with branding
     * Include secure PDF attachments
     * Add configurable delivery preferences
   * 8.2. Implement SMS alerts for completed tests
     * Create concise SMS notifications
     * Include secure result access links
     * Add delivery confirmation tracking
   * 8.3. Design WhatsApp test result notifications with secure PDF reports
     * Implement interactive WhatsApp notifications
     * Include secure document sharing
     * Add read receipt tracking
   * 8.4. Create critical value alert system with escalation
     * Design multi-level alert system
     * Include escalation paths for unacknowledged alerts
     * Add audit trail for critical value notifications
   * 8.5. Implement doctor notification for abnormal results
     * Create priority-based notification system
     * Include result comparison with reference ranges
     * Add acknowledgment tracking and follow-up

   **Backend API Route**: `/pages/api/lab/notifications/index.js`
   **Frontend Component**: `components/laboratory/ResultNotifications.js`

**Expected Deliverables for Task 10:**
- Complete laboratory management system with test catalog
- Test request workflow with status tracking
- Sample collection and tracking system
- Real-time result entry and validation with SSE
- PDF report generation with digital signatures
- Laboratory billing integration with hospital billing
- Comprehensive analytics and reporting
- Multi-channel test result notification system
- Database schema for all laboratory-related entities
- API documentation for all laboratory management endpoints
### Task 11: Radiology Management
Implement the radiology management system for imaging requests, results, and reporting.

**Database Schema**: Review and verify that the necessary database schemas exist for radiology management. If not, update the schema in `prisma/schema.prisma` to include:
- Imaging service catalog with DICOM standard support
- Imaging request workflow and status tracking
- Image and video storage metadata (with DICOM standard)
- Report generation and storage
- Radiologist assignments and workflow
- Radiology billing integration
- Analytics and reporting metrics
- Patient-study-series-image DICOM hierarchy

**Backend**: Implement using Next.js API routes. Use SSE for real-time updates to imaging results, if needed.

**Frontend**: Create React components for radiology management interfaces.

1. Create imaging service catalog

   **Backend API Route**: `/pages/api/radiology/services/index.js`

2. Implement imaging request workflow

   **Backend API Route**: `/pages/api/radiology/requests/index.js`

3. Design image storage and viewing system

   **Backend API Route**: `/pages/api/radiology/images/index.js`

4. Create report generation system

   **Backend API Route**: `/pages/api/radiology/reports-sse.js` (using SSE for real-time updates)

5. Implement radiology billing integration

   **Backend API Route**: `/pages/api/radiology/billing/index.js`

6. Add radiology analytics and reporting
   * 6.1. Create procedure volume and utilization reports
     * Track procedure counts by type and modality
     * Include equipment utilization metrics
     * Add trend analysis and forecasting
   * 6.2. Implement radiologist productivity metrics
     * Measure report turnaround times
     * Include study complexity weighting
     * Add quality metrics and peer review
   * 6.3. Design patient radiation dose tracking
     * Monitor cumulative radiation exposure
     * Include dose optimization recommendations
     * Add protocol compliance monitoring
   * 6.4. Create financial performance analytics
     * Track revenue by procedure and modality
     * Include cost analysis and profitability
     * Add insurance reimbursement tracking

   **Backend API Route**: `/pages/api/radiology/analytics/index.js`
   **Frontend Component**: `components/radiology/AnalyticsReporting.js`

**Expected Deliverables for Task 11:**
- Complete radiology management system with DICOM integration
- Imaging service catalog with procedure details
- Request workflow with scheduling and tracking
- DICOM-compliant image storage and viewing system
- Structured report generation with templates
- Radiology billing integration with hospital billing
- Comprehensive analytics and reporting
- Real-time updates for imaging results with SSE
- Database schema for all radiology-related entities
- API documentation for all radiology management endpoints
### Task 12: Bed and Room Management
Implement comprehensive bed and room management system for inpatient care.

**Database Schema**: Review and verify that the necessary database schemas exist for bed and room management. If not, update the schema in `prisma/schema.prisma` to include:
- Bed inventory with types and categories
- Bed status tracking (available, occupied, maintenance)
- Ward and room organization hierarchy
- Bed pricing configuration
- Bed maintenance scheduling
- Patient admission and bed assignment
- Bed transfer history
- Room/bed change authorization
- Billing adjustments for room changes
- Room service requests and tracking
- Housekeeping task assignments
- Discharge planning and tracking

**Backend**: Implement using Next.js API routes. Use SSE for real-time updates to bed availability.

**Frontend**: Create React components for bed and room management interfaces.

1. Create bed inventory and categorization
   * 1.1. Design bed catalog with types (ICU, VIP, General, etc.)
   * 1.2. Implement bed status tracking (available, occupied, maintenance)
   * 1.3. Create ward and room organization hierarchy
   * 1.4. Design bed pricing configuration by category and features
   * 1.5. Implement bed maintenance scheduling

   **Backend API Route**: `/pages/api/beds/status-sse.js` (using SSE for real-time updates)

2. Develop bed allocation and transfer system
   * 2.1. Create patient admission and bed assignment interface
   * 2.2. Implement bed transfer workflow with history tracking
   * 2.3. Design room/bed change authorization process
   * 2.4. Create automatic billing adjustments based on room changes
   * 2.5. Implement bed reservation system

   **Backend API Route**: `/pages/api/beds/allocation/index.js`

3. Design visual bed management dashboard
   * 3.1. Create color-coded bed availability map (green for available, red for occupied, grey for maintenance)
   * 3.2. Implement floor-wise and ward-wise bed status visualization
   * 3.3. Design interactive bed assignment interface
   * 3.4. Create bed occupancy timeline visualization
   * 3.5. Implement bed search with filters (type, status, price range)

   **Backend API Route**: `/pages/api/beds/dashboard/index.js`

4. Implement dynamic room billing system
   * 4.1. Create time-based billing for different room types
   * 4.2. Design billing calculation for patient transfers between room types
   * 4.3. Implement automatic rate changes based on length of stay
   * 4.4. Create package deals for specific room types
   * 4.5. Design billing adjustments for room upgrades/downgrades

   **Backend API Route**: `/pages/api/beds/billing/index.js`

5. Develop room service management
   * 5.1. Create room service request system
   * 5.2. Implement housekeeping task assignment
   * 5.3. Design room preparation workflow
   * 5.4. Create room inspection and quality control

   **Backend API Route**: `/pages/api/beds/services/index.js`

6. Implement patient room tracking in dashboards
   * 6.1. Add current room/bed information to nurse dashboard
   * 6.2. Display room history and charges in patient dashboard
   * 6.3. Create room transfer alerts for staff
   * 6.4. Implement expected discharge date tracking
   * 6.5. Design WhatsApp discharge notifications with instructions

   **Backend API Route**: `/pages/api/beds/tracking/index.js`

7. Create bed management analytics and reporting
   * 7.1. Generate bed occupancy reports
     * Track occupancy rates by bed type and ward
     * Include seasonal and day-of-week patterns
     * Add occupancy forecasting and planning
   * 7.2. Create average length of stay analysis
     * Analyze LOS by diagnosis and department
     * Include outlier identification and analysis
     * Add LOS reduction opportunity identification
   * 7.3. Design room revenue reports
     * Track revenue by room type and location
     * Include upgrade/downgrade financial impact
     * Add package deal performance analysis
   * 7.4. Implement bed turnover rate analytics
     * Measure time between discharges and admissions
     * Include room preparation efficiency metrics
     * Add bottleneck identification in patient flow
   * 7.5. Create ward efficiency dashboards
     * Display key performance indicators by ward
     * Include staff-to-patient ratio analysis
     * Add resource utilization optimization

   **Backend API Route**: `/pages/api/beds/analytics/index.js`
   **Frontend Component**: `components/beds/AnalyticsReporting.js`

**Expected Deliverables for Task 12:**
- Complete bed and room management system with real-time tracking
- Visual bed management dashboard with interactive interface
- Bed allocation and transfer workflow system
- Dynamic room billing with rate adjustments
- Room service management with task assignment
- Patient room tracking integrated with dashboards
- Comprehensive analytics and reporting
- Real-time updates for bed availability with SSE
- Database schema for all bed and room management entities
- API documentation for all bed management endpoints
### Task 13: Billing and Accounting
Develop the billing and accounting system with Indian GST standards support.

**Database Schema**: Review and verify that the necessary database schemas exist for billing and accounting. If not, update the schema in `prisma/schema.prisma` to include:
- Patient billing records
- Invoice generation and tracking
- GST breakdown and calculations
- Payment processing and status
- Insurance claim management
- TPA integration
- Financial reporting and analytics
- Expense tracking
- Government subsidy scheme management
- Department-specific billing configurations
- Chart of accounts
- Journal entries
- Ledger management
- Financial reporting structures
- GST and TDS reporting

**Backend**: Implement using Next.js API routes.

**Frontend**: Create React components for billing and accounting interfaces.

1. Create patient billing system

   **Backend API Route**: `/pages/api/billing/patients/index.js`

2. Implement invoice generation with GST
   * 2.1. Design invoice templates with GST breakdown
   * 2.2. Create automatic invoice numbering system
   * 2.3. Implement digital invoice delivery via email
   * 2.4. Design WhatsApp invoice delivery with payment links
   * 2.5. Create invoice archiving and retrieval system

   **Backend API Route**: `/pages/api/billing/invoices/index.js`

3. Design payment processing workflow

   **Backend API Route**: `/pages/api/billing/payments/index.js`

4. Create insurance claim management

   **Backend API Route**: `/pages/api/billing/insurance/index.js`

5. Implement TPA (Third Party Administrator) integration

   **Backend API Route**: `/pages/api/billing/tpa/index.js`

6. Add financial reporting and analytics

   **Backend API Route**: `/pages/api/billing/reports/index.js`

7. Create expense tracking system

   **Backend API Route**: `/pages/api/billing/expenses/index.js`

8. Implement government subsidy scheme management
   * 8.1. Create subsidy scheme configuration interface
   * 8.2. Implement automatic subsidy calculation (percentage or fixed amount)
   * 8.3. Design subsidy limit tracking per patient
   * 8.4. Create subsidy status indicators (active, approaching limit, exceeded)
   * 8.5. Implement subsidy-adjusted billing with clear breakdown
   * 8.6. Add subsidy utilization reports for government reimbursement
   * 8.7. Design subsidy scheme performance analytics

   **Backend API Route**: `/pages/api/billing/subsidies/index.js`

9. Implement comprehensive department-specific billing integration
   * 9.1. OPD (Outpatient Department) billing module
     * 9.1.1. Consultation fee management
     * 9.1.2. Procedure charges integration
     * 9.1.3. Follow-up visit discounts
   * 9.2. IPD (Inpatient Department) billing module
     * 9.2.1. Room charges and bed allocation billing
     * 9.2.2. Daily care charges calculation
     * 9.2.3. Package deal management
     * 9.2.4. Advance payment handling
   * 9.3. Operation Theater billing module
     * 9.3.1. Surgery package billing
     * 9.3.2. Surgeon and anesthetist fee management
     * 9.3.3. OT consumables billing
     * 9.3.4. Equipment usage charges
   * 9.4. Emergency department billing module
     * 9.4.1. Emergency service charges
     * 9.4.2. Critical care billing
     * 9.4.3. Emergency consumables tracking
   * 9.5. Pathology department billing integration
     * 9.5.1. Test-wise billing configuration
     * 9.5.2. Test package and profile management
     * 9.5.3. Sample collection charges
   * 9.6. Radiology department billing integration
     * 9.6.1. Imaging service pricing management
     * 9.6.2. Contrast media and consumables billing
     * 9.6.3. Radiologist reporting charges
   * 9.7. Pharmacy billing integration
     * 9.7.1. Medication pricing management
     * 9.7.2. Prescription billing automation
     * 9.7.3. Return and refund processing
   * 9.8. Physiotherapy department billing
     * 9.8.1. Session-based billing
     * 9.8.2. Treatment package management
     * 9.8.3. Equipment usage charges
   * 9.9. Dental department billing
     * 9.9.1. Procedure-based billing
     * 9.9.2. Material usage charges
     * 9.9.3. Dental package management
   * 9.10. Centralized billing dashboard
     * 9.10.1. Unified patient billing view
     * 9.10.2. Department-wise revenue tracking
     * 9.10.3. Service-wise revenue analysis

   **Backend API Route**: `/pages/api/billing/departments/index.js`

10. Implement comprehensive accounting system
    * 10.1. Chart of accounts management
      * 10.1.1. Create account types (cash, bank, asset, liability, income, expense)
      * 10.1.2. Design account hierarchy and grouping
      * 10.1.3. Implement account code generation
      * 10.1.4. Add account assignment to departments
    * 10.2. Journal entry system
      * 10.2.1. Create manual journal entry interface
      * 10.2.2. Implement automatic journal entries from billing
      * 10.2.3. Design journal approval workflow
      * 10.2.4. Add journal entry reversal functionality
    * 10.3. Ledger management
      * 10.3.1. Generate general ledger
      * 10.3.2. Implement account-wise ledger
      * 10.3.3. Create department-wise ledger
      * 10.3.4. Design ledger reconciliation tools
    * 10.4. Financial reporting
      * 10.4.1. Generate day book reports
      * 10.4.2. Create cash book and bank book reports
      * 10.4.3. Implement trial balance generation
      * 10.4.4. Design profit and loss statements
      * 10.4.5. Generate balance sheet
      * 10.4.6. Create GST reports (GSTR-1, GSTR-2, GSTR-3B)
      * 10.4.7. Implement TDS reports
    * 10.5. Financial analytics
      * 10.5.1. Department-wise profitability analysis
      * 10.5.2. Cost center performance tracking
      * 10.5.3. Revenue trend analysis
      * 10.5.4. Expense categorization and analysis

    **Backend API Route**: `/pages/api/accounting/index.js`
    **Frontend Component**: `components/accounting/AccountingSystem.js`

**Expected Deliverables for Task 13:**
- Complete billing and accounting system with GST support
- Patient billing system with itemized invoices
- Invoice generation with GST breakdown
- Payment processing workflow with multiple methods
- Insurance claim management with TPA integration
- Financial reporting and analytics dashboard
- Expense tracking system with categorization
- Government subsidy scheme management
- Department-specific billing integration
- Comprehensive accounting system with ledgers
- Database schema for all billing and accounting entities
- API documentation for all billing and accounting endpoints
## Phase 4: Advanced Features Implementation

### Task 14: Ambulance Management
Implement the ambulance management system for tracking and dispatching ambulances.

**Database Schema**: Review and verify that the necessary database schemas exist for ambulance management. If not, update the schema in `prisma/schema.prisma` to include:
- Ambulance inventory and details
- Ambulance status tracking
- Dispatch request management
- Real-time location tracking
- Driver information and assignments
- Service history records
- Ambulance maintenance tracking
- Billing integration for ambulance services
- Emergency contact information

**Backend**: Implement using Next.js API routes. Use SSE for real-time ambulance location updates.

**Frontend**: Create React components for ambulance management interfaces.

1. Create ambulance inventory management

   **Backend API Route**: `/pages/api/ambulances/inventory/index.js`

2. Implement ambulance dispatch system
   * 2.1. Create dispatch request interface
   * 2.2. Implement ambulance assignment algorithm
   * 2.3. Design real-time location tracking
   * 2.4. Create WhatsApp alerts for emergency dispatch
   * 2.5. Implement ETA calculation and notifications

   **Backend API Route**: `/pages/api/ambulances/location-sse.js` (using SSE for real-time updates)

3. Design ambulance tracking interface

   **Backend API Route**: `/pages/api/ambulances/tracking/index.js`

4. Create driver assignment system

   **Backend API Route**: `/pages/api/ambulances/drivers/index.js`

5. Implement service history tracking

   **Backend API Route**: `/pages/api/ambulances/history/index.js`

6. Add billing integration for ambulance services
   * 6.1. Create distance-based billing rules
     * Implement kilometer-based pricing
     * Include zone-based flat rates
     * Add time-of-day pricing adjustments
   * 6.2. Design service-level billing
     * Create basic vs. advanced life support pricing
     * Include equipment usage charges
     * Add medical staff level pricing
   * 6.3. Implement insurance integration
     * Create insurance coverage verification
     * Include claim submission automation
     * Add patient responsibility calculation
   * 6.4. Design billing reports and analytics
     * Track revenue by service type and location
     * Include collection rate analysis
     * Add profitability metrics by route

   **Backend API Route**: `/pages/api/ambulances/billing/index.js`
   **Frontend Component**: `components/ambulances/BillingIntegration.js`

**Expected Deliverables for Task 14:**
- Complete ambulance management system with inventory tracking
- Dispatch system with assignment algorithm
- Real-time location tracking with SSE
- Driver assignment and management system
- Service history tracking and reporting
- Billing integration with hospital billing system
- WhatsApp alerts for emergency dispatch
- ETA calculation and notification system
- Database schema for all ambulance-related entities
- API documentation for all ambulance management endpoints
### Task 15: Internal Messaging System
Develop the internal messaging system using Firebase for communication between staff.

**Database Schema**: Review and verify that the necessary database schemas exist for messaging integration. If not, update the schema in `prisma/schema.prisma` to include:
- Message metadata storage (Firebase integration)
- User messaging preferences
- Message read status tracking
- File and image attachment metadata
- User status indicators
- Message threading relationships
- Department and group messaging configurations

**Backend**: Firebase handles the real-time aspects. Next.js API routes can be used for any server-side logic or data retrieval that Firebase doesn't directly handle.

**Frontend**: Create React components for messaging interfaces.

1. Set up Firebase integration

   **Backend API Route**: `/pages/api/messaging/firebase-config.js`

2. Create messaging interface

   **Frontend Component**: `components/messaging/ChatInterface.js`

3. Implement real-time notifications

   **Frontend Component**: `components/messaging/Notifications.js`

4. Design message threading and history

   **Frontend Component**: `components/messaging/MessageThread.js`

5. Create file and image sharing in messages

   **Backend API Route**: `/pages/api/messaging/file-upload.js`

6. Add user status indicators
   * 6.1. Create presence indicators (online, away, busy)
     * Implement real-time status updates
     * Include automatic status changes based on activity
     * Add custom status message support
   * 6.2. Design availability scheduling
     * Create duty hours integration
     * Include do-not-disturb scheduling
     * Add department-wide status views
   * 6.3. Implement mobile status synchronization
     * Create cross-device status consistency
     * Include mobile app status indicators
     * Add push notification controls based on status

   **Frontend Component**: `components/messaging/UserStatus.js`
   **Backend API Route**: `/pages/api/messaging/status.js`

**Expected Deliverables for Task 15:**
- Complete internal messaging system using Firebase
- Real-time chat interface with message threading
- File and image sharing capabilities
- User status indicators with presence tracking
- Message read status and delivery confirmation
- Notification system for new messages
- Department and group messaging support
- Mobile-responsive messaging interface
- Database schema for message metadata and preferences
- API documentation for messaging system endpoints
### Task 16: Attendance Management
Implement the attendance management system for tracking staff attendance.

**Database Schema**: Review and verify that the necessary database schemas exist for attendance management. If not, update the schema in `prisma/schema.prisma` to include:
- Daily attendance records
- Leave management and tracking
- Overtime tracking
- Attendance reporting structures
- Biometric data integration (ZKTeco)
- Fingerprint/face recognition logs
- Staff-biometric ID mapping
- Attendance analytics metrics
- Payroll system integration
- Department-wise attendance tracking

**Backend**: Implement using Next.js API routes.

**Frontend**: Create React components for attendance management interfaces.

1. Create daily attendance tracking interface

   **Backend API Route**: `/pages/api/attendance/daily/index.js`

2. Implement leave management system

   **Backend API Route**: `/pages/api/attendance/leave/index.js`

3. Design attendance reporting

   **Backend API Route**: `/pages/api/attendance/reports/index.js`

4. Create overtime tracking

   **Backend API Route**: `/pages/api/attendance/overtime/index.js`

5. Implement attendance analytics

   **Backend API Route**: `/pages/api/attendance/analytics/index.js`

6. Add integration with payroll system

   **Backend API Route**: `/pages/api/attendance/payroll/index.js`

7. Implement ZKTeco biometric attendance integration
   * 7.1. Set up ZKTeco device API connection
     * Create secure API authentication
     * Include device discovery and registration
     * Add connection health monitoring
   * 7.2. Create biometric enrollment interface for staff
     * Design fingerprint/face capture workflow
     * Include quality checking and verification
     * Add multi-biometric support per employee
   * 7.3. Implement real-time attendance logging from biometric devices
     * Create event listeners for authentication events
     * Include immediate database synchronization
     * Add redundancy for connection failures
   * 7.4. Design synchronization between biometric data and attendance records
     * Create mapping between biometric IDs and staff records
     * Include conflict resolution for multiple punches
     * Add data validation and error handling
   * 7.5. Create manual override for biometric attendance failures
     * Design supervisor approval workflow
     * Include reason documentation and audit trail
     * Add biometric failure tracking and reporting
   * 7.6. Implement multi-device support for different hospital locations
     * Create location-based device grouping
     * Include cross-device synchronization
     * Add location-specific rules and policies
   * 7.7. Add biometric attendance reports and analytics
     * Create comprehensive attendance dashboards
     * Include exception reports and investigations
     * Add trend analysis and pattern recognition
   * 7.8. Create detailed staff in/out reports with timestamps
     * Design time-based attendance reports
     * Include working hours calculation
     * Add overtime and undertime tracking
   * 7.9. Implement late arrival and early departure tracking
     * Create configurable grace periods
     * Include progressive disciplinary tracking
     * Add pattern analysis for habitual tardiness
   * 7.10. Design department-wise staff presence dashboard
     * Create real-time presence visualization
     * Include staffing adequacy indicators
     * Add historical comparison and trends

   **Backend API Route**: `/pages/api/attendance/biometric/index.js` (for device polling or receiving pushed data)
   **Frontend Component**: `components/attendance/BiometricIntegration.js`

**Expected Deliverables for Task 16:**
- Complete attendance management system with daily tracking
- Leave management system with approval workflow
- Overtime tracking and calculation
- Comprehensive attendance reporting
- ZKTeco biometric device integration
- Real-time attendance logging and synchronization
- Manual override system with approval workflow
- Multi-location and multi-device support
- Integration with payroll system
- Mobile attendance tracking option
- Database schema for all attendance-related entities
- API documentation for all attendance management endpoints
### Task 17: Report Generation and Export
Develop comprehensive reporting system with export capabilities.

**Database Schema**: Review and verify that the necessary database schemas exist for report generation. If not, update the schema in `prisma/schema.prisma` to include:
- Report templates and configurations
- Report generation history
- Scheduled report configurations
- Report sharing and access control
- Report visualization settings
- Custom report builder configurations
- Report export preferences
- Department-specific report templates

**Backend**: Implement using Next.js API routes for report generation.

**Frontend**: Create React components for report generation interfaces.

1. Create report templates for different departments

   **Backend API Route**: `/pages/api/reports/templates/index.js`

2. Implement PDF export functionality

   **Backend API Route**: `/pages/api/reports/export/pdf.js`

3. Design data visualization for reports

   **Frontend Component**: `components/reports/Visualizations.js`

4. Create scheduled report generation

   **Backend API Route**: `/pages/api/reports/schedule/index.js`

5. Implement report sharing and access control

   **Backend API Route**: `/pages/api/reports/sharing/index.js`

6. Add custom report builder
   * 6.1. Create drag-and-drop report designer
     * Implement field selection and placement
     * Include formatting and styling options
     * Add calculation and formula support
   * 6.2. Design report parameter system
     * Create dynamic parameter inputs
     * Include parameter validation
     * Add default value configuration
   * 6.3. Implement report preview and testing
     * Create live preview with sample data
     * Include performance testing for large datasets
     * Add error checking and validation
   * 6.4. Design report template library
     * Create template saving and categorization
     * Include template sharing and permissions
     * Add version control for templates

   **Backend API Route**: `/pages/api/reports/builder/index.js`
   **Frontend Component**: `components/reports/ReportBuilder.js`

**Expected Deliverables for Task 17:**
- Complete reporting system with template management
- PDF export functionality with customizable templates
- Interactive data visualizations for reports
- Scheduled report generation with delivery options
- Report sharing with access control
- Custom report builder with drag-and-drop interface
- Department-specific report templates
- Export options (PDF, Excel, CSV, HTML)
- Report archiving and version history
- Database schema for report configurations
- API documentation for all reporting system endpoints
## Phase 5: Integration and Enhancement

### Task 18: Payment Gateway Integration
Implement payment gateway integration for online payments.

**Database Schema**: Review and verify that the necessary database schemas exist for payment gateway integration. If not, update the schema in `prisma/schema.prisma` to include:
- Payment gateway configurations
- Payment transaction records
- Payment status tracking
- Payment receipt generation
- Payment history
- Refund processing records
- Payment method preferences
- Gateway-specific configuration storage
- Transaction error logging

**Backend**: Implement using Next.js API routes to handle payment processing with the chosen gateway.

**Frontend**: Create React components for payment interfaces.

1. Set up payment gateway configurations

   **Backend API Route**: `/pages/api/payments/config/index.js`

2. Create payment processing workflow

   **Backend API Route**: `/pages/api/payments/process/index.js`

3. Implement payment status tracking

   **Backend API Route**: `/pages/api/payments/status/index.js`

4. Design payment receipt generation

   **Backend API Route**: `/pages/api/payments/receipts/index.js`

5. Create payment history and reporting

   **Backend API Route**: `/pages/api/payments/history/index.js`

6. Add refund processing system
   * 6.1. Create refund request workflow
     * Implement request submission and validation
     * Include approval process with authorization levels
     * Add reason documentation and tracking
   * 6.2. Design partial and full refund handling
     * Create amount calculation and validation
     * Include original payment method return
     * Add alternative refund method options
   * 6.3. Implement refund status tracking
     * Create status updates and notifications
     * Include estimated processing times
     * Add integration with accounting system
   * 6.4. Design refund reporting and analytics
     * Create refund reason analysis
     * Include financial impact reporting
     * Add trend identification and monitoring

   **Backend API Route**: `/pages/api/payments/refunds/index.js`
   **Frontend Component**: `components/payments/RefundProcessing.js`

**Expected Deliverables for Task 18:**
- Complete payment gateway integration with multiple providers
- Secure payment processing workflow
- Real-time payment status tracking
- Automated receipt generation
- Comprehensive payment history and reporting
- Refund processing system with approval workflow
- Multiple payment method support
- Integration with hospital billing system
- PCI compliance implementation
- Database schema for payment-related entities
- API documentation for all payment gateway endpoints
### Task 19: SMS Gateway Integration
Implement SMS gateway integration for notifications and alerts.

**Database Schema**: Review and verify that the necessary database schemas exist for SMS gateway integration. If not, update the schema in `prisma/schema.prisma` to include:
- SMS gateway configurations (2factor, msg91)
- SMS template storage
- SMS notification history
- SMS scheduling configurations
- SMS delivery tracking
- SMS analytics and reporting metrics
- User SMS preferences
- Department-specific SMS templates
- SMS error logging

**Backend**: Implement using Next.js API routes to send SMS messages via the gateway.

**Frontend**: Create React components for SMS management interfaces.

1. Set up SMS gateway configurations (2factor, msg91)

   **Backend API Route**: `/pages/api/sms/config/index.js`

2. Create SMS template management

   **Backend API Route**: `/pages/api/sms/templates/index.js`

3. Implement automated SMS notifications

   **Backend API Route**: `/pages/api/sms/send.js`

4. Design SMS scheduling system

   **Backend API Route**: `/pages/api/sms/schedule/index.js`

5. Create SMS delivery tracking

   **Backend API Route**: `/pages/api/sms/tracking/index.js`

6. Add SMS analytics and reporting
   * 6.1. Create delivery performance metrics
     * Track delivery rates and failures
     * Include delivery time analysis
     * Add carrier performance comparison
   * 6.2. Design cost analysis and optimization
     * Create usage tracking by department
     * Include cost per message analysis
     * Add budget allocation and tracking
   * 6.3. Implement message effectiveness tracking
     * Create response rate analysis
     * Include A/B testing for message content
     * Add conversion tracking for actionable messages
   * 6.4. Design comprehensive reporting dashboard
     * Create customizable report generation
     * Include trend analysis and forecasting
     * Add export functionality for reports

   **Backend API Route**: `/pages/api/sms/analytics/index.js`
   **Frontend Component**: `components/sms/AnalyticsReporting.js`

**Expected Deliverables for Task 19:**
- Complete SMS gateway integration with multiple providers
- SMS template management system
- Automated SMS notification system
- Scheduled SMS delivery functionality
- Delivery tracking and confirmation
- Comprehensive analytics and reporting
- Integration with patient and appointment systems
- Failover mechanisms for delivery failures
- Cost optimization features
- Database schema for SMS-related entities
- API documentation for all SMS gateway endpoints
### Task 20: WhatsApp Notification System
Implement comprehensive WhatsApp notification system using third-party WhatsApp API integration.

**Database Schema**: Review and verify that the necessary database schemas exist for WhatsApp notification system. If not, update the schema in `prisma/schema.prisma` to include:
- WhatsApp Business API configuration
- WhatsApp contact management
- Template message storage and approval workflow
- Message delivery status tracking
- WhatsApp opt-in and opt-out management
- Patient notification preferences
- Staff notification preferences
- Template performance metrics
- Media message metadata
- WhatsApp notification analytics
- Integration configurations with other hospital systems

**Backend**: Implement using Next.js API routes to interact with the WhatsApp API.

**Frontend**: Create React components for WhatsApp notification management interfaces.

1. Set up WhatsApp Business API integration
   * 1.1. Configure API authentication and environment
   * 1.2. Implement WhatsApp contact management system
   * 1.3. Create WhatsApp template message approval workflow
   * 1.4. Design fallback mechanisms for failed WhatsApp messages
   * 1.5. Implement WhatsApp opt-in and opt-out management

   **Backend API Route**: `/pages/api/whatsapp/config/index.js`

2. Develop patient-facing WhatsApp notifications
   * 2.1. Create appointment reminders and confirmations
   * 2.2. Implement prescription and medication reminders
   * 2.3. Design lab test result notifications with secure document sharing
   * 2.4. Create billing and payment notifications with payment links
   * 2.5. Implement discharge instructions and follow-up reminders
   * 2.6. Design patient feedback collection via WhatsApp

   **Backend API Route**: `/pages/api/whatsapp/patient/index.js`

3. Implement staff-facing WhatsApp notifications
   * 3.1. Create emergency staff alerts and on-call notifications
   * 3.2. Implement critical patient status updates
   * 3.3. Design inventory and stock alerts
   * 3.4. Create administrative announcements and meeting reminders
   * 3.5. Implement shift change and duty roster notifications

   **Backend API Route**: `/pages/api/whatsapp/staff/index.js`

4. Develop WhatsApp template management
   * 4.1. Create template library for different notification types
   * 4.2. Implement dynamic content insertion in templates
   * 4.3. Design multilingual template support
   * 4.4. Create template performance analytics
   * 4.5. Implement A/B testing for template effectiveness
   * 4.6. Develop centralized template configuration system
     * 4.6.1. Create unified template management dashboard
     * 4.6.2. Implement database schema for template storage
     * 4.6.3. Design variable management interface for all templates
     * 4.6.4. Create template preview with variable substitution
     * 4.6.5. Implement template version control and history
   * 4.7. Create WhatsApp API configuration management
     * 4.7.1. Design API credentials storage in database with encryption
     * 4.7.2. Implement environment-specific configuration (dev/test/prod)
     * 4.7.3. Create API health monitoring and status dashboard
     * 4.7.4. Design fallback configuration for failed API calls
     * 4.7.5. Implement audit logging for all API interactions
   * 4.8. Develop template approval workflow
     * 4.8.1. Create template submission interface
     * 4.8.2. Implement approval process with role-based permissions
     * 4.8.3. Design WhatsApp Business API integration for template registration
     * 4.8.4. Create template status tracking system
     * 4.8.5. Implement template rejection handling with feedback

   **Backend API Route**: `/pages/api/whatsapp/templates/index.js`

5. Create WhatsApp media message system
   * 5.1. Implement secure document sharing (reports, prescriptions)
   * 5.2. Design image sharing for wound care instructions
   * 5.3. Create video sharing for physical therapy instructions
   * 5.4. Implement location sharing for hospital/clinic directions

   **Backend API Route**: `/pages/api/whatsapp/media/index.js`

6. Develop WhatsApp notification analytics
   * 6.1. Create delivery and read receipt tracking
   * 6.2. Implement notification effectiveness metrics
   * 6.3. Design patient engagement analytics
   * 6.4. Create department-wise notification usage reports
   * 6.5. Implement cost optimization analysis

   **Backend API Route**: `/pages/api/whatsapp/analytics/index.js`

7. Integrate WhatsApp notifications with other hospital systems
   * 7.1. Connect with appointment system for automated reminders
     * Create appointment confirmation workflows
     * Include preparation instructions delivery
     * Add follow-up appointment scheduling
   * 7.2. Integrate with billing system for payment notifications
     * Implement invoice delivery with payment links
     * Include payment confirmation messages
     * Add payment reminder escalation
   * 7.3. Connect with pharmacy for medication reminders
     * Create medication schedule notifications
     * Include refill reminders with ordering options
     * Add medication adherence tracking
   * 7.4. Integrate with lab systems for test result notifications
     * Implement secure result delivery
     * Include critical value alerts
     * Add follow-up recommendation delivery
   * 7.5. Connect with emergency response system for critical alerts
     * Create urgent notification protocols
     * Include escalation for unacknowledged alerts
     * Add emergency contact group messaging
   * 7.6. Integrate with patient education system
     * Implement condition-specific education delivery
     * Include interactive learning modules
     * Add progress tracking and quizzes

   **Backend API Route**: `/pages/api/whatsapp/integrations/index.js`
   **Frontend Component**: `components/whatsapp/SystemIntegrations.js`

**Expected Deliverables for Task 20:**
- Complete WhatsApp Business API integration
- Template message management system
- Patient-facing notification system
- Staff-facing alert system
- Media message capabilities (documents, images, videos)
- Comprehensive analytics and reporting
- Integration with all hospital systems
- Interactive message workflows
- Opt-in/opt-out management
- Message delivery tracking
- Database schema for WhatsApp-related entities
- API documentation for all WhatsApp notification endpoints
### Task 21: Multi-language Support
Implement multi-language support throughout the application.

**Database Schema**: Review and verify that the necessary database schemas exist for multi-language support. If not, update the schema in `prisma/schema.prisma` to include:
- Translation key-value storage
- Language configuration and metadata
- User language preferences
- RTL language support flags
- Translation version tracking
- Missing translation tracking
- Department-specific translation needs

**Backend**: Next.js API routes can be used to serve translated content, though the core i18n logic is often handled in the frontend.

**Frontend**: Create React components for language management interfaces.

1. Set up internationalization framework

   **Frontend Component**: `components/i18n/I18nProvider.js`

2. Create language selection interface

   **Frontend Component**: `components/i18n/LanguageSelector.js`

3. Implement text translation for all interfaces

   **Backend API Route**: `/pages/api/i18n/translations/index.js`

4. Design RTL support for applicable languages

   **Frontend Component**: `components/i18n/RtlProvider.js`

5. Create language preference persistence

   **Backend API Route**: `/pages/api/i18n/preferences/index.js`

6. Add new language addition system
   * 6.1. Create language management interface
     * Implement language addition workflow
     * Include language metadata management
     * Add activation/deactivation controls
   * 6.2. Design translation workflow
     * Create translation assignment system
     * Include progress tracking and validation
     * Add machine translation integration
   * 6.3. Implement translation import/export
     * Create standardized file format support
     * Include batch processing capabilities
     * Add version control for translations
   * 6.4. Design translation quality assurance
     * Create validation and verification tools
     * Include context-aware translation checking
     * Add community review capabilities

   **Backend API Route**: `/pages/api/i18n/languages/index.js`
   **Frontend Component**: `components/i18n/LanguageManagement.js`

**Expected Deliverables for Task 21:**
- Complete internationalization framework implementation
- Language selection interface with user preferences
- Translated interfaces for all system components
- RTL support for applicable languages
- Language preference persistence
- New language addition system
- Translation management tools
- Localized date, time, and number formats
- Multi-language reporting capabilities
- Database schema for translation storage
- API documentation for all i18n-related endpoints
### Task 22: Backup and Restore System
Implement database backup and restore functionality with automated backups.

**Database Schema**: Review and verify that the necessary database schemas exist for backup and restore system. If not, update the schema in `prisma/schema.prisma` to include:
- Backup configuration and scheduling
- Backup history and metadata
- Backup storage locations
- Restore history and logs
- Backup verification results
- Notification preferences for backup events
- Backup access control and permissions

**Backend**: Next.js API routes can be used to trigger backups and restores, or you might use separate server-side scripts/services.

**Frontend**: Create React components for backup and restore interfaces.

1. Create manual backup interface

   **Backend API Route**: `/pages/api/backup/manual/index.js`

2. Implement automated backup scheduling

   **Backend API Route**: `/pages/api/backup/schedule/index.js`

3. Design backup storage management

   **Backend API Route**: `/pages/api/backup/storage/index.js`

4. Create restore functionality

   **Backend API Route**: `/pages/api/backup/restore/index.js`

5. Implement backup verification system

   **Backend API Route**: `/pages/api/backup/verify/index.js`

6. Add backup notifications and alerts
   * 6.1. Create backup status notifications
     * Implement success/failure alerts
     * Include detailed error reporting
     * Add escalation for critical failures
   * 6.2. Design scheduled backup reports
     * Create daily/weekly backup summaries
     * Include storage utilization tracking
     * Add trend analysis for backup sizes
   * 6.3. Implement restore operation notifications
     * Create restore initiation alerts
     * Include progress updates during restore
     * Add completion status notifications
   * 6.4. Design notification delivery system
     * Create multi-channel delivery (email, SMS, dashboard)
     * Include role-based notification routing
     * Add notification acknowledgment tracking

   **Backend API Route**: `/pages/api/backup/notifications/index.js`
   **Frontend Component**: `components/backup/NotificationSystem.js`

**Expected Deliverables for Task 22:**
- Complete backup and restore system with automated scheduling
- Manual backup interface with options
- Secure backup storage management
- Comprehensive restore functionality
- Backup verification system
- Multi-level notification system
- Backup encryption implementation
- Incremental and full backup options
- Retention policy management
- Database schema for backup tracking
- API documentation for all backup and restore endpoints
## Phase 6: Testing and Deployment

### Task 23: Testing and Quality Assurance
Perform comprehensive testing of all modules and features.

**Database Schema**: Review and verify that the necessary database schemas exist for testing and quality assurance. If not, update the schema in `prisma/schema.prisma` to include:
- Test data generation configurations
- Test result storage
- Performance test metrics
- Security test results
- Test coverage reporting
- Bug tracking integration

**Backend**: Include testing of API routes, especially SSE endpoints for load and real-time performance.

**Frontend**: Create test suites for frontend components.

1. Create unit tests for critical components

   **Test Files**: `__tests__/unit/`

2. Implement integration testing for module interactions

   **Test Files**: `__tests__/integration/`

3. Design user acceptance testing plan

   **Documentation**: `docs/testing/uat-plan.md`

4. Create performance testing scenarios

   **Test Files**: `__tests__/performance/`

5. Implement security testing

   **Test Files**: `__tests__/security/`

6. Add cross-browser and responsive design testing
   * 6.1. Implement browser compatibility testing
     * Create test suites for major browsers
     * Include mobile browser testing
     * Add visual regression testing
   * 6.2. Design responsive layout testing
     * Create viewport size simulation tests
     * Include touch interaction testing
     * Add accessibility compliance checking
   * 6.3. Implement automated UI testing
     * Create Cypress or Playwright test suites
     * Include screenshot comparison tests
     * Add user flow simulations
   * 6.4. Design performance benchmarking
     * Create page load time measurements
     * Include interaction responsiveness testing
     * Add resource usage optimization

   **Test Files**: `__tests__/ui/`
   **Documentation**: `docs/testing/ui-testing.md`

**Expected Deliverables for Task 23:**
- Comprehensive test suite for all system components
- Unit tests for critical functions and components
- Integration tests for module interactions
- User acceptance testing plan and documentation
- Performance testing results and optimizations
- Security testing report with remediation
- Cross-browser and responsive design testing
- Automated testing pipeline configuration
- Test coverage reports
- Bug tracking and resolution documentation
- Testing documentation and guidelines
### Task 24: Documentation and Training Materials
Create comprehensive documentation and training materials.

**Database Schema**: Review and verify that the necessary database schemas exist for documentation and training materials. If not, update the schema in `prisma/schema.prisma` to include:
- Documentation version tracking
- Help system content storage
- User manual content management
- Video tutorial metadata
- Documentation access tracking
- User feedback on documentation
- Training material organization

**Backend**: Document all Next.js API routes, including request/response formats, authentication, and SSE event formats.

**Frontend**: Create documentation components and help system interfaces.

1. Create user manuals for each role

   **Documentation**: `docs/user-manuals/`

2. Implement in-app help system

   **Frontend Component**: `components/help/HelpSystem.js`

3. Design video tutorials for key features

   **Documentation**: `docs/tutorials/`

4. Create administrator documentation

   **Documentation**: `docs/admin/`

5. Implement API documentation

   **Documentation**: `docs/api/`

6. Add troubleshooting guides
   * 6.1. Create common issue resolution guides
     * Implement searchable issue database
     * Include step-by-step resolution procedures
     * Add visual aids and screenshots
   * 6.2. Design error message reference
     * Create comprehensive error code documentation
     * Include probable causes and solutions
     * Add severity classification
   * 6.3. Implement system diagnostics guide
     * Create self-diagnosis procedures
     * Include log analysis instructions
     * Add performance troubleshooting
   * 6.4. Design escalation procedures
     * Create support level definitions
     * Include contact information and hours
     * Add issue tracking integration

   **Documentation**: `docs/troubleshooting/`
   **Frontend Component**: `components/help/TroubleshootingGuides.js`

**Expected Deliverables for Task 24:**
- Comprehensive user manuals for all user roles
- In-app help system with contextual assistance
- Video tutorials for key features and workflows
- Administrator documentation with system management
- API documentation with examples and references
- Troubleshooting guides with common solutions
- Training materials for staff onboarding
- Quick reference guides for common tasks
- System architecture documentation
- Database schema documentation
- Deployment and maintenance documentation
### Task 25: Inventory and Equipment Management
Implement comprehensive inventory management for medical equipment and supplies.

**Database Schema**: Review and verify that the necessary database schemas exist for inventory and equipment management. If not, update the schema in `prisma/schema.prisma` to include:
- Equipment catalog and specifications
- Equipment status tracking
- Maintenance scheduling and history
- Equipment usage logs
- Equipment reservation system
- Medical gas cylinder inventory
- Cylinder usage tracking
- Inventory analytics and forecasting
- Barcode/QR code integration
- Audit and reconciliation records
- Procurement integration

**Backend**: Implement using Next.js API routes. Use SSE for real-time inventory updates.

**Frontend**: Create React components for inventory management interfaces.

1. Create operation theater equipment inventory system
   * 1.1. Design equipment catalog with specifications and status
   * 1.2. Implement equipment check-in/check-out process
   * 1.3. Create maintenance scheduling and tracking
   * 1.4. Design equipment usage history and reporting
   * 1.5. Implement equipment reservation system

   **Backend API Route**: `/pages/api/inventory/equipment/index.js`

2. Develop medical gas cylinder tracking
   * 2.1. Create cylinder inventory with type, capacity, and status
   * 2.2. Implement cylinder usage tracking and consumption rates
   * 2.3. Design low-level alerts and automatic reordering
   * 2.4. Create supplier management for gas cylinders
   * 2.5. Implement cylinder maintenance and certification tracking

   **Backend API Route**: `/pages/api/inventory/cylinders/index.js` (with SSE for real-time alerts)

3. Create inventory analytics and forecasting

   **Backend API Route**: `/pages/api/inventory/analytics/index.js`

4. Implement barcode/QR code scanning for inventory management

   **Backend API Route**: `/pages/api/inventory/scanning/index.js`

5. Design inventory audit and reconciliation tools

   **Backend API Route**: `/pages/api/inventory/audit/index.js`

6. Add integration with procurement and billing systems
   * 6.1. Create purchase requisition workflow
     * Implement requisition creation and approval
     * Include budget checking and validation
     * Add vendor selection and comparison
   * 6.2. Design purchase order management
     * Create PO generation and tracking
     * Include delivery scheduling and receiving
     * Add invoice matching and verification
   * 6.3. Implement inventory-billing linkage
     * Create automatic billing for consumed items
     * Include package pricing for procedure supplies
     * Add insurance coding for billable items
   * 6.4. Design cost center allocation
     * Create department-based usage tracking
     * Include cost distribution rules
     * Add budget impact analysis

   **Backend API Route**: `/pages/api/inventory/integrations/index.js`
   **Frontend Component**: `components/inventory/ProcurementIntegration.js`

**Expected Deliverables for Task 25:**
- Complete inventory management system for equipment and supplies
- Operation theater equipment tracking system
- Medical gas cylinder management
- Real-time inventory updates with SSE
- Barcode/QR code scanning integration
- Inventory analytics and forecasting
- Audit and reconciliation tools
- Maintenance scheduling and tracking
- Procurement system integration
- Billing system integration
- Database schema for all inventory-related entities
- API documentation for all inventory management endpoints
### Task 26: Housekeeping Management
Implement housekeeping management system for tracking cleaning and maintenance tasks.

**Database Schema**: Review and verify that the necessary database schemas exist for housekeeping management. If not, update the schema in `prisma/schema.prisma` to include:
- Cleaning task scheduling and assignments
- Task completion verification
- Quality control and inspection records
- Issue reporting and resolution tracking
- Housekeeping staff management
- Staff performance metrics
- Training and certification records
- Cleaning supplies inventory
- Room service request tracking
- Integration with patient room management

**Backend**: Implement using Next.js API routes.

**Frontend**: Create React components for housekeeping management interfaces.

1. Create housekeeping task management
   * 1.1. Design cleaning schedule creation and assignment
   * 1.2. Implement task completion verification
   * 1.3. Create quality control and inspection system
   * 1.4. Design issue reporting and resolution tracking

   **Backend API Route**: `/pages/api/housekeeping/tasks/index.js`

2. Develop housekeeping staff management
   * 2.1. Create staff assignment and rotation system
   * 2.2. Implement performance tracking and evaluation
   * 2.3. Design training and certification management

   **Backend API Route**: `/pages/api/housekeeping/staff/index.js`

3. Implement cleaning supplies inventory
   * 3.1. Create supplies catalog and stock management
   * 3.2. Design usage tracking and reordering system
   * 3.3. Implement supplier management for cleaning supplies

   **Backend API Route**: `/pages/api/housekeeping/supplies/index.js`

4. Create housekeeping analytics and reporting

   **Backend API Route**: `/pages/api/housekeeping/reports/index.js`

5. Implement mobile interface for housekeeping staff

   **Backend API Route**: `/pages/api/housekeeping/mobile/index.js`

6. Design integration with patient room management
   * 6.1. Create discharge cleaning workflow
     * Implement automatic task creation on discharge
     * Include priority-based scheduling
     * Add room readiness notification
   * 6.2. Design room preparation standards
     * Create procedure-specific preparation requirements
     * Include infection control protocols
     * Add verification checklists
   * 6.3. Implement room status tracking
     * Create real-time status updates
     * Include estimated completion times
     * Add bottleneck identification
   * 6.4. Design patient preference management
     * Create preference recording and tracking
     * Include special requests handling
     * Add satisfaction feedback collection

   **Backend API Route**: `/pages/api/housekeeping/rooms/index.js`
   **Frontend Component**: `components/housekeeping/RoomManagement.js`

**Expected Deliverables for Task 26:**
- Complete housekeeping management system
- Task scheduling and assignment system
- Quality control and inspection workflow
- Staff management and performance tracking
- Cleaning supplies inventory management
- Mobile interface for housekeeping staff
- Integration with patient room management
- Task completion verification system
- Issue reporting and resolution tracking
- Analytics and reporting dashboard
- Database schema for all housekeeping-related entities
- API documentation for all housekeeping management endpoints
### Task 27: Deployment and Go-Live Preparation
Prepare the system for deployment and go-live.

**Database Schema**: Review and verify that the necessary database schemas exist for deployment tracking. If not, update the schema in `prisma/schema.prisma` to include:
- Deployment configuration storage
- Environment-specific settings
- Data migration tracking
- Go-live checklist status
- Post-deployment monitoring metrics
- System health indicators
- Deployment history and rollback points

**Backend**: Configure server environments and deployment pipelines.

**Frontend**: Prepare frontend assets for production deployment.

1. Create deployment checklist

   **Documentation**: `docs/deployment/checklist.md`

2. Implement staging environment setup

   **Configuration**: `config/environments/staging.js`

3. Design production environment configuration

   **Configuration**: `config/environments/production.js`

4. Create data migration plan

   **Documentation**: `docs/deployment/data-migration.md`

5. Implement go-live strategy

   **Documentation**: `docs/deployment/go-live-strategy.md`

6. Add post-deployment monitoring setup
   * 6.1. Implement application performance monitoring
     * Create server and client-side monitoring
     * Include error tracking and alerting
     * Add performance metrics collection
   * 6.2. Design system health dashboard
     * Create real-time status indicators
     * Include historical performance trends
     * Add proactive alert thresholds
   * 6.3. Implement log aggregation and analysis
     * Create centralized logging system
     * Include log search and filtering
     * Add anomaly detection
   * 6.4. Design user experience monitoring
     * Create real user monitoring
     * Include user journey tracking
     * Add satisfaction measurement

   **Configuration**: `config/monitoring/index.js`
   **Frontend Component**: `components/admin/SystemMonitoring.js`

**Expected Deliverables for Task 27:**
- Complete deployment checklist and documentation
- Staging environment configuration
- Production environment configuration
- Data migration scripts and procedures
- Go-live strategy and rollback plan
- Post-deployment monitoring setup
- Performance optimization configurations
- Security hardening measures
- Backup and disaster recovery procedures
- Load testing and capacity planning
- User training schedule and materials
### Task 28: Mobile App Development
Develop mobile applications for doctors and patients using React Native.

**Database Schema**: Review and verify that the necessary database schemas exist for mobile app integration. If not, update the schema in `prisma/schema.prisma` to include:
- Mobile app user authentication
- Device registration and tracking
- Push notification tokens and preferences
- Offline data synchronization tracking
- Mobile-specific user preferences
- API access logs for mobile clients
- Mobile app version tracking
- Feature flag configurations for mobile

**Backend**: Design Next.js API routes to support the mobile app's data needs. Consider using a separate set of API routes (e.g., `/pages/api/mobile/`) or middleware to differentiate mobile app traffic.

**Frontend**: Create React Native components for mobile applications.

1. Set up React Native project with code sharing with web application

   **Configuration**: `mobile/app.json`

2. Implement authentication and authorization for mobile apps

   **Backend API Route**: `/pages/api/mobile/auth/index.js`

3. Create doctor mobile app
   * 3.1. Design dashboard with key metrics and appointments
   * 3.2. Implement patient list and search functionality
   * 3.3. Create appointment management interface
   * 3.4. Design patient medical record viewing
   * 3.5. Implement prescription creation and management
   * 3.6. Add secure messaging with staff and patients
   * 3.7. Create offline data synchronization

   **Backend API Route**: `/pages/api/mobile/doctors/index.js`

4. Develop patient mobile app
   * 4.1. Design patient dashboard with upcoming appointments
     * Create personalized patient home screen
     * Include appointment countdown timers
     * Add quick access to recent records
   * 4.2. Implement appointment booking and management
     * Create intuitive booking interface
     * Include calendar integration
     * Add reminders and notifications
   * 4.3. Create medical records access and history
     * Implement secure record viewing
     * Include lab result visualization
     * Add medication tracking
   * 4.4. Design prescription management
     * Create medication reminder system
     * Include refill request functionality
     * Add medication information access
   * 4.5. Implement telemedicine capabilities
     * Create video consultation interface
     * Include pre-appointment questionnaires
     * Add post-visit instructions access

   **Backend API Route**: `/pages/api/mobile/patients/index.js`
   **Mobile Component**: `mobile/src/screens/patient/`

**Expected Deliverables for Task 28:**
- Complete React Native mobile applications for doctors and patients
- Shared code architecture with web application
- Secure authentication and authorization
- Doctor mobile app with patient management
- Patient mobile app with appointment booking
- Offline data synchronization
- Push notification integration
- Secure messaging capabilities
- Medical record access with privacy controls
- Prescription management features
- Telemedicine integration
- Database schema for mobile-specific entities
- API documentation for all mobile app endpoints