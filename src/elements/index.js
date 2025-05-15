/**
 * Form element renderers
 */

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
 * Create common field wrapper with label and error message
 */
const createFieldWrapper = (field, options, inputHtml) => {
  const { templates, classes } = options;

  // Generate label
  const labelHtml = templates.label({
    text:
      field.label ||
      field.name.charAt(0).toUpperCase() + field.name.slice(1).replace(/([A-Z])/g, ' $1'),
    id: field.id || field.name,
    required: field.validation?.required !== false,
    classes
  });

  // Generate error container
  const errorHtml = templates.error({
    message: '',
    classes
  });

  // Combine into field template
  return templates.field({
    label: labelHtml,
    input: inputHtml,
    error: errorHtml,
    classes,
    id: field.id || field.name
  });
};

/**
 * Text input renderer
 */
const text = (field, options) => {
  const { templates, classes } = options;

  // Generate input attributes
  const attributes = {
    type: field.type,
    id: field.id || field.name,
    name: field.name,
    ...(field.validation?.required !== false ? { required: true } : {}),
    ...(field.validation?.minLength ? { minlength: field.validation.minLength } : {}),
    ...(field.validation?.maxLength ? { maxlength: field.validation.maxLength } : {}),
    ...(field.validation?.pattern ? { pattern: field.validation.pattern } : {}),
    ...(field.placeholder ? { placeholder: field.placeholder } : {}),
    ...(options.htmx
      ? {
          'hx-post': options.htmx.validateUrl || `/api/validate/${field.name}`,
          'hx-trigger': 'blur',
          'hx-target': 'next .zf-error'
        }
      : {})
  };

  // Generate input HTML
  const inputHtml = templates.textInput({
    attributes: attributesToString(attributes),
    classes,
    value: field.value || options.values?.[field.name] || ''
  });

  return createFieldWrapper(field, options, inputHtml);
};

/**
 * Enhanced textarea renderer with document upload icon
 */
const textarea = (field, options) => {
  const { templates, classes } = options;

  // Generate textarea attributes
  const attributes = {
    id: field.id || field.name,
    name: field.name,
    ...(field.validation?.required !== false ? { required: true } : {}),
    ...(field.validation?.minLength ? { minlength: field.validation.minLength } : {}),
    ...(field.validation?.maxLength ? { maxlength: field.validation.maxLength } : {}),
    ...(field.rows ? { rows: field.rows } : { rows: 5 }),
    ...(field.placeholder ? { placeholder: field.placeholder } : {}),
    ...(options.htmx
      ? {
          'hx-post': options.htmx.validateUrl || `/api/validate/${field.name}`,
          'hx-trigger': 'blur',
          'hx-target': 'next .zf-error'
        }
      : {})
  };

  // If the file upload action is defined, add the document icon
  const fieldId = field.id || field.name;
  const showDocumentIcon = field.documentUpload || options.documentUpload;

  // Generate textarea container with wrapper for document icon if needed
  const inputHtml = `
    <div class="zf-textarea-container">
      <div class="zf-textarea-wrapper">
        ${templates.textarea({
          attributes: attributesToString(attributes),
          classes,
          value: field.value || options.values?.[field.name] || ''
        })}
        ${
          showDocumentIcon
            ? `
          <div class="zf-textarea-actions">
            <label for="${fieldId}-file" class="zf-document-upload" title="Upload document">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="12" y1="18" x2="12" y2="12"></line>
                <line x1="9" y1="15" x2="15" y2="15"></line>
              </svg>
              <input type="file" id="${fieldId}-file" class="zf-hidden-file-input" accept=".txt,.md,.doc,.docx,.pdf">
            </label>
          </div>
        `
            : ''
        }
      </div>
    </div>
    <style>
      .zf-textarea-container {
        width: 100%;
        position: relative;
      }
      .zf-textarea-wrapper {
        position: relative;
        width: 100%;
      }
      .zf-textarea-actions {
        position: absolute;
        bottom: 8px;
        right: 8px;
        z-index: 5;
      }
      .zf-document-upload {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background-color: var(--zf-primary-color);
        color: black;
        border-radius: 50%;
        cursor: pointer;
        transition: var(--zf-transition);
        opacity: 0.7;
      }
      .zf-document-upload:hover {
        opacity: 1;
      }
      .zf-hidden-file-input {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
        overflow: hidden;
      }
    </style>
    ${
      showDocumentIcon
        ? `
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          var fileInput = document.getElementById('${fieldId}-file');
          var textarea = document.getElementById('${fieldId}');
          
          if (fileInput && textarea) {
            fileInput.addEventListener('change', function(e) {
              var file = e.target.files[0];
              if (!file) return;
              
              // Check if the file is a text file or document
              if (file.type.match('text.*') || file.type.match('application/pdf') || 
                  file.name.endsWith('.md') || file.name.endsWith('.doc') || file.name.endsWith('.docx')) {
                
                // For text files, read and insert content
                if (file.type.match('text.*') || file.name.endsWith('.md')) {
                  var reader = new FileReader();
                  reader.onload = function(e) {
                    textarea.value = e.target.result;
                    // Trigger change event for validation
                    var event = new Event('change', { bubbles: true });
                    textarea.dispatchEvent(event);
                  };
                  reader.readAsText(file);
                } else {
                  // For other documents, just insert a placeholder with the filename
                  textarea.value += '\\n[Document attached: ' + file.name + ']';
                  // Reset file input
                  fileInput.value = '';
                }
              } else {
                alert('Please select a text or document file');
              }
            });
          }
        });
      </script>
    `
        : ''
    }
  `;

  return createFieldWrapper(field, options, inputHtml);
};

