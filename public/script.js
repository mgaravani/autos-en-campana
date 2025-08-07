/*
 * script.js - Lógica de la aplicación para "Autos en Campana"
 *
 * Este archivo gestiona el catálogo de vehículos, los filtros de
 * búsqueda y el panel de administración que permite agregar y
 * eliminar vehículos. A diferencia de versiones anteriores de esta
 * aplicación, los datos ya no se almacenan en localStorage. En su
 * lugar, todas las operaciones de lectura, alta y baja de vehículos
 * se realizan a través de la API REST expuesta por el backend
 * (consulta a /api/vehiculos). Las imágenes de los vehículos se
 * envían al servidor como DataURL y éste las guarda en el directorio
 * `uploads/` para que puedan ser servidas de forma persistente.
 */

(function () {
  // ---------- Configuración y datos iniciales ----------
  const DEFAULT_VEHICLES = [
    {
      id: 1,
      marca: 'Ford',
      modelo: 'EcoSport',
      anio: 2019,
      precio: 4200000,
      km: 60000,
      descripcion: 'SUV compacta en excelente estado, ideal para ciudad y ruta.',
      destacado: true,
      imagenes: [
        'https://source.unsplash.com/featured/600x400/?suv,ford',
      ],
    },
    {
      id: 2,
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: 2018,
      precio: 3800000,
      km: 75000,
      descripcion: 'Sedán confortable con bajo consumo y excelente rendimiento.',
      destacado: false,
      imagenes: [
        'https://source.unsplash.com/featured/600x400/?sedan,toyota',
      ],
    },
    {
      id: 3,
      marca: 'Volkswagen',
      modelo: 'Amarok',
      anio: 2017,
      precio: 5000000,
      km: 90000,
      descripcion: 'Pickup potente ideal para trabajo y aventura.',
      destacado: true,
      imagenes: [
        'https://source.unsplash.com/featured/600x400/?pickup,volkswagen',
      ],
    },
    {
      id: 4,
      marca: 'Peugeot',
      modelo: '208',
      anio: 2024,
      precio: 8500000,
      km: 0,
      descripcion: 'Hatchback versátil y moderno, con garantía de fábrica.',
      destacado: false,
      imagenes: [
        'https://source.unsplash.com/featured/600x400/?hatchback,peugeot',
      ],
    },
    {
      id: 5,
      marca: 'Fiat',
      modelo: 'Cronos',
      anio: 2025,
      precio: 7800000,
      km: 0,
      descripcion: 'Sedán nacional ideal para la familia y la ciudad.',
      destacado: false,
      imagenes: [
        'https://source.unsplash.com/featured/600x400/?sedan,fiat',
      ],
    },
    {
      id: 6,
      marca: 'Ford',
      modelo: 'Maverick',
      anio: 2025,
      precio: 10500000,
      km: 0,
      descripcion: 'Pickup híbrida con tecnología de punta y eficiencia excepcional.',
      destacado: true,
      imagenes: [
        'https://source.unsplash.com/featured/600x400/?pickup,ford',
      ],
    },
  ];

  // Estado local
  let vehicles = [];
  let loggedIn = false;
  // Almacena las imágenes seleccionadas para un nuevo vehículo.
  // Cada elemento será un objeto con la forma:
  // { src: 'data:image/jpeg;base64,...', offsetX: 50, offsetY: 50 }
  // offsetX y offsetY son porcentajes (0-100) que indican la posición del recorte
  // que se desea mostrar en las miniaturas y en las tarjetas.
  let selectedImages = [];
  // Referencia al área de arrastre para imágenes (se asigna en init)
  let dropArea;

  /**
   * Carga la lista de vehículos desde el servidor mediante una llamada API.
   * Actualiza la variable global `vehicles` con los datos obtenidos.
   * Si ocurre un error (por ejemplo, el servidor no está disponible), se
   * dejará la lista vacía y se mostrará un mensaje en la consola para
   * facilitar la depuración.
   */
  async function fetchVehiclesFromAPI() {
    try {
      const response = await fetch('/api/vehiculos');
      if (!response.ok) throw new Error('Error al solicitar vehículos');
      const data = await response.json();
      vehicles = Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('No se pudieron cargar los vehículos del servidor:', err);
      vehicles = [];
    }
  }

  // ---------- Utilidades para almacenamiento ----------
  // Las funciones `loadVehicles` y `saveVehicles` se han eliminado en esta
  // versión porque los vehículos ya no se almacenan en localStorage. La
  // persistencia se maneja en el servidor. Si ves referencias a estas
  // funciones en versiones anteriores, ignóralas.

  // ---------- Renderizado de tarjetas ----------
  /**
   * Crea una tarjeta HTML para un vehículo.
   * @param {Object} vehiculo Objeto de vehículo.
   * @returns {HTMLElement}
   */
  function createVehicleCard(vehiculo) {
    const card = document.createElement('div');
    card.className = 'vehiculo-card';
    // Asignar el ID del vehículo al dataset para futuras referencias
    card.dataset.id = vehiculo.id;
    // Imagen principal (primera foto o placeholder)
    // Si la propiedad imágenes contiene objetos con recorte, utilizar sus datos.
    let imgSrc;
    let offsetX = 50;
    let offsetY = 50;
    if (vehiculo.imagenes && vehiculo.imagenes.length) {
      const first = vehiculo.imagenes[0];
      if (typeof first === 'string') {
        imgSrc = first;
      } else {
        imgSrc = first.src;
        // Asegurar que existan offsets numéricos
        if (typeof first.offsetX === 'number') offsetX = first.offsetX;
        if (typeof first.offsetY === 'number') offsetY = first.offsetY;
      }
    } else {
      imgSrc = 'https://source.unsplash.com/featured/600x400/?car';
    }
    // Etiqueta destacado
    const etiqueta = vehiculo.destacado
      ? '<span class="etiqueta-destacado">Destacado</span>'
      : '';
    // Construir la tarjeta. Para la imagen utilizamos object-fit y object-position
    // definidos en CSS para mostrar la foto completa sin recortarla. Por ello
    // no agregamos estilos de recorte en línea.  
    card.innerHTML =
      etiqueta +
      '<img src="' + imgSrc + '" alt="' + vehiculo.marca + ' ' + vehiculo.modelo + '">' +
      '<div class="vehiculo-detalle">' +
      '<h3>' + vehiculo.marca + ' ' + vehiculo.modelo + '</h3>' +
      '<div class="vehiculo-precio">$' + vehiculo.precio.toLocaleString() + '</div>' +
      '<p>Año: ' + vehiculo.anio + '</p>' +
      '<p>Kilómetros: ' + (vehiculo.km ? vehiculo.km.toLocaleString() + ' km' : '0 km') + '</p>' +
      '<p>' + vehiculo.descripcion + '</p>' +
      '</div>';
    // Al hacer clic en la tarjeta se abrirá la página de detalle en una nueva pestaña
    card.addEventListener('click', () => {
      openVehicleDetails(vehiculo.id);
    });
    return card;
  }

  /**
   * Renderiza las tarjetas destacadas al inicio de la página.
   */
  function renderDestacados() {
    const cont = document.getElementById('destacados-container');
    cont.innerHTML = '';
    // filtrar destacados
    const destacados = vehicles.filter((v) => v.destacado);
    destacados.forEach((v) => {
      const card = createVehicleCard(v);
      cont.appendChild(card);
    });
    // Si no hay destacados, mostrar un mensaje
    if (destacados.length === 0) {
      const msg = document.createElement('p');
      msg.textContent = 'No hay vehículos destacados por el momento.';
      cont.appendChild(msg);
    }
  }

  /**
   * Renderiza la lista completa de vehículos según filtros aplicados.
   * @param {Array<Object>} lista Lista de vehículos a mostrar.
   */
  function renderVehiclesList(lista) {
    const cont = document.getElementById('vehiculos-container');
    cont.innerHTML = '';
    if (!lista.length) {
      const msg = document.createElement('p');
      msg.textContent = 'No se encontraron vehículos con los filtros seleccionados.';
      cont.appendChild(msg);
      return;
    }
    lista.forEach((v) => {
      const card = createVehicleCard(v);
      cont.appendChild(card);
    });
  }

  /**
   * Actualiza los selectores de filtros con las marcas y años
   * disponibles en la lista de vehículos.
   */
  function populateFilterOptions() {
    const marcaSelect = document.getElementById('filtro-marca');
    const anioSelect = document.getElementById('filtro-anio');
    // Extraer valores únicos
    const marcas = [...new Set(vehicles.map((v) => v.marca))].sort();
    const anios = [...new Set(vehicles.map((v) => v.anio))].sort((a, b) => b - a);
    // Limpiar selects
    marcaSelect.innerHTML = '<option value="">Todas</option>';
    anioSelect.innerHTML = '<option value="">Todos</option>';
    marcas.forEach((m) => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      marcaSelect.appendChild(opt);
    });
    anios.forEach((y) => {
      const opt = document.createElement('option');
      opt.value = y;
      opt.textContent = y;
      anioSelect.appendChild(opt);
    });
  }

  /**
   * Aplica los filtros seleccionados y actualiza la lista de vehículos.
   */
  function applyFilters() {
    const marca = document.getElementById('filtro-marca').value;
    const anio = document.getElementById('filtro-anio').value;
    const precioMax = document.getElementById('filtro-precio').value;
    const kmMax = document.getElementById('filtro-km').value;
    let lista = vehicles.slice();
    if (marca) {
      lista = lista.filter((v) => v.marca === marca);
    }
    if (anio) {
      const anioNum = parseInt(anio, 10);
      lista = lista.filter((v) => v.anio === anioNum);
    }
    if (precioMax) {
      const max = parseFloat(precioMax);
      lista = lista.filter((v) => v.precio <= max);
    }
    if (kmMax) {
      const maxkm = parseFloat(kmMax);
      lista = lista.filter((v) => v.km <= maxkm);
    }
    renderVehiclesList(lista);
  }

  /**
   * Abre una nueva pestaña con la página de detalles del vehículo seleccionado.
   * La página detalle.html debe existir y usar el parámetro id para cargar la información.
   * @param {number} id Identificador único del vehículo
   */
  function openVehicleDetails(id) {
    // Construir la URL con query string para el id del vehículo
    const url = 'detalle.html?id=' + encodeURIComponent(id);
    // Abrir la página de detalles en la misma pestaña para permitir
    // regresar fácilmente con el botón de retroceso del navegador.
    window.location.href = url;
  }

  /**
   * Configura los listeners de filtro.
   */
  function setupFilterListeners() {
    // Al hacer clic en aplicar, filtrar manualmente (opcional para compatibilidad)
    document.getElementById('btn-aplicar-filtros').addEventListener('click', (e) => {
      e.preventDefault();
      applyFilters();
    });
    // Botón para limpiar filtros
    const clearBtn = document.getElementById('btn-clear-filtros');
    if (clearBtn) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        // Restablecer todos los select e inputs de filtros
        document.getElementById('filtro-marca').value = '';
        document.getElementById('filtro-anio').value = '';
        document.getElementById('filtro-precio').value = '';
        document.getElementById('filtro-km').value = '';
        applyFilters();
      });
    }
    // Aplicar filtros automáticamente al cambiar cualquier filtro
    document.getElementById('filtro-marca').addEventListener('change', applyFilters);
    document.getElementById('filtro-anio').addEventListener('change', applyFilters);
    document.getElementById('filtro-precio').addEventListener('input', applyFilters);
    document.getElementById('filtro-km').addEventListener('input', applyFilters);
  }

  // ---------- Panel de administración ----------

  /**
   * Abre el panel de administración. Muestra la capa de fondo y el modal.
   */
  function openAdmin() {
    document.getElementById('admin-overlay').style.display = 'flex';
    // Si el usuario ya está logueado, mostrar dashboard
    if (loggedIn) {
      document.getElementById('admin-login').classList.add('hidden');
      document.getElementById('admin-dashboard').classList.remove('hidden');
      renderAdminList();
    } else {
      document.getElementById('admin-login').classList.remove('hidden');
      document.getElementById('admin-dashboard').classList.add('hidden');
    }
  }

  /**
   * Cierra el panel de administración y limpia formularios.
   */
  function closeAdmin() {
    document.getElementById('admin-overlay').style.display = 'none';
    // Limpiar campos de login
    document.getElementById('admin-user').value = '';
    document.getElementById('admin-pass').value = '';
    // Limpiar formulario de alta
    document.getElementById('form-add-vehiculo').reset();
    selectedImages = [];
    updatePreviewImages();
  }

  /**
   * Valida credenciales simples para acceder al modo administrador.
   */
  function loginAdmin() {
    const user = document.getElementById('admin-user').value.trim();
    const pass = document.getElementById('admin-pass').value.trim();
    // Puedes cambiar estas credenciales predeterminadas si lo deseas
    if (user === 'admin' && pass === 'admin') {
      loggedIn = true;
      // Alternar paneles
      document.getElementById('admin-login').classList.add('hidden');
      document.getElementById('admin-dashboard').classList.remove('hidden');
      renderAdminList();
    } else {
      alert('Usuario o contraseña incorrectos');
    }
  }

  /**
   * Cierra la sesión de administrador.
   */
  function logoutAdmin() {
    loggedIn = false;
    document.getElementById('admin-login').classList.remove('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
  }

  /**
   * Actualiza el listado de vehículos en el panel de administración.
   */
  function renderAdminList() {
    const listCont = document.getElementById('admin-lista-vehiculos');
    listCont.innerHTML = '';
    vehicles.forEach((v) => {
      const item = document.createElement('div');
      item.className = 'admin-lista-item';
      const text = document.createElement('span');
      text.textContent = v.marca + ' ' + v.modelo + ' (' + v.anio + ')';
      const btn = document.createElement('button');
      btn.textContent = 'Eliminar';
      btn.dataset.id = v.id;
      btn.addEventListener('click', () => {
        if (confirm('¿Eliminar este vehículo?')) {
          removeVehicle(v.id);
        }
      });
      item.appendChild(text);
      item.appendChild(btn);
      listCont.appendChild(item);
    });
  }

  /**
   * Elimina un vehículo por id y actualiza la vista y almacenamiento.
   * @param {number} id
   */
  function removeVehicle(id) {
    // Solicitar al servidor que elimine el vehículo. Una vez completado
    // actualizamos las vistas consultando nuevamente la API.
    fetch('/api/vehiculos/' + encodeURIComponent(id), {
      method: 'DELETE',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al eliminar');
        return res.json();
      })
      .then(() => {
        return fetchVehiclesFromAPI();
      })
      .then(() => {
        populateFilterOptions();
        applyFilters();
        renderDestacados();
        renderAdminList();
      })
      .catch((err) => {
        console.error(err);
        alert('No se pudo eliminar el vehículo.');
      });
  }

  /**
   * Maneja la selección de archivos desde el input file.
   * @param {Event} e
   */
  function handleFileInput(e) {
    const files = e.target.files;
    handleFiles(files);
  }

  /**
   * Maneja el arrastre de archivos sobre el área designada.
   */
  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    dropArea.classList.remove('dragover');
    handleFiles(files);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.add('dragover');
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    dropArea.classList.remove('dragover');
  }

  /**
   * Procesa los archivos seleccionados convirtiéndolos a DataURL y
   * agregándolos al array selectedImages. Renderiza las miniaturas.
   * @param {FileList} files
   */
  function handleFiles(files) {
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      // Limitar la cantidad de imágenes para evitar saturar el almacenamiento
      // del servidor. Permitimos un máximo de 5 imágenes por vehículo para
      // controlar el tamaño final y mantener tiempos de carga razonables. Si
      // se excede, mostrar una advertencia y no añadir más.
      if (selectedImages.length >= 5) {
        alert('Se permite un máximo de 5 imágenes por vehículo.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (evt) => {
        const dataUrl = evt.target.result;
        /*
         * Redimensionamos la imagen a un ancho máximo de 500 px y una
         * calidad del 60 % para reducir el tamaño final sin sacrificar
         * demasiado detalle. Esto ayuda a que las imágenes ocupen menos
         * espacio tanto en la transferencia al servidor como en el
         * almacenamiento en disco. Cargar muchas fotos de alta
         * resolución podría saturar el límite de almacenamiento del
         * navegador o exceder el tamaño permitido en el backend.
         */
        resizeImage(dataUrl, 500, (resizedDataUrl) => {
          selectedImages.push({ src: resizedDataUrl, offsetX: 50, offsetY: 50 });
          updatePreviewImages();
        }, 0.6);
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Redimensiona una imagen representada como DataURL a un ancho máximo conservando el aspecto.
   * Llama al callback con la nueva DataURL JPEG.
   * @param {string} dataUrl DataURL original de la imagen
   * @param {number} maxWidth Ancho máximo deseado
   * @param {function} callback Función a llamar con la DataURL redimensionada
   */
  /**
   * Redimensiona una imagen representada como DataURL a un ancho máximo conservando el aspecto.
   * Llama al callback con la nueva DataURL JPEG. Se usa un factor de calidad moderado
   * para reducir el tamaño de los datos y no superar el límite de almacenamiento local.
   *
   * @param {string} dataUrl DataURL original de la imagen
   * @param {number} maxWidth Ancho máximo deseado
   * @param {function} callback Función a llamar con la DataURL redimensionada
   * @param {number} [quality=0.7] Calidad JPEG a aplicar (0 a 1)
   */
  function resizeImage(dataUrl, maxWidth, callback, quality = 0.6) {
    const img = new Image();
    img.onload = function () {
      const ratio = img.height / img.width;
      const newWidth = Math.min(img.width, maxWidth);
      const newHeight = newWidth * ratio;
      const canvas = document.createElement('canvas');
      canvas.width = newWidth;
      canvas.height = newHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, newWidth, newHeight);
      // Convertir a JPEG para mayor compresión. Usamos calidad reducida para disminuir el peso.
      const resizedDataUrl = canvas.toDataURL('image/jpeg', quality);
      callback(resizedDataUrl);
    };
    img.src = dataUrl;
  }

  /**
   * Renderiza las miniaturas de imágenes seleccionadas en el área de
   * vista previa.
   */
  function updatePreviewImages() {
    const preview = document.getElementById('preview-imagenes');
    preview.innerHTML = '';
    // Mostrar cada imagen y controles de recorte, orden y eliminación.
    selectedImages.forEach((imgObj, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'preview-item';
      // Imagen en miniatura
      const img = document.createElement('img');
      img.src = imgObj.src;
      img.style.objectFit = 'cover';
      // Aumentar el tamaño de la miniatura para apreciar mejor la imagen al recortar
      img.style.width = '120px';
      img.style.height = '120px';
      img.style.objectPosition = imgObj.offsetX + '% ' + imgObj.offsetY + '%';
      wrapper.appendChild(img);
      // Controles de recorte (vertical y horizontal)
      const sliderY = document.createElement('input');
      sliderY.type = 'range';
      sliderY.min = 0;
      sliderY.max = 100;
      sliderY.value = imgObj.offsetY;
      sliderY.dataset.index = index;
      sliderY.dataset.axis = 'y';
      sliderY.className = 'crop-slider';
      sliderY.style.width = '120px';
      sliderY.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        const val = parseInt(e.target.value, 10);
        selectedImages[idx].offsetY = val;
        img.style.objectPosition = selectedImages[idx].offsetX + '% ' + val + '%';
      });
      wrapper.appendChild(sliderY);
      const sliderX = document.createElement('input');
      sliderX.type = 'range';
      sliderX.min = 0;
      sliderX.max = 100;
      sliderX.value = imgObj.offsetX;
      sliderX.dataset.index = index;
      sliderX.dataset.axis = 'x';
      sliderX.className = 'crop-slider';
      sliderX.style.width = '120px';
      sliderX.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        const val = parseInt(e.target.value, 10);
        selectedImages[idx].offsetX = val;
        img.style.objectPosition = val + '% ' + selectedImages[idx].offsetY + '%';
      });
      wrapper.appendChild(sliderX);
      // Controles para mover y eliminar imágenes
      const controls = document.createElement('div');
      controls.className = 'preview-controls';
      // Botón mover a la izquierda
      const moveLeft = document.createElement('button');
      moveLeft.type = 'button';
      moveLeft.className = 'move-left';
      moveLeft.textContent = '‹';
      moveLeft.addEventListener('click', () => {
        if (index > 0) {
          // Intercambiar con la imagen anterior
          [selectedImages[index - 1], selectedImages[index]] = [selectedImages[index], selectedImages[index - 1]];
          updatePreviewImages();
        }
      });
      controls.appendChild(moveLeft);
      // Botón eliminar
      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = '×';
      removeBtn.addEventListener('click', () => {
        selectedImages.splice(index, 1);
        updatePreviewImages();
      });
      controls.appendChild(removeBtn);
      // Botón mover a la derecha
      const moveRight = document.createElement('button');
      moveRight.type = 'button';
      moveRight.className = 'move-right';
      moveRight.textContent = '›';
      moveRight.addEventListener('click', () => {
        if (index < selectedImages.length - 1) {
          [selectedImages[index], selectedImages[index + 1]] = [selectedImages[index + 1], selectedImages[index]];
          updatePreviewImages();
        }
      });
      controls.appendChild(moveRight);
      wrapper.appendChild(controls);
      preview.appendChild(wrapper);
    });
  }

  /**
   * Maneja el envío del formulario de alta de vehículo. Agrega un
   * nuevo vehículo a la lista y actualiza la vista.
   * @param {Event} e
   */
  function handleAddVehicle(e) {
    e.preventDefault();
    // Obtener y validar datos del formulario
    const marca = document.getElementById('add-marca').value.trim();
    const modelo = document.getElementById('add-modelo').value.trim();
    const anio = parseInt(document.getElementById('add-anio').value, 10);
    const precio = parseFloat(document.getElementById('add-precio').value);
    const km = parseInt(document.getElementById('add-km').value, 10);
    const destacado = document.getElementById('add-destacado').value === 'true';
    const descripcion = document.getElementById('add-descripcion').value.trim();
    if (!marca || !modelo || isNaN(anio) || isNaN(precio) || isNaN(km) || !descripcion) {
      alert('Completa todos los campos correctamente.');
      return;
    }
    // Tomar solo la propiedad src de cada imagen seleccionada. Los offsets se
    // utilizan para recorte en la vista previa, pero no se envían al servidor.
    const imagenesFinales = selectedImages.map((img) => img.src);
    // Construir el objeto a enviar al servidor (el id lo genera el backend)
    const nuevoVehiculo = {
      marca,
      modelo,
      anio,
      precio,
      km,
      descripcion,
      destacado,
      imagenes: imagenesFinales,
    };
    // Enviar los datos al servidor para persistirlos y almacenar las imágenes
    fetch('/api/vehiculos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoVehiculo),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Error al guardar el vehículo');
        return res.json();
      })
      .then(() => {
        // Recargar la lista de vehículos desde la API
        return fetchVehiclesFromAPI();
      })
      .then(() => {
        // Actualizar vistas y listas
        populateFilterOptions();
        renderDestacados();
        applyFilters();
        renderAdminList();
        // Limpiar formulario y selección de imágenes
        document.getElementById('form-add-vehiculo').reset();
        selectedImages = [];
        updatePreviewImages();
        // Limpiar el valor del input de archivos para permitir subir el mismo archivo nuevamente
        const fileInput = document.getElementById('file-input');
        if (fileInput) fileInput.value = '';
        alert('Vehículo agregado exitosamente.');
      })
      .catch((err) => {
        console.error(err);
        alert('No se pudo agregar el vehículo. Intente nuevamente.');
      });
  }

  // ---------- Inicialización ----------
  async function init() {
    // Cargar vehículos desde la API antes de renderizar la interfaz
    await fetchVehiclesFromAPI();
    // Renderizar componentes iniciales
    populateFilterOptions();
    renderDestacados();
    applyFilters();
    // Setup listeners de filtros
    setupFilterListeners();
    // Eventos del administrador
    document.getElementById('admin-toggle').addEventListener('click', (e) => {
      e.preventDefault();
      openAdmin();
    });
    document.getElementById('btn-cerrar-admin').addEventListener('click', closeAdmin);
    // Botón de la X dentro del modal (permite cerrar sin cerrar sesión)
    const cerrarModalBtn = document.getElementById('btn-cerrar-modal');
    if (cerrarModalBtn) {
      cerrarModalBtn.addEventListener('click', closeAdmin);
    }
    document.getElementById('btn-login').addEventListener('click', loginAdmin);
    document.getElementById('btn-logout').addEventListener('click', logoutAdmin);
    document.getElementById('form-add-vehiculo').addEventListener('submit', handleAddVehicle);
    // Archivo y drag & drop
    const fileInput = document.getElementById('file-input');
    // Asignamos la referencia global para poder usarla en manejadores
    dropArea = document.getElementById('drop-area');
    fileInput.addEventListener('change', handleFileInput);
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
    dropArea.addEventListener('click', () => fileInput.click());
  }

  // Ejecutar inicialización cuando el DOM esté listo
  document.addEventListener('DOMContentLoaded', init);
})();