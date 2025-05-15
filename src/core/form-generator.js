/**
 * Form generator - Creates HTML forms from Zod schemas
 */

const schemaParser = require('./schema-parser');
const renderer = require('./renderer');
const { defaultTemplates } = require('../templates/default');
const { darkTheme } = require('../styles/dark');

/**
 * Generate a form from a Zod schema
 */
const generate = (schema, options = {}) => {
  // Merge options with defaults
  const mergedOptions = {
    action: '#',
    method: 'POST',
    submitLabel: 'Submit',
    theme: 'dark',
    layout: 'vertical',
    ...options
  };

  // Parse the schema into field definitions
  const fields = schemaParser.parseSchema(schema);

  // Apply field-specific options if provided
  if (mergedOptions.fieldOptions) {
    Object.entries(mergedOptions.fieldOptions).forEach(([fieldName, fieldOptions]) => {
      if (fields[fieldName]) {
        fields[fieldName] = {
          ...fields[fieldName],
          ...fieldOptions
        };
      }
    });
  }

  // Generate HTML using the renderer
  const { html, styles, scripts } = renderer.renderForm(fields, mergedOptions);

  return {
    html,
    styles,
    scripts,
    fields, // Include parsed fields for potential programmatic use
    schema // Include original schema for reference
  };
};

/**
 * Generate a specific form field from a Zod schema type
 */
const generateField = (fieldName, zodType, options = {}) => {
  const fieldType = schemaParser.mapZodTypeToHtmlElement(zodType);
  const validationRules = schemaParser.extractValidationRules(zodType);

  const field = {
    name: fieldName,
    path: fieldName,
    ...fieldType,
    validation: validationRules,
    _zodType: zodType
  };

  return renderer.renderField(field, options);
};

module.exports = {
  generate,
  generateField
};
