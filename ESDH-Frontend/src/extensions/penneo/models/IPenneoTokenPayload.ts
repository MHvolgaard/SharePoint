export interface IPenneoTokenPayload {
    grant_type: string;
    client_id: string;
    client_secret: string;
    redirect_uri: string;
    code_verifier?: string;
    code?: string;
    refresh_token?: string;
}