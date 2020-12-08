"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
        while (_) try {
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quickbooks = void 0;
var underscore_1 = __importDefault(require("underscore"));
var uuid = __importStar(require("uuid"));
var jxon_1 = __importDefault(require("jxon"));
var util_1 = __importDefault(require("util"));
var axios_1 = __importDefault(require("axios"));
var Quickbooks = /** @class */ (function () {
    function Quickbooks(consumerKey, consumerSecret, token, tokenSecret, realmId, useSandbox, debug, minorversion, oauthversion, refreshToken) {
        if (typeof consumerKey === 'string') {
            this.consumerKey = consumerKey;
            this.consumerSecret = consumerSecret !== null && consumerSecret !== void 0 ? consumerSecret : null;
            this.token = token !== null && token !== void 0 ? token : null;
            this.tokenSecret = tokenSecret !== null && tokenSecret !== void 0 ? tokenSecret : null;
            this.realmId = realmId !== null && realmId !== void 0 ? realmId : null;
            this.useSandbox = useSandbox !== null && useSandbox !== void 0 ? useSandbox : null;
            this.debug = debug !== null && debug !== void 0 ? debug : null;
            this.minorversion = minorversion || '4';
            this.oauthversion = oauthversion || '1.0a';
            this.refreshToken = refreshToken || null;
        }
        else { //Passed in config object instead of params
            this.consumerKey = consumerKey.consumerKey;
            this.consumerSecret = consumerKey.consumerSecret;
            this.token = consumerKey.token;
            this.tokenSecret = consumerKey.tokenSecret;
            this.realmId = consumerKey.realmId;
            this.useSandbox = consumerKey.useSandbox;
            this.debug = consumerKey.debug;
            this.minorversion = consumerKey.minorversion || '4';
            this.oauthversion = consumerKey.oauthversion || '1.0a';
            this.refreshToken = consumerKey.refreshToken || null;
        }
        this.endpoint = this.useSandbox ? Quickbooks.V3_ENDPOINT_BASE_URL : Quickbooks.V3_ENDPOINT_BASE_URL.replace('sandbox-', '');
        if (!this.tokenSecret == null && this.oauthversion !== '2.0') {
            throw new Error('tokenSecret not defined');
        }
    }
    Quickbooks.prototype.setOauthVersion = function (version, useSandbox) {
        version = (typeof version === 'number') ? version.toFixed(1) : version;
        var discoveryUrl = useSandbox ? 'https://developer.intuit.com/.well-known/openid_sandbox_configuration/' : 'https://developer.api.intuit.com/.well-known/openid_configuration/';
        Quickbooks.OAUTH_ENDPOINTS[version](function (endpoints) {
            for (var k in endpoints) {
                Quickbooks[k] = endpoints[k];
            }
        }, discoveryUrl);
    };
    Quickbooks.prototype.refreshAccessToken = function () {
        return __awaiter(this, void 0, void 0, function () {
            var auth, postBody, r, refreshResponse;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        auth = (new Buffer(this.consumerKey + ':' + this.consumerSecret).toString('base64'));
                        postBody = {
                            url: Quickbooks.TOKEN_URL,
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/x-www-form-urlencoded',
                                Authorization: 'Basic ' + auth,
                            },
                            form: {
                                grant_type: 'refresh_token',
                                refresh_token: this.refreshToken
                            }
                        };
                        return [4 /*yield*/, axios_1.default.post(postBody.url, postBody.form, {
                                headers: postBody.headers
                            })];
                    case 1:
                        r = _a.sent();
                        refreshResponse = JSON.parse(r.data);
                        this.refreshToken = refreshResponse.refresh_token;
                        this.token = refreshResponse.access_token;
                        return [2 /*return*/, refreshResponse];
                }
            });
        });
    };
    Quickbooks.prototype.revokeAccess = function (useRefresh) {
        return __awaiter(this, void 0, void 0, function () {
            var auth, revokeToken, postBody, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        auth = (new Buffer(this.consumerKey + ':' + this.consumerSecret).toString('base64'));
                        revokeToken = useRefresh ? this.refreshToken : this.token;
                        postBody = {
                            url: Quickbooks.REVOKE_URL,
                            headers: {
                                Accept: 'application/json',
                                'Content-Type': 'application/x-www-form-urlencoded',
                                Authorization: 'Basic ' + auth,
                            },
                            form: {
                                token: revokeToken
                            }
                        };
                        return [4 /*yield*/, axios_1.default.post(postBody.url, postBody.form, { headers: postBody.headers })];
                    case 1:
                        result = _a.sent();
                        if (result.status === 200) {
                            this.refreshToken = null;
                            this.token = null;
                            this.realmId = null;
                        }
                        ;
                        return [2 /*return*/, result.data];
                }
            });
        });
    };
    Quickbooks.prototype.getUserInfo = function (callback) {
        if (callback != null) {
            this.request('get', { url: Quickbooks.USER_INFO_URL }, null).then(function (x) {
                callback(null, x);
            }).catch(function (err) {
                callback(err, null);
            });
            return;
        }
        return this.request('get', { url: Quickbooks.USER_INFO_URL }, null);
    };
    Quickbooks.prototype.batch = function (items, callback) {
        if (callback != null) {
            this.request('post', { url: '/batch' }, { BatchItemRequest: items }).then(function (x) {
                callback(null, x);
            }).catch(function (e) {
                callback(e, null);
            });
            return;
        }
        return this.request('post', { url: '/batch' }, { BatchItemRequest: items });
    };
    Quickbooks.prototype.reconnect = function (callback) {
        var _a, _b;
        if (callback != null) {
            this.xmlRequest((_a = Quickbooks.RECONNECT_URL) !== null && _a !== void 0 ? _a : '', 'ReconnectResponse')
                .then(function (x) {
                callback(null, x);
            }).catch(function (e) {
                callback(e, null);
            });
            return;
        }
        return this.xmlRequest((_b = Quickbooks.RECONNECT_URL) !== null && _b !== void 0 ? _b : '', 'ReconnectResponse');
    };
    Quickbooks.prototype.disconnect = function (callback) {
        var _a, _b;
        if (callback != null) {
            this.xmlRequest((_a = Quickbooks.DISCONNECT_URL) !== null && _a !== void 0 ? _a : '', 'PlatformResponse')
                .then(function (x) {
                callback(null, x);
            }).catch(function (e) {
                callback(e, null);
            });
            return;
        }
        return this.xmlRequest((_b = Quickbooks.DISCONNECT_URL) !== null && _b !== void 0 ? _b : '', 'PlatformResponse');
    };
    //CRUD endpoints
    //Invoice
    Quickbooks.prototype.createInvoice = function (invoice, callback) {
        if (callback != null) {
            this.create('invoice', invoice).then(function (x) {
                callback(null, x);
            }).catch(function (x) {
                callback(x, null);
            });
            return;
        }
        return this.create('invoice', invoice);
    };
    Quickbooks.prototype.request = function (verb, options, entity) {
        return __awaiter(this, void 0, void 0, function () {
            var url, opts, result, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = this.endpoint + this.realmId + options.url;
                        if (options.url === Quickbooks.RECONNECT_URL || options.url == Quickbooks.DISCONNECT_URL || options.url === Quickbooks.REVOKE_URL || options.url === Quickbooks.USER_INFO_URL) {
                            url = options.url;
                        }
                        opts = {
                            url: url,
                            qs: options.qs || {},
                            headers: options.headers || {},
                            json: true
                        };
                        //build query string
                        if (entity && entity.allowDuplicateDocNum) {
                            delete entity.allowDuplicateDocNum;
                            opts.qs.include = 'allowduplicatedocnum';
                        }
                        if (entity && entity.requestId) {
                            opts.qs.requestid = entity.requestId;
                            // noinspection JSConstantReassignment
                            delete entity.requestId;
                        }
                        opts.qs.minorversion = opts.qs.minorversion || this.minorversion;
                        opts.qs.format = 'json';
                        //build headers
                        //opts.headers['User-Agent'] = 'node-quickbooks: version ' + version
                        opts.headers['Request-Id'] = uuid.v1();
                        if (this.oauthversion == '2.0') {
                            opts.headers['Authorization'] = 'Bearer ' + this.token;
                        }
                        else {
                            opts.oauth = this.oauth();
                        }
                        if (options.url.match(/pdf$/)) {
                            opts.headers['accept'] = 'application/pdf';
                            opts.encoding = null;
                        }
                        if (entity !== null) {
                            opts.body = entity;
                        }
                        if (options.formData) {
                            opts.formData = options.formData;
                        }
                        if ('production' !== process.env.NODE_ENV && this.debug) {
                            axios_1.default.interceptors.request.use(function (request) {
                                console.log('Starting Request', JSON.stringify(request, null, 2));
                                return request;
                            });
                            axios_1.default.interceptors.response.use(function (response) {
                                console.log('Response:', util_1.default.inspect(response));
                                return response;
                            });
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, axios_1.default.request({
                                method: verb,
                                url: opts.url,
                                headers: opts.headers,
                                params: opts.qs,
                                data: opts.body,
                            })];
                    case 2:
                        result = _a.sent();
                        return [2 /*return*/, result.data];
                    case 3:
                        e_1 = _a.sent();
                        console.log(e_1);
                        return [2 /*return*/, e_1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    Quickbooks.prototype.xmlRequest = function (url, rootTag) {
        return __awaiter(this, void 0, void 0, function () {
            var body, e_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.request('get', { url: url }, null)];
                    case 1:
                        body = _a.sent();
                        return [2 /*return*/, body.constructor === {}.constructor ? body :
                                (body.constructor === "".constructor ?
                                    (body.indexOf('<') === 0 ? jxon_1.default.stringToJs(body)[rootTag] : body) : body)];
                    case 2:
                        e_2 = _a.sent();
                        return [2 /*return*/, e_2];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    Quickbooks.prototype.oauth = function () {
        return {
            consumer_key: this.consumerKey,
            consumer_secret: this.consumerSecret,
            token: this.token,
            token_secret: this.tokenSecret
        };
    };
    Quickbooks.prototype.unwrap = function (data, entityName) {
        var name = this.capitalize(entityName);
        return (data || {})[name];
    };
    Quickbooks.prototype.capitalize = function (s) {
        return s.substring(0, 1).toUpperCase() + s.substring(1);
    };
    Quickbooks.prototype.pluralize = function (callback, entityName) {
        var _this = this;
        if (!callback)
            return function (err, data) { };
        return function (err, data) {
            if (err) {
                if (callback)
                    callback(err);
            }
            else {
                var name_1 = _this.capitalize(entityName);
                if (callback)
                    callback(err, (data || {})[name_1] || data);
            }
        };
    };
    Quickbooks.prototype.create = function (entityName, entity) {
        return __awaiter(this, void 0, void 0, function () {
            var url, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = '/' + entityName.toLowerCase();
                        return [4 /*yield*/, this.request('post', { url: url }, entity)];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, this.unwrap(data, entityName)];
                }
            });
        });
    };
    Quickbooks.prototype.read = function (entityName, id) {
        return __awaiter(this, void 0, void 0, function () {
            var url, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = '/' + entityName.toLowerCase();
                        if (id)
                            url = url + '/' + id;
                        return [4 /*yield*/, this.request('get', { url: url }, null)];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, this.unwrap(data, entityName)];
                }
            });
        });
    };
    Quickbooks.prototype.update = function (entityName, entity) {
        return __awaiter(this, void 0, void 0, function () {
            var url, opts, data;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (underscore_1.default.isUndefined(entity.Id) ||
                            underscore_1.default.isEmpty(entity.Id + '') ||
                            underscore_1.default.isUndefined(entity.SyncToken) ||
                            underscore_1.default.isEmpty(entity.SyncToken + '')) {
                            if (entityName !== 'exchangerate') {
                                throw new Error(entityName + ' must contain Id and SyncToken fields: ' +
                                    util_1.default.inspect(entity, { showHidden: false, depth: null }));
                            }
                        }
                        if (!entity.hasOwnProperty('sparse')) {
                            entity.sparse = true;
                        }
                        url = '/' + entityName.toLowerCase() + '?operation=update';
                        opts = { url: url };
                        if (entity.void && entity.void.toString() === 'true') {
                            opts.qs = { include: 'void' };
                            delete entity.void;
                        }
                        return [4 /*yield*/, this.request('post', opts, entity)];
                    case 1:
                        data = _a.sent();
                        return [2 /*return*/, this.unwrap(data, entityName)];
                }
            });
        });
    };
    Quickbooks.prototype.delete = function (entityName, idOrEntity) {
        return __awaiter(this, void 0, void 0, function () {
            var url, entity;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = '/' + entityName.toLowerCase() + '?operation=delete';
                        if (!underscore_1.default.isObject(idOrEntity)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.request('post', { url: url }, idOrEntity)];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2: return [4 /*yield*/, this.read(entityName, idOrEntity)];
                    case 3:
                        entity = _a.sent();
                        return [4 /*yield*/, this.request('post', { url: url }, entity)];
                    case 4: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Quickbooks.prototype.void = function (entityName, idOrEntity, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var url, entity;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        url = '/' + entityName.toLowerCase() + '?operation=void';
                        if (!underscore_1.default.isObject(idOrEntity)) return [3 /*break*/, 1];
                        return [2 /*return*/, this.request('post', { url: url }, idOrEntity)];
                    case 1: return [4 /*yield*/, this.read(entityName, idOrEntity)];
                    case 2:
                        entity = _a.sent();
                        return [2 /*return*/, this.request('post', { url: url }, entity)];
                }
            });
        });
    };
    Quickbooks.APP_CENTER_BASE = 'https://appcenter.intuit.com';
    Quickbooks.V3_ENDPOINT_BASE_URL = 'https://sandbox-quickbooks.api.intuit.com/v3/company/';
    Quickbooks.QUERY_OPERATORS = ['=', 'IN', '<', '>', '<=', '>=', 'LIKE'];
    Quickbooks.TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    Quickbooks.REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';
    Quickbooks.OAUTH_ENDPOINTS = {
        '1.0a': function (callback) {
            callback({
                REQUEST_TOKEN_URL: 'https://oauth.intuit.com/oauth/v1/get_request_token',
                ACCESS_TOKEN_URL: 'https://oauth.intuit.com/oauth/v1/get_access_token',
                APP_CENTER_URL: Quickbooks.APP_CENTER_BASE + '/Connect/Begin?oauth_token=',
                RECONNECT_URL: Quickbooks.APP_CENTER_BASE + '/api/v1/connection/reconnect',
                DISCONNECT_URL: Quickbooks.APP_CENTER_BASE + '/api/v1/connection/disconnect'
            });
        },
        '2.0': function (callback, discoveryUrl) {
            var NEW_ENDPOINT_CONFIGURATION = {
                AUTHORIZATION_URL: '',
                TOKEN_URL: '',
                USER_INFO_URL: '',
                REVOKE_URL: ''
            };
            axios_1.default.get(discoveryUrl).then(function (res) {
                var json;
                try {
                    json = JSON.parse(res.data);
                }
                catch (error) {
                    console.log(error);
                    return error;
                }
                NEW_ENDPOINT_CONFIGURATION.AUTHORIZATION_URL = json.authorization_endpoint;
                ;
                NEW_ENDPOINT_CONFIGURATION.TOKEN_URL = json.token_endpoint;
                NEW_ENDPOINT_CONFIGURATION.USER_INFO_URL = json.userinfo_endpoint;
                NEW_ENDPOINT_CONFIGURATION.REVOKE_URL = json.revocation_endpoint;
                callback(NEW_ENDPOINT_CONFIGURATION);
            }).catch(function (err) {
                console.log(err);
                return err;
            });
        }
    };
    return Quickbooks;
}());
exports.Quickbooks = Quickbooks;
