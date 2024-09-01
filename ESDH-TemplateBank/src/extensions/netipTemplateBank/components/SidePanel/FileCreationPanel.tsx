import { ActionButton, DefaultButton, Label, PrimaryButton, Spinner, SpinnerSize, TextField, flatten } from '@fluentui/react';
import * as React from 'react';
import { SPService } from '../../services/SPService';
import { checkFilenameRequirements, formatLongDateTime, getFileType, getFileUriScheme, getIcon } from '../../helpers/Helpers';
import styles from './FileCreationPanel.module.scss';
import { TTemplateFile, TTemplateItem } from '../../models/TTemplateItem';
import { TSingleTemplateRequest } from '../../models/TTemplateRequest';
import { LocationPath } from './LocationPath/LocationPath';
import { CustomModal } from '../Modal/CustomModal';
import AFService from '../../services/AFService';
import { AppContext } from '../../services/AppContext';
import { TBAppContext } from '../TemplateBank';
import strings from 'NetipTemplateBankCommandSetStrings';

export interface IFileCreationPanelProps {
	selectedItem: TTemplateItem;
}

export const FileCreationPanel: React.FunctionComponent<IFileCreationPanelProps> = (props: React.PropsWithChildren<IFileCreationPanelProps>) => {
	const appContext: AppContext = React.useContext(TBAppContext);
	const [fileName, setFileName] = React.useState<string>(null);
	const [loading, setLoading] = React.useState<boolean>(false);
	const [showModal, setShowModal] = React.useState<boolean>(false);
	// const [previewLink, setPreviewLink] = React.useState<string>(null);
	const [locationPath, setLocationPath] = React.useState<string[]>(null);
	const [isImage, setIsImage] = React.useState<boolean>(false);

	React.useEffect(() => {
		if (!props.selectedItem) return;
		setFileName(props.selectedItem.Name.replace(`.${getFileType(props.selectedItem.Name)}`, ''));
		setIsImage(props.selectedItem?.Name.indexOf('.jpg') > -1 || props.selectedItem?.Name.indexOf('.jpeg') > -1 || props.selectedItem?.Name.indexOf('.png') > -1);

		const temp = [SPService.siteTitle, SPService.listTitle];
		if (SPService.currentSaveDirectory) temp.push(...SPService.currentSaveDirectory.split('/').filter(i => i.length > 0).slice(3));
		setLocationPath(temp);

		// https://<tenant>.sharepoint.com/sites/TemplateBank/_layouts/15/Doc.aspx?sourcedoc=/sites/TemplateBank/TemplateBank/Presentation.pptx&action=interactivepreview
		// const makePreviewLink = SPService.properties.ControlSite + "/_layouts/15/Doc.aspx?sourcedoc=" + props.selectedItem.FileRef + "&action=interactivepreview";
		// setPreviewLink(makePreviewLink);
	}, [props.selectedItem])

	async function openDocument(path: string, ending: string): Promise<void> {
		let openBrowser = false;
		if (await SPService.getDLFileOpenSettings()) {
			openBrowser = true;
		} else {
			const uriScheme: string = getFileUriScheme(ending.substring(1));
			if (!!uriScheme) {
				window.open(uriScheme + ":ofe|u|" + path, "_blank"); // open in desktop app. https://learn.microsoft.com/en-us/office/client-developer/office-uri-schemes
			} else {
				openBrowser = true;
			}
		}

		if (openBrowser) {
			window.open(path + "?web=1", '_blank');
		}
	}

	async function createDocument(open: boolean): Promise<void> {
		setLoading(true);

		const singleTemplate: TSingleTemplateRequest = {
			UserPrincipalName: appContext.currentUser,
			DestinationFolderUrl: location.origin + SPService.currentSaveDirectory,
			ListID: SPService.properties.ListID,
			ItemID: SPService.properties.ItemID,
			Type: SPService.properties.Type,
			FileName: fileName + "." + getFileType((props.selectedItem as TTemplateFile).Name),
			SourceFileUrl: location.origin + props.selectedItem.FileRef
		};

		let response: { fileUrl: string, folderUrl: string };
		try {
			response = await AFService.singleTemplate(singleTemplate)
		} catch (error) {
			alert("An error occured. Please check the console for more details (F12).");
			setLoading(false);
			return;
		}

		if (open) {
			await openDocument(response.fileUrl, "." + getFileType((props.selectedItem as TTemplateFile).Name));
		}

		location.reload();
	}

	const nameErrorMsg = checkFilenameRequirements(fileName);

	return (
		<>
			<div className={styles.fileCreationPanel}>
				{props.selectedItem?.ItemType === "File" &&
					<>
						<div className={styles.header}>
							<Label>{strings.creationDetailsTitle}</Label>
						</div>
						<div className={styles.fileInfo}>
							<div className={styles.fileInfoRow}>
								<Label>{strings.file}</Label>
								<div className={styles.fileRow}>
									<div className={getIcon(props.selectedItem.Name)} style={{ margin: 0 }} />
									<Label title={props.selectedItem.Name}>{props.selectedItem.Name}</Label>
								</div>
							</div>
							<div className={styles.fileInfoRow}>
								<Label>{strings.modified}</Label>
								<Label>{formatLongDateTime(props.selectedItem.Modified)}</Label>
							</div>
							<div className={styles.fileInfoRow}>
								<Label>{strings.version}</Label>
								<Label>{props.selectedItem.Version}</Label>
							</div>

						</div>
						<div className={styles.previewBtnContainer}>
							{props.selectedItem && <ActionButton iconProps={{ iconName: 'Search' }} label={strings.preview} onClick={() => setShowModal(true)} text={strings.previewFile} />}
						</div>
						<div className={styles.divider} />
						<div className={styles.createdFileInfo}>
							<TextField label={strings.newFilename} onChange={(e, v) => setFileName(v)} value={fileName} onGetErrorMessage={() => { if (nameErrorMsg) return nameErrorMsg }} suffix={'.' + getFileType(props.selectedItem.Name)} />
							<Label style={{ marginTop: 20, paddingBottom: 0 }}>{strings.saveLocation}</Label>
							{!!locationPath && <LocationPath locationPath={locationPath} />}
						</div>
						<div className={styles.creationBtns}>
							{!!loading && <div style={{ paddingRight: 10, display: 'flex', alignItems: 'center' }}><Spinner size={SpinnerSize.medium} /></div>}
							<PrimaryButton disabled={fileName?.length === 0 || !!nameErrorMsg || loading} onClick={() => createDocument(true)}>{strings.createAndOpen}</PrimaryButton>
							<DefaultButton disabled={fileName?.length === 0 || !!nameErrorMsg || loading} onClick={() => createDocument(false)}>{strings.create}</DefaultButton>
						</div>
					</>
				}
			</div>


			<CustomModal // Modal for previewing files
				showModal={showModal}
				onDismiss={() => setShowModal(false)}
				contentStyle={{ height: 'calc(100% - 50px)', maxHeight: '600px', width: 'calc(100% - 50px)', maxWidth: '600px', padding: 20 }}
			>

				{isImage && <div className={styles.previewImage} style={!!(props.selectedItem as TTemplateFile)?.FileRef ? { backgroundImage: `url("${(props.selectedItem as TTemplateFile).FileRef}")` } : {}} />}

				{!isImage && <>
					{!(props.selectedItem as TTemplateFile)?.EmbedUri && <Label>Preview not available for this file</Label>}
					{!!(props.selectedItem as TTemplateFile)?.EmbedUri && <iframe height="100%" width="100%" src={(props.selectedItem as TTemplateFile)?.EmbedUri} frameBorder={0} scrolling="no" />}

				</>}

				{/* {!isImage && <iframe height="100%" width="100%" src={previewLink} frameBorder={0} scrolling="no" />}
				{isImage && <div className={styles.previewImage} style={!!props.selectedItem?.FileRef ? { backgroundImage: `url("${props.selectedItem?.FileRef}")` } : {}} />} */}
			</CustomModal>
		</>
	);
};