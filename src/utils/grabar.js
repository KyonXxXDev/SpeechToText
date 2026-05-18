import Microphone from "node-microphone";
import { spawn } from "node:child_process";
import { AUDIO_FILE, AUDIO_PATH, FFMPEG_BIN, FFMPEG_PIPE_ARGS, MICROPHONE_OPTIONS } from "./consts.js";

export async function grabar() {
    const mic = new Microphone(MICROPHONE_OPTIONS);
    console.info('Iniciando grabación del micrófono...🔴');
    const micStream = mic.startRecording();
    const ffmpeg = spawn(FFMPEG_BIN, FFMPEG_PIPE_ARGS)
    micStream.pipe(ffmpeg.stdin)
    ffmpeg.stdout.pipe(AUDIO_FILE);

    // Control de errores básico
    micStream.on('error', (err) => console.error('Error Mic:', err));
    ffmpeg.on('error', (err) => console.error('Error FFmpeg. ¿Está instalado en Windows?:', err));

    await new Promise(resolve => setTimeout(() => {
        console.log('Deteniendo grabación y guardando MP3...');
        mic.stopRecording();
        ffmpeg.stdin.end();
        console.log(`¡Archivo guardado en: ${AUDIO_PATH}!`);
        resolve(AUDIO_PATH);
    }, 10000));
}