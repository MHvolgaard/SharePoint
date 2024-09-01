import * as React from 'react';
import { DefaultButton, Label, SearchBox } from '@fluentui/react';
import { TBAppContext } from '../TemplateBank';
import { SidePanel } from '../SidePanel/SidePanel';
import styles from './AdvancedTemplatesView.module.scss';
import { TermSetViewer } from '../TermSetViewer/TermSetViewer';
import { AppContext } from '../../services/AppContext';
import { TTemplateFile } from '../../models/TTemplateItem';
import { TemplateList } from '../TemplateList/TemplateList';
import { FilesCreationPanel } from '../SidePanel/FilesCreationPanel';
import { getAllChildrenCategories } from '../../helpers/Helpers';
import strings from 'NetipTemplateBankCommandSetStrings';

export interface IAdvancedTemplatesViewProps { }

export const AdvancedTemplatesView: React.FunctionComponent<IAdvancedTemplatesViewProps> = (props: React.PropsWithChildren<IAdvancedTemplatesViewProps>) => {
    const appContext: AppContext = React.useContext(TBAppContext);
    const [selectedCategory, setSelectedCategory] = React.useState<string>(null);
    const [searchText, setSearchText] = React.useState<string>('');
    const [optionalList, setOptionalList] = React.useState<TTemplateFile[]>([]);
    const [requiredList, setRequiredList] = React.useState<TTemplateFile[]>([]);

    React.useEffect(() => {
        const allRelevantCategories = getAllChildrenCategories(appContext.termSets.find(i => i.Id === selectedCategory), appContext.termSets);

        let required = appContext.templateItems?.filter(i => {
            if (i.ItemType === 'Folder') return false;
            if (i.RequiredInTemplateSets.some(i => allRelevantCategories.includes(i))) return true;
            return false;
        });
        required = required.sort((a: TTemplateFile, b: TTemplateFile) => a.Name < b.Name ? -1 : a.Name > b.Name ? 1 : 0);

        let optional = appContext.templateItems?.filter(i => {
            if (i.ItemType === 'Folder') return false;
            if (i.TemplateSets.some(i => allRelevantCategories.includes(i))) return true;
            return false;
        });
        optional = [...optional].filter(i => required.filter(a => a.ID === i.ID).length === 0); // remove if exists in required
        optional = optional.sort((a: TTemplateFile, b: TTemplateFile) => a.Name < b.Name ? -1 : a.Name > b.Name ? 1 : 0);

        setRequiredList((required as TTemplateFile[]).map(i => { i.IsSelected = true; return i; }));
        setOptionalList((optional as TTemplateFile[]).map(i => { i.IsSelected = true; return i; }));

    }, [selectedCategory]);

    return (
        <div className={styles.advancedTemplatesView}>
            <div className={styles.mainColumn}>
                <div className={styles.listTermSets}>
                    <div className={styles.header}>
                        <Label>{strings.templateCategoriesTitle}</Label>
                        <SearchBox placeholder={strings.searchCategory} onChange={(e, v) => setSearchText(v)} value={searchText} className={styles.searchbox} />
                    </div>
                    <TermSetViewer onSelected={setSelectedCategory} onCancel={() => setSelectedCategory(null)} searchText={searchText} />
                </div>
                <div className={styles.divider} />
                <div className={styles.listFiles}>
                    <div className={styles.header}>
                        <Label>{strings.selectedCategoryTemplatesTitle}</Label>
                        <div className={styles.row}>
                            <DefaultButton text={strings.selectAll}
                                iconProps={{ iconName: 'CheckboxComposite' }}
                                disabled={optionalList?.length === 0}
                                onClick={() => setOptionalList(prev => prev.map(i => { i.IsSelected = true; return i; }))}
                            />
                            <DefaultButton text={strings.deselectAll}
                                iconProps={{ iconName: 'Checkbox' }}
                                disabled={optionalList?.length === 0}
                                onClick={() => setOptionalList(prev => prev.map(i => {
                                    if (i.RequiredInTemplateSets.filter(i => i === selectedCategory).length > 0) return i;
                                    i.IsSelected = false;
                                    return i;
                                }))}
                            />
                        </div>
                    </div>
                    <TemplateList category={selectedCategory}
                        optionalList={optionalList}
                        requiredList={requiredList}
                        setTemplateList={setOptionalList}
                    />
                </div>

            </div>
            <SidePanel>
                <FilesCreationPanel
                    allItems={requiredList?.concat(optionalList?.filter(i => i.IsSelected === true))}
                    category={!!selectedCategory ? appContext.termSets?.find(t => t.Id === selectedCategory) : null}
                />
            </SidePanel>
        </div>
    );
};