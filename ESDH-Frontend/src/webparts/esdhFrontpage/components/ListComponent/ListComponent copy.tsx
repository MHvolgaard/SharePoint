// import * as React from 'react';
// import styles from './ListComponent.module.scss';
// import { ConstrainMode, DetailsList, DetailsListLayoutMode, IColumn, IDetailsColumnRenderTooltipProps, IDetailsHeaderProps, IDetailsListStyles, IRenderFunction, PrimaryButton, ScrollablePane, ScrollbarVisibility, SelectionMode, Sticky, StickyPositionType, TooltipHost, mergeStyleSets } from '@fluentui/react';

// export interface IListComponentProps {
//     items: any[]; // eslint-disable-line @typescript-eslint/no-explicit-any
//     columns: IColumn[];
// }

// const gridStyles: Partial<IDetailsListStyles> = {
//     root: {
//         overflowX: 'auto',
//         overflowY: 'hidden',
//         height: '100%',
//         width: '100%',
//         selectors: {
//             '& [role=grid]': {
//                 display: 'flex',
//                 flexDirection: 'column',
//                 alignItems: 'start',
//                 height: '100%',
//             },
//         },
//     },
//     headerWrapper: {
//         flex: '0 0 auto',
//         width: '100%',
//     },
//     contentWrapper: {
//         flex: '1 1 auto',
//         overflow: 'hidden',
//         width: '100%',
//     }
    
// };

// const classNames = mergeStyleSets({
//     header: {
//         margin: 0,
//     },
//     row: {
//         flex: '0 0 auto',
//         boxSizing: 'border-box',
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

//     function _renderFixedDetailsHeader(props, defaultRender): any {
//         // if (!props) {
//         //     return null;
//         // }
//         // const onRenderColumnHeaderTooltip: IRenderFunction<IDetailsColumnRenderTooltipProps> =
//         //     tooltipHostProps => (
//         //         <TooltipHost {...tooltipHostProps} />
//         //     );
//         return (
//             <Sticky stickyPosition={StickyPositionType.Header} isScrollSynced>
//                 {defaultRender({
//                     ...props,
//                     // onRenderColumnHeaderTooltip,
//                 })}
//             </Sticky>
//         );
//     }

//     const onRenderDetailsHeader: IRenderFunction<IDetailsHeaderProps> = (props, defaultRender) => {
//         return defaultRender!({
//             ...props
//         });
//     };

//     const onRenderRow = (props, defaultRender) => {
//         return defaultRender!({
//             ...props,
//             className: classNames.row,
//         });
//     }

//     return (
//         <div className={styles.listComponent}>
//             <PrimaryButton text="Primary" />
//             <PrimaryButton text="Primary" />
//             <PrimaryButton text="Primary" />
//             <PrimaryButton text="Primary" />
//             {/* <div
//             >
//             <ScrollablePane scrollbarVisibility={ScrollbarVisibility.auto} >
//                     <DetailsList
//                     onRenderDetailsHeader={_renderFixedDetailsHeader}
//                         // styles={{ headerWrapper: { position: "sticky", top: 0, alignSelf: "flex-start" } }}
//                         items={items}
//                         columns={columns}
//                         selectionMode={SelectionMode.none}
//                         getKey={(item) => item.key}
//                         layoutMode={DetailsListLayoutMode.justified}
//                         isHeaderVisible={true}
//                         onShouldVirtualize={() => true}
//                         onItemInvoked={() => console.log('onClick - invoked')}
//                         // onActiveItemChanged={() => console.log('onClick - active')}
//                         onColumnHeaderClick={onColumnHeaderClick}
//                         />
//                         </ScrollablePane>
//                     </div> */}
//             <div
//                 className={styles.list}
//                 >

//                 <DetailsList                
//                     onRenderDetailsHeader={onRenderDetailsHeader}
//                     onRenderRow={onRenderRow}
//                     // styles={{ headerWrapper: { position: "sticky", top: 0, alignSelf: "flex-start" } }}
//                     items={items}
//                     columns={columns}
//                     selectionMode={SelectionMode.none}
//                     getKey={(item) => item.key}
//                     layoutMode={DetailsListLayoutMode.fixedColumns}
//                     isHeaderVisible={true}
//                     onShouldVirtualize={() => true}
//                     onItemInvoked={() => console.log('onClick - invoked')}
//                     // onActiveItemChanged={() => console.log('onClick - active')}
//                     onColumnHeaderClick={onColumnHeaderClick}
//                     styles={gridStyles}
//                     focusZoneProps={focusZoneProps}
//                     constrainMode={ConstrainMode.unconstrained}
//                     selectionZoneProps={{
//                         className: classNames.selectionZone,
//                     }}
//                 />
//             </div>

//         </div>
//     );
// };