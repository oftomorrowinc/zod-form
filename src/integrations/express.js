/**
 * Express integration for ZodForm
 */

const formGenerator = require('../core/form-generator');
const { parseSchema } = require('../core/schema-parser');
const validation = require('../core/validation');

/**
 * Register HTMX API routes for form functionality
 *
 * @param {express.Router} router - Express router
 * @param {object} options - Configuration options
 */
const registerHtmxRoutes = (router, options = {}) => {
  // Field validation route
  router.post('/api/validate/:field', (req, res) => {
    const { field } = req.params;
    const { schema } = req.body;

    try {
      // Validate the field against the provided schema
      const result = validation.validateField(schema, field, req.body[field]);

      if (result.valid) {
        // Return empty error element for valid field
        return res.send('<div class="zf-error"></div>');
      } else {
        // Return error message
        const errorMessage = result.errors[field] || 'Invalid value';
        return res.send(`<div class="zf-error">${errorMessage}</div>`);
      }
    } catch (error) {
      console.error('Validation error:', error);
      return res.status(400).send(`<div class="zf-error">Validation error</div>`);
    }
  });

  // Array item management routes
  router.get('/api/add-item', (req, res) => {
    const { name, type = 'text' } = req.query;
    const index = parseInt(req.query.index || '0', 10);

    // Get the schema from the session if available
    const schema = req.session?.zodFormSchemas?.[name];

    // Create a new field
    const field = {
      name: `${name}[${index}]`,
      type
    };

    // Generate the field HTML
    const html = formGenerator.generateField(field.name, schema || {}, {
      ...options
    });

    return res.send(`
      <div class="zf-array-item" id="${name}-item-${index}">
        ${html}
        <button 
          type="button"
          class="zf-remove-item"
          hx-target="#${name}-item-${index}"
          hx-swap="outerHTML"
          hx-trigger="click"
          hx-delete="/api/remove-item?name=${name}&index=${index}"
        >
          Remove
        </button>
      </div>
    `);
  });

  router.delete('/api/remove-item', (req, res) => {
    // This just removes the item from the DOM, actual data handling happens on form submission
    res.send('');
  });

  // Modal management routes
  router.delete('/api/close-modal', (req, res) => {
    console.log('ZodForm: Modal close request received');
    // Just return empty content to replace the modal
    res.send('');
  });

  // Fallback for browsers that don't support DELETE method
  router.post('/api/close-modal', (req, res) => {
    console.log('ZodForm: Modal close request received (POST fallback)');
    // Just return empty content to replace the modal
    res.send('');
  });
};

/**
 * Middleware to parse file uploads for ZodForm
 */
const fileUploadMiddleware = (options = {}) => {
  // This is a simple implementation - in a real app, you might use multer or similar
  return (req, res, next) => {
    // Only process multipart forms
    if (!req.is('multipart/form-data')) {
      return next();
    }

    // Here you would typically use multer or another library to handle file uploads
    // For simplicity, we're just passing through
    next();
  };
};

/**
 * Store a schema in the session for use with dynamic forms
 */
const storeSchemaInSession = (req, schema, name) => {
  // Initialize schema storage if it doesn't exist
  if (!req.session.zodFormSchemas) {
    req.session.zodFormSchemas = {};
  }

  // Store the parsed schema
  req.session.zodFormSchemas[name] = parseSchema(schema);
};

/**
 * Retrieve a schema from the session
 */
const getSchemaFromSession = (req, name) => {
  return req.session?.zodFormSchemas?.[name];
};

module.exports = {
  registerHtmxRoutes,
  fileUploadMiddleware,
  storeSchemaInSession,
  getSchemaFromSession
};
