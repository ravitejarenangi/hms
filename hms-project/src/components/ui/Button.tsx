"use client";

import React from "react";
import { Button as MuiButton, ButtonProps as MuiButtonProps, CircularProgress } from "@mui/material";

// Map our custom variants to MUI variants and colors
const variantMapping = {
  primary: { variant: "contained", color: "primary" },
  secondary: { variant: "contained", color: "secondary" },
  success: { variant: "contained", color: "success" },
  warning: { variant: "contained", color: "warning" },
  danger: { variant: "contained", color: "error" },
  outline: { variant: "outlined", color: "primary" },
};

// Map our custom sizes to MUI sizes
const sizeMapping = {
  sm: "small",
  md: "medium",
  lg: "large",
};

interface ButtonProps extends Omit<MuiButtonProps, "variant" | "color" | "size"> {
  variant?: keyof typeof variantMapping;
  size?: keyof typeof sizeMapping;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}) => {
  // Get MUI variant and color from our custom variant
  const { variant: muiVariant, color: muiColor } = variantMapping[variant];

  // Get MUI size from our custom size
  const muiSize = sizeMapping[size];

  return (
    <MuiButton
      variant={muiVariant as any}
      color={muiColor as any}
      size={muiSize as any}
      disabled={disabled || isLoading}
      startIcon={!isLoading && leftIcon ? leftIcon : undefined}
      endIcon={!isLoading && rightIcon ? rightIcon : undefined}
      {...props}
    >
      {isLoading && (
        <CircularProgress
          size={24}
          color="inherit"
          sx={{ mr: 1 }}
        />
      )}
      {children}
    </MuiButton>
  );
};

export default Button;
