import * as React from 'react';
import { SPService } from '../services/SPService';
import { TTemplateItem } from '../models/TTemplateItem';

export function useTemplateItems(): { templateItems: TTemplateItem[]; templateItemsLoading: boolean; refreshTemplateItems: () => Promise<void> } {
    const [templateItems, setTemplateItems] = React.useState<TTemplateItem[]>([]);
    const [templateItemsLoading, setTemplateItemsLoading] = React.useState<boolean>(true);

    React.useEffect(() => {
        refreshTemplateItems(); // eslint-disable-line @typescript-eslint/no-floating-promises
    }, [])

    async function refreshTemplateItems(): Promise<void> {
        setTemplateItemsLoading(true);

        const newTemplateItems = await SPService.getFilesOrFolders();
        setTemplateItems(newTemplateItems);

        setTemplateItemsLoading(false);
    }

    return { templateItems, templateItemsLoading, refreshTemplateItems }
}