require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  Competence, Utilisateur, Club, Projet, Tache, Evenement,
} = require('../src/models');

async function seed() {
  // MONGO_URI → MONGODB_URI (comme dans ton .env)
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🌱 Connexion MongoDB...');

  // Nettoyage
  await Promise.all([
    Competence.deleteMany({}),
    Utilisateur.deleteMany({}),
    Club.deleteMany({}),
    Projet.deleteMany({}),
    Tache.deleteMany({}),
    Evenement.deleteMany({}),
  ]);
  console.log('🗑️  Collections vidées');

  // Compétences
  const competences = await Competence.insertMany([
    { nom: 'JavaScript', slug: 'javascript' },
    { nom: 'Python', slug: 'python' },
    { nom: 'Machine Learning', slug: 'machine-learning' },
    { nom: 'React', slug: 'react' },
    { nom: 'Node.js', slug: 'nodejs' },
    { nom: 'Base de données', slug: 'base-de-donnees' },
  ]);
  console.log(`✅ ${competences.length} compétences créées`);

  const hash = await bcrypt.hash('password123', 10);

  // Admin
  const admin = await Utilisateur.create({
    nom: 'Admin', prenom: 'Super', email: 'admin@agora.fst',
    motDePasse: hash, role: 'admin',
  });

  // Clubs (utilisateurs de type club)
  const club1 = await Club.create({
    nom: 'Club IA & Data', description: 'Intelligence artificielle et data science',
    specialite: 'IA', statut: 'actif',
  });
  const club2 = await Club.create({
    nom: 'Club Web Dev', description: 'Développement web moderne',
    specialite: 'Web', statut: 'actif',
  });

  const clubUser1 = await Utilisateur.create({
    email: 'club.ia@agora.fst', motDePasse: hash, role: 'club',
    clubId: club1._id, active: true,
  });
  const clubUser2 = await Utilisateur.create({
    email: 'club.web@agora.fst', motDePasse: hash, role: 'club',
    clubId: club2._id, active: true,
  });

  await Club.findByIdAndUpdate(club1._id, { bureauExecutifId: clubUser1._id });
  await Club.findByIdAndUpdate(club2._id, { bureauExecutifId: clubUser2._id });

  // Enseignants
  const prof1 = await Utilisateur.create({
    nom: 'Ben Ali', prenom: 'Karim', email: 'k.benali@agora.fst',
    motDePasse: hash, role: 'enseignant', grade: 'Maître de conférences',
    competenceIds: [competences[0]._id, competences[2]._id],
  });
  const prof2 = await Utilisateur.create({
    nom: 'Trabelsi', prenom: 'Sonia', email: 's.trabelsi@agora.fst',
    motDePasse: hash, role: 'enseignant', grade: 'Professeur',
    competenceIds: [competences[1]._id, competences[2]._id],
  });

  // Étudiants
  const etudiants = await Utilisateur.insertMany([
    { nom: 'Hajji', prenom: 'Ahmed', email: 'a.hajji@agora.fst', motDePasse: hash,
      role: 'etudiant', niveau: 'L3', filiere: 'Informatique',
      competenceIds: [competences[0]._id, competences[3]._id] },
    { nom: 'Saidi', prenom: 'Ines', email: 'i.saidi@agora.fst', motDePasse: hash,
      role: 'etudiant', niveau: 'M1', filiere: 'Data Science',
      competenceIds: [competences[1]._id, competences[2]._id] },
    { nom: 'Mansour', prenom: 'Youssef', email: 'y.mansour@agora.fst', motDePasse: hash,
      role: 'etudiant', niveau: 'L3', filiere: 'Informatique',
      competenceIds: [competences[0]._id, competences[4]._id] },
    { nom: 'Gharbi', prenom: 'Leila', email: 'l.gharbi@agora.fst', motDePasse: hash,
      role: 'etudiant', niveau: 'M2', filiere: 'IA',
      competenceIds: [competences[2]._id, competences[5]._id] },
  ]);

  await Club.findByIdAndUpdate(club1._id, {
    membreIds: [etudiants[1]._id, etudiants[3]._id],
  });
  await Club.findByIdAndUpdate(club2._id, {
    membreIds: [etudiants[0]._id, etudiants[2]._id],
  });

  // Projets
  const projet1 = await Projet.create({
    titre: 'Système de recommandation IA',
    description: 'Développement d\'un moteur de recommandation basé sur le ML',
    objectif: 'Implémenter un algorithme collaboratif',
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    statut: 'en_cours',
    progression: 35,
    enseignantId: prof1._id,
    etudiantIds: [etudiants[1]._id, etudiants[3]._id],
    clubId: club1._id,
    competenceIds: [competences[2]._id, competences[1]._id],
  });

  const projet2 = await Projet.create({
    titre: 'Plateforme e-learning React',
    description: 'Application web pour cours en ligne',
    objectif: 'Interface responsive et API REST',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    statut: 'en_cours',
    progression: 60,
    enseignantId: prof2._id,
    etudiantIds: [etudiants[0]._id, etudiants[2]._id],
    clubId: club2._id,
    competenceIds: [competences[3]._id, competences[4]._id],
  });

  const projet3 = await Projet.create({
    titre: 'Dashboard Analytics MongoDB',
    description: 'Tableau de bord pour visualisation de données',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    statut: 'en_attente',
    progression: 0,
    enseignantId: prof1._id,
    clubId: club1._id,
    competenceIds: [competences[5]._id, competences[0]._id],
  });

  // Tâches
  const taches = await Tache.insertMany([
    // Projet 1
    { titre: 'Collecte et nettoyage des données', deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      statut: 'terminee', projetId: projet1._id, etudiantIds: [etudiants[3]._id] },
    { titre: 'Entraînement du modèle ML', deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      statut: 'en_cours', projetId: projet1._id, etudiantIds: [etudiants[1]._id, etudiants[3]._id] },
    { titre: 'API Flask pour le modèle', deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      statut: 'en_cours', projetId: projet1._id, etudiantIds: [etudiants[1]._id] }, // EN RETARD
    // Projet 2
    { titre: 'Design système de composants', deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      statut: 'terminee', projetId: projet2._id, etudiantIds: [etudiants[0]._id] },
    { titre: 'Authentification JWT', deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      statut: 'en_cours', projetId: projet2._id, etudiantIds: [etudiants[2]._id] },
    { titre: 'Déploiement production', deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
      statut: 'a_faire', projetId: projet2._id, etudiantIds: [] },
  ]);

  // Événements
  await Evenement.insertMany([
    { titre: 'Hackathon IA 2025', description: '24h de coding sur des sujets IA',
      date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), lieu: 'Amphi A',
      capacite: 50, type: 'hackathon', organisateurId: clubUser1._id, clubId: club1._id,
      competenceIds: [competences[2]._id] },
    { titre: 'Atelier React Avancé', description: 'Hooks, Context, Performance',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), lieu: 'Salle Info 3',
      capacite: 30, type: 'atelier', organisateurId: clubUser2._id, clubId: club2._id,
      competenceIds: [competences[3]._id] },
    { titre: 'Conférence Data Science', description: 'Tendances ML en 2025',
      date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), lieu: 'Amphithéâtre principal',
      capacite: 200, type: 'conference', organisateurId: clubUser1._id, clubId: club1._id,
      coOrganizerClubIds: [club2._id], competenceIds: [competences[2]._id, competences[1]._id] },
  ]);

  console.log('\n📊 Résumé du seed:');
  console.log(`  👤 Utilisateurs: ${await Utilisateur.countDocuments()}`);
  console.log(`  🏛️  Clubs: ${await Club.countDocuments()}`);
  console.log(`  📁 Projets: ${await Projet.countDocuments()}`);
  console.log(`  ✅ Tâches: ${await Tache.countDocuments()}`);
  console.log(`  🎪 Événements: ${await Evenement.countDocuments()}`);
  console.log(`  🧠 Compétences: ${await Competence.countDocuments()}`);

  console.log('\n🔐 Comptes de test (mot de passe: password123):');
  console.log('  admin@agora.fst       → Admin');
  console.log('  club.ia@agora.fst     → Club IA & Data');
  console.log('  club.web@agora.fst    → Club Web Dev');
  console.log('  k.benali@agora.fst    → Enseignant');
  console.log('  s.trabelsi@agora.fst  → Enseignant');
  console.log('  a.hajji@agora.fst     → Étudiant L3');
  console.log('  i.saidi@agora.fst     → Étudiant M1');

  await mongoose.disconnect();
  console.log('\n✅ Seed terminé!');
}

seed().catch((err) => {
  console.error('❌ Erreur seed:', err);
  process.exit(1);
});