/**
 * Select input renderer
 */
const select = (field, options) => {
  const { templates, classes } = options;

  // Generate select attributes
  const attributes = {
    id: field.id || field.name,
    name: field.name,
    ...(field.validation?.required !== false ? { required: true } : {}),
    ...(options.htmx
      ? {
          'hx-post': options.htmx.validateUrl || `/api/validate/${field.name}`,
          'hx-trigger': 'change',
          'hx-target': 'next .zf-error'
        }
      : {})
  };

  // Generate select HTML
  const inputHtml = templates.select({
    attributes: attributesToString(attributes),
    options: field.options || [],
    classes,
    value: field.value || options.values?.[field.name] || ''
  });

  return createFieldWrapper(field, options, inputHtml);
};

/**
 * Checkbox renderer
 */
const checkbox = (field, options) => {
  const { templates, classes } = options;

  // Generate checkbox attributes
  const attributes = {
    id: field.id || field.name,
    name: field.name,
    type: 'checkbox',
    value: 'true',
    ...(field.validation?.required !== false ? { required: true } : {}),
    ...(options.htmx
      ? {
          'hx-post': options.htmx.validateUrl || `/api/validate/${field.name}`,
          'hx-trigger': 'change',
          'hx-target': 'next .zf-error'
        }
      : {})
  };

  // Generate checkbox HTML
  const inputHtml = templates.checkbox({
    attributes: attributesToString(attributes),
    label:
      field.label ||
      field.name.charAt(0).toUpperCase() + field.name.slice(1).replace(/([A-Z])/g, ' $1'),
    classes,
    checked: field.value || options.values?.[field.name] || false
  });

  // Generate error container (without label since it's included in the checkbox template)
  const errorHtml = templates.error({
    message: '',
    classes
  });

  // Use field template without a separate label
  return templates.field({
    label: '',
    input: inputHtml,
    error: errorHtml,
    classes,
    id: field.id || field.name
  });
};

/**
 * Radio button renderer
 */
const radio = (field, options) => {
  const { templates, classes } = options;

  // Generate radio HTML
  const inputHtml = templates.radio({
    name: field.name,
    options: field.options || [],
    classes,
    value: field.value || options.values?.[field.name] || ''
  });

  return createFieldWrapper(field, options, inputHtml);
};

