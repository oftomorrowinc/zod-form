/**
 * HTMX integration for ZodForm
 */

/**
 * Generate HTMX attributes for a form field based on its type and validation requirements
 *
 * @param {object} field - Field definition
 * @param {object} options - Configuration options
 * @returns {object} - HTMX attributes
 */
const generateHtmxAttributes = (field, options = {}) => {
  const baseUrl = options.baseUrl || '';
  const attributes = {};

  // Common attributes for most inputs
  if (['text', 'email', 'url', 'number', 'date', 'textarea'].includes(field.type)) {
    attributes['hx-post'] = `${baseUrl}/api/validate/${field.name}`;
    attributes['hx-trigger'] = 'blur';
    attributes['hx-target'] = 'next .zf-error';
  }

  // For select, checkbox, and radio inputs, use change event
  if (['select', 'checkbox', 'radio'].includes(field.type)) {
    attributes['hx-post'] = `${baseUrl}/api/validate/${field.name}`;
    attributes['hx-trigger'] = 'change';
    attributes['hx-target'] = 'next .zf-error';
  }

  // For file inputs, add encoding
  if (field.type === 'file') {
    attributes['hx-post'] = `${baseUrl}/api/validate/${field.name}`;
    attributes['hx-trigger'] = 'change';
    attributes['hx-target'] = 'next .zf-error';
    attributes['hx-encoding'] = 'multipart/form-data';
  }

  // For conditional fields, add visibility control
  if (field.showWhen) {
    const { dependsOn, value } = field.showWhen;
    attributes['hx-get'] = `${baseUrl}/api/field-visibility/${field.name}`;
    attributes['hx-trigger'] = `${dependsOn}:change`;
    attributes['hx-target'] = 'closest .zf-field';
    attributes['hx-swap'] = 'outerHTML';
    attributes['hx-include'] = `[name="${dependsOn}"]`;
  }

  return attributes;
};

/**
 * Generate HTMX attributes for a form
 *
 * @param {object} options - Form options
 * @returns {object} - HTMX attributes
 */
const generateFormAttributes = (options = {}) => {
  const attributes = {};

  // Basic form submission
  if (options.action) {
    attributes['hx-post'] = options.action;
    attributes['hx-target'] = options.target || '#form-response';
    attributes['hx-swap'] = options.swap || 'innerHTML';
  }

  // Add loading indicator
  if (options.showLoadingIndicator !== false) {
    attributes['hx-indicator'] = options.indicator || '.zf-loading';
  }

  // Disable form during submission
  if (options.disableDuringSubmit !== false) {
    attributes['hx-disabled-elt'] = 'find button, find input, find select, find textarea';
  }

  return attributes;
};

/**
 * Generate conditional field visibility logic
 *
 * @param {object} fields - Form fields
 * @param {object} conditionalLogic - Conditional logic rules
 * @returns {string} - JavaScript for conditional logic
 */
const generateConditionalLogic = (fields, conditionalLogic = {}) => {
  if (!conditionalLogic || Object.keys(conditionalLogic).length === 0) {
    return '';
  }

  let js = `
    document.addEventListener('DOMContentLoaded', function() {
      const updateConditionalFields = function() {
  `;

  // Generate code for each conditional field
  Object.entries(conditionalLogic).forEach(([fieldName, condition]) => {
    const { show, equals, notEquals } = condition;

    js += `
      // Logic for ${fieldName}
      (function() {
        const controlField = document.querySelector('[name="${show}"]');
        const targetField = document.querySelector('#field-${fieldName}');
        
        if (!controlField || !targetField) {
          console.warn('Conditional field not found', { controlField: '${show}', targetField: '${fieldName}' });
          return;
        }
        
        const updateVisibility = function() {
          let value = controlField.type === 'checkbox' ? controlField.checked : controlField.value;
          let shouldShow = false;
    `;

    if (equals !== undefined) {
      js += `
        if (value === "${equals}") shouldShow = true;
      `;
    }

    if (notEquals !== undefined) {
      js += `
        if (value !== "${notEquals}") shouldShow = true;
      `;
    }

    js += `
          // Set visibility with transition
          if (shouldShow) {
            targetField.style.display = 'block';
            // Add a small delay to let display take effect before adding opacity
            setTimeout(() => {
              targetField.style.opacity = '1';
            }, 10);
          } else {
            targetField.style.opacity = '0';
            targetField.style.transition = 'opacity 0.2s ease-out';
            // After the transition completes, hide the element
            setTimeout(() => {
              targetField.style.display = 'none';
            }, 200);
          }
          
          // Disable/enable fields based on visibility for proper validation
          const inputs = targetField.querySelectorAll('input, select, textarea');
          inputs.forEach(input => {
            if (shouldShow) {
              input.disabled = false;
            } else {
              input.disabled = true;
            }
          });
        };
        
        // Style setup for transitions
        targetField.style.transition = 'opacity 0.2s ease-in';
        
        // Set initial state
        let initialValue = controlField.type === 'checkbox' ? controlField.checked : controlField.value;
        let initialShow = ${equals !== undefined ? `initialValue === "${equals}"` : `initialValue !== "${notEquals}"`};
        
        targetField.style.display = initialShow ? 'block' : 'none';
        targetField.style.opacity = initialShow ? '1' : '0';
        
        // Add change event listener
        controlField.addEventListener('change', updateVisibility);
        
        // For radio buttons, we need to listen to all options
        if (controlField.type === 'radio') {
          document.querySelectorAll('input[name="${show}"]').forEach(radio => {
            radio.addEventListener('change', updateVisibility);
          });
        }
      })();
    `;
  });

  js += `
      };
      
      // Run once on page load
      updateConditionalFields();
    });
  `;

  return js;
};

/**
 * Generate HTMX-powered array field management code
 *
 * @param {string} fieldName - Array field name
 * @param {object} options - Configuration options
 * @returns {string} - JavaScript for array management
 */
const generateArrayFieldCode = (fieldName, options = {}) => {
  const baseUrl = options.baseUrl || '';

  return `
    // Array field management for ${fieldName}
    (function() {
      const container = document.getElementById('${fieldName}-container');
      const itemsContainer = document.getElementById('${fieldName}-items');
      const addButton = container.querySelector('.zf-add-item');
      
      if (!container || !itemsContainer || !addButton) return;
      
      // Keep track of the index for new items
      let nextIndex = itemsContainer.children.length;
      
      // Handler for adding new items
      addButton.addEventListener('click', function() {
        const request = new XMLHttpRequest();
        request.open('GET', '${baseUrl}/api/add-item?name=${fieldName}&index=' + nextIndex);
        request.onload = function() {
          if (request.status >= 200 && request.status < 400) {
            // Success!
            itemsContainer.insertAdjacentHTML('beforeend', request.responseText);
            nextIndex++;
            
            // Add event listeners to the new remove button
            const newItem = itemsContainer.lastElementChild;
            const removeButton = newItem.querySelector('.zf-remove-item');
            if (removeButton) {
              removeButton.addEventListener('click', function() {
                newItem.remove();
              });
            }
          }
        };
        request.send();
      });
      
      // Add event listeners to existing remove buttons
      Array.from(container.querySelectorAll('.zf-remove-item')).forEach(button => {
        button.addEventListener('click', function() {
          const item = this.closest('.zf-array-item');
          item.remove();
        });
      });
    })();
  `;
};

module.exports = {
  generateHtmxAttributes,
  generateFormAttributes,
  generateConditionalLogic,
  generateArrayFieldCode
};
