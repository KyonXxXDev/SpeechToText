import { pipeline } from "@huggingface/transformers";
import wavefile from "wavefile";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MP3_PATH = path.join(__dirname, "temp/audioLargo.mp3");
const WAV_PATH = MP3_PATH.replace(".mp3", ".wav");

const SAMPLE_RATE = 16000;
const CHUNK_SECONDS = 20;

async function main() {
    execSync(`ffmpeg -i "${MP3_PATH}" -ar 16000 -ac 1 -f wav "${WAV_PATH}" -y`, {
        stdio: "ignore"
    });

    const transcriber = await pipeline(
        "automatic-speech-recognition",
        "onnx-community/whisper-small"
    );
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