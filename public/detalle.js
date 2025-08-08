// detalle.js
// Este archivo maneja la página de detalles del vehículo. Carga la información del vehículo
// seleccionado a partir del ID en la URL, muestra la galería de imágenes con miniaturas y
// permite navegar entre ellas mediante flechas y clics. También muestra la información
// detallada del vehículo y un botón para consultar por WhatsApp.

/**
 * Obtiene parámetros de la cadena de consulta de la URL.
 * @returns {Object} Objeto con claves y valores de los parámetros
 */
function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search));
}

let vehicles = [];
let vehicle = null;
let currentIndex = 0;

const thumbnailsEl = document.getElementById('detalle-thumbnails');
const mainImgEl = document.getElementById('detalle-main-img');
const infoEl = document.getElementById('detalle-info');
const arrowLeft = document.getElementById('arrow-left');
const arrowRight = document.getElementById('arrow-right');

/**
 * Solicita la lista de vehículos desde el backend.
 */
async function fetchVehicles() {
  try {
    const res = await fetch('/api/vehiculos');
    vehicles = await res.json();
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    vehicles = [];
  }
}

/**
 * Encuentra el vehículo correspondiente al ID proporcionado y carga sus detalles.
 */
function loadVehicle(id) {
  vehicle = vehicles.find(v => v.id === parseInt(id, 10));
  if (!vehicle) {
    infoEl.innerHTML = '<p>Vehículo no encontrado.</p>';
    return;
  }
  // Renderizar miniaturas
  thumbnailsEl.innerHTML = '';
  (vehicle.imagenes || []).forEach((imgSrc, index) => {
    const img = document.createElement('img');
    img.src = imgSrc;
    img.alt = `${vehicle.marca} ${vehicle.modelo} ${index + 1}`;
    if (index === 0) img.classList.add('active');
    img.addEventListener('click', () => {
      updateMainImage(index);
    });
    thumbnailsEl.appendChild(img);
  });
  // Mostrar primera imagen
  currentIndex = 0;
  updateMainImage(0);
  // Mostrar información
  renderInfo();
}

/**
 * Actualiza la imagen principal y resalta la miniatura activa.
 * @param {number} index Índice de la imagen a mostrar
 */
function updateMainImage(index) {
  if (!vehicle || !vehicle.imagenes || vehicle.imagenes.length === 0) return;
  currentIndex = index;
  mainImgEl.src = vehicle.imagenes[index];
  // Actualizar selección en miniaturas
  const thumbs = thumbnailsEl.querySelectorAll('img');
  thumbs.forEach((img, idx) => {
    if (idx === index) img.classList.add('active');
    else img.classList.remove('active');
  });
}

/**
 * Navega a la imagen anterior o siguiente del carrusel.
 * @param {number} delta -1 para izquierda, 1 para derecha
 */
function navigate(delta) {
  if (!vehicle || !vehicle.imagenes || vehicle.imagenes.length === 0) return;
  const count = vehicle.imagenes.length;
  let newIndex = (currentIndex + delta + count) % count;
  updateMainImage(newIndex);
}

/**
 * Renderiza la información textual del vehículo y el botón de WhatsApp.
 */
function renderInfo() {
  if (!vehicle) return;
  infoEl.innerHTML = '';
  const title = document.createElement('h2');
  title.textContent = `${vehicle.marca} ${vehicle.modelo}`;
  infoEl.appendChild(title);
  const year = document.createElement('p');
  year.textContent = `Año: ${vehicle.anio}`;
  infoEl.appendChild(year);
  const price = document.createElement('p');
  price.textContent = `Precio: $${vehicle.precio.toLocaleString()}`;
  infoEl.appendChild(price);
  const kms = document.createElement('p');
  kms.textContent = `Kilómetros: ${vehicle.kilometros.toLocaleString()} km`;
  infoEl.appendChild(kms);
  const desc = document.createElement('p');
  desc.textContent = `Descripción: ${vehicle.descripcion}`;
  infoEl.appendChild(desc);
  // Botón WhatsApp
  const btn = document.createElement('a');
  btn.className = 'btn-whatsapp';
  const msg = encodeURIComponent(`Hola, me interesa el vehículo ${vehicle.marca} ${vehicle.modelo}. ¿Está disponible?`);
  btn.href = `https://wa.me/543489639033?text=${msg}`;
  btn.target = '_blank';
  btn.textContent = 'Consultar por WhatsApp';
  infoEl.appendChild(btn);
}

// Configurar eventos de navegación por flechas
arrowLeft.addEventListener('click', () => navigate(-1));
arrowRight.addEventListener('click', () => navigate(1));

// Inicializar página
document.addEventListener('DOMContentLoaded', async () => {
  await fetchVehicles();
  const params = getQueryParams();
  if (params.id) {
    loadVehicle(params.id);
  } else {
    infoEl.innerHTML = '<p>Vehículo no encontrado.</p>';
  }
});