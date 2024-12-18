document.addEventListener('DOMContentLoaded', () => {
  const clientCodeInput = document.getElementById('client-code');
  const capturePhotoButton = document.getElementById('capture-photo');
  const photoPreview = document.getElementById('photo-preview');
  const info = document.getElementById('info');
  const shareButton = document.getElementById('share-data');
  const mapContainer = document.getElementById('map'); // Referência ao mapa

  let clientCode = '';
  let photoBlob = null;
  let locationData = {};
  let map = null;

  // Validação do Código do Cliente
  clientCodeInput.addEventListener('input', () => {
    clientCodeInput.value = clientCodeInput.value.toUpperCase().replace(/[^C0-9]/g, '');
  });

  capturePhotoButton.addEventListener('click', async () => {
    clientCode = clientCodeInput.value;

    if (!/^C\d{6}$/.test(clientCode)) {
      alert('O código do cliente deve começar com "C" seguido de 6 números.');
      return;
    }

    try {
      // Captura da foto utilizando a câmera traseira
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { exact: "environment" }, // Força o uso da câmera traseira
        },
      });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();

      const canvas = document.createElement('canvas');
      const capture = new Promise((resolve) => {
        video.addEventListener('loadedmetadata', () => {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          stream.getTracks().forEach(track => track.stop());
          resolve(canvas.toDataURL('image/jpeg'));
        });
      });

      const photoDataURL = await capture;
      photoBlob = await (await fetch(photoDataURL)).blob();

      // Atualiza a prévia da foto
      photoPreview.src = photoDataURL;
      photoPreview.style.display = 'block';

      // Obtém geolocalização e exibe no mapa
      navigator.geolocation.getCurrentPosition((position) => {
        locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        info.textContent = `
          Código: ${clientCode}
          Latitude: ${locationData.latitude.toFixed(6)}
          Longitude: ${locationData.longitude.toFixed(6)}
        `;

        shareButton.style.display = 'block';

        // Inicializa ou atualiza o mapa
        if (!map) {
          map = L.map('map').setView([locationData.latitude, locationData.longitude], 15);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors',
          }).addTo(map);

          // Adiciona um marcador na localização atual
          L.marker([locationData.latitude, locationData.longitude])
            .addTo(map)
            .bindPopup(`Você está aqui!<br>Lat: ${locationData.latitude.toFixed(6)}<br>Lng: ${locationData.longitude.toFixed(6)}`)
            .openPopup();
        } else {
          // Atualiza a posição do mapa e do marcador
          map.setView([locationData.latitude, locationData.longitude], 15);
        }
      });
    } catch (error) {
      console.error('Erro ao capturar foto ou localização:', error);
      alert('Não foi possível capturar a foto ou obter a localização.');
    }
  });

  // Compartilhamento dos dados
  shareButton.addEventListener('click', () => {
    if (navigator.share) {
      const data = {
        title: 'Dados do Cliente',
        text: `
          Código: ${clientCode}
          Latitude: ${locationData.latitude.toFixed(6)}
          Longitude: ${locationData.longitude.toFixed(6)}
        `,
        files: [new File([photoBlob], `${clientCode}.jpg`, { type: 'image/jpeg' })],
      };

      navigator.share(data).catch((error) => {
        console.error('Erro ao compartilhar:', error);
      });
    } else {
      alert('O compartilhamento nativo não é suportado neste dispositivo.');
    }
  });
});