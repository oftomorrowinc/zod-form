# ZodForm

A highly opinionated, dark-themed form generation and validation library for Node.js applications using HTMX, Express, and Zod.

## Overview

ZodForm transforms Zod schemas into beautiful, responsive forms with built-in validation. The library generates server-rendered HTML forms with HTMX enhancements for real-time validation and dynamic updates without full page reloads. The package provides a clean, dark-themed UI that can be seamlessly integrated into Firebase-backed applications.

## Key Features

- **Zod Schema to HTML Form**: Automatic form generation from Zod schemas
- **Dark Theme by Default**: Modern, accessible dark UI with customization options
- **HTMX Integration**: Progressive enhancement for seamless form interactions
- **Server-Side Validation**: Express middleware for Zod validation
- **Client-Side Validation**: Browser-side validation using Zod in the browser
- **Custom Elements**: Rich set of form elements including selects, multi-selects, date pickers, etc.
- **Modal Support**: Ready-to-use modal dialogs for forms
- **Firebase Integration**: Helper functions for storing schemas in Firestore
- **Form Submission Handling**: Express routes for handling form submissions
- **Responsive Design**: Mobile-friendly forms that adapt to different screen sizes

## Installation

```bash
npm install zod-form
```

## Basic Usage

### Server-Side Setup (Express)

```javascript
const express = require('express');
const { zodForm } = require('zod-form');
const { z } = require('zod');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Define a Zod schema
const userSchema = z.object({
  name: z.string().min(2, "Name must contain at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  age: z.number().min(18, "You must be at least 18 years old").optional(),
  role: z.enum(["admin", "user", "editor"], {
    errorMap: () => ({ message: "Please select a valid role" })
  })
});

// Create a route that renders the form
app.get('/user-form', (req, res) => {
  const form = zodForm(userSchema, {
    action: '/api/submit-user',
    method: 'POST',
    submitLabel: 'Create User',
    theme: 'dark', // default
    layout: 'vertical' // or 'horizontal'
  });
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>User Form</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${form.styles}
        <script src="https://unpkg.com/htmx.org@1.9.3"></script>
      </head>
      <body class="zf-dark">
        <div class="zf-container">
          <h1>Create New User</h1>
          ${form.html}
        </div>
        ${form.scripts}
      </body>
    </html>
  `);
});

