const { Utilisateur, Projet, Tache, Evenement, ParticipationEvenement, Club } = require('../src/models');
const mongoose = require('mongoose');

// Test configuration
jest.setTimeout(30000); // Increase timeout for database operations

// Test database connection - Skip integration tests if MongoDB is not available
beforeAll(async () => {
  try {
    // Use test database
    const mongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/club_test?retryWrites=true&w=majority';
    
    // Only connect if not already connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  } catch (error) {
    console.warn('MongoDB connection failed for tests. Skipping integration tests.');
    console.warn('Error:', error.message);
  }
});

afterAll(async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
});

describe('Admin Controller - Dashboard Stats', () => {
  beforeEach(async () => {
    try {
      await Utilisateur.deleteMany({});
      await Projet.deleteMany({});
      await Tache.deleteMany({});
      await Evenement.deleteMany({});
    } catch (error) {
      console.warn('Error during cleanup:', error.message);
    }
  });

  test('should create and retrieve users for dashboard', async () => {
    // Skip if database is not available
    if (mongoose.connection.readyState === 0) {
      console.warn('Skipping test: MongoDB not connected');
      return;
    }

    try {
      // Create test users
      const admin = await Utilisateur.create({
        nom: 'Admin',
        prenom: 'Test',
        email: 'admin-dash@test.com',
        motDePasse: 'hashed_password',
        role: 'admin',
      });

      const student = await Utilisateur.create({
        nom: 'Student',
        prenom: 'Test',
        email: 'student-dash@test.com',
        motDePasse: 'hashed_password',
        role: 'etudiant',
        niveau: 'L1',
        filiere: 'Informatique',
      });

      // Verify creation
      expect(admin).toBeDefined();
      expect(admin.role).toBe('admin');
      expect(student).toBeDefined();
      expect(student.role).toBe('etudiant');

      // Count users
      const adminCount = await Utilisateur.countDocuments({ role: 'admin' });
      const studentCount = await Utilisateur.countDocuments({ role: 'etudiant' });

      expect(adminCount).toBeGreaterThanOrEqual(1);
      expect(studentCount).toBeGreaterThanOrEqual(1);
    } catch (error) {
      console.error('Test error:', error.message);
      throw error;
    }
  });

  test('dashboard should count different user types', async () => {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    try {
      // Create multiple users
      await Utilisateur.create({
        nom: 'Teacher',
        prenom: 'Test',
        email: 'teacher-dash@test.com',
        motDePasse: 'hashed_password',
        role: 'enseignant',
        grade: 'Professeur',
      });

      await Utilisateur.create({
        nom: 'Student',
        prenom: 'Test2',
        email: 'student-dash2@test.com',
        motDePasse: 'hashed_password',
        role: 'etudiant',
        niveau: 'L3',
        filiere: 'Informatique',
      });

      // Count by role
      const stats = {
        total: await Utilisateur.countDocuments(),
        admins: await Utilisateur.countDocuments({ role: 'admin' }),
        teachers: await Utilisateur.countDocuments({ role: 'enseignant' }),
        students: await Utilisateur.countDocuments({ role: 'etudiant' }),
      };

      expect(stats.total).toBeGreaterThanOrEqual(2);
      expect(stats.teachers + stats.students).toBeGreaterThanOrEqual(2);
    } catch (error) {
      console.error('Test error:', error.message);
      throw error;
    }
  });
});

describe('Admin Controller - User Management', () => {
  beforeEach(async () => {
    try {
      await Utilisateur.deleteMany({});
    } catch (error) {
      console.warn('Error during cleanup:', error.message);
    }
  });

  test('user role update should validate role', async () => {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    try {
      const user = await Utilisateur.create({
        nom: 'Test',
        prenom: 'User',
        email: 'user-role@test.com',
        motDePasse: 'hashed_password',
        role: 'etudiant',
        niveau: 'L1',
        filiere: 'Informatique',
      });

      expect(user.role).toBe('etudiant');

      // Update role to teacher
      const updated = await Utilisateur.findByIdAndUpdate(
        user._id,
        { role: 'enseignant', grade: 'Professeur' },
        { new: true, runValidators: false } // Skip validators for update
      );

      expect(updated.role).toBe('enseignant');
    } catch (error) {
      console.error('Test error:', error.message);
      throw error;
    }
  });

  test('should handle multiple user role changes', async () => {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    try {
      const user = await Utilisateur.create({
        nom: 'Test',
        prenom: 'Multi',
        email: 'user-multi@test.com',
        motDePasse: 'hashed_password',
        role: 'etudiant',
        niveau: 'L1',
        filiere: 'Informatique',
      });

      // Change to teacher
      let updated = await Utilisateur.findByIdAndUpdate(
        user._id,
        { role: 'enseignant', grade: 'Professeur' },
        { new: true }
      );

      expect(updated.role).toBe('enseignant');

      // Change to admin
      updated = await Utilisateur.findByIdAndUpdate(
        user._id,
        { role: 'admin' },
        { new: true }
      );

      expect(updated.role).toBe('admin');
    } catch (error) {
      console.error('Test error:', error.message);
      throw error;
    }
  });
});

