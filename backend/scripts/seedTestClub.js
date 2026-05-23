require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const { Utilisateur, Club } = require('../src/models');

async function seedTestClub() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/club?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');

    const clubEmail = 'club@test.com';
    const clubPassword = 'test123';

    // Check if user already exists
    let user = await Utilisateur.findOne({ email: clubEmail });
    if (user && user.clubId) {
      console.log(`✓ Club user already exists: ${clubEmail}`);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create or get the club
    let club = await Club.findOne({ nom: 'Test Club' });
    if (!club) {
      club = await Club.create({
        nom: 'Test Club',
        description: 'A test club for testing the club dashboard',
        specialite: 'Technology',
      });
      console.log(`✓ Created club: ${club.nom}`);
    } else {
      console.log(`✓ Club already exists: ${club.nom}`);
    }

    // Create or update the user
    const passwordHash = await bcrypt.hash(clubPassword, 12);
    
    if (!user) {
      user = await Utilisateur.create({
        email: clubEmail,
        motDePasse: passwordHash,
        role: 'club',
        clubId: club._id,
      });
      console.log(`✓ Created club user: ${user.email}`);
    } else {
      user.clubId = club._id;
      user.motDePasse = passwordHash;
      await user.save();
      console.log(`✓ Updated club user: ${user.email}`);
    }

    // Update club to set the user as bureau executif
    await Club.findByIdAndUpdate(club._id, {
      bureauExecutifId: user._id,
    });

    console.log(`\n✓ Test club setup completed!`);
    console.log(`  Email: ${clubEmail}`);
    console.log(`  Password: ${clubPassword}`);
    console.log(`  Club Name: ${club.nom}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding test club:', error.message);
    process.exit(1);
  }
}

seedTestClub();
