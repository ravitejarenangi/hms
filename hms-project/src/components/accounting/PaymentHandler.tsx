import React from 'react';
import Razorpay from 'razorpay';
import { Box, Button, Typography } from '@mui/material';

export const PaymentHandler = ({ amount }) => {
  const handlePayment = async () => {
    const options = {
      key: process.env.RAZORPAY_KEY_ID,
      amount: amount * 100,
      currency: 'INR',
      name: 'Hospital Name',
      description: 'Medical Services',
      handler: function(response) {
        alert('Payment ID: ' + response.razorpay_payment_id);
      },
      prefill: {
        name: 'Patient Name',
        email: 'patient@example.com',
        contact: '+919876543210'
      }
    };
    
    const rzp = new Razorpay(options);
    rzp.open();
  };

  return (
    <Box mt={3}>
      <Button 
        variant="contained" 
        color="success"
        onClick={handlePayment}
      >
        Pay ₹{amount}
      </Button>
    </Box>
  );
};
