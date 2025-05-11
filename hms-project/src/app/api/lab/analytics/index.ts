import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const period = url.searchParams.get("period") || "month"; // day, week, month, year
    const startDate = url.searchParams.get("startDate") || undefined;
    const endDate = url.searchParams.get("endDate") || undefined;

    // Calculate date range based on period if not explicitly provided
    let dateFrom, dateTo;
    if (startDate && endDate) {
      dateFrom = new Date(startDate);
      dateTo = new Date(endDate);
    } else {
      dateTo = new Date();
      
      if (period === "day") {
        dateFrom = new Date(dateTo);
        dateFrom.setDate(dateTo.getDate() - 1);
      } else if (period === "week") {
        dateFrom = new Date(dateTo);
        dateFrom.setDate(dateTo.getDate() - 7);
      } else if (period === "month") {
        dateFrom = new Date(dateTo);
        dateFrom.setMonth(dateTo.getMonth() - 1);
      } else if (period === "year") {
        dateFrom = new Date(dateTo);
        dateFrom.setFullYear(dateTo.getFullYear() - 1);
      }
    }

    // Get test statistics
    const testStats = await getTestStatistics(dateFrom, dateTo);
    
    // Get sample statistics
    const sampleStats = await getSampleStatistics(dateFrom, dateTo);
    
    // Get result statistics
    const resultStats = await getResultStatistics(dateFrom, dateTo);
    
    // Get billing statistics
    const billingStats = await getBillingStatistics(dateFrom, dateTo);
    
    // Get test categories distribution
    const categoryDistribution = await getCategoryDistribution(dateFrom, dateTo);
    
    // Get test status distribution
    const statusDistribution = await getStatusDistribution(dateFrom, dateTo);
    
    // Get critical values statistics
    const criticalValueStats = await getCriticalValueStatistics(dateFrom, dateTo);
    
    // Get turnaround time statistics
    const turnaroundTimeStats = await getTurnaroundTimeStatistics(dateFrom, dateTo);
    
    // Get top tests
    const topTests = await getTopTests(dateFrom, dateTo);

    return NextResponse.json({
      period,
      dateRange: {
        from: dateFrom,
        to: dateTo,
      },
      testStats,
      sampleStats,
      resultStats,
      billingStats,
      categoryDistribution,
      statusDistribution,
      criticalValueStats,
      turnaroundTimeStats,
      topTests,
    });
  } catch (error) {
    console.error("Error fetching lab analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch lab analytics" },
      { status: 500 }
    );
  }
}

