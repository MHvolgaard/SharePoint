import { TTemplateItem } from "../models/TTemplateItem";
import { TTermSet } from "../models/TTermSet";
import { SPService } from "../services/SPService";

// https://learn.microsoft.com/en-us/office/client-developer/office-uri-schemes
export function getFileUriScheme(fileExtension: string): string {
	switch (fileExtension) {
		case "doc":
		case "docm":
		case "docx":
		case "docb":
		case "dotx":
			return "ms-word";

		case "ppt":
		case "pptm":
		case "pptx":
		case "sldx":
		case "sldm":
			return "ms-powerpoint";

		case "xlc":
		case "xls":
		case "xlsb":
		case "xlsm":
		case "xltm":
		case "xlsx":
		case "xlw":
			return "ms-excel";

		// https://learn.microsoft.com/en-us/office/client-developer/visio/introduction-to-the-visio-file-formatvsdx
		case "vsdx":
		case "vsdm":
		case "vssx":
		case "vssm":
		case "vstx":
		case "vstm":
			return "ms-visio";

		// https://en.wikipedia.org/wiki/Microsoft_Access#File_extensions
		case "accdb":
		case "mdb":
			return "ms-access";

		// https://support.microsoft.com/en-us/office/file-formats-supported-by-project-desktop-face808f-77ab-4fce-9353-14144ba1b9ae#ID0EBBF=Newer_versions
		case "mpp":
		case "mpt":
			return "ms-project";

		case "pub":
			return "ms-publisher";

		// Sharepoint Designer
		// // https://www.file-extensions.org/office-sharepoint-designer-file-extensions
		// // https://www.pcmatic.com/company/libraries/fileextension/application.asp?appname=spdesign.exe.html
		// case "":
		// 	return "ms-spd";

		// https://www.file-extensions.org/microsoft-infopath-file-extensions
		case "infopathxml":
		case "xsn":
		case "xtp2":
			return "ms-infopath";

		default:
			return null;
	}
}

export function getFileType(fileLeafRef: string): string {
	const fileType = fileLeafRef.substring(fileLeafRef.lastIndexOf(".") + 1).toLowerCase();
	return fileType;
}


// export function getIcon(fileLeafRef: string, isFolder?: boolean): string {
// 	if (!fileLeafRef) return styles.defaultIcon;
// 	if (!!isFolder) return styles.folderIcon;
// 	const fileType = getFileType(fileLeafRef);

// 	switch (fileType) {
// 		//Word
// 		case "doc":
// 		case "docm":
// 		case "docx":
// 		case "docb":
// 		case "dotx":
// 			return styles.wordIcon;

// 		//PDF
// 		case "pdf":
// 			return styles.pdfIcon;

// 		//Excel
// 		case "xlc":
// 		case "xls":
// 		case "xlsb":
// 		case "xlsm":
// 		case "xltm":
// 		case "xlsx":
// 		case "xlw":
// 			return styles.excelIcon;

// 		//PowerPoint
// 		case "ppt":
// 		case "pptm":
// 		case "pptx":
// 		case "sldx":
// 		case "sldm":
// 			return styles.powerPointIcon;

// 		//Images
// 		case "png":
// 		case "jpg":
// 		case "jpeg":
// 			return styles.imageIcon;

// 		//EMail
// 		case "msg":
// 		case "eml":
// 			return styles.mailIcon;

// 		default:
// 			return styles.defaultIcon;
// 	}
// }


export function formatLongDate(date: Date): string {
	return date.getDate() + ". " + date.toLocaleString(SPService.uiCulture, { month: 'long' }) + " " + date.getFullYear();
}

export function formatLongDateTime(date: Date): string {
	return date.getDate() + ". " + date.toLocaleString(SPService.uiCulture, { month: 'long' }) + " " + date.getFullYear() + " " + ('0' + (date.getHours())).slice(-2) + ":" + ('0' + (date.getMinutes())).slice(-2);
}

export function formatShortDate(date: Date): string {
	if (!date) return null;
	let d: string | number = date.getDate();
	let m: string | number = date.getMonth() + 1;

	if (Math.floor(d / 10) === 0) d = "0" + d;
	if (Math.floor(m / 10) === 0) m = "0" + m;

	return d + "/" + m + "/" + date.getFullYear();
}

export function checkFilenameRequirements(input: string): string {
	if (!input) return null;

	if (input.length > 100) {
		return "The name exceeded the maximum amount of characters";
	}

	const spoIllegalCharacters: RegExp = /["*:<>?/\\|]+/g;

	const matches: string[] = input.match(spoIllegalCharacters) ?? null;
	if (!matches || matches.length === 0) return null;

	let uniqueChars = "";
	for (let i = 0; i < matches.length; i++) {
		for (let j = 0; j < matches[i].length; j++) {
			const char = matches[i].charAt(j);
			if (uniqueChars.indexOf(char) === -1) {
				uniqueChars += char;
			}
		}
	}

	if (uniqueChars.length > 0) {
		return "The name contains illegal characters. " + uniqueChars;
	}
}


export function getAllFolderFiles(folder: TTemplateItem, allItems: TTemplateItem[]): TTemplateItem[] {
	if (folder.ItemType === "File") return null;

	return allItems.filter((f) => {
		if (f.FileDirRef.search(folder.FileRef) === 0) {
			return f;
		}
	})
}

export function getAllParentCategories(termSet: TTermSet, termSets: TTermSet[]): string[] {
	if (!termSet) return [];

	const parentCategories: string[] = [];
	let parent = termSet;
	while (parent) {
		parentCategories.push(parent.Id);
		parent = termSets.find(i => i.Id === parent.ParentId);
	}

	return parentCategories;
}

export function getAllChildrenCategories(termSet: TTermSet, termSets: TTermSet[]): string[] {
	if (!termSet || !termSets) return [];

	let childrenCategories = [termSet.Id];
	const children = termSets.filter(i => i.ParentId === termSet?.Id);
	children.forEach(i => { childrenCategories = childrenCategories.concat(getAllChildrenCategories(i, termSets)) });

	return childrenCategories;
}
