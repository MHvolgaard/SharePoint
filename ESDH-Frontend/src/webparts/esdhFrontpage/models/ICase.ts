export interface ICase {
    ID: number;
    Customer: { ID: number, Number: number, Name: string };
    Number: string;
    Name: string;
    StartDate: Date;
    Site: string;
    AssignedTo?: number;
    Favorite?: boolean;
    SiteStatus?: string;
}