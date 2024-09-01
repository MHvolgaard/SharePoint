import { Log } from '@microsoft/sp-core-library';
import {
  BaseListViewCommandSet,
  type Command,
  type IListViewCommandSetExecuteEventParameters,
  type ListViewStateChangedEventArgs
} from '@microsoft/sp-listview-extensibility';
import { SP } from './services/SP';
import CustomDialog from './components/Penneo';
import { AF } from './services/AF';
import { PenneoService } from './services/PenneoService';

export interface IPenneoCommandSetProperties {
}

const LOG_SOURCE: string = 'PenneoCommandSet';

let customDialog: CustomDialog = null;
export default class PenneoCommandSet extends BaseListViewCommandSet<IPenneoCommandSetProperties> {

  public onInit(): Promise<void> {
    Log.info(LOG_SOURCE, 'Initialized PenneoCommandSet');
    console.log('Initialized Penneo');

    // initial state of the command's visibility
    const compareOneCommand: Command = this.tryGetCommand('COMMAND_1');
    compareOneCommand.visible = false;

    SP.init(this.context);
    AF.init(this.context);
    PenneoService.init(this.context);

    this.context.listView.listViewStateChangedEvent.add(this, this._onListViewStateChanged);


    if (!customDialog) customDialog = new CustomDialog();


    return Promise.resolve();
  }

  public onExecute(event: IListViewCommandSetExecuteEventParameters): void {
    const selectedIds: number[] = [];
    this.context.listView.selectedRows.forEach((row) => {
      if (row.getValueByName('File_x0020_Type') !== '') {
        selectedIds.push(row.getValueByName('ID'));
      }
    });


    switch (event.itemId) {
      case 'COMMAND_1':
        customDialog.show(selectedIds);
        break;
      default:
        throw new Error('Unknown command');
    }
  }

  private _onListViewStateChanged = (args: ListViewStateChangedEventArgs): void => {
    Log.info(LOG_SOURCE, 'List view state changed');
    const compareOneCommand: Command = this.tryGetCommand('COMMAND_1');
    compareOneCommand.visible = false;

    const folderUrl = this.context.listView.folderInfo.folderPath.replace(this.context.pageContext.web.serverRelativeUrl, '');
    const count = (folderUrl.match(/\//g) || []).length; // count the number of slashes in the folder url

    if (count > 1) {
      const selectedRows = this.context.listView.selectedRows;
      const selectedPDFs = selectedRows.filter((row) => row.getValueByName('File_x0020_Type')?.toLowerCase() === 'pdf');

      if (selectedPDFs.length > 0) {
        if (!customDialog) customDialog = new CustomDialog();
        compareOneCommand.visible = true;
      }
    }

    this.raiseOnChange();
  }
}
