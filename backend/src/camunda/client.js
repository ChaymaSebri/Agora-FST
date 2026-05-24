const { Camunda8 } = require('@camunda8/sdk');

const camunda = new Camunda8({
  ZEEBE_ADDRESS: process.env.ZEEBE_ADDRESS || 'localhost:26500',
  ZEEBE_SECURE_CONNECTION: process.env.ZEEBE_SECURE_CONNECTION === 'true',
});

const zeebeClient = camunda.getZeebeGrpcApiClient();

module.exports = { zeebeClient, camunda };