/**
 * Enhanced file input renderer with image preview
 */
const file = (field, options) => {
  const { templates, classes } = options;

  // Generate file input attributes
  const attributes = {
    id: field.id || field.name,
    name: field.name,
    type: 'file',
    ...(field.validation?.required !== false ? { required: true } : {}),
    ...(field.accept ? { accept: field.accept } : {}),
    ...(field.multiple ? { multiple: true } : {}),
    ...(options.htmx
      ? {
          'hx-post': options.htmx.validateUrl || `/api/validate/${field.name}`,
          'hx-trigger': 'change',
          'hx-target': 'next .zf-error',
          'hx-encoding': 'multipart/form-data'
        }
      : {})
  };

  const fieldId = field.id || field.name;
  const isImageUpload =
    field.imageUpload || options.imageUpload || (field.accept && field.accept.includes('image'));

  // Generate enhanced file input HTML with preview for images
  const inputHtml = `
    <div class="zf-file-container">
      ${
        isImageUpload
          ? `
        <div class="zf-image-preview">
          <div class="zf-image-placeholder" id="${fieldId}-preview">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span>Image Preview</span>
          </div>
        </div>
      `
          : ''
      }
      
      <div class="zf-file-input-wrapper">
        <label for="${fieldId}" class="zf-file-label">
          <span class="zf-file-button">
            ${isImageUpload ? 'Choose Image' : 'Choose File'}
          </span>
          <span class="zf-file-name" id="${fieldId}-name">No file selected</span>
        </label>
        ${templates.file({
          attributes: attributesToString(attributes),
          classes
        })}
      </div>
    </div>
    
    <style>
      .zf-file-container {
        width: 100%;
      }
      .zf-image-preview {
        margin-bottom: var(--zf-spacing-sm);
        width: 100%;
        display: flex;
        justify-content: center;
      }
      .zf-image-placeholder {
        width: 200px;
        height: 150px;
        background-color: var(--zf-surface);
        border: 1px dashed var(--zf-border-color);
        border-radius: var(--zf-border-radius);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--zf-text-secondary);
        overflow: hidden;
      }
      .zf-image-placeholder img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
      .zf-file-input-wrapper {
        position: relative;
        width: 100%;
      }
      .zf-file-label {
        display: flex;
        cursor: pointer;
        width: 100%;
      }
      .zf-file-button {
        background-color: var(--zf-primary-color);
        color: black;
        padding: var(--zf-spacing-sm) var(--zf-spacing-md);
        border-radius: var(--zf-border-radius) 0 0 var(--zf-border-radius);
        font-weight: 500;
        white-space: nowrap;
      }
      .zf-file-name {
        flex: 1;
        padding: var(--zf-spacing-sm) var(--zf-spacing-md);
        background-color: var(--zf-surface);
        border: 1px solid var(--zf-border-color);
        border-left: none;
        border-radius: 0 var(--zf-border-radius) var(--zf-border-radius) 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .zf-file-container input[type="file"] {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        border: 0;
      }
    </style>
    
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        var fileInput = document.getElementById('${fieldId}');
        var fileName = document.getElementById('${fieldId}-name');
        var filePreview = document.getElementById('${fieldId}-preview');
        
        if (fileInput && fileName) {
          fileInput.addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) {
              fileName.textContent = 'No file selected';
              if (filePreview) {
                filePreview.innerHTML = \`
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                  </svg>
                  <span>Image Preview</span>
                \`;
              }
              return;
            }
            
            // Update file name display
            fileName.textContent = file.name;
            
            // Handle image preview if applicable
            if (filePreview && file.type.startsWith('image/')) {
              var reader = new FileReader();
              reader.onload = function(e) {
                filePreview.innerHTML = \`<img src="\${e.target.result}" alt="Preview">\`;
              };
              reader.readAsDataURL(file);
            }
          });
        }
      });
    </script>
  `;

  return createFieldWrapper(field, options, inputHtml);
};

