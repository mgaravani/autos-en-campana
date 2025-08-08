// script.js
// Este archivo contiene la lógica de la interfaz de usuario para la página principal.
// Se encarga de cargar los vehículos desde la API, aplicar filtros, manejar
// el panel de administrador y subir nuevos vehículos con imágenes comprimidas.

let vehicles = [];
let filteredVehicles = [];
let selectedImages = [];
let dragSrcIndex = null;

// Obtener referencias a elementos del DOM
const destacadosContainer = document.getElementById('destacados-container');
const vehiculosContainer = document.getElementById('vehiculos-container');
const filterMarca = document.getElementById('filter-marca');
const filterAnio = document.getElementById('filter-anio');
const filterPrecio = document.getElementById('filter-precio');
const filterKilometros = document.getElementById('filter-kilometros');
const btnLimpiarFiltros = document.getElementById('btn-limpiar-filtros');

const adminSecret = document.getElementById('admin-secret');
const adminOverlay = document.getElementById('admin-overlay');
const adminLogin = document.getElementById('admin-login');
const adminPanel = document.getElementById('admin-panel');
const adminClose = document.getElementById('admin-close');
const adminLoginBtn = document.getElementById('admin-login-btn');

const inputUser = document.getElementById('admin-user');
const inputPass = document.getElementById('admin-pass');

// Campos del formulario de alta de vehículos
const addMarca = document.getElementById('add-marca');
const addModelo = document.getElementById('add-modelo');
const addAnio = document.getElementById('add-anio');
const addPrecio = document.getElementById('add-precio');
const addKilometros = document.getElementById('add-kilometros');
const addDescripcion = document.getElementById('add-descripcion');
const addDestacado = document.getElementById('add-destacado');
const fileDrop = document.getElementById('file-drop');
const fileInput = document.getElementById('file-input');
const previewContainer = document.getElementById('preview-container');
const addVehiculoBtn = document.getElementById('add-vehiculo-btn');

/**
 * Obtiene la lista de vehículos del servidor.
 */
async function fetchVehicles() {
  try {
    const response = await fetch('/api/vehiculos');
    vehicles = await response.json();
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    vehicles = [];
  }
}

/**
 * Crea un elemento de tarjeta para un vehículo.
 * @param {Object} veh El vehículo a representar
 * @returns {HTMLElement} Elemento de tarjeta listo para ser insertado en el DOM
 */
function createVehicleCard(veh) {
  const card = document.createElement('div');
  card.className = 'card';
  // Imagen
  const img = document.createElement('img');
  img.src = veh.imagenes && veh.imagenes.length > 0 ? veh.imagenes[0] : '';
  img.alt = `${veh.marca} ${veh.modelo}`;
  card.appendChild(img);
  // Contenido
  const content = document.createElement('div');
  content.className = 'card-content';
  const title = document.createElement('p');
  title.className = 'card-title';
  title.textContent = `${veh.marca} ${veh.modelo}`;
  content.appendChild(title);
  const year = document.createElement('p');
  year.className = 'card-desc';
  year.textContent = `Año: ${veh.anio}`;
  content.appendChild(year);
  const price = document.createElement('p');
  price.className = 'card-desc';
  price.textContent = `Precio: $${veh.precio.toLocaleString()}`;
  content.appendChild(price);
  const kms = document.createElement('p');
  kms.className = 'card-desc';
  kms.textContent = `Kilómetros: ${veh.kilometros.toLocaleString()} km`;
  content.appendChild(kms);
  card.appendChild(content);
  // Etiqueta de destacado
  if (veh.destacado) {
    const badge = document.createElement('div');
    badge.className = 'badge-destacado';
    badge.textContent = 'Destacado';
    card.appendChild(badge);
  }
  // Evento para abrir el detalle
  card.addEventListener('click', () => {
    window.location.href = `detalle.html?id=${veh.id}`;
  });
  return card;
}

/**
 * Renderiza los vehículos destacados en su contenedor.
 */
function renderDestacados() {
  destacadosContainer.innerHTML = '';
  const destacados = vehicles.filter(v => v.destacado);
  destacados.forEach(veh => {
    destacadosContainer.appendChild(createVehicleCard(veh));
  });
}

/**
 * Renderiza la lista de vehículos aplicando filtros activos.
 */
