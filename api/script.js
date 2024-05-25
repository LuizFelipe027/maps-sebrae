let marcadoresPontos = [];
let marcadoresFiltrados = [];

const apikey = "AIzaSyAHhb1kPzpi0_AjG9zLW1_AQkZpi30PCqA";
let map;
let service;

let dadosPlanilha;

function demarcarFronteiraBrasil() {
  const brasilBoundaryLayer = new google.maps.Data();
  const esBoundaryUrl = '../br_states.json';
  brasilBoundaryLayer.loadGeoJson(esBoundaryUrl);
  brasilBoundaryLayer.setStyle({
    fillColor: 'gray',
    fillOpacity: 0.6,
    strokeColor: 'gray',
    strokeWeight: 1
  });
  brasilBoundaryLayer.setMap(map);
}

function demarcarFronteiraES() {
  // // URL do arquivo GeoJSON do Espírito Santo
  const esBoundaryUrl = '../br_es.json';
  // Carrega e exibe os dados GeoJSON
  map.data.loadGeoJson(esBoundaryUrl);
  // Define o estilo para a fronteira
  map.data.setStyle({
    fillColor: 'blue',
    fillOpacity: 0,
    strokeColor: 'blue',
    strokeWeight: 1
  });
}

async function criarMarcadoresPersonalizados() {
  for (const local of dadosPlanilha) {
    if (local.ancora.toLowerCase() === 'sim') {
      let pathIconAncora = '../assets/google-maps.png';
      let iconPath = `../assets/icons-municipios/${removeCharacterAndSpace(local.cidade)}.png`;
      if (await fileExists(iconPath)) {
        pathIconAncora = iconPath;
      }

      local.icon = new google.maps.MarkerImage(
        pathIconAncora,
        new google.maps.Size(48, 48),
        new google.maps.Point(0, 0),
        new google.maps.Point(24, 48),
        new google.maps.Size(48, 48)
      );
    } else {
      local.icon = new google.maps.MarkerImage(
        '../assets/pin.png',
        new google.maps.Size(24, 32),
        new google.maps.Point(0, 0),
        new google.maps.Point(12, 32),
        new google.maps.Size(24, 32)
      );
    }
  }

}

function fileExists(url) {
  return new Promise((resolve, reject) => {
    var http = new XMLHttpRequest();
    http.open('HEAD', url, true);
    http.onload = function () {
      if (http.status == 200) {
        resolve(true);
      } else {
        resolve(false);
      }
    };
    http.onerror = function () {
      resolve(false);
    };
    http.send();
  });
}

function markAnchorPoints() {
  for (const local of dadosPlanilha) {
    if (local.ancora.toLowerCase() === 'sim') {

      const latLng = new google.maps.LatLng(local.latitude, local.longitude);
      const marcador = new google.maps.Marker({
        position: latLng,
        map: map,
        icon: local.icon,
      });

      marcador.addListener("click", () => {
        if (local.place_id) {
          getPlaceDetails(local);
        } else {
          displayCustomLocationInfo(local);
        }
      });

      local.marcador = marcador;
    }
  }
}

async function removeMarkers(zoomLevel) {
  for (const marker of marcadoresFiltrados) {
    marker.marcador.setMap(null);
  }
  marcadoresFiltrados = [];

  if (zoomLevel <= 7) {
    for (const local of dadosPlanilha) {
      if (local.ancora.toLowerCase() === 'sim') {

        local.marcador.setMap(null);
      }
    }
  }

  for (const local of dadosPlanilha) {
    if (local.marcador && (!local.ancora || local?.ancora.toLowerCase() !== 'sim')) {
      local.marcador.setMap(null);
    }
  }
}

