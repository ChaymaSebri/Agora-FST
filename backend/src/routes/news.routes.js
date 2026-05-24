const router = require('express').Router();
const newsController = require('../controllers/news.controller');

router.get('/', newsController.listLatestNews);
router.get('/latest', newsController.listLatestNews);

module.exports = router;
