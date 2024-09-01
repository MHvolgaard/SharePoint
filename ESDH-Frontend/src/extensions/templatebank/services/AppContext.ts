import { TTemplateItem } from "../models/TTemplateItem";
import { TTermSet } from "../models/TTermSet";

export interface AppContext {
    currentUser: string;
    templateItems: TTemplateItem[];
    refreshTemplateItems: () => Promise<void>
    selectedFile: TTemplateItem;
    setSelectedFile(file: TTemplateItem): void;
    termSets: TTermSet[];
}