function displayLocationInfo(place) {
  const tabContent = document.getElementById('tab-content');
  const tabs = document.getElementById('tabs');

  const photosHtml = place.photos
    ? place.photos.slice(0, 5).map(photo => `<img src="${photo.getUrl({ maxWidth: 200, maxHeight: 200 })}" alt="${place.name}" class="max-w-full h-auto mb-2 rounded-md">`).join('')
    : 'N/A';

  tabContent.innerHTML = `
      <div class="tab-pane active" id="info">
          <h3 class="text-base mb-2 text-gray-600"><b>Informações</b></h3>
          <p class="leading-relaxed mb-2"><b>Nome:</b> ${place.name}</p>
          <p class="leading-relaxed mb-2"><b>Endereço:</b> ${place.formatted_address}</p>
          <p class="leading-relaxed mb-2"><b>Telefone:</b> ${place.formatted_phone_number || 'N/A'}</p>
          <p class="leading-relaxed mb-2"><b>Rating:</b> ${place.rating || 'N/A'}</p>
          <p class="leading-relaxed mb-2"><b>Website:</b> ${place.website ? `<a href="${place.website}" target="_blank" class="text-blue-500 hover:underline">${place.website}</a>` : `<a href="${place.google_meu_negocio}" target="_blank" class="text-blue-500 hover:underline">${place.google_meu_negocio}</a>`}</p>
      </div>
      <div class="tab-pane" id="photos">
          <h3 class="text-base mb-2 text-gray-600">Fotos</h3>
          ${photosHtml}
      </div>
      <div class="tab-pane" id="reviews">
          <h3 class="text-base mb-2 text-gray-600">Avaliações</h3>
          ${place.reviews ? place.reviews.map(review => `<p class="leading-relaxed mb-2">${review.text}</p>`).join('') : 'N/A'}
      </div>
  `;

  tabs.innerHTML = `
      <button class="tab-button active bg-white border-none p-2 cursor-pointer rounded-t-md mr-2" onclick="changeTab('info')">Informações</button>
      <button class="tab-button bg-white border-none p-2 cursor-pointer rounded-t-md mr-2" onclick="changeTab('photos')">Fotos</button>
      <button class="tab-button bg-white border-none p-2 cursor-pointer rounded-t-md" onclick="changeTab('reviews')">Avaliações</button>
  `;
}

function displayCustomLocationInfo(place) {
  const tabContent = document.getElementById('tab-content');
  const tabs = document.getElementById('tabs');
  tabs.innerHTML = '';
  tabContent.innerHTML = `
      <div class="tab-pane active" id="info">
          <h3 class="text-base mb-2 text-gray-600"><b>Informações</b></h3>`;
  tabContent.innerHTML += place.ponto ? `<p class="leading-relaxed mb-2"><b>Nome:</b> ${place.ponto}</p>` : '';
  tabContent.innerHTML += place.cidade ? `<p class="leading-relaxed mb-2"><b>Cidade:</b> ${place.cidade}</p>` : '';
  tabContent.innerHTML += `<p class="leading-relaxed mb-2"><b>País:</b> ${place.pais}</p>
      </div>
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

function getPlaceDetails(local) {
  if (!local.place_id) {
    //console.error('Invalid placeId:', local.place_id);
    return;
  }

  const request = {
    placeId: local.place_id,
    fields: ['name', 'formatted_address', 'formatted_phone_number', 'rating', 'website', 'photos', 'reviews']
  };

  service.getDetails(request, (place, status) => {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      displayLocationInfo({ ...place, ...local });
    } else {
      //console.error('Place details request failed due to ' + status);
    }
  });
}

async function getPlaceId(latitude, longitude) {
  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apikey}`);
  const data = await response.json();

  if (data.status === 'OK') {
    const placeId = data.results[0].place_id;
    return placeId;
  } else {
    //console.error('Erro ao obter place_id:', data.error_message);
    return null;
  }
}

