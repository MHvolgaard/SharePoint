import * as React from 'react';

export function useSorting<Type>(items: Type[], defaultSortField: string, defaultIsAsc: boolean = true): [Type[], string, boolean, (newField: string, newIsAsc: boolean) => void] {
    const [isAsc, setIsAsc] = React.useState<boolean>(defaultIsAsc);
    const [sortField, setSortField] = React.useState<string>(defaultSortField);

    const updateSorting = (newField: string, newIsAsc: boolean): void => {
        setSortField(newField);
        setIsAsc(newIsAsc);
    };

    const sortedList = React.useMemo(() => [...items]?.sort((a, b) => {
        const sortFields = sortField?.split('.');
        // if (sortFields?.length > 1) return customSort(a[sortFields[0]], b[sortFields[0]], isAsc, [sortFields[1]]);
        // return customSort(a[sortField], b[sortField], isAsc);
        if (sortFields?.length > 1) return customSort(a[sortFields[0]], b[sortFields[0]], isAsc, a["ItemType"] === "Folder", b["ItemType"] === "Folder", [sortFields[1]]); // eslint-disable-line dot-notation
        return customSort(a[sortField], b[sortField], isAsc, a["ItemType"] === "Folder", b["ItemType"] === "Folder"); // eslint-disable-line dot-notation
    }), [items, isAsc, sortField]);

    return [sortedList, sortField, isAsc, updateSorting];
}

// function customSort(a: any, b: any, isAsc: boolean, objectProp?: any): number {
function customSort(a: any, b: any, isAsc: boolean, aIsFolder: boolean, bIsFolder: boolean, objectProp?: any): number { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!!objectProp) {
        return customSort(a[objectProp], b[objectProp], aIsFolder, bIsFolder, isAsc);
    }

    //If a or b is folders, then sort differently
    if (aIsFolder && bIsFolder) {
        if (typeof a === "number") return isAsc ? a - b : b - a;
        if (!a) return isAsc ? -1 : 1;
        if (!b) return isAsc ? 1 : -1;
        if (typeof a === "string") return isAsc ? a?.localeCompare(b) : b?.localeCompare(a);
        if (a instanceof Date) {
            return isAsc ? a.getTime() - b.getTime() : b.getTime() - a.getTime();
        }
    }
    if (aIsFolder) return isAsc ? 1 : -1;
    if (bIsFolder) return isAsc ? 1 : -1;

    //Regular sorting
    if (typeof a === "number") return isAsc ? a - b : b - a;
    if (!a) return isAsc ? -1 : 1;
    if (!b) return isAsc ? 1 : -1;
    if (typeof a === "string") return isAsc ? a?.localeCompare(b) : b?.localeCompare(a);
    if (a instanceof Date) {
        return isAsc ? a.getTime() - b.getTime() : b.getTime() - a.getTime();
    }

    return 0;
}

