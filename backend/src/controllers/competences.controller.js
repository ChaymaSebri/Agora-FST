const { Competence } = require('../models');

async function listCompetences(req, res, next) {
  try {
    const competences = await Competence.find({ isActive: true }).sort({ nom: 1 });

    return res.status(200).json({
      success: true,
      data: {
        items: competences.map((competence) => ({
          id: competence._id.toString(),
          nom: competence.nom,
          slug: competence.slug,
        })),
      },
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listCompetences,
};
