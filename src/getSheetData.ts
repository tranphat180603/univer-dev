import { LocaleType, Tools, Univer, UniverInstanceType, FUniver, CellValue } from "@univerjs/core";
import { defaultTheme } from "@univerjs/design";
 
import { UniverFormulaEnginePlugin } from "@univerjs/engine-formula";
import { UniverRenderEnginePlugin } from "@univerjs/engine-render";
import { UniverUIPlugin } from "@univerjs/ui";
import { UniverDocsPlugin } from "@univerjs/docs";
import { UniverDocsUIPlugin } from "@univerjs/docs-ui";
import { UniverSheetsPlugin } from "@univerjs/sheets";
import { UniverSheetsUIPlugin } from "@univerjs/sheets-ui";
import { UniverSheetsFormulaPlugin } from "@univerjs/sheets-formula";
import { UniverSheetsFormulaUIPlugin } from "@univerjs/sheets-formula-ui";
import { UniverSheetsNumfmtPlugin } from "@univerjs/sheets-numfmt";
import { UniverSheetsNumfmtUIPlugin } from "@univerjs/sheets-numfmt-ui";
 
import DesignEnUS from '@univerjs/design/locale/en-US';
import UIEnUS from '@univerjs/ui/locale/en-US';
import DocsUIEnUS from '@univerjs/docs-ui/locale/en-US';
import SheetsEnUS from '@univerjs/sheets/locale/en-US';
import SheetsUIEnUS from '@univerjs/sheets-ui/locale/en-US';
import SheetsFormulaUIEnUS from '@univerjs/sheets-formula-ui/locale/en-US';
import SheetsNumfmtUIEnUS from '@univerjs/sheets-numfmt-ui/locale/en-US';
 
// The Facade API here is optional, you can decide whether to import it according to your needs
import '@univerjs/engine-formula/facade';
import '@univerjs/ui/facade';
import '@univerjs/docs-ui/facade';
import '@univerjs/sheets/facade';
import '@univerjs/sheets-ui/facade';
import '@univerjs/sheets-formula/facade';
import '@univerjs/sheets-numfmt/facade';
 
import "@univerjs/design/lib/index.css";
import "@univerjs/ui/lib/index.css";
import "@univerjs/docs-ui/lib/index.css";
import "@univerjs/sheets-ui/lib/index.css";
import "@univerjs/sheets-formula-ui/lib/index.css";


interface spreadsheet{
    sheet: FUniver
}

export default class Sheet implements spreadsheet{
  private _sheet: FUniver;
  private _univer: Univer;

  constructor(){
    this._univer = new Univer({
        theme: defaultTheme,
        locale: LocaleType.EN_US,
        locales: {
          [LocaleType.EN_US]: Tools.deepMerge(
            SheetsEnUS,
            DocsUIEnUS,
            SheetsUIEnUS,
            SheetsFormulaUIEnUS,
            UIEnUS,
            DesignEnUS,
          ),
        },
      });
    this._sheet = FUniver.newAPI(this._univer)
  }

  get sheet(){
    return this._sheet
  }

  create_sheet(): void{
    this._univer.registerPlugin(UniverRenderEnginePlugin);
    this._univer.registerPlugin(UniverFormulaEnginePlugin);
     
    this._univer.registerPlugin(UniverUIPlugin, {
      container: 'app',
    });
     
    this._univer.registerPlugin(UniverDocsPlugin);
    this._univer.registerPlugin(UniverDocsUIPlugin);
     
    this._univer.registerPlugin(UniverSheetsPlugin);
    this._univer.registerPlugin(UniverSheetsUIPlugin);
    this._univer.registerPlugin(UniverSheetsFormulaPlugin);
    this._univer.registerPlugin(UniverSheetsFormulaUIPlugin);
     
    this._univer.createUnit(UniverInstanceType.UNIVER_SHEET, {});
     
    this._sheet = FUniver.newAPI(this._univer);
  }

  get_sheet_data():void {
    const sheet = this._sheet.getActiveWorkbook()?.getActiveSheet();
    this._sheet.getHooks().onRendered(() => {
        if(sheet){
            const selection = sheet.getSelection();
            console.log(selection);
           
            const range = selection?.getActiveRange();
            console.log(range);
            return range
        }
        else{
            console.log("Can not get sheet!")
        }
      });
  }
}