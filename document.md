# WowDash Next.js Theme Documentation

## 1. Project Structure

### Root Structure
- **src/app**: Contains page components organized by routes
- **src/components**: Contains reusable UI components
- **src/masterLayout**: Contains the main layout structure
- **src/helper**: Contains utility functions and helpers
- **src/hook**: Contains custom React hooks

## 2. Core Components

### MasterLayout
**Path**: `src/masterLayout/MasterLayout.jsx`

**Description**: The main layout component that wraps all pages. It provides the sidebar, header, and footer structure.

**Features**:
- Responsive sidebar with toggle functionality
- Mobile menu support
- Theme toggle integration
- Navigation menu with dropdown support
- Notification system
- User profile dropdown
- Search functionality

### RootLayout
**Path**: `src/app/layout.jsx`

**Description**: The root layout component that initializes the application.

**Features**:
- Imports global CSS styles
- Initializes plugins via PluginInit
- Sets up metadata for SEO

### PluginInit
**Path**: `src/helper/PluginInit.js`

**Description**: Client-side component that initializes external libraries and plugins.

**Features**:
- Loads Bootstrap bundle
- Initializes React Quill
- Loads JSVectorMap CSS
- Loads React Toastify
- Loads Modal Video CSS

## 3. Dashboard Components

### DashBoardLayerOne (AI Dashboard)
**Path**: `src/components/DashBoardLayerOne.jsx`

**Description**: Main dashboard component for the AI-themed dashboard.

**Child Components**:
- **UnitCountOne**: Displays key metrics in card format (Total Users, Total Subscription, Total Revenue, Total Expense)
- **SalesStatisticOne**: Shows sales statistics with line chart
- **TotalSubscriberOne**: Displays subscriber metrics with bar chart
- **UsersOverviewOne**: Shows user statistics with donut chart
- **LatestRegisteredOne**: Displays recently registered users
- **TopPerformerOne**: Shows top performing users/items
- **TopCountries**: Displays top countries with metrics
- **GeneratedContent**: Shows content generation statistics with bar chart

### DashBoardLayerTwo (CRM Dashboard)
**Path**: `src/components/DashBoardLayerTwo.jsx`

**Description**: Dashboard component for CRM functionality.

**Child Components**:
- **UnitCountTwo**: Displays key CRM metrics
- **RevenueGrowthOne**: Shows revenue growth charts
- **EarningStaticOne**: Displays earning statistics
- **CampaignStaticOne**: Shows campaign performance
- **ClientPaymentOne**: Displays client payment information
- **CountryStatusOne**: Shows country-based statistics
- **TopPerformanceOne**: Displays top performers
- **LatestPerformanceOne**: Shows latest performance metrics
- **LastTransactionOne**: Displays recent transactions

### DashBoardLayerThree (eCommerce Dashboard)
**Path**: `src/components/DashBoardLayerThree.jsx`

**Description**: Dashboard for eCommerce functionality.

**Child Components**:
- **RevenueReportOne**: Shows revenue reports
- **CustomersStatisticsOne**: Displays customer statistics
- **RecentOrdersOne**: Shows recent orders
- **TransactionsOne**: Displays transaction information
- **RecentOrdersTwo**: Alternative recent orders display
- **DistributionMapsOne**: Shows geographical distribution
- **TopCustomersOne**: Displays top customers
- **TopSellingProductOne**: Shows top selling products
- **StockReportOne**: Displays stock information

### DashBoardLayerFour (Cryptocurrency Dashboard)
**Path**: `src/components/DashBoardLayerFour.jsx`

**Description**: Dashboard for cryptocurrency tracking and management.

**Child Components**:
- **UnitCountThree**: Displays key crypto metrics
- **CoinAnalyticsOne**: Shows coin performance analytics
- **CoinAnalyticsTwo**: Alternative coin analytics
- **MyOrdersOne**: Displays crypto orders
- **RecentTransactionOne**: Shows recent crypto transactions
- **MyCardsOne**: Displays payment cards
- **TotalBalanceOne**: Shows total balance information
- **UserActivatesOne**: Displays user activities

### DashBoardLayerFive (Investment Dashboard)
**Path**: `src/components/DashBoardLayerFive.jsx`

**Description**: Dashboard for investment tracking and management.

**Child Components**:
- **UnitCountFour**: Displays key investment metrics
- **RevenueStatisticsOne**: Shows revenue statistics
- **SalesStatisticTwo**: Displays sales statistics
- **TopCountriesTwo**: Shows top countries for investments
- **UserActivatesTwo**: Displays user investment activities
- **LatestInvestmentsOne**: Shows recent investments
- **NoticeBoardOne**: Displays notices and announcements
- **TotalTransactionsOne**: Shows transaction totals
- **ProjectStatusOne**: Displays project status information

### DashBoardLayerSeven (NFT & Gaming Dashboard)
**Path**: `src/components/DashBoardLayerSeven.jsx`

**Description**: Dashboard for NFT and gaming metrics.

**Child Components**:
- **BannerInnerOne**: Displays featured NFT banner
- **TrendingBidsOne**: Shows trending bids
- **TrendingNFTsOne**: Displays trending NFTs
- **RecentBidOne**: Shows recent bids
- **ETHPriceOne**: Displays Ethereum price
- **StatisticsOne**: Shows NFT statistics
- **FeaturedCreatorsOne**: Displays featured creators
- **FeaturedCreatorsTwo**: Alternative featured creators display

### DashBoardLayerEight (Medical Dashboard)
**Path**: `src/components/DashBoardLayerEight.jsx`

**Description**: Dashboard for medical and healthcare metrics.

