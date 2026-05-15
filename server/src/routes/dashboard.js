const router = require('express').Router();
const auth = require('../middleware/auth');
const { getStats, getMyTasks } = require('../controllers/dashboardController');

router.get('/stats',    auth, getStats);
router.get('/my-tasks', auth, getMyTasks);

module.exports = router;
