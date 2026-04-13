const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({ message: 'Events route placeholder' });
});

module.exports = router;
