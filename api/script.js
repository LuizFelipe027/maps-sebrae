let marcadoresPontos = [];
let marcadoresPontosAncoras = [];

const apikey = "AIzaSyAHhb1kPzpi0_AjG9zLW1_AQkZpi30PCqA";
let map;
let service;

let marcadorPersonalizadoPontoAncora;
let marcadorPersonalizadoPontos;

function limparMarcadores(zoomLevel) {
  if (zoomLevel <= 7) {
    for (const local of marcadoresPontosAncoras) {
      local.marcador.setMap(null);
    }
  }

  for (const local of marcadoresPontos) {
    if (local.marcador) {
      local.marcador.setMap(null);
    }
  }
}

async function getPlaceId(latitude, longitude) {
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apikey}`);
  const data = await response.json();

  if (data.status === 'OK') {
    const placeId = data.results[0].place_id;
    return placeId;
  } else {
    console.error('Erro ao obter place_id:', data.error_message);
    return null;
  }
}

async function converterArrayParaObjeto(array) {
  const propriedades = array.shift();
  const arrMarcacoes = array.map(async (item) => {
    const objeto = {};
    propriedades.forEach(async (propriedade, index) => {
      propriedade = propriedade.replace(/\s/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
      if (index < item.length) {
        let valor = item[index];
        if (propriedade === 'latitude' || propriedade === 'longitude') {
          valor = parseFloat(valor.replace(',', '.'));
        }
        objeto[propriedade] = valor;
      }
    });

    if (objeto['ancora'] === 'sim' && objeto['google_meu_negocio'] && objeto['latitude'] && objeto['longitude'] && !objeto['place_id']) {
      console.log(`${objeto['google_meu_negocio']} && ${objeto['latitude']} && ${objeto['longitude']} && !${objeto['place_id']}`)
      const placeId = await getPlaceId(objeto['latitude'], objeto['longitude']);
      objeto['place_id'] = placeId;
    }

    return objeto;
  });
  return Promise.all(arrMarcacoes);
}


async function getDataFromSheet() {
  const sheetId = '1fAa7t3hpYsr9km0RCJhpCW2nlgarcEIWNs6j3ND6Jjo';
  const range = 'Página1!1:1000';

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apikey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const objeto = converterArrayParaObjeto(data.values);

    return objeto;
  } catch (error) {
    console.error('Erro ao buscar dados da planilha:', error);
    return [];
  }
}

function displayLocationInfo(place) {
  const tabContent = document.getElementById('tab-content');
  const tabs = document.getElementById('tabs');

  const photosHtml = place.photos
    ? place.photos.slice(0, 5).map(photo => `<img src="${photo.getUrl({ maxWidth: 200, maxHeight: 200 })}" alt="${place.name}">`).join('')
    : 'N/A';

  tabContent.innerHTML = `
      <div class="tab-pane active" id="info">
          <h3>Informações</h3>
          <p>Nome: ${place.name}</p>
          <p>Endereço: ${place.formatted_address}</p>
          <p>Telefone: ${place.formatted_phone_number || 'N/A'}</p>
          <p>Rating: ${place.rating || 'N/A'}</p>
          <p>Website: ${place.website ? `<a href="${place.website}" target="_blank">${place.website}</a>` : 'N/A'}</p>
      </div>
      <div class="tab-pane" id="photos">
          <h3>Fotos</h3>
          ${photosHtml}
      </div>
      <div class="tab-pane" id="reviews">
          <h3>Avaliações</h3>
          ${place.reviews ? place.reviews.map(review => `<p>${review.text}</p>`).join('') : 'N/A'}
      </div>
  `;

  tabs.innerHTML = `
      <button class="tab-button active" onclick="changeTab('info')">Informações</button>
      <button class="tab-button" onclick="changeTab('photos')">Fotos</button>
      <button class="tab-button" onclick="changeTab('reviews')">Avaliações</button>
  `;
}

function changeTab(tabId) {
  const tabPanes = document.querySelectorAll('.tab-pane');
  const tabButtons = document.querySelectorAll('.tab-button');

  tabPanes.forEach(pane => pane.classList.remove('active'));
  tabButtons.forEach(button => button.classList.remove('active'));

  document.getElementById(tabId).classList.add('active');
  [...tabButtons].find(button => button.onclick.toString().includes(`'${tabId}'`)).classList.add('active');
}




function getPlaceDetails(placeId) {
  if (!placeId) {
    console.error('Invalid placeId:', placeId);
    return;
  }

  const request = {
    placeId: placeId,
    fields: ['name', 'formatted_address', 'formatted_phone_number', 'rating', 'website', 'photos', 'reviews']
  };

  service.getDetails(request, (place, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      displayLocationInfo(place);
    } else {
      console.error('Place details request failed due to ' + status);
    }
  });
}

async function initMap() {
  getDataFromSheet().then(values => {

    marcadoresPontosAncoras = values.filter(m => m.ancora.toLowerCase() === 'sim');

    console.log("marcadoresPontosAncoras: ", marcadoresPontosAncoras);


    marcadoresPontos = values.filter(m => !m.ancora && !(marcadoresPontosAncoras.find(f => f.latitude === m.latitude && f.longitude === m.longitude)));

    let isSatellite = false;

    const latLng = new google.maps.LatLng(-20.322478, -40.338271);
    map = new google.maps.Map(document.getElementById("map"), {
      zoom: 10,
      center: latLng,
      mapTypeId: "roadmap",
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
        {
          featureType: "landscape",
          stylers: [{ visibility: "off" }],
        },
      ],
      mapTypeId: "roadmap",
      tilt: 45,
    });

    service = new google.maps.places.PlacesService(map);

    map.addListener("zoom_changed", function () {
      var zoomLevel = map.getZoom();
      if (zoomLevel >= 17 && !isSatellite) {
        map.setMapTypeId("satellite");
        isSatellite = true;
      } else if (zoomLevel < 17 && isSatellite) {
        map.setMapTypeId("roadmap");
        isSatellite = false;
      }
    });

    marcadorPersonalizadoPontoAncora = new google.maps.MarkerImage(
      '../assets/google-maps.png',
      new google.maps.Size(48, 48),
      new google.maps.Point(0, 0),
      new google.maps.Point(24, 48),
      new google.maps.Size(48, 48)
    );

    marcadorPersonalizadoPontos = new google.maps.MarkerImage(
      '../assets/pin.png',
      new google.maps.Size(24, 32),
      new google.maps.Point(0, 0),
      new google.maps.Point(12, 32),
      new google.maps.Size(24, 32)
    );

    for (const local of marcadoresPontosAncoras) {
      const latLng = new google.maps.LatLng(local.latitude, local.longitude);
      const marcador = new google.maps.Marker({
        position: latLng,
        map: map,
        icon: marcadorPersonalizadoPontoAncora,
      });

      marcador.addListener("click", () => {
        if (local.place_id) {
          console.log('Place ID:', local.place_id);
          getPlaceDetails(local.place_id);
        } else {
          console.error('No place_id for location:', local);
        }
      });

      local.marcador = marcador;
    }

    map.addListener('zoom_changed', function () {
      var zoomLevel = map.getZoom();

      limparMarcadores(zoomLevel);

      if (zoomLevel <= 7) {
        const latLngES = new google.maps.LatLng(-20.3155, -40.3128);
        const marcadorES = new google.maps.Marker({
          position: latLngES,
          map: map,
          icon: marcadorPersonalizadoPontoAncora,
        });

        marcadorES.addListener("click", () => {
          displayLocationInfo({ cidade: "Espírito Santo", pais: "Brasil" });
        });
      } else if (zoomLevel > 7 && zoomLevel <= 12) {
        for (const local of marcadoresPontosAncoras) {
          local.marcador.setMap(map);
        }
      } else {
        for (const local of marcadoresPontos) {
          const latLng = new google.maps.LatLng(local.latitude, local.longitude);
          const marcador = new google.maps.Marker({
            position: latLng,
            map: map,
            icon: marcadorPersonalizadoPontos,
          });

          marcador.addListener("click", () => {
            displayCustomLocationInfo(local);
          });

          local.marcador = marcador;
        }
      }
    });
  });
}

window.initMap = initMap;
