const { zeebeClient } = require('../client');
const { Projet, Utilisateur } = require('../../models');
const emailService = require('../../services/email.service');

function registerMembershipWorkers() {
  zeebeClient.createWorker({
    taskType: 'notify-club-demande',
    taskHandler: async (job) => {
      const { projetId, etudiantId, clubId } = job.variables;
      try {
        const [projet, etudiant, clubUser] = await Promise.all([
          Projet.findById(projetId),
          Utilisateur.findById(etudiantId),
          Utilisateur.findOne({ clubId, role: 'club' }),
        ]);

        if (clubUser) {
          await emailService.sendMembershipRequestEmail({
            to: clubUser.email,
            studentName: `${etudiant.prenom} ${etudiant.nom}`,
            projectName: projet.titre,
            acceptUrl: `${process.env.FRONTEND_URL}/membership/${job.key}/accepter`,
            refuseUrl: `${process.env.FRONTEND_URL}/membership/${job.key}/refuser`,
          });
        }

        return job.complete({ notified: true });
      } catch (err) {
        return job.fail(`Erreur notification club: ${err.message}`);
      }
    },
  });

  zeebeClient.createWorker({
    taskType: 'add-member-to-project',
    taskHandler: async (job) => {
      const { projetId, etudiantId } = job.variables;
      try {
        await Projet.findByIdAndUpdate(projetId, {
          $addToSet: { etudiantIds: etudiantId },
        });
        return job.complete({ added: true });
      } catch (err) {
        return job.fail(`Erreur ajout membre: ${err.message}`);
      }
    },
  });

  zeebeClient.createWorker({
    taskType: 'notify-student-refus',
    taskHandler: async (job) => {
      const { projetId, etudiantId } = job.variables;
      try {
        const [projet, etudiant] = await Promise.all([
          Projet.findById(projetId),
          Utilisateur.findById(etudiantId),
        ]);

        await emailService.sendRefusStudentEmail({
          to: etudiant.email,
          projectName: projet.titre,
        });

        return job.complete({ notified: true });
      } catch (err) {
        return job.fail(`Erreur notification étudiant: ${err.message}`);
      }
    },
  });

  console.log('✅ Workers membership enregistrés');
}

module.exports = { registerMembershipWorkers };