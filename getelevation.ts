import * as http from 'http';
import * as querystring from 'querystring';

const nCONST_NO_DATA = -500;

function getElevation(worldCoordX: number, worldCoordY: number, zoom: number, demSource: string, dataRound: number): Promise<number | null> {
  const R = 128 / Math.PI;
  const lng_rad = worldCoordX / R - Math.PI;
  const lat_rad = 2 * (Math.atan(Math.exp(worldCoordY / R)) - Math.PI / 4);
  const PixelX = worldCoordX * Math.pow(2, zoom);
  const TileX = Math.floor(PixelX / 256);
  const PixelY = worldCoordY * Math.pow(2, zoom);
  const TileY = Math.floor(PixelY / 256);
  const PixelXint = Math.floor(PixelX);
  const px = PixelXint % 256;
  const PixelYint = Math.floor(PixelY);
  const py = PixelYint % 256;
  const sFileName = `http://cyberjapandata.gsi.go.jp/xyz/${demSource}/${zoom}/${TileX}/${TileY}.txt`;

  return new Promise<number | null>((resolve, reject) => {
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain',
      },
    };

    const req = http.request(sFileName, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          data = data.replace(/\r\n|\r|\n/g, '\n');
          const asText = data.split('\n');
          if (asText.length < py) {
            resolve(nCONST_NO_DATA);
          } else {
            const Lpy = asText[py];
            const pxs = Lpy.split(',');
            if (pxs.length < px) {
              resolve(nCONST_NO_DATA);
            } else {
              let Spx = pxs[px];
              if (Spx === 'e') {
                resolve(nCONST_NO_DATA);
              } else {
                Spx = parseFloat(Spx);
                Spx = Math.round(Spx, dataRound);
                if (Spx < -500) {
                  resolve(null); // Return null instead of nCONST_NO_DATA for invalid values
                } else {
                  resolve(Spx);
                }
              }
            }
          }
        } else if (res.statusCode === 404) {
          resolve(nCONST_NO_DATA);
        } else {
          resolve(nCONST_NO_DATA);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

http.createServer((req, res) => {
  const urlParams = querystring.parse(req.url!.split('?')[1] || '');
  const sCallBack = urlParams.callback as string || '';
  const lon = parseFloat(urlParams.lon as string);
  const lat = parseFloat(urlParams.lat as string);

  const R = 128 / Math.PI;
  const worldCoordX = R * (lon / 180 * Math.PI + Math.PI);
  const worldCoordY = (-1) * (R / 2) * Math.log((1 + Math.sin(lat / 180 * Math.PI)) / (1 - Math.sin(lat / 180 * Math.PI))) + 128;

  async function fetchElevation() {
    let elevation: number | null = await getElevation(worldCoordX, worldCoordY, 15, 'dem5a', 1);
    let hsrc = '5m（レーザ）';

    if (elevation === nCONST_NO_DATA) {
      elevation = await getElevation(worldCoordX, worldCoordY, 15, 'dem5b', 1);
      hsrc = '5m（写真測量）';
    }

    if (elevation === nCONST_NO_DATA) {
      elevation = await getElevation(worldCoordX, worldCoordY, 14, 'dem', 0);
      hsrc = '10m';
    }

    if (elevation === nCONST_NO_DATA) {
      elevation = null; // Set elevation to null for '-----'
      hsrc = '-----';
    }

    let sBody = '';
    if (elevation === null) {
      sBody = `{"elevation": null, "hsrc": "${hsrc}"}`;
    } else {
      sBody = `{"elevation": ${elevation}, "hsrc": "${hsrc}"}`;
    }

    if (!urlParams.outtype) {
      sBody = `${sCallBack}( ${sBody} )`;
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(sBody);
  }

  fetchElevation().catch((error) => {
    console.error(error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal Server Error');
  });
}).listen(8080, () => {
  console.log('Server is running on port 8080');
});
