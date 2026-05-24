const path = require('path');
const { zeebeClient } = require('./client');

async function deployProcesses() {
  const processFiles = [
    'invitation-encadrant.bpmn',
    'rejoindre-projet.bpmn',
    'suivi-progression.bpmn',
    'notifications.bpmn',
  ];

  const resources = processFiles.map((file) => ({
    processDefinitionId: file.replace('.bpmn', ''),
    name: file,
    content: require('fs').readFileSync(
      path.join(__dirname, 'processes', file)
    ),
  }));

  const result = await zeebeClient.deployResources({ resources });
  console.log('✅ Processus BPMN déployés:', result.deployments.map(d => d.process?.bpmnProcessId));
  return result;
}

module.exports = { deployProcesses };