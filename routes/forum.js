const express = require('express');
const router = express.Router();

router.get('/', (req, res) => res.render('forum/forum'));

module.exports = router;
