import Microphone from "node-microphone";
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { MICROPHONE_OPTIONS, SAMPLE_RATE, CHUNK_SECONDS } from "./consts.js";

// Emite chunks de Float32Array cada CHUNK_SECONDS segundos
export function crearStreamDeAudio() {
  const emitter = new EventEmitter();
  const mic = new Microphone(MICROPHONE_OPTIONS);

  // FFmpeg convierte PCM s16le → WAV en memoria (para poder parsear samples)
  const ffmpeg = spawn("ffmpeg", [
    "-f", "s16le",
    "-ar", SAMPLE_RATE.toString(),
    "-ac", "1",
    "-i", "pipe:0",
    "-ar", SAMPLE_RATE.toString(),
    "-ac", "1",
    "-f", "s16le",   // Salida también como PCM raw → más fácil de procesar
    "pipe:1",
  ]);

  const BYTES_PER_SAMPLE = 2; // s16le = 2 bytes
  const CHUNK_SAMPLES = SAMPLE_RATE * CHUNK_SECONDS;
  const CHUNK_BYTES = CHUNK_SAMPLES * BYTES_PER_SAMPLE;

  let buffer = Buffer.alloc(0);

  ffmpeg.stdout.on("data", (data) => {
    buffer = Buffer.concat([buffer, data]);

    // Cuando acumulamos suficientes bytes, emitimos un chunk
    while (buffer.length >= CHUNK_BYTES) {
      const chunkBuf = buffer.subarray(0, CHUNK_BYTES);
      buffer = buffer.subarray(CHUNK_BYTES);

      // Convertir s16le → Float32Array (rango -1 a 1)
      const float32 = new Float32Array(CHUNK_SAMPLES);
      for (let i = 0; i < CHUNK_SAMPLES; i++) {
        float32[i] = chunkBuf.readInt16LE(i * 2) / 32768;
      }

      emitter.emit("chunk", float32);
    }
  });

  ffmpeg.on("error", (err) => emitter.emit("error", err));
  ffmpeg.stderr.on("data", () => { }); // silenciar logs de ffmpeg

  const micStream = mic.startRecording();
  micStream.pipe(ffmpeg.stdin);
  micStream.on("error", (err) => emitter.emit("error", err));

  const stop = () => {
    mic.stopRecording();
    ffmpeg.stdin.end();

    // Emitir el último chunk (aunque sea más corto)
    if (buffer.length > 0) {
      const remaining = buffer.length / BYTES_PER_SAMPLE;
      const float32 = new Float32Array(remaining);
      for (let i = 0; i < remaining; i++) {
        float32[i] = buffer.readInt16LE(i * 2) / 32768;
      }
      emitter.emit("chunk", float32);
    }

    emitter.emit("done");
  };

  return { emitter, stop };
}