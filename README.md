# ZodForm

A highly opinionated, dark-themed form generation and validation library for Node.js applications using HTMX, Express, Pug, and Zod.

## Overview

ZodForm transforms Zod schemas into beautiful, responsive forms with built-in validation. The library generates server-rendered HTML forms with Pug templates and HTMX enhancements for real-time validation and dynamic updates without full page reloads. The package provides a clean, dark-themed UI that can be seamlessly integrated into Firebase-backed applications.

## Key Features

- **Zod Schema to HTML Form**: Automatic form generation from Zod schemas
- **Pug Template Integration**: Seamless integration with Pug templates for clean, maintainable views
- **Dark Theme by Default**: Modern, accessible dark UI with customization options
- **HTMX Integration**: Progressive enhancement for seamless form interactions
- **Server-Side Validation**: Express middleware for Zod validation
- **Client-Side Validation**: Browser-side validation using Zod in the browser
- **Custom Elements**: Rich set of form elements including star ratings, file uploads with preview, etc.
- **Modal Support**: Ready-to-use modal dialogs for forms
- **Firebase Integration**: Helper functions for storing schemas in Firestore
- **Form Submission Handling**: Express routes for handling form submissions
- **Responsive Design**: Mobile-friendly forms that adapt to different screen sizes

## Installation

```bash
npm install zod-form
```

## Basic Usage

### Server-Side Setup with Pug (Recommended)

ZodForm works seamlessly with Pug templates, which is the recommended way to use it in Express applications.

```javascript
const express = require('express');
const path = require('path');
const { zodForm } = require('zod-form');
const { z } = require('zod');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up Pug as the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

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
  
  // Render the form using Pug
  res.render('user-form', {
    title: 'User Form',
    form: form
  });
});

// For file uploads
const multer = require('multer');
const upload = multer({ 
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create an API endpoint for form submission
// Use multer when your form includes file uploads
app.post('/api/submit-user', upload.single('avatar'), zodForm.validate(userSchema), (req, res) => {
  // If we reach here, validation passed
  const userData = req.validatedData;
  
  // Access uploaded file (if any)
  if (req.file) {
    console.log('File uploaded:', req.file.filename);
    // You might want to store the file path in your database
    userData.avatarPath = req.file.path;
  }
  
  // Save to database or perform other actions
  // ...
  
  // Return a response that HTMX can use
  if (req.headers['hx-request']) {
    res.render('partials/success', { 
      message: 'User created successfully!' 
    });
  } else {
    res.redirect('/users');
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Pug Templates

Create the following Pug templates to work with ZodForm:

#### `views/layout.pug`
```pug
doctype html
html
  head
    title= title
    meta(name="viewport" content="width=device-width, initial-scale=1")
    script(src="https://unpkg.com/htmx.org@1.9.3")
    block styles
  body.zf-dark
    .zf-container
      block content
    block scripts
```

#### `views/user-form.pug`
```pug
extends layout

block styles
  != form.styles

block content
  h1 Create New User
  p Fill out the form below to create a new user account.
  
  != form.html
  #form-response

block scripts
  != form.scripts
```

#### `views/partials/success.pug`
```pug
.zf-alert.zf-alert-success
  h3 Success!
  p= message
