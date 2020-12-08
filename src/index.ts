import _ from 'underscore';
import * as pjson from '../package.json';
import * as uuid from 'uuid';
import jxon from 'jxon';
import util from 'util';
import axios, {Method} from 'axios';

export interface QuickbooksConfiguration {
    consumerKey: string;
    consumerSecret: string;
    token: string;
    tokenSecret: string|null;
    realmId: string;
    useSandbox: boolean;
    debug: boolean;
    endpoint: string;
    minorversion: string;
    oauthversion: string;
    refreshToken: string;
}



export class Quickbooks {
    private consumerKey: string|null;
    private consumerSecret: string|null;
    private token: string|null;
    private tokenSecret: string|null;
    private realmId: string|null;
    private useSandbox: boolean|null;
    private debug: boolean|null;
    private endpoint: string;
    private minorversion: string;
    private oauthversion: string;
    private refreshToken: string|null;

    public static readonly APP_CENTER_BASE = 'https://appcenter.intuit.com';
    public static readonly V3_ENDPOINT_BASE_URL = 'https://sandbox-quickbooks.api.intuit.com/v3/company/';
    public static readonly QUERY_OPERATORS = ['=', 'IN', '<', '>', '<=', '>=', 'LIKE'];
    public static readonly TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    public static readonly REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';
    public static REQUEST_TOKEN_URL: string|null;
    public static ACCESS_TOKEN_URL: string|null;
    public static APP_CENTER_URL: string|null;
    public static RECONNECT_URL: string|null;
    public static DISCONNECT_URL: string|null;
    public static USER_INFO_URL: string|null;
    public static readonly OAUTH_ENDPOINTS = {
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
            const NEW_ENDPOINT_CONFIGURATION = {
                AUTHORIZATION_URL: '',
                TOKEN_URL: '',
                USER_INFO_URL: '',
                REVOKE_URL: ''
            };
            axios.get(discoveryUrl).then(res => {
                let json;
                try {
                    json = JSON.parse(res.data);
                } catch (error) {
                    console.log(error);
                    return error;
                }
                NEW_ENDPOINT_CONFIGURATION.AUTHORIZATION_URL = json.authorization_endpoint;;
                NEW_ENDPOINT_CONFIGURATION.TOKEN_URL = json.token_endpoint;
                NEW_ENDPOINT_CONFIGURATION.USER_INFO_URL = json.userinfo_endpoint;
                NEW_ENDPOINT_CONFIGURATION.REVOKE_URL = json.revocation_endpoint;
                callback(NEW_ENDPOINT_CONFIGURATION);
            }).catch(err => {
                console.log(err);
                return err;
            })
        }
    };


    constructor(consumerKey: string|QuickbooksConfiguration, consumerSecret?: string, token?: string, tokenSecret?: string|null, realmId?: string, useSandbox?: boolean, debug?: boolean, minorversion?: string, oauthversion?: string, refreshToken?: string|null) {
        if(typeof consumerKey === 'string') {
            this.consumerKey = consumerKey;
            this.consumerSecret = consumerSecret ?? null;
            this.token = token ?? null;
            this.tokenSecret = tokenSecret ?? null;
            this.realmId = realmId ?? null;
            this.useSandbox = useSandbox ?? null;
            this.debug = debug ?? null;
            this.minorversion = minorversion || '4';
            this.oauthversion = oauthversion || '1.0a';
            this.refreshToken = refreshToken || null;
        } else { //Passed in config object instead of params
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

        if(!this.tokenSecret == null && this.oauthversion !== '2.0') {
            throw new Error('tokenSecret not defined');
        }
    }

    public setOauthVersion(version: string|number, useSandbox: boolean): void {
        version = (typeof version === 'number') ? version.toFixed(1): version;
        const discoveryUrl = useSandbox ? 'https://developer.intuit.com/.well-known/openid_sandbox_configuration/' : 'https://developer.api.intuit.com/.well-known/openid_configuration/';
        Quickbooks.OAUTH_ENDPOINTS[version](function (endpoints: { [x: string]: any; }) {
            for (let k in endpoints) {
                Quickbooks[k] = endpoints[k];
            }
        }, discoveryUrl);
    }

    public async refreshAccessToken() {
        const auth = (new Buffer(this.consumerKey + ':' + this.consumerSecret).toString('base64'));
        const postBody = {
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
        const r = await axios.post(postBody.url, postBody.form, {
            headers: postBody.headers
        });
        const refreshResponse = JSON.parse(r.data);
        this.refreshToken = refreshResponse.refresh_token;
        this.token = refreshResponse.access_token;
        return refreshResponse;
    }

    public async revokeAccess(useRefresh: boolean) {
        const auth = (new Buffer(this.consumerKey + ':' + this.consumerSecret).toString('base64'));
        const revokeToken = useRefresh ? this.refreshToken : this.token;
        const postBody = {
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
        const result = await axios.post(postBody.url, postBody.form, {headers: postBody.headers});
        if(result.status === 200) {
            this.refreshToken = null;
            this.token = null;
            this.realmId = null;
        };
        return result.data;
    }
    public getUserInfo() {
        return this.request( 'get', {url: Quickbooks.USER_INFO_URL}, null);
    }

    public batch(items: Object[]) {
        return this.request( 'post', {url: '/batch'}, {BatchItemRequest: items})
    }
    public reconnect() {
        return this.xmlRequest( Quickbooks.RECONNECT_URL ?? '', 'ReconnectResponse');
    }
    public disconnect() {
        return this.xmlRequest( Quickbooks.DISCONNECT_URL ?? '', 'PlatformResponse');
    }

    //CRUD endpoints
    //Invoice
    public createInvoice (invoice, callback?: (err, data) => void): Promise<any>|void {
        if(callback != null) {
            this.create('invoice', invoice).then(x => {
                callback(null, x);
            }).catch(x => {
                callback(x, null);
            });
            return;
        }
        return this.create( 'invoice', invoice);
    }

    private async request(verb: Method, options: any, entity: any): Promise<any> {
        const version = pjson.version;
        let url = this.endpoint + this.realmId + options.url;
        if (options.url === Quickbooks.RECONNECT_URL || options.url == Quickbooks.DISCONNECT_URL || options.url === Quickbooks.REVOKE_URL || options.url === Quickbooks.USER_INFO_URL) {
            url = options.url
        }
        const opts: any = {
            url:     url,
            qs:      options.qs || {},
            headers: options.headers || {},
            json:    true
        }
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
        opts.headers['User-Agent'] = 'node-quickbooks: version ' + version
        opts.headers['Request-Id'] = uuid.v1()
        if (this.oauthversion == '2.0'){
            opts.headers['Authorization'] =  'Bearer ' + this.token
        } else {
            opts.oauth = this.oauth();
        }
        if (options.url.match(/pdf$/)) {
            opts.headers['accept'] = 'application/pdf'
            opts.encoding = null
        }
        if (entity !== null) {
            opts.body = entity
        }
        if (options.formData) {
            opts.formData = options.formData
        }
        if ('production' !== process.env.NODE_ENV && this.debug) {
            axios.interceptors.request.use(request => {
                console.log('Starting Request', JSON.stringify(request, null, 2));
                return request;
            });
            axios.interceptors.response.use(response => {
               console.log('Response:', util.inspect(response))
                return response
            });
        }

        try{
            const result = await axios.request({
                method: verb,
                url: opts.url,
                headers: opts.headers,
                params: opts.qs,
                data: opts.body,
            })
            return result.data;
        }
        catch (e) {
            console.log(e);
            return e;
        }
    }

    private async xmlRequest(url: string, rootTag: string) {
       try {
           const body = await this.request( 'get', {url:url}, null);
           return body.constructor === {}.constructor ? body :
               (body.constructor === "".constructor ?
                   (body.indexOf('<') === 0 ? jxon.stringToJs(body)[rootTag] : body) : body);
       } catch (e) {
           return e;
       }
    }
    private oauth() {
        return {
            consumer_key:    this.consumerKey,
            consumer_secret: this.consumerSecret,
            token:           this.token,
            token_secret:    this.tokenSecret
        }
    }

    private unwrap(data, entityName): any {
        const name = this.capitalize(entityName);
        return (data || {})[name];
    }
    private capitalize(s: string): string {
        return s.substring(0, 1).toUpperCase() + s.substring(1)
    }
    private pluralize(callback, entityName) {
        if (! callback) return function(err, data) {}
        return (err, data) => {
            if (err) {
                if (callback) callback(err)
            } else {
                const name = this.capitalize(entityName)
                if (callback) callback(err, (data || {})[name] || data)
            }
        }
    }

    private async create(entityName: string, entity: any) {
        const url = '/' + entityName.toLowerCase()
        const data = await this.request( 'post', {url: url}, entity);
        return this.unwrap(data, entityName);
    }
    private async read(entityName: string, id: string) {
        let url = '/' + entityName.toLowerCase()
        if (id) url = url + '/' + id
        const data = await this.request( 'get', {url: url}, null);
        return this.unwrap(data, entityName);
    }
    private async update(entityName: string, entity: any) {
        if (_.isUndefined(entity.Id) ||
            _.isEmpty(entity.Id + '') ||
            _.isUndefined(entity.SyncToken) ||
            _.isEmpty(entity.SyncToken + '')) {
            if (entityName !== 'exchangerate') {
                throw new Error(entityName + ' must contain Id and SyncToken fields: ' +
                    util.inspect(entity, {showHidden: false, depth: null}))
            }
        }
        if (! entity.hasOwnProperty('sparse')) {
            entity.sparse = true
        }
        const url = '/' + entityName.toLowerCase() + '?operation=update'
        const opts: any = {url: url}
        if (entity.void && entity.void.toString() === 'true') {
            opts.qs = { include: 'void' }
            delete entity.void
        }
        const data = await this.request( 'post', opts, entity);
        return this.unwrap(data, entityName);
    }
    private async delete(entityName: string, idOrEntity: string|any) {
        const url = '/' + entityName.toLowerCase() + '?operation=delete'
        if (_.isObject(idOrEntity)) {
            return await this.request( 'post', {url: url}, idOrEntity);
        } else {
            const entity = await this.read( entityName, idOrEntity);
            return await this.request('post', {url: url}, entity);
        }
    }
    private async void(entityName: string, idOrEntity: string|any, callback) {
        const url = '/' + entityName.toLowerCase() + '?operation=void'
        if (_.isObject(idOrEntity)) {
            return this.request( 'post', { url: url }, idOrEntity)
        } else {
            const entity = await this.read(entityName, idOrEntity);
            return this.request( 'post', { url: url }, entity)
        }
    }
}
