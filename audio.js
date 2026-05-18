import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Microphone from 'node-microphone';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rutaArchivo = path.join(__dirname, 'src/temp/audio.mp3');
const archivoStream = fs.createWriteStream(rutaArchivo);

// 1. Inicializar el micrófono de forma nativa
const mic = new Microphone({
  rate: 16000,
  channels: 1,
  bitwidth: 16,
  device: 'Micrófono (Realtek(R) Audio)' // Usa el micrófono predeterminado de Windows
});

console.log('Iniciando grabación del micrófono...');

// 2. Iniciar la captura de audio
const micStream = mic.startRecording();

// 3. Pasar el audio directamente a FFmpeg para comprimir a MP3
const ffmpeg = spawn('ffmpeg', [
  '-f', 's16le',       // Formato PCM nativo de entrada
  '-ar', '16000',      // Frecuencia
  '-ac', '1',          // Mono
  '-i', 'pipe:0',      // Entrada desde Node.js
  '-acodec', 'libmp3lame',
  '-f', 'mp3',
  'pipe:1'             // Salida hacia el archivo
]);

// Conectar los flujos de datos
micStream.pipe(ffmpeg.stdin);
ffmpeg.stdout.pipe(archivoStream);

// Control de errores básico
micStream.on('error', (err) => console.error('Error Mic:', err));
ffmpeg.on('error', (err) => console.error('Error FFmpeg. ¿Está instalado en Windows?:', err));

// 4. Detener automáticamente a los 10 segundos
setTimeout(() => {
  console.log('Deteniendo grabación y guardando MP3...');
  mic.stopRecording();
  ffmpeg.stdin.end();
  console.log(`¡Archivo guardado en: ${rutaArchivo}!`);
}, 10000);