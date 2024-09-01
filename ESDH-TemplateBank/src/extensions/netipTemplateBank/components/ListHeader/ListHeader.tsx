import { Icon, Label } from '@fluentui/react';
import * as React from 'react';
import styles from './ListHeader.module.scss';

export interface IListHeaderProps {
    title: string;
    field?: string;
    sortingBy?: string;
    isAsc?: boolean;
    updateSorting?(field: string, isAsc: boolean): void;
}

export const ListHeader: React.FunctionComponent<IListHeaderProps> = (props: React.PropsWithChildren<IListHeaderProps>) => {
    const iconName = props.isAsc ? 'SortDown' : 'SortUp';

    function updateSorting(): void {
        if (!props.updateSorting) return;
        const newIsAsc = props.sortingBy === props.field ? !props.isAsc : true;
        props.updateSorting(props.field, newIsAsc);
    }

    return (
        <div className={styles.listHeaderColumn} data-sortable={!!props.field} style={!props.updateSorting ? { cursor: 'default' } : {}} onClick={updateSorting}>
            {!!props.sortingBy && props.sortingBy === props.field && <Icon iconName={iconName} className={styles.sortArrow} />}
            <Label>{props.title}</Label>
        </div>
    );
};