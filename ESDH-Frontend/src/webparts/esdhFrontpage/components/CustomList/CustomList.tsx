import * as React from 'react';
import styles from './CustomList.module.scss';
import { Icon, Label, Spinner, SpinnerSize } from '@fluentui/react';


export interface ICustomColumn {
    /**
     * The name of the field in the item.
     */
    fieldName: string;
    /**
     * The name of the column.
     */
    displayName: string;
    /**
     * If sorting is enabled for this column.
     * @defaultvalue true
     */
    sorting?: boolean;
    /**
     * If filtering is enabled for this column.
     * @defaultvalue false
     */
    filtering?: boolean;
    /**
     * The width of the column in pixels.
     * No value uses flex: 1.
     * @defaultvalue flex: 1
     */
    // maxWidth?: number;
    // minWidth?: number;
    width?: number;

    onRender?: (item?: any, index?: number, column?: ICustomColumn) => JSX.Element; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface ICustomListProps {
    columns: ICustomColumn[];
    /**
    * If items is null, a loadingspinner is shown.
    */
    items: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
    /**
     * The number of row to render per chunk.
     * @defaultvalue 50
     */
    chuckSize?: number;
    defaultColumnWidth?: number;
    defaultSortingField?: string;
}

export const CustomList: React.FunctionComponent<ICustomListProps> = (props: React.PropsWithChildren<ICustomListProps>) => {
    const [chuckSize, setChunkSize] = React.useState<number>(props.chuckSize || 50);
    const listRef = React.useRef<HTMLDivElement>(null);
    const [sortedList, sortField, isAsc, updateSorting] = useSorting(props.items, props.defaultSortingField ?? '', true);

    const chuckRows = React.useMemo(() => sortedList?.slice(0, chuckSize), [sortedList, chuckSize]);

    React.useEffect(() => {
        setChunkSize(props.chuckSize || 50);
        listRef.current.scrollTop = 0;
    }, [sortedList]);


    function onListScroll(event: React.UIEvent<HTMLDivElement, UIEvent>): void {
        const element = event.target as HTMLDivElement;
        const bottom = Math.abs(element.scrollHeight - (element.scrollTop + element.clientHeight)) <= 1;
        if (bottom) {
            let newChuckSize = chuckSize + 50;
            if (newChuckSize > sortedList?.length) {
                newChuckSize = sortedList?.length;
            }
            setChunkSize(newChuckSize);
        }
    }

    function renderHeader(column: ICustomColumn): JSX.Element {
        const style: React.CSSProperties = { width: column?.width ?? props.defaultColumnWidth }
        // const style: React.CSSProperties = { minWidth: column?.minWidth ?? props.defaultColumnWidth, maxWidth: column?.maxWidth ?? props.defaultColumnWidth }

        const iconName = isAsc ? 'SortDown' : 'SortUp';
        const newIsAsc = sortField === column?.fieldName ? !isAsc : true;
        if (!updateSorting) style.cursor = 'default';

        return (
            <div className={styles.column}
                data-sortable={column?.sorting !== false}
                style={style}
                onClick={() => column.sorting !== false && updateSorting(column?.fieldName, newIsAsc)}
            >
                <Label>{column.displayName}</Label>
                {!!sortField && sortField === column?.fieldName && <Icon iconName={iconName} className={styles.sortArrow} />}
            </div>
        );
    }

    function renderItems(item: any, index: number): JSX.Element { // eslint-disable-line @typescript-eslint/no-explicit-any
        const element = <div key={index} className={styles.row}>
            {props.columns.map((column, j) => {
                const style: React.CSSProperties = { width: column?.width ?? props.defaultColumnWidth }
                // const style: React.CSSProperties = { minWidth: column?.minWidth ?? props.defaultColumnWidth, maxWidth: column?.maxWidth ?? props.defaultColumnWidth }

                if (column.onRender) {
                    return <div key={j} className={styles.column} style={style}>
                        {column.onRender(item, index, column)}
                    </div>;
                }

                return (
                    <div key={j} className={styles.column} style={style}>
                        <Label title={item[column.fieldName]} aria-label={item[column.fieldName]}>{item[column.fieldName]}</Label>
                    </div>
                );
            })}
        </div>
        return element;
    }

    return (
        <>
            <div className={styles.customList} onScroll={onListScroll}>
                <div className={styles.header}>
                    <div className={styles.row}>
                        {props.columns.map((column, j) => renderHeader(column))}
                    </div>
                </div>

                <div className={styles.container} ref={listRef}>
                    {!!props.items && chuckRows.map((row, i) => renderItems(row, i))}
                    {!props.items && <Spinner size={SpinnerSize.large} style={{ margin: 'auto' }} />}
                </div>
            </div >
        </>
    );
};

function useSorting<Type>(items: Type[], defaultSortField: string, defaultIsAsc: boolean = true): [Type[], string, boolean, (newField: string, newIsAsc: boolean) => void] {
    const [isAsc, setIsAsc] = React.useState<boolean>(defaultIsAsc);
    const [sortField, setSortField] = React.useState<string>(defaultSortField);

    function updateSorting(newField: string, newIsAsc: boolean): void {
        setSortField(newField);
        setIsAsc(newIsAsc);
    }

    const sortedList = React.useMemo(() => {
        if (!items) return items;
        return [...items]?.sort((a, b) => {
            const sortFields = sortField?.split('.');
            if (sortFields?.length > 1) return customSort(a[sortFields[0]], b[sortFields[0]], isAsc, [sortFields[1]]);
            return customSort(a[sortField], b[sortField], isAsc);
        })
    }, [items, isAsc, sortField]);

    return [sortedList, sortField, isAsc, updateSorting];
}

function customSort(a: any, b: any, isAsc: boolean, objectProp?: any): number { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!a) return isAsc ? -1 : 1;
    if (!b) return isAsc ? 1 : -1;

    if (!!objectProp) {
        return customSort(a[objectProp], b[objectProp], isAsc);
    }

    if (typeof a === "number") return isAsc ? a - b : b - a;
    if (typeof a === "string") {
        if (!isNaN(parseFloat(a))) return isAsc ? parseFloat(a) - b : b - parseFloat(a); // if string is actually just numbers
        return isAsc ? a?.localeCompare(b) : b?.localeCompare(a);
    }
    if (a instanceof Date) {
        return isAsc ? a.getTime() - b.getTime() : b.getTime() - a.getTime();
    }

    return 0;
}