let marcadoresPontos = [];
let marcadoresFiltrados = [];
let dadosPlanilha;

const apikey = "AIzaSyDE8EhxgBC6_4Z64dTV7bZ-z6CY09KJ5DI";
let map;
let service;

let filtrosUtilizados = {
  regional: false,
  municipio: false,
  atrativo: false
};

let filtrosControlDiv = null;

let regionaisSelect = null;
let regionaisControlDiv = null;

let municipiosSelect = null;
let municipiosControlDiv = null;

let atrativosSelect = null;
let atrativosControlDiv = null;

let marcadorES = null;
// Função para criar o marcador do Espírito Santo
function criarMarcadorES() {
  const latLngES = new google.maps.LatLng(-20.3155, -40.3128);
  marcadorES = new google.maps.Marker({
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
}

// Função para remover o marcador do Espírito Santo
function removerMarcadorES() {
  if (marcadorES) {
    marcadorES.setMap(null);
    marcadorES = null;
  }
}

function demarcarFronteiraBrasil() {
  const brasilBoundaryLayer = new google.maps.Data();
  const esBoundaryUrl = '../br_states.json';
  brasilBoundaryLayer.loadGeoJson(esBoundaryUrl);
  brasilBoundaryLayer.setStyle({
    fillColor: '#E9E9E9',
    fillOpacity: 0.8,
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
    fillColor: '#D7F0FF',
    fillOpacity: 0.7,
    strokeColor: 'blue',
    strokeWeight: 1
  });
}

function getIconSize(zoomLevel) {
  const maxIconSize = 48;
  return maxIconSize + (zoomLevel * 4);
  const minIconSize = 24; // Metade do tamanho máximo
  if (zoomLevel <= 10) {
    return minIconSize;
  } else {
    // const scale = (zoomLevel - 7) / (14 - 7); // Ajuste os valores de zoom conforme necessário
    // const iconSize = maxIconSize - ((maxIconSize - minIconSize) * scale);
    // return Math.max(minIconSize, Math.min(maxIconSize, iconSize));
    return maxIconSize + (zoomLevel * 4);
  }


}

async function criarMarcadoresPersonalizados() {
  const currentZoomLevel = map.getZoom();
  for (const local of dadosPlanilha) {
    if (local.ancora.toLowerCase() === 'sim') {
      let pathIconAncora = '../assets/google-maps.png';
      let iconPath = `../assets/icons-municipios/${removeCharacterAndSpace(local.pathicon)}`;
      if (await fileExists(iconPath)) {
        pathIconAncora = iconPath;
      }

      const iconSize = getIconSize(currentZoomLevel);
      local.icon = new google.maps.MarkerImage(
        pathIconAncora,
        new google.maps.Size(iconSize, iconSize),
        new google.maps.Point(0, 0),
        new google.maps.Point(iconSize / 2, iconSize),
        new google.maps.Size(iconSize, iconSize)
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

function markPoinstFiltered(regionaisSelecionadas) {
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
    marker?.marcador.setMap(null);
  }
  marcadoresFiltrados = [];

  if (zoomLevel <= 7) {
    for (const local of dadosPlanilha) {
      if (local.ancora.toLowerCase() === 'sim') {
        local.marcador.setMap(null);
      }
    }
  } else {
    removerMarcadorES(); // Remover o marcador do Espírito Santo
  }

  for (const local of dadosPlanilha) {
    if (local.marcador && (!local.ancora || local?.ancora.toLowerCase() !== 'sim')) {
      local.marcador.setMap(null);
    }
  }
}

function displayLocationInfo(place) {
  const locationImage = document.getElementById('location-image');
  const locationTitle = document.getElementById('location-title');
  const locationRating = document.getElementById('location-rating');
  const tabContent = document.getElementById('tab-content');

  // Configurar imagem, título e classificação
  locationImage.src = place.photos ? place.photos[0].getUrl({ maxWidth: 800, maxHeight: 600 }) : 'default_image_url';
  locationTitle.textContent = place.name;
  locationRating.innerHTML = `${place.rating || 'N/A'} <i class="fas fa-star text-yellow-400"></i> (${place.user_ratings_total || 0})`;

  // Conteúdo das abas
  const infoContent = `
      <h3 class="text-base mb-2 text-gray-600"><b>Informações</b></h3>
      <div class="flex items-center mb-4">
        <i class="fas fa-map-marker-alt text-blue-500 mr-2"></i> 
        <p class="leading-relaxed mb-2"><b class="text-blue-500">Endereço:</b> ${place.formatted_address}</p>
      </div>
      <div class="flex items-center mb-4">
        <i class="fas fa-phone text-blue-500 mr-2"></i> 
        <p class="leading-relaxed mb-2"><b class="text-blue-500">Telefone:</b> ${place.formatted_phone_number || 'N/A'}</p>
      </div>
      <div class="flex items-center mb-4">
        <i class="fas fa-star text-blue-500 mr-2"></i> 
        <p class="leading-relaxed mb-2"><b class="text-blue-500">Rating:</b> ${place.rating || 'N/A'}</p>
      </div>
      <div class="flex items-center mb-4">
        <i class="fas fa-globe text-blue-500 mr-2"></i> 
        <p class="leading-relaxed mb-2"><b class="text-blue-500">Website:</b> ${place.website ? `<a href="${place.website}" target="_blank" class="text-blue-500 hover:underline">${place.website}</a>` : 'N/A'}</p>
      </div>
  `;

  const pricesContent = `
      <h3 class="text-base mb-2 text-gray-600">Preços</h3>
      <!-- Adicionar conteúdo relacionado aos preços aqui -->
  `;

  const reviewsContent = `
      <h3 class="text-base mb-2 text-gray-600">Avaliações</h3>
      ${place.reviews ? place.reviews.map(review => `<p class="leading-relaxed mb-2">${review.text}</p>`).join('') : 'N/A'}
  `;

  const aboutContent = `
      <h3 class="text-base mb-2 text-gray-600">Sobre</h3>
      <!-- Adicionar conteúdo relacionado ao sobre aqui -->
  `;

  // Inicialmente, exibir o conteúdo da aba "Visão geral"
  tabContent.innerHTML = infoContent;

  // Lógica para alternar entre as abas
  window.changeTab = function (tab) {
    document.querySelectorAll('.tab-button').forEach(button => button.classList.remove('active'));

    if (tab === 'info') {
      tabContent.innerHTML = infoContent;
    } else if (tab === 'precos') {
      tabContent.innerHTML = pricesContent;
    } else if (tab === 'reviews') {
      tabContent.innerHTML = reviewsContent;
    } else if (tab === 'sobre') {
      tabContent.innerHTML = aboutContent;
    }

    document.querySelector(`.tab-button[onclick="changeTab('${tab}')"]`).classList.add('active');
  }
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


    marcadoresPontos = values.filter(m => !m.ancora && !(dadosPlanilha.find(f => f.ancora.toLowerCase() === 'sim' && f.latitude === m.latitude && f.longitude === m.longitude)));

    let isSatellite = false;

    const latLng = new google.maps.LatLng(-19.663280, -40.519634);
    map = new google.maps.Map(document.getElementById("map"), {
      zoom: 8,
      center: latLng,
      styles: [
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [{ color: "#6590CE" }],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [{ color: "#6CA4F4" }],
        },
        {
          featureType: "landscape.natural",
          elementType: "geometry",
          stylers: [{ color: "#B2D7B7" }],
        },
        {
          featureType: "landscape.man_made",
          elementType: "geometry",
          stylers: [{ color: "#FCEFC8" }],
        },
        {
          featureType: "landscape",
          elementType: "geometry",
          stylers: [{ color: "#D7F0FF" }],
        },
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
    await createFiltersInMap();
    // montaArrayDeMunicipos();
    // demarcarFronteiraES()

    service = new google.maps.places.PlacesService(map);

    // map.addListener("zoom_changed", function () {
    //   var zoomLevel = map.getZoom();
    //   if (zoomLevel >= 17 && !isSatellite) {
    //     map.setMapTypeId("satellite");
    //     isSatellite = true;
    //   } else if (zoomLevel < 17 && isSatellite) {
    //     map.setMapTypeId("roadmap");
    //     isSatellite = false;
    //   }
    // });

    await criarMarcadoresPersonalizados()
    markAnchorPoints()

    // Define o nível de zoom inicial
    let previousZoomLevel = null;
    previousZoomLevel = map.getZoom();
    map.addListener('zoom_changed', function () {

      const checkboxesMunicipios = municipiosControlDiv.querySelectorAll('#municipios-filter input[type="checkbox"]');
      const municipiosSelecionados = Array.from(checkboxesMunicipios)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

      const checkboxesAtrativos = atrativosControlDiv.querySelectorAll('#atrativos-filter input[type="checkbox"]');
      const atrativosSelecionados = Array.from(checkboxesAtrativos)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);

      const checkboxesRegionais = regionaisControlDiv.querySelectorAll('#regionais-filter input[type="checkbox"]');
      const regionaisSelecionados = Array.from(checkboxesRegionais)
        .filter(checkbox => checkbox.checked)
        .map(checkbox => checkbox.value);


      const currentZoomLevel = map.getZoom();
      if (municipiosSelecionados.length === 0 && atrativosSelecionados.length === 0 && regionaisSelecionados.length === 0) {
        // Verifica se o zoom mudou para um nível que requer atualização
        // if ((previousZoomLevel <= 7 && currentZoomLevel > 7) ||
        //     (previousZoomLevel > 7 && previousZoomLevel <= 12 && (currentZoomLevel <= 7 || currentZoomLevel > 12)) ||
        //     (previousZoomLevel > 12 && currentZoomLevel <= 12)) {

        // Armazena o novo nível de zoom
        previousZoomLevel = currentZoomLevel;

        // Remove os marcadores existentes
        removeMarkers(currentZoomLevel);

        // Adiciona os novos marcadores conforme o nível de zoom
        // if (currentZoomLevel <= 7) {
        // criarMarcadorES(); // Adicionar o marcador do Espírito Santo
        // } else
        if (currentZoomLevel <= 12) {
          for (const local of dadosPlanilha) {
            if (local.ancora.toLowerCase() === 'sim') {
              const iconSize = getIconSize(currentZoomLevel);
              local.marcador.setMap(map);
              local.marcador.setIcon(new google.maps.MarkerImage(
                local.icon.url,
                new google.maps.Size(iconSize, iconSize),
                new google.maps.Point(0, 0),
                new google.maps.Point(iconSize / 2, iconSize - 24),
                new google.maps.Size(iconSize, iconSize)
              ));
            }
          }
        } else {
          for (const local of dadosPlanilha) {
            if (local.ancora.toLowerCase() === 'sim') {
              const iconSize = getIconSize(currentZoomLevel);
              local.marcador.setMap(map);
              local.marcador.setIcon(new google.maps.MarkerImage(
                local.icon.url,
                new google.maps.Size(iconSize, iconSize),
                new google.maps.Point(0, 0),
                new google.maps.Point(iconSize / 2, iconSize - 24),
                new google.maps.Size(iconSize, iconSize)
              ));
            }
          }

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
        // }
      }
    });

    //gambiarra de amostragem
    const checkboxesAtrativos = atrativosControlDiv.querySelectorAll('#atrativos-filter input[type="checkbox"]');
    checkboxesAtrativos[6].checked = true;
    updateMapByAtrativos();
  });
}

function createFilterRegional() {
  regionaisControlDiv = document.createElement('div');
  regionaisControlDiv.id = 'regionais-filter';
  regionaisControlDiv.classList.add('filter-icon', 'closed', 'max-h-11'); // Adiciona a classe 'closed'
  regionaisControlDiv.innerHTML = `
    <label for="regionais" class="block text-sm font-medium text-gray-700 cursor-pointer">
    <img src="../assets/brasil.png" alt="Ícone de Regional" class="inline-block mr-2 w-4 h-4"> Regional <i class="fa-solid fa-caret-down"></i>
    </label>
    <div class="mt-1 options-container"></div>
  `;

  filtrosControlDiv.appendChild(regionaisControlDiv);

  const regionaisContainer = regionaisControlDiv.querySelector('.options-container'); // Seleciona o container das opções
  const regionais = ["caparao", "central", "metropolitana", "norte", "serrana", "sul"];

  regionais.forEach(regional => {
    const checkboxLabel = document.createElement('label');
    checkboxLabel.classList.add('block', 'text-sm', 'font-medium', 'text-gray-700');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = regional;
    checkbox.value = regional;
    checkbox.addEventListener('change', updateMapByRegional);

    checkboxLabel.appendChild(checkbox);
    checkboxLabel.appendChild(document.createTextNode(regional));
    regionaisContainer.appendChild(checkboxLabel);
  });

  const label = regionaisControlDiv.querySelector('label');
  label.addEventListener('click', () => {
    regionaisControlDiv.classList.toggle('closed');
    regionaisControlDiv.classList.toggle('max-h-11');
    if (regionaisControlDiv.classList.contains('max-h-40')) {
      regionaisControlDiv.classList.toggle('max-h-40');
    } else {
      regionaisControlDiv.classList.add('max-h-40');
    }
  });
}

// Função para criar o filtro de municípios
function createFilterMunicipio() {
  municipiosControlDiv = document.createElement('div');
  municipiosControlDiv.id = 'municipios-filter';
  municipiosControlDiv.classList.add('filter-icon', 'closed', 'max-h-11'); // Adiciona a classe 'closed'
  municipiosControlDiv.innerHTML = `
      <label for="municipios" class="block text-sm font-medium text-gray-700 cursor-pointer">
        <img src="../assets/mapa.png" alt="Ícone de Regional" class="inline-block mr-2 w-4 h-4"> Município <i class="fa-solid fa-caret-down"></i>
      </label>
      <div class="mt-1 options-container max-h-40 overflow-y-auto"></div>
    `;

  filtrosControlDiv.appendChild(municipiosControlDiv);

  montaArrayDeMunicipos();

  const label = municipiosControlDiv.querySelector('label');
  label.addEventListener('click', () => {
    municipiosControlDiv.classList.toggle('closed');
    municipiosControlDiv.classList.toggle('max-h-11');
  });
}

function createFilterAtrativos() {
  atrativosControlDiv = document.createElement('div');
  atrativosControlDiv.id = 'atrativos-filter';
  atrativosControlDiv.classList.add('filter-icon'); // Adiciona a classe 'closed' inicialmente ('closed', 'max-h-11')
  atrativosControlDiv.innerHTML = `
    <label for="atrativos" class="block text-sm font-medium text-gray-700 cursor-pointer">
    <img src="../assets/sinal-de-direcao.png" alt="Ícone de Atrativo" class="inline-block mr-2 w-4 h-4"> Atrativo <i class="fa-solid fa-caret-down"></i>
    </label>
    <div class="mt-1 options-container max-h-40 overflow-y-auto"></div>
  `;

  filtrosControlDiv.appendChild(atrativosControlDiv);

  const atrativosContainer = atrativosControlDiv.querySelector('.options-container');
  const atrativos = [...new Set(dadosPlanilha.map(m => m.segmento))];

  atrativos.forEach(atrativo => {
    if (atrativo) {
      const checkboxLabel = document.createElement('label');
      checkboxLabel.classList.add('block', 'text-sm', 'font-medium', 'text-gray-700');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = atrativo;
      checkbox.value = atrativo;
      checkbox.addEventListener('change', updateMapByAtrativos);

      checkboxLabel.appendChild(checkbox);
      checkboxLabel.appendChild(document.createTextNode(atrativo));
      atrativosContainer.appendChild(checkboxLabel);
    }
  });

  const label = atrativosControlDiv.querySelector('label');
  label.addEventListener('click', () => {
    atrativosControlDiv.classList.toggle('closed');
    atrativosControlDiv.classList.toggle('max-h-11');
    // atrativosControlDiv.classList.add('max-h-56');
  });
}

async function createFiltersInMap() {
  filtrosControlDiv = document.createElement('div');
  filtrosControlDiv.classList.add('justify-around', 'row', 'flex');
  filtrosControlDiv.id = 'filtros-control';

  // Cria os filtros dentro do container de filtros
  createFilterRegional();
  createFilterMunicipio();
  createFilterAtrativos();

  // Adiciona o container de filtros ao mapa
  map.controls[google.maps.ControlPosition.TOP_CENTER].push(filtrosControlDiv);
}


////////////////////////////// TRATAMENTO SEGMENTOS //////////////////////////////

async function updateMapByAtrativos() {
  const checkboxes = atrativosControlDiv.querySelectorAll('#atrativos-filter input[type="checkbox"]');
  const atrativosSelecionadas = Array.from(checkboxes)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value);

  if (atrativosSelecionadas.length === 0) {
    await removeMarkers(0);
    return markAnchorPoints();
  }

  await removeMarkers(0);
  for (const local of dadosPlanilha) {
    for (const atrativo of atrativosSelecionadas) {
      if (removeCharacterAndSpace(local.segmento) === removeCharacterAndSpace(atrativo)) {
        marcadoresFiltrados.push(local);
      }
    }
  }
  markPoinstFiltered(); //marcadoresFiltrados já é de escopo global
}


////////////////////////////// TRATAMENTO MUNICIPIO //////////////////////////////

// Função para montar o array de municípios baseados nas regiões selecionadas
function montaArrayDeMunicipos(regionaisSelecionadas) {
  let municipiosUnicos = [...new Set(dadosPlanilha.map(m => m.cidade))];

  if (regionaisSelecionadas && regionaisSelecionadas.length) {
    const municipiosPorRegional = new Set();
    for (const regional of regionaisSelecionadas) {
      for (const local of dadosPlanilha) {
        if (removeCharacterAndSpace(local.regional) === regional) {
          municipiosPorRegional.add(local.cidade);
        }
      }
    }
    municipiosUnicos = [...municipiosPorRegional];
  }

  const municipiosContainer = municipiosControlDiv.querySelector('.options-container');
  // Limpar checkboxes existentes
  while (municipiosContainer.firstChild) {
    municipiosContainer.removeChild(municipiosContainer.firstChild);
  }

  // Adicionar novos checkboxes
  municipiosUnicos.forEach(municipio => {
    if (municipio) {
      const checkboxLabel = document.createElement('label');
      checkboxLabel.classList.add('block', 'text-sm', 'font-medium', 'text-gray-700');

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = removeCharacterAndSpace(municipio);
      checkbox.value = municipio;
      checkbox.addEventListener('change', updateMapByMunicipio);

      checkboxLabel.appendChild(checkbox);
      checkboxLabel.appendChild(document.createTextNode(municipio));
      municipiosContainer.appendChild(checkboxLabel);
    }
  });
}

async function updateMapByMunicipio() {

  const checkboxes = municipiosControlDiv.querySelectorAll('#municipios-filter input[type="checkbox"]');
  const municipiosSelecionados = Array.from(checkboxes)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value);

  let algumFiltroAtivo = false;

  for (let key in filtrosUtilizados) {
    if (filtrosUtilizados[key] === true) {
      algumFiltroAtivo = true;
      break;
    }
  }

  if (municipiosSelecionados.length === 0 && !algumFiltroAtivo) {
    await removeMarkers(0);
    return markAnchorPoints();
  } else {

    await removeMarkers(0);
    for (const local of dadosPlanilha) {
      for (const municipio of municipiosSelecionados) {
        if (removeCharacterAndSpace(local.cidade) === removeCharacterAndSpace(municipio)) {
          marcadoresFiltrados.push(local);
        }
      }
    }
    markPoinstFiltered(); //marcadoresFiltrados já é de escopo global
  }
}


////////////////////////////// TRATAMENTO REGIAO //////////////////////////////
const dadosCorRegioes = [
  { regional: 'caparao', cor: '#9D98CB' },
  { regional: 'central', cor: '#FBBE12' },
  { regional: 'metropolitana', cor: '#F3965A' },
  { regional: 'norte', cor: '#00B9EE' },
  { regional: 'serrana', cor: '#F198C0' },
  { regional: 'sul', cor: '#64972F' }
];
let demarcacoesAtuais = [];
function removerDemarcacoesAtuais() {
  demarcacoesAtuais.forEach(demarcacao => demarcacao.setMap(null));
  demarcacoesAtuais = [];
}

async function updateMapByRegional() {
  filtrosUtilizados.regional = true;
  const zoomLevel = map.getZoom();
  // Remove demarcações atuais
  removerDemarcacoesAtuais();

  const checkboxes = regionaisControlDiv.querySelectorAll('#regionais-filter input[type="checkbox"]');
  const regionaisSelecionadas = Array.from(checkboxes)
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value);

  if (regionaisSelecionadas.length === 0) {
    filtrosUtilizados.regional = false;
    await removeMarkers(0);
    markAnchorPoints();
    if (zoomLevel > 12) {

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

    return montaArrayDeMunicipos();
  } else {


    console.log("zoomLevel: ", zoomLevel)

    let arrCondicionalApoio = dadosPlanilha;
    if (zoomLevel <= 12) {
      arrCondicionalApoio = dadosPlanilha.filter(f => f.ancora.toLowerCase() === 'sim')
    }
    await removeMarkers(0);
    for (const regional of regionaisSelecionadas) {
      for (const local of arrCondicionalApoio) {
        if (removeCharacterAndSpace(local.regional) === regional) {
          marcadoresFiltrados.push(local);
        }
      }
    }
    markPoinstFiltered();

    montaArrayDeMunicipos(regionaisSelecionadas); // Passa um array de regiões selecionadas
    const municipiosPorRegional = buscaRegioes(regionaisSelecionadas);

    if (municipiosPorRegional) {
      fetch('../geojs-32-mun.json')
        .then(response => {
          if (!response.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
          }
          return response.json();
        })
        .then(async geoJsonMunicipios => {
          try {
            for (let i = 0; i < regionaisSelecionadas.length; i++) {
              const demarcacaoPorRegional = new google.maps.Data();
              municipiosPorRegional[regionaisSelecionadas[i]].forEach(municipio => {
                const municipioData = geoJsonMunicipios.features.find(
                  (feature) => removeCharacterAndSpace(feature.properties.name) === municipio
                );
                if (municipioData) {
                  demarcacaoPorRegional.addGeoJson(municipioData);
                }
              });

              const corRegional = dadosCorRegioes.find(dado => dado.regional === regionaisSelecionadas[i]).cor;
              demarcacaoPorRegional.setStyle({
                fillColor: corRegional,
                fillOpacity: 0.3,
                strokeColor: corRegional,
                strokeWeight: 1,
              });

              demarcacaoPorRegional.setMap(map);
              demarcacoesAtuais.push(demarcacaoPorRegional); // Adiciona a demarcação atual ao array
            }
          } catch (error) {
            console.log("error: ", error);
          }
        })
        .catch(error => {
          console.error('Erro ao buscar os dados: ', error);
        });

      // map.setZoom(8);
    }
  }
}

function buscaRegioes() {
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
  return resultado;

  // const setCidades = new Set();
  // for (const regional of regionais) {
  //   for (const local of dadosPlanilha) {
  //     if (removeCharacterAndSpace(local.regional) === regional) {
  //       setCidades.add(removeCharacterAndSpace(local.cidade));
  //     }
  //   }
  // }
  // return Array.from(setCidades)
}

function removeCharacterAndSpace(str) {
  return str?.replace(/\s/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

window.initMap = initMap;