/**
 * Number input renderer
 */
const number = (field, options) => {
  const { templates, classes } = options;

  // Generate input attributes
  const attributes = {
    type: 'number',
    id: field.id || field.name,
    name: field.name,
    ...(field.validation?.required !== false ? { required: true } : {}),
    ...(field.validation?.min !== undefined ? { min: field.validation.min } : {}),
    ...(field.validation?.max !== undefined ? { max: field.validation.max } : {}),
    ...(field.validation?.step !== undefined ? { step: field.validation.step } : {}),
    ...(field.placeholder ? { placeholder: field.placeholder } : {}),
    ...(options.htmx
      ? {
          'hx-post': options.htmx.validateUrl || `/api/validate/${field.name}`,
          'hx-trigger': 'blur',
          'hx-target': 'next .zf-error'
        }
      : {})
  };

  // Generate input HTML
  const inputHtml = templates.textInput({
    attributes: attributesToString(attributes),
    classes,
    value: field.value || options.values?.[field.name] || ''
  });

  return createFieldWrapper(field, options, inputHtml);
};

/**
 * Range input renderer with improved styling
 */
const range = (field, options) => {
  const { templates, classes } = options;

  // Generate input attributes
  const attributes = {
    type: 'range',
    id: field.id || field.name,
    name: field.name,
    ...(field.validation?.min !== undefined
      ? { min: field.validation.min }
      : { min: field.min || 0 }),
    ...(field.validation?.max !== undefined
      ? { max: field.validation.max }
      : { max: field.max || 100 }),
    ...(field.validation?.step !== undefined ? { step: field.validation.step } : { step: 1 }),
    ...(options.htmx
      ? {
          'hx-post': options.htmx.validateUrl || `/api/validate/${field.name}`,
          'hx-trigger': 'change',
          'hx-target': 'next .zf-error'
        }
      : {})
  };

  // Generate input HTML with value display
  const fieldId = field.id || field.name;
  const rangeValue = field.value || options.values?.[field.name] || attributes.min;
  const rangeMin = attributes.min;
  const rangeMax = attributes.max;

  // Format the label to include units if available
  const label =
    field.label ||
    field.name.charAt(0).toUpperCase() + field.name.slice(1).replace(/([A-Z])/g, ' $1');
  const unit = field.unit || '';

  const inputHtml = `
    <div class="zf-range-container">
      <div class="zf-range-header">
        <span class="zf-range-label">${label}: <span id="${fieldId}-output">${rangeValue}</span>${unit}</span>
      </div>
      <div class="zf-range-input-wrapper">
        <div class="zf-range-input">
          ${templates.textInput({
            attributes: attributesToString(attributes),
            classes,
            value: field.value || options.values?.[field.name] || ''
          })}
        </div>
        <div class="zf-range-limits">
          <span class="zf-range-min">${rangeMin}${unit}</span>
          <span class="zf-range-max">${rangeMax}${unit}</span>
        </div>
      </div>
    </div>
    <style>
      .zf-range-container {
        width: 100%;
        max-width: 100%;
        margin-bottom: var(--zf-spacing-xs);
      }
      .zf-range-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--zf-spacing-xs);
      }
      .zf-range-label {
        font-weight: 500;
      }
      .zf-range-input-wrapper {
        width: 100%;
      }
      .zf-range-input {
        width: 100%;
        margin-bottom: 2px;
      }
      .zf-range-input input[type="range"] {
        width: 100%;
        height: 8px;
        -webkit-appearance: none;
        background: var(--zf-border-color);
        border-radius: 4px;
        outline: none;
        margin: 0;
      }
      .zf-range-input input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 18px;
        height: 18px;
        background: var(--zf-primary-color);
        border-radius: 50%;
        cursor: pointer;
        border: none;
      }
      .zf-range-input input[type="range"]::-moz-range-thumb {
        width: 18px;
        height: 18px;
        background: var(--zf-primary-color);
        border-radius: 50%;
        cursor: pointer;
        border: none;
      }
      .zf-range-limits {
        display: flex;
        justify-content: space-between;
        font-size: 0.75rem;
        color: var(--zf-text-secondary);
        margin-top: 2px;
      }
    </style>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        var rangeInput = document.getElementById('${fieldId}');
        var rangeOutput = document.getElementById('${fieldId}-output');
        
        if (rangeInput && rangeOutput) {
          // Set initial value
          rangeOutput.textContent = rangeInput.value;
          
          // Update on input
          rangeInput.addEventListener('input', function() {
            rangeOutput.textContent = this.value;
          });
        }
      });
    </script>
  `;

  return createFieldWrapper(field, options, inputHtml);
};

