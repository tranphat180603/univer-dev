import "./style.css";
import { ICellData, IRange, LocaleType, CellValue, WrapStrategy } from "@univerjs/core";
import { FRange } from "@univerjs/sheets/facade";
import { defaultTheme } from "@univerjs/design";
import { UniverSheetsCorePreset } from "@univerjs/presets/preset-sheets-core";
import UniverPresetSheetsCoreEnUS from "@univerjs/presets/preset-sheets-core/locales/en-US";
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import Gemini from "./LLMservice";
import { createUniver } from '@univerjs/presets';import { DataFrame } from 'data-forge';


export type Matrix = { [rowIndex: string]: { [colIndex: string]: ICellData } };

function convertRowsToDataFrame(rowsToInsert: CellValue[][]): string {
  if (!rowsToInsert || rowsToInsert.length === 0) {
      throw new Error("No rows provided for DataFrame conversion.");
  }

  const [headerRow, ...dataRows] = rowsToInsert;

  if (!headerRow || headerRow.length === 0) {
      throw new Error("Header row is missing or empty.");
  }

  // Generate column names, ensuring they are unique and non-empty
  const columnNames = headerRow.map((header, index) => {
      const colName = header?.toString().trim() || `Column_${index + 1}`;
      return colName || `Column_${index + 1}`;
  });

  // Transform data rows into array of objects
  const data = dataRows.map((row, rowIndex) => {
      const rowObj: Record<string, any> = {};
      columnNames.forEach((colName, colIndex) => {
          rowObj[colName] = row[colIndex] !== undefined ? row[colIndex] : null;
      });
      return rowObj;
  });

  // Create and return the DataFrame
  return new DataFrame(data).toString();
}

interface SheetEngineTableStructure {
  tableName: string;
  rows: Matrix;
  tableBounds: {
    left: string;
    top: string;
    right: string;
    bottom: string;
  };
}

