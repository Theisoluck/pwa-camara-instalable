// Registro del Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js')
    .then(() => console.log('Service Worker registrado'))
    .catch((error) => console.log('Error al registrar el Service Worker:', error));
}

// ===== Fase 1: Instalación =====

let eventoInstalacionDiferido = null;

window.addEventListener('beforeinstallprompt', (event) => {
  // Evita que el mini-banner automático aparezca antes de tiempo
  event.preventDefault();
  eventoInstalacionDiferido = event;

  // Muestra tu botón personalizado de instalación en la UI
  const btnInstalar = document.getElementById('btn-instalar');
  btnInstalar.hidden = false;
});

document.getElementById('btn-instalar').addEventListener('click', () => {
  if (!eventoInstalacionDiferido) return;

  eventoInstalacionDiferido.prompt();
  eventoInstalacionDiferido.userChoice.then((resultado) => {
    if (resultado.outcome === 'accepted') {
      document.getElementById('btn-instalar').hidden = true;
    }
    // El evento solo puede usarse una vez
    eventoInstalacionDiferido = null;
  });
});

// iOS no dispara beforeinstallprompt: se muestran los pasos manuales
function verificarEntornoIOS(){
  const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const estaInstalada = window.navigator.standalone === true ||
                        window.matchMedia('(display-mode: standalone)').matches;

  // Si está en iPhone y aún la ve desde el navegador, mostrar instrucciones manuales
  if (esIOS && !estaInstalada) {
    const guiaIOS = document.getElementById('instrucciones-ios');
    if (guiaIOS) guiaIOS.hidden = false;
  }
}

verificarEntornoIOS();

// ===== Fase 2: Cámara =====

let streamActual = null;
let modoCamaraActual = 'environment'; // 'environment' = trasera | 'user' = frontal

function actualizarMensajeEstado(mensaje){
  document.getElementById('mensaje-estado').textContent = mensaje;
}

function detenerCamaraActiva(){
  if (streamActual) {
    streamActual.getTracks().forEach((track) => {
      track.stop();
    });
    streamActual = null;
  }
}

function iniciarCamara(modo){
  detenerCamaraActiva();

  const restricciones = {
    video: { facingMode: modo },
    audio: false
  };

  return navigator.mediaDevices.getUserMedia(restricciones)
    .then((stream) => {
      streamActual = stream;
      const visorVideo = document.getElementById('visor-camara');
      visorVideo.srcObject = stream;
      actualizarMensajeEstado(`Cámara activa (${modo === 'environment' ? 'Trasera' : 'Frontal'})`);
    })
    .catch((error) => {
      if (error.name === 'NotAllowedError') {
        actualizarMensajeEstado('Permiso denegado. Habilita el acceso a la cámara en los ajustes de tu navegador.');
      } else if (error.name === 'NotFoundError') {
        actualizarMensajeEstado('No se detectó el sensor de cámara solicitado en este dispositivo.');
      } else {
        actualizarMensajeEstado(`Error al acceder al hardware: ${error.message}`);
      }
    });
}

// Paso 1: El usuario pulsa "Solicitar Acceso a Cámara" -> Mostramos aviso explicativo
document.getElementById('btn-preparar-camara').addEventListener('click', () => {
  document.getElementById('aviso-permiso').hidden = false;
});

// Paso 2: El usuario lee el motivo y pulsa "Aceptar y Encender Cámara"
document.getElementById('btn-confirmar-permiso').addEventListener('click', () => {
  document.getElementById('aviso-permiso').hidden = true;
  iniciarCamara(modoCamaraActual);
});

// Alterna entre cámara trasera y frontal
document.getElementById('btn-alternar-camara').addEventListener('click', () => {
  modoCamaraActual = modoCamaraActual === 'environment' ? 'user' : 'environment';
  iniciarCamara(modoCamaraActual);
});

// Apaga la cámara y libera el sensor
document.getElementById('btn-apagar-camara').addEventListener('click', () => {
  detenerCamaraActiva();
  const visorVideo = document.getElementById('visor-camara');
  visorVideo.srcObject = null;
  actualizarMensajeEstado('Cámara apagada.');
});
