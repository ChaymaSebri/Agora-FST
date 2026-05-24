const { zeebeClient } = require('../client');
const { Projet, Tache, Utilisateur } = require('../../models');
const emailService = require('../../services/email.service');

function registerProgressionWorkers() {
  zeebeClient.createWorker({
    taskType: 'check-overdue-tasks',
    taskHandler: async (job) => {
      try {
        const now = new Date();
        const overdueTasks = await Tache.find({
          deadline: { $lt: now },
          statut: { $in: ['a_faire', 'en_cours'] },
        }).populate('projetId');

        return job.complete({
          hasOverdue: overdueTasks.length > 0,
          overdueCount: overdueTasks.length,
          overdueTaskIds: overdueTasks.map((t) => t._id.toString()),
          overdueProjectIds: [...new Set(overdueTasks.map((t) => t.projetId?._id?.toString()))],
        });
      } catch (err) {
        return job.fail(`Erreur vérification tâches: ${err.message}`);
      }
    },
  });

  zeebeClient.createWorker({
    taskType: 'update-project-progression',
    taskHandler: async (job) => {
      try {
        const projets = await Projet.find({ statut: 'en_cours' });

        for (const projet of projets) {
          const taches = await Tache.find({ projetId: projet._id });
          if (taches.length === 0) continue;

          const terminees = taches.filter((t) => t.statut === 'terminee').length;
          const progression = Math.round((terminees / taches.length) * 100);

          await Projet.findByIdAndUpdate(projet._id, { progression });
        }

        return job.complete({ updated: true });
      } catch (err) {
        return job.fail(`Erreur mise à jour progression: ${err.message}`);
      }
    },
  });

  zeebeClient.createWorker({
    taskType: 'send-overdue-alerts',
    taskHandler: async (job) => {
      const { overdueProjectIds } = job.variables;
      try {
        for (const projectId of overdueProjectIds) {
          const projet = await Projet.findById(projectId)
            .populate('etudiantIds')
            .populate('enseignantId')
            .populate('clubId');

          const recipients = [
            ...(projet.etudiantIds || []),
            projet.enseignantId,
          ].filter(Boolean);

          for (const user of recipients) {
            await emailService.sendOverdueAlert({
              to: user.email,
              projectName: projet.titre,
            });
          }
        }

        return job.complete({ alertsSent: true });
      } catch (err) {
        return job.fail(`Erreur alertes retard: ${err.message}`);
      }
    },
  });

  console.log('✅ Workers progression enregistrés');
}

module.exports = { registerProgressionWorkers };