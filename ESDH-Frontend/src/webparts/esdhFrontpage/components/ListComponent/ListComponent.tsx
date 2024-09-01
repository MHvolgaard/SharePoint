// import * as React from 'react';
// import styles from './ListComponent.module.scss';
// import { ConstrainMode, DetailsList, DetailsListLayoutMode, IColumn, IDetailsListStyles, SelectionMode, mergeStyleSets } from '@fluentui/react';
// import { randomNumber, randomText } from '../../../../helpers';

// export interface IListComponentProps {
//     items: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
//     columns: IColumn[];
// }

// const gridStyles: Partial<IDetailsListStyles> = {
//     root: {
//         overflow: 'auto',
//         height: '100%',
//         selectors: {
//             '& [role=grid]': {
//                 display: 'flex',
//                 flexDirection: 'column',
//                 alignItems: 'start',
//                 height: '100%',
//                 overflow: 'auto',
//             },
//         },
//     },
//     headerWrapper: {
//         flex: '0 0 auto',
//         minWidth: '100%',
//         position: 'sticky',
//         top: 0,
//         left: 0,
//         zIndex: 99999999
//     },
//     contentWrapper: {
//         flex: '1 1 auto',
//         // overflow: 'hidden',
//         minWidth: '100%',
//     },
// };

// const classNames = mergeStyleSets({
//     header: {
//         margin: 0,
//     },
//     row: {
//         flex: '0 0 auto',
//     },
//     focusZone: {
//         height: '100%',
//         overflowY: 'auto',
//         overflowX: 'hidden',
//     },
//     selectionZone: {
//         height: '100%',
//         overflow: 'hidden',
//     },
// });

// const focusZoneProps = {
//     className: classNames.focusZone,
//     'data-is-scrollable': 'true',
// } as React.HTMLAttributes<HTMLElement>;

// const onItemInvoked = (item: any): void => { // eslint-disable-line @typescript-eslint/no-explicit-any
//     console.log('Item invoked: ' + item);
// };
// // const onRenderDetailsHeader: IRenderFunction<IDetailsHeaderProps> = (props, defaultRender) => {
// //     if (!props) {
// //         return null;
// //     }
// //     const onRenderColumnHeaderTooltip: IRenderFunction<IDetailsColumnRenderTooltipProps> = tooltipHostProps => (
// //         <TooltipHost {...tooltipHostProps} />
// //     );
// //     return defaultRender!({
// //         ...props,
// //         onRenderColumnHeaderTooltip,
// //     });
// // };

// export const ListComponent: React.FunctionComponent<IListComponentProps> = (props: React.PropsWithChildren<IListComponentProps>) => {
//     const [columns, setColumns] = React.useState<IColumn[]>(props.columns ?? []);

//     React.useEffect(() => {
//         setColumns(props.columns);
//     }, [props.columns]);

//     const items = React.useMemo(() => {
//         let newItems = props.items.slice();
//         columns.forEach((column) => {
//             if (column.isSorted) {
//                 newItems = newItems.sort((a, b) => {
//                     const aValue = a[column.key as keyof typeof a];
//                     const bValue = b[column.key as keyof typeof b];
//                     return column.isSortedDescending ? aValue > bValue ? 1 : -1 : aValue < bValue ? 1 : -1;
//                 });
//             }
//         });
//         return newItems;
//     }, [props.items, columns]);

//     const testItems = React.useMemo(() => {
//         let newItems = props.items.slice();
//         console.log('columns', columns)
//         for (let i = 0; i < 200; i++) {
//             let element;
//             columns.forEach((column) => {
//                 let val = '';
//                 if (column.name === 'Number') {
//                     val = i + '';
//                 } else {
//                     if (column.name === 'Ø90 Number' || column.name === 'Postal Code') {
//                         val = randomNumber().toString();
//                     } else {
//                         val = randomText();
//                     }
//                 }
//                 element = {
//                     ...element,
//                     [column.key]: val,
//                 };
//             });
//             newItems.push(element);
//         }
//         columns.forEach((column) => {
//             if (column.isSorted) {
//                 newItems = newItems.sort((a, b) => {
//                     const aValue = a[column.key as keyof typeof a];
//                     const bValue = b[column.key as keyof typeof b];
//                     return column.isSortedDescending ? aValue > bValue ? 1 : -1 : aValue < bValue ? 1 : -1;
//                 });
//             }
//         });
//         console.log('newItems', newItems)
//         return newItems;
//     }, [columns]);

//     function onColumnHeaderClick(ev: React.MouseEvent<HTMLElement>, column: IColumn): void {
//         const newColumns: IColumn[] = columns.slice();
//         const currColumn: IColumn = newColumns.filter(currCol => column.key === currCol.key)[0];
//         newColumns.forEach((newCol: IColumn) => {
//             if (newCol === currColumn) {
//                 currColumn.isSortedDescending = !currColumn.isSortedDescending;
//                 currColumn.isSorted = true;
//             } else {
//                 newCol.isSorted = false;
//                 newCol.isSortedDescending = true;
//             }
//         });
//         setColumns(newColumns);
//     }



//     return (
//         <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
//             <div className={styles.listComponent}>
//                 <div className={styles.list} data-is-scrollable={true}>
//                     <DetailsList
//                         items={testItems}
//                         columns={columns}
//                         onColumnHeaderClick={onColumnHeaderClick}
//                         layoutMode={DetailsListLayoutMode.fixedColumns}
//                         constrainMode={ConstrainMode.unconstrained}
//                         // onRenderDetailsHeader={onRenderDetailsHeader}
//                         // selectionPreservedOnEmptyClick
//                         styles={gridStyles}
//                         selectionMode={SelectionMode.none}
//                         onItemInvoked={onItemInvoked}
//                         focusZoneProps={focusZoneProps}
//                         selectionZoneProps={{
//                             className: classNames.selectionZone,
//                         }}
//                     />
//                 </div>
//             </div>
//         </div >
//     );
// };