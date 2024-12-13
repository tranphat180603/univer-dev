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

import Gemini from "./LLMservice";

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
  tableBounds: {[key: string]: {}}
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

//Global declaration
univerAPI.createUniverSheet({ name: 'Test Sheet' });
const sheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
var fullSheetJSON: string = ""
var LLMresponse: string = ""
var matrix: Matrix = {};
var range = sheet?.getActiveRange(); // Get the selected range


// Function to update the sheet with LLM response
async function updateSheetWithLLMResponse(LLMresponse: string) {
  if (LLMresponse !== "") {
      try {
          // Sanitize the LLM response to remove backticks and formatting
          const sanitizedResponse = LLMresponse.replace(/```[\s\S]*?\n|```/g, "").trim();

          // Parse the sanitized LLM response JSON
          const response = JSON.parse(sanitizedResponse);

          // Get the active sheet instance
          const sheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
          if (!sheet) {
              console.error("Sheet not found");
              return;
          }

          // Iterate through each table in the response
          response.tables.forEach((table: any) => {
              const { rows, tableBounds } = table;

              // Get bounds
              const startRow = parseInt(tableBounds.top);
              const endRow = parseInt(tableBounds.bottom);
              const startCol = parseInt(tableBounds.left);
              const endCol = parseInt(tableBounds.right);

              // Prepare data array to update
              const data: { v: string | number }[][] = [];

              for (let row = startRow; row <= endRow; row++) {
                  const rowKey = `Row_${row}`;
                  const rowData = rows[rowKey] || {}; // Default to empty object if row doesn't exist
                  const rowValues: { v: string | number }[] = [];

                  for (let col = startCol; col <= endCol; col++) {
                      const colKey = `Column_${col}`;
                      rowValues.push({ v: rowData[colKey] || "" }); // Default to empty string if column value is missing
                  }

                  data.push(rowValues);
              }

              // Update values in the specified range
              const range = sheet.getRange(startRow, startCol, endRow - startRow + 1, endCol - startCol + 1);
              range.setValues(data);
          });

          console.log("Sheet successfully updated with LLM response.");
      } catch (error) {
          console.error("Error processing LLM response:", error);
      }
  } else {
      console.warn("LLM response is empty. No updates performed.");
  }
}



// Attach the event listener when the app loads
window.addEventListener("keydown", async (event) =>  {
  // Check for Ctrl + A
  if (event.ctrlKey && event.key === "s") {
    event.preventDefault(); // Prevent default behavior of Ctrl + A
    const userInput = window.prompt("Enter your text:", ""); // Open a prompt box

    if (userInput !== null) {
      const meta_prompt: string = `
      You are given this task : ${userInput} and the data structure which has been processed into JSON from spreadsheets table data. Here is the data:
      ${fullSheetJSON}
      The JSON format is an abstraction of tabular data on spreadsheet. Each cell data has 2 keys, the first one is row and the second one is column.
      For every row, there are some columns with no values which means there are missing values in these cells coordinates.
      Complete the command the user ask by doing it your own. Response only in valid JSON format, no words/text should be outside of the JSON as I would use it to parse directly.
      You may use every keys of row and column that you think is suitable for the problems.
      Act as an independent agent solving the problem yourself!
      `;
      const gemini = new Gemini()
      LLMresponse = await gemini.reply(meta_prompt)
      console.log(`User prompt: ${meta_prompt}`)
      console.log(`Response: ${LLMresponse}`)
    }
    if (LLMresponse !== ""){
      updateSheetWithLLMResponse(LLMresponse)
    }
  }
});

univerAPI.getActiveWorkbook()?.onCellClick((cell) => {

  matrix = cell['location']['worksheet']['_cellData']['_matrix']
  // Step 1: Extract all data from the matrix
  const extractedData = extractTablesAndValues(matrix);

  // Step 2: Format the extracted data into JSON
  fullSheetJSON = JSON.stringify(extractedData, null, 2);

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
        rowObject[`Column_${column}`] = cellValue || "";
      }
      rangeValues.push({ [`Row_${row}`]: rowObject });
    }

    const rangeJSON = JSON.stringify(rangeValues, null, 2);
    console.log(`Selected Range Values:\n${rangeJSON}`);
  }
});

// Function to extract tables and standalone values from the matrix
function extractTablesAndValues(matrix: Matrix) {
  const visited = new Set(); // Track visited cells
  const standaloneValues = [];
  const tables: SheetTable[] = [];

  
  const headers: string[] = [];
  const table: SheetTable = {
    tableName: "example",
    headers,
    rows : {},
    tableBounds: {
      'left': "",
      'top': "",
      'right': "",
      'bottom': ""
    }
  };

  // Cell with no value and has not been traversed is a valid cell
  const isValidCell = (row: string, column: string) =>
    matrix[row]?.[column]?.['v'] !== undefined && !visited.has(`${row},${column}`);




  const first_row = parseInt(Object.keys(matrix)[0])
  const first_col = parseInt(Object.keys(matrix[first_row.toString()])[0])

  let minRow: number = first_row;
  let maxRow: number = first_row;
  let minCol: number = first_col;
  let maxCol: number = first_col;
  //main loop
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
          standaloneValues.push({ [`Row_${parseInt(row) }`]: { [`Column_${parseInt(column)+1}`]: cellValue } });
          visited.add(`${row},${column}`);
        } else { //for every table
          // f to process as being passed each row and column
          if (matrix[row]?.[column]) {
            if (isValidCell(row, column)) {
              const cellValue = matrix[row][column]['v'];
              if (!table.rows[`Row_${parseInt(row)}`]) {
                table.rows[`Row_${parseInt(row)}`] = {};
              }
              // if (cellValue !== ""){
              table.rows[`Row_${parseInt(row)}`][`Column_${parseInt(column)}`] = cellValue;
              // }
              visited.add(`${row},${column}`); // Mark cell as visited
            }

          // ftt => farthest to the
          minCol = parseInt(column) < minCol  ? parseInt(column) : minCol;
          maxCol = parseInt(column) > maxCol  ? parseInt(column) : maxCol;
          table.tableBounds['left'] = ((minCol)).toString()
          table.tableBounds['right'] = ((maxCol)).toString()
          
          // Start of a new table
          }
        }
      }
    }
    minRow = parseInt(row) < minRow  ? parseInt(row) : minRow;
    maxRow = parseInt(row) > maxRow  ? parseInt(row) : maxRow;    
    table.tableBounds['bottom'] = ((maxRow)).toString()
    table.tableBounds['top'] = ((minRow)).toString()
  }
  //finally push first row's columns into headers list
  for (let e_cols in matrix[minRow]){
    headers.push(matrix[minRow][e_cols]['v'])
  }
  tables.push(table)
  return { tables, standaloneValues };
}



//TODO: Separate tables if many on one sheet