**Child Components**:
- **UnitCountSix**: Displays key medical metrics
- **EarningStatistic**: Shows earnings statistics
- **PatientVisitedDepartment**: Displays department visits
- **PatientVisitByGender**: Shows patient gender distribution
- **TopPerformanceTwo**: Displays top performing doctors/departments
- **LatestAppointmentsOne**: Shows recent appointments
- **TotalIncome**: Displays total income metrics
- **AvailableTreatments**: Shows available treatments
- **HealthReportsDocument**: Displays health report documents

### DashBoardLayerEleven (Finance Dashboard)
**Path**: `src/components/DashBoardLayerEleven.jsx`

**Description**: Dashboard for financial metrics and management.

**Child Components**:
- **UnitCountEight**: Displays key financial metrics
- **BalanceStatistic**: Shows balance statistics
- **EarningCategories**: Displays earning by categories
- **ExpenseStatistics**: Shows expense statistics
- **PaymentHistory**: Displays payment history
- **MonthlyExpenseBreakdown**: Shows monthly expenses
- **QuickTransfer**: Provides quick transfer functionality
- **Investment**: Displays investment information
- **PaymentHistoryOne**: Alternative payment history display

## 4. UI Components

### Breadcrumb
**Path**: `src/components/Breadcrumb.jsx`

**Description**: Navigation breadcrumb component that shows the current page location.

**Features**:
- Displays current page title
- Shows navigation path
- Links back to dashboard

### ThemeToggleButton
**Path**: `src/helper/ThemeToggleButton.jsx`

**Description**: Button component that toggles between light and dark themes.

**Features**:
- Persists theme preference in localStorage
- Updates HTML element data-theme attribute
- Handles client-side rendering safely

### Chart Components
**Path**: Various under `src/components/child/`

**Description**: Various chart components using ApexCharts.

**Types**:
- **LineCharts**: DefaultLineChart, ZoomAbleLineChart, StepLineChart, etc.
- **BarCharts**: Used in various dashboard components
- **PieCharts**: BasicPieChart, DonutChart, etc.
- **AreaCharts**: Used for time series data

### Button Components
**Path**: `src/components/ButtonLayer.jsx` and child components

**Description**: Various button style components.

**Types**:
- **DefaultButtons**: Standard button styles
- **OutlineButtons**: Buttons with outline styles
- **RoundedButtons**: Buttons with rounded corners
- **SoftButtons**: Buttons with soft/subtle styling
- **TextButtons**: Text-only buttons
- **ButtonsWithLabel**: Buttons with additional labels
- **ButtonsSizes**: Buttons in different sizes
- **CheckboxRadioButtons**: Toggle-style buttons
- **ButtonsGroup**: Button group components

### Form Components
**Path**: Various under `src/components/`

**Description**: Form-related components for input and data collection.

**Types**:
- Input fields
- Select dropdowns
- Checkboxes and radio buttons
- Form layouts
- Validation components

### Table Components
**Path**: Various under `src/components/`

**Description**: Table components for data display.

**Features**:
- Sortable columns
- Pagination
- Search functionality
- Row actions

## 5. Utility Components and Hooks

### useReactApexChart
**Path**: `src/hook/useReactApexChart.js`

**Description**: Custom hook that provides chart configurations for ApexCharts.

**Features**:
- Provides series data for charts
- Configures chart options (colors, animations, tooltips)
- Creates different chart types (line, bar, area, donut)
- Handles responsive configurations

### MobileMenuToggle
**Path**: `src/helper/MobileMenuToggle.jsx`

**Description**: Component that handles mobile menu toggling.

**Features**:
- Toggles sidebar visibility on mobile
- Manages overlay state
- Handles click events

## 6. Page Components

**Description**: Each page in the `src/app` directory represents a route in the application.

**Common Structure**:
- Imports MasterLayout
- Imports Breadcrumb with appropriate title
- Imports specific component layer
- Sets metadata for SEO
- Returns components wrapped in MasterLayout

**Examples**:
- **Dashboard Pages**: index.jsx, index-2, index-3, etc.
- **Component Pages**: buttons, badges, cards, etc.
- **App Pages**: calendar-main, email, etc.

## 7. Styling

**Description**: The theme uses a combination of Bootstrap 5 and custom CSS.

**Key Files**:
- `src/app/globals.css`: Imports all CSS dependencies
- `src/app/font.css`: Handles font imports
- `public/assets/css/`: Contains various CSS files for components and utilities

**Features**:
- Responsive design with Bootstrap grid
- Custom utility classes for spacing, colors, and typography
- Dark/light theme support
- Custom component styling

## 8. Theme Configuration

**Path**: `src/components/ThemeLayer.jsx`

**Description**: Component for theme customization settings.

**Features**:
- Logo upload and preview
- Color scheme selection
- Layout options
- Typography settings

## 9. Chart Implementation

**Description**: Charts are implemented using ApexCharts with React integration.

**Key Features**:
- Dynamic data loading
- Responsive sizing
- Custom styling
- Interactive elements (tooltips, zooming)
- Various chart types (line, bar, area, pie, donut)

**Implementation Pattern**:
1. Import the useReactApexChart hook
2. Dynamically import ReactApexChart with SSR disabled
3. Get chart options and series from the hook
4. Render the chart with appropriate configuration

## 10. Responsive Design

**Description**: The theme is fully responsive with support for various screen sizes.

**Key Features**:
- Mobile-first approach
- Collapsible sidebar
- Responsive grid system
- Adaptive component layouts
- Touch-friendly UI elements

## Conclusion

The WowDash Next.js theme is a comprehensive admin dashboard template with multiple dashboard variations for different use cases. It features a modular component structure, responsive design, and extensive UI components. The theme leverages modern React patterns with Next.js for optimal performance and developer experience.
