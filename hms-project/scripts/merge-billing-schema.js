/**
 * Script to merge the billing schema with the main schema
 * 
 * This script reads the schema-billing.prisma file and appends its content
 * to the main schema.prisma file, ensuring there are no duplicates.
 */

const fs = require('fs');
const path = require('path');

// Paths to schema files
const mainSchemaPath = path.join(__dirname, '../prisma/schema.prisma');
const billingSchemaPath = path.join(__dirname, '../prisma/schema-billing.prisma');
const outputSchemaPath = path.join(__dirname, '../prisma/schema.prisma');

// Read schema files
const mainSchema = fs.readFileSync(mainSchemaPath, 'utf8');
const billingSchema = fs.readFileSync(billingSchemaPath, 'utf8');

// Extract enums and models from billing schema
const billingSchemaContent = billingSchema.split('\n');
let inEnum = false;
let inModel = false;
let currentEnum = '';
let currentModel = '';
const enums = [];
const models = [];
let buffer = [];

billingSchemaContent.forEach(line => {
  // Skip comments and empty lines at the top level
  if (!inEnum && !inModel && (line.trim().startsWith('//') || line.trim() === '')) {
    return;
  }

  // Detect enum start
  if (line.trim().startsWith('enum ') && line.includes('{')) {
    inEnum = true;
    currentEnum = line.trim().split(' ')[1].split('{')[0].trim();
    buffer = [line];
    return;
  }

  // Detect model start
  if (line.trim().startsWith('model ') && line.includes('{')) {
    inModel = true;
    currentModel = line.trim().split(' ')[1].split('{')[0].trim();
    buffer = [line];
    return;
  }

  // Collect lines for current enum or model
  if (inEnum || inModel) {
    buffer.push(line);
  }

  // Detect enum or model end
  if ((inEnum || inModel) && line.trim() === '}') {
    if (inEnum) {
      enums.push({ name: currentEnum, content: buffer.join('\n') });
      inEnum = false;
    } else if (inModel) {
      models.push({ name: currentModel, content: buffer.join('\n') });
      inModel = false;
    }
    buffer = [];
  }
});

// Check for duplicates in main schema
const mainSchemaContent = mainSchema.split('\n');
const existingEnums = [];
const existingModels = [];

let currentBlock = '';
let blockName = '';
let isEnum = false;
let isModel = false;
buffer = [];

mainSchemaContent.forEach(line => {
  // Detect enum start
  if (line.trim().startsWith('enum ') && line.includes('{')) {
    isEnum = true;
    blockName = line.trim().split(' ')[1].split('{')[0].trim();
    existingEnums.push(blockName);
    return;
  }

  // Detect model start
  if (line.trim().startsWith('model ') && line.includes('{')) {
    isModel = true;
    blockName = line.trim().split(' ')[1].split('{')[0].trim();
    existingModels.push(blockName);
    return;
  }

  // Detect enum or model end
  if ((isEnum || isModel) && line.trim() === '}') {
    if (isEnum) {
      isEnum = false;
    } else if (isModel) {
      isModel = false;
    }
    blockName = '';
  }
});

// Filter out duplicates
const newEnums = enums.filter(e => !existingEnums.includes(e.name));
const newModels = models.filter(m => !existingModels.includes(m.name));

// Append new enums and models to main schema
let updatedSchema = mainSchema;

if (newEnums.length > 0 || newModels.length > 0) {
  updatedSchema += '\n\n// ==================== Billing and Accounting Models ====================\n\n';
  
  // Add enums
  newEnums.forEach(e => {
    updatedSchema += e.content + '\n\n';
  });
  
  // Add models
  newModels.forEach(m => {
    updatedSchema += m.content + '\n\n';
  });
}

// Write updated schema to file
fs.writeFileSync(outputSchemaPath, updatedSchema);

console.log(`Schema merge complete.`);
console.log(`Added ${newEnums.length} enums and ${newModels.length} models from billing schema.`);
