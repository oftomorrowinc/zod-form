/**
 * Firebase integration example of ZodForm
 * Note: You'll need to set up Firebase credentials to run this example
 */

const express = require('express');
const { z } = require('zod');
const { zodForm, firestoreSchemas } = require('../../src');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Initialize Firebase (you need to provide your own credentials)
try {
  initializeApp({
    // Replace with your own credentials or use environment variables
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
} catch (error) {
  console.warn('Firebase initialization error:', error.message);
  console.warn(
    'This example requires Firebase credentials. Set the following environment variables:'
  );
  console.warn('- FIREBASE_PROJECT_ID');
  console.warn('- FIREBASE_CLIENT_EMAIL');
  console.warn('- FIREBASE_PRIVATE_KEY');
}

const db = getFirestore();

// Define a sample schema
const productSchema = z.object({
  name: z.string().min(2, 'Product name must contain at least 2 characters'),
  price: z.number().min(0, 'Price cannot be negative'),
  description: z.string().min(10, 'Description must contain at least 10 characters'),
  category: z.enum(['electronics', 'clothing', 'food', 'books'], {
    errorMap: () => ({ message: 'Please select a valid category' })
  }),
  inStock: z.boolean().default(true)
});

// Home page with schema management
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>ZodForm Firebase Example</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <script src="https://unpkg.com/htmx.org@1.9.3"></script>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #121212;
            color: rgba(255, 255, 255, 0.87);
            margin: 0;
            padding: 0;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
          }
          
          .button {
            display: inline-block;
            padding: 0.5rem 1rem;
            background-color: #bb86fc;
            color: black;
            font-weight: 500;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s ease;
            margin: 0.5rem 0;
          }
          
          .button:hover {
            background-color: #3700b3;
            color: white;
          }
          
          .card {
            background-color: #1e1e1e;
            border-radius: 4px;
            padding: 1rem;
            margin: 1rem 0;
          }
          
          .schema-list {
            margin: 2rem 0;
          }
          
          h2 {
            margin-top: 2rem;
          }
          
          pre {
            background-color: #2d2d2d;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
          }
          
          #response {
            margin-top: 1rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>ZodForm Firebase Integration</h1>
          
          <div class="card">
            <h2>Save Schema to Firestore</h2>
            <p>Click the button below to save a product schema to Firestore</p>
            
            <button class="button"
              hx-post="/api/save-schema"
              hx-target="#response">
              Save Product Schema
            </button>
          </div>
          
          <div class="card">
            <h2>List Saved Schemas</h2>
            
            <button class="button"
              hx-get="/api/list-schemas"
              hx-target="#schema-list">
              List Schemas
            </button>
            
            <div id="schema-list" class="schema-list">
              <!-- Schema list will appear here -->
            </div>
          </div>
          
          <div id="response">
            <!-- API responses will appear here -->
          </div>
          
          <div id="form-container">
            <!-- Dynamic form will appear here -->
          </div>
        </div>
      </body>
    </html>
  `);
});

// API endpoint to save schema to Firestore
app.post('/api/save-schema', async (req, res) => {
  try {
    // Save the product schema to Firestore
    const schemaId = await firestoreSchemas.saveSchema(db, 'Product Schema', productSchema, {
      description: 'A schema for product forms',
      category: 'product'
    });

    res.send(`
      <div class="card">
        <h3>Schema Saved Successfully</h3>
        <p>Schema ID: ${schemaId}</p>
        <button class="button"
          hx-get="/api/get-schema/${schemaId}"
          hx-target="#form-container">
          Show Form
        </button>
      </div>
    `);
  } catch (error) {
    console.error('Error saving schema:', error);
    res.status(500).send(`
      <div class="card" style="border: 1px solid #cf6679; color: #cf6679;">
        <h3>Error Saving Schema</h3>
        <p>${error.message}</p>
        <pre>${error.stack}</pre>
      </div>
    `);
  }
});

// API endpoint to list schemas from Firestore
app.get('/api/list-schemas', async (req, res) => {
  try {
    // List schemas from Firestore
    const schemas = await firestoreSchemas.listSchemas(db);

    if (schemas.length === 0) {
      return res.send(`
        <p>No schemas found. Try saving one first.</p>
      `);
    }

    const schemaListHtml = schemas
      .map(
        (schema) => `
      <div class="card">
        <h3>${schema.name}</h3>
        <p>Created: ${schema.createdAt.toDate().toLocaleString()}</p>
        <p>${schema.description || ''}</p>
        <button class="button"
          hx-get="/api/get-schema/${schema.id}"
          hx-target="#form-container">
          Show Form
        </button>
        <button class="button"
          hx-delete="/api/delete-schema/${schema.id}"
          hx-target="#schema-list"
          style="background-color: #cf6679;">
          Delete
        </button>
      </div>
    `
      )
      .join('');

    res.send(schemaListHtml);
  } catch (error) {
    console.error('Error listing schemas:', error);
    res.status(500).send(`
      <div class="card" style="border: 1px solid #cf6679; color: #cf6679;">
        <h3>Error Listing Schemas</h3>
        <p>${error.message}</p>
      </div>
    `);
  }
});

// API endpoint to get a schema and generate a form
app.get('/api/get-schema/:id', async (req, res) => {
  try {
    // Get the schema from Firestore
    const schemaData = await firestoreSchemas.getSchema(db, req.params.id);

    if (!schemaData) {
      return res.status(404).send(`
        <div class="card" style="border: 1px solid #cf6679; color: #cf6679;">
          <h3>Schema Not Found</h3>
          <p>The requested schema does not exist.</p>
        </div>
      `);
    }

    // Generate a form from the schema
    const form = zodForm(schemaData.schema, {
      action: `/api/submit-form/${req.params.id}`,
      method: 'POST',
      submitLabel: 'Submit'
    });

    res.send(`
      <div class="card">
        <h2>${schemaData.name}</h2>
        <p>${schemaData.description || ''}</p>
        ${form.styles}
        ${form.html}
        <div id="form-submit-response"></div>
        ${form.scripts}
      </div>
    `);
  } catch (error) {
    console.error('Error getting schema:', error);
    res.status(500).send(`
      <div class="card" style="border: 1px solid #cf6679; color: #cf6679;">
        <h3>Error Getting Schema</h3>
        <p>${error.message}</p>
      </div>
    `);
  }
});

// API endpoint to delete a schema
app.delete('/api/delete-schema/:id', async (req, res) => {
  try {
    // Delete the schema from Firestore
    await firestoreSchemas.deleteSchema(db, req.params.id);

    // Return the updated list
    const schemas = await firestoreSchemas.listSchemas(db);

    if (schemas.length === 0) {
      return res.send(`
        <p>No schemas found. Try saving one first.</p>
      `);
    }

    const schemaListHtml = schemas
      .map(
        (schema) => `
      <div class="card">
        <h3>${schema.name}</h3>
        <p>Created: ${schema.createdAt.toDate().toLocaleString()}</p>
        <p>${schema.description || ''}</p>
        <button class="button"
          hx-get="/api/get-schema/${schema.id}"
          hx-target="#form-container">
          Show Form
        </button>
        <button class="button"
          hx-delete="/api/delete-schema/${schema.id}"
          hx-target="#schema-list"
          style="background-color: #cf6679;">
          Delete
        </button>
      </div>
    `
      )
      .join('');

    res.send(schemaListHtml);
  } catch (error) {
    console.error('Error deleting schema:', error);
    res.status(500).send(`
      <div class="card" style="border: 1px solid #cf6679; color: #cf6679;">
        <h3>Error Deleting Schema</h3>
        <p>${error.message}</p>
      </div>
    `);
  }
});

// API endpoint to handle form submission
app.post('/api/submit-form/:id', async (req, res) => {
  try {
    // Get the schema from Firestore
    const schemaData = await firestoreSchemas.getSchema(db, req.params.id);

    if (!schemaData) {
      return res.status(404).send(`
        <div class="card" style="border: 1px solid #cf6679; color: #cf6679;">
          <h3>Schema Not Found</h3>
          <p>The requested schema does not exist.</p>
        </div>
      `);
    }

    // Validate the form data against the schema
    try {
      const validatedData = schemaData.schema.parse(req.body);

      // In a real app, you would save the data to a database
      console.log('Received valid form data:', validatedData);

      // Return a success response
      res.send(`
        <div class="card" style="border: 1px solid #03dac6; color: #03dac6;">
          <h3>Form Submitted Successfully</h3>
          <pre>${JSON.stringify(validatedData, null, 2)}</pre>
        </div>
      `);
    } catch (validationError) {
      console.error('Validation error:', validationError);

      // Format the validation errors
      const formattedErrors = validationError.errors
        .map((err) => `<li>${err.path.join('.')}: ${err.message}</li>`)
        .join('');

      res.status(400).send(`
        <div class="card" style="border: 1px solid #cf6679; color: #cf6679;">
          <h3>Validation Error</h3>
          <ul>
            ${formattedErrors}
          </ul>
        </div>
      `);
    }
  } catch (error) {
    console.error('Error processing form:', error);
    res.status(500).send(`
      <div class="card" style="border: 1px solid #cf6679; color: #cf6679;">
        <h3>Error Processing Form</h3>
        <p>${error.message}</p>
      </div>
    `);
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to see the example`);
});
