/**
 * ZodForm - An opinionated form generation and validation library
 * for Node.js applications using HTMX, Express, and Zod.
 */

const formGenerator = require('./core/form-generator');
const validation = require('./core/validation');
const firestoreIntegration = require('./integrations/firestore');
const modalUtils = require('./templates/modal');

/**
 * Generate a form from a Zod schema
 */
const zodForm = (schema, options = {}) => {
  return formGenerator.generate(schema, options);
};

/**
 * Generate a modal form from a Zod schema
 */
zodForm.modal = (schema, options = {}) => {
  return modalUtils.generateModal(schema, options);
};

/**
 * Express middleware for validating form submissions against a Zod schema
 */
zodForm.validate = (schema) => {
  return validation.expressMiddleware(schema);
};

/**
 * Firebase Firestore integration
 */
const firestoreSchemas = {
  saveSchema: firestoreIntegration.saveSchema,
  getSchema: firestoreIntegration.getSchema,
  listSchemas: firestoreIntegration.listSchemas,
  deleteSchema: firestoreIntegration.deleteSchema
};

module.exports = {
  zodForm,
  firestoreSchemas
};
