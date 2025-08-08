/* detalle.js - Página de detalles para un vehículo específico con galería de miniaturas y contacto por WhatsApp */

document.addEventListener('DOMContentLoaded', async () => {
  // Obtener el parámetro id de la URL
  const params = new URLSearchParams(window.location.search);
  const idParam = params.get('id');
  const id = idParam ? parseInt(idParam, 10) : null;
  const cont = document.getElementById('detalle-content');
  if (!id) {
    cont.innerHTML = '<p>No se especificó ningún vehículo.</p>';
    return;
  }
  try {
    // Solicitar todos los vehículos al backend
    const res = await fetch('/api/vehiculos');
    if (!res.ok) throw new Error('Error al solicitar vehículos');
    const vehicles = await res.json();
    const vehiculo = vehicles.find((v) => v.id === id);
    if (!vehiculo) {
      cont.innerHTML = '<p>No se encontró el vehículo solicitado.</p>';
      return;
    }
    // Preparar contenedor general
    const layout = document.createElement('div');
    layout.className = 'detalle-layout';
    // Contenedor de miniaturas
    const thumbs = document.createElement('div');
    thumbs.className = 'thumbnails';
    // Contenedor principal (imagen grande + info)
    const mainSection = document.createElement('div');
    mainSection.className = 'main-section';
    // Imagen principal
    const mainImg = document.createElement('img');
    mainImg.className = 'detalle-main-img';
    mainImg.style.objectFit = 'contain';
    mainImg.style.width = '100%';
    mainImg.style.height = 'auto';
    // Tomar la primera imagen como principal
    const imagenes = Array.isArray(vehiculo.imagenes) ? vehiculo.imagenes : [];
    let currentIndex = 0;
    if (imagenes.length) {
      mainImg.src = imagenes[0];
    } else {
      mainImg.src = 'https://source.unsplash.com/featured/800x600/?car';
    }
    // Función para actualizar la imagen principal y el estado de las miniaturas
    function updateMain(index) {
      if (!imagenes.length) return;
      currentIndex = (index + imagenes.length) % imagenes.length;
      mainImg.src = imagenes[currentIndex];
      // Actualizar clases activas en miniaturas
      const allThumbs = thumbs.querySelectorAll('img');
      allThumbs.forEach((t) => t.classList.remove('active'));
      const currentThumb = allThumbs[currentIndex];
      if (currentThumb) currentThumb.classList.add('active');
    }
    // Crear miniaturas y permitir seleccionar la imagen principal.
    imagenes.forEach((imgSrc, idx) => {
      const thumb = document.createElement('img');
      thumb.src = imgSrc;
      thumb.className = 'thumbnail';
      // Marcar la primera imagen como activa por defecto
      if (idx === 0) {
        thumb.classList.add('active');
      }
      thumb.addEventListener('click', () => {
        updateMain(idx);
      });
      thumbs.appendChild(thumb);
    });
    // Flechas de navegación
    let prevBtn;
    let nextBtn;
    if (imagenes.length > 1) {
      prevBtn = document.createElement('button');
      prevBtn.className = 'nav-arrow prev';
      prevBtn.type = 'button';
      prevBtn.innerHTML = '&lsaquo;';
      prevBtn.addEventListener('click', () => {
        updateMain(currentIndex - 1);
      });
      nextBtn = document.createElement('button');
      nextBtn.className = 'nav-arrow next';
      nextBtn.type = 'button';
      nextBtn.innerHTML = '&rsaquo;';
      nextBtn.addEventListener('click', () => {
        updateMain(currentIndex + 1);
      });
    }
    // Crear contenedor para la imagen principal y las flechas
    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'image-wrapper';
    imageWrapper.appendChild(mainImg);
    // Si existen flechas de navegación, añadirlas al contenedor de imagen
    if (prevBtn && nextBtn) {
      imageWrapper.appendChild(prevBtn);
      imageWrapper.appendChild(nextBtn);
    }

    // Información del vehículo
    const info = document.createElement('div');
    info.className = 'info-section';
    // Título
    const titulo = document.createElement('h2');
    titulo.textContent = vehiculo.marca + ' ' + vehiculo.modelo;
    info.appendChild(titulo);
    // Año
    const anioP = document.createElement('p');
    anioP.innerHTML = '<strong>Año:</strong> ' + vehiculo.anio;
    info.appendChild(anioP);
    // Precio
    const precioP = document.createElement('p');
    precioP.innerHTML = '<strong>Precio:</strong> $' + (vehiculo.precio ? vehiculo.precio.toLocaleString() : '');
    info.appendChild(precioP);
    // Kilómetros
    const kmP = document.createElement('p');
    kmP.innerHTML = '<strong>Kilómetros:</strong> ' + (vehiculo.km ? vehiculo.km.toLocaleString() + ' km' : '');
    info.appendChild(kmP);
    // Descripción
    const descP = document.createElement('p');
    descP.innerHTML = '<strong>Descripción:</strong> ' + (vehiculo.descripcion || '');
    info.appendChild(descP);
    // Botón WhatsApp
    const whatsappLink = document.createElement('a');
    whatsappLink.href = 'https://wa.me/543489639033?text=' + encodeURIComponent('Hola, me interesa el ' + vehiculo.marca + ' ' + vehiculo.modelo + '.');
    whatsappLink.className = 'btn-whatsapp';
    whatsappLink.target = '_blank';
    whatsappLink.textContent = 'Consultar por WhatsApp';
    info.appendChild(whatsappLink);
    // Montar estructura
    // Agregar la imagen envuelta (con flechas) y luego la información
    mainSection.appendChild(imageWrapper);
    mainSection.appendChild(info);
    layout.appendChild(thumbs);
    layout.appendChild(mainSection);
    cont.appendChild(layout);
  } catch (err) {
    console.error(err);
    cont.innerHTML = '<p>Error al cargar los detalles del vehículo.</p>';
  }
});