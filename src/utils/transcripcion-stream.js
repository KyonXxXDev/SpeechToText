import { crearStreamDeAudio } from './grabar.js';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'node:http';

// Reutilizar el servidor existente o crear uno nuevo
const server = http.createServer();
const wss = new WebSocketServer({ server });

export function iniciarTranscripcionTiempoReal(port) {
  const clients = new Set();

  wss.on('connection', (ws) => {
    console.log('Cliente conectado para transcripción en tiempo real');
    clients.add(ws);

    ws.on('message', async (data) => {
      try {
        // Recibir chunk de audio como ArrayBuffer o Buffer
        const float32Array = new Float32Array(data);
        
        // Importar y transcribir
        const { transcribirChunk } = await import('./transcriptor.js');
        const texto = await transcribirChunk(float32Array);
        
        // Enviar resultado de vuelta al cliente
        ws.send(JSON.stringify({ type: 'transcription', text: texto }));
      } catch (err) {
        console.error('Error en transcripción:', err);
        ws.send(JSON.stringify({ type: 'error', message: err.message }));
      }
    });

    ws.on('close', () => {
      console.log('Cliente desconectado');
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('Error WebSocket:', err);
      clients.delete(ws);
    });
  });

  server.listen(port, () => {
    console.log(`Servidor de transcripción en tiempo real corriendo en puerto ${port}`);
  });

  return wss;
}

// Función para grabar y enviar a WebSocket
export async function grabarYTranscribirEnTiempoReal() {
  const { emitter, stop } = crearStreamDeAudio();
  
  // Conectar al servidor WebSocket (si se usa desde el cliente)
  let ws;
  try {
    const WebSocket = (await import('ws')).WebSocket;
    ws = new WebSocket(`ws://localhost:3001`); // Puerto diferente para evitar conflicto
    
    ws.onopen = () => {
      console.log('Conectado al servidor de transcripción');
    };

    ws.onerror = (err) => {
      console.error('Error WebSocket cliente:', err);
    };
  } catch (err) {
    console.warn('WebSocket no disponible, usando modo local');
  }

  emitter.on('chunk', async (float32Array) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      // Enviar chunk al servidor para transcripción
      const buffer = Buffer.from(float32Array.buffer);
      ws.send(buffer);
      
      console.log(`Chunk enviado: ${float32Array.length} samples`);
    } else {
      // Modo local sin WebSocket
      try {
        const { transcribirChunk } = await import('./transcriptor.js');
        const texto = await transcribirChunk(float32Array);
        console.log('Transcripción:', texto);
      } catch (err) {
        console.error('Error en transcripción local:', err);
      }
    }
  });

  emitter.on('done', () => {
    console.log('Grabación terminada');
    if (ws) ws.close();
  });

  return { stop };
}