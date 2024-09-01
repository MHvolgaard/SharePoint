import * as React from 'react';
import { SearchBox } from '@fluentui/react';
import styles from './TemplatesView.module.scss';
import { FileView } from '../FileView/FileView';
import { AppContext } from '../../services/AppContext';
import { TBAppContext } from '../TemplateBank';
import { SPService } from '../../services/SPService';
import { TTemplateItem } from '../../models/TTemplateItem';
import { SidePanel } from '../SidePanel/SidePanel';
import { FileCreationPanel } from '../SidePanel/FileCreationPanel';
import strings from 'NetipTemplateBankCommandSetStrings';

export interface ITemplatesViewProps { }

export const TemplatesView: React.FunctionComponent<ITemplatesViewProps> = (props: React.PropsWithChildren<ITemplatesViewProps>) => {
	const appContext: AppContext = React.useContext(TBAppContext);
	const [searchText, setSearchText] = React.useState<string>('');
	const containerRef: React.MutableRefObject<HTMLDivElement> = React.useRef();

	function handleRowClick(item: TTemplateItem): void {
		appContext.setSelectedFile(item);
	}

	const rootServerRelativeUrl = `${SPService.properties.TemplateListUrl}`;

	return (
		<div ref={containerRef} className={styles.templatesView}>
			<div className={styles.mainColumn}>
				<FileView
					templateItems={appContext.templateItems?.filter(item => item.Name.toLowerCase().indexOf(searchText.toLowerCase()) > -1)}
					rowClicked={handleRowClick}
					rootDirectory={rootServerRelativeUrl}
					rootName={SPService.properties.TemplateListName}
				>
					<div className={styles.ListMenu}>
						<SearchBox placeholder={strings.search} onChange={(e, v) => setSearchText(v)} value={searchText} className={styles.searchbox} />
					</div>
				</ FileView>
			</div>
			<SidePanel>
				<FileCreationPanel selectedItem={appContext.selectedFile} />
			</SidePanel>
		</div>
	);
};