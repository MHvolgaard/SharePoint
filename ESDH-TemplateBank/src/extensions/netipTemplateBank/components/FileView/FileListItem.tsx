import * as React from 'react';
import styles from './FileListItem.module.scss';
import { Icon, Label } from '@fluentui/react';
import { formatShortDate, getIcon } from '../../helpers/Helpers';
import { TTemplateItem } from '../../models/TTemplateItem';

export interface IFileListItemProps {
    item: TTemplateItem;
    selected: boolean;
    rowClicked: (file: TTemplateItem) => void;
}

export const FileListItem: React.FunctionComponent<IFileListItemProps> = (props: React.PropsWithChildren<IFileListItemProps>) => {

    function getIconsOrEmpty(isFolder: boolean): JSX.Element {
        if (!!isFolder) return <div />

        return <div className={styles.iconContainer} onClick={(e) => { e.stopPropagation(); props.rowClicked(props.item) }}>
            <Icon iconName='StatusCircleCheckmark' />
        </div>
    }

    return (
        <>
            <div className={styles.fofElement} data-selected={props.selected} onClick={(e) => props.rowClicked(props.item)}>
                <div>
                    {getIconsOrEmpty(props.item.ItemType === "Folder")}
                </div>
                <div>
                    <div className={getIcon(props.item.Name, props.item.ItemType === "Folder")} />
                </div>
                <div>
                    <Label onClick={() => { props.rowClicked(props.item) }} title={props.item.Name}>{props.item.Name}</Label>
                </div>
                <div>
                    {props.item.ItemType === "File" && <Label>{formatShortDate(props.item.Modified)}</Label>}
                </div>
            </div>
        </>
    );
};