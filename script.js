document.addEventListener('DOMContentLoaded', () => {
  const clientCodeInput = document.getElementById('client-code');
  const capturePhotoButton = document.getElementById('capture-photo');
  const phoneInput = document.getElementById('phone');
  const emailInput = document.getElementById('email');
  let clientCode = '';
  let photoBlob = null;
  let locationData = {};

  const validateClientCode = (code) => /^C\d{6}$/.test(code);
  const sanitizeClientCode = (code) => code.toUpperCase().replace(/[^C0-9]/g, '');
  const validatePhone = (phone) => /^\(\d{2}\)\s?\d{5}-\d{4}$/.test(phone);
  const sanitizePhone = (phone) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
  };
  const validateEmail = (email) => /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(email);

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
    } catch (error) {
      console.error('Erro ao acessar a câmera:', error);
      alert('Erro ao acessar a câmera!');
    }
  };

  const getUserLocation = () =>
    new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject)
    );

  capturePhotoButton.addEventListener('click', async () => {
    clientCode = sanitizeClientCode(clientCodeInput.value);
    const phone = sanitizePhone(phoneInput.value);
    const email = emailInput.value;

    if (!validateClientCode(clientCode)) {
      alert('O código do cliente deve começar com "C" seguido de 6 números.');
      return;
    }

    if (phone && !validatePhone(phone)) {
      alert('Telefone inválido. Utilize o formato: (85) 91234-4321');
      return;
    }

    if (email && !validateEmail(email)) {
      alert('E-mail inválido. Utilize o formato: exemplo@dominio.com.');
      return;
    }

    try {
      await capturePhoto();
      const position = await getUserLocation();
      locationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      sessionStorage.setItem('clientData', JSON.stringify({
        clientCode, phone, email, locationData, photoBlob
      }));

      window.location.href = 'result.html';
    } catch (error) {
      console.error('Erro ao acessar a localização:', error);
      alert('Erro ao acessar a localização!');
    }
  });

  clientCodeInput.addEventListener('input', () => {
    clientCodeInput.value = sanitizeClientCode(clientCodeInput.value);
  });

  phoneInput.addEventListener('input', () => {
    phoneInput.value = sanitizePhone(phoneInput.value);
  });
});