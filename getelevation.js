"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var https = require("https");
var querystring = require("querystring");
var nCONST_NO_DATA = -500;
function getElevation(worldCoordX, worldCoordY, zoom, demSource, dataRound) {
    var PixelX = worldCoordX * Math.pow(2, zoom);
    var TileX = Math.floor(PixelX / 256);
    var PixelY = worldCoordY * Math.pow(2, zoom);
    var TileY = Math.floor(PixelY / 256);
    var PixelXint = Math.floor(PixelX);
    var px = PixelXint % 256;
    var PixelYint = Math.floor(PixelY);
    var py = PixelYint % 256;
    var sFileName = "https://cyberjapandata.gsi.go.jp/xyz/".concat(demSource, "/").concat(zoom, "/").concat(TileX, "/").concat(TileY, ".txt");
    return new Promise(function (resolve, reject) {
        https.get(sFileName, function (res) {
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                if (res.statusCode === 200) {
                    data = data.replace(/\r\n|\r|\n/g, '\n');
                    var asText = data.split('\n');
                    if (asText.length <= py) {
                        resolve(nCONST_NO_DATA.toString());
                    }
                    else {
                        var Lpy = asText[py];
                        var pxs = Lpy.split(',');
                        if (pxs.length <= px) {
                            resolve(nCONST_NO_DATA.toString());
                        }
                        else {
                            var Spx = pxs[px];
                            if (Spx === 'e') {
                                resolve(nCONST_NO_DATA.toString());
                            }
                            else {
                                Spx = parseFloat(Spx).toFixed(dataRound);
                                if (parseFloat(Spx) < -500) {
                                    resolve("-----");
                                }
                                else {
                                    resolve(Spx);
                                }
                            }
                        }
                    }
                }
                else {
                    resolve(nCONST_NO_DATA.toString());
                }
            });
        }).on('error', function (err) {
            reject(err);
        });
    });
}
http.createServer(function (req, res) {
    var urlParams = querystring.parse(req.url.split('?')[1] || '');
    var sCallBack = urlParams.callback || '';
    var lon = parseFloat(urlParams.lon);
    var lat = parseFloat(urlParams.lat);
    var lng_rad = lon * (Math.PI / 180);
    var lat_rad = lat * (Math.PI / 180);
    var R = 128 / Math.PI;
    var worldCoordX = R * (lng_rad + Math.PI);
    var worldCoordY = (-1) * R / 2 * Math.log((1 + Math.sin(lat_rad)) / (1 - Math.sin(lat_rad))) + 128;
    var hsrc = '5m（レーザ）'; // hsrcを外部スコープで定義
    getElevation(worldCoordX, worldCoordY, 15, 'dem5a', 1).then(function (elevation) {
        if (elevation === nCONST_NO_DATA.toString()) {
            hsrc = '5m（写真測量）';
            return getElevation(worldCoordX, worldCoordY, 15, 'dem5b', 1);
        }
        return elevation;
    }).then(function (elevation) {
        if (elevation === nCONST_NO_DATA.toString()) {
            hsrc = '10m';
            return getElevation(worldCoordX, worldCoordY, 14, 'dem', 0);
        }
        return elevation;
    }).then(function (elevation) {
        if (elevation === nCONST_NO_DATA.toString()) {
            elevation = "-----";
            hsrc = "-----";
        }
        var sBody = '';
        if (elevation === "-----") {
            sBody = "{\"elevation\": \"".concat(elevation, "\", \"hsrc\": \"").concat(hsrc, "\"}");
        }
        else {
            sBody = "{\"elevation\": ".concat(elevation, ", \"hsrc\": \"").concat(hsrc, "\"}");
        }
        if (!urlParams.outtype) {
            sBody = "".concat(sCallBack, "( ").concat(sBody, " )");
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(sBody);
    }).catch(function (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    });
}).listen(8080, function () {
    console.log('Server is running on port 8080');
});
