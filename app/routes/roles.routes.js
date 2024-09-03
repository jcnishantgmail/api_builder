const roles = require('../controllers/RolesController');
var router = require('express').Router();


router.post('/add', roles.createRoles);
router.get('/detail', roles.roleDetail);
router.put('/update', roles.updateRole);
router.get('/listing', roles.getAllRoles);
router.put('/status/change', roles.changeStatus);
router.delete('/delete', roles.deleteRole);

module.exports = router