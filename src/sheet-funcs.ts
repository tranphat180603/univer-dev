/* sheet-llm-commands.ts
 * A short, minimal set of LLM function declarations + calls for FWorksheet methods.
 */

import { univerAPI } from "./main"; // or your actual import
import { FunctionDeclaration } from "@google/generative-ai";
import { FWorksheet } from "@univerjs/sheets/facade";

/* ------------------------------------------------------------
 * 1) getSheetName
 * ------------------------------------------------------------ */
export const getSheetNameDecl = {
  name: "getSheetName",
  description: "Returns the name (title) of the active sheet?.",
};
async function getSheetName(sheet: FWorksheet | undefined,) {
  const name = sheet?.getSheetName() ?? "No active sheet";
  return { status: "ok", info: name };
}

/* ------------------------------------------------------------
 * 2) getSelection
 * ------------------------------------------------------------ */
export const getSelectionDecl = {
  name: "getSelection",
  description: "Returns the current selection range info or null if none.",
};
async function getSelection(sheet: FWorksheet | undefined,) {
  const sel = sheet?.getSelection();
  return { status: "ok", info: sel ? "Selection found" : "No selection", selection: sel };
}

/* ------------------------------------------------------------
 * 3) getDefaultStyle
 * ------------------------------------------------------------ */
export const getDefaultStyleDecl = {
  name: "getDefaultStyle",
  description: "Gets default style of the active sheet?.",
};
async function getDefaultStyle(sheet: FWorksheet | undefined,) {
  const style = sheet?.getDefaultStyle();
  return { status: "ok", info: style };
}

/* ------------------------------------------------------------
 * 4) getRowDefaultStyle
 * ------------------------------------------------------------ */
export const getRowDefaultStyleDecl = {
  name: "getRowDefaultStyle",
  parameters: {
    type: "object",
    description: "Gets the default style set for a given row.",
    properties: {
      index: { type: "number", description: "Row index" },
      keepRaw: { type: "boolean", description: "If true, returns raw style data." },
    },
    required: ["index"],
  },
};
async function getRowDefaultStyle(sheet: FWorksheet | undefined,{ index, keepRaw = false }: { index: number; keepRaw?: boolean }) {
  const style = sheet?.getRowDefaultStyle(index, keepRaw);
  return { status: "ok", info: style };
}

/* ------------------------------------------------------------
 * 5) getColumnDefaultStyle
 * ------------------------------------------------------------ */
export const getColumnDefaultStyleDecl = {
  name: "getColumnDefaultStyle",
  parameters: {
    type: "object",
    description: "Gets the default style set for a given column.",
    properties: {
      index: { type: "number", description: "Column index" },
      keepRaw: { type: "boolean", description: "If true, returns raw style data." },
    },
    required: ["index"],
  },
};
async function getColumnDefaultStyle(sheet: FWorksheet | undefined,{ index, keepRaw = false }: { index: number; keepRaw?: boolean }) {
  const style = sheet?.getColumnDefaultStyle(index, keepRaw);
  return { status: "ok", info: style };
}

/* ------------------------------------------------------------
 * 6) setDefaultStyle
 * ------------------------------------------------------------ */
export const setDefaultStyleDecl = {
  name: "setDefaultStyle",
  parameters: {
    type: "object",
    description: "Sets the default style for the active sheet?.",
    properties: {
      style: { type: "string", description: "The style name or definition." },
    },
    required: ["style"],
  },
};
async function setDefaultStyle(sheet: FWorksheet | undefined,{ style }: { style: string }) {
  await sheet?.setDefaultStyle(style);
  return { status: "ok", info: `Default style set to ${style}` };
}

/* ------------------------------------------------------------
 * 7) setColumnDefaultStyle
 * ------------------------------------------------------------ */
export const setColumnDefaultStyleDecl = {
  name: "setColumnDefaultStyle",
  parameters: {
    type: "object",
    description: "Sets a custom default style for a given column.",
    properties: {
      index: { type: "number", description: "Column index" },
      style: { type: "string", description: "Style name or data" },
    },
    required: ["index", "style"],
  },
};
async function setColumnDefaultStyleFn(sheet: FWorksheet | undefined,{ index, style }: { index: number; style: string }) {
  await sheet?.setColumnDefaultStyle(index, style);
  return { status: "ok", info: `Column ${index} default style set` };
}

/* ------------------------------------------------------------
 * 8) setRowDefaultStyle
 * ------------------------------------------------------------ */
