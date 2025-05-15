/**
 * Modal dialog templates for ZodForm
 */

const formGenerator = require('../core/form-generator');

/**
 * Template for modal container
 */
const modalTemplate = ({ title, content, formHtml, cancelLabel = 'Cancel', classes = {} }) => `
  <div class="zf-modal-overlay" id="zf-modal-overlay">
    <div class="zf-modal" role="dialog" aria-labelledby="zf-modal-title">
      <div class="zf-modal-header">
        <h3 id="zf-modal-title">${title}</h3>
        <button type="button" class="zf-modal-close" aria-label="Close" 
          hx-post="/api/close-modal" 
          hx-target="#zf-modal-overlay" 
          hx-swap="outerHTML">×</button>
      </div>
      <div class="zf-modal-body">
        ${content || formHtml}
      </div>
      <div class="zf-modal-footer">
        <button type="button" class="zf-button zf-button-secondary" 
          hx-post="/api/close-modal" 
          hx-target="#zf-modal-overlay" 
          hx-swap="outerHTML">${cancelLabel}</button>
      </div>
    </div>
  </div>
`;

/**
 * Generate a modal form from a Zod schema
 */
const generateModal = (schema, options = {}) => {
  // Generate the form
  const form = formGenerator.generate(schema, {
    ...options,
    // Make form submit via HTMX if not specified otherwise
    attributes: {
      'hx-post': options.action || '#',
      'hx-target': options.target || '#zf-modal-overlay',
      'hx-swap': options.swap || 'outerHTML',
      ...(options.attributes || {})
    }
  });

  // Create the modal HTML
  const modalHtml = modalTemplate({
    title: options.title || 'Form',
    formHtml: form.html,
    cancelLabel: options.cancelLabel || 'Cancel'
  });

  return {
    html: modalHtml,
    styles: form.styles,
    scripts: form.scripts
  };
};

module.exports = {
  generateModal,
  modalTemplate
};
