import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai"

// Define the LLM interface
interface LLM {
    input: string,
}

export default class Gemini implements LLM {
    private _input: string
    private _systemInstruction: string
    private _generationConfig: {}
    private _metaPrompt: string
    private _cachedContext: string

    constructor() {
        this._cachedContext = ""
        this._input = "Create a detailed timeline for a period of 2 years for me to become an insane fullstack developer as a beginner in programming."
        this._systemInstruction = `You are a helpful assistant.`
        this._generationConfig = {
            maxOutputTokens: 8192
        }
        this._metaPrompt = this.generatemetaPrompt()
    }

    get input(): string {
        return this._input
    }

    set input(input: string) {
        this._input = input
    }

    get systemInstruction(): string {
        return this._systemInstruction
    }

    set systemInstruction(systemInstruction: string) {
        this._systemInstruction = systemInstruction
    }

    get generationConfig(): {} {
        return this._generationConfig
    }

    set generationConfig(generationConfig: {}) {
        this._generationConfig = generationConfig
    }

    get cachedContext(): string {
        return this._cachedContext
    }

    set cachedContext(cachedContext: string) {
        this._cachedContext = cachedContext
        this._metaPrompt = this.generatemetaPrompt()
    }

    get metaPrompt(): string {
        return this._metaPrompt
    }

    /**
     * Generates the main meta prompt based on the current cached context.
     */
    private generatemetaPrompt(): string {
        return `
        You are an **advanced AI agent** capable of autonomously managing and transforming spreadsheet data represented in a structured **JSON format**. 
        Your role is to interpret the user's requests and accurately and return normal conversation with the user, only then return the **precise JSON outputs** to update or transform the spreadsheet. 
        The JSON outputs will be parsed and applied directly to the spreadsheet without further checks, so accuracy and structure are critical.
        
        ---
        ---
        
        ### **Your Capabilities**:
        You can perform any operations on the spreadsheet by manipulating the JSON structure, including but not limited to:
        1. **Data Editing**:
           - Modify specific cells, rows, or columns.
           - Add or delete data in specific ranges without affecting unrelated parts.
           - Rearrange the order of the values in the table by changing the array, shifting the order when the user requests add/remove columns or rows or cells.
        
        2. **Structural Changes**:
           - Add new rows, columns, or even entire tables.
           - Insert new columns at specific positions within existing tables.
           - Ensure no overlapping or duplication of row/column indices.
        
        3. **Data Transformation**:
           - Clean or process data, such as splitting combined values.
           - Merge data from multiple columns into one.
           - Perform calculations or transformations based on the user's instructions.
        
        4. **Table Management**:
           - Rename tables.
           - Adjust table bounds to encompass new or modified data.
        
        ---
        
        ### **Rules for Generating JSON Output**:
        1. **Precision**:
           - Always return **only the relevant parts** of the JSON structure:
             - If modifying a single cell, return only the specific 'rows' and the affected 'columns' within that row.
             - If adding a new table, return the **entire table structure**.
             - If transforming a range (e.g., splitting a column), recreate the affected rows and columns only.
        
        2. **Index Consistency**:
           - Each array belong to the rows key is essentially a row in the table with the length of it representing the number of columns of that table.
           - If new rows/columns are added, ensure they do not interfere with existing indices and they do affect the related indices (especially in case adding or removing rows/columns).
        
        3. **Data Integrity**:
           - Use the provided _cachedContext as your context.
           - Carefully handle **dependencies**: For example, if a transformation impacts other rows or columns, such as changing the index of which the same value belong to, you must include the affected values in your response.
        
        4. **Minimized Output**:
           - To save tokens and computation time, only include the specific 'tables', 'rows', or 'cells' relevant to the task.        
        ---
        
        ### **Handling Empty Cells**:
        In the 'rows' array, cells with empty strings ("") are allowed and represent unpopulated cells. Ensure that these are preserved in the JSON output. For example, when adding a new column, insert empty strings ("") in all existing rows for that column (or index of the row array, both are correct).
        
        ---
        
        ### **Final Notes**:
        - **Preserve empty cells** ("") in the 'rows' array to maintain the table structure.
        - **Avoid overlapping tableBounds** to prevent data conflicts.
        - **Do not modify unrelated parts** of the sheet and always opt to modify the related parts (in special cases like adding columns/rows/cells) to ensure data integrity.
        - **Respond with valid and minimal JSON output** that aligns with the provided structure, including only the necessary parts relevant to the task.
        
        Your output will be parsed directly into the spreadsheet, so **precision and integrity are critical**.

                ---
        
        ### **Current Sheet Context**:
        Below is the current sheet data you must work on (referred to as \`_cachedContext\`):
        
        \`\`\`json
        ${this._cachedContext}
        \`\`\`
        
        The \`_cachedContext\` variable represents the existing data and structure of the sheet. Any updates, edits, or new data must take this context into account.
        
        ---
        \n\n
        `
    };

