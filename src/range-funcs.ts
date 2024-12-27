import { FRange } from "@univerjs/sheets/facade";
import { FHorizontalAlignment, FVerticalAlignment } from "@univerjs/sheets/lib/types/facade/utils.js";
import { WrapStrategy } from "@univerjs/core";
import { FunctionDeclaration } from "@google/generative-ai";

// -----------------------------------------------------------------------------
// 1) getUnitId
// -----------------------------------------------------------------------------
export const getUnitIdDecl = {
  name: "getUnitId",
  description:
    "Returns the unit (workbook) ID of the current FRange's workbook."
};
async function getUnitIdFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const uid = rng.getUnitId();
    return { status: "ok", info: "Workbook unit ID fetched", unitId: uid };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 2) getSheetName
// -----------------------------------------------------------------------------
export const getSheetNameDecl = {
  name: "getSheetName",
  description: "Gets the name of the worksheet that the FRange belongs to."
};
async function getSheetNameFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const sName = rng.getSheetName();
    return { status: "ok", info: "Sheet name fetched", sheetName: sName };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 3) getRange
// -----------------------------------------------------------------------------
export const getRangeDecl = {
  name: "getRange",
  description:
    "Returns the raw IRange object (startRow, endRow, startColumn, endColumn) from the FRange."
};
async function getRangeFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const data = rng.getRange(); // returns IRange
    return { status: "ok", info: "IRange retrieved", range: data };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 4) getRow
// -----------------------------------------------------------------------------
export const getRowDecl = {
  name: "getRow",
  description: "Gets the starting row index of this FRange."
};
async function getRowFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const row = rng.getRow();
    return { status: "ok", info: "Row index retrieved", row };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 5) getColumn
// -----------------------------------------------------------------------------
export const getColumnDecl = {
  name: "getColumn",
  description: "Gets the starting column index of this FRange."
};
async function getColumnFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const col = rng.getColumn();
    return { status: "ok", info: "Column index retrieved", column: col };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 6) getWidth
// -----------------------------------------------------------------------------
export const getWidthDecl = {
  name: "getWidth",
  description: "Gets the width (number of columns) of this FRange."
};
async function getWidthFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const w = rng.getWidth();
    return { status: "ok", info: "FRange width retrieved", width: w };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 7) getHeight
// -----------------------------------------------------------------------------
export const getHeightDecl = {
  name: "getHeight",
  description: "Gets the height (number of rows) of this FRange."
};
async function getHeightFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const h = rng.getHeight();
    return { status: "ok", info: "FRange height retrieved", height: h };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 8) getCellData
// -----------------------------------------------------------------------------
export const getCellDataDecl = {
  name: "getCellData",
  description: "Returns the cell data (ICellData) of the first cell in this FRange."
};
async function getCellDataFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const data = rng.getCellData();
    return { status: "ok", info: "Cell data retrieved", cellData: data };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 9) isMerged
// -----------------------------------------------------------------------------
export const isMergedDecl = {
  name: "isMerged",
  description: "Checks if this FRange is merged as a single-cell region."
};
async function isMergedFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const merged = rng.isMerged();
    return { status: "ok", info: "isMerged result", merged };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 10) getCellStyleData
// -----------------------------------------------------------------------------
export const getCellStyleDataDecl = {
  name: "getCellStyleData",
  description: "Returns the style data (IStyleData) of the first cell in this FRange."
};
async function getCellStyleDataFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const styleData = rng.getCellStyleData();
    return { status: "ok", info: "Cell style data retrieved", styleData };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 11) getValue
// -----------------------------------------------------------------------------
export const getValueDecl = {
  name: "getValue",
  description: "Gets the value (CellValue) of the first cell in this FRange."
};
async function getValueFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const val = rng.getValue();
    return { status: "ok", info: "Cell value retrieved", value: val };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 12) getValues
// -----------------------------------------------------------------------------
export const getValuesDecl = {
  name: "getValues",
  description: "Returns a 2D array of CellValue for all cells in the FRange."
};
async function getValuesFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const vals = rng.getValues();
    return { status: "ok", info: "2D array of cell values", values: vals };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 13) getCellDataGrid
