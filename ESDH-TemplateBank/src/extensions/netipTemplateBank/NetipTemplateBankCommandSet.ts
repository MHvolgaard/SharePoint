import { Log } from '@microsoft/sp-core-library';
import {
  BaseListViewCommandSet,
  type Command,
  type IListViewCommandSetExecuteEventParameters,
  type ListViewStateChangedEventArgs
} from '@microsoft/sp-listview-extensibility';
import { SPService } from './services/SPService';
import AFService from './services/AFService';
import CustomDialog from './components/TemplateBank';

export interface INetipTemplateBankCommandSetProperties { }
const LOG_SOURCE: string = 'NetipTemplateBankCommandSet';

// You can get the folderPath of the currently opened document in a documentlibrary with: 'this.context.listView.folderInfo.folderPath'.
// For some unknown reason this returns an empty string if you have deleted a file in the folder.
// A workaround is to save the folderpath in a variable and only change it whenever 'this.context.listView.folderInfo.folderPath' is not equal to an empty string.
// the variable updates onInit and _onListViewStateChanged by calling the created function, updateSaveLocation.
// export let saveLocation: string = null;

let customDialog: CustomDialog = null;
export default class NetipTemplateBankCommandSet extends BaseListViewCommandSet<INetipTemplateBankCommandSetProperties> {

  public async onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'Initialized NetipTemplateBankCommandSet');

    // initial state of the command's visibility
    const compareOneCommand: Command = this.tryGetCommand('COMMAND_1');
    compareOneCommand.visible = false;

    this.updateSaveLocation();
    const initSuccess = await SPService.init(this.context);
    if (initSuccess) { // Only shows CommandSet if init has succeeded
      compareOneCommand.visible = true;
      customDialog = new CustomDialog();
    }

    AFService.init(this.context);
    customDialog.toggle(true);

    this.context.listView.listViewStateChangedEvent.add(this, this._onListViewStateChanged);
    return Promise.resolve();
  }

  public onExecute(event: IListViewCommandSetExecuteEventParameters): void {
    switch (event.itemId) {
      case 'COMMAND_1':
        customDialog.toggle();
        break;
      default:
        throw new Error('Unknown command');
    }
  }

  private _onListViewStateChanged = (args: ListViewStateChangedEventArgs): void => {
    Log.info(LOG_SOURCE, 'List view state changed');

    this.updateSaveLocation();
    this.raiseOnChange();
  }

  private updateSaveLocation(): void {
    if (!this.context.listView.folderInfo.folderPath) return;
    SPService.updateCurrentDirectory(this.context.listView.folderInfo.folderPath);
  }
}
