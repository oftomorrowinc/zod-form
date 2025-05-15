/**
 * Modal form example of ZodForm usage with Express and HTMX
 */

const express = require('express');
const { z } = require('zod');
const { zodForm } = require('../../src');

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Define a Zod schema for a contact form
const contactSchema = z.object({
  subject: z.string().min(3, 'Subject must contain at least 3 characters'),
  message: z.string().min(10, 'Message must contain at least 10 characters'),
  priority: z.enum(['low', 'medium', 'high'], {
    errorMap: () => ({ message: 'Please select a valid priority' })
  })
});

// Home page with a button to open the modal
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>ZodForm Modal Example</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com; style-src 'self' 'unsafe-inline';">
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
          }
          
          .button:hover {
            background-color: #3700b3;
            color: white;
          }
          
          #modal-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 1000;
          }
          
          /* Debug helper */
          .debug-info {
            background-color: rgba(0, 0, 0, 0.8);
            color: #00ff00;
            padding: 10px;
            position: fixed;
            bottom: 0;
            right: 0;
            font-family: monospace;
            font-size: 12px;
            max-width: 400px;
            max-height: 200px;
            overflow: auto;
            z-index: 10000;
            display: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>ZodForm Modal Example</h1>
          <p>Click the button below to open a modal contact form</p>
          
          <form action="/api/contact-form" method="GET" class="inline-form">
            <button type="submit" class="button" id="contact-form-button" 
              style="cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">
              Open Contact Form
            </button>
          </form>
          
          <style>
            .inline-form {
              display: inline-block;
              margin: 0;
              padding: 0;
            }
          </style>
          
          <div id="modal-container"></div>
          
          <hr style="margin: 20px 0; border-color: #333;" />
          
          <h2>Alternative buttons</h2>
          <p>Try these if the main button doesn't work:</p>
          
          <a href="/api/contact-form-raw" class="button" style="margin-right: 10px; text-decoration: none;">
            Open Form (New Page)
          </a>
          
          <button id="fetch-form-button" class="button">
            Open Form (Fetch API)
          </button>
          
          <script>
            document.addEventListener('DOMContentLoaded', function() {
              document.getElementById('fetch-form-button').addEventListener('click', function() {
                var modalContainer = document.getElementById('modal-container');
                var debugInfo = document.getElementById('debug-info');
                
                debugInfo.style.display = 'block';
                debugInfo.innerHTML = 'Fetching form...';
                
                fetch('/api/contact-form')
                  .then(function(response) { return response.text(); })
                  .then(function(html) { 
                    modalContainer.innerHTML = html;
                    debugInfo.innerHTML += '<br>Form loaded successfully';
                  })
                  .catch(function(error) {
                    debugInfo.innerHTML += '<br>Error: ' + error;
                    debugInfo.style.color = 'red';
                  });
              });
            });
          </script>
          
          <div class="debug-info" id="debug-info"></div>
        </div>
        
        <script>
          // Simple HTMX debugging
          document.addEventListener('htmx:beforeRequest', function(evt) {
            console.log('htmx request to: ' + evt.detail.requestConfig.path);
            document.getElementById('debug-info').style.display = 'block';
            document.getElementById('debug-info').innerHTML = 'Request to: ' + evt.detail.requestConfig.path;
          });
          
          document.addEventListener('htmx:afterRequest', function(evt) {
            console.log('htmx response: ', evt.detail.xhr.status);
            document.getElementById('debug-info').innerHTML += '<br>Response: ' + evt.detail.xhr.status;
          });
          
          document.addEventListener('htmx:responseError', function(evt) {
            console.error('htmx error: ', evt.detail.xhr.status);
            document.getElementById('debug-info').innerHTML += '<br>Error: ' + evt.detail.xhr.status;
            document.getElementById('debug-info').style.color = 'red';
          });
          
          // Ensure the modal button works even if HTMX doesn't initialize
          document.addEventListener('DOMContentLoaded', function() {
            const contactButton = document.getElementById('contact-form-button');
            contactButton.addEventListener('click', function() {
              console.log('Contact button clicked');
              
              // Show debug info
              document.getElementById('debug-info').style.display = 'block';
              document.getElementById('debug-info').innerHTML = 'Button clicked manually';
              
              // Try manual fetch if HTMX isn't working
              if (!window.htmx || !contactButton.getAttribute('hx-get')) {
                fetch('/api/contact-form')
                  .then(response => response.text())
                  .then(html => {
                    document.getElementById('modal-container').innerHTML = html;
                    document.getElementById('debug-info').innerHTML += '<br>Fetched modal manually';
                  })
                  .catch(error => {
                    console.error('Error fetching modal:', error);
                    document.getElementById('debug-info').innerHTML += '<br>Error: ' + error;
                    document.getElementById('debug-info').style.color = 'red';
                  });
              }
            });
          });
        </script>
      </body>
    </html>
  `);
});

// API endpoint to serve the modal form
app.get('/api/contact-form', (req, res) => {
  console.log('Modal form requested');

  const form = zodForm(contactSchema, {
    action: '/api/send-message',
    method: 'POST',
    submitLabel: 'Send Message'
  });

  // Return the complete page
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Contact Form</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${form.styles}
      </head>
      <body class="zf-dark">
        <div class="zf-container">
          <h1>Contact Us</h1>
          <p>Fill out the form below to send us a message.</p>
          ${form.html}
          <div id="form-response"></div>
          <p>
            <a href="/" class="zf-button zf-button-secondary">Back to Home</a>
          </p>
        </div>
        ${form.scripts}
      </body>
    </html>
  `);
});

// API endpoint to serve the form in a standalone page (for browsers without JavaScript)
app.get('/api/contact-form-raw', (req, res) => {
  console.log('Modal form requested (raw page)');

  const form = zodForm(contactSchema, {
    action: '/api/send-message',
    submitLabel: 'Send Message'
  });

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Contact Form</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${form.styles}
      </head>
      <body class="zf-dark">
        <div class="zf-container">
          <h1>Contact Us</h1>
          ${form.html}
          <div id="form-response"></div>
          <p><a href="/" style="color: #bb86fc;">Back to Home</a></p>
        </div>
        ${form.scripts}
      </body>
    </html>
  `);
});

// API endpoint to handle form submission
app.post('/api/send-message', zodForm.validate(contactSchema), (req, res) => {
  // If we reach here, validation passed
  const messageData = req.validatedData;

  // In a real app, you would save the message to a database
  console.log('Received valid message:', messageData);

  // Return a response that replaces the modal
  res.send(`
    <div class="zf-alert zf-alert-success" style="position: fixed; top: 20px; right: 20px; z-index: 1001; width: 300px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
      <h3>Message Sent!</h3>
      <p>Thank you for your message. We'll get back to you soon.</p>
      <button class="zf-button" onclick="this.parentElement.remove()">Close</button>
    </div>
  `);
});

// API endpoint to close the modal
app.delete('/api/close-modal', (req, res) => {
  console.log('Modal close requested');
  // Return empty content to replace the modal
  res.send('');
});

// Debug endpoint to log and echo requests
app.all('/api/debug', (req, res) => {
  console.log('Debug request received:', {
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query
  });

  res.json({
    success: true,
    method: req.method,
    headers: req.headers,
    body: req.body,
    query: req.query
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to see the example`);
});
