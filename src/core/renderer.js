/**
 * Renderer - Turns form definitions into HTML
 */

const { defaultTemplates } = require('../templates/default');
const { darkTheme } = require('../styles/dark');
const { lightTheme } = require('../styles/light');

// Import element renderers - we'll lazy load them to avoid circular dependencies
let elements = null;

/**
 * Generate HTML attributes string from an object
 */
const attributesToString = (attributes) => {
  return Object.entries(attributes)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => {
      if (typeof value === 'boolean') {
        return value ? key : '';
      }
      return `${key}="${String(value).replace(/"/g, '&quot;')}"`;
    })
    .filter(Boolean)
    .join(' ');
};

/**
 * Prepare templates with proper options
 */
const prepareTemplates = (options) => {
  const templates = {
    ...defaultTemplates,
    ...(options.templates || {})
  };

  return templates;
};

/**
 * Prepare CSS classes with proper options
 */
const prepareClasses = (options) => {
  const defaultClasses = {
    form: 'zf-form',
    field: 'zf-field',
    label: 'zf-label',
    input: 'zf-input',
    select: 'zf-select',
    checkbox: 'zf-checkbox',
    radio: 'zf-radio',
    button: 'zf-button',
    error: 'zf-error',
    array: 'zf-array',
    arrayItem: 'zf-array-item',
    arrayControls: 'zf-array-controls',
    fieldset: 'zf-fieldset',
    legend: 'zf-legend',
    submitButton: 'zf-submit-button'
  };

  const customClasses = options.customClasses || {};

  return {
    ...defaultClasses,
    ...customClasses
  };
};

/**
 * Prepare CSS styles
 */
const prepareStyles = (options) => {
  const theme = options.theme === 'light' ? lightTheme : darkTheme;
  const customStyles = options.customStyles || '';

  // Add fix for container width issues
  const fixStyles = `
    /* Fix for container width issues */
    .zf-form {
      box-sizing: border-box;
      max-width: 100%;
    }
    
    .zf-form *,
    .zf-form *::before,
    .zf-form *::after {
      box-sizing: border-box;
    }
    
    .zf-input,
    .zf-select,
    .zf-textarea {
      box-sizing: border-box;
      max-width: 100%;
      width: 100%;
    }
  `;

  return `${theme}${fixStyles}${customStyles}`;
};

/**
 * Render a single form field
 */
const renderField = (field, options = {}) => {
  const templates = prepareTemplates(options);
  const classes = prepareClasses(options);

  // Lazy-load elements to avoid circular dependencies
  if (elements === null) {
    elements = require('../elements');
  }

  // Delegate to the appropriate element renderer
  if (elements[field.type]) {
    return elements[field.type](field, {
      ...options,
      templates,
      classes
    });
  }

  // Fallback to text input
  return elements.text(field, {
    ...options,
    templates,
    classes
  });
};

/**
 * Render a complete form
 */
const renderForm = (fields, options = {}) => {
  const templates = prepareTemplates(options);
  const classes = prepareClasses(options);
  const styles = prepareStyles(options);

  // Generate form attributes
  const formAttributes = {
    action: options.action || '#',
    method: options.method || 'POST',
    class: classes.form,
    ...(options.enctype ? { enctype: options.enctype } : {}),
    ...(options.id ? { id: options.id } : {}),
    ...(options.attributes || {})
  };

  if (options.layout === 'horizontal') {
    formAttributes.class += ' zf-horizontal';
  }

  // Render each field
  const fieldHtml = Object.values(fields)
    .map((field) =>
      renderField(field, {
        ...options,
        templates,
        classes
      })
    )
    .join('');

  // Add submit button
  const submitButtonHtml = templates.submitButton({
    label: options.submitLabel || 'Submit',
    classes
  });

  // Combine everything into the form template
  const formHtml = templates.form({
    attributes: attributesToString(formAttributes),
    content: `${fieldHtml}${submitButtonHtml}`,
    classes
  });

  // Generate scripts for client-side validation
  const scriptsHtml = `
    <script>
      ${generateClientValidation(fields, options)}
    </script>
  `;

  // Generate styles
  const stylesHtml = `
    <style>
      ${styles}
    </style>
  `;

  return {
    html: formHtml,
    styles: stylesHtml,
    scripts: scriptsHtml
  };
};

/**
 * Generate client-side validation code
 */
const generateClientValidation = (fields, options) => {
  // Import htmx utilities
  let htmxUtils = null;
  try {
    htmxUtils = require('../integrations/htmx');
  } catch (error) {
    console.warn('HTMX integration not available', error);
  }

  // Generate a simplified validation script (no eval)
  let js = `
    document.addEventListener('DOMContentLoaded', function() {
      // Client-side validation with HTMX
      var formSelector = ${options.id ? `'#${options.id}'` : "'.zf-form'"};
      var form = document.querySelector(formSelector);
      if (!form) return;
      
      // Basic validation for required fields
      var requiredFields = form.querySelectorAll('[required]');
      for (var i = 0; i < requiredFields.length; i++) {
        requiredFields[i].addEventListener('blur', function() {
          validateField(this);
        });
      }
      
      // Form submission
      form.addEventListener('submit', function(e) {
        var isValid = true;
        var allFields = form.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled])');
        
        for (var i = 0; i < allFields.length; i++) {
          if (!validateField(allFields[i])) {
            isValid = false;
          }
        }
        
        if (!isValid && !e.submitter?.hasAttribute('hx-post')) {
          e.preventDefault();
        }
      });
      
      function validateField(field) {
        // Find the error element - may be nested in a container
        var errorElement = field.parentNode.querySelector('.zf-error');
        if (!errorElement && field.parentNode.parentNode) {
          errorElement = field.parentNode.parentNode.querySelector('.zf-error');
        }
        if (!errorElement) return true;
        
        var isValid = field.checkValidity();
        
        if (!isValid) {
          errorElement.textContent = field.validationMessage || 'This field is invalid';
          errorElement.style.display = 'block';
          field.classList.add('zf-invalid');
          return false;
        } else {
          errorElement.textContent = '';
          errorElement.style.display = 'none';
          field.classList.remove('zf-invalid');
          return true;
        }
      }
  `;

  // Add conditional logic if provided
  if (options.conditionalLogic && htmxUtils) {
    js += htmxUtils.generateConditionalLogic(fields, options.conditionalLogic);
  }

  js += `
    });
  `;

  return js;
};

module.exports = {
  renderForm,
  renderField,
  prepareTemplates,
  prepareClasses,
  prepareStyles
};
