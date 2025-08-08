const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Create the express application
const app = express();

// Allow cross‑origin requests so the front‑end can talk to this server
app.use(cors());

// Increase request body limit to allow for base64 encoded images
app.use(express.json({ limit: '10mb' }));

// Connect to MongoDB using the connection string defined in the MONGO_URL environment variable.
// When you deploy this application on Railway or another host, you'll configure this variable
// in the service's settings. If MONGO_URL is not provided, the server will log an error and exit.
const mongoUrl = process.env.MONGO_URL;

if (!mongoUrl) {
  console.error('Error: MONGO_URL environment variable is not set.');
  console.error('Please set MONGO_URL to the connection string for your MongoDB database.');
  process.exit(1);
}

mongoose
  .connect(mongoUrl)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1);
  });

// Define a schema for storing vehicle data. Each vehicle record includes an incrementing
// numeric id and an array of image data URIs. Storing images as data URIs keeps the entire
// vehicle record self‑contained in the database and avoids the need for a persistent file system.
const vehicleSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  marca: { type: String, required: true },
  modelo: { type: String, required: true },
  anio: { type: Number, required: true },
  precio: { type: Number, required: true },
  kilometros: { type: Number, required: true },
  descripcion: { type: String, required: true },
  destacado: { type: Boolean, default: false },
  imagenes: { type: [String], default: [] }
});

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

/**
 * Retrieve all vehicles from the database. Vehicles are sorted by their id so that the order
 * remains consistent between page loads. The response is a JSON array of objects.
 */
app.get('/api/vehiculos', async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort('id');
    res.json(vehicles);
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
});

/**
 * Determine the next id for a new vehicle by finding the current maximum id and adding one.
 * If no vehicles exist, start with id 1.
 */
async function getNextVehicleId() {
  const lastVehicle = await Vehicle.findOne().sort({ id: -1 });
  return lastVehicle ? lastVehicle.id + 1 : 1;
}

/**
 * Add a new vehicle to the database. The request body should include all required fields
 * (marca, modelo, anio, precio, kilometros, descripcion, destacado) and an array of
 * base64‑encoded image strings in `imagenes`. Images should be compressed on the
 * client side before being sent to minimize payload size and storage requirements.
 */
app.post('/api/vehiculos', async (req, res) => {
  try {
    const { marca, modelo, anio, precio, kilometros, descripcion, destacado, imagenes } = req.body;
    // Validate required fields
    if (!marca || !modelo || !anio || !precio || !kilometros || !descripcion) {
      return res.status(400).json({ error: 'Missing required vehicle fields' });
    }
    const newId = await getNextVehicleId();
    const vehicle = await Vehicle.create({
      id: newId,
      marca,
      modelo,
      anio,
      precio,
      kilometros,
      descripcion,
      destacado: Boolean(destacado),
      imagenes: Array.isArray(imagenes) ? imagenes : []
    });
    res.json(vehicle);
  } catch (err) {
    console.error('Error creating vehicle:', err);
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
});

/**
 * Delete a vehicle by id. If no vehicle matches the provided id, a 404 status is returned.
 */
app.delete('/api/vehiculos/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const result = await Vehicle.deleteOne({ id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting vehicle:', err);
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
});

// Serve static files from the public directory. This allows the front‑end HTML, CSS and
// JavaScript files to be delivered directly by the Express server.
app.use(express.static(path.join(__dirname, 'public')));

// Fallback: for any unknown route, respond with the index.html. This supports client‑side
// routing via JavaScript and ensures direct navigation to routes such as /detalle.html
// works properly when deployed.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server on the port provided by Railway or default to 3000 if not specified.
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});