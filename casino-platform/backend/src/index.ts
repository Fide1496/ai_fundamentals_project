import app from './app';
import { pool } from './config/database';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ Database connected');
    app.listen(PORT, () => {
      console.log(`🎰 Casino backend running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to database:', err);
    process.exit(1);
  }
}

start();
