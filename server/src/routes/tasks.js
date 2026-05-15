const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/taskController');

router.get('/project/:projectId',  auth, c.getTasksByProject);
router.post('/project/:projectId', auth, c.createTask);
router.get('/:id',                 auth, c.getTask);
router.put('/:id',                 auth, c.updateTask);
router.patch('/:id/status',        auth, c.updateTaskStatus);
router.patch('/:id/assign',        auth, c.assignTask);
router.delete('/:id',              auth, c.deleteTask);

module.exports = router;
