document.addEventListener('DOMContentLoaded', () => {
  const clientCodeInput = document.getElementById('client-code');
  const capturePhotoButton = document.getElementById('capture-photo');
  const restartProcessButton = document.getElementById('restart-process');
  const photoPreview = document.getElementById('photo-preview');
  const info = document.getElementById('info');
  const shareButton = document.getElementById('share-data');
  const mapContainer = document.getElementById('map');

  let clientCode = '';
  let photoBlob = null;
  let locationData = {};
  let map = null;

  // Validação do Código do Cliente
  const validateClientCode = (code) => /^C\d{6}$/.test(code);
  const sanitizeClientCode = (code) => code.toUpperCase().replace(/[^C0-9]/g, '');

  // Função para capturar a foto
  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: "environment" } },
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
      photoPreview.src = photoDataURL;
      photoPreview.style.display = 'block';
    } catch (error) {
      console.error('Erro ao acessar a câmera:', error);
      alert('Erro ao acessar a câmera!');
    }
  };

  // Função para obter a localização do usuário
  const getUserLocation = () =>
    new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject)
    );

  // Atualiza o mapa com a localização
  const updateMap = (latitude, longitude) => {
    if (!map) {
      map = L.map('map').setView([latitude, longitude], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      L.marker([latitude, longitude])
        .addTo(map)
        .bindPopup(`Você está aqui!<br>Lat: ${latitude.toFixed(6)}<br>Lng: ${longitude.toFixed(6)}`)
        .openPopup();
    } else {
      map.setView([latitude, longitude], 15);
    }
  };

  // Validação e capturar foto
  capturePhotoButton.addEventListener('click', async () => {
    clientCode = sanitizeClientCode(clientCodeInput.value);

    if (!validateClientCode(clientCode)) {
      alert('O código do cliente deve começar com "C" seguido de 6 números.');
      return;
    }

    try {
      await capturePhoto();

      const position = await getUserLocation();
      locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      info.innerHTML = `
        <strong>Código do Cliente:</strong><br>${clientCode}<br>
        <strong>Latitude:</strong><br>${locationData.latitude.toFixed(6)}<br>
        <strong>Longitude:</strong><br>${locationData.longitude.toFixed(6)}
      `;

      shareButton.style.display = 'block';
      restartProcessButton.style.display = 'block';
      updateMap(locationData.latitude, locationData.longitude);
    } catch (error) {
      console.error('Erro ao acessar a localização:', error);
      alert('Erro ao acessar a localização!');
    }
  });

  // Reiniciar o processo
  restartProcessButton.addEventListener('click', () => {
    location.reload();
  });

  // Compartilhar os dados
  shareButton.addEventListener('click', async () => {
    const textData = `Código do Cliente: ${clientCode}\nLatitude: ${locationData.latitude.toFixed(6)}\nLongitude: ${locationData.longitude.toFixed(6)}`;

    // Verifica se o navegador suporta compartilhamento de arquivos
    if (navigator.canShare && navigator.canShare({ files: [new File([photoBlob], `${clientCode}.jpg`, { type: 'image/jpeg' })] })) {
      try {
        const shareData = {
          title: 'Captura de Coordenadas',
          text: textData,
          files: [new File([photoBlob], `${clientCode}.jpg`, { type: 'image/jpeg' })],
        };
        await navigator.share(shareData);
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
        alert('Erro ao compartilhar os dados.');
      }
    } else if (navigator.share) {
      // Caso não suporte arquivos, compartilha apenas o texto
      try {
        await navigator.share({ title: 'Cadastro de Cliente', text: textData });
      } catch (error) {
        console.log('Erro ao compartilhar texto:', error);
        alert('Erro ao compartilhar o texto.');
      }
    } else {
      alert('Seu dispositivo não suporta a funcionalidade de compartilhamento.');
    }
  });

  // Validação do código do cliente
  clientCodeInput.addEventListener('input', () => {
    clientCodeInput.value = sanitizeClientCode(clientCodeInput.value);
  });
});
