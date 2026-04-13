const router = require('express').Router();

router.post('/login', (req, res) => {
  res.json({ message: 'Auth login placeholder' });
});

router.post('/register', (req, res) => {
  res.json({ message: 'Auth register placeholder' });
});

module.exports = router;
