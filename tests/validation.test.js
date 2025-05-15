/**
 * Tests for the validation functionality
 */

const { z } = require('zod');
const { zodForm } = require('../src');
const express = require('express');
const request = require('supertest');

describe('ZodForm Validation', () => {
  let app;
  
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
  });
  
  test('validates valid data', async () => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email()
    });
    
    app.post('/test', zodForm.validate(schema), (req, res) => {
      res.status(200).json({ success: true, data: req.validatedData });
    });
    
    const response = await request(app)
      .post('/test')
      .send({ name: 'John Doe', email: 'john@example.com' })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      name: 'John Doe',
      email: 'john@example.com'
    });
  });
  
  test('rejects invalid data', async () => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email()
    });
    
    app.post('/test', zodForm.validate(schema), (req, res) => {
      res.status(200).json({ success: true, data: req.validatedData });
    });
    
    const response = await request(app)
      .post('/test')
      .send({ name: 'J', email: 'not-an-email' })
      .expect(400);
    
    expect(response.body.success).toBe(false);
    expect(response.body.errors).toBeDefined();
    expect(Object.keys(response.body.errors).length).toBe(2);
  });
  
  test('handles optional fields', async () => {
    const schema = z.object({
      name: z.string().min(2),
      age: z.number().min(18).optional()
    });
    
    app.post('/test', zodForm.validate(schema), (req, res) => {
      res.status(200).json({ success: true, data: req.validatedData });
    });
    
    const response = await request(app)
      .post('/test')
      .send({ name: 'John Doe' })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      name: 'John Doe'
    });
  });
  
  test('handles nested objects', async () => {
    const schema = z.object({
      name: z.string().min(2),
      address: z.object({
        street: z.string(),
        city: z.string()
      })
    });
    
    app.post('/test', zodForm.validate(schema), (req, res) => {
      res.status(200).json({ success: true, data: req.validatedData });
    });
    
    const response = await request(app)
      .post('/test')
      .send({
        name: 'John Doe',
        address: {
          street: '123 Main St',
          city: 'New York'
        }
      })
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.address.city).toBe('New York');
  });
  
  test('handles HTMX requests differently', async () => {
    const schema = z.object({
      name: z.string().min(2)
    });
    
    app.post('/test', zodForm.validate(schema), (req, res) => {
      res.status(200).send('Success');
    });
    
    const response = await request(app)
      .post('/test')
      .set('HX-Request', 'true')
      .send({ name: 'J' })
      .expect(400);
    
    // HTMX validation errors return HTML, not JSON
    expect(response.text).toContain('zf-alert-error');
    expect(response.text).toContain('errors');
  });
  
  test('handles field-level validation for HTMX', async () => {
    const schema = z.object({
      name: z.string().min(2)
    });
    
    app.post('/test', zodForm.validate(schema), (req, res) => {
      res.status(200).send('Success');
    });
    
    const response = await request(app)
      .post('/test')
      .set('HX-Request', 'true')
      .set('HX-Trigger-Name', 'name')
      .send({ name: 'J' })
      .expect(400);
    
    // Field-level validation returns just the error for that field
    expect(response.text).toContain('zf-error');
    expect(response.text).not.toContain('zf-alert-error');
  });
});