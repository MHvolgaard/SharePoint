import { Label, PrimaryButton, Spinner, SpinnerSize } from '@fluentui/react';
import * as React from 'react';
import styles from './FileCreationPanel.module.scss';
import { TTemplateFile } from '../../models/TTemplateItem';
import { LocationPath } from './LocationPath/LocationPath';
import { SPService } from '../../services/SPService';
import { TTermSet } from '../../models/TTermSet';
import AFService from '../../services/AFService';
import { AppContext } from '../../services/AppContext';
import { TBAppContext } from '../TemplateBank';
import strings from 'TemplatebankCommandSetStrings';
import { TTemplatePayload, TTemplatePayloadFile } from '../../models/TTemplateRequest';
import { getFileName } from '../../../../helpers';

export interface IFilesCreationPanelProps {
    allItems: TTemplateFile[];
    category: TTermSet;
}

export const FilesCreationPanel: React.FunctionComponent<IFilesCreationPanelProps> = (props: React.PropsWithChildren<IFilesCreationPanelProps>) => {
    const appContext: AppContext = React.useContext(TBAppContext);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [locationPath, setLocationPath] = React.useState<string[]>(null);

    async function createDocuments(): Promise<void> {
        setLoading(true);

        const multiTemplate: TTemplatePayload = {
            UserPrincipalName: appContext.currentUser,
            DestinationFolderUrl: location.origin + SPService.currentSaveDirectory,
            ListID: SPService.properties.ListID,
            ItemID: SPService.properties.ItemID,
            Type: SPService.properties.Type,
            // SourceFileUrls: props.allItems.map(i => location.origin + i.FileRef)
            SourceFiles: props.allItems.map(i => ({
                FileName: getFileName(location.origin + i.FileRef),
                FileUrl: location.origin + i.FileRef
            } as TTemplatePayloadFile))
        };

        try {
            await AFService.generateFileFromTemplates(multiTemplate)
        } catch (error) {
            alert("An error occured. Please check the console for more details (f12).");
            setLoading(false);
            return;
        }

        location.reload();
    }

    React.useEffect(() => {
        const temp = [SPService.siteTitle, SPService.listTitle];
        if (SPService.currentSaveDirectory) {
            temp.push(...SPService.currentSaveDirectory.split('/').filter(i => i.length > 0).slice(3));
        }
        setLocationPath(temp);

    }, [SPService.currentSaveDirectory])

    return (
        <>
            <div className={styles.fileCreationPanel}>
                {!!props.category &&
                    <>
                        <div className={styles.header}>
                            <Label>{strings.creationDetailsTitle}</Label>
                        </div>
                        <div className={styles.createdFileInfo}>
                            <Label>{strings.selectedCategory}</Label>
                            <Label style={{ fontWeight: "400" }} title={props.category.DefaultLabel}>{props.category.DefaultLabel}</Label>
                        </div>
                        <div className={styles.createdFileInfo}>
                            <Label>{strings.selectedTemplatesTotal}</Label>
                            <Label style={{ fontWeight: "400" }}>{props.allItems?.length ?? 0}</Label>
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.createdFileInfo}>
                            <Label style={{ paddingBottom: 0 }}>{strings.saveLocation}</Label>
                            {!!locationPath && <LocationPath locationPath={locationPath} />}
                        </div>
                        <div className={styles.creationBtns}>
                            {!!loading && <div style={{ paddingRight: 10, display: 'flex', alignItems: 'center' }}><Spinner size={SpinnerSize.medium} /></div>}
                            <PrimaryButton onClick={() => createDocuments()} disabled={!props.category || props.allItems?.length === 0 || loading}>{strings.createSelected}</PrimaryButton>
                        </div>
                    </>
                }
            </div>
        </>
    );
};