import { Label } from '@fluentui/react';
import * as React from 'react';
import styles from './HeaderLabel.module.scss';

export enum HeaderSize {
  H1 = 'h1',
  H2 = 'h2',
  H3 = 'h3',
  H4 = 'h4',
  H5 = 'h5',
  H6 = 'h6'
}

export interface IHeaderLabelProps {
  children: React.ReactNode;
  size: HeaderSize;
  uppercase?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export const HeaderLabel: React.FunctionComponent<IHeaderLabelProps> = (props: React.PropsWithChildren<IHeaderLabelProps>) => {
  const [style, setStyle] = React.useState<React.CSSProperties>({});

  function setClass(): string {
    switch (props.size) {
      case HeaderSize.H1:
        return styles.h1;
      case HeaderSize.H2:
        return styles.h2;
      case HeaderSize.H3:
        return styles.h3;
      case HeaderSize.H4:
        return styles.h4;
      case HeaderSize.H5:
        return styles.h5;
      case HeaderSize.H6:
        return styles.h6;

      default:
        return;
    }
  }

  React.useEffect(() => {
    let styleResult: React.CSSProperties = {};
    if (props.style) styleResult = props.style;
    if (props.uppercase) styleResult.textTransform = 'uppercase';
    setStyle(styleResult);
  }, [props.style]);


  return (
    <Label className={`${styles.header} ${setClass()} ${props.disabled && styles.disabled}`} style={style}>
      {props.children}
    </Label>
  );
};