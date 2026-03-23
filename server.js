require('dotenv').config();
const app = require('./app');
const cronJobs = require('./src/jobs/cron.jobs');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server initialized on port ${PORT}`);
  // Initialize Background Jobs
  cronJobs.start();
});
