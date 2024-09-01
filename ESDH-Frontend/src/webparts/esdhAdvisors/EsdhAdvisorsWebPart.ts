import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { type IPropertyPaneConfiguration, } from '@microsoft/sp-property-pane';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import * as strings from 'EsdhAdvisorsWebPartStrings';
import { EsdhAdvisors, IEsdhAdvisorsProps } from './components/EsdhAdvisors';
import { SP } from './services/SP';
import { MSGraph } from './services/MSGraph';

export interface IEsdhAdvisorsWebPartProps {
}

export default class EsdhAdvisorsWebPart extends BaseClientSideWebPart<IEsdhAdvisorsWebPartProps> {

  private _isDarkTheme: boolean = false;
  private _environmentMessage: string = '';

  public render(): void {
    const element: React.ReactElement<IEsdhAdvisorsProps> = React.createElement(
      EsdhAdvisors, {
      context: this.context,
    }
    );

    ReactDom.render(element, this.domElement);
  }

  protected onInit(): Promise<void> {
    SP.init(this.context);
    MSGraph.Init(this.context);
    return this._getEnvironmentMessage().then(message => {
      this._environmentMessage = message;
    });
  }


  private _getEnvironmentMessage(): Promise<string> {
    if (!!this.context.sdks.microsoftTeams) { // running in Teams, office.com or Outlook
      return this.context.sdks.microsoftTeams.teamsJs.app.getContext()
        .then(context => {
          let environmentMessage: string = '';
          switch (context.app.host.name) {
            case 'Office': // running in Office
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOffice : strings.AppOfficeEnvironment;
              break;
            case 'Outlook': // running in Outlook
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentOutlook : strings.AppOutlookEnvironment;
              break;
            case 'Teams': // running in Teams
            case 'TeamsModern':
              environmentMessage = this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentTeams : strings.AppTeamsTabEnvironment;
              break;
            default:
              environmentMessage = strings.UnknownEnvironment;
          }

          return environmentMessage;
        });
    }

    return Promise.resolve(this.context.isServedFromLocalhost ? strings.AppLocalEnvironmentSharePoint : strings.AppSharePointEnvironment);
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    if (!currentTheme) {
      return;
    }

    this._isDarkTheme = !!currentTheme.isInverted;
    const {
      semanticColors
    } = currentTheme;

    if (semanticColors) {
      this.domElement.style.setProperty('--bodyText', semanticColors.bodyText || null);
      this.domElement.style.setProperty('--link', semanticColors.link || null);
      this.domElement.style.setProperty('--linkHovered', semanticColors.linkHovered || null);
    }

  }

  protected onDispose(): void {
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    return {
      pages: [
        // {
        //   header: {
        //     description: strings.PropertyPaneDescription
        //   },
        //   groups: [
        //     {
        //       groupName: strings.BasicGroupName,
        //       groupFields: [
        //         PropertyFieldListPicker('CustomerListGuid', {
        //           label: 'Select customer list',
        //           selectedList: this.properties.CustomerListGuid,
        //           includeHidden: false,
        //           orderBy: PropertyFieldListPickerOrderBy.Title,
        //           onPropertyChange: this.onPropertyPaneFieldChanged.bind(this),
        //           properties: this.properties,
        //           context: this.context,
        //           onGetErrorMessage: null,
        //           deferredValidationTime: 0,
        //           key: 'CustomerListGuid'
        //         })
        //       ]
        //     }
        //   ]
        // }
      ]
    };
  }
}
