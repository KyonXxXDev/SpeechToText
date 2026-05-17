import { pipeline } from "@huggingface/transformers";
import wavefile from "wavefile";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync, spawnSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.resolve(__dirname, "temp");
const MP3_PATH = path.join(TEMP_DIR, "audioLargo.mp3");
const parsed = path.parse(MP3_PATH);

const WAV_PATH = path.join(
    parsed.dir,
    `${parsed.name}.wav`
);

const SAMPLE_RATE = 16000;
const CHUNK_SECONDS = 20;

function safePath(filePath) {
    const resolved = path.resolve(filePath);

    if (!resolved.startsWith(TEMP_DIR)) {
        throw new Error("Ruta no permitida");
    }

    return resolved;
}

async function main() {

    const safeMp3 = safePath(MP3_PATH);
    const safeWav = safePath(WAV_PATH);

    spawnSync(
        "ffmpeg",
        [
            "-i", safeMp3,
            "-ar", "16000",
            "-ac", "1",
            "-f", "wav",
            safeWav,
            "-y"
        ],
        {
            stdio: "ignore"
        }
    );

    const transcriber = await pipeline(
        "automatic-speech-recognition",
        "onnx-community/whisper-small"
    );
    if (typeof transcriber === "function") {
        console.log("Transcriber cargado correctamente");
    } else {
        console.log("Error al cargar el transcriber");
        console.log(transcriber);
        throw new Error("Pipeline inválido");
    }

    const buffer = fs.readFileSync(WAV_PATH);
    const wav = new wavefile.WaveFile(buffer);

    wav.toBitDepth("32f");
    wav.toSampleRate(SAMPLE_RATE);

    const samples = wav.getSamples();
    const audioData = Array.isArray(samples[0]) ? samples[0] : samples;

    // Dividir en chunks de CHUNK_SECONDS segundos
    const chunkSize = SAMPLE_RATE * CHUNK_SECONDS;
    const chunks = [];
    for (let i = 0; i < audioData.length; i += chunkSize) {
        chunks.push(audioData.slice(i, i + chunkSize));
    }

    console.log(`Audio dividido en ${chunks.length} fragmentos\n`);

    let fullText = "";

    for (let i = 0; i < chunks.length; i++) {
        process.stdout.write(`[${i + 1}/${chunks.length}] transcribiendo... `);

        const result = await transcriber(chunks[i], {
            language: "en",
            task: "transcribe",
            forced_decoder_ids: null,
        });

        const text = result.text.trim();
        fullText += text + " ";
        console.log(text);
    }

    console.log("\n--- Texto completo ---");
    console.log(fullText.trim());
}

await main();