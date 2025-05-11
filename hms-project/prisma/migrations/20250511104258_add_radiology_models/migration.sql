-- CreateEnum
CREATE TYPE "PatientAssignmentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'TRANSFERRED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ReferralPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ModalityType" AS ENUM ('XRAY', 'CT', 'MRI', 'ULTRASOUND', 'MAMMOGRAPHY', 'FLUOROSCOPY', 'DEXA', 'PET', 'NUCLEAR_MEDICINE', 'ANGIOGRAPHY');

-- CreateEnum
CREATE TYPE "RadiologyStatus" AS ENUM ('REQUESTED', 'SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'REPORTED', 'VERIFIED', 'DELIVERED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RequestPriority" AS ENUM ('STAT', 'URGENT', 'ROUTINE', 'ELECTIVE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'PRELIMINARY', 'FINAL', 'AMENDED', 'ADDENDUM');

-- CreateEnum
CREATE TYPE "RadiologyPaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'REFUNDED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "appointmentCompletionRate" DOUBLE PRECISION,
ADD COLUMN     "averageAppointmentDuration" INTEGER,
ADD COLUMN     "billingRate" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "certifications" TEXT[],
ADD COLUMN     "isAcceptingNewPatients" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "languages" TEXT[],
ADD COLUMN     "maxPatientsPerDay" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "preferredWorkingHours" JSONB,
ADD COLUMN     "rating" DOUBLE PRECISION,
ADD COLUMN     "referralCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "specialtyFocus" TEXT[],
ADD COLUMN     "totalAppointments" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalPatients" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "vacationAllowance" INTEGER NOT NULL DEFAULT 20,
ADD COLUMN     "vacationDays" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "DoctorAvailability" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT true,
    "date" TIMESTAMP(3),
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "slotDuration" INTEGER NOT NULL DEFAULT 30,
    "maxPatients" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorPerformanceMetric" (
    "id" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalAppointments" INTEGER NOT NULL DEFAULT 0,
    "completedAppointments" INTEGER NOT NULL DEFAULT 0,
    "cancelledAppointments" INTEGER NOT NULL DEFAULT 0,
    "noShowAppointments" INTEGER NOT NULL DEFAULT 0,
    "averageRating" DOUBLE PRECISION,
    "averageDuration" INTEGER,
    "patientSatisfaction" DOUBLE PRECISION,
    "revenueGenerated" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "referralsReceived" INTEGER NOT NULL DEFAULT 0,
    "referralsMade" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorPerformanceMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientAssignment" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "assignmentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPrimaryDoctor" BOOLEAN NOT NULL DEFAULT false,
    "status" "PatientAssignmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "lastAppointment" TIMESTAMP(3),
    "nextAppointment" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorReferral" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "referringDoctorId" TEXT NOT NULL,
    "receivingDoctorId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "priority" "ReferralPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "appointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DoctorCoConsultation" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "notes" TEXT,
    "billingAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "duration" INTEGER,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoctorCoConsultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologyServiceCatalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "modalityType" "ModalityType" NOT NULL,
    "price" DECIMAL(65,30) NOT NULL,
    "duration" INTEGER NOT NULL,
    "preparationInstructions" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadiologyServiceCatalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologyRequest" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "serviceCatalogId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledAt" TIMESTAMP(3),
    "priority" "RequestPriority" NOT NULL DEFAULT 'ROUTINE',
    "status" "RadiologyStatus" NOT NULL DEFAULT 'REQUESTED',
    "clinicalInfo" TEXT,
    "allergies" TEXT,
    "previousExams" TEXT,
    "notes" TEXT,
    "reasonForExam" TEXT NOT NULL,
    "isPregnant" BOOLEAN,
    "weight" DOUBLE PRECISION,
    "height" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadiologyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologyStudy" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "studyInstanceUID" TEXT NOT NULL,
    "studyDate" TIMESTAMP(3) NOT NULL,
    "studyDescription" TEXT,
    "accessionNumber" TEXT NOT NULL,
    "performedBy" TEXT NOT NULL,
    "radiologistId" TEXT,
    "status" "RadiologyStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "patientPosition" TEXT,
    "studyNotes" TEXT,
    "radiationDose" DOUBLE PRECISION,
    "contrastUsed" BOOLEAN NOT NULL DEFAULT false,
    "contrastDetails" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadiologyStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologySeries" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "seriesInstanceUID" TEXT NOT NULL,
    "seriesNumber" INTEGER NOT NULL,
    "seriesDescription" TEXT,
    "modality" "ModalityType" NOT NULL,
    "bodyPartExamined" TEXT,
    "patientPosition" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadiologySeries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologyInstance" (
    "id" TEXT NOT NULL,
    "seriesId" TEXT NOT NULL,
    "sopInstanceUID" TEXT NOT NULL,
    "sopClassUID" TEXT NOT NULL,
    "instanceNumber" INTEGER NOT NULL,
    "imageType" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "thumbnailPath" TEXT,
    "transferSyntaxUID" TEXT,
    "rows" INTEGER,
    "columns" INTEGER,
    "bitsAllocated" INTEGER,
    "windowCenter" DOUBLE PRECISION,
    "windowWidth" DOUBLE PRECISION,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadiologyInstance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologyReport" (
    "id" TEXT NOT NULL,
    "studyId" TEXT NOT NULL,
    "findings" TEXT NOT NULL,
    "impression" TEXT NOT NULL,
    "recommendation" TEXT,
    "diagnosisCode" TEXT,
    "radiologistId" TEXT NOT NULL,
    "reportStatus" "ReportStatus" NOT NULL DEFAULT 'DRAFT',
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedBy" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "signatureImage" TEXT,
    "templateUsed" TEXT,
    "keyImages" TEXT[],
    "criticalResult" BOOLEAN NOT NULL DEFAULT false,
    "criticalResultCommunicatedTo" TEXT,
    "criticalResultCommunicatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadiologyReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologyBilling" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "baseAmount" DECIMAL(65,30) NOT NULL,
    "contrastAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "additionalFees" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "paymentStatus" "RadiologyPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentMethod" TEXT,
    "paymentDate" TIMESTAMP(3),
    "insuranceCovered" BOOLEAN NOT NULL DEFAULT false,
    "insuranceProvider" TEXT,
    "insurancePolicyNumber" TEXT,
    "insuranceAuthorizationCode" TEXT,
    "insuranceAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "patientResponsibility" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadiologyBilling_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologistAssignment" (
    "id" TEXT NOT NULL,
    "radiologistId" TEXT NOT NULL,
    "modalityTypes" "ModalityType"[],
    "isOnCall" BOOLEAN NOT NULL DEFAULT false,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "maxStudiesPerDay" INTEGER NOT NULL DEFAULT 20,
    "currentLoad" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadiologistAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RadiologyAnalytics" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalStudies" INTEGER NOT NULL DEFAULT 0,
    "studiesByModality" JSONB,
    "studiesByStatus" JSONB,
    "studiesByBodyPart" JSONB,
    "averageReportTime" INTEGER,
    "averageWaitTime" INTEGER,
    "radiologistPerformance" JSONB,
    "revenueGenerated" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RadiologyAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DoctorAvailability_doctorId_dayOfWeek_startTime_date_key" ON "DoctorAvailability"("doctorId", "dayOfWeek", "startTime", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorPerformanceMetric_doctorId_period_startDate_key" ON "DoctorPerformanceMetric"("doctorId", "period", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "PatientAssignment_patientId_doctorId_key" ON "PatientAssignment"("patientId", "doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "DoctorCoConsultation_appointmentId_doctorId_key" ON "DoctorCoConsultation"("appointmentId", "doctorId");

-- CreateIndex
CREATE UNIQUE INDEX "RadiologyStudy_requestId_key" ON "RadiologyStudy"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "RadiologyStudy_studyInstanceUID_key" ON "RadiologyStudy"("studyInstanceUID");

-- CreateIndex
CREATE UNIQUE INDEX "RadiologyStudy_accessionNumber_key" ON "RadiologyStudy"("accessionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "RadiologySeries_seriesInstanceUID_key" ON "RadiologySeries"("seriesInstanceUID");

-- CreateIndex
CREATE UNIQUE INDEX "RadiologyInstance_sopInstanceUID_key" ON "RadiologyInstance"("sopInstanceUID");

-- CreateIndex
CREATE UNIQUE INDEX "RadiologyReport_studyId_key" ON "RadiologyReport"("studyId");

-- CreateIndex
CREATE UNIQUE INDEX "RadiologyBilling_requestId_key" ON "RadiologyBilling"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "RadiologyBilling_invoiceNumber_key" ON "RadiologyBilling"("invoiceNumber");

-- AddForeignKey
ALTER TABLE "DoctorAvailability" ADD CONSTRAINT "DoctorAvailability_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorPerformanceMetric" ADD CONSTRAINT "DoctorPerformanceMetric_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientAssignment" ADD CONSTRAINT "PatientAssignment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorReferral" ADD CONSTRAINT "DoctorReferral_referringDoctorId_fkey" FOREIGN KEY ("referringDoctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorReferral" ADD CONSTRAINT "DoctorReferral_receivingDoctorId_fkey" FOREIGN KEY ("receivingDoctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DoctorCoConsultation" ADD CONSTRAINT "DoctorCoConsultation_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyRequest" ADD CONSTRAINT "RadiologyRequest_serviceCatalogId_fkey" FOREIGN KEY ("serviceCatalogId") REFERENCES "RadiologyServiceCatalog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyStudy" ADD CONSTRAINT "RadiologyStudy_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RadiologyRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologySeries" ADD CONSTRAINT "RadiologySeries_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "RadiologyStudy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyInstance" ADD CONSTRAINT "RadiologyInstance_seriesId_fkey" FOREIGN KEY ("seriesId") REFERENCES "RadiologySeries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyReport" ADD CONSTRAINT "RadiologyReport_studyId_fkey" FOREIGN KEY ("studyId") REFERENCES "RadiologyStudy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RadiologyBilling" ADD CONSTRAINT "RadiologyBilling_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "RadiologyRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
