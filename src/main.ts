import "./style.css";
import { ICellData, IRange, LocaleType, CellValue, WrapStrategy, set, Tools } from "@univerjs/core";
import { FRange, FWorksheet } from "@univerjs/sheets/facade";
import { IHoverRichTextInfo } from "@univerjs/sheets-ui/lib/types/services/hover-manager.service.js";
import { defaultTheme } from "@univerjs/design";
import { UniverSheetsCorePreset } from "@univerjs/presets/preset-sheets-core";
import UniverPresetSheetsCoreEnUS from "@univerjs/presets/preset-sheets-core/locales/en-US";
import '@univerjs/presets/lib/styles/preset-sheets-core.css';
import Gemini from "./LLMservice";
import { createUniver } from '@univerjs/presets';
import { DataFrame } from 'data-forge';
import { rangeFunctionDeclarations, rangeFunctions } from "./range-funcs";
import { sheetFunctionDeclarations, sheetFunctions } from "./sheet-funcs";

import {FunctionDeclaration, FunctionDeclarationsTool, Tool } from "@google/generative-ai";

export type Matrix = { [rowIndex: string]: { [colIndex: string]: ICellData } };

interface FunctionDescription {
  name: string;
  description?: string;
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
  tableBounds: {
    left: number;
    top: number;
    right: number;
    bottom: number;
  };
}

interface SelectedStructure {
  tables: SelectedTable[];
}

