"use client";

import React, { forwardRef } from "react";
import {
  TextField,
  TextFieldProps,
  InputAdornment,
  FormControl,
} from "@mui/material";

interface InputProps extends Omit<TextFieldProps, "error"> {
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      fullWidth = false,
      id,
      ...props
    },
    ref
  ) => {
    // Generate a unique ID if not provided
    const inputId = id || `input-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <FormControl fullWidth={fullWidth} error={!!error} sx={{ mb: 2 }}>
        <TextField
          id={inputId}
          label={label}
          variant="outlined"
          fullWidth={fullWidth}
          error={!!error}
          helperText={error || helperText}
          // Using slotProps instead of InputProps (which is deprecated)
          slotProps={{
            input: {
              startAdornment: leftIcon ? (
                <InputAdornment position="start">{leftIcon}</InputAdornment>
              ) : undefined,
              endAdornment: rightIcon ? (
                <InputAdornment position="end">{rightIcon}</InputAdornment>
              ) : undefined,
            }
          }}
          inputRef={ref}
          {...props}
        />
      </FormControl>
    );
  }
);

Input.displayName = "Input";

export default Input;
