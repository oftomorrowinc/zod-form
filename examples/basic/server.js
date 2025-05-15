/**
 * Basic example of ZodForm usage with Express, Pug, and HTMX
 */

const express = require('express');
const path = require('path');
const { z } = require('zod');

// Import the library
const { zodForm } = require('../../src/index.js');

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

// Define a Zod schema for a user form
const userSchema = z.object({
  name: z.string().min(2, 'Name must contain at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  age: z.number().min(18, 'You must be at least 18 years old').optional(),
  role: z.enum(['admin', 'user', 'editor'], {
    errorMap: () => ({ message: 'Please select a valid role' })
  })
});

// Create a route that renders the form
app.get('/', (req, res) => {
  const form = zodForm(userSchema, {
    action: '/api/submit-user',
    method: 'POST',
    submitLabel: 'Create User',
    theme: 'dark', // default
    layout: 'vertical' // or 'horizontal'
  });

  // Render the form using Pug template
  res.render('index', {
    title: 'ZodForm Basic Example',
    form: form
  });
});

// Create an API endpoint for form submission
app.post('/api/submit-user', zodForm.validate(userSchema), (req, res) => {
  // If we reach here, validation passed
  const userData = req.validatedData;

  // In a real app, you would save the data to a database
  console.log('Received valid user data:', userData);

  // Return a response that HTMX can use
  if (req.headers['hx-request']) {
    // Render success template
    res.render('success', { userData });
  } else {
    res.redirect('/');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to see the example`);
});
