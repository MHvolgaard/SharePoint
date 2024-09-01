import * as React from 'react';
import { SP } from '../services/SP';
import { TProperties } from '../models/TProperties';
import { Label, Spinner, SpinnerSize } from '@fluentui/react';
import { ICustomer } from '../models/ICustomer';
import styles from './EsdhAdvisors.module.scss';
import { LivePersona } from '@pnp/spfx-controls-react';
import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IEsdhAdvisorsProps {
  context: WebPartContext;
}

export const EsdhAdvisors: React.FunctionComponent<IEsdhAdvisorsProps> = (props: React.PropsWithChildren<IEsdhAdvisorsProps>) => {
  const [properties, setProperties] = React.useState<TProperties>(null);
  const [customer, setCustomer] = React.useState<ICustomer>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    getProperties(); // eslint-disable-line @typescript-eslint/no-floating-promises
  }, []);

  React.useEffect(() => {
    if (!!properties?.ItemID) getCustomer(); // eslint-disable-line @typescript-eslint/no-floating-promises
  }, [properties]);

  async function getProperties(): Promise<void> {
    try {
      const data = await SP.getProperties();
      setProperties(data);
    } catch (error) {
      console.error('Properties unavailable', error);
    }
  }

  async function getCustomer(): Promise<void> {
    try {
      const data = await SP.getCustomer(properties.ListID, properties.ItemID);
      setCustomer(data);
    } catch (error) {
      console.error('Customer unavailable', error);
    }
    setLoading(true);
  }

  function renderUser(user): JSX.Element {
    return (
      <LivePersona upn={user.Email}
        serviceScope={props.context.serviceScope as any} // eslint-disable-line @typescript-eslint/no-explicit-any
        template={
          <div className={styles.advisor}>
            <div className={styles.image} style={{ backgroundImage: `url("/_layouts/15/userphoto.aspx?UserName=${user.Email}&size=L")` }} />
            <div className={styles.info}>
              <Label className={styles.title}>
                {user.Name}
              </Label>
              <Label className={styles.subtext}>
                {user.Title}
              </Label>
            </div>
          </div>
        } />
    );
  }

  return (
    <section className={styles.esdhAdvisors}>
      {!loading && <Spinner size={SpinnerSize.large} />}
      {!!loading && customer &&
        <div className={styles.container}>
          <Label className={styles.header}>Advisors</Label>
          {customer.Team.map(user => renderUser(user))}
        </div>
      }
    </section>
  );
};