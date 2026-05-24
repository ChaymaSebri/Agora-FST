const { registerInvitationWorkers } = require('./invitationWorkers');
const { registerMembershipWorkers } = require('./membershipWorkers');
const { registerProgressionWorkers } = require('./progressionWorkers');

function startAllWorkers() {
  registerInvitationWorkers();
  registerMembershipWorkers();
  registerProgressionWorkers();
  console.log('🚀 Tous les workers Camunda sont actifs');
}

module.exports = { startAllWorkers };