import * as React from 'react';
import styles from './MyPage.module.scss';
import { IUserItem, IUserInfo } from '../../models/IUserInfo';
import { ICustomer } from '../../models/ICustomer';
import { ActionButton, Dropdown, FontIcon, IDropdownOption, Label, Link, SearchBox, Spinner, SpinnerSize } from '@fluentui/react';
import { HeaderLabel, HeaderSize } from '../HeaderLabel/HeaderLabel';
import { CustomList, ICustomColumn } from '../CustomList/CustomList';
import { ICase } from '../../models/ICase';
import strings from 'EsdhFrontpageWebPartStrings';
import { filterArray } from '../../../../helpers';

export interface IMyPageProps {
  UserInfo: IUserInfo;
  Customers: ICustomer[];
  Cases: ICase[];
  UpdateFavorites(item: IUserItem, add: boolean): void;
  UpdateRecents(item: IUserItem): void;
}

export const MyPage: React.FunctionComponent<IMyPageProps> = (props: React.PropsWithChildren<IMyPageProps>) => {
  const [searchField, setSearchField] = React.useState<string>('');
  const [searchValue, setSearchValue] = React.useState<string>('');

  const myCustomers: ICustomer[] = React.useMemo(() => {
    if (!props.Customers) return null;

    let customers = props.Customers.map((customer) => {
      const favorite = props.UserInfo.Favorites.find((fav) => fav.Type === 'Customers' && fav.Number === customer.ID);
      return { ...customer, Favorite: !!favorite } as ICustomer;
    });

    // if (searchValue.length > 0) {
    //   if (searchField?.length === 0) {
    //     customers = customers.filter(item => {
    //       const value = searchValue.toLowerCase();
    //       return JSON.stringify(item).indexOf(value) > -1;
    //     });

    //   } else {
    //     customers = customers.filter(item => {
    //       let searchBy = null;
    //       Object.keys(item).map(i => {
    //         if (i.toLowerCase() === searchField.toLowerCase()) {
    //           searchBy = { key: i, value: item[i] };
    //         }
    //       });
    //       if (searchBy?.value?.toString().toLowerCase().indexOf(searchValue.toLowerCase()) > -1) {
    //         return item;
    //       }
    //     });
    //   }
    // }

    customers = filterArray<ICustomer>(customers, searchValue, searchField);

    return customers;
  }, [props.UserInfo, props.Customers, searchField, searchValue]);

  const myFavorites: (ICustomer | ICase)[] = React.useMemo(() => {
    if (!props.Customers || !props.Cases) return null;
    const favorites: (ICustomer | ICase)[] = [];

    props.Customers.forEach((c) => {
      const favorite = props.UserInfo.Favorites.find((fav) => fav.Type === 'Customers' && fav.Number === c.ID);
      if (!!favorite) favorites.push(c);
    });

    props.Cases.forEach((c) => {
      const favorite = props.UserInfo.Favorites.find((fav) => fav.Type === 'Cases' && fav.Number === c.ID);
      if (!!favorite) favorites.push(c);
    });


    return favorites;
  }, [props.UserInfo, props.Customers, props.Cases]);

  const recents = React.useMemo(() => {
    if (!props.UserInfo?.Recent) return null;

    const userRecents: (ICustomer | ICase)[] = [];
    props.UserInfo?.Recent?.forEach((recent, i) => {
      if (recent.Type === 'Customers') {
        const customer = props.Customers.find((c) => c.ID === recent.Number);
        if (!!customer) userRecents.push({ ...customer, Recent: true, ID: i });
        return;
      }

      if (recent.Type === 'Cases') {
        const fcase = props.Cases.find((c) => c.ID === recent.Number);
        if (!!fcase) userRecents.push({ ...fcase, Recent: true, ID: i });
      }
    });

    return userRecents;
  }, [props.UserInfo, props.Customers]);

  // const myCases = React.useMemo(() => {
  //   return props.Cases;
  // }, [props.Cases]);

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

  const favoriteColumns: ICustomColumn[] = [
    {
      fieldName: 'Site',
      displayName: strings.site,
      sorting: false,
      width: 50,
      onRender: (item: (ICustomer | ICase)) => {
        let type = 'Customers';
        if ((item as ICase).Customer || (item as ICase).StartDate) type = 'Cases';

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
              onMouseDown={() => props.UpdateRecents({ Number: item.ID, Type: type, Name: item.Name })}
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
      onRender: (item: ICustomer | ICase) => {
        if ((item as ICase).Customer || (item as ICase).StartDate) return null;
        const style: React.CSSProperties = { height: '100%', width: '100%', borderRadius: '3px' };
        if ((item as ICustomer).SalesScore <= 2 && (item as ICustomer).SalesScore > 1) style.background = 'Orange';
        if ((item as ICustomer).SalesScore > 2) style.background = 'Red';
        return <div style={style} />;
      }
    },
    {
      fieldName: 'Clear',
      displayName: '',
      sorting: false,
      width: 50,
      onRender: (item: (ICustomer | ICase)) => {
        let type = 'Customers';
        if ((item as ICase).Customer || (item as ICase).StartDate) type = 'Cases';

        return <ActionButton iconProps={{ iconName: 'FavoriteStarFill' }} onClick={() => {
          props.UpdateFavorites({ Number: item.ID, Type: type, Name: item.Name }, false);
        }} />;
      }
    },
    {
      fieldName: 'Type',
      displayName: strings.type,
      width: 90,
      onRender: (item: (ICustomer | ICase)) => {
        let type = 'Customers';
        if ((item as ICase).Customer || (item as ICase).StartDate) type = 'Cases';
        return <Label title={type}>{type}</Label>;

      }
    },
    {
      fieldName: 'Number',
      displayName: strings.number,
      width: 95,
      // onRender: (item: (ICustomer | ICase)) => {
      //   return <span>{item.Number} - {item.Name}</span>;
      // }
    },
    {
      fieldName: 'Name',
      displayName: strings.name,
      width: 250,
      // onRender: (item: (ICustomer | ICase)) => {
      //   return <span>{item.Number} - {item.Name}</span>;
      // }
    }
  ];

  const recentColumns: ICustomColumn[] = [
    {
      fieldName: 'Site',
      displayName: strings.site,
      sorting: false,
      width: 50,
      onRender: (item: (ICustomer | ICase)) => {
        let type = 'Customers';
        if ((item as ICase).Customer || (item as ICase).StartDate) type = 'Cases';

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
              onMouseDown={() => props.UpdateRecents({ Number: item.ID, Type: type, Name: item.Name })}
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
      onRender: (item: ICustomer | ICase) => {
        if ((item as ICase).Customer || (item as ICase).StartDate) return null;
        const style: React.CSSProperties = { height: '100%', width: '100%', borderRadius: '3px' };
        if ((item as ICustomer).SalesScore <= 2 && (item as ICustomer).SalesScore > 1) style.background = 'Orange';
        if ((item as ICustomer).SalesScore > 2) style.background = 'Red';
        return <div style={style} />;
      }
    },
    {
      fieldName: 'Type',
      displayName: strings.type,
      width: 90,
      onRender: (item: (ICustomer | ICase)) => {
        let type = 'Customers';
        if ((item as ICase).Customer || (item as ICase).StartDate) type = 'Cases';
        return <Label title={type}>{type}</Label>;

      }
    },
    {
      fieldName: 'Number',
      displayName: strings.number,
      width: 95,
      // onRender: (item: (ICustomer | ICase)) => {
      //   return <span>{item.Number} - {item.Name}</span>;
      // }
    },
    {
      fieldName: 'Name',
      displayName: strings.name,
      width: 250,
      // onRender: (item: (ICustomer | ICase)) => {
      //   return <Label title={`${item.Number} - ${item.Name}`}>{item.Number} - {item.Name}</Label>;
      // }
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
    <section className={styles.myPage}>
      <div className={styles.container}>
        <div className={styles.content}>
          <HeaderLabel size={HeaderSize.H2} uppercase>{strings.mycustomers}</HeaderLabel>
          <div className={styles.row} style={{ flexWrap: 'wrap' }}>
            <HeaderLabel size={HeaderSize.H6} uppercase>{strings.searchspecific}</HeaderLabel>
            <Dropdown options={searchOptions} style={{ minWidth: 250 }} onChange={(e, v) => setSearchField(v.key + '')} selectedKey={searchField} />
            <SearchBox styles={{ root: { width: '100%', flex: 1 } }} placeholder={strings.search} onChange={(e, v) => setSearchValue(v)} value={searchValue} />
            {searchValue.length > 0 && <HeaderLabel size={HeaderSize.H6} uppercase disabled>{strings.results}: {myCustomers?.length ?? 0}</HeaderLabel>}
          </div>
          <CustomList columns={customerColumns} items={myCustomers} defaultSortingField='Number' />
        </div>
      </div>
      <div className={styles.sideBar}>
        <div className={styles.container}>
          <div className={styles.content}>
            <HeaderLabel size={HeaderSize.H2} uppercase>{strings.favorites}</HeaderLabel>
            <CustomList columns={favoriteColumns} items={myFavorites ?? null} defaultSortingField='Number' />
          </div>
          <div className={styles.content}>
            <HeaderLabel size={HeaderSize.H2} uppercase>{strings.recents}</HeaderLabel>
            <CustomList columns={recentColumns.map(c => ({ ...c, sorting: false }))} items={recents} defaultSortingField='ID' />
          </div>
        </div>
      </div>
    </section>
  );
};