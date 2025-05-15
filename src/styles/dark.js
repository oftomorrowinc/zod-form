/**
 * Dark theme for ZodForm
 */

const darkTheme = `
  /* Variables */
  :root {
    --zf-primary-color: #bb86fc;
    --zf-primary-variant: #3700b3;
    --zf-secondary-color: #03dac6;
    --zf-background: #121212;
    --zf-surface: #1e1e1e;
    --zf-error: #cf6679;
    --zf-text-primary: rgba(255, 255, 255, 0.87);
    --zf-text-secondary: rgba(255, 255, 255, 0.6);
    --zf-border-color: rgba(255, 255, 255, 0.12);
    --zf-disabled-background: rgba(255, 255, 255, 0.05);
    --zf-disabled-text: rgba(255, 255, 255, 0.38);
    
    --zf-spacing-xs: 0.25rem;
    --zf-spacing-sm: 0.5rem;
    --zf-spacing-md: 1rem;
    --zf-spacing-lg: 1.5rem;
    --zf-spacing-xl: 2rem;
    
    --zf-border-radius: 4px;
    --zf-transition: all 0.3s ease;
    --zf-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
  
  /* Base form styles */
  .zf-form {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    max-width: 600px;
    margin: 0 auto;
    color: var(--zf-text-primary);
    box-sizing: border-box;
  }
  
  /* Apply box-sizing to all elements */
  .zf-form *,
  .zf-form *::before,
  .zf-form *::after {
    box-sizing: border-box;
  }
  
  /* Dark theme body class */
  .zf-dark {
    background-color: var(--zf-background);
    color: var(--zf-text-primary);
  }
  
  /* Container */
  .zf-container {
    padding: var(--zf-spacing-lg);
    max-width: 1200px;
    margin: 0 auto;
  }
  
  /* Field styles */
  .zf-field {
    margin-bottom: var(--zf-spacing-md);
  }
  
  /* Label styles */
  .zf-label {
    display: block;
    margin-bottom: var(--zf-spacing-xs);
    color: var(--zf-text-primary);
    font-weight: 500;
  }
  
  .zf-required {
    color: var(--zf-error);
  }
  
  /* Input styles */
  .zf-input,
  .zf-select,
  .zf-textarea {
    display: block;
    width: 100%;
    max-width: 100%;
    padding: var(--zf-spacing-sm) var(--zf-spacing-md);
    background-color: var(--zf-surface);
    border: 1px solid var(--zf-border-color);
    border-radius: var(--zf-border-radius);
    color: var(--zf-text-primary);
    font-size: 1rem;
    line-height: 1.5;
    transition: var(--zf-transition);
    box-sizing: border-box;
  }
  
  .zf-input:focus,
  .zf-select:focus,
  .zf-textarea:focus {
    outline: none;
    border-color: var(--zf-primary-color);
    box-shadow: 0 0 0 2px rgba(187, 134, 252, 0.3);
  }
  
  .zf-input:disabled,
  .zf-select:disabled,
  .zf-textarea:disabled {
    background-color: var(--zf-disabled-background);
    color: var(--zf-disabled-text);
    cursor: not-allowed;
  }
  
  .zf-input::placeholder,
  .zf-textarea::placeholder {
    color: var(--zf-text-secondary);
  }
  
  .zf-invalid {
    border-color: var(--zf-error);
  }
  
  /* Checkbox and radio styles */
  .zf-checkbox,
  .zf-radio-item {
    display: flex;
    align-items: center;
    margin-bottom: var(--zf-spacing-xs);
  }
  
  .zf-checkbox input[type="checkbox"],
  .zf-radio-item input[type="radio"] {
    margin-right: var(--zf-spacing-sm);
  }
  
  .zf-checkbox-label,
  .zf-radio-item label {
    color: var(--zf-text-primary);
  }
  
  /* Error message styles */
  .zf-error {
    color: var(--zf-error);
    font-size: 0.875rem;
    margin-top: var(--zf-spacing-xs);
  }
  
  /* Button styles */
  .zf-button,
  .zf-submit-button {
    display: inline-block;
    padding: var(--zf-spacing-sm) var(--zf-spacing-lg);
    background-color: var(--zf-primary-color);
    color: black;
    font-weight: 500;
    border: none;
    border-radius: var(--zf-border-radius);
    cursor: pointer;
    transition: var(--zf-transition);
    text-align: center;
    font-size: 1rem;
  }
  
  .zf-button:hover,
  .zf-submit-button:hover {
    background-color: var(--zf-primary-variant);
    color: white;
  }
  
  .zf-button-secondary {
    background-color: transparent;
    border: 1px solid var(--zf-border-color);
    color: var(--zf-text-primary);
  }
  
  .zf-button-secondary:hover {
    background-color: rgba(187, 134, 252, 0.08);
    color: var(--zf-primary-color);
  }
  
  /* Form actions */
  .zf-form-actions {
    margin-top: var(--zf-spacing-lg);
    display: flex;
    justify-content: flex-end;
  }
  
  /* Array fields */
  .zf-array {
    border: 1px solid var(--zf-border-color);
    border-radius: var(--zf-border-radius);
    padding: var(--zf-spacing-md);
    margin-bottom: var(--zf-spacing-md);
  }
  
  .zf-array-item {
    margin-bottom: var(--zf-spacing-md);
    padding-bottom: var(--zf-spacing-md);
    border-bottom: 1px dashed var(--zf-border-color);
    position: relative;
  }
  
  .zf-array-item:last-child {
    margin-bottom: 0;
    border-bottom: none;
  }
  
  .zf-add-item {
    background-color: var(--zf-secondary-color);
    color: black;
  }
  
  .zf-remove-item {
    position: absolute;
    top: 0;
    right: 0;
    background-color: var(--zf-error);
    color: white;
    border: none;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.75rem;
  }
  
  /* Fieldset */
  .zf-fieldset {
    border: 1px solid var(--zf-border-color);
    border-radius: var(--zf-border-radius);
    padding: var(--zf-spacing-md);
    margin-bottom: var(--zf-spacing-md);
  }
  
  .zf-legend {
    padding: 0 var(--zf-spacing-xs);
    color: var(--zf-text-primary);
    font-weight: 500;
  }
  
  /* Alert */
  .zf-alert {
    padding: var(--zf-spacing-md);
    border-radius: var(--zf-border-radius);
    margin-bottom: var(--zf-spacing-md);
  }
  
  .zf-alert-success {
    background-color: rgba(3, 218, 198, 0.1);
    border: 1px solid var(--zf-secondary-color);
    color: var(--zf-secondary-color);
  }
  
  .zf-alert-error {
    background-color: rgba(207, 102, 121, 0.1);
    border: 1px solid var(--zf-error);
    color: var(--zf-error);
  }
  
  .zf-alert h3 {
    margin-top: 0;
    margin-bottom: var(--zf-spacing-sm);
  }
  
  .zf-alert ul {
    margin: 0;
    padding-left: var(--zf-spacing-lg);
  }
  
  /* Modal styles */
  .zf-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .zf-modal {
    background-color: var(--zf-surface);
    border-radius: var(--zf-border-radius);
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--zf-shadow);
  }
  
  .zf-modal .zf-form {
    width: 100%;
    max-width: 100%;
    margin: 0;
    padding: 0;
  }
  
  .zf-modal-header {
    padding: var(--zf-spacing-md);
    border-bottom: 1px solid var(--zf-border-color);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
  .zf-modal-title {
    margin: 0;
    color: var(--zf-text-primary);
    font-size: 1.25rem;
  }
  
  .zf-modal-close {
    background: none;
    border: none;
    color: var(--zf-text-secondary);
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
  }
  
  .zf-modal-body {
    padding: var(--zf-spacing-md);
  }
  
  .zf-modal-footer {
    padding: var(--zf-spacing-md);
    border-top: 1px solid var(--zf-border-color);
    display: flex;
    justify-content: flex-end;
  }
  
  /* Horizontal layout */
  .zf-horizontal .zf-field {
    display: flex;
    align-items: flex-start;
  }
  
  .zf-horizontal .zf-label {
    flex: 0 0 30%;
    margin-bottom: 0;
    padding-top: calc(var(--zf-spacing-sm) + 1px);
    padding-right: var(--zf-spacing-md);
  }
  
  .zf-horizontal .zf-input,
  .zf-horizontal .zf-select,
  .zf-horizontal .zf-textarea,
  .zf-horizontal .zf-checkbox,
  .zf-horizontal .zf-radio {
    flex: 0 0 70%;
  }
  
  .zf-horizontal .zf-error {
    margin-left: 30%;
  }
  
  /* Responsive adjustments */
  @media (max-width: 768px) {
    .zf-horizontal .zf-field {
      flex-direction: column;
    }
    
    .zf-horizontal .zf-label,
    .zf-horizontal .zf-input,
    .zf-horizontal .zf-select,
    .zf-horizontal .zf-textarea,
    .zf-horizontal .zf-checkbox,
    .zf-horizontal .zf-radio {
      flex: 0 0 100%;
    }
    
    .zf-horizontal .zf-error {
      margin-left: 0;
    }
  }
`;

module.exports = {
  darkTheme
};
