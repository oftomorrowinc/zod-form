/**
 * Simplified modal example with guaranteed working buttons
 */

const express = require('express');
const { z } = require('zod');
const { zodForm } = require('../../src');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Define a contact form schema
const contactSchema = z.object({
  subject: z.string().min(3, 'Subject must contain at least 3 characters'),
  message: z.string().min(10, 'Message must contain at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Please select a valid priority' })
  })
});

// Home page with options to open modal
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Modal Example</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            background-color: #121212;
            color: rgba(255, 255, 255, 0.87);
            margin: 0;
            padding: 20px;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #bb86fc;
            color: black;
            border: none;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
            margin: 10px 0;
            text-decoration: none;
          }
          
          .button:hover {
            background-color: #3700b3;
            color: white;
          }
          
          .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
          }
          
          .modal-content {
            background-color: #1e1e1e;
            margin: 10% auto;
            padding: 20px;
            width: 80%;
            max-width: 600px;
            border-radius: 8px;
          }
          
          .close {
            color: #aaa;
            float: right;
            font-size: 28px;
            font-weight: bold;
            cursor: pointer;
          }
          
          .close:hover {
            color: white;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>ZodForm Modal Example</h1>
          <p>Click the button below to open a modal contact form:</p>
          
          <!-- Simple JavaScript modal approach -->
          <button id="openModalBtn" class="button">Open Modal (JavaScript)</button>
          
          <!-- Direct link to form page -->
          <p>
            <a href="/modal-form" class="button">Open Form (New Page)</a>
          </p>
          
          <!-- Modal container (hidden initially) -->
          <div id="modalContainer" class="modal">
            <div class="modal-content">
              <span class="close" id="closeModalBtn">&times;</span>
              <div id="modalContent">
                <!-- Form will be loaded here -->
              </div>
            </div>
          </div>
        </div>
        
        <script>
          // Simple modal handling
          document.addEventListener('DOMContentLoaded', function() {
            // Elements
            var modal = document.getElementById('modalContainer');
            var openBtn = document.getElementById('openModalBtn');
            var closeBtn = document.getElementById('closeModalBtn');
            var content = document.getElementById('modalContent');
            
            // Open modal and load form
            openBtn.addEventListener('click', function() {
              fetch('/api/contact-form')
                .then(function(response) { return response.text(); })
                .then(function(html) {
                  content.innerHTML = html;
                  modal.style.display = 'block';
                })
                .catch(function(err) {
                  alert('Error loading form: ' + err.message);
                });
            });
            
            // Close modal
            closeBtn.addEventListener('click', function() {
              modal.style.display = 'none';
            });
            
            // Close on outside click
            window.addEventListener('click', function(event) {
              if (event.target === modal) {
                modal.style.display = 'none';
              }
            });
          });
        </script>
      </body>
    </html>
  `);
});

// API endpoint to provide just the form HTML
app.get('/api/contact-form', (req, res) => {
  const form = zodForm(contactSchema, {
    action: '/api/submit-message',
    submitLabel: 'Send Message',
    // Make sure all forms properly fit inside containers
    attributes: {
      style: 'max-width: 100%;'
    }
  });

  res.send(`
    <h2>Contact Us</h2>
    ${form.styles}
    ${form.html}
    ${form.scripts}
  `);
});

// Standalone form page
app.get('/modal-form', (req, res) => {
  const form = zodForm(contactSchema, {
    action: '/api/submit-message',
    submitLabel: 'Send Message',
    // Make sure all forms properly fit inside containers
    attributes: {
      style: 'max-width: 100%;'
    }
  });

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Contact Form</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            background-color: #121212;
            color: rgba(255, 255, 255, 0.87);
            margin: 0;
            padding: 20px;
          }
          
          .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #bb86fc;
            color: black;
            text-decoration: none;
            border-radius: 4px;
          }
        </style>
        ${form.styles}
      </head>
      <body>
        <div class="container">
          <h1>Contact Form</h1>
          ${form.html}
          <p><a href="/" class="button">Back to Home</a></p>
        </div>
        ${form.scripts}
      </body>
    </html>
  `);
});

// Submit form handler
app.post('/api/submit-message', (req, res) => {
  try {
    // Manually validate with Zod
    const data = contactSchema.parse(req.body);
    console.log('Form data received:', data);

    // Return success response
    res.send(`
      <h2>Message Sent!</h2>
      <div class="zf-alert zf-alert-success">
        <p>Thank you for your message. We'll get back to you soon.</p>
      </div>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `);
  } catch (error) {
    console.error('Validation error:', error);

    // Format errors
    const errorMessages = error.errors
      .map((err) => `<li>${err.path.join('.')}: ${err.message}</li>`)
      .join('');

    // Return error response
    res.status(400).send(`
      <h2>Error</h2>
      <div class="zf-alert zf-alert-error">
        <p>Please correct the following errors:</p>
        <ul>${errorMessages}</ul>
      </div>
    `);
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`New modal example running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to see the example`);
});
