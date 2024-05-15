async function lerJson() {
  const fs = require('fs');

  // Leitura do arquivo JSON
  const jsonData = fs.readFileSync('./Atrativos Geral.json', 'utf8');
  // Parse do JSON para objeto JavaScript
  const data = JSON.parse(jsonData);
  await findLatLng(data.pontos);
  // Convertendo objeto JavaScript para JSON
  const newData = JSON.stringify(data, null, 2);

  // Escrita dos dados editados de volta para o arquivo JSON
  fs.writeFileSync('./Atrativos Geral.json', newData, 'utf8');

}
lerJson()

async function findLatLng(arrLocais) {
  try {
    const apikey = "AIzaSyAHhb1kPzpi0_AjG9zLW1_AQkZpi30PCqA";
    console.log("arrLocais: ", arrLocais.length);
    let i = 0;

    for (let local of arrLocais) {

      console.log(i++)

      const nomeDoLocal = `${local?.ponto || ''}, ${local?.cidade || ''}, ${local?.estado || 'Es'}, ${local?.pais || 'Brasil'}`;

      await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(nomeDoLocal)}&key=${apikey}`)
        .then(response => response.json())
        .then(data => {
          const location = data.results[0].geometry.location;
          local.latitude = location.lat;
          local.longitude = location.lng;
        })
        .catch(error => {
          console.error("Erro ao obter localização:", error);
          console.log("local: ", local, '\n')
        });
    }
    return arrLocais;
  } catch (error) {
    console.error("error: ", error)
  }
}

let marcadoresPiuma = [

  {
    "cidade": "Piúma ",
    "ponto": "Monte Aghá - Parapente ",
    "estado": "es",
    "latitude": -20.8382491,
    "longitude": -40.7230627
  },
  {
    "cidade": "Piúma ",
    "ponto": "Ilhas dos Cabritos ",
    "estado": "es",
    "latitude": -20.8382491,
    "longitude": -40.7230627
  },
  {
    "cidade": "Piúma ",
    "ponto": "Ilha do Gambá",
    "estado": "es",
    "latitude": -20.8382491,
    "longitude": -40.7230627
  },
  {
    "cidade": "Piúma ",
    "ponto": "Praias: Central | Maria Neném |Pau Grande ",
    "estado": "es",
    "latitude": -20.8382491,
    "longitude": -40.7230627
  },
  {
    "cidade": "Piúma ",
    "ponto": "Rio Novo ",
    "estado": "es",
    "latitude": -20.8382491,
    "longitude": -40.7230627
  },
  {
    "cidade": "Piúma ",
    "ponto": "Vale do Orobó ",
    "estado": "es",
    "latitude": -20.8382491,
    "longitude": -40.7230627
  }
];