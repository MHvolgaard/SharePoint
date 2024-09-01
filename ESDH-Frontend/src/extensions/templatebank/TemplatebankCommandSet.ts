import { Log } from '@microsoft/sp-core-library';
import {
  BaseListViewCommandSet,
  type Command,
  type IListViewCommandSetExecuteEventParameters,
  type ListViewStateChangedEventArgs
} from '@microsoft/sp-listview-extensibility';
import CustomDialog from './components/TemplateBank';
import AFService from './services/AFService';
import { SPService } from './services/SPService';

/**
 * If your command set uses the ClientSideComponentProperties JSON input,
 * it will be deserialized into the BaseExtension.properties object.
 * You can define an interface to describe it.
 */
export interface ITemplatebankCommandSetProperties { }

const LOG_SOURCE: string = 'TemplatebankCommandSet';
let customDialog: CustomDialog = null;
export default class TemplatebankCommandSet extends BaseListViewCommandSet<ITemplatebankCommandSetProperties> {

  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'Initialized NetipTemplateBankCommandSet');
    console.log('Initialized NetipTemplateBankCommandSet');

    // initial state of the command's visibility
    const compareOneCommand: Command = this.tryGetCommand('COMMAND_1');
    compareOneCommand.visible = false;

    const initSuccess = await SPService.init(this.context);
    AFService.init(this.context);
    if (initSuccess) { // Only shows CommandSet if init has succeeded
      const folderUrl = this.context.listView.folderInfo.folderPath.replace(this.context.pageContext.web.serverRelativeUrl, '');
      const count = (folderUrl.match(/\//g) || []).length; // count the number of slashes in the folder url

      if (count > 1) {
        if (!customDialog) customDialog = new CustomDialog();
        compareOneCommand.visible = true;
      }
    }
    this.updateSaveLocation();

    this.context.listView.listViewStateChangedEvent.add(this, this._onListViewStateChanged);
    return Promise.resolve();
  }

  public onExecute(event: IListViewCommandSetExecuteEventParameters): void {
    console.log('event', event);
    switch (event.itemId) {
      case 'COMMAND_1':
        customDialog.show();
        break;
      default:
        throw new Error('Unknown command');
    }
  }

  private _onListViewStateChanged = (args: ListViewStateChangedEventArgs): void => {
    Log.info(LOG_SOURCE, 'List view state changed');
    const compareOneCommand: Command = this.tryGetCommand('COMMAND_1');
    compareOneCommand.visible = false;


    this.updateSaveLocation();

    const folderUrl = this.context.listView.folderInfo.folderPath.replace(this.context.pageContext.web.serverRelativeUrl, '');
    const count = (folderUrl.match(/\//g) || []).length; // count the number of slashes in the folder url

    if (count > 1) {
      if (!customDialog) customDialog = new CustomDialog();
      compareOneCommand.visible = true;

    }

    this.raiseOnChange();

  }

  private updateSaveLocation(): void {
    if (!this.context.listView.folderInfo.folderPath) return;
    SPService.updateCurrentDirectory(this.context.listView.folderInfo.folderPath);
  }
}
