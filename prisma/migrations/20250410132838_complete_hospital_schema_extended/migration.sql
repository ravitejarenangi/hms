-- CreateTable
CREATE TABLE "Employee" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "employeeId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "contractType" TEXT NOT NULL,
    "contractEndDate" TIMESTAMP(3),
    "salary" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "ifscCode" TEXT,
    "panNumber" TEXT,
    "emergencyContact" TEXT,
    "emergencyName" TEXT,
    "emergencyRelation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leave" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "leaveType" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalDays" INTEGER NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedBy" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Leave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryPayment" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "salaryMonth" TEXT NOT NULL,
    "basicSalary" DECIMAL(65,30) NOT NULL,
    "allowances" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxDeducted" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "netSalary" DECIMAL(65,30) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "transactionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalaryPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeDocument" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentName" TEXT NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedBy" INTEGER,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployeeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceReview" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "reviewDate" TIMESTAMP(3) NOT NULL,
    "reviewPeriodStart" TIMESTAMP(3) NOT NULL,
    "reviewPeriodEnd" TIMESTAMP(3) NOT NULL,
    "reviewedBy" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "strengths" TEXT,
    "areasOfImprovement" TEXT,
    "goals" TEXT,
    "comments" TEXT,
    "employeeComments" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "acknowledgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubsidyScheme" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "issuingAuthority" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "eligibilityCriteria" TEXT,
    "subsidyType" TEXT NOT NULL,
    "percentageValue" DOUBLE PRECISION,
    "fixedAmount" DECIMAL(65,30),
    "maxCoverageAmount" DECIMAL(65,30),
    "maxCoveragePerTreatment" DECIMAL(65,30),
    "applicableServices" TEXT,
    "documentationRequired" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubsidyScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientSubsidy" (
    "id" SERIAL NOT NULL,
    "patientId" INTEGER NOT NULL,
    "schemeId" INTEGER NOT NULL,
    "enrollmentDate" TIMESTAMP(3) NOT NULL,
    "enrollmentNumber" TEXT NOT NULL,
    "cardNumber" TEXT,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3),
    "remainingBalance" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "verifiedBy" INTEGER,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientSubsidy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubsidyClaim" (
    "id" SERIAL NOT NULL,
    "patientSubsidyId" INTEGER NOT NULL,
    "schemeId" INTEGER NOT NULL,
    "invoiceId" INTEGER,
    "claimDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimAmount" DECIMAL(65,30) NOT NULL,
    "approvedAmount" DECIMAL(65,30),
    "rejectionReason" TEXT,
    "claimStatus" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "processedBy" INTEGER,
    "processedAt" TIMESTAMP(3),
    "reimbursementDate" TIMESTAMP(3),
    "transactionId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubsidyClaim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HousekeepingArea" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "floor" TEXT,
    "buildingSection" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "cleaningFrequency" TEXT NOT NULL,
    "specialInstructions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HousekeepingArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HousekeepingStaff" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "staffId" TEXT NOT NULL,
    "supervisor" BOOLEAN NOT NULL DEFAULT false,
    "specializedAreas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HousekeepingStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningTask" (
    "id" SERIAL NOT NULL,
    "areaId" INTEGER NOT NULL,
    "assignedToId" INTEGER,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "scheduledTime" TEXT NOT NULL,
    "estimatedDuration" INTEGER NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningVerification" (
    "id" SERIAL NOT NULL,
    "taskId" INTEGER NOT NULL,
    "verifiedById" INTEGER NOT NULL,
    "verificationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rating" INTEGER NOT NULL,
    "cleanliness" INTEGER NOT NULL,
    "comments" TEXT,
    "photosUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PASSED',
    "followUpRequired" BOOLEAN NOT NULL DEFAULT false,
    "followUpNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningSupply" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "currentStock" INTEGER NOT NULL DEFAULT 0,
    "reorderLevel" INTEGER NOT NULL DEFAULT 10,
    "location" TEXT,
    "supplier" TEXT,
    "lastPurchaseDate" TIMESTAMP(3),
    "lastPurchasePrice" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningSupply_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningSupplyRequest" (
    "id" SERIAL NOT NULL,
    "requestedById" INTEGER NOT NULL,
    "requestDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "requiredBy" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" INTEGER,
    "approvedAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningSupplyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CleaningSupplyRequestItem" (
    "id" SERIAL NOT NULL,
    "requestId" INTEGER NOT NULL,
    "supplyId" INTEGER NOT NULL,
    "quantityRequested" INTEGER NOT NULL,
    "quantityApproved" INTEGER,
    "quantityFulfilled" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CleaningSupplyRequestItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeId_key" ON "Employee"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "SubsidyScheme_code_key" ON "SubsidyScheme"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PatientSubsidy_enrollmentNumber_key" ON "PatientSubsidy"("enrollmentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "HousekeepingStaff_userId_key" ON "HousekeepingStaff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "HousekeepingStaff_staffId_key" ON "HousekeepingStaff"("staffId");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leave" ADD CONSTRAINT "Leave_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryPayment" ADD CONSTRAINT "SalaryPayment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSubsidy" ADD CONSTRAINT "PatientSubsidy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientSubsidy" ADD CONSTRAINT "PatientSubsidy_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "SubsidyScheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubsidyClaim" ADD CONSTRAINT "SubsidyClaim_patientSubsidyId_fkey" FOREIGN KEY ("patientSubsidyId") REFERENCES "PatientSubsidy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubsidyClaim" ADD CONSTRAINT "SubsidyClaim_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "SubsidyScheme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubsidyClaim" ADD CONSTRAINT "SubsidyClaim_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HousekeepingStaff" ADD CONSTRAINT "HousekeepingStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningTask" ADD CONSTRAINT "CleaningTask_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "HousekeepingArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningTask" ADD CONSTRAINT "CleaningTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "HousekeepingStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningVerification" ADD CONSTRAINT "CleaningVerification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CleaningTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningVerification" ADD CONSTRAINT "CleaningVerification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "HousekeepingStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningSupplyRequest" ADD CONSTRAINT "CleaningSupplyRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "HousekeepingStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningSupplyRequestItem" ADD CONSTRAINT "CleaningSupplyRequestItem_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "CleaningSupplyRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CleaningSupplyRequestItem" ADD CONSTRAINT "CleaningSupplyRequestItem_supplyId_fkey" FOREIGN KEY ("supplyId") REFERENCES "CleaningSupply"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
