import { WebPartContext } from "@microsoft/sp-webpart-base";
import { SPBrowser, SPFI, spfi } from "@pnp/sp";
import { IUserInfo } from "../models/IUserInfo";
import { ICustomer } from "../models/ICustomer";
import "@pnp/sp/presets/all"
import { ICase } from "../models/ICase";


export class SP {
    private static sp: SPFI = null;
    private static customerListGuid: string = null;
    private static caseListGuid: string = null;
    private static settingsListGuid: string = null;
    public static context: WebPartContext = null;

    public static init(nContext: WebPartContext, customerListGuid: string, caseListGuid: string, settingsListGuid: string): void {
        this.context = nContext;
        this.customerListGuid = customerListGuid;
        this.caseListGuid = caseListGuid;
        this.settingsListGuid = settingsListGuid;

        this.sp = spfi().using(SPBrowser({ baseUrl: nContext.pageContext.web.absoluteUrl }));
    }

    public static async getUserInfo(): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any
        let userInfo: IUserInfo = await this.sp.web.currentUser();
        const settings = await this.sp.web.lists.getById(this.settingsListGuid).items.filter(`AuthorId eq ${userInfo.Id}`)();

        if (settings.length === 0) {
            await this.sp.web.lists.getById(this.settingsListGuid).items.add({
                esdhJsonSettings: JSON.stringify({ Favorites: [], Recent: [] })
            });
            userInfo = { ...userInfo, Favorites: [], Recent: [] } as IUserInfo;
        } else {
            userInfo = { ...userInfo, ...JSON.parse(settings[settings.length - 1].esdhJsonSettings) } as IUserInfo;

            for (let i = 0; i < settings.length; i++) {
                await this.sp.web.lists.getById(this.settingsListGuid).items.getById(settings[i].Id).recycle();
            }
        }
        return userInfo;
    }

    public static async setUserSettings(userSettings: IUserInfo): Promise<void> {
        await this.sp.web.lists.getById(this.settingsListGuid).items.add({
            esdhJsonSettings: JSON.stringify({ Favorites: userSettings.Favorites, Recent: userSettings.Recent })
        });
    }

    public static async getCustomers(): Promise<ICustomer[]> {
        const customers: ICustomer[] = [];
        for await (const items of this.sp.web.lists.getById(this.customerListGuid).items.top(500)) {
            items.forEach((item) => {
                customers.push({
                    ID: item.Id,
                    Number: item.esdhNumber ?? '',
                    Name: item.esdhName ?? '',
                    Address1: item.esdhAddress1 ?? '',
                    City: item.esdhCity ?? '',
                    O90Number: item.esdhO90Number ?? '',
                    PostalCode: item.esdhPostalCode ?? '',
                    Site: item.wpSite ?? '',
                    SalesScore: item.esdhActive ? 0 : 3,
                    SiteStatus: item.esdhSiteStatus ?? ''
                });
            });
        }

        // // Add some dummy data
        // for (let i = 0; i < 200; i++) {
        //     const random = i + randomNumber(1, 5);
        //     const site = random % 4 === 0 ? 'Processing' : randomText();
        //     customers.push({
        //         ID: i,
        //         Number: i + '',
        //         Name: randomText(22),
        //         Address1: randomText(15),
        //         City: randomText(8),
        //         O90Number: randomNumber().toString(),
        //         PostalCode: parseInt(('1' + randomNumber(4).toString()).slice(-4)) + '',
        //         Site: site,
        //         SalesScore: randomNumber(1, 3)
        //     });
        // }

        return customers;
    }

    public static async getCases(): Promise<ICase[]> {
        const cases: ICase[] = [];
        for await (const items of this.sp.web.lists.getById(this.caseListGuid).items.select("*", "esdhCustomer/Id", "esdhCustomer/esdhNumber", "esdhCustomer/esdhName").expand("esdhCustomer").top(500)) {
            items.forEach((item) => {
                cases.push({
                    ID: item.Id,
                    Customer: item.esdhCustomer ? { ID: item.esdhCustomer.Id, Number: item.esdhCustomer.esdhNumber, Name: item.esdhCustomer.esdhName } : null,
                    Number: item.esdhNumber,
                    Name: item.esdhName,
                    StartDate: item.esdhStartDate ? new Date(item.esdhStartDate) : null,
                    Site: item.wpSite,
                    SiteStatus: item.esdhSiteStatus ?? ''
                });
            });
        }

        // // Add some dummy data
        // for (let i = 0; i < 200; i++) {
        //     cases.push({
        //         ID: i,
        //         Customer: { ID: i, Number: i, Name: randomText(parseInt(randomNumber(2, 10) + '')) },
        //         Number: i + '',
        //         Name: randomText(22),
        //         Site: randomText(),
        //         StartDate: randomDate(),
        //     });
        // }

        return cases;
    }

    // public static async getFavorites(): Promise<IFavorite[]> {
    //     const favorites: IFavorite[] = [];
    //     const ensureFavList = await this.sp.web.lists.ensure(this.listTitleFavorite);
    //     const favList = this.sp.web.lists.getByTitle(this.listTitleFavorite);

    //     //ensure list with title 'Favorites' already exists
    //     if (ensureFavList.created) {
    //         console.log(`Creating fields for: ${this.listTitleFavorite}...`);
    //         await favList.fields.addNumber("ItemID");
    //         await favList.fields.addText("ListName", { MaxLength: 255 });

    //         // await favList.update({ Hidden: true });
    //     }
    //     let currentUser: IUserInfo = await this.sp.web.currentUser();
    //     for await (const items of favList.items.select("*").filter(`AuthorId eq ${currentUser.Id}`).top(500)) {
    //         items.forEach((item) => {
    //             favorites.push({
    //                 // ID: item.ID,
    //                 ItemID: item.ItemID,
    //                 ListName: item.ListName
    //             });
    //         });
    //     }
    //     return favorites;
    // }

    // public static async addFavorite(item: IFavorite): Promise<void> {
    //     const foundItem = await this.findFavorite(item);

    //     if (!foundItem?.ID) {
    //         await this.sp.web.lists.getByTitle(this.listTitleFavorite).items.add({ ItemID: item.ItemID, ListName: item.ListName });
    //         console.log('Favorite added');
    //     } else {
    //         console.log('Favorite already added');
    //         console.log(foundItem);
    //     }
    // }

    // public static async removeFavorite(item: IFavorite): Promise<void> {
    //     const foundItem = await this.findFavorite(item);

    //     if (!!foundItem?.ID) {
    //         await this.sp.web.lists.getByTitle(this.listTitleFavorite).items.getById(foundItem.ID).recycle();
    //         console.log('Favorite removed');
    //     } else {
    //         console.log('Favorite not found');
    //     }
    // }

    // private static async findFavorite(item: IFavorite): Promise<IFavorite> {
    //     let currentUser: IUserInfo = await this.sp.web.currentUser();
    //     const foundItem = [];
    //     for await (const items of this.sp.web.lists.getByTitle(this.listTitleFavorite).items.select("*").filter(`AuthorId eq ${currentUser.Id} and ItemID eq ${item.ItemID} and ListName eq '${item.ListName}'`).top(500)) {
    //         items.forEach((item) => {
    //             foundItem.push({
    //                 ID: item.ID,
    //                 ItemID: item.ItemID,
    //                 ListName: item.ListName
    //             });
    //         });

    //         if (foundItem.length > 0) break;
    //     }

    //     return foundItem[0];
    // }

}