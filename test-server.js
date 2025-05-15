/**
 * Test server to check if ZodForm is working correctly
 */

const { zodForm } = require('./src/index.js');
const { z } = require('zod');

try {
  console.log('Initializing ZodForm test...');
  
  // Define a simple schema
  const schema = z.object({
    name: z.string().min(2)
  });
  
  console.log('Creating form...');
  
  // Generate a form
  const form = zodForm(schema, {
    action: '/test',
    submitLabel: 'Submit Test'
  });
  
  console.log('Form generation successful!');
  console.log('HTML length:', form.html.length);
  console.log('Styles length:', form.styles.length);
  console.log('Scripts length:', form.scripts.length);
  
  // Check if the form contains expected content
  if (form.html.includes('name="name"') && 
      form.html.includes('Submit Test') && 
      form.styles.includes('zf-form')) {
    console.log('Form content validation: PASSED');
  } else {
    console.log('Form content validation: FAILED');
    console.log('Form HTML snippet:', form.html.substring(0, 100) + '...');
  }
  
  console.log('Test completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('Test failed with error:', error);
  process.exit(1);
}