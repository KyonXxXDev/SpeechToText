import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from 'node:fs';
import { safePath } from "./safe-parse.js";

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Donde guardaremos nuestros audios
export const TEMP_DIR = path.resolve(__dirname, "../temp");
export const AUDIO_PATH = path.join(TEMP_DIR, "audio.mp3");
const parsed = path.parse(AUDIO_PATH);

export const WAV_PATH = path.join(
  parsed.dir,
  `${parsed.name}.wav`
);

export const SAFE_AUDIO = await safePath(AUDIO_PATH);
export const SAFE_WAV = await safePath(WAV_PATH);

export const SAMPLE_RATE = 16000;
export const CHUNK_SECONDS = 10;

export const FFMPEG_BIN = "ffmpeg";
export const FFMPEG_PIPE_ARGS = [
  '-f', 's16le',       // Formato PCM nativo de entrada
  '-ar', '16000',      // Frecuencia
  '-ac', '1',          // Mono
  '-i', 'pipe:0',      // Entrada desde Node.js
  '-acodec', 'libmp3lame',
  '-f', 'mp3',
  'pipe:1'             // Salida hacia el archivo
];

export const MICROPHONE_OPTIONS = {
  rate: SAMPLE_RATE,
  channels: 1,
  bitwidth: 16,
  device: 'Micrófono (Realtek(R) Audio)' // Usa el micrófono predeterminado de Windows
}

export const AUDIO_FILE = fs.createWriteStream(AUDIO_PATH);