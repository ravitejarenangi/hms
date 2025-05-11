import React from 'react';
import { Box, Paper, Typography, Tabs, Tab } from '@mui/material';

import ChartOfAccounts from './ChartOfAccounts';
import JournalEntrySystem from './JournalEntrySystem';
import LedgerManagement from './LedgerManagement';
import FinancialReporting from './FinancialReporting';
import FinancialAnalytics from './FinancialAnalytics';

const sections = [
  {
    label: 'Chart of Accounts',
    component: <ChartOfAccounts />,
  },
  {
    label: 'Journal Entries',
    component: <JournalEntrySystem />,
  },
  {
    label: 'Ledger Management',
    component: <LedgerManagement />,
  },
  {
    label: 'Financial Reporting',
    component: <FinancialReporting />,
  },
  {
    label: 'Financial Analytics',
    component: <FinancialAnalytics />,
  },
];

const AccountingSystem: React.FC = () => {
  const [tab, setTab] = React.useState(0);
  return (
    <Paper elevation={3} sx={{ p: 3, mt: 2 }}>
      <Typography variant="h4" gutterBottom>
        Accounting System
      </Typography>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        aria-label="Accounting System Tabs"
        sx={{ mb: 2 }}
      >
        {sections.map((s, idx) => (
          <Tab key={s.label} label={s.label} />
        ))}
      </Tabs>
      <Box sx={{ mt: 2 }}>{sections[tab].component}</Box>
    </Paper>
  );
};

export default AccountingSystem;
