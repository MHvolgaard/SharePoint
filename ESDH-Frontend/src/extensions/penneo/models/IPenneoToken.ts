export interface IPenneoToken {
    token_type: string;
    access_token: string;
    expires_in: number;
    refresh_token: string;
    access_token_expires_at: number;
    refresh_token_expires_at: number;
}