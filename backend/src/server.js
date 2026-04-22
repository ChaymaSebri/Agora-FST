require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const seedDefaultAdmin = require('./config/seedAdmin');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

async function bootstrap() {
  try {
    await connectDB(MONGODB_URI);
    await seedDefaultAdmin();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server bootstrap failed:', error.message);
    process.exit(1);
  }
}

bootstrap();
