/**
 * Schema parser - Translates Zod schemas into form field definitions
 */

const { z } = require('zod');

/**
 * Map Zod types to HTML form element types
 */
const mapZodTypeToHtmlElement = (zodType, path = '') => {
  if (zodType instanceof z.ZodString) {
    // Handle special string types
    if (zodType._def.checks) {
      for (const check of zodType._def.checks) {
        if (check.kind === 'email') return { type: 'email' };
        if (check.kind === 'url') return { type: 'url' };
        if (check.kind === 'uuid')
          return {
            type: 'text',
            pattern: '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
          };
        if (check.kind === 'min' && check.value >= 100) return { type: 'textarea' };
      }
    }
    return { type: 'text' };
  }

  if (zodType instanceof z.ZodNumber) {
    // Check for range inputs
    if (zodType._def.checks) {
      const minCheck = zodType._def.checks.find((check) => check.kind === 'min');
      const maxCheck = zodType._def.checks.find((check) => check.kind === 'max');

      if (minCheck && maxCheck && maxCheck.value - minCheck.value <= 10) {
        return {
          type: 'range',
          min: minCheck.value,
          max: maxCheck.value
        };
      }
    }
    return { type: 'number' };
  }

  if (zodType instanceof z.ZodBoolean) {
    return { type: 'checkbox' };
  }

  if (zodType instanceof z.ZodDate) {
    return { type: 'date' };
  }

  if (zodType instanceof z.ZodEnum) {
    return {
      type: 'select',
      options: zodType._def.values.map((value) => ({
        value,
        label: value.charAt(0).toUpperCase() + value.slice(1)
      }))
    };
  }

  if (zodType instanceof z.ZodArray) {
    const itemType = mapZodTypeToHtmlElement(zodType._def.type, `${path}.items`);
    return {
      type: 'array',
      itemType
    };
  }

  if (zodType instanceof z.ZodObject) {
    return {
      type: 'object',
      fields: parseSchema(zodType, path)
    };
  }

  if (zodType instanceof z.ZodUnion) {
    return {
      type: 'radio',
      options: zodType._def.options.map((option, index) => ({
        value: String(index),
        label: `Option ${index + 1}`,
        schema: option
      }))
    };
  }

  if (zodType instanceof z.ZodRecord) {
    return {
      type: 'record',
      valueType: mapZodTypeToHtmlElement(zodType._def.valueType, `${path}.values`)
    };
  }

  if (
    zodType._def &&
    zodType._def.typeName === 'ZodEffects' &&
    zodType._def.effect.type === 'refinement'
  ) {
    // Handle refined types (using the inner type)
    return mapZodTypeToHtmlElement(zodType._def.schema, path);
  }

  if (zodType instanceof z.ZodNullable || zodType instanceof z.ZodOptional) {
    const innerType = mapZodTypeToHtmlElement(zodType.unwrap(), path);
    innerType.optional = true;
    return innerType;
  }

  if (zodType._def && zodType._def.typeName === 'ZodInstance') {
    // Check for File instance
    if (zodType._def.cls === File || zodType._def.cls.name === 'File') {
      return { type: 'file' };
    }
  }

  // Default to text input for unknown types
  return { type: 'text' };
};

/**
 * Extract validation rules from Zod schema
 */
const extractValidationRules = (zodType) => {
  const rules = {};

  if (zodType instanceof z.ZodString) {
    if (zodType._def.checks) {
      for (const check of zodType._def.checks) {
        if (check.kind === 'min') rules.minLength = check.value;
        if (check.kind === 'max') rules.maxLength = check.value;
        if (check.kind === 'email') rules.email = true;
        if (check.kind === 'url') rules.url = true;
        if (check.kind === 'regex') rules.pattern = check.regex.source;
      }
    }
  }

  if (zodType instanceof z.ZodNumber) {
    if (zodType._def.checks) {
      for (const check of zodType._def.checks) {
        if (check.kind === 'min') rules.min = check.value;
        if (check.kind === 'max') rules.max = check.value;
        if (check.kind === 'int') rules.integer = true;
        if (check.kind === 'multipleOf') rules.step = check.value;
      }
    }
  }

  // Handle nested schemas
  if (zodType instanceof z.ZodOptional || zodType instanceof z.ZodNullable) {
    return { ...extractValidationRules(zodType.unwrap()), required: false };
  }

  // Handle refined types
  if (
    zodType._def &&
    zodType._def.typeName === 'ZodEffects' &&
    zodType._def.effect.type === 'refinement'
  ) {
    return extractValidationRules(zodType._def.schema);
  }

  // By default, fields are required
  if (!(zodType instanceof z.ZodOptional || zodType instanceof z.ZodNullable)) {
    rules.required = true;
  }

  return rules;
};

/**
 * Extract error messages from Zod schema
 */
const extractErrorMessages = (zodType) => {
  const messages = {};

  if (zodType._def.errorMap) {
    // This is a simplified approach - in reality, we'd need to invoke the error map
    // with different error codes to get all possible messages
    messages.custom = true;
  }

  return messages;
};

/**
 * Parse a Zod schema into form field definitions
 */
const parseSchema = (schema, basePath = '') => {
  const fields = {};

  // Handle objects
  if (schema instanceof z.ZodObject) {
    const shape = schema._def.shape();

    Object.keys(shape).forEach((key) => {
      const fieldPath = basePath ? `${basePath}.${key}` : key;
      const zodType = shape[key];

      const fieldType = mapZodTypeToHtmlElement(zodType, fieldPath);
      const validationRules = extractValidationRules(zodType);
      const errorMessages = extractErrorMessages(zodType);

      fields[key] = {
        name: key,
        path: fieldPath,
        ...fieldType,
        validation: validationRules,
        errors: errorMessages,
        _zodType: zodType // Keep reference to original zod type for validation
      };
    });
  }

  return fields;
};

module.exports = {
  parseSchema,
  mapZodTypeToHtmlElement,
  extractValidationRules
};
