import { crearStreamDeAudio } from "./src/utils/grabar.js";
import { getTranscriber, transcribirChunk } from "./src/utils/transcriptor.js";

const DURACION_GRABACION_MS = 20_000;

async function main() {
  // 1. Cargar modelo PRIMERO, antes de abrir el micrófono
  console.log("Cargando modelo Whisper...");
  await getTranscriber();
  console.log("Modelo listo ✅\n");

  console.log("🔴 Grabando y transcribiendo en tiempo real...\n");
  const { emitter, stop } = crearStreamDeAudio();
  
  let chunkNum = 0;
  const textoCompleto = [];
  let colaActual = Promise.resolve();

  emitter.on("chunk", (float32) => {
    const n = ++chunkNum;
    colaActual = colaActual.then(async () => {
      process.stdout.write(`[chunk ${n}] transcribiendo... `);
      const texto = await transcribirChunk(float32);
      textoCompleto.push(texto);
      console.log(texto);
    });
  });

  emitter.on("done", async () => {
    await colaActual;
    console.log("\n--- Transcripción completa ---");
    console.log(textoCompleto.join(" "));
  });

  emitter.on("error", (err) => console.error("Error:", err));

  setTimeout(() => {
    console.log("\nDeteniendo grabación...");
    stop();
  }, DURACION_GRABACION_MS);
}

await main();