async function converterArrayParaObjeto(array) {
  const propriedades = array.shift();
  const arrMarcacoes = array.map(async (item) => {
    const objeto = {};
    propriedades.forEach(async (propriedade, index) => {
      propriedade = removeCharacterAndSpace(propriedade)
      if (index < item.length) {
        let valor = item[index];
        if (propriedade === 'latitude' || propriedade === 'longitude') {
          valor = parseFloat(valor.replace(',', '.'));
        }
        objeto[propriedade] = valor;
      }
    });

    if (objeto['ancora'] === 'sim' && objeto['google_meu_negocio'] && objeto['latitude'] && objeto['longitude'] && !objeto['place_id']) {
      const placeId = await getPlaceId(objeto['latitude'], objeto['longitude']);
      objeto['place_id'] = placeId;
    }

    return objeto;
  });
  return Promise.all(arrMarcacoes);
}

async function getDataFromSheet() {
  const sheetId = '1fAa7t3hpYsr9km0RCJhpCW2nlgarcEIWNs6j3ND6Jjo';
  const range = 'Pontos%20Turísticos!1:1000';

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${range}?key=${apikey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    const objeto = converterArrayParaObjeto(data.values);

    return objeto;
  } catch (error) {
    //console.error('Erro ao buscar dados da planilha:', error);
    return [];
  }
}

async function initMap() {
  getDataFromSheet().then(async values => {
    dadosPlanilha = values;
    montaArrayDeMunicipos();
    marcadoresPontos = values.filter(m => !m.ancora && !(dadosPlanilha.find(f => f.ancora.toLowerCase() === 'sim' && f.latitude === m.latitude && f.longitude === m.longitude)));

    let isSatellite = false;

    const latLng = new google.maps.LatLng(-20.322478, -40.338271);
    map = new google.maps.Map(document.getElementById("map"), {
      zoom: 10,
      center: latLng,
      styles: [
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [{ visibility: "off" }],
        },
        // {
        //   featureType: "landscape",
        //   stylers: [{ visibility: "off" }],
        // },
      ],
      mapTypeId: "roadmap",
      tilt: 45,
    });
    demarcarFronteiraBrasil()
    // demarcarFronteiraES()

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

    await criarMarcadoresPersonalizados()
    markAnchorPoints()

    // Define o nível de zoom inicial
    let previousZoomLevel = null;
    previousZoomLevel = map.getZoom();
    map.addListener('zoom_changed', function () {
      const municipioFiltrado = document.getElementById('municipios-select').value;
      if (municipioFiltrado === 'no_selected') {

        const currentZoomLevel = map.getZoom();
        // Verifica se o zoom mudou para um nível que requer atualização
        if ((previousZoomLevel <= 7 && currentZoomLevel > 7) ||
          (previousZoomLevel > 7 && previousZoomLevel <= 12 && (currentZoomLevel <= 7 || currentZoomLevel > 12)) ||
          (previousZoomLevel > 12 && currentZoomLevel <= 12)) {

          // Armazena o novo nível de zoom
          previousZoomLevel = currentZoomLevel;

          // Remove os marcadores existentes
          removeMarkers(currentZoomLevel);

          // Adiciona os novos marcadores conforme o nível de zoom
          if (currentZoomLevel <= 7) {
            const latLngES = new google.maps.LatLng(-20.3155, -40.3128);
            const marcadorES = new google.maps.Marker({
              position: latLngES,
              map: map,
              icon: new google.maps.MarkerImage(
                '../assets/google-maps.png',
                new google.maps.Size(48, 48),
                new google.maps.Point(0, 0),
                new google.maps.Point(24, 48),
                new google.maps.Size(48, 48)
              ),
            });

            marcadorES.addListener("click", () => {
              displayCustomLocationInfo({ ponto: 'Espírito Santo', pais: "Brasil" });
            });

          } else if (currentZoomLevel > 7 && currentZoomLevel <= 12) {
            for (const local of dadosPlanilha) {
              if (local.ancora.toLowerCase() === 'sim') {
                local.marcador.setMap(map);
              }
            }
          } else {
            for (const local of marcadoresPontos) {
              const latLng = new google.maps.LatLng(local.latitude, local.longitude);
              const marcador = new google.maps.Marker({
                position: latLng,
                map: map,
                icon: local.icon,
              });

              marcador.addListener("click", () => {
                displayCustomLocationInfo(local);
              });

              local.marcador = marcador;
            }
          }
        }
      }
    });
  });
}

