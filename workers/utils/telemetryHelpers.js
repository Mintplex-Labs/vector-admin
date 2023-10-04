async function vectorSpaceMetric() {
  try {
    const { DocumentVectors } = require('../../backend/models/documentVectors');
    const { Telemetry } = require('../../backend/models/telemetry');
    await Telemetry.sendTelemetry('vectorspace_size', {
      count: await DocumentVectors.count(),
    });
  } catch {}
}

module.exports = {
  vectorSpaceMetric,
};
