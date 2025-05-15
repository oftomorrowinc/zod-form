/**
 * Example showcasing all ZodForm field types and enhanced custom components
 *
 * This example demonstrates:
 * - Star rating component with clickable stars
 * - Textarea with document upload
 * - File upload with image preview
 * - Array fields with add/remove functionality
 * - Conditional fields based on selection
 * - Enhanced input styles and validation
 * - Integration with Pug templates
 */

const express = require('express');
const path = require('path');
const { z } = require('zod');
const { zodForm } = require('../../src');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up Pug as the view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Define a comprehensive schema with all field types
const allFieldsSchema = z.object({
  // Basic text inputs
  name: z.string().min(2, 'Name must contain at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  
  // Should validate as URL
  website: z.string().url('Please enter a valid URL').optional(),
  
  // Numbers and ranges
  age: z.number().min(18, 'You must be at least 18 years old').max(120),
  temperature: z
    .number()
    .min(0, 'Temperature must be positive')
    .max(1, 'Temperature must be between 0 and 1')
    .step(0.01),
  
  // Star rating (1-5)
  satisfaction: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  
  // Select and enum
  country: z.enum(['usa', 'canada', 'uk', 'australia', 'other'], {
    errorMap: () => ({ message: 'Please select a valid country' })
  }),
  
  // Email subscription checkbox
  subscribe: z.boolean().default(false),
  termsAccepted: z.boolean(),
  
  // Date
  birthdate: z.date(),
  
  // These should be textareas with document upload
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
  notes: z.string().min(5, 'Notes must be at least 5 characters').optional(),
  
  // Image upload with preview
  avatar: z.instanceof(File).optional(),
  
  // Document upload with text extraction
  document: z.string().min(5, 'Document text must be at least 5 characters').optional(),
  
  // Array fields with add/remove functionality
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  
  // Nested object
  address: z
    .object({
      street: z.string(),
      city: z.string(),
      postalCode: z.string()
    })
    .optional(),
  
  // Contact preference that changes form below
  contactPreference: z.enum(['email', 'phone', 'mail']),
  
  // Conditional fields based on contact preference
  phoneNumber: z.string().optional(),
  alternativeEmail: z.string().email('Please enter a valid alternative email').optional(),
  mailingAddress: z.string().optional()
});

// Home page with form
app.get('/', (req, res) => {
  const form = zodForm(allFieldsSchema, {
    action: '/api/submit',
    method: 'POST',
    enctype: 'multipart/form-data',
    submitLabel: 'Submit Form',
    theme: 'dark',
    
    // Field-specific overrides
    fieldOptions: {
      // URL validation with placeholder
      website: {
        placeholder: 'https://example.com',
        type: 'url' // Ensure browser validation
      },
      
      // Explicitly set textarea type
      bio: {
        type: 'textarea',
        documentUpload: true,
        rows: 5,
        placeholder: 'Tell us about yourself...'
      },
      notes: {
        type: 'textarea',
        documentUpload: true,
        placeholder: 'Additional notes here...'
      },
      
      // Email subscription with label
      subscribe: {
        label: 'Subscribe to our newsletter via email'
      },
      
      // Enhanced file uploads
      avatar: {
        imageUpload: true,
        accept: 'image/*',
        label: 'Profile Picture'
      },
      
      // Document with text extraction
      document: {
        type: 'textarea',
        documentUpload: true,
        rows: 4,
        placeholder: 'Upload a document to extract text or enter text directly...',
        label: 'Document Text'
      },
      
      // Custom star rating 
      satisfaction: {
        type: 'stars',  // Custom type for star rating (will fall back to range if not implemented)
        unit: '★',
        label: 'Satisfaction Rating'
      },
      
      // Array fields with proper options
      interests: {
        options: [
          { value: 'sports', label: 'Sports' },
          { value: 'music', label: 'Music' },
          { value: 'movies', label: 'Movies' },
          { value: 'reading', label: 'Reading' },
          { value: 'travel', label: 'Travel' },
          { value: 'cooking', label: 'Cooking' },
          { value: 'technology', label: 'Technology' }
        ],
        addLabel: 'Add Interest'
      },
      
      // Conditional field labels
      phoneNumber: {
        label: 'Phone Number',
        placeholder: 'Enter your phone number'
      },
      alternativeEmail: {
        label: 'Alternative Email',
        placeholder: 'Enter alternative email'
      },
      mailingAddress: {
        type: 'textarea',
        label: 'Mailing Address',
        rows: 3,
        placeholder: 'Enter your mailing address'
      },
      
      // Custom range inputs
      temperature: {
        unit: '°C',
        step: 0.01
      }
    },
    
    // Set conditional logic for all contact preference options
    conditionalLogic: {
      phoneNumber: { show: 'contactPreference', equals: 'phone' },
      alternativeEmail: { show: 'contactPreference', equals: 'email' },
      mailingAddress: { show: 'contactPreference', equals: 'mail' }
    }
  });
  
  // Render the form using Pug template
  res.render('index', {
    title: 'ZodForm - All Field Types',
    form: form
  });
});

// For file uploads
const multer = require('multer');
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// API endpoint to handle form submission
app.post('/api/submit', upload.single('avatar'), (req, res) => {
  try {
    // For simplicity, we're not doing full validation
    // In a real app, you would use zodForm.validate middleware
    
    // Process the form data
    const formData = req.body;
    
    // Handle array fields
    Object.keys(formData).forEach((key) => {
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
    
    // Handle file uploads
    const fileInfo = req.file
      ? {
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype
        }
      : 'No file uploaded';
    
    console.log('Form data received:', {
      ...formData,
      // Don't log full file data
      avatar: fileInfo
    });
    
    // Return success response for HTMX
    if (req.headers['hx-request']) {
      res.render('success', {
        formData: { ...formData, avatar: fileInfo }
      });
    } else {
      // For regular form submissions, render the page with a success message
      const form = zodForm(allFieldsSchema, {
        action: '/api/submit',
        method: 'POST',
        enctype: 'multipart/form-data',
        submitLabel: 'Submit Form',
        theme: 'dark'
      });
      
      res.render('index', {
        title: 'ZodForm - All Field Types',
        form: form,
        successData: { ...formData, avatar: fileInfo }
      });
    }
  } catch (error) {
    console.error('Error processing form:', error);
    
    // Return error response
    if (req.headers['hx-request']) {
      res.status(400).render('error', {
        errorMessage: error.message
      });
    } else {
      res.status(400).render('index', {
        title: 'ZodForm - All Field Types',
        form: zodForm(allFieldsSchema, {
          action: '/api/submit',
          method: 'POST',
          enctype: 'multipart/form-data'
        }),
        errorMessage: error.message
      });
    }
  }
});

// Add script to package.json to run this example:
// "start:all-fields": "node examples/all-fields/server.js"

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`All Fields example running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} to see the example`);
});