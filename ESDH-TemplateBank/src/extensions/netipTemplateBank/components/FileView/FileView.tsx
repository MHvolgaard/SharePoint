import { Breadcrumb, IBreadcrumbItem, Icon } from '@fluentui/react';
import * as React from 'react';
import styles from './FileView.module.scss';
import { FileListItem } from './FileListItem'
import { AppContext } from '../../services/AppContext';
import { TBAppContext } from '../TemplateBank';
import { TTemplateItem } from '../../models/TTemplateItem';
import { useSorting } from '../../hooks/useSorting';
import { ListHeader } from '../ListHeader/ListHeader';
import strings from 'NetipTemplateBankCommandSetStrings';

export interface IFileViewProps {
	templateItems: TTemplateItem[];
	rowClicked: (item: TTemplateItem) => void;
	rootName?: string;
	rootDirectory?: string;
}

export const FileView: React.FunctionComponent<IFileViewProps> = (props: React.PropsWithChildren<IFileViewProps>) => {
	const appContext: AppContext = React.useContext(TBAppContext);
	const [breadcrumbs, setBreadcrumbs] = React.useState<IBreadcrumbItem[]>(null);
	const [sortedList, sortField, isAsc, updateSorting] = useSorting<TTemplateItem>(props.templateItems, 'Name', true);

	React.useEffect(() => {
		setBreadcrumbs([{
			text: props.rootName,
			key: props.rootDirectory,
			onClick: () => { removeBreadcrumb(props.rootDirectory) }
		}])
	}, []);

	React.useEffect(() => {
		appContext.setSelectedFile(null);
	}, [breadcrumbs]);

	function rowClicked(row: TTemplateItem): void {
		if (row.ItemType === "Folder") {
			addBreadcrumb(row);
			appContext.setSelectedFile(null);
		} else {
			if (appContext.selectedFile !== row) appContext.setSelectedFile(row);
		}
	}

	function addBreadcrumb(item: TTemplateItem): void {
		if (item.ItemType !== "Folder") return;
		setBreadcrumbs([...breadcrumbs, { text: item.Name, key: item.FileRef, onClick: () => { removeBreadcrumb(item.FileRef) } }]);
	}

	function removeBreadcrumb(fileRef: string): void {
		setBreadcrumbs(prev => prev?.filter(d => d?.key.length <= fileRef.length));
	}

	if (!breadcrumbs) return <></>;
	return (
		<>
			<div className={styles.fileViewHeader} >
				{!!breadcrumbs && <Breadcrumb
					items={breadcrumbs}
					maxDisplayedItems={2}
					overflowIndex={0}
					styles={{ root: { margin: '0px 0px 1px;' } }}
					className={styles.breadcrumbs}
				/>}
				<div>
					{props.children}
				</div>
			</div>

			<div className={styles.filesContainer}>
				<div className={styles.fofHeader}>
					<div />
					<div style={{ justifyContent: "center" }}>
						<Icon style={{ fontSize: 18 }} iconName='Page' />
					</div>
					<ListHeader title={strings.filename} field='Name' isAsc={isAsc} sortingBy={sortField} updateSorting={updateSorting} />
					<ListHeader title={strings.modified} field='Modified' isAsc={isAsc} sortingBy={sortField} updateSorting={updateSorting} />
				</div>
				{sortedList?.map((file) => {
					if (breadcrumbs?.length > 0 && file.FileDirRef !== breadcrumbs[breadcrumbs.length - 1].key) return;
					return <FileListItem key={file.ID} item={file} rowClicked={rowClicked} selected={appContext.selectedFile?.FileRef === file?.FileRef} />;
				})}
			</div>
		</>
	);
};