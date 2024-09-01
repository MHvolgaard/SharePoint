import * as React from 'react';
import { TTermSet } from '../../models/TTermSet';
import { Icon, IconButton, Label, Spinner } from '@fluentui/react';
import styles from './TermSetViewer.module.scss';
import { AppContext } from '../../services/AppContext';
import { TBAppContext } from '../TemplateBank';
import { getAllChildrenCategories, getAllParentCategories } from '../../helpers/Helpers';

export interface ITermSetViewerProps {
    onSelected: (v?: string) => void;
    onCancel: () => void;
    searchText?: string;
}

export const TermSetViewer: React.FunctionComponent<ITermSetViewerProps> = (props: React.PropsWithChildren<ITermSetViewerProps>) => {
    const appContext: AppContext = React.useContext(TBAppContext);
    const [selectedItem, setSelectedItem] = React.useState<string>(null);
    const [isLoaded, setIsLoaded] = React.useState<boolean>(false);
    const [termSets, setTermSets] = React.useState<TTermSet[]>(null);
    const [termSetsSearchValues, setTermSetsSearchValues] = React.useState<TTermSet[]>(null);

    React.useEffect(() => {
        setTermSets(appContext.termSets); // eslint-disable-line @typescript-eslint/no-floating-promises
    }, []);

    React.useEffect(() => {
        if (!termSets) return;
        setIsLoaded(true);
    }, [termSets]);

    React.useEffect(() => {
        props.onSelected(selectedItem);
        if (!!props.searchText) openRelatedParents();

    }, [selectedItem]);

    React.useEffect(() => {
        if (!props.searchText) {
            setTermSetsSearchValues(null);
            return;
        }

        let searchValues = termSets?.filter(v => v.DefaultLabel.toLowerCase().indexOf(props.searchText.toLowerCase()) > -1)
        searchValues = searchValues.sort((a, b) => a.DefaultLabel < b.DefaultLabel ? -1 : a.DefaultLabel > b.DefaultLabel ? 1 : 0);
        setTermSetsSearchValues(searchValues);

        if (searchValues.filter(i => i.Id === selectedItem).length === 0) {
            setSelectedItem(null);
            props.onSelected(null);
        }

    }, [props.searchText]);

    function toggleTermSet(termSet: TTermSet): void {
        setTermSets(prev => updateTermSets(prev, termSet));
    }

    function openRelatedParents(): void {
        const termSet = termSets.find(v => v.Id === selectedItem);
        setTermSets(prev => updateTermSets(prev, termSet));
    }

    function updateTermSets(termSets: TTermSet[], termSet: TTermSet): TTermSet[] {
        if (!termSet) return termSets;
        const updateTermSets = [...termSets];
        const index = updateTermSets.findIndex(v => v.Id === termSet.Id);
        const selectedTermSet = updateTermSets[index];
        selectedTermSet.IsOpen = !selectedTermSet.IsOpen;

        // clear selected item if parent term set is closed
        const selectedItemTermSet = termSets.find(v => v.Id === selectedItem);
        const allParentTermSet = getAllParentCategories(selectedItemTermSet, appContext.termSets);

        if (!!selectedTermSet.IsOpen) {
            if (!props.searchText) return updateTermSets;

            // When in searchmode open all parent term sets, to keep visible when exiting search mode
            for (let i = 0; i < allParentTermSet.length; i++) {
                const childIndex = updateTermSets.findIndex(v => v.Id === allParentTermSet[i]);
                updateTermSets[childIndex].IsOpen = true;
            }

            return updateTermSets;
        }

        const allChildrenTermSet = getAllChildrenCategories(selectedTermSet, appContext.termSets);
        for (let i = 0; i < allChildrenTermSet.length; i++) {
            const childIndex = updateTermSets.findIndex(v => v.Id === allChildrenTermSet[i]);
            updateTermSets[childIndex].IsOpen = false;
        }

        for (let i = 0; i < allParentTermSet.length; i++) {
            if (allParentTermSet[i] !== termSet.Id) continue
            setSelectedItem(null)
        }

        return updateTermSets;
    }

    function renderRows(termSet: TTermSet): JSX.Element {
        return <>
            <div className={styles.column}>
                <div className={styles.termSetRow}>
                    {!props.searchText && termSet.NumberOfChildren > 0 ? <IconButton className={styles.selectItem}
                        iconProps={termSet.IsOpen ? { iconName: 'CaretSolid' } : { iconName: 'CaretHollow' }}
                        onClick={() => toggleTermSet(termSet)} /> : <span />}
                    <div className={!!selectedItem && selectedItem === termSet.Id ? styles.selectedItemContent : styles.itemContent} onClick={() => !!selectedItem && selectedItem === termSet.Id ? setSelectedItem(null) : setSelectedItem(termSet.Id)}>
                        <Icon iconName={'Tag'} />
                        <Label title={termSet.DefaultLabel}>{termSet.DefaultLabel}</Label>
                    </div>
                </div>
                {!props.searchText && termSet.IsOpen &&
                    <div className={styles.childrenContainer}>
                        {termSets.filter(v => v.ParentId === termSet.Id).map(v => renderRows(v))}
                    </div>
                }
            </div>
        </>
    }

    return (
        <div className={styles.termSetViewer} >
            <div className={styles.column}>
                {!isLoaded && <Spinner styles={{ root: { position: 'absolute', top: 9, right: 15 } }} />}
                {!props.searchText && termSets?.filter(v => v.ParentId === null).map(v => renderRows(v))}
                {!!props.searchText && termSetsSearchValues?.map(v => renderRows(v))}
            </div>
        </div>
    );
}
