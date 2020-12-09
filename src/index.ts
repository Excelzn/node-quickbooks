import _ from 'underscore';
import * as uuid from 'uuid';
import jxon from 'jxon';
import util from 'util';
import axios, {Method} from 'axios';
import {formatISO} from 'date-fns';

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
export class QuickBooks {
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
                APP_CENTER_URL: QuickBooks.APP_CENTER_BASE + '/Connect/Begin?oauth_token=',
                RECONNECT_URL: QuickBooks.APP_CENTER_BASE + '/api/v1/connection/reconnect',
                DISCONNECT_URL: QuickBooks.APP_CENTER_BASE + '/api/v1/connection/disconnect'
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
        this.endpoint = this.useSandbox ? QuickBooks.V3_ENDPOINT_BASE_URL : QuickBooks.V3_ENDPOINT_BASE_URL.replace('sandbox-', '');

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
        QuickBooks.OAUTH_ENDPOINTS[version](function (endpoints: { [x: string]: any; }) {
            for (let k in endpoints) {
                QuickBooks[k] = endpoints[k];
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
            url: QuickBooks.TOKEN_URL,
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
            url: QuickBooks.REVOKE_URL,
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
            this.request( 'get', {url: QuickBooks.USER_INFO_URL}, null).then(x => {
                callback(null, x);
            }).catch(err => {
                callback(err, null);
            });
            return;
        }
        return this.request( 'get', {url: QuickBooks.USER_INFO_URL}, null);
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
            this.xmlRequest( QuickBooks.RECONNECT_URL ?? '', 'ReconnectResponse')
                .then(x => {
                    callback(null, x);
                }).catch(e => {
                    callback(e, null);
                });
            return;
        }
        return this.xmlRequest( QuickBooks.RECONNECT_URL ?? '', 'ReconnectResponse');
    }
    /**
     *
     * @param  {function} callback -Optional Callback function which is called with any error and list of BatchItemResponses.
     * @return Promise|void  Returns a Promise if the callback param is not provided, otherwise uses the callback and returns void.
     */
    public disconnect(callback?: (err, data) => void): Promise<any>|void {
        if(callback != null) {
            this.xmlRequest( QuickBooks.DISCONNECT_URL ?? '', 'PlatformResponse')
                .then(x => {
                    callback(null, x);
                }).catch(e => {
                    callback(e, null);
            });
            return;
        }
        return this.xmlRequest( QuickBooks.DISCONNECT_URL ?? '', 'PlatformResponse');
    }
    /**
     * The change data capture (CDC) operation returns a list of entities that have changed since a specified time.
     *
     * @param  {object} entities - Comma separated list or JavaScript array of entities to search for changes
     * @param  {object} since - JavaScript Date or string representation of the form '2012-07-20T22:25:51-07:00' to look back for changes until
     * @param  {function} callback - Optional Callback function which is called with any error and list of changes
     * @return Promise|void - Returns a Promise if no callback provided, otherwise uses the provided callback.
     */
    public changeDataCapture(entities: string|any[], since: Date|string, callback?: (err, data) => void): Promise<any[]>|void {
        let url = '/cdc?entities='
        url += typeof entities === 'string' ? entities : entities.join(',')
        url += '&changedSince='
        url += typeof since === 'string' ? since : formatISO(since)
        if(callback != null) {
            this.request('get', {url: url}, null).then(x => {
                callback(null, x);
            }).catch(e => {
                callback(e, null);
            });
            return;
        }
        return this.request('get', {url: url}, null)
    }
    /**
     * Uploads a file as an Attachable in QBO, optionally linking it to the specified
     * QBO Entity.
     *
     * @param  {string} filename - the name of the file
     * @param  {string} contentType - the mime type of the file
     * @param  {object} stream - ReadableStream of file contents
     * @param  {object} entityType - optional string name of the QBO entity the Attachable will be linked to (e.g. Invoice)
     * @param  {object} entityId - optional Id of the QBO entity the Attachable will be linked to
     * @param  {function} callback - optional callback which receives the newly created Attachable
     *
     * @return Promise|void returns a promise containing the newly created Attachable if no callback recieved, otherwise uses the callback and returns void.
     */
    public upload(filename: string, contentType: string, stream: ReadableStream, entityType?: string, entityId?: string, callback?: (err, data) => void): Promise<any>|void {
        const that = this
        const opts = {
            url: '/upload',
            formData: {
                file_content_01: {
                    value: stream,
                    options: {
                        filename: filename,
                        contentType: contentType
                    }
                }
            }
        };
        if(callback!= null) {
            this.handleAttaching(opts, entityType, entityId).then(x => {
                callback(null, x);
            }).catch(e => {
                callback(e, null);
            });
            return;
        } else {
            return this.handleAttaching(opts, entityType, entityId);
        }
    }