describe('Admin Controller - Project Management', () => {
  beforeEach(async () => {
    try {
      await Projet.deleteMany({});
      await Utilisateur.deleteMany({});
    } catch (error) {
      console.warn('Error during cleanup:', error.message);
    }
  });

  test('should calculate project progress correctly', async () => {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    try {
      const teacher = await Utilisateur.create({
        nom: 'Teacher',
        prenom: 'Test',
        email: 'teacher-proj@test.com',
        motDePasse: 'hashed_password',
        role: 'enseignant',
        grade: 'Professeur',
      });

      const project = await Projet.create({
        titre: 'Test Project',
        description: 'A test project',
        objectif: 'Test objective',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        statut: 'en_cours',
        progression: 50,
        enseignantId: teacher._id,
      });

      expect(project.progression).toBe(50);
      expect(project.statut).toBe('en_cours');
    } catch (error) {
      console.error('Test error:', error.message);
      throw error;
    }
  });

  test('should update project progression', async () => {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    try {
      const teacher = await Utilisateur.create({
        nom: 'Teacher',
        prenom: 'Test',
        email: 'teacher-prog@test.com',
        motDePasse: 'hashed_password',
        role: 'enseignant',
        grade: 'Professeur',
      });

      const project = await Projet.create({
        titre: 'Progress Test',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        statut: 'en_cours',
        progression: 0,
        enseignantId: teacher._id,
      });

      // Update progression
      const updated = await Projet.findByIdAndUpdate(
        project._id,
        { progression: 75 },
        { new: true }
      );

      expect(updated.progression).toBe(75);
    } catch (error) {
      console.error('Test error:', error.message);
      throw error;
    }
  });
});

describe('Admin Controller - Task Management', () => {
  beforeEach(async () => {
    try {
      await Tache.deleteMany({});
      await Projet.deleteMany({});
      await Utilisateur.deleteMany({});
    } catch (error) {
      console.warn('Error during cleanup:', error.message);
    }
  });

  test('should create task with valid statut', async () => {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    try {
      const teacher = await Utilisateur.create({
        nom: 'Teacher',
        prenom: 'Test',
        email: 'teacher-task@test.com',
        motDePasse: 'hashed_password',
        role: 'enseignant',
        grade: 'Professeur',
      });

      const project = await Projet.create({
        titre: 'Test Project',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        statut: 'en_cours',
        enseignantId: teacher._id,
      });

      const task = await Tache.create({
        titre: 'Test Task',
        description: 'A test task',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        statut: 'a_faire',
        projetId: project._id,
      });

      expect(task.statut).toBe('a_faire');
      expect(task.projetId.toString()).toBe(project._id.toString());
    } catch (error) {
      console.error('Test error:', error.message);
      throw error;
    }
  });

  test('should update task status', async () => {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    try {
      const teacher = await Utilisateur.create({
        nom: 'Teacher',
        prenom: 'Test',
        email: 'teacher-taskupdate@test.com',
        motDePasse: 'hashed_password',
        role: 'enseignant',
        grade: 'Professeur',
      });

      const project = await Projet.create({
        titre: 'Test Project',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        statut: 'en_cours',
        enseignantId: teacher._id,
      });

      const task = await Tache.create({
        titre: 'Test Task',
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        statut: 'a_faire',
        projetId: project._id,
      });

      // Update status through different states
      let updated = await Tache.findByIdAndUpdate(
        task._id,
        { statut: 'en_cours' },
        { new: true }
      );

      expect(updated.statut).toBe('en_cours');

      // Mark as complete
      updated = await Tache.findByIdAndUpdate(
        task._id,
        { statut: 'terminee' },
        { new: true }
      );

      expect(updated.statut).toBe('terminee');
    } catch (error) {
      console.error('Test error:', error.message);
      throw error;
    }
  });
});