// Adicionar os eventos para os selects
document.getElementById('atrativos-select').addEventListener('change', updateMapByAtrativos);
function updateMapByAtrativos() {

}

document.getElementById('municipios-select').addEventListener('change', updateMapByMunicipio);
function montaArrayDeMunicipos() {
  // document.addEventListener("DOMContentLoaded", function () {
  const municipiosUnicos = [...new Set(dadosPlanilha.map(m => m.cidade))];

  const selectElement = document.getElementById('municipios-select');
  municipiosUnicos.forEach(municipio => {
    const option = document.createElement('option');
    option.value = removeCharacterAndSpace(municipio);
    option.textContent = municipio;
    selectElement.appendChild(option);
  });
  // });
}
async function updateMapByMunicipio() {
  const municipioSelecionado = document.getElementById('municipios-select').value;
  if (municipioSelecionado === 'no_selected') {
    await removeMarkers(0);
    return markAnchorPoints();
  }

  await removeMarkers(0);
  marcadoresFiltrados = dadosPlanilha.filter(local => {
    return removeCharacterAndSpace(local.cidade) === municipioSelecionado;
  });

  for (const local of marcadoresFiltrados) {
    const latLng = new google.maps.LatLng(local.latitude, local.longitude);
    const marcador = new google.maps.Marker({
      position: latLng,
      map: map,
      icon: local.icon
    });

    marcador.addListener("click", () => {
      if (local.place_id) {
        getPlaceDetails(local);
      } else {
        displayCustomLocationInfo(local);
      }
    });

    local.marcador = marcador;
  }
}

document.getElementById('regioes-select').addEventListener('change', updateMapByCamada);
const dadosCorRegioes = [
  { regiao: 'caparao', cor: '#9D98CB' },
  { regiao: 'central', cor: '#FBBE12' },
  { regiao: 'metropolitana', cor: '#F3965A' },
  { regiao: 'norte', cor: '#00B9EE' },
  { regiao: 'serrana', cor: '#F198C0' },
  { regiao: 'sul', cor: '#C7D865' }
];
function updateMapByCamada() {
  map.data.forEach((feature) => {
    map.data.remove(feature);
  });

  const regiaoSelecionada = document.getElementById('regioes-select').value;
  if (regiaoSelecionada === 'no_selected') return

  const municipiosPorRegiao = buscaRegioes(regiaoSelecionada);
  if (municipiosPorRegiao) {
    fetch('../geojs-32-mun.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok ' + response.statusText);
        }
        // Retorna a Promise que resolve com o JSON do corpo da resposta
        return response.json();
      })
      .then(geoJsonMunicipios => {
        municipiosPorRegiao.forEach(municipio => {
          const municipioData = geoJsonMunicipios.features.find(
            (feature) => removeCharacterAndSpace(feature.properties.name) === municipio


          );
          if (municipioData) {
            map.data.addGeoJson(municipioData);
          }
        });
        const corRegiao = dadosCorRegioes.find(dado => dado.regiao === regiaoSelecionada).cor;
        map.data.setStyle({
          fillColor: corRegiao,
          fillOpacity: 0.5,
          strokeColor: corRegiao,
          strokeWeight: 2,
        });
      })
      .catch(error => {
        //console.error('Erro ao buscar os dados: ', error);
      });
  }
}

function buscaRegioes(regiao) {
  const resultado = {};
  dadosPlanilha.forEach(dado => {
    const regional = removeCharacterAndSpace(dado.regional);
    const cidade = removeCharacterAndSpace(dado.cidade);

    if (!resultado[regional]) {
      resultado[regional] = [cidade];
    } else if (!resultado[regional].includes(cidade)) {
      resultado[regional].push(cidade);
    }
  });

  return resultado[regiao] || [];
}

function removeCharacterAndSpace(str) {
  return str.replace(/\s/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

window.initMap = initMap;
