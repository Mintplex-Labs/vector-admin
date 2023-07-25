require('dotenv').config();
const { Inngest } = require('inngest');
const InngestClient = new Inngest({
  name: 'VDMS Background Workers',
  eventKey: process.env.INNGEST_EVENT_KEY || 'background_workers',
});

module.exports = {
  InngestClient,
};