    /**
     * Sends a prompt to the LLM and retrieves the response.
     *
     * @param text - The instruction or query to append to the meta prompt.
     * @param systemInstruction - (Optional) System-level instructions.
     * @param generationConfig - (Optional) Configuration for the generation.
     * @returns The LLM's response as a string.
     */
    async reply(text: string = this._input, systemInstruction = this._systemInstruction, generationConfig = this._generationConfig): Promise<string>{
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp		", 
                                              systemInstruction: systemInstruction,
                                              generationConfig: this._generationConfig});        
      const prompt = this._metaPrompt + text
      console.log(`User: ${prompt}`)
      const result = await model.generateContent(prompt);
      return result.response.text()
    }

    /**
     * Handles the creation of new spreadsheet data based on user instructions.
     *
     * @param userCreationInstructions - The user's instructions for creating new data.
     * @returns A JSON string representing the newly added data.
     */
    async requestCreate(userCreationInstructions: string): Promise<string> {
        const creationInstructions: string = `
        
### Instructions:
The user has provided the following instructions for adding new data:
"${userCreationInstructions}"

---
        
### Rules:
1. **Adding New Data**:
   - If adding new rows, columns, or tables:
     - Ensure the new indices (row and column keys) do not overlap with existing data.
     - If creating a new table, include a **tableName** and valid \`tableBounds\`.
2. **JSON Structure Compliance**:
   - Maintain the correct **JSON structure** as defined in the main meta prompt.
   - Return only the **newly added data** in the JSON output.
3. **Data Isolation**:
   - Do not include any unrelated data or modify existing data unintentionally.
4. **Index Management**:
   - Carefully consider row and column indices:
     - Ensure consistency with the existing structure.
     - Modify the order of arrays when adding or removing rows/columns to maintain data integrity.   
        `;

        const creationResponse = await this.reply(creationInstructions);
        return creationResponse;
    }

    /**
     * Handles the editing of existing spreadsheet data based on user instructions.
     *
     * @param userEditInstructions - The user's instructions for editing data.
     * @param selectedContext - The JSON context representing the part of the sheet to be edited.
     * @returns A JSON string representing the edited data.
     */
    async requestEdit(
      userEditInstructions: string,
      selectedContext: string,
      selectedTableNames: string[]
    ): Promise<string> {
      // Join the selected table names into a comma-separated string
      const tablesList = selectedTableNames.join(", ");
    
      // Construct the edit instructions prompt with the new parameter

      const editInstructions: string = `
    ### Instructions:
    For now, the user will ask you to edit some specific tasks in the spreadsheet based on the data the user has selected.

    The user has provided the following editing instructions:
    "${userEditInstructions}"
            
    ---
    ### Selected Tables:
    The tables selected for editing are: ${tablesList}.
            
    ### Selected Context:
    The following JSON represents the specific part of the sheet that needs editing:
    \`\`\`json
    ${selectedContext}
    \`\`\`
            
    ### Rules:
    1. **Targeted Modifications**:
        - Project the selected part with the context of the same table (use tableName of them) and retrieve all the related data/rows/columns to make modification better.
        - Only modify the specific rows, columns, or cells relevant to the instructions.
        - Do not include unrelated parts of the sheet.
        - **Focus exclusively on the tables listed above.**
        - Only return the modified selected part. There's no need to return the entire table structure, as it is not necessary.
    2. **JSON Structure Compliance**:
        - Maintain the correct **JSON structure** as defined in the selected Context. Along with normal conversation with user.
        - The response should include only the modified rows, columns, or cells.
    3. **Data Isolation**:
        - Do not overwrite or include data that was not mentioned in the instructions.
    4. **Index Management**:
        - Ensure that row and column indices are consistent with the selected context.
        - Adjust indices appropriately if rows/columns are added or removed.
    5. ***IMPORTANT***:
        - For the response, copy 'tableName', 'rangeBounds' from the selected part that the user chooses.
        - Copy the key selectedRowsInTable with values that you have modified.
        - **Ensure that all modifications are confined to the specified tables: ${tablesList}.**
                      
    `;
  
      // Send the prompt to the LLM and retrieve the response
      const editResponse = await this.reply(editInstructions);
    
      return editResponse;
    }
  }
