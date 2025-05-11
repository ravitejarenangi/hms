# Bed Management API Documentation

This document provides detailed information about the Bed Management API endpoints, their request/response formats, and usage examples.

## Table of Contents

1. [Bed Status SSE](#bed-status-sse)
2. [Bed Allocation](#bed-allocation)
3. [Bed Transfers](#bed-transfers)
4. [Bed Billing](#bed-billing)
5. [Room Services](#room-services)
6. [Bed Tracking](#bed-tracking)
7. [Analytics](#analytics)

---

## Bed Status SSE

Real-time updates for bed availability using Server-Sent Events (SSE).

### Endpoint

```
GET /api/beds/status-sse
```

### Description

This endpoint establishes a Server-Sent Events connection to provide real-time updates about bed status changes. The client will receive updates every 5 seconds or when bed status changes occur.

### Response Format

```json
{
  "type": "connection",
  "message": "SSE connection established for bed status updates"
}

// Followed by bed status updates:
[
  {
    "id": "bed123",
    "bedNumber": "A-101",
    "roomId": "room456",
    "roomNumber": "101",
    "floor": "1",
    "wing": "A",
    "bedType": "STANDARD",
    "status": "AVAILABLE",
    "patientId": null,
    "allocatedAt": null,
    "expectedDischarge": null
  },
  // More beds...
]
```

### Usage Example

```javascript
const eventSource = new EventSource('/api/beds/status-sse');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Update UI with bed status data
  console.log('Received bed status update:', data);
};

eventSource.onerror = (error) => {
  console.error('SSE error:', error);
  eventSource.close();
};
```

---

## Bed Allocation

Manages bed allocations to patients.

### Endpoints

#### Get All Allocations

```
GET /api/beds/allocation
```

##### Query Parameters

- `status` (optional): Filter by allocation status (CURRENT, DISCHARGED, TRANSFERRED)
- `patientId` (optional): Filter by patient ID
- `bedId` (optional): Filter by bed ID

##### Response

```json
[
  {
    "id": "alloc123",
    "bedId": "bed123",
    "patientId": "patient456",
    "allocatedAt": "2023-05-10T10:00:00Z",
    "dischargedAt": null,
    "expectedDischarge": "2023-05-15T10:00:00Z",
    "status": "CURRENT",
    "notes": "Patient requires oxygen support",
    "patient": {
      "id": "patient456",
      "name": "John Doe",
      "email": "john@example.com",
      "mrn": "MRN12345",
      "dateOfBirth": "1980-01-01",
      "gender": "MALE",
      "age": 43
    },
    "bed": {
      "id": "bed123",
      "bedNumber": "A-101",
      "roomNumber": "101",
      "floor": "1",
      "wing": "A"
    }
  }
]
```

#### Create Allocation

```
POST /api/beds/allocation
```

##### Request Body

```json
{
  "bedId": "bed123",
  "patientId": "patient456",
  "expectedDischarge": "2023-05-15T10:00:00Z",
  "notes": "Patient requires oxygen support"
}
```

##### Response

```json
{
  "id": "alloc123",
  "bedId": "bed123",
  "patientId": "patient456",
  "allocatedAt": "2023-05-10T10:00:00Z",
  "dischargedAt": null,
  "expectedDischarge": "2023-05-15T10:00:00Z",
  "status": "CURRENT",
  "notes": "Patient requires oxygen support",
  "patient": {
    "id": "patient456",
    "name": "John Doe",
    "email": "john@example.com",
    "mrn": "MRN12345",
    "dateOfBirth": "1980-01-01",
    "gender": "MALE",
    "age": 43
  },
  "bed": {
    "id": "bed123",
    "bedNumber": "A-101",
    "roomNumber": "101",
    "floor": "1",
    "wing": "A"
  }
}
```

---

## Bed Transfers

Manages transfers of patients between beds.

### Endpoints

#### Get All Transfers

```
GET /api/beds/transfers
```

##### Query Parameters

- `status` (optional): Filter by transfer status (REQUESTED, APPROVED, COMPLETED, CANCELLED, REJECTED)
- `patientId` (optional): Filter by patient ID
- `fromBedId` (optional): Filter by source bed ID

##### Response

```json
[
  {
    "id": "transfer123",
    "patientId": "patient456",
    "fromBedId": "bed123",
    "toBedId": "bed789",
    "transferReason": "Patient requires ICU care",
    "requestedAt": "2023-05-10T14:00:00Z",
    "completedAt": null,
    "status": "REQUESTED",
    "notes": "Urgent transfer needed",
    "patient": {
      "id": "patient456",
      "name": "John Doe",
      "email": "john@example.com",
      "mrn": "MRN12345"
    },
    "fromBed": {
      "id": "bed123",
      "bedNumber": "A-101",
      "roomNumber": "101",
      "floor": "1",
      "wing": "A"
    },
    "toBed": {
      "id": "bed789",
      "bedNumber": "ICU-05",
      "roomNumber": "ICU",
      "floor": "2",
      "wing": "B"
    }
  }
]
```

#### Create Transfer Request

```
POST /api/beds/transfers
```

##### Request Body

```json
{
  "patientId": "patient456",
  "fromBedId": "bed123",
  "toBedId": "bed789",
  "transferReason": "Patient requires ICU care",
  "notes": "Urgent transfer needed"
}
```

##### Response

```json
{
  "id": "transfer123",
  "patientId": "patient456",
  "fromBedId": "bed123",
  "toBedId": "bed789",
  "transferReason": "Patient requires ICU care",
  "requestedAt": "2023-05-10T14:00:00Z",
  "completedAt": null,
  "status": "REQUESTED",
  "notes": "Urgent transfer needed",
  "patient": {
    "id": "patient456",
    "name": "John Doe",
    "email": "john@example.com",
    "mrn": "MRN12345"
  },
  "fromBed": {
    "id": "bed123",
    "bedNumber": "A-101",
    "roomNumber": "101",
    "floor": "1",
    "wing": "A"
  },
  "toBed": {
    "id": "bed789",
    "bedNumber": "ICU-05",
    "roomNumber": "ICU",
    "floor": "2",
    "wing": "B"
  }
}
```

#### Update Transfer Status

```
PUT /api/beds/transfers
```

##### Request Body

```json
{
  "id": "transfer123",
  "status": "APPROVED",
  "notes": "Transfer approved by Dr. Smith"
}
```

##### Response

Similar to the response for creating a transfer request, but with updated status and notes.

---

## Bed Billing

Manages billing information for bed allocations.

### Endpoints

#### Get Billing Records

```
GET /api/beds/billing
```

##### Query Parameters

- `status` (optional): Filter by billing status (PENDING, INVOICED, PAID, CANCELLED)
- `patientId` (optional): Filter by patient ID
- `allocationId` (optional): Filter by allocation ID

##### Response

```json
[
  {
    "id": "bill123",
    "allocationId": "alloc123",
    "baseRate": 1500.00,
    "totalDays": 5,
    "additionalCharges": 300.00,
    "discounts": 200.00,
    "totalAmount": 7600.00,
    "billingStatus": "PENDING",
    "invoiceNumber": null,
    "paidAmount": 0.00,
    "patient": {
      "id": "patient456",
      "name": "John Doe",
      "email": "john@example.com",
      "mrn": "MRN12345"
    },
    "bed": {
      "id": "bed123",
      "bedNumber": "A-101",
      "bedType": "STANDARD",
      "roomNumber": "101",
      "floor": "1",
      "wing": "A",
      "roomType": "PRIVATE"
    },
    "allocationPeriod": {
      "allocatedAt": "2023-05-10T10:00:00Z",
      "dischargedAt": "2023-05-15T10:00:00Z",
      "expectedDischarge": "2023-05-15T10:00:00Z"
    }
  }
]
```

#### Create/Update Billing Record

```
POST /api/beds/billing
```

##### Request Body

```json
{
  "allocationId": "alloc123",
  "baseRate": 1500.00,
  "totalDays": 5,
  "additionalCharges": 300.00,
  "discounts": 200.00,
  "notes": "Includes oxygen therapy charges"
}
```

##### Response

Similar to the response for getting billing records.

#### Update Billing Status

```
PUT /api/beds/billing
```

##### Request Body

```json
{
  "id": "bill123",
  "billingStatus": "PAID",
  "paidAmount": 7600.00,
  "paidAt": "2023-05-16T10:00:00Z",
  "notes": "Payment received via credit card"
}
```

##### Response

Similar to the response for getting billing records, but with updated status and payment information.

---

## Room Services

Manages room service requests such as housekeeping and maintenance.

### Endpoints

#### Get Service Requests

```
GET /api/beds/services
```

##### Query Parameters

- `status` (optional): Filter by request status (PENDING, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED)
- `requestType` (optional): Filter by request type (HOUSEKEEPING, MAINTENANCE, FOOD, LAUNDRY, OTHER)
- `roomId` (optional): Filter by room ID
- `patientId` (optional): Filter by patient ID
- `priority` (optional): Filter by priority (HIGH, NORMAL, LOW)

##### Response

```json
[
  {
    "id": "service123",
    "roomId": "room456",
    "patientId": "patient789",
    "requestType": "HOUSEKEEPING",
    "requestDetails": "Room cleaning required",
    "requestedAt": "2023-05-10T12:00:00Z",
    "assignedTo": "staff123",
    "assignedAt": "2023-05-10T12:05:00Z",
    "status": "ASSIGNED",
    "priority": "NORMAL",
    "completedAt": null,
    "feedback": null,
    "feedbackRating": null,
    "notes": null,
    "patient": {
      "id": "patient789",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "mrn": "MRN67890"
    },
    "requestedByUser": {
      "id": "nurse123",
      "name": "Nurse Johnson",
      "email": "nurse@hospital.com",
      "role": "NURSE"
    },
    "assignedToUser": {
      "id": "staff123",
      "name": "Housekeeping Staff",
      "email": "housekeeping@hospital.com",
      "role": "HOUSEKEEPING"
    },
    "room": {
      "id": "room456",
      "roomNumber": "101",
      "floor": "1",
      "wing": "A",
      "roomType": "PRIVATE"
    }
  }
]
```

#### Create Service Request

```
POST /api/beds/services
```

##### Request Body

```json
{
  "roomId": "room456",
  "patientId": "patient789",
  "requestType": "HOUSEKEEPING",
  "requestDetails": "Room cleaning required",
  "priority": "NORMAL",
  "notes": "Please clean after patient discharge"
}
```

##### Response

Similar to the response for getting service requests.

#### Update Service Request

```
PUT /api/beds/services
```

##### Request Body

```json
{
  "id": "service123",
  "status": "COMPLETED",
  "feedback": "Room was cleaned thoroughly",
  "feedbackRating": 5,
  "notes": "Completed as requested"
}
```

##### Response

Similar to the response for getting service requests, but with updated status and feedback information.

---

## Bed Tracking

Tracks patient room assignments and discharge planning.

### Endpoints

#### Get Tracking Data

```
GET /api/beds/tracking
```

##### Query Parameters

- `view` (optional): Type of view to fetch (current, discharge, history)
- `patientId` (optional): Filter by patient ID
- `ward` (optional): Filter by ward/wing
- `floor` (optional): Filter by floor
- `date` (optional): For discharge planning, filter by expected discharge date

##### Response

```json
[
  {
    "allocation": {
      "id": "alloc123",
      "status": "CURRENT",
      "allocatedAt": "2023-05-10T10:00:00Z",
      "dischargedAt": null,
      "expectedDischarge": "2023-05-15T10:00:00Z",
      "notes": "Patient requires oxygen support",
      "lengthOfStay": 5
    },
    "patient": {
      "id": "patient456",
      "name": "John Doe",
      "email": "john@example.com",
      "mrn": "MRN12345",
      "dateOfBirth": "1980-01-01",
      "gender": "MALE",
      "contactPhone": "+1234567890",
      "emergencyContact": "Jane Doe, +0987654321",
      "age": 43
    },
    "bed": {
      "id": "bed123",
      "bedNumber": "A-101",
      "bedType": "STANDARD",
      "status": "OCCUPIED",
      "features": ["OXYGEN", "CALL_BUTTON"]
    },
    "room": {
      "id": "room456",
      "roomNumber": "101",
      "floor": "1",
      "wing": "A",
      "roomType": "PRIVATE",
      "capacity": 1
    },
    "admission": {
      "id": "admission123",
      "admissionDate": "2023-05-10T10:00:00Z",
      "admissionReason": "Pneumonia",
      "admittingDoctor": "Dr. Smith",
      "department": "Pulmonology",
      "expectedStayDuration": 5
    },
    "billing": {
      "id": "bill123",
      "baseRate": 1500.00,
      "totalDays": 5,
      "additionalCharges": 300.00,
      "discounts": 200.00,
      "totalAmount": 7600.00,
      "billingStatus": "PENDING",
      "paidAmount": 0.00
    }
  }
]
```

#### Update Discharge Planning

```
POST /api/beds/tracking
```

##### Request Body

```json
{
  "allocationId": "alloc123",
  "expectedDischarge": "2023-05-17T10:00:00Z",
  "notes": "Extended stay due to slow recovery"
}
```

##### Response

Similar to the response for getting tracking data, but for a single allocation with updated discharge planning.

#### Discharge Patient

```
PUT /api/beds/tracking
```

##### Request Body

```json
{
  "allocationId": "alloc123",
  "dischargeNotes": "Patient recovered well",
  "billingComplete": true
}
```

##### Response

Similar to the response for getting tracking data, but for a single allocation with updated discharge information.

---

## Analytics

Provides analytics data for bed management.

### Endpoint

```
GET /api/beds/analytics
```

### Query Parameters

- `metric` (optional): Type of analytics to fetch (overview, occupancy, los, revenue, turnover, efficiency)
- `startDate` (optional): Start date for analytics period (default: 30 days ago)
- `endDate` (optional): End date for analytics period (default: today)
- `bedType` (optional): Filter by bed type
- `roomType` (optional): Filter by room type
- `ward` (optional): Filter by ward/wing
- `department` (optional): Filter by department

### Response

Response format varies based on the requested metric:

#### Overview

```json
{
  "bedStats": {
    "totalBeds": 100,
    "occupiedBeds": 75,
    "availableBeds": 20,
    "maintenanceBeds": 5,
    "occupancyRate": 75.0
  },
  "patientMovement": {
    "admissions": 50,
    "discharges": 45,
    "averageLOS": 4.5,
    "netChange": 5
  },
  "financials": {
    "totalRevenue": 375000.00,
    "paidRevenue": 300000.00,
    "outstandingRevenue": 75000.00,
    "collectionRate": 80.0
  },
  "serviceRequests": {
    "totalRequests": 120,
    "pendingRequests": 15,
    "completedRequests": 105,
    "completionRate": 87.5
  },
  "period": {
    "startDate": "2023-04-11",
    "endDate": "2023-05-11",
    "daysInPeriod": 30
  }
}
```

#### Occupancy

```json
[
  {
    "period": "2023-04-11 to 2023-05-11",
    "ward": "A",
    "bedType": "STANDARD",
    "totalBeds": 50,
    "occupiedBeds": 40,
    "occupancyRate": 80.0
  },
  {
    "period": "2023-04-11 to 2023-05-11",
    "ward": "B",
    "bedType": "ICU",
    "totalBeds": 10,
    "occupiedBeds": 8,
    "occupancyRate": 80.0
  }
]
```

#### Length of Stay (LOS)

```json
[
  {
    "department": "Pulmonology",
    "diagnosis": "Pneumonia",
    "averageLOS": 5.2,
    "minLOS": 3,
    "maxLOS": 10,
    "patientCount": 15
  },
  {
    "department": "Cardiology",
    "diagnosis": "Myocardial Infarction",
    "averageLOS": 7.5,
    "minLOS": 5,
    "maxLOS": 14,
    "patientCount": 8
  }
]
```

#### Revenue

```json
[
  {
    "roomType": "PRIVATE",
    "bedType": "STANDARD",
    "totalRevenue": 150000.00,
    "occupancyDays": 100,
    "averageRatePerDay": 1500.00
  },
  {
    "roomType": "SHARED",
    "bedType": "STANDARD",
    "totalRevenue": 75000.00,
    "occupancyDays": 150,
    "averageRatePerDay": 500.00
  }
]
```

#### Turnover

```json
[
  {
    "ward": "A",
    "averageTurnoverTime": 2.5,
    "admissions": 30,
    "discharges": 28,
    "cleaningTime": 45.0,
    "preparationTime": 22.5
  },
  {
    "ward": "B",
    "averageTurnoverTime": 3.2,
    "admissions": 20,
    "discharges": 17,
    "cleaningTime": 60.0,
    "preparationTime": 30.0
  }
]
```

#### Efficiency

```json
[
  {
    "ward": "A",
    "staffToPatientRatio": 0.25,
    "bedUtilization": 80.0,
    "averageLOS": 4.5,
    "readmissionRate": 3.2
  },
  {
    "ward": "B",
    "staffToPatientRatio": 0.5,
    "bedUtilization": 75.0,
    "averageLOS": 6.2,
    "readmissionRate": 2.8
  }
]
```

---

## Error Responses

All endpoints may return the following error responses:

### 401 Unauthorized

```json
{
  "error": "Unauthorized"
}
```

### 400 Bad Request

```json
{
  "error": "Validation error message"
}
```

### 404 Not Found

```json
{
  "error": "Resource not found message"
}
```

### 500 Internal Server Error

```json
{
  "error": "Internal Server Error"
}
```