export const { univerAPI } = createUniver({
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

univerAPI.createUniverSheet({name:'Test Sheet'});

//define some global variables
let isCtrlPressed = false;
let selectedTablesNames: string[] = [];
let selectedTableBounds: {}[] = [];
let selectedRangeBounds: {}[] = [];

//LLM instance
const gemini = new Gemini();

// Get the currently active range in the active sheet
export const sheet = univerAPI.getActiveWorkbook()?.getActiveSheet();
export var range = sheet?.getActiveRange();
/**
 * Processes the LLM response by extracting JSON from code blocks and parsing it.
 *
 * @param llmResponse - The response string from the LLM.
 * @returns Parsed JSON data as FullStructure or SelectedStructure.
 * @throws Error if JSON parsing fails.
 */
// function processLLMResponse(llmResponse: string): FullStructure | SelectedStructure {
//   const codeBlockRegex = /^```json\s+([\s\S]*?)\s+```$/m;
//   const match = llmResponse.match(codeBlockRegex);
//   let jsonString: string;
//   if (match && match[1]) {
//     jsonString = match[1].trim();
//   } else {
//     jsonString = llmResponse.trim();
//   }
//   let parsedData: any = "";
//   try {
//     parsedData = JSON.parse(jsonString);
//   } catch (error) {
//     throw new Error(`Failed to parse JSON: ${(error as Error).message}`);
//   }
//   return parsedData;
// }

/**
 * Updates the sheet based on the provided FullStructure or SelectedStructure response data.
 *
 * @param responseData - The JSON string containing tables and their data.
 */
// async function updateSheet(responseData: string): Promise<void> {
//   const parsedResponseData = processLLMResponse(responseData); // parsedResponseData is JSON type

//   if (JSON.stringify(parsedResponseData) !== "") {
//     try {
//       if (typeof parsedResponseData !== 'object' || parsedResponseData === null) {
//         throw new Error("Response data is not a valid object.");
//       }

//       // Check if the data contains tables
//       const tables = parsedResponseData.tables;
//       if (!Array.isArray(tables)) {
//         throw new Error("Response data does not contain a valid tables array.");
//       }

//       // Convert either structure type to SheetEngineTableStructure array
//       const sheetTables: SheetEngineTableStructure[] = convertTableData(tables);

//       // Iterate over each SheetEngineTableStructure and update the sheet
//       sheetTables.forEach((table) => {
//         const { rows } = table;

//         Object.keys(rows).forEach((rowKey) => {
//           const currentRow = rows[rowKey];
//           Object.keys(currentRow).forEach((colKey) => {
//             const cellData: ICellData = currentRow[colKey];
//             const cellValue: CellValue = cellData?.v ?? "";
//             const rangeCell = sheet?.getRange(parseInt(rowKey), parseInt(colKey), 1, 1);
//             if (rangeCell) {
//               rangeCell.setValues(''); // Clear existing value
//               rangeCell.setValues([[cellValue]]); // Set new value
//             } else {
//               console.warn(`Failed to get range for Row: ${rowKey}, Column: ${colKey}`);
//             }
//           });
//         });
//       });

//       console.log("Sheet successfully updated with LLM response.");
//     } catch (error) {
//       console.error("Error processing LLM response:", error);
//     }
//   } else {
//     console.warn("LLM response is empty. No updates performed.");
//   }
// }

// /**
//  * Converts incoming table data to SheetEngineTableStructure format.
//  *
//  * @param tables - An array of TableStructure or SelectedTable.
//  * @returns An array of SheetEngineTableStructure.
//  */
// function convertTableData(tables: (TableStructure | SelectedTable)[]): SheetEngineTableStructure[] {
//   const sheetTables: SheetEngineTableStructure[] = [];

//   tables.forEach((table) => {
//     const matrix: Matrix = {};
//     const bounds = 'rangeBounds' in table ? table.rangeBounds : table.tableBounds;
//     const { left, top, right, bottom } = bounds;
//     const rows = 'rows' in table ? table.rows : table.selectedRowsInTable;

//     // Map Data Rows starting from the top row (including what was previously the header row)
//     rows.forEach((row, rowIdx) => {
//       const rowNum = top + rowIdx;
//       if (rowNum > bottom) {
//         console.warn(
//           `Row index ${rowNum} exceeds bounds.bottom ${bottom}. This row will be skipped.`
//         );
//         return;
//       }

//       matrix[rowNum.toString()] = {};

//       row.forEach((cellValue, colIdx) => {
//         const colNum = left + colIdx;
//         if (colNum > right) {
//           console.warn(
//             `Column index ${colNum} exceeds bounds.right ${right}. This cell will be skipped.`
//           );
//           return;
//         }
//         matrix[rowNum.toString()][colNum.toString()] = { v: cellValue };
//       });
//     });

//     // Convert tableBounds numbers to strings as required by SheetEngineTableStructure
//     const sheetEngineBounds = {
//       left: left.toString(),
//       top: top.toString(),
//       right: right.toString(),
//       bottom: bottom.toString(),
//     };

//     // Create the SheetEngineTableStructure object and add it to the array
//     const sheetEngineTable: SheetEngineTableStructure = {
//       tableName: table.tableName,
//       rows: matrix,
//       tableBounds: sheetEngineBounds,
//     };

//     sheetTables.push(sheetEngineTable);
//   });

//   return sheetTables;
// }

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

  const startRow = selection["startRow"];
  const endRow = selection["endRow"];
  const startColumn = selection["startColumn"];
  const endColumn = selection["endColumn"];

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
                  const rowSlice = originalRow.slice(
                      intersectColStart - left,
                      intersectColEnd - left + 1
                  );
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
                  bottom: intersectRowEnd,
              },
              tableBounds: {
                left: left,
                top: top,
                right: right,
                bottom: bottom
              }
          });
      }
  }

  return { tables: selectedTables };
}

function convertRowsToDataFrame(rows: CellValue[][]): string {
  if (!rows || rows.length === 0) {
    throw new Error("No rows provided for DataFrame conversion.");
  }

  // Sequentially label columns: Column_1, Column_2, etc.
  const columnNames = rows[0].map((_, index) => `Column_${index + 1}`);

  // Map the data rows into an array of objects for DataFrame creation
  const data = rows.map((row) =>
    row.reduce((acc, cell, index) => {
      acc[columnNames[index]] = cell ?? ""; // Assign empty string for undefined cells
      return acc;
    }, {} as Record<string, CellValue>)
  );

  // Create a DataFrame and drop the index
  const dataFrame = new DataFrame(data);
  
  // Return only the column data as a string
  return dataFrame.toArray().map(row => 
    columnNames.map(col => row[col]).join("\t")
  ).join("\n");
}