async function getTestStatistics(dateFrom: Date, dateTo: Date) {
  const totalTests = await prisma.test.count({
    where: {
      requestedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
  });

  const completedTests = await prisma.test.count({
    where: {
      requestedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
      status: {
        in: ["COMPLETED", "REPORTED", "VERIFIED", "DELIVERED"],
      },
    },
  });

  const pendingTests = await prisma.test.count({
    where: {
      requestedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
      status: {
        in: ["REQUESTED", "SCHEDULED", "SAMPLE_COLLECTED", "IN_PROGRESS"],
      },
    },
  });

  const cancelledTests = await prisma.test.count({
    where: {
      requestedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
      status: "CANCELLED",
    },
  });

  const completionRate = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;

  return {
    total: totalTests,
    completed: completedTests,
    pending: pendingTests,
    cancelled: cancelledTests,
    completionRate: parseFloat(completionRate.toFixed(2)),
  };
}

async function getSampleStatistics(dateFrom: Date, dateTo: Date) {
  const totalSamples = await prisma.sample.count({
    where: {
      collectedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
  });

  const processedSamples = await prisma.sample.count({
    where: {
      collectedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
      status: {
        in: ["PROCESSING", "ANALYZED"],
      },
    },
  });

  const rejectedSamples = await prisma.sample.count({
    where: {
      collectedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
      status: "REJECTED",
    },
  });

  const rejectionRate = totalSamples > 0 ? (rejectedSamples / totalSamples) * 100 : 0;

  return {
    total: totalSamples,
    processed: processedSamples,
    rejected: rejectedSamples,
    rejectionRate: parseFloat(rejectionRate.toFixed(2)),
  };
}

async function getResultStatistics(dateFrom: Date, dateTo: Date) {
  const totalResults = await prisma.testResult.count({
    where: {
      performedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
  });

  const abnormalResults = await prisma.testResult.count({
    where: {
      performedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
      isAbnormal: true,
    },
  });

  const criticalResults = await prisma.testResult.count({
    where: {
      performedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
      isCritical: true,
    },
  });

  const verifiedResults = await prisma.testResult.count({
    where: {
      performedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
      verifiedAt: {
        not: null,
      },
    },
  });

  const abnormalRate = totalResults > 0 ? (abnormalResults / totalResults) * 100 : 0;
  const criticalRate = totalResults > 0 ? (criticalResults / totalResults) * 100 : 0;
  const verificationRate = totalResults > 0 ? (verifiedResults / totalResults) * 100 : 0;

  return {
    total: totalResults,
    abnormal: abnormalResults,
    critical: criticalResults,
    verified: verifiedResults,
    abnormalRate: parseFloat(abnormalRate.toFixed(2)),
    criticalRate: parseFloat(criticalRate.toFixed(2)),
    verificationRate: parseFloat(verificationRate.toFixed(2)),
  };
}

async function getBillingStatistics(dateFrom: Date, dateTo: Date) {
  const billings = await prisma.labBilling.findMany({
    where: {
      createdAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    select: {
      amount: true,
      discount: true,
      tax: true,
      totalAmount: true,
      paymentStatus: true,
      insuranceCovered: true,
      insuranceAmount: true,
    },
  });

  const totalRevenue = billings.reduce((sum, billing) => sum + Number(billing.totalAmount), 0);
  const totalDiscount = billings.reduce((sum, billing) => sum + Number(billing.discount), 0);
  const totalTax = billings.reduce((sum, billing) => sum + Number(billing.tax), 0);
  const insuranceCoveredAmount = billings.reduce((sum, billing) => sum + Number(billing.insuranceAmount), 0);
  
  const paidBillings = billings.filter(billing => billing.paymentStatus === "PAID");
  const pendingBillings = billings.filter(billing => billing.paymentStatus === "PENDING");
  const cancelledBillings = billings.filter(billing => billing.paymentStatus === "CANCELLED");
  
  const paidAmount = paidBillings.reduce((sum, billing) => sum + Number(billing.totalAmount), 0);
  const pendingAmount = pendingBillings.reduce((sum, billing) => sum + Number(billing.totalAmount), 0);
  
  const insuranceCoveredCount = billings.filter(billing => billing.insuranceCovered).length;
  const insuranceCoveredPercentage = billings.length > 0 ? (insuranceCoveredCount / billings.length) * 100 : 0;

  return {
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalDiscount: parseFloat(totalDiscount.toFixed(2)),
    totalTax: parseFloat(totalTax.toFixed(2)),
    paidAmount: parseFloat(paidAmount.toFixed(2)),
    pendingAmount: parseFloat(pendingAmount.toFixed(2)),
    insuranceCoveredAmount: parseFloat(insuranceCoveredAmount.toFixed(2)),
    totalBillings: billings.length,
    paidBillings: paidBillings.length,
    pendingBillings: pendingBillings.length,
    cancelledBillings: cancelledBillings.length,
    insuranceCoveredCount,
    insuranceCoveredPercentage: parseFloat(insuranceCoveredPercentage.toFixed(2)),
  };
}

async function getCategoryDistribution(dateFrom: Date, dateTo: Date) {
  const tests = await prisma.test.findMany({
    where: {
      requestedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    include: {
      testCatalog: true,
    },
  });

  const categories: Record<string, number> = {};
  
  tests.forEach(test => {
    const category = test.testCatalog.category;
    categories[category] = (categories[category] || 0) + 1;
  });

  return Object.entries(categories).map(([category, count]) => ({
    category,
    count,
    percentage: parseFloat(((count / tests.length) * 100).toFixed(2)),
  }));
}

async function getStatusDistribution(dateFrom: Date, dateTo: Date) {
  const tests = await prisma.test.findMany({
    where: {
      requestedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    select: {
      status: true,
    },
  });

  const statuses: Record<string, number> = {};
  
  tests.forEach(test => {
    statuses[test.status] = (statuses[test.status] || 0) + 1;
  });

  return Object.entries(statuses).map(([status, count]) => ({
    status,
    count,
    percentage: parseFloat(((count / tests.length) * 100).toFixed(2)),
  }));
}

async function getCriticalValueStatistics(dateFrom: Date, dateTo: Date) {
  const criticalValues = await prisma.criticalValue.findMany({
    where: {
      reportedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    include: {
      test: {
        include: {
          testCatalog: true,
        },
      },
    },
  });

  const acknowledgedCount = criticalValues.filter(cv => cv.acknowledgedAt).length;
  const acknowledgedRate = criticalValues.length > 0 ? (acknowledgedCount / criticalValues.length) * 100 : 0;
  
  // Calculate average acknowledgment time
  let totalAcknowledgmentTime = 0;
  let acknowledgedValuesCount = 0;
  
  criticalValues.forEach(cv => {
    if (cv.acknowledgedAt) {
      const reportedTime = new Date(cv.reportedAt).getTime();
      const acknowledgedTime = new Date(cv.acknowledgedAt).getTime();
      const timeDiff = acknowledgedTime - reportedTime;
      totalAcknowledgmentTime += timeDiff;
      acknowledgedValuesCount++;
    }
  });
  
  const averageAcknowledgmentTime = acknowledgedValuesCount > 0 ? 
    totalAcknowledgmentTime / acknowledgedValuesCount / (1000 * 60) : 0; // in minutes

  // Group by parameter
  const parameterGroups: Record<string, number> = {};
  criticalValues.forEach(cv => {
    parameterGroups[cv.parameter] = (parameterGroups[cv.parameter] || 0) + 1;
  });
  
  const topParameters = Object.entries(parameterGroups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([parameter, count]) => ({
      parameter,
      count,
      percentage: parseFloat(((count / criticalValues.length) * 100).toFixed(2)),
    }));

  return {
    total: criticalValues.length,
    acknowledged: acknowledgedCount,
    acknowledgedRate: parseFloat(acknowledgedRate.toFixed(2)),
    averageAcknowledgmentTime: parseFloat(averageAcknowledgmentTime.toFixed(2)),
    topParameters,
  };
}

async function getTurnaroundTimeStatistics(dateFrom: Date, dateTo: Date) {
  const tests = await prisma.test.findMany({
    where: {
      requestedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
      status: {
        in: ["COMPLETED", "REPORTED", "VERIFIED", "DELIVERED"],
      },
    },
    include: {
      samples: true,
      results: {
        orderBy: {
          performedAt: "desc",
        },
        take: 1,
      },
    },
  });

  // Calculate turnaround times
  let totalRequestToCollectionTime = 0;
  let totalCollectionToResultTime = 0;
  let totalRequestToResultTime = 0;
  let testsWithSamples = 0;
  let testsWithResults = 0;

  tests.forEach(test => {
    const requestTime = new Date(test.requestedAt).getTime();
    
    // Sample collection time
    if (test.samples.length > 0) {
      const collectionTime = new Date(test.samples[0].collectedAt).getTime();
      totalRequestToCollectionTime += (collectionTime - requestTime) / (1000 * 60 * 60); // in hours
      testsWithSamples++;
      
      // Result time
      if (test.results.length > 0) {
        const resultTime = new Date(test.results[0].performedAt).getTime();
        totalCollectionToResultTime += (resultTime - collectionTime) / (1000 * 60 * 60); // in hours
      }
    }
    
    // Overall turnaround time
    if (test.results.length > 0) {
      const resultTime = new Date(test.results[0].performedAt).getTime();
      totalRequestToResultTime += (resultTime - requestTime) / (1000 * 60 * 60); // in hours
      testsWithResults++;
    }
  });

  const averageRequestToCollectionTime = testsWithSamples > 0 ? 
    totalRequestToCollectionTime / testsWithSamples : 0;
  
  const averageCollectionToResultTime = testsWithSamples > 0 ? 
    totalCollectionToResultTime / testsWithSamples : 0;
  
  const averageRequestToResultTime = testsWithResults > 0 ? 
    totalRequestToResultTime / testsWithResults : 0;

  return {
    averageRequestToCollectionTime: parseFloat(averageRequestToCollectionTime.toFixed(2)),
    averageCollectionToResultTime: parseFloat(averageCollectionToResultTime.toFixed(2)),
    averageRequestToResultTime: parseFloat(averageRequestToResultTime.toFixed(2)),
    testsAnalyzed: testsWithResults,
  };
}

async function getTopTests(dateFrom: Date, dateTo: Date) {
  const tests = await prisma.test.findMany({
    where: {
      requestedAt: {
        gte: dateFrom,
        lte: dateTo,
      },
    },
    include: {
      testCatalog: true,
    },
  });

  const testCounts: Record<string, { count: number, name: string, code: string }> = {};
  
  tests.forEach(test => {
    const testId = test.testCatalogId;
    if (!testCounts[testId]) {
      testCounts[testId] = {
        count: 0,
        name: test.testCatalog.name,
        code: test.testCatalog.code,
      };
    }
    testCounts[testId].count++;
  });

  return Object.entries(testCounts)
    .map(([id, data]) => ({
      id,
      name: data.name,
      code: data.code,
      count: data.count,
      percentage: parseFloat(((data.count / tests.length) * 100).toFixed(2)),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}
