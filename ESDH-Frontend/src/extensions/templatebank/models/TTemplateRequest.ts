export type TTemplatePayload = {
    UserPrincipalName: string;
    Type: string;
    ListID: string;
    ItemID: number;
    DestinationFolderUrl: string;
    SourceFiles: TTemplatePayloadFile[]
};

export type TTemplatePayloadFile = {
    FileName: string;
    FileUrl: string;
};
