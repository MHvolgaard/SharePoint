import * as React from 'react';
import * as ReactDom from 'react-dom';
import styles from './TemplateBank.module.scss';
import { TemplatesView } from './Views/TemplatesView';
import { AppContext } from '../services/AppContext';
import { useTemplateItems } from '../hooks/useTemplateItems';
import { TTemplateItem } from '../models/TTemplateItem';
import { CustomModal } from './Modal/CustomModal';
import { Label, Spinner, SpinnerSize, Toggle } from '@fluentui/react';
import { AdvancedTemplatesView } from './Views/AdvancedTemplatesView';
import { SPService } from '../services/SPService';
import { TTermSet } from '../models/TTermSet';
import strings from 'NetipTemplateBankCommandSetStrings';

export interface ITemplateBankProps {
    toggle: (isHidden: boolean) => void;
    isHidden: boolean;
}

export const TBAppContext = React.createContext(null);

export const TemplateBank: React.FunctionComponent<ITemplateBankProps> = (props: React.PropsWithChildren<ITemplateBankProps>) => {
    const { templateItems, templateItemsLoading, refreshTemplateItems } = useTemplateItems();
    const [useAdvancedView, setUseAdvancedView] = React.useState<boolean>(false);
    const [selectedFile, setSelectedFile] = React.useState<TTemplateItem>(null);
    const [termSets, setTermSets] = React.useState<TTermSet[]>(null);
    const [currentUser, setCurrentUser] = React.useState<string>(null);

    const appContext: AppContext = {
        refreshTemplateItems: refreshTemplateItems,
        templateItems: templateItems,
        selectedFile: selectedFile,
        setSelectedFile: setSelectedFile,
        termSets: termSets,
        currentUser: currentUser
    }

    React.useEffect(() => {
        getTermSets(); // eslint-disable-line @typescript-eslint/no-floating-promises
        getCurrentUser(); // eslint-disable-line @typescript-eslint/no-floating-promises
    }, []);

    async function getTermSets(): Promise<void> {
        const result = await SPService.getTermSetList();
        setTermSets(result);
    }

    async function getCurrentUser(): Promise<void> {
        setCurrentUser(await SPService.getCurrentUser());
    }

    return (
        <CustomModal onDismiss={() => props.toggle(true)} showModal={!props.isHidden} contentStyle={templateItemsLoading ? { height: 200 } : {}} >
            {templateItemsLoading &&
                <div style={{ height: 200, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spinner label={strings.loadingText} size={SpinnerSize.large} />
                </div>}

            {!templateItemsLoading &&
                <TBAppContext.Provider value={appContext} >
                    <div className={styles.templateBank}>
                        <div className={styles.menuBar}>
                            <Label style={{ marginRight: 'auto', textTransform: 'uppercase' }}>{strings.esdhTitle}</Label>
                            {(!termSets || termSets?.length === 0) && <Spinner size={SpinnerSize.small} />}
                            <div style={{ width: 'fit-content', minWidth: 200, marginLeft: 10 }}>
                                <Toggle
                                    label={strings.settings}
                                    onChange={(e, v) => { setUseAdvancedView(v); setSelectedFile(null); }}
                                    defaultChecked={false}
                                    checked={useAdvancedView}
                                    offText={strings.simple}
                                    onText={strings.advanced}
                                    inlineLabel
                                    styles={{ root: { marginBottom: 0 } }}
                                    disabled={!termSets || termSets?.length === 0}
                                />
                            </div>
                        </div>
                        <div className={styles.content}>
                            {!!useAdvancedView && <AdvancedTemplatesView />}
                            {!useAdvancedView && <TemplatesView />}
                        </div>
                    </div>
                </TBAppContext.Provider>
            }
        </CustomModal>
    );
};

export default class CustomDialog {
    private domElement: HTMLDivElement = null;
    private isHidden: boolean = true;

    constructor() {
        this.domElement = document.createElement('div');
        document.body.appendChild(this.domElement);
        this.render();
    }

    public toggle(isHidden: boolean = null): void {
        if (isHidden === null) this.isHidden = !this.isHidden;
        else this.isHidden = isHidden;

        this.render();
    }

    private render(): void {
        ReactDom.render(
            this.isHidden ? <></> : <TemplateBank toggle={(isHidden: boolean) => { this.toggle(isHidden) }} isHidden={this.isHidden} />,
            this.domElement
        );
    }

    protected onDispose(): void {
        ReactDom.unmountComponentAtNode(this.domElement)
    }

}