import _ from 'underscore';
import request from 'request';

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
    private consumerKey: string;
    private consumerSecret: string;
    private token: string;
    private tokenSecret: string|null;
    private realmId: string;
    private useSandbox: boolean;
    private debug: boolean;
    private endpoint: string;
    private minorversion: string;
    private oauthversion: string;
    private refreshToken: string;

    public static readonly APP_CENTER_BASE = 'https://appcenter.intuit.com';
    public static readonly V3_ENDPOINT_BASE_URL = 'https://sandbox-quickbooks.api.intuit.com/v3/company/';
    public static readonly QUERY_OPERATORS = ['=', 'IN', '<', '>', '<=', '>=', 'LIKE'];
    public static readonly TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer';
    public static readonly REVOKE_URL = 'https://developer.api.intuit.com/v2/oauth2/tokens/revoke';
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
            request({
                url: discoveryUrl,
                headers: {
                    Accept: 'application/json'
                }
            }, function (err, res) {
                if (err) {
                    console.log(err);
                    return err;
                }

                let json;
                try {
                    json = JSON.parse(res.body);
                } catch (error) {
                    console.log(error);
                    return error;
                }
                NEW_ENDPOINT_CONFIGURATION.AUTHORIZATION_URL = json.authorization_endpoint;;
                NEW_ENDPOINT_CONFIGURATION.TOKEN_URL = json.token_endpoint;
                NEW_ENDPOINT_CONFIGURATION.USER_INFO_URL = json.userinfo_endpoint;
                NEW_ENDPOINT_CONFIGURATION.REVOKE_URL = json.revocation_endpoint;
                callback(NEW_ENDPOINT_CONFIGURATION);
            });
        }
    };


    constructor(consumerKey: string|QuickbooksConfiguration, consumerSecret: string, token: string, tokenSecret: string|null, realmId: string, useSandbox: boolean, debug: boolean, minorversion: string, oauthversion: string, refreshToken: string) {
        const prefix = _.isObject(consumerKey) ? 'consumerKey.': '';
        this.consumerKey = eval(prefix + 'consumerKey');
        this.consumerSecret = eval(prefix + 'consumerSecret');
        this.token = eval(prefix + 'token');
        this.tokenSecret = eval(prefix + 'tokenSecret');
        this.realmId = eval(prefix + 'realmId');
        this.useSandbox = eval(prefix + 'useSandbox');
        this.debug = eval(prefix + 'debug');
    }
}