/**
 * Date input renderer
 */
const date = (field, options) => {
  const { templates, classes } = options;

  // Generate input attributes
  const attributes = {
    type: 'date',
    id: field.id || field.name,
    name: field.name,
    ...(field.validation?.required !== false ? { required: true } : {}),
    ...(field.validation?.min ? { min: field.validation.min } : {}),
    ...(field.validation?.max ? { max: field.validation.max } : {}),
    ...(options.htmx
      ? {
          'hx-post': options.htmx.validateUrl || `/api/validate/${field.name}`,
          'hx-trigger': 'blur',
          'hx-target': 'next .zf-error'
        }
      : {})
  };

  // Generate input HTML
  const inputHtml = templates.textInput({
    attributes: attributesToString(attributes),
    classes,
    value: field.value || options.values?.[field.name] || ''
  });

  return createFieldWrapper(field, options, inputHtml);
};

/**
 * Email input renderer
 */
const email = (field, options) => {
  // Override field type to ensure it's email
  field.type = 'email';
  return text(field, options);
};

/**
 * URL input renderer
 */
const url = (field, options) => {
  // Override field type to ensure it's url
  field.type = 'url';
  return text(field, options);
};

/**
 * Object (fieldset) renderer
 */
const object = (field, options) => {
  const { templates, classes } = options;

  // Generate fields HTML for each property in the object
  const fieldsHtml = Object.values(field.fields || {})
    .map((subfield) => {
      // Update the path to include the parent object
      const nestedField = {
        ...subfield,
        name: `${field.name}[${subfield.name}]`,
        path: `${field.path}.${subfield.name}`
      };

      // Recursively render the subfield
      if (module.exports[nestedField.type]) {
        return module.exports[nestedField.type](nestedField, options);
      }

      // Fallback to text input
      return text(nestedField, options);
    })
    .join('');

  // Generate fieldset HTML
  return templates.object({
    name: field.name,
    legend:
      field.label ||
      field.name.charAt(0).toUpperCase() + field.name.slice(1).replace(/([A-Z])/g, ' $1'),
    fields: fieldsHtml,
    classes
  });
};

/**
 * Array renderer
 */
const array = (field, options) => {
  const { templates, classes } = options;

  // Get current values (empty array if none)
  const values = field.value || options.values?.[field.name] || [];

  // Create a template for a single array item
  const createItemTemplate = (item, index) => {
    // Create a subfield for the array item
    const itemField = {
      ...field.itemType,
      name: `${field.name}[${index}]`,
      path: `${field.path}[${index}]`,
      value: item
    };

    // Render the item field
    if (module.exports[itemField.type]) {
      return module.exports[itemField.type](itemField, options);
    }

    // Fallback to text input
    return text(itemField, options);
  };

  // Generate array HTML
  const inputHtml = templates.array({
    name: field.name,
    items: values,
    itemTemplate: createItemTemplate,
    classes,
    addLabel: field.addLabel || 'Add Item'
  });

  return createFieldWrapper(field, options, inputHtml);
};

/**
 * Record renderer (key-value pairs)
 */
