import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Hello from the API!',
    timestamp: new Date().toISOString(),
  });
}
