export type TTemplateRequest = {
    UserPrincipalName: string;
    Type: string;
    ListID: string;
    ItemID: number;
    DestinationFolderUrl: string;
};

export type TSingleTemplateRequest = TTemplateRequest & {
    FileName: string;
    SourceFileUrl: string;
};

export type TMultiTemplateRequest = TTemplateRequest & {
    SourceFileUrls: string[];
};
