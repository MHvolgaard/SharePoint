import { WebPartContext } from "@microsoft/sp-webpart-base";
import { TProperties } from "../models/TProperties";
import { SPBrowser, SPFI, spfi } from "@pnp/sp";
import "@pnp/sp/presets/all";
import { TDetailsRenderRow } from "../models/TDetailsRenderRow";
import { IRenderListDataParameters } from "@pnp/sp/presets/all";

// export const customerViewXml = `<View Scope="Recursive">
// <Query />
// <ViewFields>
//     <FieldRef Name='esdhName' />
//     <FieldRef Name='esdhNumber' />
//     <FieldRef Name='esdhSearchName' />
//     <FieldRef Name='esdhName2' />
//     <FieldRef Name='esdhAddress1' />
//     <FieldRef Name='esdhAddress2' />
//     <FieldRef Name='esdhCity' />
//     <FieldRef Name='esdhPhone' />
//     <FieldRef Name='esdhTelex' />
//     <FieldRef Name='esdhEmail' />
//     <FieldRef Name='esdhO90Number' />
// </ViewFields>
// </View>`;

// export const caseViewXml = `<View Scope="Recursive">
// <Query />
// <ViewFields>
//     <FieldRef Name='esdhNumber' />
//     <FieldRef Name='esdhDescription' />
//     <FieldRef Name='esdhStartDate' />
//     <FieldRef Name='esdhEndDate' />
//     <FieldRef Name='esdhResponsible' />
//     <FieldRef Name='esdhCustomer' />
// </ViewFields>
// </View>`;

const viewXmlWrapper = `<View Scope="Recursive">
<Query />
<ViewFields>
    {viewFields}
</ViewFields>
</View>`;

export class SPService {
    private static sp: SPFI = null;
    private static spESDH: SPFI = null;
    private static viewName: string = null;
    public static context: WebPartContext = null;

    public static init(nContext: WebPartContext, nViewName: string): void {
        this.context = nContext;
        this.viewName = nViewName;
        this.sp = spfi().using(SPBrowser({ baseUrl: nContext.pageContext.web.absoluteUrl }));
    }

    public static async getProperties(): Promise<TProperties> {
        const results: any[] = await this.sp.web.lists.getByTitle("Properties").items.top(5)(); // eslint-disable-line @typescript-eslint/no-explicit-any
        if (results.length === 0) throw new Error("No properties found");
        const properties: TProperties = {
            Site: results[0].esdhSite,
            ListID: results[0].esdhListID,
            ItemID: parseInt(results[0].esdhItemID),
            TemplateListID: results[0].esdhTemplateListID,
            Type: results[0].esdhType
        }

        for (let i = 1; i < results.length; i++) {
            await this.sp.web.lists.getByTitle("Properties").items.getById(results[i].ID).recycle();
        }

        this.spESDH = spfi().using(SPBrowser({ baseUrl: properties.Site }));
        return properties;
    }

    public static async getDetailsAsDataStream(properties: TProperties): Promise<TDetailsRenderRow[]> {
        const detailsRenderResult: TDetailsRenderRow[] = [];
        let viewXml: string = await this.spESDH.web.lists.getById(properties.ListID).views.getByTitle(this.viewName).fields.getSchemaXml();
        viewXml = viewXmlWrapper.replace("{viewFields}", viewXml);
        // console.log('viewXml', viewXml.replaceAll('<FieldRef Name="', '').replaceAll('" />', ',').split(',').filter(i => i.length > 0));

        let viewFields = await this.spESDH.web.lists.getById(properties.ListID).fields();
        viewFields = viewFields.filter(i => viewXml.includes(i.InternalName));

        // let viewXml: string = "";
        // switch (properties.Type) {
        //     case "Customer":
        //         viewXml = customerViewXml;
        //         break;
        //     case "Case":
        //         viewXml = caseViewXml;
        //         break;
        //     default:
        //         throw new Error("Unknown type");
        // }
        const renderListDataParams: IRenderListDataParameters = {
            ViewXml: viewXml,
            AddRequiredFields: false,
            RenderOptions: 7
        };
        const query = new Map<string, string>();
        query.set("FilterField1", "ID");
        query.set("FilterValue1", properties.ItemID.toString());

        const r: any = await this.spESDH.web.lists.getById(properties.ListID).renderListDataAsStream(renderListDataParams, null, query); // eslint-disable-line @typescript-eslint/no-explicit-any
        for (let i = 0; i < r.ListSchema.Field.length; i++) {
            const field = r.ListSchema.Field[i];
            const value = r.ListData.Row[0][(field.Name + (field.Type === "DateTime" ? "." : ""))];
            const description = viewFields.find(i => i.InternalName === field.Name)?.Description;
            detailsRenderResult.push({
                Field: field.Name,
                DisplayName: field.DisplayName,
                Value: value,
                Type: field.Type,
                Description: description
            });
        }

        return detailsRenderResult;
    }


}