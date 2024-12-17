

import "./style.css";
import { ICellData, IRange, LocaleType, ObjectMatrix, Univer, UniverInstanceType, CellValue } from "@univerjs/core";
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
import { createTableSkeleton } from "@univerjs/engine-render/lib/types/components/docs/layout/block/table.js";


//Types
export type Matrix = { [rowIndex: string]: { [colIndex: string]: ICellData } }
export type SheetTable = {
  tableName: string,
  rows: Matrix,
  tableBounds: {
    left: string,
    top: string,
    right: string,
    bottom: string
  }
}

 // Create Univer API instance
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

// Create a sheet
univerAPI.createUniverSheet({ name: 'Test Sheet' });
// Global variables
var fullSheetJSON: string = "";
var matrix: Matrix = {};
var rangeJSON: string = "";
const standaloneValues: Matrix = {};
const tables: SheetTable[] = [];
const sheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
const workbook = univerAPI.getActiveWorkbook() // for querying functions only

//Declare LLM to use
const gemini = new Gemini()

function processLLMResponse(llmResponse: string): any { //because not using LLMs structured outputs, this f will sanitize the response from LLMs.
  const codeBlockRegex = /^```json\s+([\s\S]*?)\s+```$/m;
  const match = llmResponse.match(codeBlockRegex);
  let jsonString: string;
  if (match && match[1]) {
    jsonString = match[1].trim();
  } else {
    jsonString = llmResponse.trim();
  }
  let parsedData: any = ""
  try {
    parsedData = JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${(error as Error).message}`);
  }
  return parsedData;
}

async function updateSheet(responseData: any) {
  responseData = processLLMResponse(responseData)
  if (responseData !== "") {
    try {
      // Ensure responseData is an object
      if (typeof responseData !== 'object' || responseData === null) {
        throw new Error("Response data is not a valid object.");
      }
      // Iterate through each table
      (responseData.tables || []).forEach((table: SheetTable) => {
        const { rows } = table;

        if (!rows || typeof rows !== 'object') {
          console.warn("No rows found in table or rows are not an object, skipping.");
          return;
        }
        // Iterate through each row in the specified range
        Object.keys(rows).forEach((row) => {
          const currentRow = rows[row];
          Object.keys(currentRow).forEach((col) => {
            const cellData: ICellData = currentRow[col];
            const cellValue: CellValue = cellData?.v ?? "";
            // update 1 cell per time
            const range = sheet?.getRange(parseInt(row), parseInt(col), 1, 1);
            range?.setValues('')
            range?.setValues([[cellValue]]);
          })
        })
      });
      console.log("Sheet successfully updated with LLM response.");
    } catch (error) {
      console.error("Error processing LLM response:", error);
    }
  } else {
    console.warn("LLM response is empty. No updates performed.");
  }
}

function extractSelectedPart(selection: IRange){
  const startRow = selection['startRow'];
  const endRow = selection['endRow'];
  const startColumn = selection['startColumn'];
  const endColumn = selection['endColumn'];

  // Collect values within the selected range
  const rangeValues: Matrix = {};
  for (let row = startRow; row <= endRow; row++) {
    if (!rangeValues[row]) {
      rangeValues[row] = {};
    }
    let currentRow = matrix[row]
    for (let column = startColumn; column <= endColumn; column++) {
      const cellData: ICellData = currentRow?.[`${column}`] ?? {};
      const cellValue: CellValue = cellData?.v ?? "";
      rangeValues[row][column] = {v: cellValue}
      rangeValues[row][column]['v'] = cellValue
    }
  }
  rangeJSON = JSON.stringify(rangeValues, null, 2);
  return rangeJSON
}

// Function to extract tables and standalone values from the matrix
function extractTablesAndValues(matrix: Matrix) {

  const table: SheetTable = {
    tableName: "",
    rows: {},
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
  const first_col: number = 0

  let minRow: number = first_row;
  let maxRow: number = first_row;
  let minCol: number = first_col;
  let maxCol: number = first_col;

  // Main loop
  for (const row in matrix) {
    for (const column in matrix[row]) {
      if (isValidCell(row, column)) {
        const cellValue = matrix[row][column].v;
        // Check if cell is standalone
        const isStandalone =
          !matrix[+row - 1]?.[+column] &&  // Top
          !matrix[+row + 1]?.[+column] &&  // Bottom
          !matrix[+row]?.[+column - 1] &&  // Left
          !matrix[+row]?.[+column + 1];    // Right
          const strValue = cellValue?.toString() ?? "";

        if (isStandalone) {
          // Standalone value
          standaloneValues[row][column]['v'] = cellValue?.toString() ?? "";
        } else {
          // table
          if (!table.rows[row]){
            table.rows[row] = {}
          }
          table.rows[row][column] = {v: cellValue}
          table.rows[row][column]['v'] = strValue ?? "";
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

  tables.push(table);
  return { tables, standaloneValues };
}

//Some events
// Event Listener for Keyboard Shortcuts
window.addEventListener("keydown", async (event) => {
  // Check for Ctrl + E (Edit existing data)
  if (event.ctrlKey && event.key === "e") {
    let createResponse: string = ""
    event.preventDefault();
    const userInput = window.prompt("Enter your edit instructions:", "");
    if (userInput !== null) {
      createResponse = await gemini.requestEditFromLLM(userInput, fullSheetJSON)
      console.log(`User prompt: ${userInput}`)
      console.log(`AI speaking...\n${createResponse}`)
    }
    if (createResponse){
      updateSheet(createResponse)
    }
  }
    // Check for Ctrl + B (Create new data from scratch)
    if (event.ctrlKey && event.key === "b") {
      let editResponse: string = ""
      event.preventDefault();
      const userCreationRequest = window.prompt("Enter your creation instructions:", "");
      if (userCreationRequest !== null && userCreationRequest.trim() !== "") {
        editResponse = await gemini.requestNewSpreadsheetFromLLM(userCreationRequest, fullSheetJSON);
        console.log(`User prompt: ${userCreationRequest}`)
        console.log(`AI speaking...\n${editResponse}`)
      }
      if(editResponse){
        updateSheet(editResponse)
      }
    }
});

univerAPI.getActiveWorkbook()?.onCellClick((cell) => {
  matrix = cell['location']['worksheet']['_cellData']['_matrix']
  const extractedData = extractTablesAndValues(matrix);
  fullSheetJSON = JSON.stringify(extractedData, null, 2);
  console.log(`Full Sheet Context:\n${fullSheetJSON}`) //Full sheet context
  
  var range = sheet?.getActiveRange(); // Get the selected range
  if (range) { 
    const selection = range['_range'];
    rangeJSON = extractSelectedPart(selection)
    console.log(`Selected Range Values:\n${rangeJSON}`);
  }
});
