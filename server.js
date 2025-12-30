const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const { OpenAI } = require('openai');
const fs = require('fs');

dotenv.config();

const app = express();

// Asegurar carpeta uploads
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Timeout seguro
app.use((req, res, next) => {
  res.setTimeout(10 * 60 * 1000);
  next();
});

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 }
});

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.static('public'));

// RUTA REAL DE TRANSCRIPCIÓN
app.post('/api/transcribe', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ningún archivo.' });
    }

    console.log('Procesando archivo:', req.file.originalname);

    const buffer = fs.readFileSync(req.file.path);
    const fileForOpenAI = await OpenAI.toFile(buffer, 'audio.mp3');

    const transcription = await client.audio.transcriptions.create({
      file: fileForOpenAI,
      model: 'whisper-1'
    });

    fs.unlinkSync(req.file.path);

    console.log('✅ Transcripción exitosa');
    res.json({ text: transcription.text });

  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error en OpenAI:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUERTO DINÁMICO PARA RENDER
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
