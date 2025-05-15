/**
 * Tests for the form generator functionality
 */

const { z } = require('zod');
const { zodForm } = require('../src');

describe('ZodForm Generator', () => {
  test('generates a form from a simple schema', () => {
    const schema = z.object({
      name: z.string().min(2, "Name must contain at least 2 characters"),
      email: z.string().email("Please enter a valid email address")
    });
    
    const form = zodForm(schema, {
      action: '/submit',
      method: 'POST',
      submitLabel: 'Submit'
    });
    
    // Check that the form was generated
    expect(form).toBeDefined();
    expect(form.html).toBeDefined();
    expect(form.styles).toBeDefined();
    expect(form.scripts).toBeDefined();
    
    // Check for specific content in the form HTML
    expect(form.html).toContain('<form');
    expect(form.html).toContain('action="/submit"');
    expect(form.html).toContain('method="POST"');
    expect(form.html).toContain('name="name"');
    expect(form.html).toContain('name="email"');
    expect(form.html).toContain('type="email"');
    expect(form.html).toContain('Submit');
  });
  
  test('includes validation attributes', () => {
    const schema = z.object({
      name: z.string().min(2, "Name must contain at least 2 characters"),
      age: z.number().min(18, "You must be at least 18 years old")
    });
    
    const form = zodForm(schema);
    
    // Check for validation attributes
    expect(form.html).toContain('required');
    expect(form.html).toContain('minlength="2"');
    expect(form.html).toContain('min="18"');
  });
  
  test('handles different field types', () => {
    const schema = z.object({
      name: z.string(),
      description: z.string().min(100),
      isActive: z.boolean(),
      category: z.enum(['A', 'B', 'C']),
      startDate: z.date()
    });
    
    const form = zodForm(schema);
    
    // Check that the right input types are used
    expect(form.html).toContain('type="text"');
    expect(form.html).toContain('<textarea');
    expect(form.html).toContain('type="checkbox"');
    expect(form.html).toContain('<select');
    expect(form.html).toContain('type="date"');
  });
  
  test('applies customization options', () => {
    const schema = z.object({
      name: z.string()
    });
    
    const form = zodForm(schema, {
      theme: 'light',
      layout: 'horizontal',
      customClasses: {
        form: 'my-custom-form',
        input: 'my-custom-input'
      },
      submitLabel: 'Save Record'
    });
    
    // Check for customizations
    expect(form.html).toContain('my-custom-form');
    expect(form.html).toContain('my-custom-input');
    expect(form.html).toContain('Save Record');
  });
  
  test('generates modal forms', () => {
    const schema = z.object({
      name: z.string()
    });
    
    const modal = zodForm.modal(schema, {
      title: 'Test Modal',
      cancelLabel: 'Cancel Button'
    });
    
    expect(modal.html).toContain('zf-modal');
    expect(modal.html).toContain('Test Modal');
    expect(modal.html).toContain('Cancel Button');
    expect(modal.html).toContain('name="name"');
  });
});