import * as React from 'react';
import { Checkbox, Label } from '@fluentui/react';
import { getIcon } from '../../helpers/Helpers';
import { TTemplateFile } from '../../models/TTemplateItem';
import styles from './TemplateList.module.scss';

export interface ITemplateListProps {
    category: string;
    optionalList: TTemplateFile[],
    requiredList: TTemplateFile[],
    setTemplateList: React.Dispatch<React.SetStateAction<TTemplateFile[]>>;
}

export const TemplateList: React.FunctionComponent<ITemplateListProps> = (props: React.PropsWithChildren<ITemplateListProps>) => {

    function toggleSelected(item: TTemplateFile, checked: boolean): void {
        item.IsSelected = checked;
        const updateTemplateList = [...props.optionalList];
        const index = updateTemplateList.findIndex(v => v.ID === item.ID);
        updateTemplateList[index] = item;
        props.setTemplateList(updateTemplateList);
    }

    function listItem(item: TTemplateFile, isRequired: boolean): JSX.Element {
        return <>
            <div className={styles.row} >
                <Checkbox
                    onChange={(e, v) => toggleSelected(item, v)}
                    checked={!!item.IsSelected}
                    disabled={isRequired}
                    className={isRequired && styles.disabled}
                />

                <div className={getIcon(item.Name, false)} />
                <div style={{ maxWidth: "100%", overflow: "hidden" }}>
                    <Label>{item.Name}</Label>
                </div>
            </div>
        </>
    }

    return (
        <div className={styles.templateList}>
            {props.optionalList?.map((item: TTemplateFile) => listItem(item, false))}
            {props.requiredList?.map((item: TTemplateFile) => listItem(item, true))}
        </div>
    );
};