import * as React from 'react';
import { TProperties } from '../models/TProperties';
import { SPService } from '../services/SPService';
import { Link, Persona, PersonaSize, Spinner, SpinnerSize } from '@fluentui/react';
import styles from './EsdhItemDetails.module.scss';
import { TDetailsRenderRow } from '../models/TDetailsRenderRow';
import strings from 'EsdhItemDetailsWebPartStrings';
import { formatDate } from '../../../helpers';

export interface IEsdhItemDetailsProps { }

export const EsdhItemDetails: React.FunctionComponent<IEsdhItemDetailsProps> = (props: React.PropsWithChildren<IEsdhItemDetailsProps>) => {
  const [properties, setProperties] = React.useState<TProperties>(null);
  const [detailsData, setDetailsData] = React.useState<TDetailsRenderRow[]>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  React.useEffect(() => {
    getProperties(); // eslint-disable-line @typescript-eslint/no-floating-promises
  }, []);

  async function getProperties(): Promise<void> {
    try {
      const data = await SPService.getProperties();
      setProperties(data);
    } catch (error) {
      console.error('Properties unavailable', error);
    }
    setLoading(true);
  }

  React.useEffect(() => {
    if (!!properties) {
      getDetailsData(); // eslint-disable-line @typescript-eslint/no-floating-promises
    }
  }, [properties]);

  async function getDetailsData(): Promise<void> {
    try {
      const data = await SPService.getDetailsAsDataStream(properties);
      setDetailsData(data);
    } catch (error) {
      console.error('Item data unavailable', error);
    }
    setLoading(false);
  }

  function renderRowValue(row: TDetailsRenderRow): JSX.Element {
    if (!row.Value) return <span className={styles.metadataValueNone}>({strings.None})</span>;
    switch (row.Type) {
      case 'Text':
      case 'Number':
        if (row.Description.includes('mailto')) return <Link href={"mailto:" + row.Value}>{row.Value}</Link>;
        if (row.Description.includes('tel')) return <Link href={"tel:" + row.Value}>{row.Value}</Link>;
        return <span className={styles.metadataValue}>{row.Value}</span>;
      case 'DateTime':
        return <span className={styles.metadataValue}>{formatDate(new Date(row.Value))}</span>;
      case 'Boolean':
        return <span className={styles.metadataValue}>{row.Value ? strings.Yes : strings.No}</span>;
      case 'Lookup':
        return row.Value.map((v, i) => <span key={i} className={styles.metadataValue}>{v.lookupValue}</span>);
      case 'User':
        return row.Value.map((v, i) => <Persona
          key={i}
          imageUrl={v.picture}
          text={v.title}
          secondaryText={v.jobTitle}
          size={PersonaSize.size40}
        />);
      default:
        console.error('Unknown type', row.Type);
        return <></>;
    }
  }

  return (
    <>
      {!properties && !loading && <></>}
      {!!properties && loading && <div className={styles.spinnerContainer}><Spinner size={SpinnerSize.large} /></div>}

      {!!detailsData && !loading &&

        <div className={styles.esdhItemMetadata}>
          <div className={styles.titleContainer}>
            <div className={styles.title}>
              {properties.Type === 'Customer' && strings.CustomerHeader}
              {properties.Type === 'Case' && strings.CaseHeader}
            </div>
          </div>
          <div className={styles.metadataContainer}>
            {detailsData.map((row, index) =>
              <div
                key={index}
                className={styles.metadataRow}
              >
                <label
                  className={styles.metadataLabel}
                >
                  {row.DisplayName}
                </label>
                {renderRowValue(row)}
              </div>
            )}
          </div>
        </div >

      }
    </>
  );
};