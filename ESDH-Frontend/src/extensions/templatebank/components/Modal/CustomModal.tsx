import * as React from 'react';
import styles from './CustomModal.module.scss';
import { Label } from '@fluentui/react';

export interface CustomModalProps {
	showModal: boolean;
	onDismiss(ev: React.MouseEvent<HTMLDivElement, MouseEvent>): void;
	title?: string;
	children?: React.ReactNode;
	contentStyle: React.CSSProperties;
}

export const CustomModal: React.FunctionComponent<CustomModalProps> = (props: React.PropsWithChildren<CustomModalProps>) => {
	return (
		<>
			{props.showModal &&
				<div className={styles.customModal} onClick={props.onDismiss} >
					<div className={styles.content}
						style={props.contentStyle}
						onClick={ev => ev.stopPropagation()}
					>
						{props.title && <Label className={styles.title}>{props.title}</Label>}
						{props.children}
					</div>
				</div >
			}
		</>
	);
}
