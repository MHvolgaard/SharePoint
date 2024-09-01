import * as React from 'react';
import styles from './EsdhFrontpage.module.scss';
import { MyPage } from './MyPage/MyPage';
import { Cases } from './Cases/Cases';
import { Customers } from './Customers/Customers';
import { IUserItem, IUserInfo } from '../models/IUserInfo';
import { ICustomer } from '../models/ICustomer';
import { ICase } from '../models/ICase';
import { SP } from '../services/SP';
import ReactDOM from 'react-dom';
import equal from 'fast-deep-equal';
import { DefaultButton } from '@fluentui/react';
import strings from 'EsdhFrontpageWebPartStrings';

export interface IEsdhFrontpageProps { }

enum ViewType {
  MyPage = 1,
  Customers = 2,
  Cases = 3
}

export const EsdhFrontpage: React.FunctionComponent<IEsdhFrontpageProps> = (props: React.PropsWithChildren<IEsdhFrontpageProps>) => {
  const [view, setView] = React.useState<ViewType>(ViewType.MyPage);
  const [userInfo, setUserInfo] = React.useState<IUserInfo>(null);
  const [customers, setCustomers] = React.useState<ICustomer[]>(null);
  const [cases, setCases] = React.useState<ICase[]>(null);

  React.useEffect(() => {
    const fetchData = async (): Promise<void> => {
      const userInfo: IUserInfo = await SP.getUserInfo();
      const customers: ICustomer[] = await SP.getCustomers();
      const cases: ICase[] = await SP.getCases();

      ReactDOM.unstable_batchedUpdates(() => {
        setUserInfo(userInfo);
        setCustomers(customers);
        setCases(cases);
        // setFavorites(favorites);
      });
    };

    fetchData(); // eslint-disable-line @typescript-eslint/no-floating-promises
  }, []);

  React.useEffect(() => {
    const saveData = async (): Promise<void> => {
      await SP.setUserSettings(userInfo);
    };

    if (!!userInfo) saveData(); // eslint-disable-line @typescript-eslint/no-floating-promises
  }, [userInfo])


  function renderView(): JSX.Element {
    switch (view) {
      case ViewType.MyPage:
        return <MyPage
          UserInfo={userInfo}
          Customers={customers}
          Cases={cases}
          UpdateFavorites={updateFavorites}
          UpdateRecents={updateRecents}
        />;
      case ViewType.Customers:
        return <Customers
          UserInfo={userInfo}
          Customers={customers}
          UpdateFavorites={updateFavorites}
          UpdateRecents={updateRecents}
        />;
      case ViewType.Cases:
        return <Cases Cases={cases}
          UserInfo={userInfo}
          UpdateFavorites={updateFavorites}
          UpdateRecents={updateRecents} />;
    }
  }

  async function updateFavorites(item: IUserItem, add: boolean): Promise<void> {
    let updateItems = [...userInfo.Favorites];
    if (add) {
      if (updateItems.find(i => i === item)) return;
      updateItems.push({ Type: item.Type, Number: item.Number, Name: item.Name });
    } else {
      updateItems = userInfo.Favorites.filter(f => {
        if (f.Type !== item.Type) return true;
        if (f.Number !== item.Number) return true;
        else return false;
      });

      if (equal(updateItems, userInfo.Favorites)) return;
    }
    setUserInfo(prev => ({ ...prev, Favorites: updateItems }));
  }

  async function updateRecents(item: IUserItem): Promise<void> {
    let updateItems = [...userInfo.Recent];

    updateItems = updateItems.filter(f => {
      if (f.Type !== item.Type) return true;
      if (f.Number !== item.Number) return true;
      else return false;
    });

    updateItems.unshift({ Type: item.Type, Number: item.Number, Name: item.Name });

    updateItems = updateItems.slice(0, 10);
    if (equal(updateItems, userInfo.Recent)) return;

    setUserInfo(prev => ({ ...prev, Recent: updateItems }));
  }

  return (
    <div className={styles.esdhFrontpage}>
      <div className={styles.nav}>
        <div className={styles.row}>
          <DefaultButton
            text={strings.mypage}
            onClick={() => setView(ViewType.MyPage)}
            className={view === ViewType.MyPage ? styles.active : ''}
          />
          <DefaultButton
            text={strings.customers}
            onClick={() => setView(ViewType.Customers)}
            className={view === ViewType.Customers ? styles.active : ''}
          />
          <DefaultButton
            text={strings.cases}
            onClick={() => setView(ViewType.Cases)}
            className={view === ViewType.Cases ? styles.active : ''}
          />
        </div>
        {/* <div className={styles.row}>
          <Label>Hej {userInfo?.Title}</Label>
          <Persona size={PersonaSize.size24} imageInitials='MS' />
        </div> */}
      </div>

      <div className={styles.content}>
        {renderView()}
      </div>
    </div>
  );
};