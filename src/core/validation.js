/**
 * Validation utilities for ZodForm
 */

const { z } = require('zod');

/**
 * Express middleware for validating form submissions against a Zod schema
 */
const expressMiddleware = (schema) => {
  return (req, res, next) => {
    try {
      // Parse request body using the provided schema
      const result = schema.parse(req.body);

      // Store the validated data back on the request
      req.validatedData = result;

      // Validation passed, proceed to the next middleware
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Format Zod errors into a more user-friendly format
        const formattedErrors = formatZodErrors(error);

        // Store formatted errors on request for potential use by other middleware
        req.validationErrors = formattedErrors;

        // Check if this is an HTMX request for field validation
        if (req.headers['hx-request'] && req.headers['hx-trigger-name']) {
          // This is a field-level validation, return just the error for that field
          const fieldName = req.headers['hx-trigger-name'];
          const fieldError = formattedErrors[fieldName];

          if (fieldError) {
            return res.status(400).send(`<div class="zf-error">${fieldError}</div>`);
          } else {
            // No error for this field
            return res.send('<div class="zf-error"></div>');
          }
        }

        // For HTMX form submissions, return validation errors that can be displayed in the form
        if (req.headers['hx-request']) {
          let errorHtml = '<div class="zf-alert zf-alert-error">';
          errorHtml += '<h3>Please correct the following errors:</h3>';
          errorHtml += '<ul>';

          Object.entries(formattedErrors).forEach(([field, message]) => {
            errorHtml += `<li>${message}</li>`;
          });

          errorHtml += '</ul></div>';

          return res.status(400).send(errorHtml);
        }

        // For API requests, return errors as JSON
        return res.status(400).json({
          success: false,
          errors: formattedErrors
        });
      }

      // If it's not a validation error, pass it to the next error handler
      next(error);
    }
  };
};

/**
 * Format Zod errors into a more user-friendly format
 */
const formatZodErrors = (error) => {
  const formattedErrors = {};

  error.errors.forEach((err) => {
    // Get the field name from the path
    const fieldName = err.path.join('.');

    // Store the error message
    formattedErrors[fieldName] = err.message;
  });

  return formattedErrors;
};

/**
 * Validate a single value against a Zod schema
 */
const validateField = (schema, fieldPath, value) => {
  try {
    // For nested fields, we need to reconstruct the object structure
    const pathParts = fieldPath.split('.');
    const fieldName = pathParts[pathParts.length - 1];

    // Create an object with just this field
    let fieldObject = { [fieldName]: value };

    // Extract just the part of the schema for this field
    let fieldSchema;
    if (pathParts.length === 1) {
      fieldSchema = z.object({ [fieldName]: schema.shape[fieldName] });
    } else {
      // For nested fields, we'd need to navigate the schema structure
      // This is a simplified version and might need enhancement for deeply nested objects
      fieldSchema = z.object({ [fieldName]: schema });
    }

    // Validate
    fieldSchema.parse(fieldObject);
    return { valid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: formatZodErrors(error)
      };
    }
    throw error;
  }
};

module.exports = {
  expressMiddleware,
  validateField,
  formatZodErrors
};
