document.addEventListener('DOMContentLoaded', () => {
  const clientCodeInput = document.getElementById('client-code');
  const clientPhoneInput = document.getElementById('client-phone');
  const clientEmailInput = document.getElementById('client-email');
  const capturePhotoButton = document.getElementById('capture-photo');
  const restartProcessButton = document.getElementById('restart-process');
  const photoPreview = document.getElementById('photo-preview');
  const info = document.getElementById('info');
  const shareButton = document.getElementById('share-data');
  const mapContainer = document.getElementById('map');
  const loadingMessage = document.getElementById('loading-message');
  const mapSection = document.getElementById('map-section');

  let clientCode = '';
  let clientPhone = '';
  let clientEmail = '';
  let photoBlob = null;
  let locationData = {};
  let map = null;

  // Limpar os campos ao recarregar a página
  clientCodeInput.value = '';
  clientPhoneInput.value = '';
  clientEmailInput.value = '';
  photoPreview.style.display = 'none';
  info.innerHTML = '';
  shareButton.style.display = 'none';
  restartProcessButton.style.display = 'none';
  mapSection.style.display = 'none';

  const validateClientCode = (code) => /^C\d{6}$/.test(code);
  const sanitizeClientCode = (code) => code.toUpperCase().replace(/[^C0-9]/g, '');

  // Validação do telefone
  const validatePhone = (phone) => /\(\d{2}\) \d{5}-\d{4}/.test(phone);

  // Validação do e-mail
  const validateEmail = (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  const formatPhone = (phone) => {
    phone = phone.replace(/\D/g, '');
    if (phone.length <= 2) {
      return `(${phone}`;
    } else if (phone.length <= 7) {
      return `(${phone.slice(0, 2)}) ${phone.slice(2)}`;
    } else {
      return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7, 11)}`;
    }
  };

  const capturePhoto = async () => {
    loadingMessage.textContent = "Acessando a câmera...";
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
      loadingMessage.textContent = "";

    } catch (error) {
      loadingMessage.textContent = "";
      console.error('Erro ao acessar a câmera:', error);
      alert('Erro ao acessar a câmera! Verifique se a câmera está disponível.');
    }
  };

  const getUserLocation = () =>
    new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject)
    );

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

  capturePhotoButton.addEventListener('click', async () => {
    clientCode = sanitizeClientCode(clientCodeInput.value);
    clientPhone = clientPhoneInput.value || 'Não informado';
    clientEmail = clientEmailInput.value || 'Não informado';

    if (!validateClientCode(clientCode)) {
      alert('O código do cliente deve começar com "C" seguido de 6 números.');
      return;
    }

    if (clientPhone !== 'Não informado' && !validatePhone(clientPhone)) {
      alert('O telefone deve seguir o formato (XX) XXXXX-XXXX.');
      return;
    }

    if (clientEmail !== 'Não informado' && !validateEmail(clientEmail)) {
      alert('O e-mail deve ser válido (exemplo@dominio.com).');
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
        <strong>Telefone:</strong><br>${clientPhone}<br>
        <strong>E-mail:</strong><br>${clientEmail}<br>
        <strong>Latitude:</strong><br>${locationData.latitude.toFixed(6)}<br>
        <strong>Longitude:</strong><br>${locationData.longitude.toFixed(6)}
      `;

      mapSection.style.display = 'block';
      shareButton.style.display = 'block';
      restartProcessButton.style.display = 'block';
      updateMap(locationData.latitude, locationData.longitude);

    } catch (error) {
      console.error('Erro ao acessar a localização:', error);
      alert('Erro ao acessar a localização! Verifique as permissões de localização.');
    }
  });

  restartProcessButton.addEventListener('click', () => {
    location.reload();
  });

  shareButton.addEventListener('click', async () => {
    const textData = `Código do Cliente: ${clientCode}\nTelefone: ${clientPhone}\nE-mail: ${clientEmail}\nLatitude: ${locationData.latitude.toFixed(6)}\nLongitude: ${locationData.longitude.toFixed(6)}`;

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

  clientPhoneInput.addEventListener('input', () => {
    clientPhoneInput.value = formatPhone(clientPhoneInput.value);
  });

  clientCodeInput.addEventListener('input', () => {
    clientCodeInput.value = sanitizeClientCode(clientCodeInput.value);
  });
});
