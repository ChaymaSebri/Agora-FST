const { Club } = require('../models');

async function listClubs(req, res, next) {
  try {
    const clubs = await Club.find({}).sort({ nom: 1 });

    return res.status(200).json({
      success: true,
      data: {
        items: clubs.map((club) => ({
          id: club._id.toString(),
          nom: club.nom,
          description: club.description,
          specialite: club.specialite,
          statut: club.statut,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { listClubs };
