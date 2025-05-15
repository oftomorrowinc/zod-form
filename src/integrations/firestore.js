/**
 * Firestore integration for ZodForm
 */

/**
 * Save a Zod schema to Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore database instance
 * @param {string} name - Schema name
 * @param {object} schema - Zod schema object
 * @param {object} options - Additional options
 * @returns {Promise<string>} - ID of the saved schema
 */
const saveSchema = async (db, name, schema, options = {}) => {
  try {
    const schemaDoc = {
      name,
      schema: serializeZodSchema(schema),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...options
    };

    // Use provided ID or generate a new one
    if (options.id) {
      await db.collection('zod-form-schemas').doc(options.id).set(schemaDoc);
      return options.id;
    } else {
      const docRef = await db.collection('zod-form-schemas').add(schemaDoc);
      return docRef.id;
    }
  } catch (error) {
    console.error('Error saving schema to Firestore:', error);
    throw error;
  }
};

/**
 * Get a schema from Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore database instance
 * @param {string} id - Schema ID
 * @returns {Promise<object|null>} - Retrieved schema
 */
const getSchema = async (db, id) => {
  try {
    const doc = await db.collection('zod-form-schemas').doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      schema: deserializeZodSchema(data.schema)
    };
  } catch (error) {
    console.error('Error getting schema from Firestore:', error);
    throw error;
  }
};

/**
 * List all schemas in Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore database instance
 * @param {object} options - Query options
 * @returns {Promise<Array>} - List of schemas
 */
const listSchemas = async (db, options = {}) => {
  try {
    let query = db.collection('zod-form-schemas');

    // Apply filters if provided
    if (options.filter) {
      for (const [field, value] of Object.entries(options.filter)) {
        query = query.where(field, '==', value);
      }
    }

    // Apply sorting
    if (options.orderBy) {
      query = query.orderBy(options.orderBy, options.orderDirection || 'asc');
    } else {
      query = query.orderBy('updatedAt', 'desc');
    }

    // Apply pagination
    if (options.limit) {
      query = query.limit(options.limit);
    }

    const snapshot = await query.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data()
      // Don't deserialize the schema here for efficiency
      // schema: deserializeZodSchema(doc.data().schema)
    }));
  } catch (error) {
    console.error('Error listing schemas from Firestore:', error);
    throw error;
  }
};

/**
 * Delete a schema from Firestore
 *
 * @param {FirebaseFirestore.Firestore} db - Firestore database instance
 * @param {string} id - Schema ID
 * @returns {Promise<void>}
 */
const deleteSchema = async (db, id) => {
  try {
    await db.collection('zod-form-schemas').doc(id).delete();
  } catch (error) {
    console.error('Error deleting schema from Firestore:', error);
    throw error;
  }
};

/**
 * Serialize a Zod schema for storage
 * This is a simplified version that handles basic schema types
 *
 * @param {object} schema - Zod schema object
 * @returns {object} - Serialized schema
 */
const serializeZodSchema = (schema) => {
  // For simplicity, we'll store the schema as a JSON string
  // In a real implementation, you'd want to serialize all Zod-specific metadata
  return JSON.stringify(schema._def);
};

/**
 * Deserialize a stored schema back to a Zod schema
 * This is a simplified version that handles basic schema types
 *
 * @param {object} serialized - Serialized schema
 * @returns {object} - Zod schema object
 */
const deserializeZodSchema = (serialized) => {
  // In a real implementation, you'd reconstruct the Zod schema from the serialized data
  // For now, we'll assume the schema is provided in a format that can be used directly
  const { z } = require('zod');

  // For demonstration purposes - in reality, you would need a more sophisticated approach
  // that rebuilds the schema based on the stored definition
  try {
    const def = JSON.parse(serialized);

    // Very simplified example - would need to be much more comprehensive
    if (def.typeName === 'ZodObject') {
      const shape = {};

      Object.entries(def.shape).forEach(([key, fieldDef]) => {
        // This is where you'd recursively rebuild nested schemas
        // For simplicity, we're just creating text fields
        shape[key] = z.string();
      });

      return z.object(shape);
    }

    // Fallback
    return z.object({});
  } catch (error) {
    console.error('Error deserializing schema:', error);
    return z.object({});
  }
};

module.exports = {
  saveSchema,
  getSchema,
  listSchemas,
  deleteSchema
};