```

### Traditional HTML Output

If you prefer to use raw HTML instead of Pug templates, you can still use ZodForm as follows:

```javascript
app.get('/user-form', (req, res) => {
  const form = zodForm(userSchema, {
    action: '/api/submit-user',
    method: 'POST',
    submitLabel: 'Create User',
    theme: 'dark',
    layout: 'vertical'
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
          <div id="form-response"></div>
        </div>
        ${form.scripts}
      </body>
    </html>
  `);
});
```

## Modal Forms with Pug

Using modals with Pug templates is straightforward:

```javascript
const express = require('express');
const path = require('path');
const { z } = require('zod');
const { zodForm } = require('zod-form');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up Pug as the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Define a contact form schema
const contactSchema = z.object({
  subject: z.string().min(3, 'Subject must contain at least 3 characters'),
  message: z.string().min(10, 'Message must contain at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high'])
});

// Home page with a button to open the modal
app.get('/', (req, res) => {
  res.render('index', {
    title: 'ZodForm Modal Example'
  });
});

// API endpoint to serve the modal form
app.get('/api/contact-form', (req, res) => {
  const form = zodForm(contactSchema, {
    action: '/api/send-message',
    method: 'POST',
    submitLabel: 'Send Message'
  });

  // Render the form using Pug
  res.render('contact-form', {
    form: form
  });
});

// API endpoint to handle form submission
app.post('/api/send-message', zodForm.validate(contactSchema), (req, res) => {
  // If we reach here, validation passed
  const messageData = req.validatedData;
  
  // In a real app, you would save the message to a database
  console.log('Received valid message:', messageData);
  
  // Render success template
  res.render('success');
});
```

### Pug Templates for Modal

Here are the Pug templates for the modal example:

#### `views/index.pug`
```pug
extends layout

block content
  h1 ZodForm Modal Example
  p Click the button below to open a modal contact form
  
  button.button#contact-form-button(hx-get="/api/contact-form" hx-target="#modal-container")
    | Open Contact Form
  
  #modal-container

block scripts
  script.
    // Ensure the button works even if HTMX doesn't initialize
    document.addEventListener('DOMContentLoaded', function() {
      const contactButton = document.getElementById('contact-form-button');
      contactButton.addEventListener('click', function() {
        // Try manual fetch if HTMX isn't working
        if (!window.htmx || !contactButton.getAttribute('hx-get')) {
          fetch('/api/contact-form')
            .then(response => response.text())
            .then(html => {
              document.getElementById('modal-container').innerHTML = html;
            });
        }
      });
    });
```

#### `views/contact-form.pug`
```pug
h1 Contact Us
!= form.styles
p Fill out the form below to send us a message.
!= form.html
div#form-response
p
  a.zf-button.zf-button-secondary(href="/") Back to Home
!= form.scripts
```

#### `views/success.pug`
```pug
.zf-alert.zf-alert-success
  h3 Message Sent!
  p Thank you for your message. We'll get back to you soon.
  button.zf-button(onclick="this.parentElement.remove()") Close
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

## Examples

Check out the examples folder for working code samples:

- Basic form usage
- Modal forms
- Conditional field visibility
- Firebase integration
- All fields showcase with enhanced components

To run an example:

```bash
# Run any example using npm scripts
npm run start:basic
npm run start:modal
npm run start:conditional
npm run start:firebase
npm run start:all-fields  # Showcases all enhanced form components

# Or run directly
node examples/basic/server.js
```

All examples run on port 3000 by default. Simply refresh the browser to see different examples as you start them.

### Enhanced Form Components

The all-fields example showcases several enhanced form components:

#### Star Rating Component

```javascript
// Define in your schema
const schema = z.object({
  rating: z.number().min(1).max(5)
});

// Configure in your options
const form = zodForm(schema, {
  fieldOptions: {
    rating: {
      type: "stars",  // Custom star rating component
      unit: '★',      // Optional star character
      label: "Rating" // Custom label
    }
  }
});
```

#### Textarea with Document Upload

```javascript
// Define in your schema
const schema = z.object({
  notes: z.string().min(10)
});

// Configure in your options
const form = zodForm(schema, {
  fieldOptions: {
    notes: {
      type: "textarea",
      documentUpload: true, // Enables document upload icon
      rows: 5,
      placeholder: "Upload a document or enter text..."
    }
  }
});
```

#### Image Upload with Preview

```javascript
// Define in your schema
const schema = z.object({
  avatar: z.instanceof(File).optional()
});

// Configure in your options
const form = zodForm(schema, {
  fieldOptions: {
    avatar: {
      imageUpload: true, // Enables image preview
      accept: "image/*",
      label: "Profile Picture"
    }
  }
});
```

#### Array Fields with Add/Remove

```javascript
// Define in your schema
const schema = z.object({
  interests: z.array(z.string()).min(1)
});

// Configure in your options
const form = zodForm(schema, {
  fieldOptions: {
    interests: {
      options: [
        { value: "sports", label: "Sports" },
        { value: "music", label: "Music" },
        { value: "movies", label: "Movies" }
      ],
      addLabel: "Add Interest" // Custom button label
    }
  }
});
```

When handling array fields in form submissions, the data comes in with indexed keys (e.g., `interests[0]`, `interests[1]`). You'll need to process these to create actual arrays:

```javascript
app.post('/api/submit-form', (req, res) => {
  // Process the form data to convert indexed fields to arrays
  const formData = req.body;
  
  // Handle array fields
  Object.keys(formData).forEach(key => {
    // Check if this is an array field (has keys like interests[0], interests[1], etc)
    if (key.includes('[') && key.includes(']')) {
      const baseName = key.substring(0, key.indexOf('['));
      const index = parseInt(key.match(/\[(\d+)\]/)[1], 10);
      
      // Initialize array if not exists
      if (!formData[baseName]) {
        formData[baseName] = [];
      }
      
      // Add to array
      formData[baseName][index] = formData[key];
      
      // Remove the original indexed property
      delete formData[key];
    }
  });
  
  // Now formData.interests is an array
  console.log(formData.interests); // ['sports', 'music', ...]
  
  // Continue processing...
});
```

#### Conditional Fields

```javascript
// Define in your schema
const schema = z.object({
  contactPreference: z.enum(["email", "phone", "mail"]),
  phoneNumber: z.string().optional(),
  alternativeEmail: z.string().email().optional(),
  mailingAddress: z.string().optional()
});

// Configure in your options
const form = zodForm(schema, {
  conditionalLogic: {
    phoneNumber: { show: 'contactPreference', equals: 'phone' },
    alternativeEmail: { show: 'contactPreference', equals: 'email' },
    mailingAddress: { show: 'contactPreference', equals: 'mail' }
  }
});
```

## Documentation

See the [ZodForm Specification](zod-form-spec.md) for detailed documentation on all features and options.

## Releasing a new package version

- Increment the version number in package.json as appropriate
- Run `npm run build` to ensure there are no errors
- Run `npm run release`
- Go to the project page on Github, go to releases, click draft a new release, select your tag, add a title/description and click publish
- To update the dependency to the latest version number in projects using this package run `npm install git+https://github.com/oftomorrowinc/zod-form.git#v{version.number}`

## License

MIT