// -----------------------------------------------------------------------------
export const getCellDataGridDecl = {
  name: "getCellDataGrid",
  description: "Returns a 2D array of ICellData for all cells in the FRange."
};
async function getCellDataGridFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const dataGrid = rng.getCellDataGrid();
    return { status: "ok", info: "2D array of cell data", dataGrid };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 14) getFormulas
// -----------------------------------------------------------------------------
export const getFormulasDecl = {
  name: "getFormulas",
  description:
    "Returns a 2D array of formula strings (or empty) in the FRange."
};
async function getFormulasFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const formulas = rng.getFormulas();
    return { status: "ok", info: "Formulas retrieved", formulas };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 15) getWrap
// -----------------------------------------------------------------------------
export const getWrapDecl = {
  name: "getWrap",
  description: "Checks if wrap is enabled (true) or disabled (false) for this FRange."
};
async function getWrapFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const isWrap = rng.getWrap();
    return { status: "ok", info: "Wrap retrieved", wrap: isWrap };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 16) getWrapStrategy
// -----------------------------------------------------------------------------
export const getWrapStrategyDecl = {
  name: "getWrapStrategy",
  description: "Returns the current WrapStrategy of this FRange."
};
async function getWrapStrategyFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const strategy = rng.getWrapStrategy();
    return {
      status: "ok",
      info: "Wrap strategy retrieved",
      wrapStrategy: strategy
    };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 17) getHorizontalAlignment
// -----------------------------------------------------------------------------
export const getHorizontalAlignmentDecl = {
  name: "getHorizontalAlignment",
  description:
    "Returns the horizontal alignment (string) of this FRange, e.g., 'left', 'center', or 'right'."
};
async function getHorizontalAlignmentFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const ha = rng.getHorizontalAlignment();
    return {
      status: "ok",
      info: "Horizontal alignment retrieved",
      horizontalAlignment: ha
    };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 18) getVerticalAlignment
// -----------------------------------------------------------------------------
export const getVerticalAlignmentDecl = {
  name: "getVerticalAlignment",
  description:
    "Returns the vertical alignment (string) of this FRange, e.g., 'top', 'middle', or 'bottom'."
};
async function getVerticalAlignmentFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const va = rng.getVerticalAlignment();
    return {
      status: "ok",
      info: "Vertical alignment retrieved",
      verticalAlignment: va
    };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 19) setBackgroundColor
// -----------------------------------------------------------------------------
export const setBackgroundColorDecl = {
  name: "setBackgroundColor",
  parameters: {
    type: "object",
    description: "Sets the background color for all cells in this FRange.",
    properties: {color: {type: "string",description: "CSS color notation (e.g. '#FF0000' or 'red'). Example: '#FF0000'"}},
    required: ["color"]
  }
};
async function setBackgroundColorFn(
  range: FRange | null | undefined,
  { color }: { color: string }
) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const res = await rng.setBackgroundColor(color);
    return { status: "ok", info: "Background color set", result: res };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}


// -----------------------------------------------------------------------------
// 21) setWrap
// -----------------------------------------------------------------------------
export const setWrapDecl = {
  name: "setWrap",
  parameters: {
    type: "object",
    description: "Enables or disables text wrapping for this FRange.",
    properties: {
      isWrapEnabled: {
        type: "boolean",
        description: "true to enable text wrap, false to disable."
      }
    },
    required: ["isWrapEnabled"]
  }
};
async function setWrapFn(
  range: FRange | null | undefined,
  { isWrapEnabled }: { isWrapEnabled: boolean }
) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const res = await rng.setWrap(isWrapEnabled);
    return { status: "ok", info: "Wrap set", result: res };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 22) setWrapStrategy
// -----------------------------------------------------------------------------
export const setWrapStrategyDecl = {
  name: "setWrapStrategy",
  parameters: {
    type: "object",
    description:
      "Sets the WrapStrategy for this FRange. Possible values include WRAP, CLIP, OVERFLOW, UNSPECIFIED.",
    properties: {
      strategy: {
        type: "string",
        enum: ["WRAP", "CLIP", "OVERFLOW", "UNSPECIFIED"],
        description: "WrapStrategy enum value. Example: 'WRAP'."
      }
    },
    required: ["strategy"]
  }
};
async function setWrapStrategyFn(
  range: FRange | null | undefined,
  strategy: WrapStrategy
) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const res = await rng.setWrapStrategy(strategy);
    return { status: "ok", info: "Wrap strategy set", result: res };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 23) setVerticalAlignment
