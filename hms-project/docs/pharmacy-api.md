# Pharmacy Management System API Documentation

This document provides comprehensive documentation for the Pharmacy Management System API endpoints.

## Table of Contents

1. [Authentication](#authentication)
2. [Medicines](#medicines)
3. [Batches](#batches)
4. [Inventory](#inventory)
5. [Prescriptions](#prescriptions)
6. [Suppliers](#suppliers)
7. [Purchase Orders](#purchase-orders)
8. [Alerts](#alerts)
9. [Billing](#billing)
10. [Real-time Updates](#real-time-updates)

## Authentication

All API endpoints require authentication using NextAuth. Include a valid session token in your requests.

## Medicines

### Get Medicines

Retrieves a list of medicines with optional filtering.

- **URL**: `/api/pharmacy/medicines`
- **Method**: `GET`
- **Query Parameters**:
  - `search`: Search term for medicine name or generic name
  - `category`: Filter by medicine category
  - `prescriptionRequired`: Filter by prescription requirement (true/false)
- **Response**:
  ```json
  {
    "medicines": [
      {
        "id": "string",
        "name": "string",
        "genericName": "string",
        "brandName": "string",
        "manufacturer": "string",
        "description": "string",
        "dosageForm": "string",
        "strength": "string",
        "prescriptionRequired": "boolean",
        "code": "string",
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
  }
  ```

### Create Medicine

Creates a new medicine.

- **URL**: `/api/pharmacy/medicines`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "name": "string",
    "genericName": "string",
    "brandName": "string",
    "manufacturer": "string",
    "description": "string",
    "dosageForm": "string",
    "strength": "string",
    "prescriptionRequired": "boolean",
    "code": "string"
  }
  ```
- **Response**:
  ```json
  {
    "medicine": {
      "id": "string",
      "name": "string",
      "genericName": "string",
      "brandName": "string",
      "manufacturer": "string",
      "description": "string",
      "dosageForm": "string",
      "strength": "string",
      "prescriptionRequired": "boolean",
      "code": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### Get Medicine by ID

Retrieves a specific medicine by ID.

- **URL**: `/api/pharmacy/medicines/{id}`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "medicine": {
      "id": "string",
      "name": "string",
      "genericName": "string",
      "brandName": "string",
      "manufacturer": "string",
      "description": "string",
      "dosageForm": "string",
      "strength": "string",
      "prescriptionRequired": "boolean",
      "code": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### Update Medicine

Updates an existing medicine.

- **URL**: `/api/pharmacy/medicines/{id}`
- **Method**: `PATCH`
- **Request Body**:
  ```json
  {
    "name": "string",
    "genericName": "string",
    "brandName": "string",
    "manufacturer": "string",
    "description": "string",
    "dosageForm": "string",
    "strength": "string",
    "prescriptionRequired": "boolean",
    "code": "string"
  }
  ```
- **Response**:
  ```json
  {
    "medicine": {
      "id": "string",
      "name": "string",
      "genericName": "string",
      "brandName": "string",
      "manufacturer": "string",
      "description": "string",
      "dosageForm": "string",
      "strength": "string",
      "prescriptionRequired": "boolean",
      "code": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

## Batches

### Get Batches

Retrieves a list of medicine batches with optional filtering.

- **URL**: `/api/pharmacy/batches`
- **Method**: `GET`
- **Query Parameters**:
  - `medicineId`: Filter by medicine ID
  - `status`: Filter by batch status (AVAILABLE, EXPIRED, etc.)
- **Response**:
  ```json
  {
    "batches": [
      {
        "id": "string",
        "medicineId": "string",
        "batchNumber": "string",
        "expiryDate": "date",
        "quantity": "number",
        "unitPrice": "number",
        "medicine": {
          "id": "string",
          "name": "string"
        },
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
  }
  ```

### Create Batch

Creates a new medicine batch.

- **URL**: `/api/pharmacy/batches`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "medicineId": "string",
    "batchNumber": "string",
    "expiryDate": "date",
    "quantity": "number",
    "unitPrice": "number"
  }
  ```
- **Response**:
  ```json
  {
    "batch": {
      "id": "string",
      "medicineId": "string",
      "batchNumber": "string",
      "expiryDate": "date",
      "quantity": "number",
      "unitPrice": "number",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

## Inventory

### Get Inventory

Retrieves the current inventory status.

- **URL**: `/api/pharmacy/inventory`
- **Method**: `GET`
- **Query Parameters**:
  - `status`: Filter by inventory status (LOW, NORMAL, OVERSTOCK)
- **Response**:
  ```json
  {
    "inventory": [
      {
        "id": "string",
        "medicineId": "string",
        "medicine": {
          "id": "string",
          "name": "string"
        },
        "currentStock": "number",
        "minimumStock": "number",
        "maximumStock": "number",
        "lastUpdated": "date"
      }
    ]
  }
  ```

### Adjust Inventory

Adjusts the inventory for a specific medicine.

- **URL**: `/api/pharmacy/inventory`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "medicineId": "string",
    "batchId": "string",
    "type": "ADDITION | REDUCTION | ADJUSTMENT",
    "quantity": "number",
    "reason": "string",
    "notes": "string"
  }
  ```
- **Response**:
  ```json
  {
    "transaction": {
      "id": "string",
      "medicineId": "string",
      "batchId": "string",
      "type": "string",
      "quantity": "number",
      "balanceBefore": "number",
      "balanceAfter": "number",
      "reference": "string",
      "performedBy": "string",
      "createdAt": "date"
    },
    "inventory": {
      "id": "string",
      "medicineId": "string",
      "currentStock": "number",
      "lastUpdated": "date"
    }
  }
  ```

### Real-time Inventory Updates (SSE)

Provides real-time updates for inventory changes.

- **URL**: `/api/pharmacy/inventory/sse`
- **Method**: `GET`
- **Response**: Server-Sent Events (SSE) stream with the following event types:
  - `connected`: Initial connection established
  - `inventory-update`: Inventory transaction occurred
  - `stock-alert`: Low stock or out-of-stock alert
  - `batch-expiry`: Batch expiry alert

## Prescriptions

### Get Prescriptions

Retrieves a list of prescriptions with optional filtering.

- **URL**: `/api/pharmacy/prescriptions`
- **Method**: `GET`
- **Query Parameters**:
  - `status`: Filter by prescription status (ACTIVE, COMPLETED, CANCELLED, EXPIRED)
  - `patientId`: Filter by patient ID
- **Response**:
  ```json
  {
    "prescriptions": [
      {
        "id": "string",
        "prescriptionNumber": "string",
        "patientId": "string",
        "doctorId": "string",
        "prescribedDate": "date",
        "startDate": "date",
        "endDate": "date",
        "status": "string",
        "instructions": "string",
        "patient": {
          "id": "string",
          "user": {
            "name": "string"
          }
        },
        "doctor": {
          "id": "string",
          "user": {
            "name": "string"
          }
        },
        "medications": [
          {
            "id": "string",
            "medicationId": "string",
            "medication": {
              "id": "string",
              "name": "string"
            },
            "dosage": "string",
            "frequency": "string",
            "route": "string",
            "quantity": "number",
            "instructions": "string"
          }
        ],
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
  }
  ```

### Dispense Medication

Dispenses medication for a prescription.

- **URL**: `/api/pharmacy/prescriptions/dispense`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "prescriptionId": "string",
    "medications": [
      {
        "medicationId": "string",
        "batchId": "string",
        "quantity": "number",
        "unitPrice": "number",
        "discount": "number",
        "tax": "number"
      }
    ],
    "createSale": "boolean",
    "paymentMethod": "string",
    "paymentStatus": "string",
    "updatePrescriptionStatus": "boolean",
    "prescriptionStatus": "string",
    "notes": "string"
  }
  ```
- **Response**:
  ```json
  {
    "dispensation": {
      "id": "string",
      "prescriptionId": "string",
      "dispensedBy": "string",
      "dispensedAt": "date",
      "items": [
        {
          "id": "string",
          "medicationId": "string",
          "batchId": "string",
          "quantity": "number",
          "unitPrice": "number"
        }
      ]
    },
    "sale": {
      "id": "string",
      "billNumber": "string",
      "totalAmount": "number",
      "paymentStatus": "string"
    },
    "prescription": {
      "id": "string",
      "status": "string"
    }
  }
  ```

## Suppliers

### Get Suppliers

Retrieves a list of suppliers with optional filtering.

- **URL**: `/api/pharmacy/suppliers`
- **Method**: `GET`
- **Query Parameters**:
  - `status`: Filter by supplier status (ACTIVE, INACTIVE, BLACKLISTED)
- **Response**:
  ```json
  {
    "suppliers": [
      {
        "id": "string",
        "name": "string",
        "contactPerson": "string",
        "email": "string",
        "phone": "string",
        "address": "string",
        "city": "string",
        "state": "string",
        "country": "string",
        "postalCode": "string",
        "taxId": "string",
        "registrationNo": "string",
        "status": "string",
        "notes": "string",
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
  }
  ```

### Create Supplier

Creates a new supplier.

- **URL**: `/api/pharmacy/suppliers`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "name": "string",
    "contactPerson": "string",
    "email": "string",
    "phone": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postalCode": "string",
    "taxId": "string",
    "registrationNo": "string",
    "status": "string",
    "notes": "string"
  }
  ```
- **Response**:
  ```json
  {
    "supplier": {
      "id": "string",
      "name": "string",
      "contactPerson": "string",
      "email": "string",
      "phone": "string",
      "address": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postalCode": "string",
      "taxId": "string",
      "registrationNo": "string",
      "status": "string",
      "notes": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### Update Supplier

Updates an existing supplier.

- **URL**: `/api/pharmacy/suppliers/{id}`
- **Method**: `PATCH`
- **Request Body**:
  ```json
  {
    "name": "string",
    "contactPerson": "string",
    "email": "string",
    "phone": "string",
    "address": "string",
    "city": "string",
    "state": "string",
    "country": "string",
    "postalCode": "string",
    "taxId": "string",
    "registrationNo": "string",
    "status": "string",
    "notes": "string"
  }
  ```
- **Response**:
  ```json
  {
    "supplier": {
      "id": "string",
      "name": "string",
      "contactPerson": "string",
      "email": "string",
      "phone": "string",
      "address": "string",
      "city": "string",
      "state": "string",
      "country": "string",
      "postalCode": "string",
      "taxId": "string",
      "registrationNo": "string",
      "status": "string",
      "notes": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

## Purchase Orders

### Get Purchase Orders

Retrieves a list of purchase orders with optional filtering.

- **URL**: `/api/pharmacy/purchase-orders`
- **Method**: `GET`
- **Query Parameters**:
  - `status`: Filter by purchase order status (PENDING, APPROVED, ORDERED, RECEIVED, CANCELLED)
  - `supplierId`: Filter by supplier ID
- **Response**:
  ```json
  {
    "purchaseOrders": [
      {
        "id": "string",
        "orderNumber": "string",
        "supplierId": "string",
        "supplier": {
          "id": "string",
          "name": "string"
        },
        "orderDate": "date",
        "expectedDeliveryDate": "date",
        "status": "string",
        "totalAmount": "number",
        "notes": "string",
        "items": [
          {
            "id": "string",
            "medicineId": "string",
            "medicine": {
              "id": "string",
              "name": "string"
            },
            "quantity": "number",
            "unitPrice": "number",
            "discount": "number",
            "tax": "number",
            "total": "number"
          }
        ],
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
  }
  ```

### Create Purchase Order

Creates a new purchase order.

- **URL**: `/api/pharmacy/purchase-orders`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "supplierId": "string",
    "expectedDeliveryDate": "date",
    "notes": "string",
    "items": [
      {
        "medicineId": "string",
        "quantity": "number",
        "unitPrice": "number",
        "discount": "number",
        "tax": "number"
      }
    ],
    "totalAmount": "number"
  }
  ```
- **Response**:
  ```json
  {
    "purchaseOrder": {
      "id": "string",
      "orderNumber": "string",
      "supplierId": "string",
      "orderDate": "date",
      "expectedDeliveryDate": "date",
      "status": "string",
      "totalAmount": "number",
      "notes": "string",
      "items": [
        {
          "id": "string",
          "medicineId": "string",
          "quantity": "number",
          "unitPrice": "number",
          "discount": "number",
          "tax": "number",
          "total": "number"
        }
      ],
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### Update Purchase Order Status

Updates the status of a purchase order.

- **URL**: `/api/pharmacy/purchase-orders/{id}/status`
- **Method**: `PATCH`
- **Request Body**:
  ```json
  {
    "status": "string",
    "notes": "string"
  }
  ```
- **Response**:
  ```json
  {
    "purchaseOrder": {
      "id": "string",
      "status": "string",
      "updatedAt": "date"
    }
  }
  ```

## Alerts

### Get Alerts

Retrieves a list of pharmacy alerts with optional filtering.

- **URL**: `/api/pharmacy/alerts`
- **Method**: `GET`
- **Query Parameters**:
  - `type`: Filter by alert type (LOW_STOCK, EXPIRY, STOCK_OUT)
  - `status`: Filter by alert status (ACTIVE, RESOLVED, DISMISSED)
- **Response**:
  ```json
  {
    "alerts": [
      {
        "id": "string",
        "type": "string",
        "message": "string",
        "status": "string",
        "medicineId": "string",
        "medicine": {
          "id": "string",
          "name": "string"
        },
        "batchId": "string",
        "batch": {
          "id": "string",
          "batchNumber": "string",
          "expiryDate": "date"
        },
        "createdAt": "date",
        "createdBy": "string",
        "resolvedAt": "date",
        "resolvedBy": "string",
        "notes": "string"
      }
    ]
  }
  ```

### Create Alert

Creates a new pharmacy alert.

- **URL**: `/api/pharmacy/alerts`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "type": "string",
    "message": "string",
    "medicineId": "string",
    "batchId": "string"
  }
  ```
- **Response**:
  ```json
  {
    "alert": {
      "id": "string",
      "type": "string",
      "message": "string",
      "status": "string",
      "medicineId": "string",
      "batchId": "string",
      "createdAt": "date",
      "createdBy": "string"
    }
  }
  ```

### Resolve Alert

Resolves an existing alert.

- **URL**: `/api/pharmacy/alerts/{id}/resolve`
- **Method**: `PATCH`
- **Request Body**:
  ```json
  {
    "notes": "string"
  }
  ```
- **Response**:
  ```json
  {
    "alert": {
      "id": "string",
      "status": "string",
      "resolvedAt": "date",
      "resolvedBy": "string",
      "notes": "string"
    }
  }
  ```

### Get Notification Settings

Retrieves the user's notification settings.

- **URL**: `/api/pharmacy/alerts/settings`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "settings": {
      "lowStockThreshold": "number",
      "expiryWarningDays": "number",
      "emailNotifications": "boolean",
      "inAppNotifications": "boolean",
      "dailyDigest": "boolean"
    }
  }
  ```

### Update Notification Settings

Updates the user's notification settings.

- **URL**: `/api/pharmacy/alerts/settings`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "lowStockThreshold": "number",
    "expiryWarningDays": "number",
    "emailNotifications": "boolean",
    "inAppNotifications": "boolean",
    "dailyDigest": "boolean"
  }
  ```
- **Response**:
  ```json
  {
    "settings": {
      "lowStockThreshold": "number",
      "expiryWarningDays": "number",
      "emailNotifications": "boolean",
      "inAppNotifications": "boolean",
      "dailyDigest": "boolean"
    }
  }
  ```

## Billing

### Get Bills

Retrieves a list of pharmacy bills with optional filtering.

- **URL**: `/api/pharmacy/billing`
- **Method**: `GET`
- **Query Parameters**:
  - `status`: Filter by payment status (PENDING, PARTIAL, PAID)
  - `patientId`: Filter by patient ID
- **Response**:
  ```json
  {
    "bills": [
      {
        "id": "string",
        "billNumber": "string",
        "patientId": "string",
        "patient": {
          "id": "string",
          "user": {
            "name": "string"
          }
        },
        "prescriptionId": "string",
        "billDate": "date",
        "subtotal": "number",
        "discount": "number",
        "tax": "number",
        "totalAmount": "number",
        "paidAmount": "number",
        "paymentStatus": "string",
        "generatedBy": "string",
        "notes": "string",
        "items": [
          {
            "id": "string",
            "medicineId": "string",
            "medicine": {
              "id": "string",
              "name": "string"
            },
            "batchId": "string",
            "batch": {
              "id": "string",
              "batchNumber": "string"
            },
            "quantity": "number",
            "unitPrice": "number",
            "discount": "number",
            "tax": "number",
            "total": "number"
          }
        ],
        "payments": [
          {
            "id": "string",
            "amount": "number",
            "paymentMethod": "string",
            "paymentDate": "date",
            "reference": "string"
          }
        ],
        "createdAt": "date",
        "updatedAt": "date"
      }
    ]
  }
  ```

### Create Bill

Creates a new pharmacy bill.

- **URL**: `/api/pharmacy/billing`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "patientId": "string",
    "prescriptionId": "string",
    "items": [
      {
        "medicineId": "string",
        "batchId": "string",
        "quantity": "number",
        "unitPrice": "number",
        "discount": "number",
        "tax": "number"
      }
    ],
    "notes": "string"
  }
  ```
- **Response**:
  ```json
  {
    "bill": {
      "id": "string",
      "billNumber": "string",
      "patientId": "string",
      "prescriptionId": "string",
      "billDate": "date",
      "subtotal": "number",
      "discount": "number",
      "tax": "number",
      "totalAmount": "number",
      "paidAmount": "number",
      "paymentStatus": "string",
      "generatedBy": "string",
      "notes": "string",
      "items": [
        {
          "id": "string",
          "medicineId": "string",
          "batchId": "string",
          "quantity": "number",
          "unitPrice": "number",
          "discount": "number",
          "tax": "number",
          "total": "number"
        }
      ],
      "createdAt": "date",
      "updatedAt": "date"
    }
  }
  ```

### Process Payment

Processes a payment for a pharmacy bill.

- **URL**: `/api/pharmacy/billing/{id}/payment`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "amount": "number",
    "method": "string",
    "reference": "string",
    "notes": "string"
  }
  ```
- **Response**:
  ```json
  {
    "bill": {
      "id": "string",
      "paidAmount": "number",
      "paymentStatus": "string",
      "updatedAt": "date"
    },
    "payment": {
      "id": "string",
      "saleId": "string",
      "amount": "number",
      "paymentMethod": "string",
      "paymentDate": "date",
      "reference": "string",
      "notes": "string",
      "processedBy": "string"
    }
  }
  ```

## Real-time Updates

### SSE Connection

Establishes a Server-Sent Events (SSE) connection for real-time updates.

- **URL**: `/api/pharmacy/inventory/sse`
- **Method**: `GET`
- **Response**: Server-Sent Events (SSE) stream with the following event types:
  - `connected`: Initial connection established
    ```json
    {
      "clientId": "string"
    }
    ```
  - `inventory-update`: Inventory transaction occurred
    ```json
    {
      "id": "string",
      "medicine": {
        "id": "string",
        "name": "string"
      },
      "action": "string",
      "quantity": "number",
      "currentStock": "number",
      "timestamp": "date"
    }
    ```
  - `stock-alert`: Low stock or out-of-stock alert
    ```json
    {
      "id": "string",
      "medicine": {
        "id": "string",
        "name": "string"
      },
      "alertType": "string",
      "currentStock": "number",
      "timestamp": "date"
    }
    ```
  - `batch-expiry`: Batch expiry alert
    ```json
    {
      "id": "string",
      "medicine": {
        "id": "string",
        "name": "string"
      },
      "batch": {
        "id": "string",
        "batchNumber": "string",
        "expiryDate": "date"
      },
      "quantity": "number",
      "timestamp": "date"
    }
    ```
