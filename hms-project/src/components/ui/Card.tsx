"use client";

import React from "react";
import {
  Card as MuiCard,
  CardProps as MuiCardProps,
  CardHeader as MuiCardHeader,
  CardHeaderProps as MuiCardHeaderProps,
  CardContent as MuiCardContent,
  CardContentProps as MuiCardContentProps,
  CardActions as MuiCardActions,
  CardActionsProps as MuiCardActionsProps,
} from "@mui/material";

interface CardProps extends MuiCardProps {
  children: React.ReactNode;
}

interface CardHeaderProps extends MuiCardHeaderProps {
  children?: React.ReactNode;
}

interface CardBodyProps extends MuiCardContentProps {
  children: React.ReactNode;
}

interface CardFooterProps extends MuiCardActionsProps {
  children: React.ReactNode;
}

// Create a custom Card component that extends MUI Card
const Card: React.FC<CardProps> & {
  Header: React.FC<CardHeaderProps>;
  Body: React.FC<CardBodyProps>;
  Footer: React.FC<CardFooterProps>;
} = ({ children, ...props }) => {
  return <MuiCard {...props}>{children}</MuiCard>;
};

// Create a custom CardHeader component that extends MUI CardHeader
const CardHeader: React.FC<CardHeaderProps> = ({ children, ...props }) => {
  // If children is a simple string or element, use it as the title
  if (typeof children === "string" || React.isValidElement(children)) {
    return <MuiCardHeader title={children} {...props} />;
  }

  // Otherwise, use the children as is
  return <MuiCardHeader {...props}>{children}</MuiCardHeader>;
};

// Create a custom CardBody component that extends MUI CardContent
const CardBody: React.FC<CardBodyProps> = ({ children, ...props }) => {
  return <MuiCardContent {...props}>{children}</MuiCardContent>;
};

// Create a custom CardFooter component that extends MUI CardActions
const CardFooter: React.FC<CardFooterProps> = ({ children, ...props }) => {
  return <MuiCardActions {...props}>{children}</MuiCardActions>;
};

// Assign the components to the Card
Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
