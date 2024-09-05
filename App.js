require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');

const app = express();

// Middleware
app.use(bodyParser.json());

// Conexión a MongoDB
const mongoURI = process.env.MONGO_URI;
mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

// Esquema y Modelo de Mongoose
const imageSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  imageBase64: String
});

const Image = mongoose.model('Image', imageSchema);

// Configurar Multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ruta para subir imágenes
app.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  const newImage = new Image({
    filename: req.file.originalname,
    contentType: req.file.mimetype,
    imageBase64: req.file.buffer.toString('base64')
  });

  try {
    await newImage.save();
    res.json({ message: 'Image uploaded successfully' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Ruta para obtener imágenes
app.get('/fotos/:filename', async (req, res) => {
  try {
    const file = await Image.findOne({ filename: req.params.filename });
    if (!file) {
      return res.status(404).json({ err: 'No file exists' });
    }
    res.contentType(file.contentType);
    res.send(Buffer.from(file.imageBase64, 'base64'));
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Ruta para eliminar imágenes
app.delete('/fotos/:filename', async (req, res) => {
  try {
    const file = await Image.findOneAndDelete({ filename: req.params.filename });
    if (!file) {
      return res.status(404).json({ err: 'No file exists' });
    }
    res.json({ message: 'Image deleted successfully' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Ruta para actualizar imágenes
app.put('/fotos/:filename', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }

  try {
    const updatedImage = await Image.findOneAndUpdate(
      { filename: req.params.filename },
      {
        filename: req.file.originalname,
        contentType: req.file.mimetype,
        imageBase64: req.file.buffer.toString('base64')
      },
      { new: true }
    );

    if (!updatedImage) {
      return res.status(404).json({ err: 'No file exists' });
    }

    res.json({ message: 'Image updated successfully' });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor en el puerto ${port}`);
});
