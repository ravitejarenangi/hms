import { NextRequest, NextResponse } from 'next/server';

// Example in-memory data for departments (replace with DB integration as needed)
const departments = [
  { id: 1, name: 'OPD' },
  { id: 2, name: 'IPD' },
  { id: 3, name: 'Operation Theater' },
  { id: 4, name: 'Emergency Department' },
  { id: 5, name: 'Pathology' },
  { id: 6, name: 'Radiology' },
  { id: 7, name: 'Pharmacy' },
  { id: 8, name: 'Physiotherapy' },
  { id: 9, name: 'Dental' },
];

export async function GET(req: NextRequest) {
  // Optionally filter/search departments
  return NextResponse.json(departments);
}

export async function POST(req: NextRequest) {
  // To be implemented: Add a new department (with DB integration)
  return NextResponse.json({ message: 'POST not implemented' }, { status: 501 });
}

export async function PUT(req: NextRequest) {
  // To be implemented: Update department details
  return NextResponse.json({ message: 'PUT not implemented' }, { status: 501 });
}

export async function DELETE(req: NextRequest) {
  // To be implemented: Delete department
  return NextResponse.json({ message: 'DELETE not implemented' }, { status: 501 });
}
