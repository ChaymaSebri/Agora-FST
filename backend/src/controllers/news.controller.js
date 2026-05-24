const newsService = require('../services/news.service');

async function listLatestNews(req, res, next) {
  try {
    const { type, limit } = req.query;
    const data = await newsService.getLatestNews({ type, limit });

    return res.status(200).json(data);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  listLatestNews,
};
