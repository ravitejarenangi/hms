import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { checkUserPermission } from '@/lib/permissions';

// Store connected clients
const clients = new Set<{
  id: string;
  controller: ReadableStreamController<any>;
}>();

// Function to send event to all connected clients
export const sendEventToAll = (event: string, data: any) => {
  const eventData = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  
  clients.forEach(client => {
    try {
      client.controller.enqueue(eventData);
    } catch (error) {
      console.error(`Error sending event to client ${client.id}:`, error);
    }
  });
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Check if user has permission to access pharmacy inventory
  const hasPermission = await checkUserPermission(session.user.id, 'pharmacy:read');
  
  if (!hasPermission) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Set up SSE headers
  const responseHeaders = {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  };
  
  // Create a new client ID
  const clientId = crypto.randomUUID();
  
  // Create a new stream
  const stream = new ReadableStream({
    start(controller) {
      // Add this client to the set
      clients.add({ id: clientId, controller });
      
      // Send initial connection message
      controller.enqueue(`event: connected\ndata: {"clientId": "${clientId}"}\n\n`);
      
      // Send recent inventory updates as initial data
      sendRecentUpdates(controller);
    },
    cancel() {
      // Remove this client when the connection is closed
      clients.forEach(client => {
        if (client.id === clientId) {
          clients.delete(client);
        }
      });
    }
  });
  
  return new Response(stream, { headers: responseHeaders });
}

// Function to send recent inventory updates to a new client
async function sendRecentUpdates(controller: ReadableStreamController<any>) {
  try {
    // Get recent inventory transactions
    const recentTransactions = await prisma.inventoryTransaction.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      include: {
        medicine: true,
        batch: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 10
    });
    
    // Get low stock alerts
    const lowStockItems = await prisma.pharmacyInventory.findMany({
      where: {
        currentStock: {
          lte: 10 // Example threshold
        }
      },
      include: {
        medicine: true
      },
      take: 5
    });
    
    // Get expiring batches
    const expiringBatches = await prisma.medicineBatch.findMany({
      where: {
        expiryDate: {
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
        },
        quantity: {
          gt: 0
        }
      },
      include: {
        medicine: true
      },
      take: 5
    });
    
    // Send recent transactions
    recentTransactions.forEach(transaction => {
      const eventData = {
        id: transaction.id,
        medicine: {
          id: transaction.medicine.id,
          name: transaction.medicine.name
        },
        action: transaction.type,
        quantity: transaction.quantity,
        currentStock: transaction.balanceAfter,
        timestamp: transaction.createdAt
      };
      
      controller.enqueue(`event: inventory-update\ndata: ${JSON.stringify(eventData)}\n\n`);
    });
    
    // Send low stock alerts
    lowStockItems.forEach(item => {
      const eventData = {
        id: item.id,
        medicine: {
          id: item.medicine.id,
          name: item.medicine.name
        },
        alertType: item.currentStock === 0 ? 'STOCK_OUT' : 'LOW_STOCK',
        currentStock: item.currentStock,
        timestamp: new Date()
      };
      
      controller.enqueue(`event: stock-alert\ndata: ${JSON.stringify(eventData)}\n\n`);
    });
    
    // Send expiring batches
    expiringBatches.forEach(batch => {
      const eventData = {
        id: batch.id,
        medicine: {
          id: batch.medicine.id,
          name: batch.medicine.name
        },
        batch: {
          id: batch.id,
          batchNumber: batch.batchNumber,
          expiryDate: batch.expiryDate
        },
        quantity: batch.quantity,
        timestamp: new Date()
      };
      
      controller.enqueue(`event: batch-expiry\ndata: ${JSON.stringify(eventData)}\n\n`);
    });
    
  } catch (error) {
    console.error('Error sending recent updates:', error);
  }
}
