const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({ message: 'Stats route placeholder' });
});

module.exports = router;
