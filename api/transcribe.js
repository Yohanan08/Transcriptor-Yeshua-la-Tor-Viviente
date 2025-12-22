import { OpenAI } from 'openai';

export const config = {
  api: {
    bodyParser: false, // Vercel necesita esto para manejar archivos de audio
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // 1. Convertir el audio que llega en un Buffer
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // 2. Crear el archivo virtual (como hicimos en el server.js)
    // Esto asegura que OpenAI reconozca el formato correctamente
    const fileForOpenAI = await OpenAI.toFile(buffer, 'audio.mp3');

    // 3. Enviar a Whisper
    const transcription = await client.audio.transcriptions.create({
      file: fileForOpenAI,
      model: "whisper-1",
    });

    // 4. Responder con el texto
    return res.status(200).json({ text: transcription.text });

  } catch (error) {
    console.error("Error en producción:", error);
    return res.status(500).json({ error: error.message });
  }
}