const { Camunda8 } = require("@camunda8/sdk");

const camunda = new Camunda8().getZeebeGrpcApiClient();

module.exports = camunda;