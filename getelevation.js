"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var http = require("http");
var querystring = require("querystring");
var nCONST_NO_DATA = -500;
function getElevation(worldCoordX, worldCoordY, zoom, demSource, dataRound) {
    var R = 128 / Math.PI;
    var lng_rad = worldCoordX / R - Math.PI;
    var lat_rad = 2 * (Math.atan(Math.exp(worldCoordY / R)) - Math.PI / 4);
    var PixelX = worldCoordX * Math.pow(2, zoom);
    var TileX = Math.floor(PixelX / 256);
    var PixelY = worldCoordY * Math.pow(2, zoom);
    var TileY = Math.floor(PixelY / 256);
    var PixelXint = Math.floor(PixelX);
    var px = PixelXint % 256;
    var PixelYint = Math.floor(PixelY);
    var py = PixelYint % 256;
    var sFileName = "http://cyberjapandata.gsi.go.jp/xyz/".concat(demSource, "/").concat(zoom, "/").concat(TileX, "/").concat(TileY, ".txt");
    return new Promise(function (resolve, reject) {
        var options = {
            method: 'GET',
            headers: {
                'Content-Type': 'text/plain',
            },
        };
        var req = http.request(sFileName, options, function (res) {
            var data = '';
            res.on('data', function (chunk) {
                data += chunk;
            });
            res.on('end', function () {
                if (res.statusCode === 200) {
                    data = data.replace(/\r\n|\r|\n/g, '\n');
                    var asText = data.split('\n');
                    if (asText.length < py) {
                        resolve(nCONST_NO_DATA);
                    }
                    else {
                        var Lpy = asText[py];
                        var pxs = Lpy.split(',');
                        if (pxs.length < px) {
                            resolve(nCONST_NO_DATA);
                        }
                        else {
                            var Spx = pxs[px];
                            if (Spx === 'e') {
                                resolve(nCONST_NO_DATA);
                            }
                            else {
                                Spx = parseFloat(Spx);
                                Spx = Math.round(Spx, dataRound);
                                if (Spx < -500) {
                                    resolve(null); // Return null instead of nCONST_NO_DATA for invalid values
                                }
                                else {
                                    resolve(Spx);
                                }
                            }
                        }
                    }
                }
                else if (res.statusCode === 404) {
                    resolve(nCONST_NO_DATA);
                }
                else {
                    resolve(nCONST_NO_DATA);
                }
            });
        });
        req.on('error', function (error) {
            reject(error);
        });
        req.end();
    });
}
http.createServer(function (req, res) {
    var urlParams = querystring.parse(req.url.split('?')[1] || '');
    var sCallBack = urlParams.callback || '';
    var lon = parseFloat(urlParams.lon);
    var lat = parseFloat(urlParams.lat);
    var R = 128 / Math.PI;
    var worldCoordX = R * (lon / 180 * Math.PI + Math.PI);
    var worldCoordY = (-1) * (R / 2) * Math.log((1 + Math.sin(lat / 180 * Math.PI)) / (1 - Math.sin(lat / 180 * Math.PI))) + 128;
    function fetchElevation() {
        return __awaiter(this, void 0, void 0, function () {
            var elevation, hsrc, sBody;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, getElevation(worldCoordX, worldCoordY, 15, 'dem5a', 1)];
                    case 1:
                        elevation = _a.sent();
                        hsrc = '5m（レーザ）';
                        if (!(elevation === nCONST_NO_DATA)) return [3 /*break*/, 3];
                        return [4 /*yield*/, getElevation(worldCoordX, worldCoordY, 15, 'dem5b', 1)];
                    case 2:
                        elevation = _a.sent();
                        hsrc = '5m（写真測量）';
                        _a.label = 3;
                    case 3:
                        if (!(elevation === nCONST_NO_DATA)) return [3 /*break*/, 5];
                        return [4 /*yield*/, getElevation(worldCoordX, worldCoordY, 14, 'dem', 0)];
                    case 4:
                        elevation = _a.sent();
                        hsrc = '10m';
                        _a.label = 5;
                    case 5:
                        if (elevation === nCONST_NO_DATA) {
                            elevation = null; // Set elevation to null for '-----'
                            hsrc = '-----';
                        }
                        sBody = '';
                        if (elevation === null) {
                            sBody = "{\"elevation\": null, \"hsrc\": \"".concat(hsrc, "\"}");
                        }
                        else {
                            sBody = "{\"elevation\": ".concat(elevation, ", \"hsrc\": \"").concat(hsrc, "\"}");
                        }
                        if (!urlParams.outtype) {
                            sBody = "".concat(sCallBack, "( ").concat(sBody, " )");
                        }
                        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                        res.end(sBody);
                        return [2 /*return*/];
                }
            });
        });
    }
    fetchElevation().catch(function (error) {
        console.error(error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    });
}).listen(8080, function () {
    console.log('Server is running on port 8080');
});
