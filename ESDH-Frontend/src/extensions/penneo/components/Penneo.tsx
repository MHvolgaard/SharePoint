import * as React from 'react';
import * as ReactDom from 'react-dom';
import styles from './Penneo.module.scss';
import { CustomModal } from './Modal/CustomModal';
import { DefaultButton, Label, PrimaryButton, Spinner, SpinnerSize, TextField } from '@fluentui/react';
import { SP } from '../services/SP';
import { IUserInfo } from '../../../webparts/esdhFrontpage/models/IUserInfo';
import { IPenneoFile } from '../models/IPenneoFile';
import { fileIcon } from '../../../helpers';
import strings from 'PenneoCommandSetStrings';
import { IPenneoFunctionPayload, IPenneoFunctionPayloadFile } from '../models/IPenneoFunctionPayload';
import { PenneoService } from '../services/PenneoService';
import { AF } from '../services/AF';
import { CaseFileUrl } from '../../../config';

export interface IPenneoProps {
    hide: () => void;
    isHidden: boolean;
    selectedIds: number[];
}

export const TBAppContext = React.createContext(null);

export const Penneo: React.FunctionComponent<IPenneoProps> = (props: React.PropsWithChildren<IPenneoProps>) => {
    const [currentUser, setCurrentUser] = React.useState<IUserInfo>(null);
    const [caseFileName, setCaseFileName] = React.useState<string>('');
    const [selectedItems, setSelectedItems] = React.useState<IPenneoFile[]>(null);
    const [validItems, setValidItems] = React.useState<IPenneoFile[]>([]);
    const [loading, setLoading] = React.useState<boolean>(true);
    const [caseFileId, setCaseFileId] = React.useState<string>(null);

    React.useEffect(() => {
        getCurrentUser(); // eslint-disable-line @typescript-eslint/no-floating-promises
        getSelectedItems(); // eslint-disable-line @typescript-eslint/no-floating-promises
        AF.wakeUp();
    }, []);

    React.useEffect(() => {
        if (selectedItems !== null) setLoading(false);
    }, [selectedItems]);

    async function getCurrentUser(): Promise<void> {
        setCurrentUser(await SP.getCurrentUser());
    }

    async function getSelectedItems(): Promise<void> {
        const _selectedItems = await SP.getSelectedItems(props.selectedIds);
        const _validItems = _selectedItems.filter((item) => item.IsValid);

        ReactDom.unstable_batchedUpdates(() => {
            setSelectedItems(_selectedItems);
            setValidItems(_validItems);
        });
    }

    async function sendToPenneo(): Promise<void> {
        setLoading(true);

        if (validItems.length === 0) {
            alert("No files selected");
            return;
        }

        const folderUrl = validItems[0].ServerRelativeUrl.substring(0, validItems[0].ServerRelativeUrl.lastIndexOf('/'));

        const payload: IPenneoFunctionPayload = {
            FolderUrl: folderUrl,
            CasefileName: caseFileName,
            Files: validItems.map((file) => {
                return {
                    Id: file.Id,
                    Name: file.Name,
                    ServerRelativeUrl: file.ServerRelativeUrl
                } as IPenneoFunctionPayloadFile;
            })
        };

        try {
            const caseFileId = await PenneoService.sendToPenneoAF(payload);
            setCaseFileId(caseFileId);
            console.log(`Case file created with ID: ${caseFileId}`);



        } catch (error) {
            if (error?.message === "Popup closed") {
                setLoading(false);
                return;
            }
            console.error(error);
            alert("Error sending files to Penneo");
        }
    }

    function renderFile(file: IPenneoFile, index: number, valid: boolean): JSX.Element {
        return (
            <div key={index} className={styles.row} style={{ gap: 15 }}>
                {/* {file.isFolder && <Icon {...getFileTypeIconProps({ type: FileIconType.folder, size: 20, imageFileType: 'svg' })} />} */}
                {fileIcon(file.Name, false)}
                <Label disabled={!valid}>{file.Name}</Label>
            </div>
        );
    }

    function openCaseFile(): void {
        const newCaseFileUrl = CaseFileUrl.replace("#caseFileId#", caseFileId);
        window.open(newCaseFileUrl, "_blank");
    }


    const isValid = (validItems.length > 0 && !!caseFileName);

    return (
        <CustomModal onDismiss={props.hide} showModal={!props.isHidden} contentStyle={!currentUser ? { height: 200 } : {}} >
            {!currentUser &&
                <div style={{ height: 200, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spinner label={`${strings.loading}...`} size={SpinnerSize.large} />
                </div>
            }

            {!!currentUser &&
                <div className={styles.penneo}>
                    <div className={styles.menuBar}>
                        <Label style={{ marginRight: 'auto', textTransform: 'uppercase' }}>Penneo</Label>
                    </div>
                    <div className={styles.container} style={{ overflow: 'hidden' }}>
                        <div className={styles.column} style={{ gap: 20, height: '100%', overflow: 'hidden' }}>
                            {!caseFileId && <>
                                <TextField required label={strings.casefilename} placeholder={strings.addcasefilenamehere} value={caseFileName} onChange={(ev, val) => setCaseFileName(val)} />

                                <div className={styles.column} style={{ overflow: 'hidden', flex: 1 }}>
                                    <Label>{strings.validfiles}</Label>
                                    <div className={styles.selectedContent}>
                                        {selectedItems?.filter(f => f.IsValid).map((file, index) => renderFile(file, index, true))}
                                    </div>
                                </div>
                                {selectedItems?.filter(f => !f.IsValid).length > 0 && <>
                                    <div className={styles.divider} />
                                    <div className={styles.column} style={{ overflow: 'hidden', flex: 1 }}>
                                        <Label>{strings.invalidfiles}</Label>
                                        <div className={styles.selectedContent}>
                                            {selectedItems.filter(f => !f.IsValid).map((file, index) => renderFile(file, index, false))}
                                        </div>
                                        <Label className={styles.info}>{strings.invalidfilesdescription}</Label>
                                    </div>
                                </>}
                                <div className={styles.column} style={{ gap: 20, marginTop: 'auto' }} />
                                {loading && <Spinner title={strings.loading} size={SpinnerSize.large} />}
                                <div className={styles.row} style={{ gap: 20, justifyContent: 'center' }}>
                                    <PrimaryButton
                                        text={strings.sendtopenneo}
                                        disabled={!isValid || loading}
                                        onClick={sendToPenneo}
                                    />
                                    <DefaultButton
                                        text={strings.cancel}
                                        onClick={props.hide}
                                    />
                                </div>
                            </>}
                            {caseFileId && <>
                                <div className={styles.column} style={{ textAlign: 'center', flex: 1 }}>
                                    <Label>{strings.successMessage}</Label>
                                    <div className={styles.column} style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                                        <img
                                            src={require("../assets/penneo.svg")}
                                            alt="Penneo"
                                            style={{ cursor: 'pointer' }}
                                            onClick={openCaseFile}
                                            height={200}
                                            width={200} />
                                    </div>
                                </div>
                                <div className={styles.row} style={{ gap: 20, justifyContent: 'center', marginTop: 'auto' }}>
                                    <PrimaryButton
                                        text={strings.openpenneo}
                                        onClick={openCaseFile}
                                        iconProps={{ iconName: 'Favicon' }}
                                    />
                                    <DefaultButton
                                        text={strings.close}
                                        onClick={props.hide}
                                    />
                                </div>
                            </>}
                        </div>
                    </div>

                </div>
            }
        </CustomModal>
    );
};

export default class CustomDialog {
    private domElement: HTMLDivElement = null;
    private isHidden: boolean = true;
    private selectedIds: number[] = [];

    constructor() {
        this.domElement = document.createElement('div');
        document.body.appendChild(this.domElement);
        this.render();
    }

    public show(_selectedIds: number[]): void {
        this.selectedIds = _selectedIds;
        this.isHidden = false;
        this.render();
    }

    public hide(): void {
        this.isHidden = true;
        this.render();
    }

    private render(): void {
        ReactDom.render(
            this.isHidden ? <></> : <Penneo
                hide={this.hide.bind(this)}
                isHidden={this.isHidden}
                selectedIds={this.selectedIds}
            />,
            this.domElement
        );
    }

    protected onDispose(): void {
        ReactDom.unmountComponentAtNode(this.domElement)
    }

}