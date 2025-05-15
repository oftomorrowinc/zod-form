/**
 * Modal form example of ZodForm usage with Express, Pug, and HTMX
 */

const express = require('express');
const path = require('path');
const { z } = require('zod');
const { zodForm } = require('../../src');

// Error handling
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up Pug as the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

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
  res.render('index', {
    title: 'ZodForm Modal Example'
  });
});

// API endpoint to serve the modal form
app.get('/api/contact-form', (req, res) => {
  console.log('Modal form requested');

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

// API endpoint to serve the form in a standalone page (for browsers without JavaScript)
app.get('/api/contact-form-raw', (req, res) => {
  console.log('Modal form requested (raw page)');

  const form = zodForm(contactSchema, {
    action: '/api/send-message',
    submitLabel: 'Send Message'
  });

  // Render a full page with the form
  res.render('contact-form', {
    title: 'Contact Form',
    form: form
  });
});

// API endpoint to handle form submission
app.post('/api/send-message', zodForm.validate(contactSchema), (req, res) => {
  // If we reach here, validation passed
  const messageData = req.validatedData;

  // In a real app, you would save the message to a database
  console.log('Received valid message:', messageData);

  // Return a response that replaces the modal
  res.render('success');
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
