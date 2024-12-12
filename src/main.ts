import "./style.css";

import { ICellData, LocaleType, ObjectMatrix, Univer, UniverInstanceType } from "@univerjs/core";
import { defaultTheme } from "@univerjs/design";
import { UniverDocsPlugin } from "@univerjs/docs";
import { UniverDocsUIPlugin } from "@univerjs/docs-ui";
import { UniverFormulaEnginePlugin } from "@univerjs/engine-formula";
import { UniverRenderEnginePlugin } from "@univerjs/engine-render";
import { UniverSheetsPlugin } from "@univerjs/sheets";
import { UniverSheetsFormulaPlugin } from "@univerjs/sheets-formula";
import { UniverSheetsFormulaUIPlugin } from "@univerjs/sheets-formula-ui";
import { IHoverCellPosition, UniverSheetsUIPlugin } from "@univerjs/sheets-ui";
import { UniverUIPlugin } from "@univerjs/ui";
import { UniverSheetsNumfmtPlugin } from "@univerjs/sheets-numfmt";
import Table from 'cli-table3';

import { createUniver } from '@univerjs/presets';
import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core';
import UniverPresetSheetsCoreEnUS from '@univerjs/presets/preset-sheets-core/locales/en-US';
 
import '@univerjs/presets/lib/styles/preset-sheets-core.css';

type CellData = {
  v: string; // The cell value
};

type Matrix = {
  [row: string]: {
    [column: string]: CellData;
  };
};

type SheetTable = {
  tableName: string,
  headers: string[],
  rows: { [key: string]: { [key: string]: string } },
}

 // Create sheet instance
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

// Hide grid lines
// sheet?.setHiddenGridlines(true);

univerAPI.getActiveWorkbook()?.onCellClick((cell) => {
  const matrix: Matrix = cell['location']['worksheet']['_cellData']['_matrix'];
  const range = sheet?.getActiveRange(); // Get the selected range
  console.log(matrix)

  // Step 1: Extract all data from the matrix
  const extractedData = extractTablesAndValues(matrix);

  // Step 2: Format the extracted data into JSON
  const fullSheetJSON = JSON.stringify(extractedData, null, 2);

  // Step 3: Log the concatenated string for the LLM prompt
  console.log(`Full Sheet Context:\n${fullSheetJSON}`);

  // Step 4: Log the selected range values
  if (range) {
    const selection = range['_range'];
    const startRow = selection['startRow'];
    const endRow = selection['endRow'];
    const startColumn = selection['startColumn'];
    const endColumn = selection['endColumn'];

    // Collect values within the selected range
    const rangeValues = [];
    for (let row = startRow; row <= endRow; row++) {
      const rowObject: {[key: string]: string} = {};
      for (let column = startColumn; column <= endColumn; column++) {
        const cellValue = matrix[row]?.[column]?.['v'];
        rowObject[`Column_${column + 1}`] = cellValue || "";
      }
      rangeValues.push({ [`Row_${row + 1}`]: rowObject });
    }

    const rangeJSON = JSON.stringify(rangeValues, null, 2);
    console.log(`Selected Range Values:\n${rangeJSON}`);
  }
});

// Function to extract tables and standalone values from the matrix
function extractTablesAndValues(matrix: Matrix) {
  const visited = new Set(); // Track visited cells
  const tables = [];
  const standaloneValues = [];

  // Cell with no value and has not been traversed is a valid cell
  const isValidCell = (row: string, column: string) =>
    matrix[row]?.[column]?.['v'] !== undefined && !visited.has(`${row},${column}`);

  // Helper to traverse a table to get data
  const traverseTable = (row: string, column: string, tableName: string, tableBounds: {}) => {
    const headers: string[] = [];
    const tables: SheetTable[] = [];
    const table: SheetTable = {
      tableName,
      headers,
      rows:
    };

    
    if (matrix[row]?.[column]) {
      const rowData: {[key:string]: string} = {};
      if (isValidCell(row, column)) {
        const cellValue = matrix[row][column]['v'];
        if (parseInt(row) === 0){ //identify headers when the row equal to 0 does not seem to work all the time
          headers.push(cellValue)
        }
        rowData[`Column_${parseInt(column) + 1}`] = cellValue;
        visited.add(`${row},${column}`); // Mark cell as visited
      }
      table.rows.push({
        [`Row_${parseInt(row) + 1}`]: rowData,
      });
      tables.push(table)
    }
    return tables;
  };


  for (const row in matrix) {
    for (const column in matrix[row]) {
      if (isValidCell(row, column)) {
        const cellValue = matrix[row][column]['v'];

        //check invalid row&col to get standalone values.
        const isStandalone =
        !matrix[+row - 1]?.[+column] &&      // Top
        !matrix[+row + 1]?.[+column] &&      // Bottom
        !matrix[+row]?.[+column - 1] &&      // Left
        !matrix[+row]?.[+column + 1]         // Right

        if (isStandalone) {
          standaloneValues.push({ [`Row_${parseInt(row) + 1}`]: { [`Column_${parseInt(column)+1}`]: cellValue } });
          visited.add(`${row},${column}`);
        } else { //for every table

          let table_name: string = "example_table"

          // ftt = farthest to the
          const ftt_left: string = matrix[+row]?.[+column - 1]?.['v'] === undefined ? column.toString() : "";
          const ftt_right: string = matrix[+row]?.[+column + 1]?.['v'] === undefined ? column.toString() : "";
          const ftt_top: string = matrix[+row - 1]?.[+column]?.['v'] === undefined ? row.toString() : "";
          const ftt_bottom: string = matrix[+row + 1]?.[+column]?.['v'] === undefined ? row.toString() : "";          

          const table_bounds: {[key: string]: {}} = {
            'left': ftt_left,
            'top': ftt_top,
            'right': ftt_right,
            'bottom': ftt_bottom
          }
          // Start of a new table
          const table = traverseTable(row, column, table_name, table_bounds);
          tables.push(table);
        }
      }
    }
  }

  return { tables, standaloneValues };
}

