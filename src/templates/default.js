/**
 * Default HTML templates for ZodForm
 */

const defaultTemplates = {
  /**
   * Main form template
   */
  form: ({ attributes, content, classes }) => `
    <form ${attributes}>
      ${content}
    </form>
  `,

  /**
   * Template for a form field container
   */
  field: ({ label, input, error, classes, id }) => `
    <div class="${classes.field}" id="field-${id}">
      ${label}
      ${input}
      ${error}
    </div>
  `,

  /**
   * Template for a label
   */
  label: ({ text, id, required, classes }) => `
    <label class="${classes.label}" for="${id}">
      ${text}${required ? ' <span class="zf-required">*</span>' : ''}
    </label>
  `,

  /**
   * Template for text inputs
   */
  textInput: ({ attributes, classes }) => `
    <input class="${classes.input}" ${attributes}>
  `,

  /**
   * Template for textarea
   */
  textarea: ({ attributes, classes, value }) => `
    <textarea class="${classes.input}" ${attributes}>${value || ''}</textarea>
  `,

  /**
   * Template for select inputs
   */
  select: ({ attributes, options, classes, value }) => `
    <select class="${classes.select}" ${attributes}>
      <option value="">-- Select --</option>
      ${options
        .map(
          (option) => `
        <option value="${option.value}" ${value === option.value ? 'selected' : ''}>
          ${option.label}
        </option>
      `
        )
        .join('')}
    </select>
  `,

  /**
   * Template for checkbox inputs
   */
  checkbox: ({ attributes, label, classes, checked }) => `
    <div class="${classes.checkbox}">
      <input type="checkbox" ${attributes} ${checked ? 'checked' : ''}>
      <span class="zf-checkbox-label">${label}</span>
    </div>
  `,

  /**
   * Template for radio inputs
   */
  radio: ({ name, options, classes, value }) => `
    <div class="${classes.radio}">
      ${options
        .map(
          (option, i) => `
        <div class="zf-radio-item">
          <input 
            type="radio" 
            id="${name}-${i}" 
            name="${name}" 
            value="${option.value}"
            ${value === option.value ? 'checked' : ''}
          >
          <label for="${name}-${i}">${option.label}</label>
        </div>
      `
        )
        .join('')}
    </div>
  `,

  /**
   * Template for file inputs
   */
  file: ({ attributes, classes }) => `
    <input type="file" class="${classes.input}" ${attributes}>
  `,

  /**
   * Template for array inputs
   */
  array: ({ name, items, itemTemplate, classes, addLabel = 'Add Item', options = [] }) => `
    <div class="${classes.array}" id="${name}-container">
      <div class="${classes.arrayItems}" id="${name}-items">
        ${
          items.length
            ? items
                .map(
                  (item, index) => `
          <div class="${classes.arrayItem}" id="${name}-item-${index}">
            ${itemTemplate(item, index)}
            <button 
              type="button"
              class="zf-remove-item"
              id="${name}-remove-${index}"
            >
              ✕
            </button>
          </div>
        `
                )
                .join('')
            : ''
        }
      </div>
      <div class="${classes.arrayControls}">
        ${
          options.length
            ? `
          <select id="${name}-selector" class="${classes.select}">
            <option value="">-- Select to add --</option>
            ${options
              .map(
                (option) => `
              <option value="${option.value}">${option.label}</option>
            `
              )
              .join('')}
          </select>
        `
            : ''
        }
        <button 
          type="button"
          class="zf-add-item"
          id="${name}-add"
        >
          ${addLabel}
        </button>
      </div>
    </div>
    <style>
      .zf-array-item {
        display: flex;
        align-items: center;
        margin-bottom: var(--zf-spacing-sm);
        width: 100%;
      }
      .zf-array-item > .zf-field {
        flex: 1;
        margin-bottom: 0;
      }
      .zf-remove-item {
        margin-left: var(--zf-spacing-sm);
        background-color: var(--zf-error-color);
        color: #fff;
        border: none;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 12px;
        transition: var(--zf-transition);
        opacity: 0.8;
      }
      .zf-remove-item:hover {
        opacity: 1;
      }
      .zf-array-controls {
        display: flex;
        margin-top: var(--zf-spacing-sm);
      }
      .zf-array-controls select {
        margin-right: var(--zf-spacing-sm);
      }
      .zf-add-item {
        background-color: var(--zf-primary-color);
        color: black;
        border: none;
        border-radius: var(--zf-border-radius);
        padding: var(--zf-spacing-xs) var(--zf-spacing-md);
        cursor: pointer;
        transition: var(--zf-transition);
      }
      .zf-add-item:hover {
        opacity: 0.9;
      }
    </style>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        var container = document.getElementById('${name}-container');
        var itemsContainer = document.getElementById('${name}-items');
        var addButton = document.getElementById('${name}-add');
        var selector = document.getElementById('${name}-selector');
        var nextIndex = ${items.length || 0};
        
        if (!container || !itemsContainer || !addButton) return;
        
        // Function to add new array item
        function addArrayItem(value) {
          var itemId = '${name}-item-' + nextIndex;
          var itemInput = '${name}[' + nextIndex + ']';
          var itemValue = value || '';
          
          var newItem = document.createElement('div');
          newItem.className = '${classes.arrayItem}';
          newItem.id = itemId;
          
          // If we have options, use select input
          if (${options.length > 0}) {
            newItem.innerHTML = \`
              <div class="zf-field">
                <select name="\${itemInput}" class="${classes.select}" required>
                  <option value="">-- Select --</option>
                  ${options
                    .map(
                      (option) => `
                    <option value="${option.value}" \\\${itemValue === "${option.value}" ? 'selected' : ''}>${option.label}</option>
                  `
                    )
                    .join('')}
                </select>
                <div class="zf-error"></div>
              </div>
              <button type="button" class="zf-remove-item" id="${name}-remove-\${nextIndex}">✕</button>
            \`;
          } else {
            // Otherwise use text input
            newItem.innerHTML = \`
              <div class="zf-field">
                <input type="text" name="\${itemInput}" class="${classes.input}" value="\${itemValue}" required>
                <div class="zf-error"></div>
              </div>
              <button type="button" class="zf-remove-item" id="${name}-remove-\${nextIndex}">✕</button>
            \`;
          }
          
          itemsContainer.appendChild(newItem);
          
          // Add remove handler
          document.getElementById('${name}-remove-' + nextIndex).addEventListener('click', function() {
            this.parentElement.remove();
          });
          
          nextIndex++;
          
          // Reset selector if exists
          if (selector) {
            selector.selectedIndex = 0;
          }
        }
        
        // Add initial items if needed
        if (${items.length === 0}) {
          // Start with at least one item
          addArrayItem();
        }
        
        // Add handler for existing remove buttons
        document.querySelectorAll('[id^="${name}-remove-"]').forEach(function(button) {
          button.addEventListener('click', function() {
            this.parentElement.remove();
          });
        });
        
        // Add handler for add button
        addButton.addEventListener('click', function() {
          var value = '';
          if (selector) {
            value = selector.value;
            if (!value && ${options.length > 0}) {
              // If options exist, require a selection
              alert('Please select an option to add');
              return;
            }
          }
          addArrayItem(value);
        });
      });
    </script>
  `,

  /**
   * Template for object inputs (fieldset)
   */
  object: ({ name, legend, fields, classes }) => `
    <fieldset class="${classes.fieldset}" id="${name}-fieldset">
      ${legend ? `<legend class="${classes.legend}">${legend}</legend>` : ''}
      ${fields}
    </fieldset>
  `,

  /**
   * Template for submit button
   */
  submitButton: ({ label, classes }) => `
    <div class="zf-form-actions">
      <button type="submit" class="${classes.submitButton}">
        ${label}
      </button>
    </div>
  `,

  /**
   * Template for error messages
   */
  error: ({ message, classes }) => `
    <div class="${classes.error}" style="display: none;">
      ${message || ''}
    </div>
  `
};

module.exports = {
  defaultTemplates
};
