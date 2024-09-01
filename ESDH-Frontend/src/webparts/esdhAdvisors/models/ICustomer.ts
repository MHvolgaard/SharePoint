export interface ICustomer {
    ID: number;
    Number: string;
    Name: string;
    O90Number: string;
    Address1: string;
    PostalCode: string;
    City: string;
    Site: string;
    SalesScore?: number;
    Favorite?: boolean;
    Recent?: boolean;
    Team?: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
}