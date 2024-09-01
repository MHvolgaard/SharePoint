import CryptoJS from "crypto-js";
import { IPenneoFunctionPayload } from "../models/IPenneoFunctionPayload";
import { HttpClient, IHttpClientOptions } from '@microsoft/sp-http';
import { ListViewCommandSetContext } from "@microsoft/sp-listview-extensibility";
import { IPenneoTokenPayload } from "../models/IPenneoTokenPayload";
import { AF } from "./AF";
import { TokenEndpoint, ClientId, ClientSecret, RedirectUri, AuthEndpoint, HmacKey, EncryptionKey } from "../../../config";

const encryptionKey: CryptoJS.lib.WordArray = CryptoJS.enc.Utf8.parse(EncryptionKey);
const hmacKey: CryptoJS.lib.WordArray = CryptoJS.enc.Utf8.parse(HmacKey);

export class PenneoService {
    private static context: ListViewCommandSetContext;

    public static init(nContext: ListViewCommandSetContext): void {
        this.context = nContext;
    }

    public static wakeUp(): void {
        this.context.httpClient.get( // eslint-disable-line @typescript-eslint/no-floating-promises
            TokenEndpoint,
            HttpClient.configurations.v1
        );
    }

    public static async sendToPenneoAF(payload: IPenneoFunctionPayload): Promise<string> {
        const accessToken = await this.getToken();

        const encryptedToken = CryptoJS.AES.encrypt(accessToken, encryptionKey, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }).toString();

        const hmac = CryptoJS.HmacSHA256(encryptedToken, hmacKey).toString();

        payload.Token = encryptedToken;
        payload.Hmac = hmac;

        payload.SiteUrl = this.context.pageContext.web.absoluteUrl;
        payload.ListId = this.context.pageContext.list.id.toString();

        return await AF.sendToPenneoAF(payload);
    }

    private static async getToken(): Promise<string> {
        let encryptedPToken = sessionStorage.getItem('pToken');
        let payload: IPenneoTokenPayload;
        if (encryptedPToken) {
            const decryptedPTokenString = CryptoJS.AES.decrypt(encryptedPToken, encryptionKey, {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7
            }).toString(CryptoJS.enc.Utf8);

            let token = JSON.parse(decryptedPTokenString);

            if (typeof token === 'string') { // if token is still string, parse it again
                token = JSON.parse(token);
            }

            const nowUnix = Math.floor(new Date().getTime() / 1000);

            if ((token.refresh_token_expires_at - nowUnix) > 300) { // if difference between now and token expiry is more than 5 minutes use refresh token
                const refreshToken = token.refresh_token;
                payload = {
                    grant_type: 'refresh_token',
                    client_id: ClientId,
                    client_secret: ClientSecret,
                    redirect_uri: RedirectUri,
                    refresh_token: refreshToken
                };
            }
        }

        if (!payload) {
            const codeVerifier = this.generateCodeVerifier();
            const codeChallenge = await this.generateCodeChallenge(codeVerifier);
            const code = await this.authorize(codeChallenge);

            payload = {
                grant_type: 'authorization_code',
                client_id: ClientId,
                client_secret: ClientSecret,
                redirect_uri: RedirectUri,
                code_verifier: codeVerifier,
                code: code
            };
        }

        const token = await this.fetchToken(payload);

        encryptedPToken = CryptoJS.AES.encrypt(JSON.stringify(token), encryptionKey, {
            mode: CryptoJS.mode.ECB,
            padding: CryptoJS.pad.Pkcs7
        }).toString();

        sessionStorage.setItem('pToken', encryptedPToken);

        const pToken = JSON.parse(token);

        return pToken.access_token;
    }

    private static async authorize(codeChallenge: string): Promise<string> {
        const authUrl = `${AuthEndpoint}?response_type=code&client_id=${ClientId}&redirect_uri=${RedirectUri}&code_challenge=${codeChallenge}&code_challenge_method=S256`;

        const width = 600, height = 600;
        const left = (window.screen.width / 2) - (width / 2);
        const top = (window.screen.height / 2) - (height / 2);

        const popup = window.open(
            authUrl,
            'PenneoOAuth',
            `width=${width},height=${height},top=${top},left=${left},status=no,toolbar=no,menubar=no,scrollbars=yes`
        );

        if (popup) {
            return await this.getAuthorizationCode(popup);
        }
    }

    private static getAuthorizationCode(popup: Window): Promise<string> {
        return new Promise((resolve, reject) => {
            const intervalId = setInterval(() => {
                try {
                    if (popup.location.href.indexOf(RedirectUri) !== -1) {
                        clearInterval(intervalId);
                        popup.close();
                        const urlParams = new URLSearchParams(popup.location.search);
                        const code = urlParams.get('code');
                        if (code) {
                            resolve(code);
                        } else {
                            console.log('params:', popup.location.search);
                            reject(new Error('Authorization code not found'));
                        }
                    }
                } catch (err) {
                    // ignoreing cross-origin error until on same domain
                }

                if (popup.closed) {
                    clearInterval(intervalId);
                    reject(new Error('Popup closed'));
                }
            }, 500);
        });
    }

    private static async fetchToken(payload: IPenneoTokenPayload): Promise<string> {
        const jsonBody = JSON.stringify(payload);

        const requestHeaders: Headers = new Headers();
        requestHeaders.append('Content-type', 'application/json');

        const httpClientOptions: IHttpClientOptions = {
            body: jsonBody,
            headers: requestHeaders,
        };

        const response = await this.context.httpClient.post(
            TokenEndpoint,
            HttpClient.configurations.v1,
            httpClientOptions
        );

        if (response.status !== 200) {
            throw new Error(`Error fetching token: ${response.statusText}`);
        }

        return await response.text();
    }

    private static generateCodeVerifier(length: number = 128): string {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(36)).join('').substr(0, length);
    }

    private static async generateCodeChallenge(codeVerifier: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        const digest = await window.crypto.subtle.digest('SHA-256', data);
        const byteArray = Array.from(new Uint8Array(digest));
        return btoa(String.fromCharCode(...byteArray)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    }

}