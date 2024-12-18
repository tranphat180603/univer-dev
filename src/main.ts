

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
var fullSheetJSON: string = ""; //Whole context of the current sheet
var rangeJSON: string = ""; //Selected context of current sheet

//these 2 var below are crafted together to create whole sheet context
const standaloneValues: Matrix = {};
const tables: SheetTable[] = [];

const sheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
const workbook = univerAPI.getActiveWorkbook() // for checking available functions only

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

function extractSelectedPart(selection: IRange, matrix: Matrix): {  } {
  const extractedData = extractTablesAndValues(matrix);
  // Extract tables that intersect the selection
  const {tables, standaloneValues} = extractedData;

  const selectedTables: SheetTable[] = [];

  for (const t of tables) {
    const tleft = parseInt(t.tableBounds.left);
    const ttop = parseInt(t.tableBounds.top);
    const tright = parseInt(t.tableBounds.right);
    const tbottom = parseInt(t.tableBounds.bottom);

    // Check intersection with selection
    const startRow = selection['startRow'];
    const endRow = selection['endRow'];
    const startColumn = selection['startColumn'];
    const endColumn = selection['endColumn'];

    const intersectRowStart = Math.max(startRow, ttop);
    const intersectRowEnd = Math.min(endRow, tbottom);
    const intersectColStart = Math.max(startColumn, tleft);
    const intersectColEnd = Math.min(endColumn, tright);

    if (intersectRowStart <= intersectRowEnd && intersectColStart <= intersectColEnd) {
      // The selection overlaps with this table
      const partialRows: Matrix = {};
      for (let r = intersectRowStart; r <= intersectRowEnd; r++) {
        partialRows[r] = {};
        for (let c = intersectColStart; c <= intersectColEnd; c++) {
          partialRows[r][c] = t.rows[r][c] ?? {v:""};
        }
      }

      selectedTables.push({
        tableName: t.tableName, 
        rows: partialRows,
        tableBounds: {
          left: intersectColStart.toString(),
          top: intersectRowStart.toString(),
          right: intersectColEnd.toString(),
          bottom: intersectRowEnd.toString()
        }
      });
    }
  }

  // If no tables intersect and you want to return standaloneValues or empty structure:
  // For consistency, let's return { tables: selectedTables, standaloneValues: {} } if no intersection
  return { tables: selectedTables, standaloneValues: {} };
}


function findTables(matrix: Matrix): {tables: SheetTable[], standaloneValues: Matrix} {
  const visited = new Set<string>();
  const directions = [[1,0],[-1,0],[0,1],[0,-1]];
  const cells: [number, number][] = [];

  // Collect all valid cells
  for (const row in matrix) {
    for (const col in matrix[row]) {
      if (matrix[row][col]?.v !== undefined) {
        cells.push([parseInt(row), parseInt(col)]);
      }
    }
  }

  function neighbors(r: number, c: number): [number,number][] {
    const result: [number,number][] = [];
    for (const [dr,dc] of directions) {
      const nr = r+dr, nc = c+dc;
      if (matrix[nr]?.[nc]?.v !== undefined) {
        result.push([nr,nc]);
      }
    }
    return result;
  }

  const tables: SheetTable[] = [];
  let tableCount = 0;

  for (const [r,c] of cells) {
    const key = `${r},${c}`;
    if (!visited.has(key)) {
      // BFS/DFS to find all cells in this connected component
      const queue = [[r,c]];
      visited.add(key);
      const component: [number,number][] = [[r,c]];

      while (queue.length > 0) {
        const [cr, cc] = queue.shift()!;
        for (const [nr,nc] of neighbors(cr,cc)) {
          const nkey = `${nr},${nc}`;
          if (!visited.has(nkey)) {
            visited.add(nkey);
            queue.push([nr,nc]);
            component.push([nr,nc]);
          }
        }
      }

      // Now component is one table
      // Compute bounds
      const rowsC = component.map(v=>v[0]);
      const colsC = component.map(v=>v[1]);
      const minRow = Math.min(...rowsC);
      const maxRow = Math.max(...rowsC);
      const minCol = Math.min(...colsC);
      const maxCol = Math.max(...colsC);

      const tableRows: Matrix = {};
      for (let rr = minRow; rr <= maxRow; rr++) {
        tableRows[rr] = {};
      }
      for (const [cr, cc] of component) {
        const val = matrix[cr][cc].v ?? "";
        tableRows[cr][cc] = {v: val};
      }

      tableCount++;
      tables.push({
        tableName: `Table ${tableCount}`,
        rows: tableRows,
        tableBounds: {
          left: minCol.toString(),
          top: minRow.toString(),
          right: maxCol.toString(),
          bottom: maxRow.toString()
        }
      });
    }
  }

  const standaloneValues: Matrix = {}; // If you still want to track isolated cells differently, handle that here
  // For simplicity, we considered every connected cell block as a table, including single-cell ones.
  // If you want to keep truly isolated cells as standaloneValues, you'd only do BFS for components of size > 1 and treat size=1 differently.

  return {tables, standaloneValues};
}

function extractTablesAndValues(matrix: Matrix) {
  const {tables, standaloneValues} = findTables(matrix);

  return { tables, standaloneValues };
}

// This function now returns the fullSheetJSON with multiple tables named and separated.


//Some events
// Event Listener for Keyboard Shortcuts
window.addEventListener("keydown", async (event) => {
  // Check for Ctrl + E (Edit existing data)
  if (event.ctrlKey && event.key === "e") {
    if (rangeJSON){
      let createResponse: string = ""
      event.preventDefault();
      const userInput = window.prompt("Enter your edit instructions:", "");
      if (userInput !== null) {
        createResponse = await gemini.requestEdit(userInput, rangeJSON)
        console.log(`User prompt: ${userInput}`)
        console.log(`AI speaking...\n${createResponse}`)
      }
      if (createResponse){
        updateSheet(createResponse)
      }
    }
  }
    // Check for Ctrl + B (Create new data from scratch)
    if (event.ctrlKey && event.key === "b") {
      let editResponse: string = ""
      event.preventDefault();
      const userCreationRequest = window.prompt("Enter your creation instructions:", "");
      if (userCreationRequest !== null && userCreationRequest.trim() !== "") {
        editResponse = await gemini.requestCreate(userCreationRequest);
        console.log(`User prompt: ${userCreationRequest}`)
        console.log(`AI speaking...\n${editResponse}`)
      }
      if(editResponse){
        updateSheet(editResponse)
      }
    }
});

univerAPI.getActiveWorkbook()?.onCellClick((cell) => {
  const matrix: Matrix = cell['location']['worksheet']['_cellData']['_matrix'] //By default, clicking on cell will log a matrix of "active" rows and columns on the sheet. This is used to extract that data
  const extractedData = extractTablesAndValues(matrix);
  fullSheetJSON = JSON.stringify(extractedData, null, 2);
  gemini.cachedContext = fullSheetJSON
  console.log(`Full Sheet Context:\n${fullSheetJSON}`) //Full sheet context
  
  var range = sheet?.getActiveRange(); // Get the selected range
  if (range) { 
    const selection = range['_range'];
    rangeJSON = extractSelectedPart(selection, matrix)
    console.log(`Selected Range Values:`, rangeJSON["tables"]);
  }
});
