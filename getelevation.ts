import * as http from 'http'; 
import * as https from 'https';
import * as querystring from 'querystring';

const nCONST_NO_DATA = -500;

function getElevation(worldCoordX: number, worldCoordY: number, zoom: number, demSource: string, dataRound: number): Promise<number | string> {
    const PixelX = worldCoordX * Math.pow(2, zoom);
    const TileX = Math.floor(PixelX / 256);
    const PixelY = worldCoordY * Math.pow(2, zoom);
    const TileY = Math.floor(PixelY / 256);
    const PixelXint = Math.floor(PixelX);
    const px = PixelXint % 256;
    const PixelYint = Math.floor(PixelY);
    const py = PixelYint % 256;
    const sFileName = `https://cyberjapandata.gsi.go.jp/xyz/${demSource}/${zoom}/${TileX}/${TileY}.txt`;

    return new Promise<number | string>((resolve, reject) => {
        https.get(sFileName, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode === 200) {
                    data = data.replace(/\r\n|\r|\n/g, '\n');
                    const asText = data.split('\n');
                    if (asText.length <= py) {
                        resolve(nCONST_NO_DATA.toString());
                    } else {
                        const Lpy = asText[py];
                        const pxs = Lpy.split(',');
                        if (pxs.length <= px) {
                            resolve(nCONST_NO_DATA.toString());
                        } else {
                            let Spx = pxs[px];
                            if (Spx === 'e') {
                                resolve(nCONST_NO_DATA.toString());
                            } else {
                                Spx = parseFloat(Spx).toFixed(dataRound);
                                if (parseFloat(Spx) < -500) {
                                    resolve("-----");
                                } else {
                                    resolve(Spx);
                                }
                            }
                        }
                    }
                } else {
                    resolve(nCONST_NO_DATA.toString());
                }
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

http.createServer((req, res) => {
  const urlParams = querystring.parse(req.url!.split('?')[1] || '');
  const sCallBack = urlParams.callback || '';
  const lon = parseFloat(urlParams.lon as string);
  const lat = parseFloat(urlParams.lat as string);
  const lng_rad = lon * (Math.PI / 180);
  const lat_rad = lat * (Math.PI / 180);
  const R = 128 / Math.PI;
  const worldCoordX = R * (lng_rad + Math.PI);
  const worldCoordY = (-1) * R / 2 * Math.log((1 + Math.sin(lat_rad)) / (1 - Math.sin(lat_rad))) + 128;

  let hsrc = '5m（レーザ）'; // hsrcを外部スコープで定義

  getElevation(worldCoordX, worldCoordY, 15, 'dem5a', 1).then(elevation => {
      if (elevation === nCONST_NO_DATA.toString()) {
          hsrc = '5m（写真測量）';
          return getElevation(worldCoordX, worldCoordY, 15, 'dem5b', 1);
      }
      return elevation;
  }).then(elevation => {
      if (elevation === nCONST_NO_DATA.toString()) {
          hsrc = '10m';
          return getElevation(worldCoordX, worldCoordY, 14, 'dem', 0);
      }
      return elevation;
  }).then(elevation => {
      if (elevation === nCONST_NO_DATA.toString()) {
          elevation = "-----";
          hsrc = "-----";
      }

      let sBody = '';
      if (elevation === "-----") {
          sBody = `{"elevation": "${elevation}", "hsrc": "${hsrc}"}`;
      } else {
          sBody = `{"elevation": ${elevation}, "hsrc": "${hsrc}"}`;
      }

      if (!urlParams.outtype) {
          sBody = `${sCallBack}( ${sBody} )`;
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(sBody);
  }).catch(error => {
      console.error(error);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
  });
}).listen(8081, () => {
  console.log('Server is running on port 8081');
});