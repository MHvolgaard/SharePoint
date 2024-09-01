export type TTemplateFile = {
    ItemType: "File";
    ID: number;
    Name: string;
    FileRef: string;
    FileDirRef: string;
    Version: string;
    Author: string;
    Editor: string;
    Modified: Date;
    RequiredInTemplateSets: string[];
    TemplateSets: string[];
    IsSelected?: boolean;
    EmbedUri: string;
}

export type TTemplateFolder = {
    ItemType: "Folder";
    ID: number;
    Name: string;
    FileRef: string;
    FileDirRef: string;
}


export type TTemplateItem = (TTemplateFile | TTemplateFolder);