// Create an API endpoint for form submission
app.post('/api/submit-user', zodForm.validate(userSchema), (req, res) => {
  // If we reach here, validation passed
  const userData = req.body;
  
  // Save to database or perform other actions
  // ...
  
  // Return a response that HTMX can use
  if (req.headers['hx-request']) {
    res.send(`
      <div class="zf-alert zf-alert-success">
        User created successfully!
      </div>
    `);
  } else {
    res.redirect('/users');
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Form Rendering in Existing Templates

```javascript
app.get('/profile', (req, res) => {
  const profileSchema = z.object({
    bio: z.string().max(500),
    avatar: z.instanceof(File).optional()
  });
  
  const form = zodForm(profileSchema, {
    action: '/api/update-profile',
    method: 'POST',
    enctype: 'multipart/form-data',
    submitLabel: 'Update Profile'
  });
  
  res.render('profile', { 
    title: 'Edit Profile',
    formHtml: form.html,
    formStyles: form.styles,
    formScripts: form.scripts
  });
});
```

## Modal Forms

```javascript
const contactSchema = z.object({
  subject: z.string().min(3),
  message: z.string().min(10)
});

// Create a modal form
app.get('/api/contact-form', (req, res) => {
  const modal = zodForm.modal(contactSchema, {
    action: '/api/send-message',
    title: 'Contact Us',
    submitLabel: 'Send Message',
    cancelLabel: 'Cancel'
  });
  
  res.send(modal.html);
});

// Use with HTMX
// <button hx-get="/api/contact-form" hx-target="#modal-container">Contact Us</button>
// <div id="modal-container"></div>
```

## Firebase Integration

```javascript
const { zodForm, firestoreSchemas } = require('zod-form');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase
initializeApp();
const db = getFirestore();

// Store a schema in Firestore
app.post('/api/save-schema', async (req, res) => {
  const { name, schema } = req.body;
  
  await firestoreSchemas.saveSchema(db, name, schema);
  
  res.send({ success: true });
});

// Generate a form from a stored schema
app.get('/api/dynamic-form/:schemaId', async (req, res) => {
  const schemaData = await firestoreSchemas.getSchema(db, req.params.schemaId);
  
  if (!schemaData) {
    return res.status(404).send('Schema not found');
  }
  
  const form = zodForm(schemaData.schema, {
    action: `/api/submit-form/${req.params.schemaId}`,
    method: 'POST'
  });
  
  res.send(form.html);
});
```

## Form Elements

ZodForm automatically converts Zod types to appropriate HTML form elements:

| Zod Type | HTML Element |
|----------|--------------|
| `z.string()` | `<input type="text">` |
| `z.string().email()` | `<input type="email">` |
| `z.string().url()` | `<input type="url">` |
| `z.string().min(100)` | `<textarea>` |
| `z.string().uuid()` | `<input type="text" pattern="...">` |
| `z.number()` | `<input type="number">` |
| `z.number().min(1).max(5)` | `<input type="range">` |
| `z.boolean()` | `<input type="checkbox">` |
| `z.date()` | `<input type="date">` |
| `z.enum([...])` | `<select>` |
| `z.array(z.string())` | Multiple inputs with add/remove buttons |
| `z.record(...)` | Key-value editor |
| `z.object(...)` | Nested fieldset |
| `z.union([...])` | Radio buttons or tabbed interface |
| `z.instanceof(File)` | `<input type="file">` |

## Styling and Theming

ZodForm comes with a beautiful dark theme by default, but can be customized:

```javascript
const form = zodForm(schema, {
  theme: 'dark', // default, or 'light'
  customClasses: {
    form: 'my-custom-form',
    input: 'my-custom-input',
    label: 'my-custom-label',
    error: 'my-custom-error',
    button: 'my-custom-button'
  },
  customStyles: `
    .zf-form {
      --zf-primary-color: #6200ea;
      --zf-error-color: #cf6679;
      --zf-background: #121212;
      --zf-text-color: #ffffff;
    }
  `
});
```

## Responsive Design

ZodForm is fully responsive and adapts to different screen sizes:

- **Mobile**: Single column layout with stacked fields
- **Tablet**: Optimized spacing and input sizes
- **Desktop**: Two-column layout for horizontal forms

## Form Validation

### Server-side Validation

```javascript
app.post('/api/submit', zodForm.validate(schema), (req, res) => {
  // Validation passed, handle form submission
  console.log(req.body); // Parsed and validated form data
});
```

### Client-side Validation

ZodForm automatically adds client-side validation using Zod in the browser:

```html
<!-- Generated by ZodForm -->
<input 
  type="text" 
  name="email" 
  hx-trigger="blur"
  hx-post="/api/validate/email"
  hx-target="next .zf-error"
/>
<div class="zf-error"></div>
```

## HTMX Integration

ZodForm uses HTMX for progressive enhancement:

- Real-time field validation on blur
- Partial form updates without full page reloads
- Form submission with progress indicators
- Conditional field visibility based on other field values
- Dynamic addition/removal of array items

## Advanced Features

### Conditional Fields

```javascript
const advancedSchema = z.object({
  employmentStatus: z.enum(['employed', 'self-employed', 'unemployed']),
  companyName: z.string().optional(),
  businessName: z.string().optional()
});

const form = zodForm(advancedSchema, {
  conditionalLogic: {
    companyName: { show: 'employmentStatus', equals: 'employed' },
    businessName: { show: 'employmentStatus', equals: 'self-employed' }
  }
});
```

### Custom Form Templates

```javascript
const form = zodForm(schema, {
  templates: {
    form: '<form class="{{classes.form}}" {{attributes}}>{{content}}</form>',
    field: '<div class="{{classes.field}}">{{label}}{{input}}{{error}}</div>',
    label: '<label class="{{classes.label}}" for="{{id}}">{{label}}</label>',
    error: '<div class="{{classes.error}}">{{message}}</div>'
  }
});
```

## Project Structure

```
/zod-form
├── /src
│   ├── /core
│   │   ├── form-generator.js     # Main form generation logic
│   │   ├── schema-parser.js      # Zod schema parsing
│   │   ├── validation.js         # Validation utilities
│   │   └── renderer.js           # HTML rendering
│   ├── /elements
│   │   ├── text.js               # Text input implementation
│   │   ├── select.js             # Select input implementation
│   │   ├── checkbox.js           # Checkbox implementation
│   │   └── ...                   # Other form elements
│   ├── /templates
│   │   ├── default.js            # Default HTML templates
│   │   └── modal.js              # Modal dialog templates
│   ├── /styles
│   │   ├── dark.css              # Dark theme
│   │   └── light.css             # Light theme
│   ├── /integrations
│   │   ├── express.js            # Express middleware
│   │   ├── firestore.js          # Firestore helpers
│   │   └── htmx.js               # HTMX integration
│   └── index.js                  # Main entry point
├── /examples
│   ├── /basic                    # Basic form example
│   ├── /modal                    # Modal form example
│   ├── /conditional              # Conditional fields example
│   └── /firebase                 # Firebase integration example
├── /tests
│   ├── generator.test.js         # Form generator tests
│   ├── validation.test.js        # Validation tests
│   └── ...                       # Other tests
└── /public
    ├── zod-form.min.css          # Bundled CSS
    └── zod-form.min.js           # Bundled JavaScript
```

## Implementation Notes

- Uses CSS custom properties for easy theming
- No external dependencies other than Zod and minimal HTMX
- Generates semantic HTML5 with proper ARIA attributes for accessibility
- Minimal JavaScript, relies primarily on HTMX for interactivity
- Compatible with Express, but adaptable to other Node.js frameworks
