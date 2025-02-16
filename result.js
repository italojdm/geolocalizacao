document.addEventListener('DOMContentLoaded', () => {
    const resultTitle = document.getElementById('result-title');
    const info = document.getElementById('info');
    const shareButton = document.getElementById('share-data');
    const restartProcessButton = document.getElementById('restart-process');
    const mapContainer = document.getElementById('map');

    const clientData = JSON.parse(sessionStorage.getItem('clientData'));
    if (!clientData) {
        alert('Nenhum dado encontrado!');
        window.location.href = 'index.html';
    }

    const { clientCode, phone, email, locationData, photoBlob } = clientData;

    info.innerHTML = `
        <strong>Código do Cliente:</strong> ${clientCode}<br>
        <strong>Telefone:</strong> ${phone || 'Não fornecido'}<br>
        <strong>E-mail:</strong> ${email || 'Não fornecido'}<br>
        <strong>Latitude:</strong> ${locationData.latitude.toFixed(6)}<br>
        <strong>Longitude:</strong> ${locationData.longitude.toFixed(6)}<br>
    `;

    const updateMap = (latitude, longitude) => {
        const map = L.map('map').setView([latitude, longitude], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors',
        }).addTo(map);

        L.marker([latitude, longitude])
            .addTo(map)
            .bindPopup(`Você está aqui!<br>Lat: ${latitude.toFixed(6)}<br>Lng: ${longitude.toFixed(6)}`)
            .openPopup();
    };

    updateMap(locationData.latitude, locationData.longitude);

    shareButton.addEventListener('click', async () => {
        const textData = `Código do Cliente: ${clientCode}\nTelefone: ${phone}\nE-mail: ${email}\nLatitude: ${locationData.latitude.toFixed(6)}\nLongitude: ${locationData.longitude.toFixed(6)}`;

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
        } else {
            alert('Seu dispositivo não suporta a funcionalidade de compartilhamento.');
        }
    });

    restartProcessButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});