// -----------------------------------------------------------------------------
export const setVerticalAlignmentDecl = {
  name: "setVerticalAlignment",
  parameters: {
    type: "object",
    description:
      "Sets the vertical alignment for this FRange. Possible values: top, middle, bottom.",
    properties: {
      alignment: {
        type: "string",
        enum: ["top", "middle", "bottom"],
        description: "Vertical alignment. Example: 'top'."
      }
    },
    required: ["alignment"]
  }
};
async function setVerticalAlignmentFn(
  range: FRange | null | undefined,
  { alignment }: { alignment: FVerticalAlignment }
) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const res = await rng.setVerticalAlignment(alignment);
    return { status: "ok", info: "Vertical alignment set", result: res };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 24) setHorizontalAlignment
// -----------------------------------------------------------------------------
export const setHorizontalAlignmentDecl = {
  name: "setHorizontalAlignment",
  parameters: {
    type: "object",
    description:
      "Sets the horizontal alignment for this FRange. Possible values: left, center, right.",
    properties: {
      alignment: {
        type: "string",
        enum: ["left", "center", "right"],
        description: "Horizontal alignment. Example: 'left'."
      }
    },
    required: ["alignment"]
  }
};
async function setHorizontalAlignmentFn(
  range: FRange | null | undefined,
  { alignment }: { alignment: FHorizontalAlignment }
) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const res = await rng.setHorizontalAlignment(alignment);
    return { status: "ok", info: "Horizontal alignment set", result: res };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 25) setValues
// -----------------------------------------------------------------------------
export const setValuesDecl = {
  name: "setValues",
  parameters: {
    type: "object",
    description:
      "Sets a 2D array of values or cell data (matching the FRange size). Provide JSON as a string.",
    properties: {
      value: {
        type: "string",
        description:
          "JSON string representing a 2D array of values or ICellData. Example: '[[\"Foo\", \"Bar\"],[\"Baz\", 123]]'."
      }
    },
    required: ["value"]
  }
};
async function setValuesFn(
  range: FRange | null | undefined,
  { value }: { value: any }
) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    let parsed;
    try {
      parsed = JSON.parse(value);
    } catch {
      parsed = value;
    }
    const res = await rng.setValues(parsed);
    return { status: "ok", info: "Values set in range", result: res };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 26) setFontWeight
// -----------------------------------------------------------------------------
export const setFontWeightDecl = {
  name: "setFontWeight",
  parameters: {
    type: "object",
    description:
      "Sets the font weight for this FRange. Possible values: normal, bold, null (reset).",
    properties: {
      fontWeight: {
        type: "string",
        enum: ["normal", "bold", "null"],
        description: "Font weight. Example: 'bold' or 'normal' or 'null'."
      }
    },
    required: ["fontWeight"]
  }
};
async function setFontWeightFn(
  range: FRange | null | undefined,
  { fontWeight }: { fontWeight: "normal" | "bold" | "null" | string }
) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  let typedWeight: any = fontWeight;
  if (fontWeight === "null") typedWeight = null;
  try {
    rng.setFontWeight(typedWeight);
    return {
      status: "ok",
      info: `Font weight set to ${fontWeight}`
    };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 27) setFontStyle
// -----------------------------------------------------------------------------
export const setFontStyleDecl = {
  name: "setFontStyle",
  parameters: {
    type: "object",
    description:
      "Sets the font style for this FRange. Possible values: italic, normal, null (reset).",
    properties: {
      fontStyle: {
        type: "string",
        enum: ["italic", "normal", "null"],
        description: "Font style. Example: 'italic' or 'normal' or 'null'."
      }
    },
    required: ["fontStyle"]
  }
};
async function setFontStyleFn(
  range: FRange | null | undefined,
  { fontStyle }: { fontStyle: "normal" | "italic" | "null" | string }
) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  let typedStyle: any = fontStyle;
  if (fontStyle === "null") typedStyle = null;
  try {
    rng.setFontStyle(typedStyle);
    return {
      status: "ok",
      info: `Font style set to ${fontStyle}`
    };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 28) setFontLine
