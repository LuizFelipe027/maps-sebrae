async function lerJson() {
  const fs = require('fs');
  const pathFileRead = "./br_states.json"
  const pathFileWrite = "./br_states.json"

  // Leitura do arquivo JSON
  const jsonData = fs.readFileSync(pathFileRead, 'utf8');
  // Parse do JSON para objeto JavaScript
  const data = JSON.parse(jsonData);
  // await findLatLng(data.pontos);
  // Convertendo objeto JavaScript para JSON
  const newData = JSON.stringify(data, null, 2);

  // Escrita dos dados editados de volta para o arquivo JSON
  fs.writeFileSync(pathFileWrite, newData, 'utf8');

}
// lerJson()

async function findLatLng(arrLocais) {
  try {
    const apikey = "AIzaSyDE8EhxgBC6_4Z64dTV7bZ-z6CY09KJ5DI";
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

function ordenarPorLocal(array) {

  console.log("array: ", array[0])

  return array.sort((a, b) => {
    const localA = a.ponto.toLowerCase();
    const localB = b.ponto.toLowerCase();
    if (localA < localB) {
      return -1;
    }
    if (localA > localB) {
      return 1;
    }
    return 0;
  });
}

async function renomearArquivos() {
  const fs = require('fs');
  const path = require('path');

  const directoryPath = './assets/icons-municipios'; // Substitua pelo caminho da sua pasta

  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      return console.log('Não foi possível listar os arquivos:', err);
    }

    files.forEach((file, index) => {
      const oldPath = path.join(directoryPath, file);
      const newPath = path.join(directoryPath, removeCharacterAndSpace(file));
      fs.rename(oldPath, newPath, (err) => {
        if (err) {
          console.log('Erro ao renomear arquivo:', err);
        } else {
          console.log(`Arquivo ${file} renomeado para ${newPath}`);
        }
      });
    });
  });
}
renomearArquivos()

function removeCharacterAndSpace(str) {
  return str?.replace(/\s/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}