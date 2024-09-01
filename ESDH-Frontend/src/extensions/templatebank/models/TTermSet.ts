export type TTermSet = {
    Id: string;
    DefaultLabel: string;
    Labels: { IsDefault: boolean, Name: string, LanguageTag: string }[];
    ParentId?: string;
    NumberOfChildren: number;
    IsOpen: boolean;
}