// -----------------------------------------------------------------------------
export const setFontLineDecl = {
  name: "setFontLine",
  parameters: {
    type: "object",
    description:
      "Sets the font line for this FRange. Possible values: underline, line-through, none, null (reset).",
    properties: {
      fontLine: {
        type: "string",
        enum: ["underline", "line-through", "none", "null"],
        description:
          "Font line style. Example: 'underline', 'line-through', 'none', or 'null' to reset."
      }
    },
    required: ["fontLine"]
  }
};
async function setFontLineFn(
  range: FRange | null | undefined,
  { fontLine }: {
    fontLine: "underline" | "line-through" | "none" | "null" | string;
  }
) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  let typedLine: any = fontLine;
  if (fontLine === "null") typedLine = null;
  try {
    rng.setFontLine(typedLine);
    return {
      status: "ok",
      info: `Font line set to ${fontLine}`
    };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 29) setFontFamily
// -----------------------------------------------------------------------------
export const setFontFamilyDecl = {
  name: "setFontFamily",
  parameters: {
    type: "object",
    description:
      "Sets the font family (e.g. 'Arial') for this FRange. Pass null (as string 'null') to reset.",
    properties: {
      fontFamily: {
        type: "string",
        description:
          "Font family, e.g. 'Arial'. Use 'null' (string) to reset. Example: 'Arial' or 'null'."
      }
    },
    required: ["fontFamily"]
  }
};
async function setFontFamilyFn(
  range: FRange | null | undefined,
  { fontFamily }: { fontFamily: string | null }
) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    let val: any = fontFamily;
    if (fontFamily === "null") val = null;
    rng.setFontFamily(val);
    return {
      status: "ok",
      info: `Font family set to ${fontFamily}`
    };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 30) setFontSize
// -----------------------------------------------------------------------------
export const setFontSizeDecl = {
  name: "setFontSize",
  parameters: {
    type: "object",
    description:
      "Sets the font size in points for this FRange. Pass null (as string 'null') to reset.",
    properties: {
      size: {
        type: "integer",
        description:
          "Font size in points, e.g. 12. Use 'null' (string) to reset. Example: 12"
      }
    },
    required: ["size"]
  }
};
async function setFontSizeFn(
  range: FRange | null | undefined,
  { size }: { size: number | null }
) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    rng.setFontSize(size);
    return {
      status: "ok",
      info: `Font size set to ${size}`
    };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 31) setFontColor
// -----------------------------------------------------------------------------
export const setFontColorDecl = {
  name: "setFontColor",
  parameters: {
    type: "object",
    description:
      "Sets the font color (CSS notation, e.g. '#FFFFFF') for this FRange. Pass null (as string 'null') to reset.",
    properties: {
      color: {
        type: "string",
        description:
          "Color in CSS notation. Example: '#000000' or 'null' to reset."
      }
    },
    required: ["color"]
  }
};
async function setFontColorFn(
  range: FRange | null | undefined,
  { color }: { color: string | null }
) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    let val: any = color;
    if (color === "null") val = null;
    rng.setFontColor(val);
    return {
      status: "ok",
      info: `Font color set to ${color}`
    };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 32) merge
// -----------------------------------------------------------------------------
export const mergeDecl = {
  name: "merge",
  description: "Merges all cells in this FRange into one merged cell."
};
async function mergeFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    await rng.merge();
    return { status: "ok", info: "Cells merged" };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 33) mergeAcross
// -----------------------------------------------------------------------------
export const mergeAcrossDecl = {
  name: "mergeAcross",
  description:
    "Merges the cells in this FRange horizontally (by rows) into merged cells."
};
async function mergeAcrossFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    await rng.mergeAcross();
    return { status: "ok", info: "Cells merged horizontally" };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 34) mergeVertically
// -----------------------------------------------------------------------------
export const mergeVerticallyDecl = {
  name: "mergeVertically",
  description:
    "Merges the cells in this FRange vertically (by columns) into merged cells."
};
async function mergeVerticallyFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    await rng.mergeVertically();
    return { status: "ok", info: "Cells merged vertically" };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 35) isPartOfMerge
