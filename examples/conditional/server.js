/**
 * Conditional fields example of ZodForm usage with Express and HTMX
 */

const express = require('express');
const { z } = require('zod');
const { zodForm } = require('../../src');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Define a Zod schema with conditional fields
const employmentSchema = z.object({
  name: z.string().min(2, 'Name must contain at least 2 characters'),
  employmentStatus: z.enum(['employed', 'self-employed', 'unemployed', 'student'], {
    errorMap: () => ({ message: 'Please select a valid employment status' })
  }),
  companyName: z.string().min(2, 'Company name must contain at least 2 characters').optional(),
  businessName: z.string().min(2, 'Business name must contain at least 2 characters').optional(),
  schoolName: z.string().min(2, 'School name must contain at least 2 characters').optional(),
  yearsExperience: z.number().min(0, 'Years of experience cannot be negative').optional(),
  resume: z.instanceof(File).optional()
});

// Home page with the conditional form
app.get('/', (req, res) => {
  const form = zodForm(employmentSchema, {
    action: '/api/submit-employment',
    method: 'POST',
    enctype: 'multipart/form-data',
    submitLabel: 'Submit Information',
    theme: 'dark',
    // Define conditional logic
    conditionalLogic: {
      companyName: { show: 'employmentStatus', equals: 'employed' },
      businessName: { show: 'employmentStatus', equals: 'self-employed' },
      schoolName: { show: 'employmentStatus', equals: 'student' },
      yearsExperience: { show: 'employmentStatus', notEquals: 'student' },
      resume: { show: 'employmentStatus', notEquals: 'unemployed' }
    }
  });

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>ZodForm Conditional Fields Example</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        ${form.styles}
        <script src="https://unpkg.com/htmx.org@1.9.3"></script>
      </head>
      <body class="zf-dark">
        <div class="zf-container">
          <h1>Employment Information</h1>
          <p>Fields will appear or disappear based on your employment status.</p>
          ${form.html}
          <div id="form-response"></div>
        </div>
        ${form.scripts}
      </body>
    </html>
  `);
});

// API endpoint to handle form submission
app.post('/api/submit-employment', zodForm.validate(employmentSchema), (req, res) => {
  // If we reach here, validation passed
  const employmentData = req.validatedData;

  // In a real app, you would save the data to a database
  console.log('Received valid employment data:', employmentData);

  // Return a response that HTMX can use
  if (req.headers['hx-request']) {
    res.send(`
      <div class="zf-alert zf-alert-success">
        Information submitted successfully!
        <pre>${JSON.stringify(employmentData, null, 2)}</pre>
      </div>
    `);
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
