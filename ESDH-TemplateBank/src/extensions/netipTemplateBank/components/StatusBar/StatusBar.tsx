

// import * as React from 'react';
// import { MessageBar, MessageBarType } from '@fluentui/react';
// import styles from './StatusBar.module.scss';

// export interface IStatusBarProps {
//     show: boolean;
//     messageBarType: MessageBarType;
//     onHidden(): void;
// }

// export type TMessageBar = {
//     show: boolean;
//     messageBarType: MessageBarType;
//     content: JSX.Element;
// }

// export const StatusBar: React.FunctionComponent<IStatusBarProps> = (props: React.PropsWithChildren<IStatusBarProps>) => {
//     const [showBar, setShowBar] = React.useState<boolean>(false);

//     React.useEffect(() => {
//         if (props.show) setShowBar(true);
//     }, [props.show]); // if messagebar was closed manually this doesnt run on create, as props.show was never false.

//     function animationEnd(): void {
//         if (!props.show) setShowBar(false); // if statement in case the Bar is closed manually and a new is shown.
//     }

//     React.useEffect(() => {
//         if (!showBar) props.onHidden();
//     }, [showBar])

//     return (
//         <>
//             {showBar &&
//                 <div className={props.show ? styles.mount : styles.unmount} onAnimationEnd={animationEnd}>
//                     <MessageBar className={styles.messageBar}
//                         // actions={
//                         //   <div>
//                         //     <MessageBarButton>Yes</MessageBarButton>
//                         //     <MessageBarButton>No</MessageBarButton>
//                         //   </div>
//                         // }
//                         messageBarType={props.messageBarType}
//                         isMultiline={false}
//                         onDismiss={() => setShowBar(false)}
//                     >
//                         {props.children}
//                         {/* <>
//                                 The file, {props.content?.FileName + "." + props.content?.FileExtension} has been created.
//                                 <Link href={props.content?.FileRef} target="_blank" underline>
//                                     Go to file.
//                                 </Link>
//                             </>
//                             <>
//                                 Failed to create file, {props.content?.FileName + "." + props.content?.FileExtension}.
//                             </> */}
//                     </MessageBar>
//                 </div >
//             }
//         </>
//     );
// };