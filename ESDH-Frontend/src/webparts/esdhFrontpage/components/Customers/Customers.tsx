import * as React from 'react';
import styles from './Customers.module.scss';
import { ICustomer } from '../../models/ICustomer';
import { ActionButton, Dropdown, FontIcon, IDropdownOption, Link, SearchBox, Spinner, SpinnerSize } from '@fluentui/react';
import { ICustomColumn, CustomList } from '../CustomList/CustomList';
import { HeaderLabel, HeaderSize } from '../HeaderLabel/HeaderLabel';
import { IUserInfo, IUserItem } from '../../models/IUserInfo';
import strings from 'EsdhFrontpageWebPartStrings';

export interface ICustomersProps {
    UserInfo: IUserInfo;
    Customers: ICustomer[];
    // Favorites: IFavorite[];
    UpdateFavorites(item: IUserItem, add: boolean): void;
    UpdateRecents(item: IUserItem): void;
}

export const Customers: React.FunctionComponent<ICustomersProps> = (props: React.PropsWithChildren<ICustomersProps>) => {
    const [searchField, setSearchField] = React.useState<string>('');
    const [searchValue, setSearchValue] = React.useState<string>('');

    const myCustomers = React.useMemo(() => {
        if (!props.Customers) return null;

        let customers = props.Customers.map((customer) => {
            const favorite = props.UserInfo.Favorites.find((fav) => fav.Type === 'Customers' && fav.Number === customer.ID);
            return { ...customer, Favorite: !!favorite };
        });

        if (searchValue.length > 0) {
            if (searchField?.length === 0) {
                customers = customers.filter(item => {
                    const value = searchValue.toLowerCase();
                    return JSON.stringify(item).indexOf(value) > -1;
                });

            } else {
                customers = customers.filter(item => {
                    let searchBy = null;
                    Object.keys(item).map(i => {
                        if (i.toLowerCase() === searchField.toLowerCase()) {
                            searchBy = { key: i, value: item[i] };
                        }
                    });
                    if (searchBy?.value?.toString().toLowerCase().indexOf(searchValue.toLowerCase()) > -1) {
                        return item;
                    }
                });
            }
        }

        return customers;
    }, [props.UserInfo, props.Customers, searchField, searchValue]);

    const customerColumns: ICustomColumn[] = [
        {
            fieldName: 'SiteStatus',
            displayName: strings.site,
            sorting: true,
            width: 50,
            onRender: (item: ICustomer) => {
                switch (item.SiteStatus) {
                    case "New":
                        return <FontIcon style={{ userSelect: 'none', fontSize: '16px' }} iconName='More' title={strings.new} />
                    case "Queued":
                        return <FontIcon style={{ userSelect: 'none', fontSize: '16px' }} iconName='More' title={strings.queued} />

                    case "Processing":
                        return <Spinner size={SpinnerSize.small} title={strings.processing} />;

                    case "Completed":
                        return <Link style={{ userSelect: 'none', fontSize: '16px' }}
                            href={item.Site}
                            target='_self'
                            onMouseDown={() => props.UpdateRecents({ Number: item.ID, Type: 'Customers', Name: item.Name })}
                        // onClick={() => props.UpdateRecents({ Number: item.ID, Type: 'Customers', Name: item.Name })}
                        >
                            <FontIcon iconName='Favicon' />
                        </Link>;

                    default:
                        return <></>
                }
            }
        },
        {
            fieldName: 'SalesScore',
            displayName: '',
            sorting: false,
            width: 23,
            onRender: (item: ICustomer) => {
                const style: React.CSSProperties = { height: '100%', width: '100%', borderRadius: '3px' };
                if (item.SalesScore <= 2 && item.SalesScore > 1) style.background = 'Orange';
                if (item.SalesScore > 2) style.background = 'Red';
                return <div style={style} />;
            }
        },
        {
            fieldName: 'Favorite',
            displayName: '',
            sorting: false,
            width: 50,
            onRender: (item: ICustomer) => {
                if (!item.Favorite) return <ActionButton iconProps={{ iconName: 'FavoriteStar' }} onClick={() => {
                    props.UpdateFavorites({ Number: item.ID, Type: 'Customers', Name: item.Name }, true);
                }} />;
                return <ActionButton iconProps={{ iconName: 'FavoriteStarFill' }} onClick={() => {
                    props.UpdateFavorites({ Number: item.ID, Type: 'Customers', Name: item.Name }, false);
                }} />;
            }
        },
        {
            fieldName: 'Number',
            displayName: strings.number,
            width: 120,
        },
        {
            fieldName: 'Name',
            displayName: strings.name,
            width: 350,
        },
        {
            fieldName: 'O90Number',
            displayName: strings.o90number,
            width: 120,
        },
        {
            fieldName: 'Address1',
            displayName: strings.address,
            width: 160,
        },
        {
            fieldName: 'PostalCode',
            displayName: strings.postalcode,
            width: 120,
        },
        {
            fieldName: 'City',
            displayName: strings.city,
            width: 160,
        }
    ];

    const searchOptions: IDropdownOption[] = React.useMemo(() => {
        const options: IDropdownOption[] = [{ key: '', text: '' }];
        customerColumns.filter(c => c.displayName?.length > 0).forEach(c => {
            options.push({ key: c.fieldName, text: c.displayName });
        });

        return options;
    }, [customerColumns]);

    return (
        <section className={styles.customers}>
            <div className={styles.container}>
                <div className={styles.content}>
                    <HeaderLabel size={HeaderSize.H2} uppercase>{strings.customers}</HeaderLabel>
                    <div className={styles.row}>
                        <HeaderLabel size={HeaderSize.H6} uppercase>{strings.searchspecific}</HeaderLabel>
                        <Dropdown options={searchOptions} style={{ minWidth: 250 }} onChange={(e, v) => setSearchField(v.key + '')} selectedKey={searchField} />
                        <SearchBox styles={{ root: { width: '100%' } }} placeholder={strings.search} onChange={(e, v) => setSearchValue(v)} value={searchValue} />
                        {searchValue.length > 0 && <HeaderLabel size={HeaderSize.H6} uppercase disabled>{strings.results}: {myCustomers.length}</HeaderLabel>}
                    </div>
                    <CustomList columns={customerColumns} items={myCustomers} defaultSortingField='Number' />
                </div>
            </div>
        </section>
    );
};