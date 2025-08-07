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
    if (imagenes.length) {
      mainImg.src = imagenes[0];
    } else {
      mainImg.src = 'https://source.unsplash.com/featured/800x600/?car';
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
        mainImg.src = imgSrc;
        // Actualizar clases activas
        const allThumbs = thumbs.querySelectorAll('img');
        allThumbs.forEach((t) => t.classList.remove('active'));
        thumb.classList.add('active');
      });
      thumbs.appendChild(thumb);
    });
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
    mainSection.appendChild(mainImg);
    mainSection.appendChild(info);
    layout.appendChild(thumbs);
    layout.appendChild(mainSection);
    cont.appendChild(layout);
  } catch (err) {
    console.error(err);
    cont.innerHTML = '<p>Error al cargar los detalles del vehículo.</p>';
  }
});