# WowDash Components Guide

This document provides a comprehensive overview of all components available in the WowDash template and recommendations for their optimal use in creating beautiful and functional layouts.

## Table of Contents
1. [Dashboard Components](#dashboard-components)
2. [Layout Components](#layout-components)
3. [Form Components](#form-components)
4. [Table Components](#table-components)
5. [Chart Components](#chart-components)
6. [UI Elements](#ui-elements)
7. [Page Templates](#page-templates)
8. [Medical Dashboard Components](#medical-dashboard-components)
9. [Authentication Components](#authentication-components)
10. [Utility Components](#utility-components)

## Dashboard Components

### DashBoardLayerOne (AI Dashboard)
**Location**: `src/components/DashBoardLayerOne.jsx`
**Best for**: AI-focused applications, analytics dashboards
**Child Components**:
- UnitCountOne - Key metrics display
- SalesStatisticOne - Sales statistics with line chart
- TotalSubscriberOne - Subscriber metrics with bar chart
- UsersOverviewOne - User statistics with donut chart
- LatestRegisteredOne - Recently registered users
- TopPerformerOne - Top performing users/items
- TopCountries - Top countries with metrics
- GeneratedContent - Content generation statistics

### DashBoardLayerTwo (CRM Dashboard)
**Location**: `src/components/DashBoardLayerTwo.jsx`
**Best for**: Customer relationship management, sales tracking
**Child Components**:
- UnitCountTwo - Key CRM metrics
- RevenueGrowthOne - Revenue growth charts
- EarningStaticOne - Earning statistics
- CampaignStaticOne - Campaign performance
- ClientPaymentOne - Client payment information
- CountryStatusOne - Country-based statistics
- TopPerformanceOne - Top performers
- LatestPerformanceOne - Latest performance metrics
- LastTransactionOne - Recent transactions

### DashBoardLayerThree (eCommerce Dashboard)
**Location**: `src/components/DashBoardLayerThree.jsx`
**Best for**: Online stores, product management
**Child Components**:
- RevenueReportOne - Revenue reports
- CustomersStatisticsOne - Customer statistics
- RecentOrdersOne - Recent orders
- TransactionsOne - Transaction information
- RecentOrdersTwo - Alternative recent orders display
- DistributionMapsOne - Geographical distribution
- TopCustomersOne - Top customers
- TopSellingProductOne - Top selling products
- StockReportOne - Stock information

### DashBoardLayerFour (Cryptocurrency Dashboard)
**Location**: `src/components/DashBoardLayerFour.jsx`
**Best for**: Crypto tracking, financial applications
**Child Components**:
- UnitCountThree - Key crypto metrics
- CoinAnalyticsOne - Coin performance analytics
- CoinAnalyticsTwo - Alternative coin analytics
- MyOrdersOne - Crypto orders
- RecentTransactionOne - Recent crypto transactions
- MyCardsOne - Payment cards
- TotalBalanceOne - Total balance information
- UserActivatesOne - User activities

### DashBoardLayerFive (Investment Dashboard)
**Location**: `src/components/DashBoardLayerFive.jsx`
**Best for**: Investment tracking, portfolio management
**Child Components**:
- UnitCountFour - Key investment metrics
- RevenueStatisticsOne - Revenue statistics
- SalesStatisticTwo - Sales statistics
- TopCountriesTwo - Top countries for investments
- UserActivatesTwo - User investment activities
- LatestInvestmentsOne - Recent investments
- NoticeBoardOne - Notices and announcements
- TotalTransactionsOne - Transaction totals
- ProjectStatusOne - Project status information

### DashBoardLayerEight (Medical Dashboard)
**Location**: `src/components/DashBoardLayerEight.jsx`
**Best for**: Hospital management, healthcare applications
**Child Components**:
- UnitCountSix - Key medical metrics (doctors, staff, patients, pharmacy)
- EarningStatistic - Earnings statistics
- PatientVisitedDepartment - Department visits
- PatientVisitByGender - Patient gender distribution
- TopPerformanceTwo - Top performing doctors/departments
- LatestAppointmentsOne - Recent appointments
- TotalIncome - Total income metrics
- AvailableTreatments - Available treatments
- HealthReportsDocument - Health report documents

### DashBoardLayerEleven (Finance Dashboard)
**Location**: `src/components/DashBoardLayerEleven.jsx`
**Best for**: Financial management, accounting systems
**Child Components**:
- UnitCountEight - Key financial metrics
- BalanceStatistic - Balance statistics
- EarningCategories - Earning by categories
- ExpenseStatistics - Expense statistics
- PaymentHistory - Payment history
- MonthlyExpenseBreakdown - Monthly expenses
- QuickTransfer - Quick transfer functionality
- Investment - Investment information
- PaymentHistoryOne - Alternative payment history display

## Layout Components

### MasterLayout
**Location**: `src/masterLayout/MasterLayout.jsx`
**Best for**: Main application layout
**Features**:
- Responsive sidebar with toggle functionality
- Mobile menu support
- Theme toggle integration
- Navigation menu with dropdown support
- Notification system
- User profile dropdown
- Search functionality

### Breadcrumb
**Location**: `src/components/Breadcrumb.jsx`
**Best for**: Navigation hierarchy display
**Features**:
- Displays current page title
- Shows navigation path
- Links back to dashboard

## Form Components

### FormLayoutLayer
**Location**: `src/components/FormLayoutLayer.jsx`
**Best for**: Creating structured forms
**Features**:
- Various form layouts
- Responsive design
- Form validation integration

### FormValidationLayer
**Location**: `src/components/FormValidationLayer.jsx`
**Best for**: Input validation
**Features**:
- Client-side validation
- Error messaging
- Form submission handling

### AddUserLayer
**Location**: `src/components/AddUserLayer.jsx`
**Best for**: User creation forms
**Features**:
- User information fields
- Role assignment
- Profile image upload

### ImageUploadLayer
**Location**: `src/components/ImageUploadLayer.jsx`
**Best for**: File upload interfaces
**Features**:
- Drag and drop support
- Multiple file upload
- Preview functionality

## Table Components

### TableBasicLayer
**Location**: `src/components/TableBasicLayer.jsx`
**Best for**: Simple data display
**Features**:
- Basic table structure
- Responsive design
- Various styling options

### TableDataLayer
**Location**: `src/components/TableDataLayer.jsx`
**Best for**: Complex data management
**Features**:
- Sorting
- Filtering
- Pagination
- Row selection
- Data export

### UsersListLayer
**Location**: `src/components/UsersListLayer.jsx`
**Best for**: User management interfaces
**Features**:
- User information display
- Action buttons
- Status indicators
- Search functionality

### UsersGridLayer
**Location**: `src/components/UsersGridLayer.jsx`
**Best for**: Card-based user display
**Features**:
- Grid layout
- User cards
- Quick actions
- Responsive design

## Chart Components

### LineChartLayer
**Location**: `src/components/LineChartLayer.jsx`
**Best for**: Trend analysis, time series data
**Features**:
- Multiple datasets
- Customizable appearance
- Interactive tooltips

### ColumnChartLayer
**Location**: `src/components/ColumnChartLayer.jsx`
**Best for**: Comparing values across categories
**Features**:
- Single or grouped columns
- Stacked option
- Customizable colors

### PieChartLayer
**Location**: `src/components/PieChartLayer.jsx`
**Best for**: Showing proportions of a whole
**Features**:
- Donut option
- Legend support
- Interactive segments

## UI Elements

### AlertLayer
**Location**: `src/components/AlertLayer.jsx`
**Best for**: User notifications
**Features**:
- Various alert types
- Dismissible options
- Icon support

### BadgesLayer
**Location**: `src/components/BadgesLayer.jsx`
**Best for**: Status indicators
**Features**:
- Different colors
- Size options
- Position variants

### ButtonLayer
**Location**: `src/components/ButtonLayer.jsx`
**Best for**: User actions
**Features**:
- Various styles
- Size options
- Icon integration
- Loading states

### CardLayer
**Location**: `src/components/CardLayer.jsx`
**Best for**: Content containers
**Features**:
- Header and footer options
- Various styles
- Content organization

### DropdownLayer
**Location**: `src/components/DropdownLayer.jsx`
**Best for**: Selection menus
**Features**:
- Single and multi-select
- Search functionality
- Custom styling

### ModalLayer
**Location**: `src/components/NotificationLayer.jsx` (includes modal functionality)
**Best for**: Pop-up dialogs
**Features**:
- Various sizes
- Custom content
- Action buttons

### ProgressLayer
**Location**: `src/components/ProgressLayer.jsx`
**Best for**: Loading indicators
**Features**:
- Linear and circular options
- Color variants
- Label support

### TabsLayer
**Location**: `src/components/TabsLayer.jsx`
**Best for**: Content organization
**Features**:
- Horizontal and vertical options
- Custom styling
- Dynamic content loading

## Page Templates

### InvoiceListLayer
**Location**: `src/components/InvoiceListLayer.jsx`
**Best for**: Billing management
**Features**:
- Invoice listing
- Status filtering
- Search functionality
- Action buttons

### InvoiceAddLayer
**Location**: `src/components/InvoiceAddLayer.jsx`
**Best for**: Creating new invoices
**Features**:
- Form fields for invoice details
- Item addition
- Total calculation
- Save and send options

### CalendarMainLayer
**Location**: `src/components/CalendarMainLayer.jsx`
**Best for**: Scheduling interfaces
**Features**:
- Month, week, day views
- Event creation
- Drag and drop
- Event details

### ChatMessageLayer
**Location**: `src/components/ChatMessageLayer.jsx`
**Best for**: Messaging interfaces
**Features**:
- Conversation list
- Message thread
- User status
- File sharing

### EmailLayer
**Location**: `src/components/EmailLayer.jsx`
**Best for**: Email clients
**Features**:
- Inbox view
- Compose interface
- Email reading
- Attachments

## Medical Dashboard Components

### UnitCountSix
**Location**: `src/components/child/UnitCountSix.jsx`
**Best for**: Medical KPI display
**Features**:
- Doctor count with new additions
- Staff count with vacation status
- Patient count with new admissions
- Pharmacy information with medicine reserves

### LatestAppointmentsOne
**Location**: `src/components/child/LatestAppointmentsOne.jsx`
**Best for**: Appointment management
**Features**:
- Appointment type listing
- Status indicators (Completed/Canceled)
- Date information
- ID tracking

### PatientVisitedDepartment
**Location**: `src/components/child/PatientVisitedbyDepartment.jsx`
**Best for**: Department analytics
**Features**:
- Department-wise patient distribution
- Visual charts
- Trend analysis

### PatientVisitByGender
**Location**: `src/components/child/PatientVisitByGender.jsx`
**Best for**: Patient demographics
**Features**:
- Gender distribution chart
- Statistical breakdown
- Trend comparison

### TopPerformanceTwo
**Location**: `src/components/child/TopPerformanceTwo.jsx`
**Best for**: Staff performance tracking
**Features**:
- Top doctors listing
- Performance metrics
- Rating visualization

### AvailableTreatments
**Location**: `src/components/child/AvailableTreatments.jsx`
**Best for**: Treatment catalog
**Features**:
- Treatment listing
- Availability status
- Department association

### HealthReportsDocument
**Location**: `src/components/child/HealthReportsDocument.jsx`
**Best for**: Medical records
**Features**:
- Document listing
- Type categorization
- Access controls

## Authentication Components

### SignInLayer
**Location**: `src/components/SignInLayer.jsx`
**Best for**: Login pages
**Features**:
- Username/password fields
- Remember me option
- Forgot password link
- Social login options

### SignUpLayer
**Location**: `src/components/SignUpLayer.jsx`
**Best for**: Registration pages
**Features**:
- User information fields
- Terms acceptance
- Email verification
- Password strength indicator

### ForgotPasswordLayer
**Location**: `src/components/ForgotPasswordLayer.jsx`
**Best for**: Password recovery
**Features**:
- Email input
- Recovery instructions
- Reset form

### AccessDeniedLayer
**Location**: `src/components/AccessDeniedLayer.jsx`
**Best for**: Permission restriction pages
**Features**:
- Error message
- Return to safety link
- Contact support option

## Utility Components

### NotificationAlertLayer
**Location**: `src/components/NotificationAlertLayer.jsx`
**Best for**: System notifications
**Features**:
- Various alert types
- Auto-dismiss option
- Position variants

### ThemeToggleButton
**Location**: `src/helper/ThemeToggleButton.jsx`
**Best for**: Dark/light mode switching
**Features**:
- Theme persistence
- Smooth transition
- Icon indication

### WizardLayer
**Location**: `src/components/WizardLayer.jsx`
**Best for**: Multi-step processes
**Features**:
- Step progression
- Form validation per step
- Navigation controls

### StarRatingLayer
**Location**: `src/components/StarRatingLayer.jsx`
**Best for**: User feedback
**Features**:
- Interactive rating
- Read-only option
- Custom styling

## Best Practices for Component Usage

1. **Dashboard Layout**
   - Use the appropriate dashboard layer based on your application type
   - Combine unit count components at the top for key metrics
   - Place charts and graphs in the middle for visual data
   - Add tables and lists at the bottom for detailed information

2. **Form Design**
   - Group related fields together
   - Use validation for data integrity
   - Include clear submission and cancel actions
   - Provide feedback on form submission

3. **Table Implementation**
   - Use TableDataLayer for complex data management
   - Implement pagination for large datasets
   - Include search and filter options
   - Add action buttons for row-specific operations

4. **Chart Selection**
   - Use line charts for time-series data
   - Use bar/column charts for category comparisons
   - Use pie/donut charts for proportional data
   - Use area charts for cumulative values

5. **Component Customization**
   - Maintain consistent color schemes across components
   - Adapt component sizes to their container
   - Use appropriate spacing between components
   - Ensure responsive behavior on all screen sizes

6. **Medical Dashboard Optimization**
   - Place UnitCountSix at the top for key metrics
   - Use PatientVisitedDepartment and PatientVisitByGender for mid-page analytics
   - Include LatestAppointmentsOne for operational data
   - Add HealthReportsDocument for document management

7. **Authentication Flow**
   - Create a seamless journey from SignInLayer to dashboard
   - Include password recovery option
   - Implement proper validation
   - Add remember me functionality

8. **Notification System**
   - Use NotificationAlertLayer for system messages
   - Implement appropriate timing for auto-dismissal
   - Position notifications consistently
   - Use color coding for different notification types
