import { DirectionalHint, Icon, Label, TooltipHost } from '@fluentui/react';
import * as React from 'react';
import styles from './LocationPath.module.scss';

export interface ILocationPathProps {
    locationPath: string[];
}

export const LocationPath: React.FunctionComponent<ILocationPathProps> = (props: React.PropsWithChildren<ILocationPathProps>) => {
    const [content, setContent] = React.useState<JSX.Element>(null);

    let usePath = null;
    React.useEffect(() => {
        usePath = props.locationPath?.slice(props.locationPath.length - 2);

        const result = <div className={styles.locationPath}>
            <Label dir="rtl">
                {usePath?.map((v, i) => {
                    return <>
                        {i === 0 && <>{v}<Icon iconName='ChevronRight' style={{ fontSize: 10, margin: '2px 5px 0px' }} /></>}
                        {i !== 0 && <span style={{ fontWeight: 600 }}>{v}</span>}
                    </>
                })}
                {props.locationPath?.length > 2 && <>
                    <Icon iconName='ChevronRight' style={{ fontSize: 10, margin: '2px 5px 0px' }} />
                    <Icon iconName='More' style={{ fontSize: 14, position: 'relative', top: 2 }} />
                </>}
            </Label>
        </div>

        setContent(result)
    }, [props.locationPath])

    return (
        <>
            {props.locationPath?.length > 2 && <TooltipHost content={props.locationPath?.join(' > ')} directionalHint={DirectionalHint.bottomCenter}>{content}</TooltipHost>}
            {props.locationPath?.length <= 2 && content}
        </>
    );
};