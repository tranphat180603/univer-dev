import "./style.css";

import { LocaleType, Univer, UniverInstanceType } from "@univerjs/core";
import { defaultTheme } from "@univerjs/design";
import { UniverDocsPlugin } from "@univerjs/docs";
import { UniverDocsUIPlugin } from "@univerjs/docs-ui";
import { UniverFormulaEnginePlugin } from "@univerjs/engine-formula";
import { UniverRenderEnginePlugin } from "@univerjs/engine-render";
import { UniverSheetsPlugin } from "@univerjs/sheets";
import { UniverSheetsFormulaPlugin } from "@univerjs/sheets-formula";
import { UniverSheetsFormulaUIPlugin } from "@univerjs/sheets-formula-ui";
import { UniverSheetsUIPlugin } from "@univerjs/sheets-ui";
import { UniverUIPlugin } from "@univerjs/ui";
import { UniverSheetsNumfmtPlugin } from "@univerjs/sheets-numfmt";

import { createUniver } from '@univerjs/presets';
import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core';
import UniverPresetSheetsCoreEnUS from '@univerjs/presets/preset-sheets-core/locales/en-US';
 
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
 
const { univerAPI } = createUniver({
  locale: LocaleType.EN_US,
  locales: {
    enUS: UniverPresetSheetsCoreEnUS,
  },
  theme: defaultTheme,
  presets: [
    UniverSheetsCorePreset({
      container: 'app',
    }),
  ],
});
 
univerAPI.createUniverSheet({ name: 'Test Sheet' });

const sheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
sheet?.setHiddenGridlines(true)
 
univerAPI.getActiveWorkbook()?.onCellClick((cell) => {
  const matrix = cell['location']['worksheet']['_cellData']['_matrix']

  // Iterate through the top-level keys (e.g., 2, 3)
for (const key in matrix) {
  if (Object.prototype.hasOwnProperty.call(matrix, key)) {
      const nestedObject = matrix[key]; // Access the nested object

      // Iterate through the nested object keys (e.g., 0, 3, 4, 5)
      for (const nestedKey in nestedObject) {
          if (Object.prototype.hasOwnProperty.call(nestedObject, nestedKey)) {
              console.log(`row[${key}]column[${nestedKey}]`, nestedObject[nestedKey]);
          }
      }
  }
}
  // const selection = sheet?.getSelection();
  // if (selection) {
    
  //   const range = sheet?.getRange(0, 0, 2, 2);
  //   const value = range?.getValue();

  //   console.log(value)

    
  //   if (range){
  //     console.log(range["_worksheet"]['_cellData']['_matrix'])
  //   }
  }
  // else{console.log("None")}
);

// const activeWorkbook = univerAPI.getActiveWorkbook();
// activeWorkbook?.onSelectionChange((selection) => {
//   console.log(selection);
// });