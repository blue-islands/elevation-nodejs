import * as http from 'http';
import * as https from 'https';
import * as querystring from 'querystring';

const NO_DATA = -500;
const BASE_URL = 'https://cyberjapandata.gsi.go.jp/xyz';
const SERVER_PORT = 8081;
const R = 128 / Math.PI;

async function getElevation(worldCoordX: number, worldCoordY: number, zoom: number, demSource: string, dataRound: number): Promise<number | string> {
    const PixelX = worldCoordX * Math.pow(2, zoom);
    const TileX = Math.floor(PixelX / 256);
    const PixelY = worldCoordY * Math.pow(2, zoom);
    const TileY = Math.floor(PixelY / 256);
    const PixelXint = Math.floor(PixelX);
    const px = PixelXint % 256;
    const PixelYint = Math.floor(PixelY);
    const py = PixelYint % 256;
    const sFileName = `${BASE_URL}/${demSource}/${zoom}/${TileX}/${TileY}.txt`;

    return new Promise<number | string>((resolve, reject) => {
        https.get(sFileName, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    return resolve(NO_DATA.toString());
                }
                data = data.replace(/\r\n|\r|\n/g, '\n');
                const asText = data.split('\n');
                if (asText.length <= py || asText[py].split(',')[px] === 'e') {
                    return resolve(NO_DATA.toString());
                }
                const elevation = parseFloat(asText[py].split(',')[px]).toFixed(dataRound);
                resolve(parseFloat(elevation) < -500 ? "-----" : elevation);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

function calculateWorldCoords(lon: number, lat: number): [number, number] {
    const lng_rad = lon * (Math.PI / 180);
    const lat_rad = lat * (Math.PI / 180);
    const worldCoordX = R * (lng_rad + Math.PI);
    const worldCoordY = (-1) * R / 2 * Math.log((1 + Math.sin(lat_rad)) / (1 - Math.sin(lat_rad))) + 128;
    return [worldCoordX, worldCoordY];
}

async function handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    try {
        const urlParams = querystring.parse(req.url!.split('?')[1] || '');
        const [worldCoordX, worldCoordY] = calculateWorldCoords(parseFloat(urlParams.lon as string), parseFloat(urlParams.lat as string));

        let hsrc = '5m（レーザ）';
        let elevation = await getElevation(worldCoordX, worldCoordY, 15, 'dem5a', 1);
        if (elevation === NO_DATA.toString()) {
            hsrc = '5m（写真測量）';
            elevation = await getElevation(worldCoordX, worldCoordY, 15, 'dem5b', 1);
        }
        if (elevation === NO_DATA.toString()) {
            hsrc = '10m';
            elevation = await getElevation(worldCoordX, worldCoordY, 14, 'dem', 0);
        }
        if (elevation === NO_DATA.toString()) {
            elevation = "-----";
            hsrc = "-----";
        }

        const sCallBack = urlParams.callback || '';
        let sBody = `{"elevation": ${isNaN(Number(elevation)) ? `"${elevation}"` : elevation}, "hsrc": "${hsrc}"}`;
        if (!urlParams.outtype) {
            sBody = `${sCallBack}( ${sBody} )`;
        }

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(sBody);
    } catch (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('サーバーエラー');
    }
}

http.createServer(handleRequest).listen(SERVER_PORT, () => {
    console.log(`サーバーがポート${SERVER_PORT}で稼働しています`);
});