    //CRUD endpoints
    //Create
    /**
     * Creates the Account in QuickBooks
     *
     * @param  {object} account - The unsaved account, to be persisted in QuickBooks
     * @param  {function} callback - Callback function which is called with any error and the persistent Account
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Account.
     */
    public createAccount(account: any, callback?: (err, data) => void) {
        return this.wrapPromiseWithOptionalCallback(this.create( 'account', account), callback);
    }
    /**
     * Creates the Attachable in QuickBooks
     *
     * @param  {object} attachable - The unsaved attachable, to be persisted in QuickBooks
     * @param  {function} callback - Callback function which is called with any error and the persistent Attachable
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Attachable.
     */
    public createAttachable(attachable: any, callback?: (err, data) => void) {
        return this.wrapPromiseWithOptionalCallback(this.create( 'attachable', attachable), callback);
    }
    /**
     * Creates the Bill in QuickBooks
     *
     * @param  {object} bill - The unsaved bill, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent Bill
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Bill.
     */
    public createBill(bill: any, callback?: (err, data) => void) {
        return this.wrapPromiseWithOptionalCallback(this.create( 'bill', bill), callback);
    }
    /**
     * Creates the BillPayment in QuickBooks
     *
     * @param  {object} billPayment - The unsaved billPayment, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent BillPayment
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent BillPayment.
     */
    public createBillPayment(billPayment: any, callback?: (err, data) => void) {
        return this.wrapPromiseWithOptionalCallback(this.create( 'billPayment', billPayment), callback)
    }
    /**
     * Creates the Class in QuickBooks
     *
     * @param  {object} qbClass - The unsaved class, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent Class
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Class.
     */
    public createClass(qbClass: any, callback?: (err, data) => void) {
        return this.wrapPromiseWithOptionalCallback(this.create( 'class', qbClass), callback)
    }
    /**
     * Creates the CreditMemo in QuickBooks
     *
     * @param  {object} creditMemo - The unsaved CreditMemo, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent CreditMemo
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent CreditMemo.
     */
    public createCreditMemo(creditMemo: any, callback?: (err, data) => void) {
        return this.wrapPromiseWithOptionalCallback(this.create( 'creditMemo', creditMemo), callback)
    }
    /**
     * Creates the Customer in QuickBooks
     *
     * @param  {object} customer - The unsaved Customer, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent Customer
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Customer.
     */
    public createCustomer(customer: any, callback?: (err, data) => void) {
        return this.wrapPromiseWithOptionalCallback(this.create( 'customer', customer), callback)
    }
    /**
     * Creates the Department in QuickBooks
     *
     * @param  {object} department - The unsaved Department, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent Department
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Department.
     */
    public createDepartment(department: any, callback?: (err, data) => void) {
        return this.wrapPromiseWithOptionalCallback(this.create( 'department', department), callback)
    }
    /**
     * Creates the Deposit in QuickBooks
     *
     * @param  {object} deposit - The unsaved Deposit, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent Deposit
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Deposit.
     */
    public createDeposit(deposit: any, callback?: (err, data) => void) {
        return this.wrapPromiseWithOptionalCallback(this.create( 'deposit', deposit), callback)
    }
    /**
     * Creates the Employee in QuickBooks
     *
     * @param  {object} employee - The unsaved Employee, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent Employee
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Employee.
     */
    public createEmployee(employee: any, callback?: (err, data) => void) {
        return this.wrapPromiseWithOptionalCallback(this.create( 'employee', employee), callback)
    }
    /**
     * Creates the Estimate in QuickBooks
     *
     * @param  {object} estimate - The unsaved Estimate, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent Estimate
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Estimate.
     */
    public createEstimate(estimate: any, callback?: (err, data) => void) {
        return this.wrapPromiseWithOptionalCallback(this.create( 'estimate', estimate), callback)
    }
    /**
     * Creates the Invoice in QuickBooks
     *
     * @param  {object} invoice - The unsaved invoice, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent Invoice
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Invoice.
     */
    public createInvoice (invoice: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'invoice', invoice), callback);
    }
    /**
     * Creates the Item in QuickBooks
     *
     * @param  {object} item - The unsaved Item, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent Item
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Item.
     */
    public createItem (item: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'item', item), callback);
    }
    /**
     * Creates the JournalCode in QuickBooks
     *
     * @param  {object} journalCode - The unsaved JournalCode, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent JournalCode
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent JournalCode.
     */
    public createJournalCode (journalCode: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'journalCode', journalCode), callback);
    }
    /**
     * Creates the JournalEntry in QuickBooks
     *
     * @param  {object} journalEntry - The unsaved JournalEntry, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent JournalEntry
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent JournalEntry.
     */
    public createJournalEntry (journalEntry: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'journalEntry', journalEntry), callback);
    }
    /**
     * Creates the Payment in QuickBooks
     *
     * @param  {object} payment - The unsaved Payment, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent Payment
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Payment.
     */
    public createPayment (payment: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'payment', payment), callback);
    }
    /**
     * Creates the PaymentMethod in QuickBooks
     *
     * @param  {object} paymentMethod - The unsaved PaymentMethod, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent PaymentMethod
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent PaymentMethod.
     */
    public createPaymentMethod (paymentMethod: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'paymentMethod', paymentMethod), callback);
    }
    /**
     * Creates the Purchase in QuickBooks
     *
     * @param  {object} purchase - The unsaved Purchase, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent Purchase
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Purchase.
     */
    public createPurchase (purchase: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'purchase', purchase), callback);
    }
    /**
     * Creates the PurchaseOrder in QuickBooks
     *
     * @param  {object} purchaseOrder - The unsaved PurchaseOrder, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent PurchaseOrder
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent PurchaseOrder.
     */
    public createPurchaseOrder (purchaseOrder: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'purchaseOrder', purchaseOrder), callback);
    }
    /**
     * Creates the RefundReceipt in QuickBooks
     *
     * @param  {object} refundReceipt - The unsaved RefundReceipt, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent RefundReceipt
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent RefundReceipt.
     */
    public createRefundReceipt (refundReceipt: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'refundReceipt', refundReceipt), callback);
    }
    /**
     * Creates the SalesReceipt in QuickBooks
     *
     * @param  {object} salesReceipt - The unsaved SalesReceipt, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent SalesReceipt
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent SalesReceipt.
     */
    public createSalesReceipt (salesReceipt: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'salesReceipt', salesReceipt), callback);
    }

    /**
     * Creates the TaxAgency in QuickBooks
     *
     * @param  {object} taxAgency - The unsaved TaxAgency, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent TaxAgency
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent TaxAgency.
     */
    public createTaxAgency (taxAgency: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'taxAgency', taxAgency), callback);
    }
    /**
     * Creates the TaxService in QuickBooks
     *
     * @param  {object} taxService - The unsaved TaxAgency, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent TaxService
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent TaxService.
     */
    public createTaxService (taxService: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'taxService', taxService), callback);
    }
    /**
     * Creates the Term in QuickBooks
     *
     * @param  {object} term - The unsaved Term, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent Term
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Term.
     */
    public createTerm (term: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'term', term), callback);
    }
    /**
     * Creates the TimeActivity in QuickBooks
     *
     * @param  {object} timeActivity - The unsaved TimeActivity, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent TimeActivity
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent TimeActivity.
     */
    public createTimeActivity (timeActivity: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'timeActivity', timeActivity), callback);
    }
    /**
     * Creates the Transfer in QuickBooks
     *
     * @param  {object} transfer - The unsaved Transfer, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent Transfer
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Transfer.
     */
    public createTransfer (transfer: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'transfer', transfer), callback);
    }
    /**
     * Creates the Vendor in QuickBooks
     *
     * @param  {object} vendor - The unsaved Vendor, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent Vendor
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Vendor.
     */
    public createVendor (vendor: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'vendor', vendor), callback);
    }
    /**
     * Creates the VendorCredit in QuickBooks
     *
     * @param  {object} vendorCredit - The unsaved VendorCredit, to be persisted in QuickBooks
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent VendorCredit
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent VendorCredit.
     */
    public createVendorCredit (vendorCredit: any, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.create( 'vendorCredit', vendorCredit), callback);
    }

    //READ
    /**
     * Retrieves the Account in QuickBooks
     *
     * @param  {string} id - The ID of the persistent Account
     * @param  {function} callback - Optional Callback function which is called with any error and the persistent Account
     * @return Promise|void If callback is supplied, uses the callback and returns void. Otherwise returns a promise containing the persistent Account.
     */
    public getAccount (id: string, callback?: (err, data) => void): Promise<any>|void {
        return this.wrapPromiseWithOptionalCallback(this.read( 'vendorCredit', id), callback);
    }





    /**
     * Wraps a Promise with an optional callback or returns the original promise if no callback supplied.
     *
     * @param promise - A promise to be wrapped
     * @param callback - an optional callback function to use instead of returning a promise.
     *
     * @return Promise|void - returns a Promise if no callback provided, otherwise uses the callback and returns void.
     * @private
     */
    private wrapPromiseWithOptionalCallback(promise: Promise<any>, callback?: (err, data) => void): Promise<any>|void
    {
        if(callback != null) {
            promise.then(x => {
                callback(null, x);
            }).catch(e => {
                callback(e, null);
            });
            return;
        }
        return promise;
    }

    /**
     * Used to encapsulate logic for the upload function that would otherwise need to be repeated.
     *
     * @param opts
     * @param entityType
     * @param entityId
     * @private
     */
    private async handleAttaching(opts: any, entityType, entityId) {
        const result = await this.request( 'post', opts, null);
        const data = this.unwrap(result, 'AttachableResponse');
        if(_.isFunction(entityType)) {
            entityType(null, data[0].Attachable);
            return Promise.resolve();
        } else {
            const id = data[0].Attachable.Id
            return await this.updateAttachable({
                Id: id,
                SyncToken: '0',
                AttachableRef: [{
                    EntityRef: {
                        type: entityType,
                        value: entityId + ''
                    }
                }]
            });
        }
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
        if (options.url === QuickBooks.RECONNECT_URL || options.url == QuickBooks.DISCONNECT_URL || options.url === QuickBooks.REVOKE_URL || options.url === QuickBooks.USER_INFO_URL) {
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

    /**
     * Generic Update function
     *
     * @param entityName - Name of QBO Entity to be Updated
     * @param entity - The updated Entity
     * @return Promise A promise containing the persisted entity
     * @private
     */
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

    /**
     * Generic Delete function
     *
     * @param entityName - Name of the QBO Entity to be deleted
     * @param idOrEntity - Either the string ID for the Entity, or the Entity itself to be deleted
     * @return Promise
     * @private
     */
    private async delete(entityName: string, idOrEntity: string|any) {
        const url = '/' + entityName.toLowerCase() + '?operation=delete'
        if (typeof idOrEntity !== 'string') {
            return await this.request( 'post', {url: url}, idOrEntity);
        } else {
            const entity = await this.read( entityName, idOrEntity);
            return await this.request('post', {url: url}, entity);
        }
    }

    /**
     * Generic Void function
     *
     * @param entityName - Name of QBO Entity to be voided
     * @param idOrEntity - Either the string ID of the Entity, or the Entity itself to be voided
     * @return Promise
     * @private
     */
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
