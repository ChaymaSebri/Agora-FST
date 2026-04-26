const bcrypt = require('bcryptjs');

const { Utilisateur } = require('../models');

async function seedDefaultAdmin() {
  const adminEmail = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || '');

  if (!adminEmail || !adminPassword) {
    console.warn('Admin seed skipped: set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
    return null;
  }

  const existingAdmin = await Utilisateur.findOne({ email: adminEmail });
  if (existingAdmin) {
    return existingAdmin;
  }

  const adminNom = String(process.env.ADMIN_NOM || 'Administrateur').trim();
  const adminPrenom = String(process.env.ADMIN_PRENOM || 'Principal').trim();
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const createdAdmin = await Utilisateur.create({
    nom: adminNom,
    prenom: adminPrenom,
    email: adminEmail,
    motDePasse: passwordHash,
    role: 'admin',
    emailVerified: true,
  });

  console.log(`Default admin created: ${createdAdmin.email}`);
  return createdAdmin;
}

module.exports = seedDefaultAdmin;