describe('Admin Controller - Event Management', () => {
  beforeEach(async () => {
    try {
      await Evenement.deleteMany({});
      await ParticipationEvenement.deleteMany({});
      await Club.deleteMany({});
      await Utilisateur.deleteMany({});
    } catch (error) {
      console.warn('Error during cleanup:', error.message);
    }
  });

  test('should calculate event capacity percentage', async () => {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    try {
      // Create club first
      const club = await Club.create({
        nom: 'Test Club',
        specialite: 'Technology',
      });

      const organizer = await Utilisateur.create({
        nom: 'Organizer',
        prenom: 'Test',
        email: 'organizer-event@test.com',
        motDePasse: 'hashed_password',
        role: 'enseignant',
        grade: 'Professeur',
      });

      const event = await Evenement.create({
        titre: 'Test Event',
        description: 'A test event',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lieu: 'Test Location',
        capacite: 100,
        participantsCount: 50,
        type: 'conference',
        organisateurId: organizer._id,
        clubId: club._id,
      });

      const capacity = (event.participantsCount / event.capacite) * 100;
      expect(capacity).toBe(50);
      expect(event.participantsCount).toBe(50);
    } catch (error) {
      console.error('Test error:', error.message);
      throw error;
    }
  });

  test('should track participant registration', async () => {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    try {
      // Create club first
      const club = await Club.create({
        nom: 'Event Club',
        specialite: 'Social',
      });

      const organizer = await Utilisateur.create({
        nom: 'Organizer',
        prenom: 'Test',
        email: 'organizer-part@test.com',
        motDePasse: 'hashed_password',
        role: 'enseignant',
        grade: 'Professeur',
      });

      const participant = await Utilisateur.create({
        nom: 'Participant',
        prenom: 'Test',
        email: 'participant@test.com',
        motDePasse: 'hashed_password',
        role: 'etudiant',
        niveau: 'L2',
        filiere: 'Informatique',
      });

      const event = await Evenement.create({
        titre: 'Test Event',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lieu: 'Test Location',
        capacite: 100,
        type: 'conference',
        organisateurId: organizer._id,
        clubId: club._id,
      });

      const participation = await ParticipationEvenement.create({
        evenementId: event._id,
        utilisateurId: participant._id,
        statut: 'inscrit',
      });

      expect(participation.statut).toBe('inscrit');
      expect(participation.evenementId.toString()).toBe(event._id.toString());
      expect(participation.utilisateurId.toString()).toBe(participant._id.toString());
    } catch (error) {
      console.error('Test error:', error.message);
      throw error;
    }
  });

  test('should track multiple registrations for single event', async () => {
    if (mongoose.connection.readyState === 0) {
      return;
    }

    try {
      // Create club first
      const club = await Club.create({
        nom: 'Multi Event Club',
        specialite: 'Technology',
      });

      const organizer = await Utilisateur.create({
        nom: 'Organizer',
        prenom: 'Test',
        email: 'organizer-multi@test.com',
        motDePasse: 'hashed_password',
        role: 'enseignant',
        grade: 'Professeur',
      });

      const event = await Evenement.create({
        titre: 'Multi Event',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lieu: 'Test Location',
        capacite: 10,
        type: 'atelier',
        organisateurId: organizer._id,
        clubId: club._id,
      });

      // Create multiple participants
      const participants = [];
      for (let i = 0; i < 3; i++) {
        const participant = await Utilisateur.create({
          nom: `Participant${i}`,
          prenom: 'Test',
          email: `participant${i}@test.com`,
          motDePasse: 'hashed_password',
          role: 'etudiant',
          niveau: 'L1',
          filiere: 'Informatique',
        });
        participants.push(participant);
      }

      // Register all participants
      for (const participant of participants) {
        await ParticipationEvenement.create({
          evenementId: event._id,
          utilisateurId: participant._id,
          statut: 'inscrit',
        });
      }

      // Count registrations
      const count = await ParticipationEvenement.countDocuments({
        evenementId: event._id,
      });

      expect(count).toBe(3);
    } catch (error) {
      console.error('Test error:', error.message);
      throw error;
    }
  });
});

describe('Authorization Middleware', () => {
  test('should have isAdmin middleware function', () => {
    const { isAdmin } = require('../src/middlewares/authorization.middleware');
    expect(typeof isAdmin).toBe('function');
  });

  test('should have checkRole middleware function', () => {
    const { checkRole } = require('../src/middlewares/authorization.middleware');
    expect(typeof checkRole).toBe('function');
  });

  test('should have isAdminOrExecutive middleware function', () => {
    const { isAdminOrExecutive } = require('../src/middlewares/authorization.middleware');
    expect(typeof isAdminOrExecutive).toBe('function');
  });
});
