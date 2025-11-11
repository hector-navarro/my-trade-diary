import fs from 'fs';
import path from 'path';
import app from './app';
import { config } from './config/env';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.listen(config.port, () => {
  console.log(`Server listening on port ${config.port}`);
});
