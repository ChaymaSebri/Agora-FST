const router = require('express').Router();
const clubsController = require('../controllers/clubs.controller');
const { authenticate, authorizeRoles } = require('../middlewares/auth.middleware');

router.get('/', clubsController.listClubs);
router.get('/membership-requests/me', authenticate, clubsController.listMyMembershipRequests);
router.get('/membership-requests', authenticate, authorizeRoles('club'), clubsController.listClubMembershipRequests);
router.patch('/membership-requests/:requestId', authenticate, authorizeRoles('club'), clubsController.resolveMembershipRequest);
router.post('/:clubId/membership-requests', authenticate, authorizeRoles('etudiant'), clubsController.requestMembership);

module.exports = router;
