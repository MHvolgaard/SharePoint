import { WebPartContext } from "@microsoft/sp-webpart-base";
import { SPBrowser, SPFI, spfi } from "@pnp/sp";
import "@pnp/sp/presets/all"
import { randomNumber } from "../../../helpers";
import { TProperties } from "../models/TProperties";
import { ICustomer } from "../models/ICustomer";
import "@pnp/graph/users";
import { MSGraph } from "./MSGraph";

export class SP {
    private static sp: SPFI = null;
    private static spESDH: SPFI = null;
    public static context: WebPartContext = null;

    public static init(nContext: WebPartContext): void {
        this.context = nContext;
        this.sp = spfi().using(SPBrowser({ baseUrl: nContext.pageContext.web.absoluteUrl }));
    }

    public static async getProperties(): Promise<TProperties> {
        const results: any[] = await this.sp.web.lists.getByTitle("Properties").items.top(5)(); // eslint-disable-line @typescript-eslint/no-explicit-any
        if (results.length === 0) throw new Error("No properties found");
        const properties: TProperties = {
            Site: results[0].esdhSite,
            ListID: results[0].esdhListID,
            ItemID: parseInt(results[0].esdhItemID),
            ControlSite: results[0].esdhAdminSite ?? '',
            TemplateListID: results[0].esdhTemplateListID,
            Type: results[0].esdhType
        }

        for (let i = 1; i < results.length; i++) {
            await this.sp.web.lists.getByTitle("Properties").items.getById(results[i].ID).recycle();
        }

        this.spESDH = spfi().using(SPBrowser({ baseUrl: properties.Site }));
        return properties;
    }

    public static async getCustomer(listId: string, id: number): Promise<ICustomer> {
        if (!this.spESDH) {
            console.error("Properties not set");
            return;
        }

        const team: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any

        const users = await MSGraph.getUsers();

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            if (team.length > 5) break;
            if ((i + randomNumber(1, 30)) % 5 === 0) {
                if (user.displayName.indexOf(' ') === -1 ||
                    !user.mail ||
                    user.displayName.toLowerCase().indexOf('salg') > -1 ||
                    user.displayName?.toLowerCase().indexOf('book') > -1 ||
                    user.displayName?.toLowerCase().indexOf('test') > -1 ||
                    user.displayName?.toLowerCase().indexOf('demo') > -1 ||
                    user.displayName?.toLowerCase().indexOf('lava') > -1) continue;

                team.push({
                    ID: user.id,
                    Name: user.displayName,
                    Email: user.mail,
                    Title: user.jobTitle ?? 'Rådgiver',
                });
            }
        }

        const item = await this.spESDH.web.lists.getById(listId).items.getById(id).select('*')();
        const customer: ICustomer = {
            ID: item.Id,
            Number: item.esdhNumber,
            Name: item.esdhName,
            Address1: item.esdhAddress1,
            City: item.esdhCity,
            O90Number: item.esdhO90Number,
            PostalCode: item.esdhPostalCode,
            Site: item.esdhSite,
            Team: team
        }

        return customer;
    }

}