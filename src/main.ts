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

//Types
type CellData = {
  v: string; // The cell value
};

type Matrix = {
  [row: string]: {
    [column: string]: CellData;
  };
};

export type SheetTable = {
  tableName: string,
  headers: string[],
  rows: { columns: string[] }[],
  tableBounds: {
    left: string,
    top: string,
    right: string,
    bottom: string
  }
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

//global variables
var fullSheetJSON: string = ""
var LLMresponse: string = ""
var matrix: Matrix = {};


async function updateSheet(LLMresponse: string) {
  if (LLMresponse !== "") {
    try {
      // Sanitize and parse response
      const sanitizedResponse = LLMresponse.replace(/```[\s\S]*?\n|```/g, "").trim();
      const response = JSON.parse(sanitizedResponse);

      // Get the active sheet instance
      const sheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
      if (!sheet) {
        console.error("Sheet not found");
        return;
      }

      // Iterate through each table
      (response.tables || []).forEach((table: SheetTable) => {
        const { rows, tableBounds } = table;

        if (!rows || !Array.isArray(rows)) {
          console.warn("No rows found in table, skipping.");
          return;
        }

        // Convert bounds to numbers
        let startRow = parseInt(tableBounds.top, 10);
        let endRow = parseInt(tableBounds.bottom, 10);
        const startCol = parseInt(tableBounds.left, 10);
        const endCol = parseInt(tableBounds.right, 10);

        // Determine the dimensions
        const numRows = endRow - startRow + 1;
        const numCols = endCol - startCol + 1;

        // Get existing data from the sheet in the specified range
        const range = sheet.getRange(startRow, startCol, numRows, numCols);
        const oldData = range.getValues();  // oldData is string[][]
        
        // Construct the new data array by merging old data with new data where applicable
        const newData: string[][] = [];

        for (let r = 0; r < numRows; r++) {
          const currentRowIndex = startRow + r;
          const currentRow = rows[currentRowIndex]; 
          let newRowValues: string[];

          if (
            currentRow && 
            Array.isArray(currentRow.columns) && 
            currentRow.columns.length > 0
          ) {
            // Use new columns data
            newRowValues = [];
            for (let c = 0; c < numCols; c++) {
              // If new data doesn't have a value at c, default to ""
              newRowValues[c] = currentRow.columns[c] ?? "";
            }
          } else {
            // Keep old values as is (if row is empty or not found)
            newRowValues = oldData[r];
          }

          newData.push(newRowValues);
        }

        // Update the sheet with merged data
        range.setValues(newData);
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
      You are tasked with completing the user's command on a spreadsheet based on its current tabular data structure, which has been converted into JSON format for processing. The JSON represents the spreadsheet's data, where each cell is identified by row and column keys. Missing values in the spreadsheet are represented by empty or undefined cells in the JSON.

      You MUST RESPECT THE ORDER OF THE TABLE, KEEPING EMPTY ROWS/COLUMNS THE SAME AS THAT MEANS THE ORDER OF THE TABLE!

      Analyze the user's command and the provided JSON data to determine the best way to fulfill the requirement. You have full autonomy to interpret and manipulate the data as needed to generate accurate and meaningful results. Ensure your solution integrates seamlessly into the spreadsheet, considering row and column contexts, relationships between data points, and patterns in the table.

      Act independently and apply problem-solving skills to execute the task effectively. Provide the result in a structured format that directly aligns with the spreadsheet's layout and the user's intent.

      For now, you are given this task : ${userInput} and the data structure which has been processed into JSON from spreadsheets table data. Here is the data:
      ${fullSheetJSON}

      `;
      const gemini = new Gemini()
      LLMresponse = await gemini.reply(meta_prompt)
      console.log(`User prompt: ${meta_prompt}`)
      console.log(`Response: ${LLMresponse}`)
    }
    if (LLMresponse !== ""){
      updateSheet(LLMresponse)
    }
  }
});

univerAPI.getActiveWorkbook()?.onCellClick((cell) => {
  var range = sheet?.getActiveRange(); // Get the selected range
  matrix = cell['location']['worksheet']['_cellData']['_matrix']
  console.log(matrix)
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
  const standaloneValues = [];
  const tables: SheetTable[] = [];

  const headers: string[] = [];
  const table: SheetTable = {
    tableName: "example",
    headers,
    rows: [],
    tableBounds: {
      left: "",
      top: "",
      right: "",
      bottom: ""
    }
  };

  // Helper to check if cell is valid (exists and not visited)
  const isValidCell = (row: string, column: string) =>
    matrix[row]?.[column]?.['v'] !== undefined;

  const first_row = parseInt(Object.keys(matrix)[0])
  const first_col = parseInt(Object.keys(matrix[first_row.toString()])[0])

  let minRow: number = first_row;
  let maxRow: number = first_row;
  let minCol: number = first_col;
  let maxCol: number = first_col;

  // Main loop
  for (const row in matrix) {
    if (!table.rows[parseInt(row)]) {
      table.rows[parseInt(row)] = { columns: [] };
    }

    for (const column in matrix[row]) {
      if (isValidCell(row, column)) {
        const cellValue = matrix[row][column]['v'];
        // Check if cell is standalone
        const isStandalone =
          !matrix[+row - 1]?.[+column] &&  // Top
          !matrix[+row + 1]?.[+column] &&  // Bottom
          !matrix[+row]?.[+column - 1] &&  // Left
          !matrix[+row]?.[+column + 1];    // Right
          const strValue = cellValue?.toString() ?? "";

        if (isStandalone) {
          // Standalone value
          standaloneValues.push({
            [`Row_${parseInt(row)}`]: { [`Column_${parseInt(column)+1}`]: cellValue?.toString() ?? "" }
          });
        } else {
          // table
          table.rows[parseInt(row)].columns[parseInt(column)] = strValue ?? "";

          // Track bounds
          minCol = parseInt(column) < minCol ? parseInt(column) : minCol;
          maxCol = parseInt(column) > maxCol ? parseInt(column) : maxCol;
          table.tableBounds.left = minCol.toString();
          table.tableBounds.right = maxCol.toString();
        }
      }
    }
    // Update row bounds
    minRow = parseInt(row) < minRow ? parseInt(row) : minRow;
    maxRow = parseInt(row) > maxRow ? parseInt(row) : maxRow;
    table.tableBounds.bottom = maxRow.toString();
    table.tableBounds.top = minRow.toString();
  }

  // Extract headers from the first row of the table
  for (const e_cols in matrix[minRow]) {
    headers.push(matrix[minRow][e_cols]['v']?.toString() ?? "");
  }
  tables.push(table);
  return { tables, standaloneValues };
}



//TODO: Separate tables if many on one sheet