function renderVehiclesList() {
  vehiculosContainer.innerHTML = '';
  filteredVehicles.forEach(veh => {
    vehiculosContainer.appendChild(createVehicleCard(veh));
  });
}

/**
 * Llena los selectores de marca y año con opciones únicas.
 */
function populateFilters() {
  // Obtener marcas únicas
  const marcas = Array.from(new Set(vehicles.map(v => v.marca))).sort();
  filterMarca.innerHTML = '<option value="">Todas</option>';
  marcas.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m;
    opt.textContent = m;
    filterMarca.appendChild(opt);
  });
  // Obtener años únicos
  const anios = Array.from(new Set(vehicles.map(v => v.anio))).sort((a,b) => b - a);
  filterAnio.innerHTML = '<option value="">Todos</option>';
  anios.forEach(a => {
    const opt = document.createElement('option');
    opt.value = a;
    opt.textContent = a;
    filterAnio.appendChild(opt);
  });
}

/**
 * Aplica filtros basados en los valores seleccionados en los formularios y
 * actualiza la lista filtrada.
 */
function applyFilters() {
  const marcaVal = filterMarca.value;
  const anioVal = filterAnio.value;
  const precioVal = parseFloat(filterPrecio.value) || Infinity;
  const kmsVal = parseFloat(filterKilometros.value) || Infinity;
  filteredVehicles = vehicles.filter(veh => {
    const marcaOk = !marcaVal || veh.marca === marcaVal;
    const anioOk = !anioVal || String(veh.anio) === anioVal;
    const precioOk = !precioVal || veh.precio <= precioVal;
    const kmsOk = !kmsVal || veh.kilometros <= kmsVal;
    return marcaOk && anioOk && precioOk && kmsOk;
  });
  renderVehiclesList();
}

/**
 * Restablece los filtros y vuelve a mostrar todos los vehículos.
 */
function limpiarFiltros() {
  filterMarca.value = '';
  filterAnio.value = '';
  filterPrecio.value = '';
  filterKilometros.value = '';
  applyFilters();
}

/**
 * Abre el panel de administrador mostrando la sección de login.
 */
function openAdmin() {
  adminOverlay.style.display = 'flex';
  adminLogin.classList.add('show');
  adminPanel.classList.remove('show');
}

/**
 * Cierra el panel de administrador y resetea formularios.
 */
function closeAdmin() {
  adminOverlay.style.display = 'none';
  // Limpiar formularios y previsualización
  inputUser.value = '';
  inputPass.value = '';
  addMarca.value = '';
  addModelo.value = '';
  addAnio.value = '';
  addPrecio.value = '';
  addKilometros.value = '';
  addDescripcion.value = '';
  addDestacado.value = 'false';
  selectedImages = [];
  renderPreviewImages();
  // Mostrar login de nuevo
  adminLogin.classList.add('show');
  adminPanel.classList.remove('show');
}

/**
 * Verifica las credenciales de administrador y muestra el panel de alta de vehículos.
 */
function loginAdmin() {
  const user = inputUser.value.trim();
  const pass = inputPass.value.trim();
  if (user === 'admin' && pass === 'admin') {
    adminLogin.classList.remove('show');
    adminPanel.classList.add('show');
  } else {
    alert('Credenciales incorrectas');
  }
}

/**
 * Maneja los archivos seleccionados o soltados. Limita el número de imágenes a 5.
 * @param {FileList} files Lista de archivos de imagen
 */
async function handleSelectedFiles(files) {
  for (const file of files) {
    if (selectedImages.length >= 5) {
      alert('Solo puedes cargar hasta 5 imágenes por vehículo');
      break;
    }
    if (!file.type.startsWith('image/')) continue;
    const dataUrl = await compressFileToDataUrl(file);
    selectedImages.push(dataUrl);
  }
  renderPreviewImages();
}

/**
 * Comprima una imagen a un DataURL con ancho máximo de 500px y calidad del 60%.
 * @param {File} file Archivo de imagen
 * @returns {Promise<string>} DataURL comprimido
 */
function compressFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 500;
        let { width, height } = img;
        if (width > maxWidth) {
          const ratio = maxWidth / width;
          width = maxWidth;
          height = height * ratio;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        resolve(dataUrl);
      };
      img.onerror = err => reject(err);
      img.src = reader.result;
    };
    reader.onerror = err => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Actualiza la interfaz de previsualización de imágenes permitiendo reordenar y eliminar.
 */
function renderPreviewImages() {
  previewContainer.innerHTML = '';
  selectedImages.forEach((dataUrl, index) => {
    const item = document.createElement('div');
    item.className = 'preview-item';
    item.setAttribute('draggable', 'true');
    item.dataset.index = index;
    const img = document.createElement('img');
    img.src = dataUrl;
    item.appendChild(img);
    // Botón de eliminar
    const btn = document.createElement('button');
    btn.className = 'remove-btn';
    btn.textContent = '×';
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedImages.splice(index, 1);
      renderPreviewImages();
    });
    item.appendChild(btn);
    // Eventos de drag
    item.addEventListener('dragstart', (e) => {
      dragSrcIndex = index;
      e.dataTransfer.effectAllowed = 'move';
    });
    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    });
    item.addEventListener('drop', (e) => {
      e.preventDefault();
      const destIndex = parseInt(item.dataset.index, 10);
      if (dragSrcIndex !== null && dragSrcIndex !== destIndex) {
        const moved = selectedImages.splice(dragSrcIndex, 1)[0];
        selectedImages.splice(destIndex, 0, moved);
        renderPreviewImages();
      }
    });
    previewContainer.appendChild(item);
  });
}

/**
 * Envío del nuevo vehículo al servidor y actualización de la lista.
 */
async function handleAddVehicle() {
  const marca = addMarca.value.trim();
  const modelo = addModelo.value.trim();
  const anio = parseInt(addAnio.value, 10);
  const precio = parseFloat(addPrecio.value);
  const kilometros = parseFloat(addKilometros.value);
  const descripcion = addDescripcion.value.trim();
  const destacado = addDestacado.value === 'true';
  if (!marca || !modelo || !anio || isNaN(precio) || isNaN(kilometros) || !descripcion) {
    alert('Por favor completa todos los campos obligatorios.');
    return;
  }
  try {
    const response = await fetch('/api/vehiculos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ marca, modelo, anio, precio, kilometros, descripcion, destacado, imagenes: selectedImages })
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error desconocido');
    }
    // Éxito: recargar lista
    await fetchVehicles();
    populateFilters();
    applyFilters();
    renderDestacados();
    closeAdmin();
    alert('Vehículo agregado correctamente');
  } catch (err) {
    console.error('Error al agregar vehículo:', err);
    alert('Ocurrió un error al agregar el vehículo. Verifica la consola para más detalles.');
  }
}

// Eventos globales y de inicialización
document.addEventListener('DOMContentLoaded', async () => {
  await fetchVehicles();
  populateFilters();
  filteredVehicles = vehicles.slice();
  renderDestacados();
  applyFilters();
  // Filtrar en tiempo real al cambiar campos
  filterMarca.addEventListener('change', applyFilters);
  filterAnio.addEventListener('change', applyFilters);
  filterPrecio.addEventListener('input', applyFilters);
  filterKilometros.addEventListener('input', applyFilters);
  btnLimpiarFiltros.addEventListener('click', limpiarFiltros);
  // Abrir panel admin
  adminSecret.addEventListener('click', openAdmin);
  // Cerrar panel admin
  adminClose.addEventListener('click', closeAdmin);
  // Login admin
  adminLoginBtn.addEventListener('click', loginAdmin);
  // Manejo de carga de archivos
  fileInput.addEventListener('change', (e) => {
    handleSelectedFiles(e.target.files);
    fileInput.value = '';
  });
  // Drag & drop sobre el área
  fileDrop.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileDrop.classList.add('hover');
  });
  fileDrop.addEventListener('dragleave', () => {
    fileDrop.classList.remove('hover');
  });
  fileDrop.addEventListener('drop', (e) => {
    e.preventDefault();
    fileDrop.classList.remove('hover');
    handleSelectedFiles(e.dataTransfer.files);
  });
  // Delegar click en el área para abrir selector de archivos
  fileDrop.addEventListener('click', () => {
    fileInput.click();
  });
  // Agregar vehículo
  addVehiculoBtn.addEventListener('click', handleAddVehicle);
});