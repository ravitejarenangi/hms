import React, { useState } from 'react';
import { Box, Button, Typography, Table, TableBody, TableCell, TableHead, TableRow, TextField } from '@mui/material';
import { GSTInvoice } from './GSTInvoice';
import { GSTService } from '../../services/GSTService';
import { PaymentHandler } from './PaymentHandler';

export const BillingSystem = () => {
  const [items, setItems] = useState([
    { name: '', amount: 0, category: '' }
  ]);
  const [billingState, setBillingState] = useState('');
  const [patientState, setPatientState] = useState('');

  const addItem = () => {
    setItems([...items, { name: '', amount: 0, category: '' }]);
  };

  const generateInvoice = () => {
    // Invoice generation logic
  };

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Box p={3}>
      <Typography variant="h4">Medical Billing</Typography>
      
      {/* State inputs */}
      <TextField 
        label="Billing State"
        value={billingState}
        onChange={(e) => setBillingState(e.target.value)}
      />
      <TextField 
        label="Patient State"
        value={patientState}
        onChange={(e) => setPatientState(e.target.value)}
      />

      {/* Items table */}
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Category</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => (
            <TableRow key={index}>
              <TableCell>
                <TextField
                  value={item.name}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].name = e.target.value;
                    setItems(newItems);
                  }}
                />
              </TableCell>
              <TableCell>
                <TextField
                  type="number"
                  value={item.amount}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].amount = Number(e.target.value);
                    setItems(newItems);
                  }}
                />
              </TableCell>
              <TableCell>
                <TextField
                  value={item.category}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[index].category = e.target.value;
                    setItems(newItems);
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <Button onClick={addItem}>Add Item</Button>
      <Button variant="contained" onClick={generateInvoice}>
        Generate Invoice
      </Button>

      <GSTInvoice 
        items={items}
        billingState={billingState}
        patientState={patientState}
      />
      <PaymentHandler amount={totalAmount} />
    </Box>
  );
};
