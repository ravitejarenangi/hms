import React from 'react';
import { Grid } from '@mui/material';

interface GridItemProps {
  children: React.ReactNode;
  xs?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

/**
 * A wrapper component for MUI Grid that handles the correct props for MUI v5
 */
export const GridItem: React.FC<GridItemProps> = ({ children, xs, sm, md, lg, xl }) => {
  return (
    <Grid 
      item 
      sx={{ 
        flexBasis: {
          xs: xs ? `${(xs / 12) * 100}%` : '100%',
          sm: sm ? `${(sm / 12) * 100}%` : undefined,
          md: md ? `${(md / 12) * 100}%` : undefined,
          lg: lg ? `${(lg / 12) * 100}%` : undefined,
          xl: xl ? `${(xl / 12) * 100}%` : undefined,
        },
        maxWidth: {
          xs: xs ? `${(xs / 12) * 100}%` : '100%',
          sm: sm ? `${(sm / 12) * 100}%` : undefined,
          md: md ? `${(md / 12) * 100}%` : undefined,
          lg: lg ? `${(lg / 12) * 100}%` : undefined,
          xl: xl ? `${(xl / 12) * 100}%` : undefined,
        }
      }}
    >
      {children}
    </Grid>
  );
};

interface GridContainerProps {
  children: React.ReactNode;
  spacing?: number;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly';
}

/**
 * A wrapper component for MUI Grid container that handles the correct props for MUI v5
 */
export const GridContainer: React.FC<GridContainerProps> = ({ 
  children, 
  spacing = 2, 
  alignItems = 'flex-start',
  justifyContent = 'flex-start'
}) => {
  return (
    <Grid 
      container 
      spacing={spacing} 
      sx={{ 
        alignItems, 
        justifyContent 
      }}
    >
      {children}
    </Grid>
  );
};
