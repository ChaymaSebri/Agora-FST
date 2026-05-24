const { zeebeClient } = require('../client');
const { Projet, Utilisateur, InvitationProjet } = require('../../models');
const emailService = require('../../services/email.service');

function registerInvitationWorkers() {
  // Worker 1: envoyer email d'invitation au professeur
  zeebeClient.createWorker({
    taskType: 'send-invitation-email',
    taskHandler: async (job) => {
      const { projetId, enseignantId, clubId, message } = job.variables;
      try {
        const [projet, enseignant] = await Promise.all([
          Projet.findById(projetId),
          Utilisateur.findById(enseignantId),
        ]);

        await emailService.sendInvitationEmail({
          to: enseignant.email,
          professorName: `${enseignant.prenom} ${enseignant.nom}`,
          projectName: projet.titre,
          message,
          acceptUrl: `${process.env.FRONTEND_URL}/invitations/${job.key}/accepter`,
          refuseUrl: `${process.env.FRONTEND_URL}/invitations/${job.key}/refuser`,
        });

        await InvitationProjet.findOneAndUpdate(
          { projetId, enseignantId },
          { statut: 'en_attente', dateInvitation: new Date() },
          { upsert: true }
        );

        return job.complete({ emailSent: true });
      } catch (err) {
        return job.fail(`Erreur envoi email: ${err.message}`);
      }
    },
  });

  // Worker 2: affecter l'encadrant au projet
  zeebeClient.createWorker({
    taskType: 'assign-encadrant',
    taskHandler: async (job) => {
      const { projetId, enseignantId } = job.variables;
      try {
        await Projet.findByIdAndUpdate(projetId, { enseignantId });
        await InvitationProjet.findOneAndUpdate(
          { projetId, enseignantId },
          { statut: 'accepte', dateReponse: new Date() }
        );
        return job.complete({ assigned: true });
      } catch (err) {
        return job.fail(`Erreur affectation: ${err.message}`);
      }
    },
  });

  // Worker 3: notifier le club d'un refus
  zeebeClient.createWorker({
    taskType: 'notify-club-refus',
    taskHandler: async (job) => {
      const { projetId, enseignantId, clubId } = job.variables;
      try {
        const [projet, enseignant, clubUser] = await Promise.all([
          Projet.findById(projetId),
          Utilisateur.findById(enseignantId),
          Utilisateur.findOne({ clubId, role: 'club' }),
        ]);

        await InvitationProjet.findOneAndUpdate(
          { projetId, enseignantId },
          { statut: 'refuse', dateReponse: new Date() }
        );

        if (clubUser) {
          await emailService.sendRefusEmail({
            to: clubUser.email,
            projectName: projet.titre,
            professorName: `${enseignant.prenom} ${enseignant.nom}`,
          });
        }

        return job.complete({ notified: true });
      } catch (err) {
        return job.fail(`Erreur notification refus: ${err.message}`);
      }
    },
  });

  console.log('✅ Workers invitation enregistrés');
}

module.exports = { registerInvitationWorkers };