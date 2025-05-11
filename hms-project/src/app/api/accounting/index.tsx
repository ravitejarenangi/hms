import { NextRequest, NextResponse } from 'next/server';

/**
 * Central accounting API route.
 * Delegates to submodules for chart of accounts, journals, ledgers, reports, analytics, etc.
 */
export async function GET(req: NextRequest) {
  return NextResponse.json({
    message: 'Accounting API root. Use /chart-of-accounts, /journal-entries, /ledger, /financial-years, /reports, /analytics for specific operations.'
  });
}

export async function POST(req: NextRequest) {
  // Optionally route to create new accounting records
  return NextResponse.json({ message: 'POST not implemented at root. Use specific subroutes.' }, { status: 501 });
}

export async function PUT(req: NextRequest) {
  return NextResponse.json({ message: 'PUT not implemented at root. Use specific subroutes.' }, { status: 501 });
}

export async function DELETE(req: NextRequest) {
  return NextResponse.json({ message: 'DELETE not implemented at root. Use specific subroutes.' }, { status: 501 });
}