export const setRowDefaultStyleDecl = {
  name: "setRowDefaultStyle",
  parameters: {
    type: "object",
    description: "Sets a custom default style for a given row.",
    properties: {
      index: { type: "number", description: "Row index" },
      style: { type: "string", description: "Style name or data" },
    },
    required: ["index", "style"],
  },
};
async function setRowDefaultStyleFn(sheet: FWorksheet | undefined,{ index, style }: { index: number; style: string }) {
  await sheet?.setRowDefaultStyle(index, style);
  return { status: "ok", info: `Row ${index} default style set` };
}

/* ------------------------------------------------------------
 * 9) getRange
 * ------------------------------------------------------------ */
export const getRangeDecl = {
  name: "getRange",
  parameters: {
    type: "object",
    description: "Retrieves a range by row/col indices or A1 notation.",
    properties: {
      rowOrA1: { type: "string", description: "A1 notation or row index as string." },
      column: { type: "number", description: "Column index if using numeric approach." },
      numRows: { type: "number" },
      numColumns: { type: "number" },
    },
    required: ["rowOrA1"],
  },
};
async function getRangeFn(sheet: FWorksheet | undefined,{ rowOrA1, column, numRows, numColumns }:
  { rowOrA1: number | string; column?: number; numRows?: number; numColumns?: number }) 
{
  if (!sheet) return { status: "fail", info: "No active sheet" };
  try {
    const rng = typeof rowOrA1 === "string"
      ? sheet?.getRange(rowOrA1)
      : sheet?.getRange(+rowOrA1, column ?? 0, numRows ?? 1, numColumns ?? 1);
    return { status: "ok", info: "Range retrieved", range: rng };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

/* ------------------------------------------------------------
 * 10) getMaxColumns
 * ------------------------------------------------------------ */
export const getMaxColumnsDecl = {
  name: "getMaxColumns",
  description: "Returns the current total number of columns.",
};
async function getMaxColumns(sheet: FWorksheet | undefined,) {
  const cols = sheet?.getMaxColumns();
  return { status: "ok", info: `${cols}` };
}

/* ------------------------------------------------------------
 * 11) getMaxRows
 * ------------------------------------------------------------ */
export const getMaxRowsDecl = {
  name: "getMaxRows",
  description: "Returns the current total number of rows.",
};
async function getMaxRows(sheet: FWorksheet | undefined,) {
  const rows = sheet?.getMaxRows();
  return { status: "ok", info: `${rows}` };
}

/* ------------------------------------------------------------
 * 12) insertRows
 * ------------------------------------------------------------ */
export const insertRowsDecl = {
  name: "insertRows",
  parameters: {
    type: "object",
    description: "Inserts one or more consecutive blank rows at rowIndex.",
    properties: {
      rowIndex: { type: "number", description: "Starting row index" },
      numRows: { type: "number", description: "Number of rows to insert" },
    },
    required: ["rowIndex", "numRows"],
  },
};
async function insertRows(sheet: FWorksheet | undefined,{ rowIndex, numRows }: { rowIndex: number; numRows: number }) {
  await sheet?.insertRows(rowIndex, numRows);
  return { status: "ok", info: `Inserted ${numRows} rows at ${rowIndex}` };
}

/* ------------------------------------------------------------
 * 13) deleteRows
 * ------------------------------------------------------------ */
export const deleteRowsDecl = {
  name: "deleteRows",
  parameters: {
    type: "object",
    description: "Deletes one or more rows starting at the given index.",
    properties: {
      rowIndex: { type: "number" , description: "The position of the first row to delete."},
      howMany: { type: "number", description: "The number of rows to delete."},
    },
    required: ["rowIndex", "howMany"],
  },
};
async function deleteRows(sheet: FWorksheet | undefined,{ rowIndex, howMany }: { rowIndex: number; howMany: number }) {
  await sheet?.deleteRows(rowIndex, howMany);
  return { status: "ok", info: `Deleted ${howMany} rows at ${rowIndex}` };
}

/* ------------------------------------------------------------
 * 14) moveRows
 * ------------------------------------------------------------ */
export const moveRowsDecl = {
  name: "moveRows",
  parameters: {
    type: "object",
    description: "Moves rows spanned by a range to destinationIndex.",
    properties: {
      rowIndex: { type: "number" , description:  "The position of the first row in the range to move."},
      numRows: { type: "number" , description: "The number of the rows to move." },
      destinationIndex: { type: "number" , description:"The index that the rows should be moved to. Use 0-index for this argument."},
    },
    required: ["rowIndex", "numRows", "destinationIndex"],
  },
};
async function moveRowsFn(sheet: FWorksheet | undefined,{ rowIndex, numRows, destinationIndex }:
  { rowIndex: number; numRows: number; destinationIndex: number }) 
{
  if (!sheet) return { status: "fail", info: "No sheet" };
  const range = sheet?.getRange(rowIndex, 0, numRows, sheet?.getMaxColumns());
  await sheet?.moveRows(range, destinationIndex);
  return { status: "ok", info: `Moved ${numRows} rows from ${rowIndex} to ${destinationIndex}` };
}

/* ------------------------------------------------------------
 * 15) hideRows
 * ------------------------------------------------------------ */
export const hideRowsDecl = {
  name: "hideRows",
  parameters: {
    type: "object",
    description: "Hides one or more rows at rowIndex.",
    properties: {
      rowIndex: { type: "number" , description:"The position of the first row in the range to hide."},
      numRows: { type: "number" , description:"The number of the rows to hide." },
    },
    required: ["rowIndex", "numRows"],
  },
};
async function hideRows(sheet: FWorksheet | undefined,{ rowIndex, numRows }: { rowIndex: number; numRows: number }) {
  await sheet?.hideRows(rowIndex, numRows);
  return { status: "ok", info: `Hid ${numRows} rows at ${rowIndex}` };
}

/* ------------------------------------------------------------
 * 16) showRows
 * ------------------------------------------------------------ */
export const showRowsDecl = {
  name: "showRows",
  parameters: {
    type: "object",
    description: "Unhides one or more rows at rowIndex.",
    properties: {
      rowIndex: { type: "number" , description:"The position of the first row in the range to show."},
      numRows: { type: "number" , description:"The position of the first row in the range to show."},
    },
    required: ["rowIndex", "numRows"],
  },
};
async function showRows(sheet: FWorksheet | undefined,{ rowIndex, numRows }: { rowIndex: number; numRows: number }) {
  await sheet?.showRows(rowIndex, numRows);
  return { status: "ok", info: `Showed ${numRows} rows at ${rowIndex}` };
}

/* ------------------------------------------------------------
 * 17) setRowHeights
 * ------------------------------------------------------------ */
export const setRowHeightsDecl = {
  name: "setRowHeights",
  parameters: {
    type: "object",
    description: "Sets row heights for a range of rows.",
    properties: {
      startRow: { type: "number" , description:"The starting row position to change."},
      numRows: { type: "number" , description:"The number of rows to change."},
      height: { type: "number" , description:"The height in pixels to set it to."},
    },
    required: ["startRow", "numRows", "height"],
  },
};
async function setRowHeightsFn(sheet: FWorksheet | undefined,{ startRow, numRows, height }: { startRow: number; numRows: number; height: number }) {
  await sheet?.setRowHeights(startRow, numRows, height);
  return { status: "ok", info: `Rows ${startRow}..${startRow + numRows - 1} height -> ${height}px` };
}

// /* ------------------------------------------------------------
//  * 18) setRowHeightsForced
//  * ------------------------------------------------------------ */
// export const setRowHeightsForcedDecl = {
//   name: "setRowHeightsForced",
//   parameters: {
//     type: "object",
//     description: "Forcibly sets row heights, ignoring auto-height.",
//     properties: {
//       startRow: { type: "number" , description:},
//       numRows: { type: "number" , description:},
//       height: { type: "number" , description:},
//     },
//     required: ["startRow", "numRows", "height"],
//   },
// };
// async function setRowHeightsForcedFn({ startRow, numRows, height }: { startRow: number; numRows: number; height: number }) {
//   await sheet?.setRowHeightsForced(startRow, numRows, height);
//   return { status: "ok", info: `Forced rows ${startRow}..${startRow + numRows - 1} height -> ${height}px` };
// }

// /* ------------------------------------------------------------
//  * 19) setRowCustom
//  * ------------------------------------------------------------ */
// export const setRowCustomDecl = {
//   name: "setRowCustom",
//   parameters: {
//     type: "object",
//     description: "Sets custom properties for specified rows.",
//     properties: {
//       custom: { type: "object", description: "Object with rowIndex -> customData" },
//     },
//     required: ["custom"],
//   },
// };
// async function setRowCustom({ custom }: { custom: any }) {
//   await sheet?.setRowCustom(custom);
//   return { status: "ok", info: `Row custom props set` };
// }

/* ------------------------------------------------------------
 * 20) insertColumns
 * ------------------------------------------------------------ */
export const insertColumnsDecl = {
  name: "insertColumns",
  parameters: {
    type: "object",
    description: "Inserts columns starting at columnIndex.",
    properties: {
      columnIndex: { type: "number" , description:"The index indicating where to insert a column, starting at 0 for the first column."},
      numColumns: { type: "number", description: "The number of columns to insert."},
    },
    required: ["columnIndex", "numColumns"],
  },
};
async function insertColumns(sheet: FWorksheet | undefined,{ columnIndex, numColumns }: { columnIndex: number; numColumns: number }) {
  await sheet?.insertColumns(columnIndex, numColumns);
  return { status: "ok", info: `Inserted ${numColumns} columns at ${columnIndex}` };
}

/* ------------------------------------------------------------
 * 21) deleteColumns
 * ------------------------------------------------------------ */
export const deleteColumnsDecl = {
  name: "deleteColumns",
  parameters: {
    type: "object",
    description: "Deletes columns starting at the given index.",
    properties: {
      columnPosition: { type: "number" , description:"The position of the first column to delete, starting at 0 for the first column."},
      howMany: { type: "number", description: "The number of columns to delete."},
    },
    required: ["columnPosition", "howMany"],
  },
};
async function deleteColumnsFn(sheet: FWorksheet | undefined,{ columnPosition, howMany }: { columnPosition: number; howMany: number }) {
  await sheet?.deleteColumns(columnPosition, howMany);
  return { status: "ok", info: `Deleted ${howMany} columns at ${columnPosition}` };
}

/* ------------------------------------------------------------
 * 22) moveColumns
 * ------------------------------------------------------------ */
export const moveColumnsDecl = {
  name: "moveColumns",
  parameters: {
    type: "object",
    description: "Moves columns spanned by a range to destinationIndex.",
    properties: {
      columnIndex: { type: "number" , description: "The position of the first column in the range to move."},
      numColumns: { type: "number" , description: "The number of columns in the range to move."},
      destinationIndex: { type: "number" , description:"The index that the columns should be moved to. Use 0-index for this method."},
    },
    required: ["columnIndex", "numColumns", "destinationIndex"],
  },
};
async function moveColumnsFn(sheet: FWorksheet | undefined,{ columnIndex, numColumns, destinationIndex }:
  { columnIndex: number; numColumns: number; destinationIndex: number }) 
{
  if (!sheet) return { status: "fail", info: "No sheet" };
  const rng = sheet?.getRange(0, columnIndex, sheet?.getMaxRows(), numColumns);
  await sheet?.moveColumns(rng, destinationIndex);
  return { status: "ok", info: `Moved ${numColumns} cols from ${columnIndex} to ${destinationIndex}` };
}

/* ------------------------------------------------------------
 * 23) hideColumns
 * ------------------------------------------------------------ */
export const hideColumnsDecl = {
  name: "hideColumns",
  parameters: {
    type: "object",
    description: "Hides columns at the given index.",
    properties: {
      columnIndex: { type: "number" , description: "The starting index of the columns to hide."},
      numColumns: { type: "number" , description: "The number of columns to hide."},
    },
    required: ["columnIndex", "numColumns"],
  },
};
async function hideColumns(sheet: FWorksheet | undefined,{ columnIndex, numColumns }: { columnIndex: number; numColumns: number }) {
  await sheet?.hideColumns(columnIndex, numColumns);
  return { status: "ok", info: `Hid ${numColumns} cols at ${columnIndex}` };
}

/* ------------------------------------------------------------
 * 24) showColumns
 * ------------------------------------------------------------ */
export const showColumnsDecl = {
  name: "showColumns",
  parameters: {
    type: "object",
    description: "Unhides columns at the given index.",
    properties: {
      columnIndex: { type: "number" , description: "The starting index of the columns to unhide."},
      numColumns: { type: "number" , description: "The number of columns to unhide."},
    },
    required: ["columnIndex", "numColumns"],
  },
};
async function showColumns(sheet: FWorksheet | undefined,{ columnIndex, numColumns }: { columnIndex: number; numColumns: number }) {
  await sheet?.showColumns(columnIndex, numColumns);
  return { status: "ok", info: `Showed ${numColumns} cols at ${columnIndex}` };
}

/* ------------------------------------------------------------
 * 25) setColumnWidths
 * ------------------------------------------------------------ */
export const setColumnWidthsDecl = {
  name: "setColumnWidths",
  parameters: {
    type: "object",
    description: "Sets the width of multiple columns.",
    properties: {
      startColumn: { type: "number" , description: "The starting column position to change."},
      numColumns: { type: "number" , description: "The number of columns to change."},
      width: { type: "number" , description: "The width in pixels to set it to."},
    },
    required: ["startColumn", "numColumns", "width"],
  },
};
async function setColumnWidthsFn(sheet: FWorksheet | undefined,{ startColumn, numColumns, width }:
  { startColumn: number; numColumns: number; width: number }) 
{
  await sheet?.setColumnWidths(startColumn, numColumns, width);
  return { status: "ok", info: `Cols ${startColumn}..${startColumn + numColumns - 1} => width ${width}` };
}

// /* ------------------------------------------------------------
//  * 26) setColumnCustom
//  * ------------------------------------------------------------ */
// export const setColumnCustomDecl = {
//   name: "setColumnCustom",
//   parameters: {
//     type: "object",
//     description: "Sets custom properties for columns.",
//     properties: {
//       custom: { type: "object", description: "columnIndex->customData" },
//     },
//     required: ["custom"],
//   },
// };
// async function setColumnCustom({ custom }: { custom: any }) {
//   await sheet?.setColumnCustom(custom);
//   return { status: "ok", info: `Column custom props set` };
// }

/* ------------------------------------------------------------
 * 27) getMergedRanges
 * ------------------------------------------------------------ */
export const getMergedRangesDecl = {
  name: "getMergedRanges",
  description: "Retrieves all merged-cell ranges in the sheet?.",
};
async function getMergedRanges(sheet: FWorksheet | undefined,) {
  const ranges = sheet?.getMergedRanges() ?? [];
  return { status: "ok", info: `Found ${ranges.length} merges`, merges: ranges };
}

/* ------------------------------------------------------------
 * 28) getCellMergeData
 * ------------------------------------------------------------ */
export const getCellMergeDataDecl = {
  name: "getCellMergeData",
  parameters: {
    type: "object",
    description: "Gets the merged range for a given cell, if any.",
    properties: {
      row: { type: "number" , description: "The row index."},
      column: { type: "number" , description: " The column index."},
    },
    required: ["row", "column"],
  },
};
async function getCellMergeData(sheet: FWorksheet | undefined,{ row, column }: { row: number; column: number }) {
  const rng = sheet?.getCellMergeData(row, column);
  return { status: "ok", info: rng ? "Merged range found" : "No merge", range: rng };
}

/* ------------------------------------------------------------
 * 29) getActiveRange
 * ------------------------------------------------------------ */
export const getActiveRangeDecl = {
  name: "getActiveRange",
  description: "Returns the currently active (a cell is defined active if it contains values or set with some styles`) range or null if none.",
};
async function getActiveRangeFn(sheet: FWorksheet | undefined,) {
  const rng = sheet?.getActiveRange();
  return { status: "ok", info: rng ? "Active range found" : "No active range", range: rng };
}

/* ------------------------------------------------------------
 * 30) setActiveRange
 * ------------------------------------------------------------ */
export const setActiveRangeDecl = {
  name: "setActiveRange",
  parameters: {
    type: "object",
    description: "Sets the active selection region by A1 or row/col dims.",
    properties: {
      rowOrA1: { type: "string", description: `String A1 notation or numeric row. 
        Some examples of A1 notation:
        // Get a single cell A1
        const range2 = sheet?.getRange('A1');
        // Get the A1:B2 range
        const range3 = sheet?.getRange('A1:B2');
        
        // Get the range of column A
        const range4 = sheet?.getRange('A:A');
        
        // Get the range of row 1
        const range5 = sheet?.getRange('1:1');

        An example of numeric row:
        // Creates a range of A1:B2:
        const range2 = sheet?.getRange(0, 0, 2, 2);
        ` },

      column: { type: "number" , description: "starting column index"},
      numRows: { type: "number" , description: "number of rows in the range to set active"},
      numColumns: { type: "number" , description:"number of columns in the range to set active"},
    },
    required: ["rowOrA1"],
  },
};
async function setActiveRangeFn(sheet: FWorksheet | undefined,{ rowOrA1, column, numRows, numColumns }:
  { rowOrA1: string | number; column?: number; numRows?: number; numColumns?: number }) 
{
  if (!sheet) return { status: "fail", info: "No sheet" };
  let rng;
  if (typeof rowOrA1 === "string") {
    rng = sheet?.getRange(rowOrA1);
  } else {
    rng = sheet?.getRange(rowOrA1, column ?? 0, numRows ?? 1, numColumns ?? 1); //if not, set choosing A1 only.
  }
  sheet?.setActiveRange(rng);
  return { status: "ok", info: "Active range set" };
}

/* ------------------------------------------------------------
 * 31) hasHiddenGridLines
 * ------------------------------------------------------------ */
export const hasHiddenGridLinesDecl = {
  name: "hasHiddenGridLines",
  description: "Checks if the sheet's gridlines are hidden.",
};
async function hasHiddenGridLines(sheet: FWorksheet | undefined,) {
  const hidden = sheet?.hasHiddenGridLines();
  return { status: "ok", info: hidden ? "Gridlines hidden" : "Gridlines shown" };
}

/* ------------------------------------------------------------
 * 32) setHiddenGridlines
 * ------------------------------------------------------------ */
export const setHiddenGridlinesDecl = {
  name: "setHiddenGridlines",
  parameters: {
    type: "object",
    description: "Hides or reveals gridlines in the sheet?.",
    properties: {
      hidden: { type: "boolean" , description:"hidden If `true`, hide gridlines in this sheet; otherwise show the gridlines."},
    },
    required: ["hidden"],
  },
};
async function setHiddenGridlines(sheet: FWorksheet | undefined,{ hidden }: { hidden: boolean }) {
  await sheet?.setHiddenGridlines(hidden);
  return { status: "ok", info: `Gridlines now ${hidden ? "hidden" : "visible"}` };
}

/* ------------------------------------------------------------
 * Combine Declarations
 * ------------------------------------------------------------ */
export const sheetFunctionDeclarations = [
  getSheetNameDecl,
  getSelectionDecl,
  getDefaultStyleDecl,
  getRowDefaultStyleDecl,
  getColumnDefaultStyleDecl,
  setDefaultStyleDecl,
  setColumnDefaultStyleDecl,
  setRowDefaultStyleDecl,
  getRangeDecl,
  getMaxColumnsDecl,
  getMaxRowsDecl,
  insertRowsDecl,
  deleteRowsDecl,
  moveRowsDecl,
  hideRowsDecl,
  showRowsDecl,
  setRowHeightsDecl,
//   setRowHeightsForcedDecl,
//   setRowCustomDecl,
  insertColumnsDecl,
  deleteColumnsDecl,
  moveColumnsDecl,
  hideColumnsDecl,
  showColumnsDecl,
  setColumnWidthsDecl,
//   setColumnCustomDecl,
  getMergedRangesDecl,
  getCellMergeDataDecl,
  getActiveRangeDecl,
  setActiveRangeDecl,
  hasHiddenGridLinesDecl,
  setHiddenGridlinesDecl,
] as FunctionDeclaration[];

/* ------------------------------------------------------------
 * Combine Implementations
 * ------------------------------------------------------------ */
export const sheetFunctions = {
  getSheetName,
  getSelection,
  getDefaultStyle,
  getRowDefaultStyle,
  getColumnDefaultStyle,
  setDefaultStyle,
  setColumnDefaultStyle: setColumnDefaultStyleFn,
  setRowDefaultStyle: setRowDefaultStyleFn,
  getRange: getRangeFn,
  getMaxColumns,
  getMaxRows,
  insertRows,
  deleteRows,
  moveRows: moveRowsFn,
  hideRows,
  showRows,
  setRowHeights: setRowHeightsFn,
//   setRowHeightsForced: setRowHeightsForcedFn,
//   setRowCustom,
  insertColumns,
  deleteColumns: deleteColumnsFn,
  moveColumns: moveColumnsFn,
  hideColumns,
  showColumns,
  setColumnWidths: setColumnWidthsFn,
//   setColumnCustom,
  getMergedRanges,
  getCellMergeData,
  getActiveRange: getActiveRangeFn,
  setActiveRange: setActiveRangeFn,
  hasHiddenGridLines,
  setHiddenGridlines,
};

// export const sheetFunctionDescriptions = []

// sheetFunctionDeclarations.forEach((decl, i) => {
//   sheetFunctionDescriptions.push({
//     ...decl,
//     implementation: sheetFunctions[decl.name],
//   });
// });