function LLMInteract(cell: IHoverRichTextInfo){ //this function is triggered when a cell is clicked
  range = sheet?.getActiveRange();
  // Get the currently selected range in the active sheet
  if (!range) {
    throw new Error("No active range found in the current sheet.");
  }
  //convert the selected part to dataframe first
  const selection = range['_range'];

  // Extract the cell matrix data structure from the worksheet
  const matrix: Matrix = cell['location']['worksheet']['_cellData']['_matrix'];

  // Process the matrix to extract tables and their values
  const extractedData = extractTablesAndValues(matrix);

  //Process and extract selected part of the sheet
  const singleSelectedPart = extractSelectedPart(selection, matrix);

  // String to store the complete sheet data in dataframe format
  let fullSheetDataframe: string = "";

  // String to store only the selected portion of data in dataframe format
  let selectedDataframe: string = "";

  //convert full sheet context to Dataframe
  fullSheetDataframe = extractedData.tables.map((table) => 
    convertRowsToDataFrame(table.rows)
  ).join("\n\n")  
  
  //convert selected sheet context
  if(!range) { //no cell chosen
    console.warn("No range selected.");
  }
  else{ //if cell chosen
  if (isCtrlPressed === false){//whenever a cell is clicked without pressing ctrl at the time, reset all the cells
    selectedTablesNames = [];
    selectedTableBounds = [];
    selectedRangeBounds = [];
    selectedDataframe = "";
  }

  singleSelectedPart.tables.forEach((table)=> {
    selectedTablesNames.push(table.tableName)
    selectedTableBounds.push(table.tableBounds)
    selectedRangeBounds.push(table.rangeBounds)
  })
  selectedDataframe = singleSelectedPart.tables.map((table) => convertRowsToDataFrame(table.selectedRowsInTable)).join("\n\n")
  }

  // Keyboard events
  window.addEventListener("keydown", async (event) => {
    if (event.ctrlKey && event.key === "e") {
      range = sheet?.getActiveRange();
      event.preventDefault();
      if (singleSelectedPart.tables.length > 0) { // Check if there are selected tables
        const userInput = window.prompt("Enter your edit instructions:", "");
        if (userInput !== null) {
          await executeLLM(userInput, fullSheetDataframe ,selectedDataframe, selectedTablesNames, selectedTableBounds, selectedRangeBounds, sheet, range
          );
        }
      } else {
        console.warn("No selected range context available.");
      }
    }
    // if (event.ctrlKey && event.key === "b") {
    //   event.preventDefault();
    //   const userCreationRequest = window.prompt("Enter your creation instructions:", "");
    //   if (userCreationRequest !== null && userCreationRequest.trim() !== "") {
    //     const createResponse = await gemini.requestCreate(userCreationRequest);
    //     console.log(`AI speaking...\n${createResponse}`);
    //     if (createResponse) {
    //       updateSheet(createResponse);
    //     }
    //   } else {
    //     console.warn("Creation request is empty or canceled.");
    //   }
    // }
  });
}


