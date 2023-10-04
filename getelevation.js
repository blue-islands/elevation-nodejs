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
var https = require("https");
var querystring = require("querystring");
var NO_DATA = -500;
var BASE_URL = 'https://cyberjapandata.gsi.go.jp/xyz';
var SERVER_PORT = 8081;
var R = 128 / Math.PI;
function getElevation(worldCoordX, worldCoordY, zoom, demSource, dataRound) {
    return __awaiter(this, void 0, void 0, function () {
        var PixelX, TileX, PixelY, TileY, PixelXint, px, PixelYint, py, sFileName;
        return __generator(this, function (_a) {
            PixelX = worldCoordX * Math.pow(2, zoom);
            TileX = Math.floor(PixelX / 256);
            PixelY = worldCoordY * Math.pow(2, zoom);
            TileY = Math.floor(PixelY / 256);
            PixelXint = Math.floor(PixelX);
            px = PixelXint % 256;
            PixelYint = Math.floor(PixelY);
            py = PixelYint % 256;
            sFileName = "".concat(BASE_URL, "/").concat(demSource, "/").concat(zoom, "/").concat(TileX, "/").concat(TileY, ".txt");
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    https.get(sFileName, function (res) {
                        var data = '';
                        res.on('data', function (chunk) {
                            data += chunk;
                        });
                        res.on('end', function () {
                            if (res.statusCode !== 200) {
                                return resolve(NO_DATA.toString());
                            }
                            data = data.replace(/\r\n|\r|\n/g, '\n');
                            var asText = data.split('\n');
                            if (asText.length <= py || asText[py].split(',')[px] === 'e') {
                                return resolve(NO_DATA.toString());
                            }
                            var elevation = parseFloat(asText[py].split(',')[px]).toFixed(dataRound);
                            resolve(parseFloat(elevation) < -500 ? "-----" : elevation);
                        });
                    }).on('error', function (err) {
                        reject(err);
                    });
                })];
        });
    });
}
function calculateWorldCoords(lon, lat) {
    var lng_rad = lon * (Math.PI / 180);
    var lat_rad = lat * (Math.PI / 180);
    var worldCoordX = R * (lng_rad + Math.PI);
    var worldCoordY = (-1) * R / 2 * Math.log((1 + Math.sin(lat_rad)) / (1 - Math.sin(lat_rad))) + 128;
    return [worldCoordX, worldCoordY];
}
function handleRequest(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var urlParams, _a, worldCoordX, worldCoordY, hsrc, elevation, sCallBack, sBody, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 6, , 7]);
                    urlParams = querystring.parse(req.url.split('?')[1] || '');
                    _a = calculateWorldCoords(parseFloat(urlParams.lon), parseFloat(urlParams.lat)), worldCoordX = _a[0], worldCoordY = _a[1];
                    hsrc = '5m（レーザ）';
                    return [4 /*yield*/, getElevation(worldCoordX, worldCoordY, 15, 'dem5a', 1)];
                case 1:
                    elevation = _b.sent();
                    if (!(elevation === NO_DATA.toString())) return [3 /*break*/, 3];
                    hsrc = '5m（写真測量）';
                    return [4 /*yield*/, getElevation(worldCoordX, worldCoordY, 15, 'dem5b', 1)];
                case 2:
                    elevation = _b.sent();
                    _b.label = 3;
                case 3:
                    if (!(elevation === NO_DATA.toString())) return [3 /*break*/, 5];
                    hsrc = '10m';
                    return [4 /*yield*/, getElevation(worldCoordX, worldCoordY, 14, 'dem', 0)];
                case 4:
                    elevation = _b.sent();
                    _b.label = 5;
                case 5:
                    if (elevation === NO_DATA.toString()) {
                        elevation = "-----";
                        hsrc = "-----";
                    }
                    sCallBack = urlParams.callback || '';
                    sBody = "{\"elevation\": ".concat(isNaN(Number(elevation)) ? "\"".concat(elevation, "\"") : elevation, ", \"hsrc\": \"").concat(hsrc, "\"}");
                    if (!urlParams.outtype) {
                        sBody = "".concat(sCallBack, "( ").concat(sBody, " )");
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
                    res.end(sBody);
                    return [3 /*break*/, 7];
                case 6:
                    error_1 = _b.sent();
                    console.error(error_1);
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('サーバーエラー');
                    return [3 /*break*/, 7];
                case 7: return [2 /*return*/];
            }
        });
    });
}
http.createServer(handleRequest).listen(SERVER_PORT, function () {
    console.log("\u30B5\u30FC\u30D0\u30FC\u304C\u30DD\u30FC\u30C8".concat(SERVER_PORT, "\u3067\u7A3C\u50CD\u3057\u3066\u3044\u307E\u3059"));
});
