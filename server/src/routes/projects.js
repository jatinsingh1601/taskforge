const router = require('express').Router();
const auth = require('../middleware/auth');
const c = require('../controllers/projectController');

router.get('/',                       auth, c.getProjects);
router.post('/',                      auth, c.createProject);
router.get('/:id',                    auth, c.getProject);
router.put('/:id',                    auth, c.updateProject);
router.delete('/:id',                 auth, c.deleteProject);
router.post('/:id/members',           auth, c.addMember);
router.delete('/:id/members/:userId', auth, c.removeMember);

module.exports = router;
