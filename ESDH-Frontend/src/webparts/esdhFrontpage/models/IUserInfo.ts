import { ISiteUserInfo } from "@pnp/sp/presets/all";

export interface IUserInfo extends ISiteUserInfo {
    // UserInfo: ISiteUserInfo;
    Favorites: IUserItem[];
    Recent: IUserItem[];
}

export interface IUserItem {
    Type: string,
    Number: number,
    Name: string
}