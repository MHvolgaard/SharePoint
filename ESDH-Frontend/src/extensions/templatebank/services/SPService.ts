import { ListViewCommandSetContext } from "@microsoft/sp-listview-extensibility";
import { SPBrowser, SPFI, spfi } from "@pnp/sp";
import "@pnp/sp/presets/all";
import "@pnp/graph/presets/all";
import { TTemplateItem } from "../models/TTemplateItem";
import { TProperties } from "../models/TProperties";
import { TTermSet } from "../models/TTermSet";
import { GraphFI, SPFx, graphfi } from "@pnp/graph";
import { IOrderedTermInfo } from "@pnp/graph/taxonomy/types";
import { dateAdd, PnPClientStorage } from "@pnp/core";

export class SPService {
	private static sp: SPFI;
	private static spTemplate: SPFI;
	public static graph: GraphFI;

	public static uiCulture: string;
	public static context: ListViewCommandSetContext;
	public static rootSiteUrl: string;
	public static controlSiteUrl: string;
	public static siteTitle;
	public static listTitle;
	public static properties: TProperties;
	public static termSets: TTermSet[];
	public static currentSaveDirectory: string; // where to save new folders. Gets set everytime the directory changes in the FileView og TemplatesView.

	public static async init(context: ListViewCommandSetContext): Promise<boolean> {
		this.context = context;
		const url = new URL(this.context.pageContext.web.absoluteUrl);
		this.rootSiteUrl = url.origin;
		this.uiCulture = context.pageContext.cultureInfo.currentUICultureName;
		try {
			this.sp = spfi().using(SPBrowser({ baseUrl: context.pageContext.web.absoluteUrl }));
			this.properties = await this.getProperties();

			this.graph = graphfi().using(SPFx(context));
			this.spTemplate = spfi().using(SPBrowser({ baseUrl: this.properties.ESDHSite }));
			const templateList = await this.spTemplate.web.lists.getById(this.properties.TemplateListID).select("Title, RootFolder/ServerRelativeUrl").expand('RootFolder')();
			this.properties = { ...this.properties, TemplateListName: templateList.Title, TemplateListUrl: templateList.RootFolder.ServerRelativeUrl };
			const web = await this.sp.web();
			this.siteTitle = web.Title;
			this.listTitle = context.listView.list.title;
		} catch (error) {
			console.error(error);
			return false;
		}

		return true;
	}

	public static updateCurrentDirectory(path: string): void {
		this.currentSaveDirectory = path;
	}

	public static async getCurrentUser(): Promise<string> {
		const user = await this.sp.web.currentUser();
		return user.UserPrincipalName;
	}

	public static async getProperties(): Promise<TProperties> {
		const results: any[] = await this.sp.web.lists.getByTitle("Properties").items.top(5)(); // eslint-disable-line @typescript-eslint/no-explicit-any

		if (results.length === 0) throw new Error("No properties found");
		const properties: TProperties = {
			ESDHSite: results[0].esdhSite,
			ListID: results[0].esdhListID,
			ItemID: results[0].esdhItemID,
			TemplateListID: results[0].esdhTemplateListID,
			Type: results[0].esdhType,
			TemplateListName: "",
			TemplateListUrl: ""
		}

		for (let i = 1; i < results.length; i++) {
			const item = results[i];
			await this.sp.web.lists.getByTitle("Properties").items.getById(item.ID).recycle();
		}

		return properties;
	}

	public static getUrlOrigin(): string {
		const url = new URL(this.context.pageContext.web.absoluteUrl);
		return url.origin;
	}


