require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const seedDefaultAdmin = require('./config/seedAdmin');
const { deployProcesses } = require('./camunda/deploy');
const { startAllWorkers } = require('./camunda/workers');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

async function bootstrap() {
  try {
    await connectDB(MONGODB_URI);
    await seedDefaultAdmin();
    /**try {
    await deployProcesses();
  } catch (err) {
    console.error('⚠️ Erreur déploiement BPMN (Camunda peut-être pas prêt):', err.message);
  }

  // Démarrer les workers
  startAllWorkers();**/
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server bootstrap failed:', error.message);
    process.exit(1);
  }
}

bootstrap();
