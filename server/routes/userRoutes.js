const express = require('express');
const { getFreelancers, getUserProfile, getFreelancerProjectsForClient } = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/freelancers', getFreelancers);
router.get('/:id/projects', getFreelancerProjectsForClient);
router.get('/:id', getUserProfile);

module.exports = router;
