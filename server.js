/*
 * server.js - Servidor backend para la aplicación "Autos en Campana"
 *
 * Este servidor está basado en Express.js y proporciona una sencilla API
 * REST para gestionar el catálogo de vehículos. Los datos de los vehículos
 * se almacenan en un archivo JSON en disco y las imágenes se guardan en
 * la carpeta `uploads/`. Al desplegar este proyecto en un hosting como
 * Render, el servidor servirá tanto los archivos estáticos de la carpeta
 * `public/` (la aplicación frontend) como las rutas de la API.
 *
 * Endpoints:
 *   GET    /api/vehiculos          → Devuelve el listado de vehículos en formato JSON.
 *   POST   /api/vehiculos          → Recibe un vehículo y sus imágenes codificadas en
 *                                    base64 y los guarda en disco y en el archivo JSON.
 *   DELETE /api/vehiculos/:id      → Elimina un vehículo por su ID y borra las imágenes
 *                                    asociadas.
 *
 * Almacenamiento de imágenes:
 *   El cliente envía las imágenes como DataURLs (por ejemplo,
 *   "data:image/jpeg;base64,..."). Este servidor decodifica la parte
 *   base64, guarda cada imagen en `uploads/` con un nombre único y
 *   asigna la ruta relativa (por ejemplo, `/uploads/12345.jpg`) al
 *   objeto del vehículo. De esta manera, las imágenes pueden ser
 *   servidas por el propio Express sin saturar el almacenamiento del
 *   navegador del usuario.
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Rutas y archivos de datos
const DATA_FILE = path.join(__dirname, 'vehicles.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// Asegurarse de que la carpeta de uploads exista
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configurar middlewares
app.use(cors());
// Ampliar el límite de JSON para admitir imágenes codificadas en base64
app.use(express.json({ limit: '20mb' }));

// Servir archivos estáticos (frontend)
app.use('/uploads', express.static(UPLOAD_DIR));
app.use('/', express.static(path.join(__dirname, 'public')));

// Leer vehículos desde el archivo JSON. Devuelve un array. Si el archivo
// no existe o está corrupto, devuelve un array vacío.
function readVehicles() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    // Si el archivo no existe, crear uno vacío
    if (err.code === 'ENOENT') {
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
      return [];
    }
    console.error('Error leyendo vehicles.json:', err);
    return [];
  }
}

// Guardar vehículos en el archivo JSON
function saveVehicles(list) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), 'utf8');
}

// Generar un identificador único para un nuevo vehículo
function getNextId(vehicles) {
  return vehicles.reduce((max, v) => Math.max(max, v.id || 0), 0) + 1;
}

// Decodificar DataURL a archivo físico en la carpeta uploads. Devuelve
// la ruta relativa que se usará en el frontend. Si ocurre un error,
// lanza una excepción.
function saveDataUrlToFile(dataUrl, index) {
  // dataUrl con formato: "data:image/jpeg;base64,ABCD..."
  const matches = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Formato de imagen inválido');
  }
  const mimeType = matches[1];
  const ext = mimeType.split('/')[1];
  const base64Data = matches[2];
  // Generar nombre único: marca de tiempo + índice
  const filename = `${Date.now()}-${index}.${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);
  fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
  // Devolver la ruta pública para servir la imagen
  return `/uploads/${filename}`;
}

// Endpoint: Obtener todos los vehículos
app.get('/api/vehiculos', (req, res) => {
  const vehicles = readVehicles();
  res.json(vehicles);
});

// Endpoint: Crear un nuevo vehículo
app.post('/api/vehiculos', (req, res) => {
  const { marca, modelo, anio, precio, km, descripcion, destacado, imagenes } = req.body;
  if (!marca || !modelo) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const vehicles = readVehicles();
    const id = getNextId(vehicles);
    // Guardar cada imagen en disco y obtener su ruta
    const imagePaths = Array.isArray(imagenes)
      ? imagenes.map((img, idx) => {
          // Si la imagen ya es una URL (por ejemplo de Unsplash), no la guardamos
          if (typeof img === 'string' && !img.startsWith('data:')) return img;
          return saveDataUrlToFile(img.src || img, idx);
        })
      : [];
    const nuevo = {
      id,
      marca,
      modelo,
      anio: parseInt(anio, 10) || null,
      precio: parseFloat(precio) || null,
      km: parseInt(km, 10) || null,
      descripcion: descripcion || '',
      destacado: !!destacado,
      imagenes: imagePaths,
    };
    vehicles.push(nuevo);
    saveVehicles(vehicles);
    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error('Error al crear vehículo:', err);
    res.status(500).json({ error: 'Error interno al guardar el vehículo' });
  }
});

// Endpoint: Eliminar un vehículo por ID
app.delete('/api/vehiculos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  try {
    let vehicles = readVehicles();
    const vehiculo = vehicles.find((v) => v.id === id);
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
    // Eliminar imágenes asociadas si están en uploads
    if (Array.isArray(vehiculo.imagenes)) {
      vehiculo.imagenes.forEach((imgPath) => {
        if (imgPath && imgPath.startsWith('/uploads/')) {
          const fullPath = path.join(__dirname, imgPath);
          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
          }
        }
      });
    }
    // Filtrar vehiculo
    vehicles = vehicles.filter((v) => v.id !== id);
    saveVehicles(vehicles);
    res.json({ success: true });
  } catch (err) {
    console.error('Error al eliminar vehículo:', err);
    res.status(500).json({ error: 'Error interno al eliminar vehículo' });
  }
});

// Fallback: redirigir todas las rutas no API al frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Arrancar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});