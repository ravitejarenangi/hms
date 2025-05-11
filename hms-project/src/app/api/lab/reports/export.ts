import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import PDFDocument from "pdfkit";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();
    const { testId, includeHospitalLogo = true, includeDigitalSignature = true } = data;

    if (!testId) {
      return NextResponse.json(
        { error: "Test ID is required" },
        { status: 400 }
      );
    }

    // Fetch test data with all related information
    const test = await prisma.test.findUnique({
      where: { id: testId },
      include: {
        testCatalog: true,
        results: {
          orderBy: { parameter: "asc" },
        },
        samples: true,
      },
    });

    if (!test) {
      return NextResponse.json(
        { error: "Test not found" },
        { status: 404 }
      );
    }

    // Fetch patient data
    const patient = await prisma.patient.findFirst({
      where: { id: test.patientId },
      include: {
        user: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient not found" },
        { status: 404 }
      );
    }

    // Fetch doctor data
    const doctor = await prisma.user.findUnique({
      where: { id: test.requestedBy },
    });

    // Generate PDF
    const pdfBuffer = await generatePDF(test, patient, doctor, includeHospitalLogo, includeDigitalSignature);

    // Update test status to REPORTED if not already
    if (test.status !== "REPORTED" && test.status !== "VERIFIED" && test.status !== "DELIVERED") {
      await prisma.test.update({
        where: { id: testId },
        data: { status: "REPORTED" },
      });
    }

    // Return PDF as base64 encoded string
    return NextResponse.json({
      pdf: pdfBuffer.toString("base64"),
      filename: `${patient.patientId}_${test.testCatalog.code}_${new Date().toISOString().split("T")[0]}.pdf`,
    });
  } catch (error) {
    console.error("Error generating test report:", error);
    return NextResponse.json(
      { error: "Failed to generate test report" },
      { status: 500 }
    );
  }
}

async function generatePDF(test: any, patient: any, doctor: any, includeHospitalLogo: boolean, includeDigitalSignature: boolean) {
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50 });

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Add hospital logo if requested
      if (includeHospitalLogo) {
        // This is a placeholder - in a real implementation, you would load the hospital logo
        doc.fontSize(24).text("Hospital Logo", { align: "center" });
        doc.moveDown();
      }

      // Add report title
      doc.fontSize(18).text("Laboratory Test Report", { align: "center" });
      doc.moveDown();

      // Add horizontal line
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      doc.moveDown();

      // Add patient information
      doc.fontSize(12).text("Patient Information:", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Name: ${patient.user.name}`);
      doc.fontSize(10).text(`Patient ID: ${patient.patientId}`);
      doc.fontSize(10).text(`Gender: ${patient.user.profile?.gender || "Not specified"}`);
      doc.fontSize(10).text(`Date of Birth: ${patient.user.profile?.dateOfBirth ? new Date(patient.user.profile.dateOfBirth).toLocaleDateString() : "Not specified"}`);
      doc.moveDown();

      // Add test information
      doc.fontSize(12).text("Test Information:", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).text(`Test Name: ${test.testCatalog.name}`);
      doc.fontSize(10).text(`Test Code: ${test.testCatalog.code}`);
      doc.fontSize(10).text(`Requested By: ${doctor?.name || "Unknown"}`);
      doc.fontSize(10).text(`Requested Date: ${new Date(test.requestedAt).toLocaleDateString()}`);
      doc.fontSize(10).text(`Sample Collected: ${test.samples[0]?.collectedAt ? new Date(test.samples[0].collectedAt).toLocaleDateString() : "Not collected"}`);
      doc.fontSize(10).text(`Report Date: ${new Date().toLocaleDateString()}`);
      doc.moveDown();

      // Add horizontal line
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y).stroke();
      doc.moveDown();

      // Add test results
      doc.fontSize(12).text("Test Results:", { underline: true });
      doc.moveDown(0.5);

      // Create table header
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidths = [150, 100, 80, 150];
      const colHeaders = ["Parameter", "Value", "Unit", "Reference Range"];

      // Draw table header
      doc.fontSize(10).font("Helvetica-Bold");
      let xPos = tableLeft;
      colHeaders.forEach((header, i) => {
        doc.text(header, xPos, tableTop, { width: colWidths[i], align: "left" });
        xPos += colWidths[i];
      });
      doc.moveDown();

      // Draw table rows
      doc.font("Helvetica");
      let yPos = doc.y;
      test.results.forEach((result: any) => {
        xPos = tableLeft;
        
        // Highlight abnormal values
        if (result.isAbnormal || result.isCritical) {
          doc.fillColor(result.isCritical ? "red" : "#FF9900");
        } else {
          doc.fillColor("black");
        }

        doc.text(result.parameter, xPos, yPos, { width: colWidths[0], align: "left" });
        xPos += colWidths[0];
        
        doc.text(result.value, xPos, yPos, { width: colWidths[1], align: "left" });
        xPos += colWidths[1];
        
        doc.text(result.unit || "", xPos, yPos, { width: colWidths[2], align: "left" });
        xPos += colWidths[2];
        
        doc.text(result.referenceRange || "", xPos, yPos, { width: colWidths[3], align: "left" });
        
        // Reset color
        doc.fillColor("black");
        
        yPos = doc.y + 15;
        doc.moveDown();
      });

      doc.moveDown();

      // Add interpretation if available
      const hasInterpretation = test.results.some((r: any) => r.interpretation);
      if (hasInterpretation) {
        doc.fontSize(12).text("Interpretation:", { underline: true });
        doc.moveDown(0.5);
        
        test.results.forEach((result: any) => {
          if (result.interpretation) {
            doc.fontSize(10).text(`${result.parameter}: ${result.interpretation}`);
          }
        });
        
        doc.moveDown();
      }

      // Add notes
      const hasNotes = test.results.some((r: any) => r.notes);
      if (hasNotes) {
        doc.fontSize(12).text("Notes:", { underline: true });
        doc.moveDown(0.5);
        
        test.results.forEach((result: any) => {
          if (result.notes) {
            doc.fontSize(10).text(`${result.parameter}: ${result.notes}`);
          }
        });
        
        doc.moveDown();
      }

      // Add signature section
      doc.moveDown();
      doc.fontSize(12).text("Verified By:", { underline: true });
      doc.moveDown(0.5);
      
      // Get the name of the person who verified the results
      const verifiedResult = test.results.find((r: any) => r.verifiedBy);
      const verifierName = verifiedResult ? "Dr. " + verifiedResult.verifiedBy : "Pending Verification";
      
      if (includeDigitalSignature && verifiedResult) {
        // This is a placeholder - in a real implementation, you would load the digital signature
        doc.fontSize(10).text("Digital Signature", { align: "center" });
        doc.moveDown();
      }
      
      doc.fontSize(10).text(verifierName, { align: "center" });
      doc.moveDown();
      
      // Add footer
      doc.fontSize(8).text("This is a computer-generated report and does not require a physical signature.", { align: "center" });
      doc.fontSize(8).text("Please consult with your healthcare provider to interpret these results.", { align: "center" });

      // Finalize the PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
