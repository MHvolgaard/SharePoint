import { SPBrowser, SPFI, spfi } from "@pnp/sp";
import "@pnp/sp/presets/all"
import { ListViewCommandSetContext } from "@microsoft/sp-listview-extensibility";
import { IUserInfo } from "../../../webparts/esdhFrontpage/models/IUserInfo";
import "@pnp/sp/batching";
import { getFileExtension } from "../../../helpers";
import { IPenneoFile } from "../models/IPenneoFile";

export class SP {
    private static sp: SPFI = null;
    public static context: ListViewCommandSetContext = null;

    public static init(nContext: ListViewCommandSetContext): void {
        this.context = nContext;

        this.sp = spfi().using(SPBrowser({ baseUrl: nContext.pageContext.web.absoluteUrl }));
    }

    public static async getCurrentUser(): Promise<IUserInfo> {
        return await this.sp.web.currentUser();
    }

    public static async getSelectedItems(ids: number[]): Promise<any[]> { // eslint-disable-line @typescript-eslint/no-explicit-any
        const items: IPenneoFile[] = [];

        const [batchedWeb, execute] = this.sp.web.batched();

        const results = [];
        for (let i = 0; i < ids.length; i++) {
            batchedWeb.lists.getByTitle("Documents").items.getById(ids[i]).select("*", "FileLeafRef", "FileRef", "FileSystemObjectType")().then(r => results.push(r)); // eslint-disable-line @typescript-eslint/no-floating-promises
        }

        await execute();

        for (let i = 0; i < results.length; i++) {
            items.push({
                Id: results[i].Id,
                Name: results[i].FileLeafRef,
                ServerRelativeUrl: results[i].FileRef,
                IsValid: getFileExtension(results[i].FileLeafRef) === "pdf",
                isFolder: parseInt(results[i].FileSystemObjectType) === 1
            } as IPenneoFile);
        }

        return items;
    }
}