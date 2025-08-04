import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'ClockPilot API',
    version: '1.0.0',
    description: 'API complète pour la gestion des temps et de planification ClockPilot',
    contact: {
      name: 'Support ClockPilot',
      email: 'support@clockpilot.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: process.env.BASE_URL || 'http://localhost:5000',
      description: 'Serveur de développement',
    },
    {
      url: 'https://api.clockpilot.com',
      description: 'Serveur de production',
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT pour l\'authentification',
      },
    },
    schemas: {
      // Schémas de données
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          email: { type: 'string', format: 'email', example: 'user@clockpilot.com' },
          firstName: { type: 'string', example: 'Jean' },
          lastName: { type: 'string', example: 'Dupont' },
          role: { type: 'string', enum: ['admin', 'manager', 'employee'], example: 'employee' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Employee: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          firstName: { type: 'string', example: 'Marie' },
          lastName: { type: 'string', example: 'Martin' },
          email: { type: 'string', format: 'email', example: 'marie.martin@entreprise.com' },
          departmentId: { type: 'integer', example: 2 },
          contractType: { type: 'string', enum: ['CDI', 'CDD', 'Stage', 'Freelance'], example: 'CDI' },
          weeklyHours: { type: 'number', example: 35 },
          hireDate: { type: 'string', format: 'date', example: '2024-01-15' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      TimeEntry: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'te_123456' },
          employeeId: { type: 'integer', example: 1 },
          date: { type: 'string', format: 'date', example: '2024-08-03' },
          startTime: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', example: '09:00' },
          endTime: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$', example: '17:30' },
          breakDuration: { type: 'integer', minimum: 0, example: 60, description: 'Durée de pause en minutes' },
          workedHours: { type: 'number', minimum: 0, example: 7.5 },
          overtimeHours: { type: 'number', minimum: 0, example: 0 },
          status: { type: 'string', enum: ['draft', 'submitted', 'validated', 'rejected'], example: 'validated' },
          notes: { type: 'string', example: 'Journée de formation' },
          validatedAt: { type: 'string', format: 'date-time', nullable: true },
          validatedBy: { type: 'integer', nullable: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Planning: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          employeeId: { type: 'integer', example: 1 },
          date: { type: 'string', format: 'date', example: '2024-08-03' },
          startTime: { type: 'string', example: '09:00' },
          endTime: { type: 'string', example: '17:00' },
          breakDuration: { type: 'integer', example: 60 },
          status: { type: 'string', enum: ['draft', 'published', 'validated'], example: 'published' },
          notes: { type: 'string', example: 'Planning standard' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      PaginatedResponse: {
        type: 'object',
        properties: {
          data: { type: 'array', items: {} },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer', example: 1 },
              limit: { type: 'integer', example: 20 },
              total: { type: 'integer', example: 150 },
              totalPages: { type: 'integer', example: 8 },
              hasNext: { type: 'boolean', example: true },
              hasPrev: { type: 'boolean', example: false },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Message d\'erreur' },
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          details: { type: 'object', additionalProperties: true },
        },
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Erreurs de validation' },
          code: { type: 'string', example: 'VALIDATION_ERROR' },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: { type: 'string', example: 'email' },
                message: { type: 'string', example: 'Format d\'email invalide' },
              },
            },
          },
        },
      },
    },
    responses: {
      UnauthorizedError: {
        description: 'Token d\'authentification manquant ou invalide',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Token d\'authentification requis',
              code: 'UNAUTHORIZED',
            },
          },
        },
      },
      ValidationError: {
        description: 'Erreurs de validation des données',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/ValidationError' },
          },
        },
      },
      NotFoundError: {
        description: 'Ressource non trouvée',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Ressource non trouvée',
              code: 'NOT_FOUND',
            },
          },
        },
      },
      ServerError: {
        description: 'Erreur interne du serveur',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/Error' },
            example: {
              error: 'Erreur interne du serveur',
              code: 'INTERNAL_ERROR',
            },
          },
        },
      },
    },
  },
  security: [
    {
      BearerAuth: [],
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: [
    './server/routes.ts',
    './server/swagger-docs/*.ts',
  ],
};

const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express) {
  // Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info .title { color: #1a73e8 }
    `,
    customSiteTitle: 'ClockPilot API Documentation',
  }));

  // Swagger JSON
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}

export { swaggerSpec };