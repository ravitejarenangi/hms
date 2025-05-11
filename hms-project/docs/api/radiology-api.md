# Radiology Management API Documentation

This document provides comprehensive documentation for the Radiology Management API endpoints.

## Table of Contents

1. [Radiology Services](#radiology-services)
2. [Radiology Requests](#radiology-requests)
3. [Radiology Images](#radiology-images)
4. [Radiology Reports](#radiology-reports)
5. [Radiology Billing](#radiology-billing)
6. [Real-time Updates (SSE)](#real-time-updates-sse)
7. [Radiology Analytics](#radiology-analytics)

---

## Radiology Services

API endpoints for managing the radiology service catalog.

### GET /api/radiology/services

Retrieves a list of radiology services.

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `search` (optional): Search term to filter services by name or code
- `modalityType` (optional): Filter by modality type
- `bodyPart` (optional): Filter by body part
- `isActive` (optional): Filter by active status (true/false)

**Response:**
```json
{
  "services": [
    {
      "id": "string",
      "code": "string",
      "name": "string",
      "description": "string",
      "modalityType": "string",
      "bodyPart": "string",
      "price": "number",
      "preparationNotes": "string",
      "duration": "number",
      "isActive": "boolean",
      "requiresContrast": "boolean",
      "dicomSupported": "boolean",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalCount": "number",
    "hasNext": "boolean",
    "hasPrevious": "boolean"
  }
}
```

### POST /api/radiology/services

Creates a new radiology service.

**Request Body:**
```json
{
  "code": "string",
  "name": "string",
  "description": "string",
  "modalityType": "string",
  "bodyPart": "string",
  "price": "number",
  "preparationNotes": "string",
  "duration": "number",
  "isActive": "boolean",
  "requiresContrast": "boolean",
  "dicomSupported": "boolean"
}
```

**Response:**
```json
{
  "id": "string",
  "code": "string",
  "name": "string",
  "description": "string",
  "modalityType": "string",
  "bodyPart": "string",
  "price": "number",
  "preparationNotes": "string",
  "duration": "number",
  "isActive": "boolean",
  "requiresContrast": "boolean",
  "dicomSupported": "boolean",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### PUT /api/radiology/services

Updates an existing radiology service.

**Request Body:**
```json
{
  "id": "string",
  "code": "string",
  "name": "string",
  "description": "string",
  "modalityType": "string",
  "bodyPart": "string",
  "price": "number",
  "preparationNotes": "string",
  "duration": "number",
  "isActive": "boolean",
  "requiresContrast": "boolean",
  "dicomSupported": "boolean"
}
```

**Response:**
```json
{
  "id": "string",
  "code": "string",
  "name": "string",
  "description": "string",
  "modalityType": "string",
  "bodyPart": "string",
  "price": "number",
  "preparationNotes": "string",
  "duration": "number",
  "isActive": "boolean",
  "requiresContrast": "boolean",
  "dicomSupported": "boolean",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### DELETE /api/radiology/services

Deletes a radiology service.

**Query Parameters:**
- `id` (required): ID of the service to delete

**Response:**
```json
{
  "message": "Service deleted successfully"
}
```

---

## Radiology Requests

API endpoints for managing radiology imaging requests.

### GET /api/radiology/requests

Retrieves a list of radiology requests.

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `patientId` (optional): Filter by patient ID
- `doctorId` (optional): Filter by referring doctor ID
- `status` (optional): Filter by request status
- `priority` (optional): Filter by priority
- `modalityType` (optional): Filter by modality type
- `fromDate` (optional): Filter by request date (start date)
- `toDate` (optional): Filter by request date (end date)

**Response:**
```json
{
  "requests": [
    {
      "id": "string",
      "patientId": "string",
      "doctorId": "string",
      "serviceCatalogId": "string",
      "serviceCatalog": {
        "name": "string",
        "modalityType": "string"
      },
      "requestedAt": "string",
      "scheduledAt": "string",
      "priority": "string",
      "status": "string",
      "clinicalInfo": "string",
      "reasonForExam": "string",
      "patientPregnant": "boolean",
      "patientAllergies": "string",
      "previousExams": "string",
      "notes": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalCount": "number",
    "hasNext": "boolean",
    "hasPrevious": "boolean"
  }
}
```

### POST /api/radiology/requests

Creates a new radiology request.

**Request Body:**
```json
{
  "patientId": "string",
  "doctorId": "string",
  "serviceCatalogId": "string",
  "requestedAt": "string",
  "scheduledAt": "string",
  "priority": "string",
  "status": "string",
  "clinicalInfo": "string",
  "reasonForExam": "string",
  "patientPregnant": "boolean",
  "patientAllergies": "string",
  "previousExams": "string",
  "notes": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "patientId": "string",
  "doctorId": "string",
  "serviceCatalogId": "string",
  "requestedAt": "string",
  "scheduledAt": "string",
  "priority": "string",
  "status": "string",
  "clinicalInfo": "string",
  "reasonForExam": "string",
  "patientPregnant": "boolean",
  "patientAllergies": "string",
  "previousExams": "string",
  "notes": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### PUT /api/radiology/requests

Updates an existing radiology request.

**Request Body:**
```json
{
  "id": "string",
  "patientId": "string",
  "doctorId": "string",
  "serviceCatalogId": "string",
  "requestedAt": "string",
  "scheduledAt": "string",
  "priority": "string",
  "status": "string",
  "clinicalInfo": "string",
  "reasonForExam": "string",
  "patientPregnant": "boolean",
  "patientAllergies": "string",
  "previousExams": "string",
  "notes": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "patientId": "string",
  "doctorId": "string",
  "serviceCatalogId": "string",
  "requestedAt": "string",
  "scheduledAt": "string",
  "priority": "string",
  "status": "string",
  "clinicalInfo": "string",
  "reasonForExam": "string",
  "patientPregnant": "boolean",
  "patientAllergies": "string",
  "previousExams": "string",
  "notes": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### PATCH /api/radiology/requests

Updates the status of a radiology request.

**Request Body:**
```json
{
  "id": "string",
  "status": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "status": "string",
  "updatedAt": "string"
}
```

### DELETE /api/radiology/requests

Deletes a radiology request.

**Query Parameters:**
- `id` (required): ID of the request to delete

**Response:**
```json
{
  "message": "Request deleted successfully"
}
```

---

## Radiology Images

API endpoints for managing DICOM images.

### GET /api/radiology/images/studies

Retrieves a list of imaging studies.

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `patientId` (optional): Filter by patient ID
- `modality` (optional): Filter by modality type
- `fromDate` (optional): Filter by study date (start date)
- `toDate` (optional): Filter by study date (end date)

**Response:**
```json
{
  "studies": [
    {
      "id": "string",
      "patientId": "string",
      "patientName": "string",
      "studyDate": "string",
      "modality": "string",
      "description": "string",
      "numSeries": "number",
      "numImages": "number"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalCount": "number",
    "hasNext": "boolean",
    "hasPrevious": "boolean"
  }
}
```

### GET /api/radiology/images/series

Retrieves a list of series for a study.

**Query Parameters:**
- `studyId` (required): ID of the study
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Response:**
```json
{
  "series": [
    {
      "id": "string",
      "studyId": "string",
      "seriesNumber": "number",
      "description": "string",
      "modality": "string",
      "numImages": "number"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalCount": "number",
    "hasNext": "boolean",
    "hasPrevious": "boolean"
  }
}
```

### GET /api/radiology/images

Retrieves a list of images for a series.

**Query Parameters:**
- `seriesId` (required): ID of the series
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)

**Response:**
```json
{
  "images": [
    {
      "id": "string",
      "seriesId": "string",
      "instanceNumber": "number",
      "sopInstanceUid": "string",
      "thumbnailUrl": "string",
      "imageUrl": "string"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalCount": "number",
    "hasNext": "boolean",
    "hasPrevious": "boolean"
  }
}
```

### POST /api/radiology/images

Uploads a DICOM image.

**Request Body:**
- `FormData` with the following fields:
  - `file`: The DICOM file
  - `studyId`: ID of the study
  - `seriesId`: ID of the series
  - `metadata`: JSON string with image metadata

**Response:**
```json
{
  "id": "string",
  "seriesId": "string",
  "instanceNumber": "number",
  "sopInstanceUid": "string",
  "thumbnailUrl": "string",
  "imageUrl": "string"
}
```

### DELETE /api/radiology/images

Deletes a DICOM image.

**Query Parameters:**
- `id` (required): ID of the image to delete

**Response:**
```json
{
  "message": "Image deleted successfully"
}
```

---

## Radiology Reports

API endpoints for managing radiology reports.

### GET /api/radiology/reports

Retrieves a list of radiology reports.

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `patientId` (optional): Filter by patient ID
- `doctorId` (optional): Filter by referring doctor ID
- `radiologistId` (optional): Filter by radiologist ID
- `status` (optional): Filter by report status
- `fromDate` (optional): Filter by report date (start date)
- `toDate` (optional): Filter by report date (end date)

**Response:**
```json
{
  "reports": [
    {
      "id": "string",
      "radiologyRequestId": "string",
      "patientId": "string",
      "patientName": "string",
      "doctorId": "string",
      "doctorName": "string",
      "radiologistId": "string",
      "radiologistName": "string",
      "studyDate": "string",
      "reportDate": "string",
      "modality": "string",
      "findings": "string",
      "impression": "string",
      "status": "string",
      "pdfUrl": "string"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalCount": "number",
    "hasNext": "boolean",
    "hasPrevious": "boolean"
  }
}
```

### POST /api/radiology/reports

Creates a new radiology report.

**Request Body:**
```json
{
  "radiologyRequestId": "string",
  "patientId": "string",
  "patientName": "string",
  "doctorId": "string",
  "doctorName": "string",
  "radiologistId": "string",
  "radiologistName": "string",
  "findings": "string",
  "impression": "string",
  "status": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "radiologyRequestId": "string",
  "patientId": "string",
  "patientName": "string",
  "doctorId": "string",
  "doctorName": "string",
  "radiologistId": "string",
  "radiologistName": "string",
  "studyDate": "string",
  "reportDate": "string",
  "modality": "string",
  "findings": "string",
  "impression": "string",
  "status": "string",
  "pdfUrl": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### PUT /api/radiology/reports

Updates an existing radiology report.

**Request Body:**
```json
{
  "id": "string",
  "radiologistId": "string",
  "radiologistName": "string",
  "findings": "string",
  "impression": "string",
  "status": "string"
}
```

**Response:**
```json
{
  "id": "string",
  "radiologyRequestId": "string",
  "patientId": "string",
  "patientName": "string",
  "doctorId": "string",
  "doctorName": "string",
  "radiologistId": "string",
  "radiologistName": "string",
  "studyDate": "string",
  "reportDate": "string",
  "modality": "string",
  "findings": "string",
  "impression": "string",
  "status": "string",
  "pdfUrl": "string",
  "updatedAt": "string"
}
```

### POST /api/radiology/reports/pdf

Generates a PDF for a radiology report.

**Query Parameters:**
- `id` (required): ID of the report

**Response:**
```json
{
  "pdfUrl": "string"
}
```

### POST /api/radiology/reports/email

Emails a radiology report to the patient and/or doctor.

**Query Parameters:**
- `id` (required): ID of the report

**Response:**
```json
{
  "message": "Report emailed successfully"
}
```

---

## Radiology Billing

API endpoints for managing radiology billing.

### GET /api/radiology/billing

Retrieves a list of radiology bills.

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `patientId` (optional): Filter by patient ID
- `invoiceNumber` (optional): Filter by invoice number
- `paymentStatus` (optional): Filter by payment status
- `fromDate` (optional): Filter by service date (start date)
- `toDate` (optional): Filter by service date (end date)

**Response:**
```json
{
  "bills": [
    {
      "id": "string",
      "patientId": "string",
      "patientName": "string",
      "radiologyRequestId": "string",
      "serviceName": "string",
      "serviceCode": "string",
      "modalityType": "string",
      "serviceDate": "string",
      "amount": "number",
      "discount": "number",
      "tax": "number",
      "totalAmount": "number",
      "paymentStatus": "string",
      "paymentMethod": "string",
      "paymentDate": "string",
      "transactionId": "string",
      "invoiceNumber": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalCount": "number",
    "hasNext": "boolean",
    "hasPrevious": "boolean"
  }
}
```

### POST /api/radiology/billing

Creates a new radiology bill.

**Request Body:**
```json
{
  "patientId": "string",
  "radiologyRequestId": "string",
  "amount": "number",
  "discount": "number",
  "tax": "number"
}
```

**Response:**
```json
{
  "id": "string",
  "patientId": "string",
  "patientName": "string",
  "radiologyRequestId": "string",
  "serviceName": "string",
  "serviceCode": "string",
  "modalityType": "string",
  "serviceDate": "string",
  "amount": "number",
  "discount": "number",
  "tax": "number",
  "totalAmount": "number",
  "paymentStatus": "string",
  "invoiceNumber": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```

### POST /api/radiology/billing/payment

Processes a payment for a radiology bill.

**Request Body:**
```json
{
  "billId": "string",
  "paymentMethod": "string",
  "transactionId": "string",
  "amount": "number"
}
```

**Response:**
```json
{
  "id": "string",
  "paymentStatus": "string",
  "paymentMethod": "string",
  "paymentDate": "string",
  "transactionId": "string",
  "updatedAt": "string"
}
```

### POST /api/radiology/billing/email-receipt

Emails a receipt for a radiology bill.

**Query Parameters:**
- `id` (required): ID of the bill

**Response:**
```json
{
  "message": "Receipt emailed successfully"
}
```

---

## Real-time Updates (SSE)

API endpoint for Server-Sent Events (SSE) for real-time updates.

### GET /api/radiology/sse

Establishes a Server-Sent Events (SSE) connection for real-time updates.

**Events:**
- `radiology-update`: Sent when there's a new update related to radiology

**Event Data Format:**
```json
{
  "id": "string",
  "type": "string",
  "title": "string",
  "message": "string",
  "timestamp": "string",
  "read": "boolean",
  "priority": "string",
  "metadata": {
    "requestId": "string",
    "reportId": "string",
    "studyId": "string",
    "patientId": "string",
    "patientName": "string"
  }
}
```

### GET /api/radiology/notifications

Retrieves a list of radiology notifications.

**Query Parameters:**
- `page` (optional): Page number for pagination (default: 1)
- `limit` (optional): Number of items per page (default: 10)
- `read` (optional): Filter by read status (true/false)

**Response:**
```json
{
  "notifications": [
    {
      "id": "string",
      "type": "string",
      "title": "string",
      "message": "string",
      "timestamp": "string",
      "read": "boolean",
      "priority": "string",
      "metadata": {
        "requestId": "string",
        "reportId": "string",
        "studyId": "string",
        "patientId": "string",
        "patientName": "string"
      }
    }
  ],
  "pagination": {
    "currentPage": "number",
    "totalPages": "number",
    "totalCount": "number",
    "hasNext": "boolean",
    "hasPrevious": "boolean"
  }
}
```

### PUT /api/radiology/notifications/{id}/read

Marks a notification as read.

**Path Parameters:**
- `id` (required): ID of the notification

**Response:**
```json
{
  "id": "string",
  "read": "boolean",
  "updatedAt": "string"
}
```

### DELETE /api/radiology/notifications/{id}

Deletes a notification.

**Path Parameters:**
- `id` (required): ID of the notification

**Response:**
```json
{
  "message": "Notification deleted successfully"
}
```

---

## Radiology Analytics

API endpoints for radiology analytics and reporting.

### GET /api/radiology/analytics/summary

Retrieves a summary of radiology analytics.

**Query Parameters:**
- `fromDate` (optional): Start date for the analytics period
- `toDate` (optional): End date for the analytics period

**Response:**
```json
{
  "totalStudies": "number",
  "totalRevenue": "number",
  "avgTurnaroundTime": "number",
  "studiesThisMonth": "number",
  "revenueThisMonth": "number",
  "pendingReports": "number"
}
```

### GET /api/radiology/analytics/modality

Retrieves analytics data by modality.

**Query Parameters:**
- `fromDate` (optional): Start date for the analytics period
- `toDate` (optional): End date for the analytics period

**Response:**
```json
{
  "modalityData": [
    {
      "name": "string",
      "count": "number",
      "revenue": "number"
    }
  ]
}
```

### GET /api/radiology/analytics/status

Retrieves analytics data by request status.

**Query Parameters:**
- `fromDate` (optional): Start date for the analytics period
- `toDate` (optional): End date for the analytics period

**Response:**
```json
{
  "statusData": [
    {
      "name": "string",
      "count": "number"
    }
  ]
}
```

### GET /api/radiology/analytics/timeline

Retrieves timeline analytics data.

**Query Parameters:**
- `period` (optional): Time period for grouping (day, week, month, year)
- `fromDate` (optional): Start date for the analytics period
- `toDate` (optional): End date for the analytics period

**Response:**
```json
{
  "timelineData": [
    {
      "period": "string",
      "studies": "number",
      "revenue": "number"
    }
  ]
}
```

### GET /api/radiology/analytics/radiologist

Retrieves analytics data by radiologist.

**Query Parameters:**
- `fromDate` (optional): Start date for the analytics period
- `toDate` (optional): End date for the analytics period

**Response:**
```json
{
  "radiologistData": [
    {
      "name": "string",
      "studies": "number",
      "avgTurnaround": "number"
    }
  ]
}
```

### GET /api/radiology/analytics/radiation-dose

Retrieves radiation dose tracking analytics.

**Query Parameters:**
- `patientId` (optional): Filter by patient ID
- `fromDate` (optional): Start date for the analytics period
- `toDate` (optional): End date for the analytics period

**Response:**
```json
{
  "patientDoseData": [
    {
      "patientId": "string",
      "patientName": "string",
      "cumulativeDose": "number",
      "studiesCount": "number",
      "lastStudyDate": "string"
    }
  ],
  "protocolComplianceData": {
    "compliantCount": "number",
    "nonCompliantCount": "number",
    "complianceRate": "number"
  }
}
```
