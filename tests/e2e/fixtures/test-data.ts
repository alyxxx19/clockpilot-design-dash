/**
 * Test data fixtures for ClockPilot E2E tests
 */

export const testUsers = {
  employee: {
    email: 'employee@clockpilot.com',
    password: 'password123',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'employee'
  },
  admin: {
    email: 'admin@clockpilot.com',
    password: 'admin123',
    firstName: 'Marie',
    lastName: 'Admin',
    role: 'admin'
  },
  manager: {
    email: 'manager@clockpilot.com',
    password: 'manager123',
    firstName: 'Pierre',
    lastName: 'Manager',
    role: 'manager'
  }
};

export const testEmployees = [
  {
    firstName: 'Alice',
    lastName: 'Dubois',
    email: 'alice.dubois@clockpilot.com',
    employeeNumber: 'EMP001',
    department: 'Développement',
    position: 'Développeur Senior',
    hireDate: '2024-01-15',
    salary: 45000,
    weeklyHours: 35,
    contractType: 'CDI'
  },
  {
    firstName: 'Bob',
    lastName: 'Martin',
    email: 'bob.martin@clockpilot.com',
    employeeNumber: 'EMP002',
    department: 'Design',
    position: 'Designer UX/UI',
    hireDate: '2024-01-20',
    salary: 40000,
    weeklyHours: 35,
    contractType: 'CDI'
  },
  {
    firstName: 'Claire',
    lastName: 'Rousseau',
    email: 'claire.rousseau@clockpilot.com',
    employeeNumber: 'EMP003',
    department: 'Marketing',
    position: 'Chargée de communication',
    hireDate: '2024-02-01',
    salary: 35000,
    weeklyHours: 35,
    contractType: 'CDD'
  }
];

export const testProjects = [
  {
    name: 'Application Mobile',
    code: 'APP-MOB-001',
    description: 'Développement de l\'application mobile ClockPilot',
    client: 'ClockPilot SAS',
    startDate: '2024-01-15',
    endDate: '2024-06-15',
    budget: 150000,
    status: 'active'
  },
  {
    name: 'Site Web Corporate',
    code: 'WEB-CORP-001',
    description: 'Refonte du site web corporate',
    client: 'ClockPilot SAS',
    startDate: '2024-02-01',
    endDate: '2024-04-30',
    budget: 75000,
    status: 'active'
  },
  {
    name: 'API Integration',
    code: 'API-INT-001',
    description: 'Intégration des APIs tierces',
    client: 'Client External',
    startDate: '2024-03-01',
    endDate: '2024-05-31',
    budget: 100000,
    status: 'planning'
  }
];

export const testDepartments = [
  {
    name: 'Développement',
    code: 'DEV',
    description: 'Équipe de développement logiciel',
    budget: 500000,
    manager: 'Pierre Manager'
  },
  {
    name: 'Design',
    code: 'DES',
    description: 'Équipe design et UX/UI',
    budget: 200000,
    manager: 'Marie Admin'
  },
  {
    name: 'Marketing',
    code: 'MKT',
    description: 'Équipe marketing et communication',
    budget: 150000,
    manager: 'Jean Dupont'
  },
  {
    name: 'RH',
    code: 'HR',
    description: 'Ressources Humaines',
    budget: 100000,
    manager: 'Marie Admin'
  }
];

export const testTimeEntries = [
  {
    date: '2024-01-15',
    startTime: '09:00',
    endTime: '17:00',
    project: 'Application Mobile',
    description: 'Développement interface utilisateur',
    type: 'work',
    status: 'pending'
  },
  {
    date: '2024-01-16',
    startTime: '09:00',
    endTime: '18:00',
    project: 'Site Web Corporate',
    description: 'Intégration API backend',
    type: 'work',
    status: 'approved'
  },
  {
    date: '2024-01-17',
    startTime: '09:00',
    endTime: '17:30',
    project: 'Application Mobile',
    description: 'Tests unitaires et debugging',
    type: 'work',
    status: 'rejected'
  }
];

export const testTasks = [
  {
    title: 'Révision code interface',
    description: 'Réviser le code de l\'interface utilisateur principale',
    priority: 'high',
    dueDate: '2024-01-20',
    project: 'Application Mobile',
    assignedTo: 'Alice Dubois',
    status: 'todo'
  },
  {
    title: 'Documentation API',
    description: 'Compléter la documentation des endpoints API',
    priority: 'medium',
    dueDate: '2024-01-25',
    project: 'API Integration',
    assignedTo: 'Bob Martin',
    status: 'in_progress'
  },
  {
    title: 'Tests d\'intégration',
    description: 'Écrire et exécuter les tests d\'intégration',
    priority: 'low',
    dueDate: '2024-01-30',
    project: 'Application Mobile',
    assignedTo: 'Claire Rousseau',
    status: 'completed'
  }
];

export const testNotifications = [
  {
    type: 'planning_update',
    title: 'Planning mis à jour',
    message: 'Votre planning de la semaine prochaine a été modifié',
    priority: 'medium',
    read: false,
    createdAt: new Date('2024-01-15T10:00:00Z')
  },
  {
    type: 'time_entry_approved',
    title: 'Heures approuvées',
    message: 'Vos heures du 14/01/2024 ont été approuvées',
    priority: 'low',
    read: true,
    createdAt: new Date('2024-01-14T16:30:00Z')
  },
  {
    type: 'overtime_alert',
    title: 'Attention heures supplémentaires',
    message: 'Vous approchez de la limite d\'heures supplémentaires',
    priority: 'high',
    read: false,
    createdAt: new Date('2024-01-15T18:00:00Z')
  }
];

export const testSettings = {
  company: {
    name: 'ClockPilot Enterprise',
    address: '123 Rue de la Paix, 75001 Paris',
    phone: '+33 1 23 45 67 89',
    email: 'contact@clockpilot.com',
    website: 'https://clockpilot.com'
  },
  workingHours: {
    defaultWeeklyHours: 35,
    overtimeThreshold: 35,
    weekendWork: false,
    nightWork: false,
    defaultStartTime: '09:00',
    defaultEndTime: '17:00'
  },
  legal: {
    countryCode: 'FR',
    laborLawCompliance: true,
    restPeriodMinutes: 20,
    maxDailyHours: 10,
    maxWeeklyHours: 48
  }
};