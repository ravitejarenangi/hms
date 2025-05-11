import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { GSTService } from '../../services/GSTService';

export const GSTInvoice = ({ items, billingState, patientState }) => {
  return (
    <Box p={3}>
      <Typography variant="h6">Tax Breakdown</Typography>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Item</TableCell>
            <TableCell>CGST</TableCell>
            <TableCell>SGST</TableCell>
            <TableCell>IGST</TableCell>
            <TableCell>Total Tax</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item, index) => {
            const tax = GSTService.calculateGST(
              item.amount,
              patientState,
              billingState !== patientState,
              item.category
            );
            return (
              <TableRow key={index}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{tax.cgst?.toFixed(2) || '-'}</TableCell>
                <TableCell>{tax.sgst?.toFixed(2) || '-'}</TableCell>
                <TableCell>{tax.igst?.toFixed(2) || '-'}</TableCell>
                <TableCell>{(tax.cgst + tax.sgst + tax.igst)?.toFixed(2)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Box>
  );
};