const record = (field, options) => {
  const { templates, classes } = options;

  // Get current values (empty object if none)
  const values = field.value || options.values?.[field.name] || {};

  // Convert to array of key-value pairs for easier rendering
  const items = Object.entries(values).map(([key, value]) => ({ key, value }));

  // Create a template for a single record item
  const createItemTemplate = (item, index) => {
    return `
      <div class="zf-record-item">
        <div class="zf-record-key">
          <input 
            type="text" 
            class="${classes.input}" 
            name="${field.name}[${index}].key" 
            value="${item.key || ''}"
            placeholder="Key"
            ${field.validation?.required !== false ? 'required' : ''}
          >
        </div>
        <div class="zf-record-value">
          ${renderValueField(field.valueType, `${field.name}[${index}].value`, item.value, options)}
        </div>
      </div>
    `;
  };

  // Helper to render the value field based on its type
  const renderValueField = (valueType, name, value, options) => {
    const valueField = {
      ...valueType,
      name,
      value
    };

    if (module.exports[valueField.type]) {
      return module.exports[valueField.type](valueField, options);
    }

    return text(valueField, options);
  };

  // Customize the array template for records
  const recordHtml = templates.array({
    name: field.name,
    items: items.length ? items : [{ key: '', value: '' }], // At least one empty item
    itemTemplate: createItemTemplate,
    classes,
    addLabel: field.addLabel || 'Add Key-Value Pair'
  });

  return createFieldWrapper(field, options, recordHtml);
};

/**
 * Star rating renderer
 */
const stars = (field, options) => {
  const { templates, classes } = options;

  // Generate attributes for hidden input
  const attributes = {
    type: 'hidden',
    id: field.id || field.name,
    name: field.name,
    value: field.value || options.values?.[field.name] || '1',
    ...(field.validation?.required !== false ? { required: true } : {})
  };

  const fieldId = field.id || field.name;
  const currentValue = field.value || options.values?.[field.name] || 1;
  const maxStars = field.validation?.max || field.max || 5;

  // Generate star rating HTML
  const inputHtml = `
    <div class="zf-star-rating-container">
      <input ${attributesToString(attributes)}>
      <div class="zf-star-rating" id="${fieldId}-stars">
        ${Array.from({ length: maxStars }, (_, i) => i + 1)
          .map(
            (i) => `
          <span class="zf-star ${i <= currentValue ? 'zf-star-active' : ''}" 
                data-value="${i}" 
                id="${fieldId}-star-${i}">★</span>
        `
          )
          .join('')}
      </div>
    </div>
    <style>
      .zf-star-rating-container {
        margin: 10px 0;
      }
      .zf-star-rating {
        display: flex;
        font-size: 24px;
        cursor: pointer;
      }
      .zf-star {
        color: rgba(255, 255, 255, 0.2);
        transition: var(--zf-transition);
        padding: 0 2px;
      }
      .zf-star:hover, .zf-star-active {
        color: var(--zf-primary-color);
      }
    </style>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        var hiddenInput = document.getElementById('${fieldId}');
        var starContainer = document.getElementById('${fieldId}-stars');
        
        if (!starContainer || !hiddenInput) return;
        
        // Add click handlers to stars
        starContainer.querySelectorAll('.zf-star').forEach(function(star) {
          star.addEventListener('click', function() {
            var value = parseInt(this.getAttribute('data-value'), 10);
            hiddenInput.value = value;
            
            // Update active state
            starContainer.querySelectorAll('.zf-star').forEach(function(s) {
              var starValue = parseInt(s.getAttribute('data-value'), 10);
              if (starValue <= value) {
                s.classList.add('zf-star-active');
              } else {
                s.classList.remove('zf-star-active');
              }
            });
            
            // Trigger change event for validation
            var event = new Event('change', { bubbles: true });
            hiddenInput.dispatchEvent(event);
          });
        });
      });
    </script>
  `;

  return createFieldWrapper(field, options, inputHtml);
};

module.exports = {
  text,
  textarea,
  select,
  checkbox,
  radio,
  file,
  number,
  range,
  date,
  email,
  url,
  object,
  array,
  record,
  stars
};
