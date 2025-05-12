import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';

export interface GridItemProps {
  children: React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
  sx?: SxProps<Theme>;
}

/**
 * A wrapper component that simulates a Grid item for MUI v5 using flexbox
 */
export const GridItem: React.FC<GridItemProps> = ({ children, xs = 12, sm, md, lg, xl, sx }) => {
  // Calculate the width percentage based on the grid size (out of 12 columns)
  const getWidth = (columns: number | undefined) => columns ? `${(columns / 12) * 100}%` : undefined;
  
  return (
    <Box 
      sx={{
        // Responsive width based on breakpoints
        width: getWidth(xs),
        ...(sm && { '@media (min-width: 600px)': { width: getWidth(sm) } }),
        ...(md && { '@media (min-width: 900px)': { width: getWidth(md) } }),
        ...(lg && { '@media (min-width: 1200px)': { width: getWidth(lg) } }),
        ...(xl && { '@media (min-width: 1536px)': { width: getWidth(xl) } }),
        // Add any additional styles from the sx prop
        ...(sx || {})
      }}
    >
      {children}
    </Box>
  );
};

export interface GridContainerProps {
  children: React.ReactNode;
  spacing?: number;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
  sx?: SxProps<Theme>;
}

/**
 * A wrapper component that simulates a Grid container for MUI v5 using flexbox
 */
export const GridContainer: React.FC<GridContainerProps> = ({ 
  children, 
  spacing = 0, 
  alignItems = 'stretch',
  justifyContent = 'flex-start',
  sx 
}) => {
  // Convert spacing to actual pixel values (MUI uses 8px as base)
  const gapSize = spacing * 8;
  
  return (
    <Box 
      sx={{
        display: 'flex', 
        flexWrap: 'wrap',
        alignItems,
        justifyContent,
        gap: gapSize,
        width: '100%',
        // Add any additional styles from the sx prop
        ...(sx || {})
      }}
    >
      {children}
    </Box>
  );
};
