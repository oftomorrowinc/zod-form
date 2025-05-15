/**
 * Super simple modal form example without any complex features
 */

const express = require('express');
const { z } = require('zod');
const { zodForm } = require('../../src');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Define a simple contact schema
const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  message: z.string().min(10, 'Message must be at least 10 characters')
});

// Home page with basic links
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Simple ZodForm Example</title>
        <style>
          body {
            font-family: sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f0f0f0;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background: #4285f4;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin: 10px 0;
            font-weight: bold;
            cursor: pointer;
            border: none;
          }
          h1 { color: #333; }
        </style>
      </head>
      <body>
        <h1>Simple ZodForm Example</h1>
        <p>Click one of the links below to see a form:</p>
        
        <p>
          <a href="/form" class="button">View Form</a>
        </p>
        
        <p>
          <form action="/form" method="get">
            <button type="submit" class="button">Form Button</button>
          </form>
        </p>
        
        <p>
          Normal link: <a href="/form">Form Link</a>
        </p>
      </body>
    </html>
  `);
});

// Simple form page
app.get('/form', (req, res) => {
  const form = zodForm(contactSchema, {
    action: '/submit',
    submitLabel: 'Submit Form'
  });

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Form Page</title>
        <style>
          body {
            font-family: sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f0f0f0;
          }
          a {
            color: #4285f4;
            text-decoration: none;
          }
        </style>
        ${form.styles}
      </head>
      <body>
        <h1>Contact Form</h1>
        ${form.html}
        <p><a href="/">Back to Home</a></p>
        ${form.scripts}
      </body>
    </html>
  `);
});

// Form submission handler
app.post('/submit', (req, res) => {
  try {
    // Validate with Zod manually
    const formData = contactSchema.parse(req.body);
    console.log('Form submitted:', formData);

    // Show success
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Success</title>
          <style>
            body {
              font-family: sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: #f0f0f0;
            }
            .success {
              background: #d4edda;
              color: #155724;
              padding: 15px;
              border-radius: 4px;
              margin-bottom: 20px;
            }
            a {
              color: #4285f4;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <h1>Form Submitted</h1>
          <div class="success">
            <p>Thank you for your submission!</p>
          </div>
          <p><a href="/">Back to Home</a></p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Validation error:', error);

    // Show error
    res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Error</title>
          <style>
            body {
              font-family: sans-serif;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
              background: #f0f0f0;
            }
            .error {
              background: #f8d7da;
              color: #721c24;
              padding: 15px;
              border-radius: 4px;
              margin-bottom: 20px;
            }
            a {
              color: #4285f4;
              text-decoration: none;
            }
          </style>
        </head>
        <body>
          <h1>Error</h1>
          <div class="error">
            <p>There was an error processing your form:</p>
            <pre>${JSON.stringify(error.errors, null, 2)}</pre>
          </div>
          <p><a href="/form">Back to Form</a></p>
        </body>
      </html>
    `);
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Simple server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to see the example`);
});
