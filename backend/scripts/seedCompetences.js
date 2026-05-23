require('dotenv').config();
const mongoose = require('mongoose');
const { Competence } = require('../src/models');

const competencesData = [
  { nom: 'Web Development' },
  { nom: 'Mobile Development' },
  { nom: 'AI & Machine Learning' },
  { nom: 'Cloud Computing' },
  { nom: 'DevOps' },
  { nom: 'Database Design' },
  { nom: 'UI/UX Design' },
  { nom: 'Cybersecurity' },
  { nom: 'Data Science' },
  { nom: 'Blockchain' },
  { nom: 'IoT' },
  { nom: 'Game Development' },
  { nom: 'Backend Development' },
  { nom: 'Frontend Development' },
  { nom: 'System Administration' },
];

async function seedCompetences() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agora-fst');

    console.log('Connected. Clearing existing competences...');
    await Competence.deleteMany({});

    console.log('Seeding competences...');
    const created = await Competence.insertMany(competencesData);

    console.log(`✓ Successfully seeded ${created.length} competences:`);
    created.forEach((c) => {
      console.log(`  - ${c.nom} (slug: ${c.slug})`);
    });

    await mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  } catch (error) {
    console.error('Error seeding competences:', error.message);
    process.exit(1);
  }
}

seedCompetences();
