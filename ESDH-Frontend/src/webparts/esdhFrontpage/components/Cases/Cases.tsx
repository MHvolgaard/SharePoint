import * as React from 'react';
import styles from './Cases.module.scss';
import { ActionButton, Dropdown, FontIcon, IDropdownOption, Label, Link, SearchBox, Spinner, SpinnerSize, Toggle } from '@fluentui/react';
import { ICase } from '../../models/ICase';
import { ICustomColumn, CustomList } from '../CustomList/CustomList';
import { HeaderLabel, HeaderSize } from '../HeaderLabel/HeaderLabel';
import { IUserInfo, IUserItem } from '../../models/IUserInfo';
import { formatDate } from '../../../../helpers';
import strings from 'EsdhFrontpageWebPartStrings';


// const caseColumns: IColumn[] = [
//   {
//     key: 'customer',
//     name: 'Customer',
//     fieldName: 'Customer.Id',
//     minWidth: 70,
//     maxWidth: 90,
//     isResizable: true,
//     isPadded: true,
//     onRender: (item: ICase) => {
//       if (!item.Customer) return;
//       return <span>{item.Customer.Number} - {item.Customer.Name}</span>;
//     }
//   },
//   {
//     key: 'Number',
//     name: 'Number',
//     fieldName: 'Number',
//     minWidth: 210,
//     maxWidth: 350,
//     isRowHeader: true,
//     isResizable: true,
//     isSorted: true,
//     isSortedDescending: false,
//     isPadded: true,
//     // data: 'string',
//   },
//   {
//     key: 'Name',
//     name: 'Name',
//     fieldName: 'Name',
//     minWidth: 70,
//     maxWidth: 90,
//     isResizable: true,
//     isCollapsible: true,
//     isPadded: true,
//     // data: 'number',  
//   },
//   {
//     key: 'StartDate',
//     name: 'Start Date',
//     fieldName: 'StartDate',
//     minWidth: 70,
//     maxWidth: 90,
//     isResizable: true,
//     isCollapsible: true,
//     isPadded: true,
//     // data: 'string',
//   }
// ];

export interface ICasesProps {
  Cases: ICase[];
  UserInfo: IUserInfo;
  UpdateRecents(item: IUserItem): void;
  UpdateFavorites(item: IUserItem, add: boolean): void;
}

export const Cases: React.FunctionComponent<ICasesProps> = (props: React.PropsWithChildren<ICasesProps>) => {
  const [searchField, setSearchField] = React.useState<string>('');
  const [searchValue, setSearchValue] = React.useState<string>('');
  const [showMyCases, setShowMyCases] = React.useState<boolean>(true);

  const cases = React.useMemo(() => {
    if (!props.Cases) return null;

    let cases = props.Cases.map((c) => {
      const favorite = props.UserInfo.Favorites.find((fav) => fav.Type === 'Cases' && fav.Number === c.ID);
      return { ...c, Favorite: !!favorite };
    });

    if (showMyCases) {
      cases = cases.filter(c => c.AssignedTo === props.UserInfo.Id);
    }

    if (searchValue.length > 0) {
      if (searchField?.length === 0) {
        cases = cases.filter(item => {
          const value = searchValue.toLowerCase();
          return JSON.stringify(item).indexOf(value) > -1;
        });

      } else {
        cases = cases.filter(item => {
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

    return cases;
  }, [props.UserInfo, props.Cases, searchField, searchValue, showMyCases]);

  const caseColumns: ICustomColumn[] = [
    {
      fieldName: 'SiteStatus',
      displayName: strings.site,
      sorting: true,
      width: 50,
      onRender: (item: ICase) => {
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
              onMouseDown={() => props.UpdateRecents({ Number: item.ID, Type: 'Case', Name: item.Name })}
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
      fieldName: 'Favorite',
      displayName: '',
      sorting: false,
      width: 50,
      onRender: (item: ICase) => {
        if (!item.Favorite) return <ActionButton iconProps={{ iconName: 'FavoriteStar' }} onClick={() => {
          props.UpdateFavorites({ Number: item.ID, Type: 'Cases', Name: item.Name }, true);
        }} />;
        return <ActionButton iconProps={{ iconName: 'FavoriteStarFill' }} onClick={() => {
          props.UpdateFavorites({ Number: item.ID, Type: 'Cases', Name: item.Name }, false);
        }} />;
      }
    },
    {
      fieldName: 'Customer.ID',
      displayName: strings.customer,
      width: 350,
      onRender: (item: ICase) => {
        if (!item.Customer) return;
        return <Label aria-label={`${item.Customer.Number} - ${item.Customer.Name}`} title={`${item.Customer.Number} - ${item.Customer.Name}`}>{item.Customer.Number} - {item.Customer.Name}</Label>;
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
      fieldName: 'StartDate',
      displayName: strings.startdate,
      width: 120,
      onRender: (item: ICase) => {
        return <Label>{formatDate(item.StartDate)}</Label>;
      }
    }
  ];

  const searchOptions: IDropdownOption[] = React.useMemo(() => {
    const options: IDropdownOption[] = [{ key: '', text: '' }];
    caseColumns.filter(c => c.displayName?.length > 0).forEach(c => {
      options.push({ key: c.fieldName, text: c.displayName });
    });

    return options;
  }, [caseColumns]);

  return (
    <section className={styles.cases}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.row} style={{ alignItems: 'center', padding: 0 }}>
            <HeaderLabel size={HeaderSize.H2} uppercase style={{ marginRight: 'auto' }}>{showMyCases ? strings.mycases : strings.cases}</HeaderLabel>
            <HeaderLabel size={HeaderSize.H6} uppercase disabled>{strings.showonlymycases}</HeaderLabel>
            <Toggle onChange={() => setShowMyCases(prev => !prev)} checked={showMyCases} styles={{ root: { marginBottom: 0, display: 'flex', alignItems: 'center' } }} />
          </div>
          <div className={styles.row}>
            <HeaderLabel size={HeaderSize.H6} uppercase>{strings.searchspecific}</HeaderLabel>
            <Dropdown options={searchOptions} style={{ minWidth: 250 }} onChange={(e, v) => setSearchField(v.key + '')} selectedKey={searchField} />
            <SearchBox styles={{ root: { width: '100%' } }} placeholder={strings.search} onChange={(e, v) => setSearchValue(v)} value={searchValue} />
            {searchValue.length > 0 && <HeaderLabel size={HeaderSize.H6} uppercase disabled>{strings.results}: {cases.length}</HeaderLabel>}
          </div>
          <CustomList columns={caseColumns} items={cases} defaultSortingField='Number' />
        </div>
      </div>
    </section>
  );
};