univerAPI.getActiveWorkbook()?.onCellClick(async (cell) => {
  LLMInteract(cell)
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

export async function executeLLM(
  userInput: string,
  fullSheetDataframe: string,
  selectedDataframe: string,
  selectedTablesNames: string[],
  selectedTableBounds: {}[],
  selectedRangeBounds: {}[],
  sheet: FWorksheet | undefined,
  range: FRange | null | undefined,
  numIteration: number = 1
): Promise<void> {


  const systemInstruction = `
  You are an advanced AI agent designed to cooperate, assist, or act independently to solve spreadsheet tasks given by humans.
  `;
  const metaPrompt = `
  The user is working on a normal spreadsheet (like Google Sheets or Microsoft Excel). Rows are indexed by numbers, columns by letters (A, B, C... AA, AB, etc.). For example, "A1" is the cell in the first column, first row.

  You receive several data items for context:

  1) **fullSheetDataframe**: A string representing the entire sheet's data in a dataframe format. 
     - This is a textual representation of the spreadsheet's contents, typically with rows separated by newlines and columns by tabs.
     - Only populated cells are included (empty cells may be absent or ignored). 
     - When you need a broader context about everything on the sheet, refer to this.

  2) **selectedDataframe**: A dataframe string that specifically covers the part of the sheet the user selected (which might be a single cell, a subrange, or an entire table). 
     - If the user selected something, this shows that portion. 
     - If blank, the user might not have explicitly chosen a specific region to focus on.

  3) **selectedTablesNames**: An array of table names the user is focusing on. 
     - If these names exist, it implies the user is working with certain identified tables.

  4) **selectedTableBounds**: An array of objects describing each selected table’s boundary on the actual sheet (e.g., top row, bottom row, left column, right column). 
     - Use these bounds to figure out the real sheet coordinates (row and column indexes).

  5) **selectedRangeBounds**: An array of objects that describe the actual row/column boundaries of the user’s direct selection. 
     - This might be smaller than (or equal to) a table’s bounds. 
     - If the selection is inside a table, it might affect only part of that table.

  **Important Notes**:
  - The dataframe(s) are abstractions of the spreadsheet content. The "bounds" (left, top, right, bottom) are the exact numeric row/column indices in the real sheet. You must connect the textual column/row labels (as found in the dataframes) to the numeric row/column indices from these bounds.
  - The user might request changes or queries about the selected portion, or the entire sheet. You should carefully determine whether the requested operation affects only the selected range, an entire table, or something else.
  - Because columns in the actual sheet are letter-labeled (A, B, C, etc.) but the bounds in your data might be numeric, pay close attention to how these relate. For instance, a "Column_1" in the dataframe may actually map to column index 0 or 1 in the real sheet, depending on how the table was extracted.
  - If uncertain how to map a user’s request to the table or bounds, you can clarify or deduce it logically by comparing the user’s selection info against the full sheet data.

  **Typical Constraints**:
  - The spreadsheet is assumed to behave like standard Excel or Google Sheets, where row indices go from 1 to many, and columns go from A, B, C... to potentially many columns (AA, AB, etc.).
  - If referencing cells or ranges in formulas or instructions, use standard A1 notation.

  What are you capable of:
  - A set of predefined functions that you can call the name to execute them. The functions are written in the Engine layer of the spreadsheet tool. You can use these functions to manipulate the sheet, extract data, or perform calculations.
  - You, as an AI (or LLM) still capable of handling data like translating, summarizing, or generating content based on the data you have. But for the actions that involve modifying the sheet, you need to use the functions provided.
  - Combine all the information you have to make the best decision on how to respond to the user's request.

  Your role:
  1) Interpret the user’s request in conjunction with these data items (fullSheetDataframe, selectedDataframe, table names, bounds).
  2) Decide how the user’s selection (if any) interacts with the rest of the sheet. 
  3) Provide the correct output or propose relevant actions, ensuring references and data align with the indicated bounds.
  4) Try your best to fulfill the user’s request, using the functions provided, and ensure the sheet context is consistent with every decision you make.

  Here is the current context of the sheet:
  - **fullSheetDataframe**:
  ${fullSheetDataframe}

  - **selectedDataframe**:
  ${selectedDataframe}

  - **selectedTablesNames**:
  ${JSON.stringify(selectedTablesNames)}

  - **selectedTableBounds**:
  ${JSON.stringify(selectedTableBounds)}

  - **selectedRangeBounds**:
  ${JSON.stringify(selectedRangeBounds)}
  `;

  /*  
   * STEP 1: Distinguish Q&A from Command and produce plan or direct user response
   * Explanation:
   *   - We want the LLM to figure out if the user is asking a question (Q&A)
   *     or giving an instruction (Command).
   *   - If Q&A, we only produce a user-facing answer, do not proceed to Step 2.
   *   - If Command, produce a plan ("Plan of Actions: ...") and "Respond to User: ..."
   */


  const functionDeclarations: FunctionDeclaration[] = [...rangeFunctionDeclarations, ...sheetFunctionDeclarations];
    //use in the first step for better context
  const functionDeclarationDescriptions: FunctionDescription[] = functionDeclarations.map(decl => ({
    name: decl.name,
    description: decl.parameters ? decl.parameters.description : decl.description
  }));
  
  // Create a formatted string with bullet points
  const formattedFunctionDescriptions: string = functionDeclarationDescriptions.map(decl => `- **${decl.name}**: ${decl.description}`).join('\n');

  //convert into correct format for tools received by GeminiAPI
  const tools: FunctionDeclarationsTool[]  = [{"functionDeclarations": functionDeclarations}];


  const step1InstructionPrompt = `
  This is a list of available tools that you can use to manipulate the sheet:
  ${formattedFunctionDescriptions}
  ----------------------------------------------------------------------------

  1) Classify the user's request as "QnA" (pure question about data) or "Command" (an operation/instruction).
  2) If it is "QnA", respond only with "Respond to User:" plus the answer to user. This is for a quick answer to a question, or maybe a follow-up question, or even a clarification, a short response to let the user know that you are on the job of completing what the user's requests.
  3) If it is "Command", produce two sections:
     - "Respond to User:" a short immediate response to user (same as I descibre above).
     - "Plan of Actions:" enumerates your plan to fulfill the user's request. This is a high-level plan that outlines the steps you will take to complete the user's request.
        Those are the functions that can manipulate the sheet. When devise a plan, you can align your actions with these functions as these are what you need to do to perform possible tasks on the spreadsheet (you can do text generation, translation, summarization and combine with these functions to actually affect the sheet).
        Create a brief description of a plan, at each step, specify clearly what is the name (and the name only) of the function you will call.
        For example: if the user's request is to translate a range he is selecting, you can just use only the function that can set values on that range since the translation job is done by you in later steps.

     - "Functions": write down the name of all the functions you decide to use in your plan in a list format. Note that, only choose the functions that exist in your tools inventory.
  `;

  const step1FullPrompt = metaPrompt + `
  User Request:
  ${userInput}

  ${selectedDataframe}

  ` + step1InstructionPrompt;

  const step1Response = await gemini.reply(step1FullPrompt, systemInstruction);

  // Let's parse out whether it's QnA or Command.
  // We look for "Plan of Actions:" in the text. If not found, it's presumably QnA.
  let isCommand = false;
  let planOfActions = "";
  let userResponseStep1 = "";
  let functionHints = "";

  if (step1Response.includes("Plan of Actions:")) {
    isCommand = true;
    // Extract "Plan of Actions:" section and the "Respond to User:" part
    const planMarker = "Plan of Actions:";
    const respondMarker = "Respond to User:";
    const functionsMarker = "Functions:";

    const planStart = step1Response.indexOf(planMarker);
    const respondStart = step1Response.indexOf(respondMarker);

    if (planStart !== -1 && respondStart !== -1) {
      planOfActions = step1Response.substring(planStart + planMarker.length, respondStart).trim();
      userResponseStep1 = step1Response.substring(respondStart + respondMarker.length).trim();
      functionHints = step1Response.substring(step1Response.indexOf(functionsMarker) + functionsMarker.length).trim();
    } else {
      // If it messed up the format, we fallback
      planOfActions = "(Could not parse plan)";
      functionHints = "(Could not parse functions)";
      userResponseStep1 = step1Response;
    }
  } else {
    // It's presumably QnA type, so the entire message is "Respond to user"
    userResponseStep1 = step1Response;
  }

  // Show the user the immediate response from step 1
  console.log("=== Step 1: Raw reply ===\n", step1Response);

  // If QnA, we stop here
  if (!isCommand) {
    console.log("LLM classified the request as QnA. No further commands needed. Exiting.");
    return;
  }

  // Otherwise, it's a Command. Proceed to Step 2.

  /*
   * STEP 2: Use function calling. 
   * We'll incorporate the planOfActions into a new prompt, plus a trajectory that accumulates function call results each iteration
   */
  let iterationCount = 0;
  let done = false;
  let functionCallTrajectory = ""; // accumulate feedback about calls

  while (!done && iterationCount < numIteration) {
    iterationCount++;
    console.log(`\n--- Step 2 Iteration ${iterationCount} ---`);

    // We'll build a prompt that includes the plan + any prior function call results:
    const step2InstructionPrompt = `
    Now, you are given the hints of all functions that you have to call for completing the user's request.
    Your creator request's is that, everytime you receive the hints about functions, make sure you call all of them, don't left any function executed.
    Think very carefully and critically how to create exact arguments/parameters to parse into the function to make it work correctly.

    ***Functions hint***:
    ${functionHints}

    ***Important***:
    2. This was the user's request from earlier:
    ${userInput}

    3. This was what the user selected in the sheet. If it's related to the user's request, focus to make changes based on that specific range if it's related to the user's request. If not, focus solely on the user's request:
    ${selectedDataframe}
    `;

    const step2Prompt = metaPrompt + step2InstructionPrompt;

    // Call LLM with function calling
    console.log("=== Step 2: Function-Calling Prompt ===\n", step2Prompt);
    const functionCallResponse = await gemini.replyWithFuncs(
      step2Prompt,
      tools,
      systemInstruction
    );

    // We'll parse the function calls. Suppose functionCallResponse is an array of calls
    if (!Array.isArray(functionCallResponse.response.candidates) || functionCallResponse.response.candidates.length === 0) {
      console.log("LLM responded with no function calls or 'None'. Possibly done with commands.");
      // Check if we proceed to Step 3 or break
      break;
    }

    console.log(functionCallResponse.response.candidates[0]);

    console.log("Executing function within this range", range)
    // Replace the nested forEach loops with for...of loops
    for (const candidate of functionCallResponse.response.candidates) {
      for (const func of candidate.content.parts) {
        if (func.functionCall) {
          const fn = func.functionCall.name;
          const args = func.functionCall.args;
          let result;

          try {
            if ((rangeFunctions as any)[fn]) {
              // Await the asynchronous function
              result = await (rangeFunctions as any)[fn](range, args);
            } else if ((sheetFunctions as any)[fn]) {
              console.log("Executing sheet function...");
              // Await the asynchronous function
              result = await (sheetFunctions as any)[fn](sheet, args);
            } else {
              console.log(`Function "${fn}" not recognized. Doing nothing.`);
              result = "No function found with that name.";
            }

            // Append to function call trajectory for feedback
            functionCallTrajectory += `
            - Called ${fn}(${JSON.stringify(args)}) => ${JSON.stringify(result)}
            `;
            console.log(functionCallTrajectory);
          } catch (error) {
            console.error(`Error executing function "${fn}":`, error);
            functionCallTrajectory += `
            - Called ${fn}(${JSON.stringify(args)}) => Error: ${String(error)}
            `;
            console.log(functionCallTrajectory);
          }
        }
      }
    }


    // // STEP 3: Evaluate "Complete" or "Failed"
    // // We'll do a separate prompt that references the function call results:
    // const step3InstructionPrompt = `
    // Evaluate your progress after these function calls:
    // ${functionCallTrajectory}

    // Are we finished satisfying the user's request? If yes, say "Complete". If no, say "Failed" or "More steps needed".

    // ***Important***:
    // 1. Pay attention carefully to the plan of actions you come up earlier:
    // ${planOfActions}

    // 2. And also the current context of the sheet, if it's not aligned with the user's request, you can't stop here.

    // 3. Remind the user's request earlier:
    // ${userInput}
    // `;

    // const step3Prompt = metaPrompt + step3InstructionPrompt;
    // const evaluation = await gemini.reply(step3Prompt, systemInstruction);

    // console.log("=== LLM Self-Evaluation ===\n", evaluation);

    // const lowerEval = evaluation.toLowerCase();
    // if (lowerEval.includes("complete")) {
    //   console.log("LLM indicates tasks are complete. Exiting iteration.");
    //   done = true;
    // } else if (lowerEval.includes("failed")) {
    //   console.log("LLM indicates tasks have failed. Exiting iteration.");
    //   done = true;
    // } else if (lowerEval.includes("more steps")) {
    //   console.log("LLM says more steps needed. We'll loop again if iteration remains.");
    // } else {
    //   console.log("No explicit 'Complete'/'Failed'/'More steps'; continuing if iteration remains...");
    // }
  }


  console.log("=== Done with executeLLM ===");
}
