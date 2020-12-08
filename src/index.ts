import _ from 'underscore';
import * as uuid from 'uuid';
import jxon from 'jxon';
import util from 'util';
import axios, {Method} from 'axios';

/**
 * Configuration Object for Quickbooks API
 */
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


/**
 * Node.js client encapsulating access to the QuickBooks V3 Rest API. An instance
 * of this class should be instantiated on behalf of each user accessing the api.
 */
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

    /**
     *@constructor
     * @param consumerKey - Application Key from QBO. For OAuth 2 apps, this is your Client ID.
     * @param consumerSecret - Application Secret from QBO. For OAuth 2 apps, this is your Client Secret.
     * @param token - the OAuth Access Token
     * @param tokenSecret - the OAuth Generated User Secret. For OAuth 2 apps, this should be null as OAuth 2 does not use token secrets.
     * @param realmId - Quickbooks Company ID, returned as a request parameter when the user is redirected to the provided callback URL following authentication
     * @param useSandbox - Should the API use the Quickbooks Sandbox urls? See https://developer.intuit.com/v2/blog/2014/10/24/intuit-developer-now-offers-quickbooks-sandboxes
     * @param debug - Boolean flag for HTTP Request logging.
     * @param minorversion - sets the QBO API minor version for requests
     * @param oauthversion - sets the OAuth version used for your application
     * @param refreshToken - OAuth Generated Refresh Token.
     */
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

    /**
     *  Sets the OAuth endpoints per OAuth version
     * @param version - 1.0 for OAuth 1.0a, 2.0 for OAuth 2.0
     * @param useSandbox - true to use the OAuth 2.0 sandbox discovery document, false (or unspecified, for backward compatibility) to use the prod discovery document.
     */
    public setOauthVersion(version: string|number, useSandbox: boolean): void {
        version = (typeof version === 'number') ? version.toFixed(1): version;
        const discoveryUrl = useSandbox ? 'https://developer.intuit.com/.well-known/openid_sandbox_configuration/' : 'https://developer.api.intuit.com/.well-known/openid_configuration/';
        Quickbooks.OAUTH_ENDPOINTS[version](function (endpoints: { [x: string]: any; }) {
            for (let k in endpoints) {
                Quickbooks[k] = endpoints[k];
            }
        }, discoveryUrl);
    }

    /**
     * Uses the current refresh token to obtain a new access token, using the Promise API
     * @return Promise
     */
    public async refreshAccessTokenPromise() {
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
    /**
     * Uses the current refresh token to obtain a new access token. Wraps the Promise version in callbacks for backwards-compatibility.
     * @param {function} callback - a function to call once the operation is complete. Takes 2 params, the first being an error object and the second being the returned data. If no error or no data, passes null for that param.
     */
    public refreshAccessToken(callback: (err, data) => void) {
        this.refreshAccessTokenPromise().then(x => {
            callback(null, x);
        })
            .catch(x => {
                callback(x, null);
            });
    }
    /**
     * Use either refresh token or access token to revoke access (OAuth2).
     * Wraps the Promise version to maintain backwards compatibility
     *
     * @param useRefresh - boolean - Indicates which token to use: true to use the refresh token, false to use the access token.
     * @param {function} callback - Callback function to call with error/data results.
     */
    public revokeAccess(useRefresh: boolean, callback: (err, data) => void) {
        this.revokeAccessPromise(useRefresh).then(x => {
            callback(null, x);
        })
            .catch(x => {
                callback(x, null);
            });
    }
    /**
     * Use either refresh token or access token to revoke access (OAuth2). Uses Promise API
     *
     * @param useRefresh - boolean - Indicates which token to use: true to use the refresh token, false to use the access token.
     * @return Promise
     */
    public async revokeAccessPromise(useRefresh: boolean) {
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
    /**
     * Get user info (OAuth2).
     *
     * @param {function} callback - Optional Callback function to call with error/data results.
     * @return Promise|void  Returns a Promise if the callback param is not provided, otherwise uses the callback and returns void.
     */
    public getUserInfo(callback?: (err, data) => void): Promise<any>|void {
        if(callback != null) {
            this.request( 'get', {url: Quickbooks.USER_INFO_URL}, null).then(x => {
                callback(null, x);
            }).catch(err => {
                callback(err, null);
            });
            return;
        }
        return this.request( 'get', {url: Quickbooks.USER_INFO_URL}, null);
    }
    /**
     * Batch operation to enable an application to perform multiple operations in a single request.
     * The following batch items are supported:
     create
     update
     delete
     query
     * The maximum number of batch items in a single request is 30.
     *
     * @param  {object} items - JavaScript array of batch items
     * @param  {function} callback -Optional Callback function which is called with any error and list of BatchItemResponses.
     * @return Promise|void  Returns a Promise if the callback param is not provided, otherwise uses the callback and returns void.
     */
    public batch(items: Object[], callback?: (err, data) => void): Promise<any>|void {
        if(callback != null) {
            this.request( 'post', {url: '/batch'}, {BatchItemRequest: items}).then(x => {
                callback(null, x);
            }).catch(e => {
                callback(e, null);
            });
            return;
        }
        return this.request( 'post', {url: '/batch'}, {BatchItemRequest: items})
    }

    /**
     *
     * @param  {function} callback -Optional Callback function which is called with any error and list of BatchItemResponses.
     * @return Promise|void  Returns a Promise if the callback param is not provided, otherwise uses the callback and returns void.
     */
    public reconnect(callback?: (err, data) => void): Promise<any>|void {
        if(callback != null) {
            this.xmlRequest( Quickbooks.RECONNECT_URL ?? '', 'ReconnectResponse')
                .then(x => {
                    callback(null, x);
                }).catch(e => {
                    callback(e, null);
                });
            return;
        }
        return this.xmlRequest( Quickbooks.RECONNECT_URL ?? '', 'ReconnectResponse');
    }
    /**
     *
     * @param  {function} callback -Optional Callback function which is called with any error and list of BatchItemResponses.
     * @return Promise|void  Returns a Promise if the callback param is not provided, otherwise uses the callback and returns void.
     */
    public disconnect(callback?: (err, data) => void): Promise<any>|void {
        if(callback != null) {
            this.xmlRequest( Quickbooks.DISCONNECT_URL ?? '', 'PlatformResponse')
                .then(x => {
                    callback(null, x);
                }).catch(e => {
                    callback(e, null);
            });
            return;
        }
        return this.xmlRequest( Quickbooks.DISCONNECT_URL ?? '', 'PlatformResponse');
    }

    //CRUD endpoints
    //Invoice
    /**
     * Creates the Invoice in QuickBooks
     *
     * @param  {object} invoice - The unsaved invoice, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent Invoice
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Invoice.
     */
    public createInvoice (invoice: any, callback?: (err, data) => void): Promise<any>|void {
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

    /**
     * Executes an HTTP request using Axios.
     * @param verb - the HTTP verb to use for the request.
     * @param options - HTTP Request options.
     * @param entity - the Quickbooks Entity to operate on.
     * @private
     */
    private async request(verb: Method, options: any, entity: any): Promise<any> {
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
        opts.headers['User-Agent'] = 'node-quickbooks'
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

    /**
     * Executes Quickbooks XML request
     *
     * @param url - URL to send the request to
     * @param rootTag - XML root tag
     * @private
     */
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

    /**
     * Retrieves OAuth configuration.
     * @private
     */
    private oauth() {
        return {
            consumer_key:    this.consumerKey,
            consumer_secret: this.consumerSecret,
            token:           this.token,
            token_secret:    this.tokenSecret
        }
    }

    /**
     * Unwraps QBO response object
     *
     * @param data - QBO Response object to unwrap.
     * @param entityName - Name of QBO Entity contained in the Response Object
     * @private
     */
    private unwrap(data, entityName): any {
        const name = this.capitalize(entityName);
        return (data || {})[name];
    }

    /**
     * Capitalizes the first letter of a string.
     *
     * @param s - the string to capitalize
     * @private
     */
    private capitalize(s: string): string {
        return s.substring(0, 1).toUpperCase() + s.substring(1)
    }

    /**
     * pluralizes an entityName
     *
     * @param callback
     * @param entityName
     * @private
     */
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

    /**
     * Generic Create function. Used to Create Quickbooks entities.
     *
     * @param entityName - Name of Entity to create, ex: Invoice
     * @param entity - The entity to be created
     * @return Promise - A promise containing the created entity.
     * @private
     */
    private async create(entityName: string, entity: any) {
        const url = '/' + entityName.toLowerCase()
        const data = await this.request( 'post', {url: url}, entity);
        return this.unwrap(data, entityName);
    }

    /**
     * Generic Read function. Used to read Quickbooks Entities.
     *
     * @param entityName - Name of Entity to read, ex: Invoice
     * @param id - the string ID of the entity to read.
     * @return Promise A promise containing the retrieved entity.
     * @private
     */
    private async read(entityName: string, id: string) {
        let url = '/' + entityName.toLowerCase()
        if (id) url = url + '/' + id
        const data = await this.request( 'get', {url: url}, null);
        return this.unwrap(data, entityName);
    }
    private async update(entityName: string, entity: any) {
        if (entity.Id != null ||
            entity.Id + '' !== '' ||
            entity.SyncToken != null ||
            entity.SyncToken + '' !== '') {
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
        if (typeof idOrEntity !== 'string') {
            return await this.request( 'post', {url: url}, idOrEntity);
        } else {
            const entity = await this.read( entityName, idOrEntity);
            return await this.request('post', {url: url}, entity);
        }
    }
    private async void(entityName: string, idOrEntity: string|any) {
        const url = '/' + entityName.toLowerCase() + '?operation=void'
        if (_.isObject(idOrEntity)) {
            return this.request( 'post', { url: url }, idOrEntity)
        } else {
            const entity = await this.read(entityName, idOrEntity);
            return this.request( 'post', { url: url }, entity)
        }
    }
}