interface TableStructure {
  tableName: string;
  rows: CellValue[][];
  tableBounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

interface FullStructure {
  tables: TableStructure[];
}


interface SelectedTable {
  tableName: string;
  selectedRowsInTable: CellValue[][];
  rangeBounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

interface SelectedStructure {
  tables: SelectedTable[];
}

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

let fullSheetJSON: string = "";
const sheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
let selectedParts: SelectedStructure = { tables: [] };
let isCtrlPressed = false;
let selectedTablesNames: string[] = [];

// LLM class instance
const gemini = new Gemini();

/**
 * Processes the LLM response by extracting JSON from code blocks and parsing it.
 *
 * @param llmResponse - The response string from the LLM.
 * @returns Parsed JSON data as FullStructure or SelectedStructure.
 * @throws Error if JSON parsing fails.
 */
function processLLMResponse(llmResponse: string): FullStructure | SelectedStructure {
  const codeBlockRegex = /^```json\s+([\s\S]*?)\s+```$/m;
  const match = llmResponse.match(codeBlockRegex);
  let jsonString: string;
  if (match && match[1]) {
    jsonString = match[1].trim();
  } else {
    jsonString = llmResponse.trim();
  }
  let parsedData: any = "";
  try {
    parsedData = JSON.parse(jsonString);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${(error as Error).message}`);
  }
  return parsedData;
}

/**
 * Updates the sheet based on the provided FullStructure or SelectedStructure response data.
 *
 * @param responseData - The JSON string containing tables and their data.
 */
async function updateSheet(responseData: string): Promise<void> {
  const parsedResponseData = processLLMResponse(responseData); // parsedResponseData is JSON type

  if (JSON.stringify(parsedResponseData) !== "") {
    try {
      if (typeof parsedResponseData !== 'object' || parsedResponseData === null) {
        throw new Error("Response data is not a valid object.");
      }

      // Check if the data contains tables
      const tables = parsedResponseData.tables;
      if (!Array.isArray(tables)) {
        throw new Error("Response data does not contain a valid tables array.");
      }

      // Convert either structure type to SheetEngineTableStructure array
      const sheetTables: SheetEngineTableStructure[] = convertTableData(tables);

      // Iterate over each SheetEngineTableStructure and update the sheet
      sheetTables.forEach((table) => {
        const { rows } = table;

        Object.keys(rows).forEach((rowKey) => {
          const currentRow = rows[rowKey];
          Object.keys(currentRow).forEach((colKey) => {
            const cellData: ICellData = currentRow[colKey];
            const cellValue: CellValue = cellData?.v ?? "";
            const rangeCell = sheet?.getRange(parseInt(rowKey), parseInt(colKey), 1, 1);
            if (rangeCell) {
              rangeCell.setValues(''); // Clear existing value
              rangeCell.setValues([[cellValue]]); // Set new value
            } else {
              console.warn(`Failed to get range for Row: ${rowKey}, Column: ${colKey}`);
            }
          });
        });
      });

      console.log("Sheet successfully updated with LLM response.");
    } catch (error) {
      console.error("Error processing LLM response:", error);
    }
  } else {
    console.warn("LLM response is empty. No updates performed.");
  }
}

/**
 * Converts incoming table data to SheetEngineTableStructure format.
 *
 * @param tables - An array of TableStructure or SelectedTable.
 * @returns An array of SheetEngineTableStructure.
 */
function convertTableData(tables: (TableStructure | SelectedTable)[]): SheetEngineTableStructure[] {
  const sheetTables: SheetEngineTableStructure[] = [];

  tables.forEach((table) => {
    const matrix: Matrix = {};
    const bounds = 'tableBounds' in table ? table.tableBounds : table.rangeBounds;
    const { left, top, right, bottom } = bounds;
    const rows = 'rows' in table ? table.rows : table.selectedRowsInTable;

    // Map Data Rows starting from the top row (including what was previously the header row)
    rows.forEach((row, rowIdx) => {
      const rowNum = top + rowIdx;
      if (rowNum > bottom) {
        console.warn(
          `Row index ${rowNum} exceeds bounds.bottom ${bottom}. This row will be skipped.`
        );
        return;
      }

      matrix[rowNum.toString()] = {};

      row.forEach((cellValue, colIdx) => {
        const colNum = left + colIdx;
        if (colNum > right) {
          console.warn(
            `Column index ${colNum} exceeds bounds.right ${right}. This cell will be skipped.`
          );
          return;
        }
        matrix[rowNum.toString()][colNum.toString()] = { v: cellValue };
      });
    });

    // Convert tableBounds numbers to strings as required by SheetEngineTableStructure
    const sheetEngineBounds = {
      left: left.toString(),
      top: top.toString(),
      right: right.toString(),
      bottom: bottom.toString(),
    };

    // Create the SheetEngineTableStructure object and add it to the array
    const sheetEngineTable: SheetEngineTableStructure = {
      tableName: table.tableName,
      rows: matrix,
      tableBounds: sheetEngineBounds,
    };

    sheetTables.push(sheetEngineTable);
  });

  return sheetTables;
}

/**
 * Identifies and extracts tables from the provided matrix.
 *
 * @param matrix - The matrix representing the sheet data.
 * @returns An object containing an array of TableStructure.
 */
function findTables(matrix: Matrix): { tables: TableStructure[] } {
  const visited = new Set<string>();
  const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const cells: [number, number][] = [];
  
  for (const row in matrix) {
    for (const col in matrix[row]) {
      if (matrix[row][col]?.v !== undefined) {
        cells.push([parseInt(row), parseInt(col)]);
      }
    }
  }

  /**
   * Finds neighboring cells that are part of the same table.
   *
   * @param r - Current row index.
   * @param c - Current column index.
   * @returns An array of neighboring cell indices.
   */
  function neighbors(r: number, c: number): [number, number][] {
    const result: [number, number][] = [];
    for (const [dr, dc] of directions) {
      const nr = r + dr, nc = c + dc;
      if (matrix[nr]?.[nc]?.v !== undefined) {
        result.push([nr, nc]);
      }
    }
    return result;
  }

  const tables: TableStructure[] = [];
  let tableCount = 0;

  for (const [r, c] of cells) {
    const key = `${r},${c}`;
    if (!visited.has(key)) {
      const queue = [[r, c]];
      visited.add(key);
      const component: [number, number][] = [[r, c]];

      while (queue.length > 0) {
        const [cr, cc] = queue.shift()!;
        for (const [nr, nc] of neighbors(cr, cc)) {
          const nkey = `${nr},${nc}`;
          if (!visited.has(nkey)) {
            visited.add(nkey);
            queue.push([nr, nc]);
            component.push([nr, nc]);
          }
        }
      }

      const rowsC = component.map(v => v[0]);
      const colsC = component.map(v => v[1]);
      const minRow = Math.min(...rowsC);
      const maxRow = Math.max(...rowsC);
      const minCol = Math.min(...colsC);
      const maxCol = Math.max(...colsC);

      const height = maxRow - minRow + 1;
      const width = maxCol - minCol + 1;

      const grid: CellValue[][] = [];
      for (let i = 0; i < height; i++) {
        grid[i] = [];
        for (let j = 0; j < width; j++) {
          const rr = minRow + i;
          const cc = minCol + j;
          grid[i][j] = matrix[rr]?.[cc]?.v ?? "";
        }
      }

      tableCount++;
      // Since headers are removed, all rows are treated equally
      tables.push({
        tableName: `Table ${tableCount}`,
        rows: grid,
        tableBounds: {
          left: minCol,
          top: minRow,
          right: maxCol,
          bottom: maxRow
        }
      });
    }
  }

  return { tables };
}

/**
 * Extracts all tables and their data from the provided matrix.
 *
 * @param matrix - The matrix representing the sheet data.
 * @returns A FullStructure object containing all tables.
 */
function extractTablesAndValues(matrix: Matrix): FullStructure {
  const { tables } = findTables(matrix);
  return { tables };
}

/**
 * Extracts the selected part of the sheet based on the selection range.
 *
 * @param selection - The IRange object representing the selected range.
 * @param matrix - The matrix representing the sheet data.
 * @returns A SelectedStructure object containing the selected tables and their data.
 */
function extractSelectedPart(selection: IRange, matrix: Matrix): SelectedStructure {
  const extractedData = extractTablesAndValues(matrix);
  const { tables } = extractedData;

  const startRow = selection['startRow'];
  const endRow = selection['endRow'];
  const startColumn = selection['startColumn'];
  const endColumn = selection['endColumn'];

  const selectedTables: SelectedTable[] = [];

  for (const t of tables) {
    const { top, left, bottom, right } = t.tableBounds;

    // Check intersection
    const intersectRowStart = Math.max(startRow, top);
    const intersectRowEnd = Math.min(endRow, bottom);
    const intersectColStart = Math.max(startColumn, left);
    const intersectColEnd = Math.min(endColumn, right);

    if (intersectRowStart <= intersectRowEnd && intersectColStart <= intersectColEnd) {
      const slicedRows: CellValue[][] = [];
      for (let rr = intersectRowStart; rr <= intersectRowEnd; rr++) {
        const rowIndexInData = rr - top;
        if (rowIndexInData >= 0 && rowIndexInData < t.rows.length) {
          const originalRow = t.rows[rowIndexInData];
          const rowSlice = originalRow.slice(intersectColStart - left, intersectColEnd - left + 1);
          slicedRows.push(rowSlice);
        }
      }

      selectedTables.push({
        tableName: t.tableName,
        selectedRowsInTable: slicedRows,
        rangeBounds: {
          left: intersectColStart,
          top: intersectRowStart,
          right: intersectColEnd,
          bottom: intersectRowEnd
        }
      });
    }
  }

  return {
    tables: selectedTables
  };
}

// Keyboard events
window.addEventListener("keydown", async (event) => {
  if (event.ctrlKey && event.key === "e") {
    event.preventDefault();
    if (selectedParts.tables.length > 0) { // Check if there are selected tables
      const userInput = window.prompt("Enter your edit instructions:", "");
      if (userInput !== null) {
        const editResponse = await gemini.requestEdit(userInput, JSON.stringify(selectedParts, null, 2), selectedTablesNames);
        console.log(`AI speaking...\n${editResponse}`);
        if (editResponse) {
          updateSheet(editResponse);
        }
      }
    } else {
      console.warn("No selected range context available.");
    }
  }

  if (event.ctrlKey && event.key === "b") {
    event.preventDefault();
    const userCreationRequest = window.prompt("Enter your creation instructions:", "");
    if (userCreationRequest !== null && userCreationRequest.trim() !== "") {
      const createResponse = await gemini.requestCreate(userCreationRequest);
      console.log(`AI speaking...\n${createResponse}`);
      if (createResponse) {
        updateSheet(createResponse);
      }
    } else {
      console.warn("Creation request is empty or canceled.");
    }
  }


  if (event.ctrlKey && event.key === "f") {
    event.preventDefault();
    const range = sheet?.getActiveRange();
    if (range) {
      await applyStylesToRange(range, {
        backgroundColor: "#FFEB3B",
        fontColor: "#000000",
        fontSize: 14,
        fontFamily: "Arial",
        fontWeight: "bold",
        fontStyle: "italic",
        fontLine: "underline",
        horizontalAlignment: "center",
        verticalAlignment: "middle",
        wrap: true
      });
    } else {
      console.warn("No active range selected. Styles not applied.");
    }
  }
});


// Update Ctrl key state
window.addEventListener("keydown", (event) => {
  if (event.key === "Control") {
    isCtrlPressed = true;
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "Control") {
    isCtrlPressed = false;
  }
});

univerAPI.getActiveWorkbook()?.onCellClick(async (cell) => {
  const matrix: Matrix = cell['location']['worksheet']['_cellData']['_matrix']; //return a structure of cells which are populated with data
  const extractedData = extractTablesAndValues(matrix);
  fullSheetJSON = JSON.stringify(extractedData, null, 2);
  gemini.cachedContext = fullSheetJSON;
  const range = sheet?.getActiveRange() //return the chosen cell 
  console.log(fullSheetJSON)

  if(!range) { //no cell chosen
    selectedParts
    console.warn("No range selected.");
  }
  else{
    const selection = range['_range'];
    const singleSelectedPart = extractSelectedPart(selection, matrix);
    if (isCtrlPressed === false){//whenever a cell is clicked without pressing ctrl at the time, reset all the cells
      selectedParts.tables = [] //the final logging of all cells clicked
      singleSelectedPart.tables.forEach((table)=> {
        selectedParts.tables.push(table)
        selectedTablesNames.push(table.tableName)
        console.log(convertRowsToDataFrame(table["selectedRowsInTable"]))
      })
    }
    else if (isCtrlPressed === true){ //if control is hold when clicking a cell
      singleSelectedPart.tables.forEach((table)=> {
        selectedParts.tables.push(table)
        selectedTablesNames.push(table.tableName)
      })
    }
  }    
  
});


// Define a TypeScript interface for the style parameters
interface StyleParams {
  value?: CellValue[][]; // single or multi-value
  backgroundColor?: string;
  fontColor?: string | null;
  fontSize?: number | null;
  fontFamily?: string | null;
  fontWeight?: 'normal' | 'bold' | null;
  fontStyle?: 'normal' | 'italic' | null;
  fontLine?: 'none' | 'underline' | 'line-through' | null;
  horizontalAlignment?: 'left' | 'center' | 'normal';
  verticalAlignment?: 'top' | 'middle' | 'bottom';
  wrap?: boolean | null;
  wrapStrategy?: WrapStrategy | null;
}

/**
* Apply various styles and values to a given FRange.
* This function is an abstraction that can be called with parameters
* from an LLM output (e.g., JSON) to set styles/formatting.
*
* @param range An instance of FRange to apply styles to.
* @param params A set of style/value parameters.
*/
export async function applyStylesToRange(range: FRange, params: StyleParams): Promise<void> {
  const {
      value,
      backgroundColor,
      fontColor,
      fontSize,
      fontFamily,
      fontWeight,
      fontStyle,
      fontLine,
      horizontalAlignment,
      verticalAlignment,
      wrap,
      wrapStrategy,
  } = params;

  // 1. Set cell value(s) if provided
  if (value !== undefined) {
      // If it's an array of arrays, use setValues; otherwise, setValue
      if (Array.isArray(value)) {
          await range.setValues(value);
      } else {
          await range.setValue(value);
      }
  }

  // 2. Background color
  if (typeof backgroundColor === 'string') {
      await range.setBackgroundColor(backgroundColor);
  }

  // 3. Font properties
  // Font color
  if (fontColor !== undefined) {
      range.setFontColor(fontColor);
  }

  // Font size
  if (fontSize !== undefined) {
      range.setFontSize(fontSize);
  }

  // Font family
  if (fontFamily !== undefined) {
      range.setFontFamily(fontFamily);
  }

  // Font weight
  if (fontWeight !== undefined) {
      range.setFontWeight(fontWeight);
  }

  // Font style
  if (fontStyle !== undefined) {
      range.setFontStyle(fontStyle);
  }

  // Font line (underline, line-through, none)
  if (fontLine !== undefined) {
      range.setFontLine(fontLine);
  }

  // 4. Alignment
  if (horizontalAlignment !== undefined) {
      await range.setHorizontalAlignment(horizontalAlignment);
  }

  if (verticalAlignment !== undefined) {
      await range.setVerticalAlignment(verticalAlignment);
  }

  // 5. Wrapping
  if (wrap !== undefined) {
      await range.setWrap(Boolean(wrap));
  }

  if (wrapStrategy !== undefined && wrapStrategy !== null) {
      await range.setWrapStrategy(wrapStrategy);
  }

}

