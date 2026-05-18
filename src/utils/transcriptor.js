import { pipeline } from "@huggingface/transformers";
import wavefile from "wavefile";
import fs from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { SAFE_AUDIO, SAFE_WAV, SAMPLE_RATE, CHUNK_SECONDS } from "./consts.js";

export async function transcriptor() {
    spawnSync(
        "ffmpeg",
        [
            "-i", SAFE_AUDIO,
            "-ar", SAMPLE_RATE.toString(),
            "-ac", "1",
            "-f", "wav",
            SAFE_WAV,
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

    const buffer = await fs.readFile(SAFE_WAV);
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
        process.stdout.write(`[${i + 1}/${chunks.length}] transcribiendo: `);

        const result = await transcriber(chunks[i], {
            language: "en",
            task: "transcribe",
            forced_decoder_ids: null,
        });

        const text = result.text.trim();
        fullText += text;
        console.log(text);
    }

    console.log("\n--- Texto completo ---");
    console.log(fullText.trim());
}