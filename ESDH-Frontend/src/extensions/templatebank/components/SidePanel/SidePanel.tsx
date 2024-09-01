import * as React from 'react';
import styles from './SidePanel.module.scss';

export interface ISidePanelProps { }

export const SidePanel: React.FunctionComponent<ISidePanelProps> = (props: React.PropsWithChildren<ISidePanelProps>) => {
	return (
		<>
			<div className={styles.sidePanel}>
				{props.children}
			</div>
		</>
	);
};