// Configuration des variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/clockpilot_test';
process.env.BCRYPT_ROUNDS = '4'; // Réduire les rounds pour accélérer les tests

// Configuration des timeouts
process.env.TEST_TIMEOUT = '5000';

// Désactiver les logs pendant les tests
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
}