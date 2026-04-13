const router = require('express').Router();

router.get('/', (req, res) => {
  res.json({ message: 'Projects route placeholder' });
});

module.exports = router;