// -----------------------------------------------------------------------------
export const isPartOfMergeDecl = {
  name: "isPartOfMerge",
  description:
    "Checks if this FRange overlaps any merged cell region within the worksheet."
};
async function isPartOfMergeFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    const part = rng.isPartOfMerge();
    return { status: "ok", info: "isPartOfMerge result", partOfMerge: part };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 36) breakApart
// -----------------------------------------------------------------------------
export const breakApartDecl = {
  name: "breakApart",
  description: "Unmerges cells in this FRange if they are currently merged."
};
async function breakApartFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    rng.breakApart();
    return { status: "ok", info: "Cells unmerged" };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}

// -----------------------------------------------------------------------------
// 37) forEach
// -----------------------------------------------------------------------------
export const forEachDecl = {
  name: "forEach",
  description:
    "Iterates over each cell in this FRange, including merged expansions. Invokes a callback (placeholder)."
};
async function forEachFn(range: FRange | null | undefined) {
  const rng = range;
  if (!rng) return { status: "fail", info: "No active FRange" };
  try {
    let count = 0;
    rng.forEach((row: number, col: number, cell: any) => {
      // Example placeholder for user-defined logic
      count++;
    });
    return { status: "ok", info: `forEach invoked on ${count} cells` };
  } catch (e) {
    return { status: "error", info: String(e) };
  }
}



/* ---------------------------------------------------------------------------
 * Combine Declarations + Implementations 
 * --------------------------------------------------------------------------- */
export const rangeFunctionDeclarations: FunctionDeclaration[] = [
  getUnitIdDecl,
  getSheetNameDecl,
  getRangeDecl,
  getRowDecl,
  getColumnDecl,
  getWidthDecl,
  getHeightDecl,
  getCellDataDecl,
  isMergedDecl,
  getCellStyleDataDecl,
  getValueDecl,
  getValuesDecl,
  getCellDataGridDecl,
  getFormulasDecl,
  getWrapDecl,
  getWrapStrategyDecl,
  getHorizontalAlignmentDecl,
  getVerticalAlignmentDecl,
  setBackgroundColorDecl,
  setWrapDecl,
  setWrapStrategyDecl,
  setVerticalAlignmentDecl,
  setHorizontalAlignmentDecl,
  setValuesDecl,
  setFontWeightDecl,
  setFontStyleDecl,
  setFontLineDecl,
  setFontFamilyDecl,
  setFontSizeDecl,
  setFontColorDecl,
  mergeDecl,
  mergeAcrossDecl,
  mergeVerticallyDecl,
  isPartOfMergeDecl,
  breakApartDecl,
  forEachDecl,
]  as FunctionDeclaration[];
  
export const rangeFunctions = {
  getUnitId: getUnitIdFn,
  getSheetName: getSheetNameFn,
  getRange: getRangeFn,
  getRow: getRowFn,
  getColumn: getColumnFn,
  getWidth: getWidthFn,
  getHeight: getHeightFn,
  getCellData: getCellDataFn,
  isMerged: isMergedFn,
  getCellStyleData: getCellStyleDataFn,
  getValue: getValueFn,
  getValues: getValuesFn,
  getCellDataGrid: getCellDataGridFn,
  getFormulas: getFormulasFn,
  getWrap: getWrapFn,
  getWrapStrategy: getWrapStrategyFn,
  getHorizontalAlignment: getHorizontalAlignmentFn,
  getVerticalAlignment: getVerticalAlignmentFn,
  setBackgroundColor: setBackgroundColorFn,
  setWrap: setWrapFn,
  setWrapStrategy: setWrapStrategyFn,
  setVerticalAlignment: setVerticalAlignmentFn,
  setHorizontalAlignment: setHorizontalAlignmentFn,
  setValues: setValuesFn,
  setFontWeight: setFontWeightFn,
  setFontStyle: setFontStyleFn,
  setFontLine: setFontLineFn,
  setFontFamily: setFontFamilyFn,
  setFontSize: setFontSizeFn,
  setFontColor: setFontColorFn,
  merge: mergeFn,
  mergeAcross: mergeAcrossFn,
  mergeVertically: mergeVerticallyFn,
  isPartOfMerge: isPartOfMergeFn,
  breakApart: breakApartFn,
  forEach: forEachFn,
};