	public static async getFilesOrFolders(): Promise<TTemplateItem[]> {
		// const items = await this.spTemplate.web.lists.getById(this.properties.TemplateListID).items
		// 	.select("esdhActive", "esdhRequiredInTemplateSets", "esdhTemplateSets", "FileRef", "FileLeafRef", "FileDirRef", "ID", "FileSystemObjectType", "OData__UIVersionString", "Modified", "EditorId", "AuthorId", 'ServerRedirectedEmbedUri')
		// 	.getAll();

		const items: any[] = []; // eslint-disable-line @typescript-eslint/no-explicit-any
		const select: string[] = ["esdhActive", "esdhRequiredInTemplateSets", "esdhTemplateSets", "FileRef", "FileLeafRef", "FileDirRef", "ID", "FileSystemObjectType", "OData__UIVersionString", "Modified", "EditorId", "AuthorId", 'ServerRedirectedEmbedUri'];

		for await (const item of this.spTemplate.web.lists.getById(this.properties.TemplateListID).items.select(select.join(',')).top(500)) {
			items.push(...item);
		}

		const mapped: TTemplateItem[] = items
			.filter(i => i.FileSystemObjectType !== 1 && i.esdhActive || i.FileSystemObjectType === 1)
			.map((i) => {
				if (i.FileSystemObjectType === 1) { // folder
					return {
						ItemType: "Folder",
						ID: i.ID,
						Name: i.FileLeafRef,
						FileRef: i.FileRef,
						FileDirRef: i.FileDirRef
					}
				}

				return {
					ItemType: "File",
					ID: i.Id,
					Name: i.FileLeafRef,
					FileRef: i.FileRef,
					FileDirRef: i.FileDirRef,
					Version: i.OData__UIVersionString,
					Author: i.AuthorId,
					Editor: i.EditorId,
					Modified: new Date(i.Modified),
					RequiredInTemplateSets: i.esdhRequiredInTemplateSets.map((m) => m.TermGuid as string),
					TemplateSets: i.esdhTemplateSets.map((m) => m.TermGuid as string),
					EmbedUri: i.ServerRedirectedEmbedUri
				}
			});

		return mapped;
	}

	public static async getDLFileOpenSettings(): Promise<boolean> {
		const result: any = await this.sp.web.lists.getById(this.context.listView.list.guid.toString()).select("DefaultItemOpenInBrowser")(); // eslint-disable-line @typescript-eslint/no-explicit-any
		return result.DefaultItemOpenInBrowser;
	}

	private static termSetList: TTermSet[] = [];
	public static async getTermSetList(): Promise<TTermSet[]> {
		if (!!this.termSets) return this.termSets;

		const termSet: any = await this.spTemplate.web.lists.getById(this.properties.TemplateListID).fields.getByInternalNameOrTitle("esdhTemplateSets").select("TermSetId")(); // eslint-disable-line @typescript-eslint/no-explicit-any
		const templateSite = await this.spTemplate.site();

		const adminSite = this.graph.sites.getById(templateSite.Id);

		const store = new PnPClientStorage();

		const childTree: IOrderedTermInfo[] = await store.local.getOrPut("templatesTermSetTree", () => {
			return adminSite.termStore.sets.getById(termSet.TermSetId).getAllChildrenAsTree();
		}, dateAdd(new Date(), "day", 1));

		// const childTree: IOrderedTermInfo[] = await adminSite.termStore.sets.getById(termSet.TermSetId).getAllChildrenAsTree();

		childTree.map(t => this.flattenTree(t, null));
		this.termSets = this.termSetList;

		return this.termSetList;
	}

	private static flattenTree(termSet: IOrderedTermInfo, parentId?: string): void {
		const TermSet: TTermSet = {
			DefaultLabel: termSet.defaultLabel,
			Id: termSet.id,
			Labels: termSet.labels.map(l => { return { LanguageTag: l.languageTag, Name: l.name, IsDefault: l.isDefault } }),
			IsOpen: false,
			ParentId: parentId,
			NumberOfChildren: termSet.children.length
		}

		termSet.children.map(t => this.flattenTree(t as IOrderedTermInfo, termSet.id));
		this.termSetList.push(TermSet);
	}
}