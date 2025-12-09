const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FamilyVine API',
      version: '1.0.0',
      description: 'Family tree management system API documentation',
      contact: {
        name: 'FamilyVine Support',
        email: 'support@familyvine.local'
      }
    },
    servers: [
      {
        url: 'http://localhost:5050',
        description: 'Development server'
      },
      {
        url: 'http://192.168.1.171:5050',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /api/auth/login'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'User ID' },
            username: { type: 'string', description: 'Username' },
            email: { type: 'string', format: 'email', description: 'Email address' },
            role: {
              type: 'string',
              enum: ['admin', 'editor', 'viewer'],
              description: 'User role'
            },
            is_active: { type: 'boolean', description: 'Account status' },
            last_login: { type: 'string', format: 'date-time', description: 'Last login timestamp' },
            created_at: { type: 'string', format: 'date-time', description: 'Account creation timestamp' }
          }
        },
        Member: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Member ID' },
            first_name: { type: 'string', description: 'First name' },
            middle_name: { type: 'string', nullable: true, description: 'Middle name' },
            last_name: { type: 'string', description: 'Last name' },
            birth_date: { type: 'string', format: 'date', nullable: true, description: 'Birth date' },
            death_date: { type: 'string', format: 'date', nullable: true, description: 'Death date' },
            birth_place: { type: 'string', nullable: true, description: 'Birth place' },
            location: { type: 'string', nullable: true, description: 'Current location' },
            gender: {
              type: 'string',
              enum: ['Male', 'Female', 'Other'],
              nullable: true,
              description: 'Gender'
            },
            is_alive: { type: 'boolean', description: 'Living status' },
            is_married: { type: 'boolean', description: 'Marital status' },
            spouse_id: { type: 'integer', nullable: true, description: 'Spouse member ID' },
            bio: { type: 'string', nullable: true, description: 'Biography' },
            photo_url: { type: 'string', nullable: true, description: 'Profile photo URL' },
            hero_image_url: { type: 'string', nullable: true, description: 'Hero image URL' }
          }
        },
        Relationship: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Relationship ID' },
            member1_id: { type: 'integer', description: 'First member ID' },
            member2_id: { type: 'integer', description: 'Second member ID' },
            relationship_type: {
              type: 'string',
              enum: [
                'father', 'mother', 'son', 'daughter',
                'brother', 'sister', 'grandfather', 'grandmother',
                'grandson', 'granddaughter', 'uncle', 'aunt',
                'nephew', 'niece', 'cousin', 'husband', 'wife', 'other'
              ],
              description: 'Type of relationship'
            },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' }
          }
        },
        Union: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Union ID' },
            partner1_id: { type: 'integer', description: 'First partner ID' },
            partner2_id: { type: 'integer', nullable: true, description: 'Second partner ID' },
            union_type: {
              type: 'string',
              enum: ['marriage', 'partnership', 'other'],
              nullable: true,
              description: 'Type of union'
            },
            is_primary: { type: 'boolean', description: 'Primary union flag' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' }
          }
        },
        Album: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Album ID' },
            title: { type: 'string', description: 'Album title' },
            description: { type: 'string', nullable: true, description: 'Album description' },
            cover_photo_id: { type: 'integer', nullable: true, description: 'Cover photo ID' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' }
          }
        },
        Photo: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Photo ID' },
            album_id: { type: 'integer', description: 'Album ID' },
            filename: { type: 'string', description: 'File name' },
            path: { type: 'string', description: 'File path' },
            caption: { type: 'string', nullable: true, description: 'Photo caption' },
            uploaded_at: { type: 'string', format: 'date-time', description: 'Upload timestamp' }
          }
        },
        Story: {
          type: 'object',
          properties: {
            id: { type: 'integer', description: 'Story ID' },
            title: { type: 'string', description: 'Story title' },
            content: { type: 'string', description: 'Story content' },
            created_at: { type: 'string', format: 'date-time', description: 'Creation timestamp' },
            updated_at: { type: 'string', format: 'date-time', description: 'Last update timestamp' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Success message' }
          }
        }
      }
    },
    tags: [
      { name: 'Authentication', description: 'User authentication and authorization' },
      { name: 'Members', description: 'Family member management' },
      { name: 'Relationships', description: 'Family relationship management' },
      { name: 'Unions', description: 'Partner union management' },
      { name: 'Albums', description: 'Photo album management' },
      { name: 'Photos', description: 'Photo management' },
      { name: 'Stories', description: 'Family story management' },
      { name: 'Tree', description: 'Family tree visualization' }
    ]
  },
  apis: ['./routes/*.js'] // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
