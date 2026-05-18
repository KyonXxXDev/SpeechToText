import { pipeline } from "@huggingface/transformers";

let transcriberInstance = null;

// Carga el modelo una sola vez
export async function getTranscriber() {
  if (!transcriberInstance) {
    transcriberInstance = await pipeline(
      "automatic-speech-recognition",
      "onnx-community/whisper-small"
    );
  }
  return transcriberInstance;
}

export async function transcribirChunk(float32Audio) {
  const transcriber = await getTranscriber();
  const result = await transcriber(float32Audio, {
    language: "es",      // Cambia según tu idioma
    task: "transcribe",
    forced_decoder_ids: null,
  });
  return result.text.trim();
}