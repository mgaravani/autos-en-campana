/*
 * server.js - Servidor backend para la aplicación "Autos en Campana"
 *
 * Este servidor está basado en Express.js y proporciona una sencilla API
 * REST para gestionar el catálogo de vehículos. En esta versión los
 * datos de los vehículos se almacenan en una base de datos MongoDB a
 * través de mongoose. Las imágenes se envían como DataURL o
 * directamente como URL y se almacenan dentro del documento de la
 * base de datos en un array de cadenas. De esta manera, el catá-
 * logo persiste entre reinicios del servidor y no depende del
 * sistema de archivos local.
 *
 * Endpoints:
 *   GET    /api/vehiculos          → Devuelve el listado completo de vehículos en JSON.
 *   POST   /api/vehiculos          → Recibe un vehículo con sus imágenes (DataURLs o URLs) y lo
 *                                    guarda en la base de datos. Asigna un id incremental.
 *   DELETE /api/vehiculos/:id      → Elimina un vehículo por su ID.
 *
 * Almacenamiento de imágenes:
 *   El cliente envía las imágenes como DataURLs (por ejemplo,
 *   "data:image/jpeg;base64,...") o URLs remotas. Este servidor
 *   almacena directamente las cadenas en MongoDB en el campo
 *   `imagenes` del documento. No se utilizan archivos físicos en
 *   `uploads/` para evitar problemas de persistencia en servicios de
 *   hosting gratuitos como Render o Railway.
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
// Importar mongoose para conectar con MongoDB
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

/*
 * Conexión a MongoDB
 *
 * Este backend utiliza MongoDB a través de mongoose para persistir los
 * vehículos y sus imágenes. La cadena de conexión debe estar
 * especificada en la variable de entorno MONGO_URL (por ejemplo,
 * mongodb+srv://usuario:contraseña@cluster.mongodb.net/nombredb). Si no
 * se define, se utiliza una base de datos local para desarrollo.
 */
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost/autosencampana';
mongoose
  .connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Conectado a MongoDB');
  })
  .catch((err) => {
    console.error('Error conectando a MongoDB:', err);
  });

// Definir el esquema y modelo para vehículos. Se utiliza un campo
// numérico `id` como identificador incremental, además del _id de
// MongoDB. Las imágenes se almacenan como DataURL o URLs en un
// array de cadenas.
const vehicleSchema = new mongoose.Schema(
  {
    id: { type: Number, unique: true },
    marca: String,
    modelo: String,
    anio: Number,
    precio: Number,
    km: Number,
    descripcion: String,
    destacado: Boolean,
    imagenes: [String],
  },
  { timestamps: true }
);
const Vehicle = mongoose.model('Vehicle', vehicleSchema);

// Configurar middlewares
app.use(cors());
// Ampliar el límite de JSON para admitir imágenes codificadas en base64
app.use(express.json({ limit: '20mb' }));

// Servir archivos estáticos (frontend)
app.use('/', express.static(path.join(__dirname, 'public')));

// Leer vehículos desde MongoDB. Devuelve un array de vehículos. En caso de
// error, retorna un array vacío. Utilizado internamente para GET.
async function readVehicles() {
  try {
    const list = await Vehicle.find().sort({ id: 1 }).lean().exec();
    return list;
  } catch (err) {
    console.error('Error leyendo vehículos de MongoDB:', err);
    return [];
  }
}

// Obtener el siguiente identificador incremental
async function getNextId() {
  try {
    const last = await Vehicle.findOne().sort({ id: -1 }).lean().exec();
    return last && typeof last.id === 'number' ? last.id + 1 : 1;
  } catch (err) {
    console.error('Error obteniendo próximo id:', err);
    return 1;
  }
}

// Endpoint: Obtener todos los vehículos
app.get('/api/vehiculos', async (req, res) => {
  try {
    const vehicles = await readVehicles();
    res.json(vehicles);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener vehículos' });
  }
});

// Endpoint: Crear un nuevo vehículo
app.post('/api/vehiculos', async (req, res) => {
  const { marca, modelo, anio, precio, km, descripcion, destacado, imagenes } = req.body;
  if (!marca || !modelo) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  try {
    const id = await getNextId();
    // Construir lista de imágenes. Si es DataURL, almacenar la cadena completa.
    // Si ya es una URL externa, almacenarla tal cual.
    const imgList = Array.isArray(imagenes)
      ? imagenes.map((img) => {
          if (typeof img === 'string') return img;
          if (img && typeof img.src === 'string') return img.src;
          return '';
        })
      : [];
    const nuevo = new Vehicle({
      id,
      marca,
      modelo,
      anio: parseInt(anio, 10) || null,
      precio: parseFloat(precio) || null,
      km: parseInt(km, 10) || null,
      descripcion: descripcion || '',
      destacado: !!destacado,
      imagenes: imgList,
    });
    await nuevo.save();
    res.status(201).json({ success: true, id });
  } catch (err) {
    console.error('Error al crear vehículo:', err);
    res.status(500).json({ error: 'Error interno al guardar el vehículo' });
  }
});

// Endpoint: Eliminar un vehículo por ID
app.delete('/api/vehiculos/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (!id) {
    return res.status(400).json({ error: 'ID inválido' });
  }
  try {
    const result = await Vehicle.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Vehículo no encontrado' });
    }
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