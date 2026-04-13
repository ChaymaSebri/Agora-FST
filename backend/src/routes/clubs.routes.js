const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({ message: 'Clubs route placeholder' });
});

module.exports = router;
