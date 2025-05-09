# Pharmacy Management System

## Overview

The Pharmacy Management System is a comprehensive solution for managing pharmacy operations within the hospital management system. It provides functionality for managing medicines, inventory, prescriptions, suppliers, purchase orders, billing, and real-time alerts.

## Features

### 1. Inventory Management
- Track medicine stock levels in real-time
- Manage medicine batches with expiry dates
- Automatic low stock alerts
- Batch expiry notifications
- Stock adjustment functionality

### 2. Prescription Management
- View and process patient prescriptions
- Dispense medications with batch tracking
- Verify prescription validity
- Track prescription history
- Manage recurring prescriptions

### 3. Supplier Management
- Maintain supplier database
- Track supplier performance
- Manage supplier contracts
- View supplier history

### 4. Purchase Order Management
- Create and manage purchase orders
- Track order status
- Receive and verify deliveries
- Automatic stock updates on receipt
- Order history and reporting

### 5. Billing Integration
- Generate bills for dispensed medications
- Process payments
- Integration with hospital billing system
- Discount and tax management
- Payment history tracking

### 6. Real-time Updates
- Server-Sent Events (SSE) for live inventory updates
- Real-time notifications for critical events
- Live dashboard updates

### 7. Analytics and Reporting
- Consumption trends
- Inventory valuation
- Expiry forecasting
- Sales analysis
- Supplier performance metrics

## Technical Implementation

### Components
- **PrescriptionManagement**: Handles prescription workflow
- **SupplierManagement**: Interface for supplier CRUD operations
- **PurchaseOrderManagement**: Handles purchase order lifecycle
- **PharmacyAnalytics**: Dashboard for analytics and reporting
- **PharmacyBilling**: Manages billing and payment processing
- **StockAlerts**: Manages stock alerts and notifications
- **RealTimeInventory**: Provides real-time inventory updates

### API Endpoints
- `/api/pharmacy/medicines`: Medicine management
- `/api/pharmacy/batches`: Batch management
- `/api/pharmacy/inventory`: Inventory management
- `/api/pharmacy/prescriptions`: Prescription management
- `/api/pharmacy/suppliers`: Supplier management
- `/api/pharmacy/purchase-orders`: Purchase order management
- `/api/pharmacy/alerts`: Alert management
- `/api/pharmacy/billing`: Billing management
- `/api/pharmacy/inventory/sse`: Real-time inventory updates

### Database Models
- `Medicine`: Medicine information
- `MedicineBatch`: Batch information with expiry dates
- `PharmacyInventory`: Current stock levels
- `InventoryTransaction`: Stock movement records
- `Supplier`: Supplier information
- `PurchaseOrder`: Purchase order details
- `PurchaseOrderItem`: Items in purchase orders
- `PharmacyAlert`: System alerts
- `PharmacyBill`: Billing information
- `PharmacyPayment`: Payment records

## User Permissions

The system implements role-based access control:
- **Pharmacist**: Full access to all pharmacy features
- **Pharmacy Technician**: Limited access to dispensing and inventory
- **Doctor**: Access to prescribe medications
- **Admin**: Full system access
- **Billing Staff**: Access to billing features

## Getting Started

1. Navigate to the Pharmacy Dashboard
2. Use the tabs to access different modules:
   - Inventory
   - Prescriptions
   - Suppliers
   - Purchase Orders
   - Billing
   - Analytics
   - Alerts

## Best Practices

1. **Inventory Management**:
   - Regularly check for low stock alerts
   - Process expired medications promptly
   - Conduct periodic physical inventory counts

2. **Prescription Dispensing**:
   - Always verify patient information
   - Check for drug interactions
   - Follow the First Expiry, First Out (FEFO) principle

3. **Purchase Orders**:
   - Create purchase orders based on reorder points
   - Verify received goods against purchase orders
   - Document any discrepancies

4. **Billing**:
   - Verify insurance information when applicable
   - Document all transactions
   - Process refunds according to policy

## Troubleshooting

### Common Issues

1. **Real-time updates not working**:
   - Check browser compatibility with SSE
   - Verify network connection
   - Restart the browser session

2. **Inventory discrepancies**:
   - Review recent transactions
   - Check for pending purchase orders
   - Conduct a physical count

3. **Billing errors**:
   - Verify price configurations
   - Check tax and discount calculations
   - Review payment processing settings

## Support

For technical support, please contact the IT department or refer to the system administrator.

## API Documentation

For detailed API documentation, refer to the [Pharmacy API Documentation](./pharmacy-api.md).
