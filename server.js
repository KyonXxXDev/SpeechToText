import path, { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { PORT } from './src/utils/config.js';
import multer from 'multer';

const app = express()
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Multer (Almacenamiento Temporal)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    // Asegúrate que la carpeta exista o créala dinámicamente
    import('node:fs').then(fs => fs.mkdirSync(uploadPath, { recursive: true }));
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName); // Guarda el archivo original con un prefijo único
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Límite de 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo archivos de audio permitidos'));
    }
  }
});

app.use(express.json());
app.disable('x-powered-by');

app.use(express.static(path.join(__dirname, 'web')));

app.get("/", (request, response) => {
  response.sendFile(join(__dirname, 'src/web', './index.html'));
});

app.listen(PORT, () => {
  console.log(`Servidor web corriendo en http://localhost:${PORT}`);
});