export interface IPenneoFunctionPayload {
    Token?: string;
    Hmac?: string;
    SiteUrl?: string;
    ListId?: string;
    FolderUrl: string;
    CasefileName: string;
    Files: IPenneoFunctionPayloadFile[];
}

export interface IPenneoFunctionPayloadFile {
    Id: number;
    Name: string;
    ServerRelativeUrl: string;
}