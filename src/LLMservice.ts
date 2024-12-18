import { GoogleGenerativeAI, SchemaType  } from "@google/generative-ai"

  
// Make sure to include these imports:
// import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

interface LLM{
    input: string,
}

export default class Gemini implements LLM{
    private _input: string
    private _systemInstruction: string
    private _generationConfig: {}
    private _metaPrompt: string
    private _cachedContext: string

    constructor(){
        this._cachedContext = ""
        this._input  = "Create a detailed timeline for a period of 2 years for me to become an insane fullstack developer as a beginner in programming."
        this._systemInstruction = `You are a helpful assistant who helps user on every tasks related to working on a spreadsheet.`
        this._generationConfig = {
          maxOutputTokens: 8192
        }
        this._metaPrompt = `
        You are an **advanced AI agent** capable of autonomously managing and transforming spreadsheet data represented in a structured **JSON format**. Your role is to interpret the user's requests accurately and return **precise JSON outputs** to update or transform the spreadsheet. The JSON outputs will be parsed and applied directly to the spreadsheet without further checks, so accuracy and structure are critical.
        
        ---
        
        ### **Context and JSON Structure**:
        The spreadsheet data is provided in a **JSON structure** as follows:
        
        \`\`\`json
        {
          "tables": [
            {
              "tableName": "string",
              "rows": {
                "rowIndex": {
                  "columnIndex": {
                    "v": "value"
                  }
                }
              },
              "tableBounds": {
                "left": "number",
                "top": "number",
                "right": "number",
                "bottom": "number"
              }
            }
          ],
          "standaloneValues": {}
        }
        \`\`\`
        
        ### **Current Sheet Context**:
        Below is the current sheet data you must work on (referred to as \`_cachedContext\`):
        
        \`\`\`json
        ${this._cachedContext}
        \`\`\`
        
        The \`_cachedContext\` variable represents the existing data and structure of the sheet. Any updates, edits, or new data must take this context into account. You **must not overwrite unrelated data** in the existing sheet.
        
        ---
        
        ### **Your Capabilities**:
        You can perform any operations on the spreadsheet, including but not limited to:
        1. **Data Editing**:
           - Modify specific cells, rows, or columns.
           - Add or delete data in specific ranges without affecting unrelated parts.
        
        2. **Structural Changes**:
           - Add new rows, columns, or even tables.
           - Ensure no overlapping or duplication of row/column indices.
        
        3. **Data Transformation**:
           - Clean or process data, such as splitting combined values (e.g., separating "City, Country" into two columns).
           - Perform calculations or transformations based on the user's instructions.
        
        ---
        
        ### **Rules for Generating JSON Output**:
        1. **Precision**:
           - Always return **only the relevant parts** of the JSON structure:
             - If modifying a single cell, return that specific \`row\` and \`column\` only.
             - If adding a new table, return the **entire table structure**.
             - If transforming a range (e.g., splitting a column), recreate the affected rows and columns only.
        
        2. **Index Consistency**:
           - Row and column indices must match the existing structure.
           - If new rows/columns are added, ensure they do not interfere with existing indices.
           - **Table bounds (\`tableBounds\`) must never overlap** with other tables.
        
        3. **Data Integrity**:
           - Use the provided \`_cachedContext\` as your context.
           - Do not overwrite or modify unrelated rows, columns, or tables.
           - Carefully handle **dependencies**: For example, if a transformation impacts other rows or columns, include all affected parts in the JSON response.
        
        4. **Minimized Output**:
           - To save tokens and computation time, only include the specific \`tables\`, \`rows\`, or \`cells\` relevant to the task.
        
        ---
        
        ### **How to Respond**:
        Always return a **valid JSON structure** that aligns with the format provided. Your response must include only the necessary parts of the table. 
        
        ---
        
        ### **Examples**:
        
        **User Request**: "Create two new tables: one for managing employees and one for customers."
        
        **Response**:
        \`\`\`json
        {
          "tables": [
            {
              "tableName": "Employee Data",
              "rows": {
                "5": {
                  "0": { "v": "ID" },
                  "1": { "v": "Name" },
                  "2": { "v": "Position" }
                },
                "6": {
                  "0": { "v": "1" },
                  "1": { "v": "Alice" },
                  "2": { "v": "Manager" }
                }
              },
              "tableBounds": { "left": "0", "top": "5", "right": "2", "bottom": "6" }
            },
            {
              "tableName": "Customer Data",
              "rows": {
                "10": {
                  "0": { "v": "Customer ID" },
                  "1": { "v": "Name" },
                  "2": { "v": "Email" }
                },
                "11": {
                  "0": { "v": "1" },
                  "1": { "v": "Bob" },
                  "2": { "v": "bob@example.com" }
                }
              },
              "tableBounds": { "left": "0", "top": "10", "right": "2", "bottom": "11" }
            }
          ]
        }
        \`\`\`
        
        ---
        
        #### **Bad Example: Overlapping Table Bounds**
        The AI uses overlapping rows for two tables, leading to data conflicts.
        
        \`\`\`json
        {
          "tables": [
            {
              "tableName": "Employee Data",
              "rows": {
                "0": { "0": { "v": "ID" }, "1": { "v": "Name" }, "2": { "v": "Position" } }
              },
              "tableBounds": { "left": "0", "top": "0", "right": "2", "bottom": "0" }
            },
            {
              "tableName": "Customer Data",
              "rows": {
                "0": { "0": { "v": "ID" }, "1": { "v": "Name" }, "2": { "v": "Email" } }
              },
              "tableBounds": { "left": "0", "top": "0", "right": "2", "bottom": "0" }
            }
          ]
        }
        \`\`\`
        
        **Mistake**: Both tables overlap at the same tableBounds (top: 0, bottom: 0).
        
        ---
        
        ### **Final Notes**:
        - Avoid overlapping tableBounds.
        - Never modify unrelated parts of the sheet.
        - Always respond with **valid and minimal JSON output** that aligns with the provided structure.
        
        Your output will be parsed directly into the spreadsheet, so precision and integrity are critical.
        \n\n
        `;
        
    }

    get input():string{
        return this._input
    }
    
    set input(input: string){
        this._input = input
    }

    get systemInstruction():string {
      return this.systemInstruction
    }

    set systemInstruction(systemInstruction: string){
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

    set cachedContext(cachedContext: string){
      this._cachedContext = cachedContext
    }

    async reply(text: string = this._input, systemInstruction = this._systemInstruction, generationConfig = this._generationConfig): Promise<string>{
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-001", 
                                                systemInstruction: systemInstruction,
                                                generationConfig: this._generationConfig});        
        const prompt = this._metaPrompt + text
        const result = await model.generateContent(prompt);
        return result.response.text()
    }

    // Request New Spreadsheet Creation Function
    async requestCreate(userCreationInstructions: string): Promise<string> {
      const meta_prompt: string = `
    
    ### Instructions:
    The user has provided the following instructions for adding new data:
    "${userCreationInstructions}"
    
    ---
    
    ### Rules:
    1. If adding new rows, columns, or tables:
       - Ensure the new indices (row and column keys) do not overlap with existing data.
       - If creating a new table, include a **tableName** and valid \`tableBounds\`.
    2. Maintain the correct **JSON structure**:
       - Use the same format as the existing spreadsheet.
       - Return only the **newly added data** in the JSON output.
    3. Do not include any unrelated data or modify existing data unintentionally.
    
    ### Example Response:
    If adding a new row:
    \`\`\`json
    {
      "tables": [
        {
          "rows": {
            "8": {
              "0": { "v": "New Row Value 1" },
              "1": { "v": "New Row Value 2" }
            }
          }
        }
      ]
    }
    \`\`\`
    
    If creating a new table:
    \`\`\`json
    {
      "tables": [
        {
          "tableName": "New Table",
          "rows": {
            "0": {
              "0": { "v": "Header 1" },
              "1": { "v": "Header 2" }
            },
            "1": {
              "0": { "v": "Row 1 Value 1" },
              "1": { "v": "Row 1 Value 2" }
            }
          },
          "tableBounds": {
            "left": "0",
            "top": "0",
            "right": "1",
            "bottom": "1"
          }
        }
      ]
    }
    \`\`\`
    
    Respond with a **valid JSON** output that includes the newly added data.
    `;
    
      const creationResponse = await this.reply(meta_prompt);
      return creationResponse;
    }
  

    async requestEdit(userEditInstructions: string, selectedContext: string): Promise<string> {
      const meta_prompt: string = `
    
    ### Selected Context:
    The following JSON represents the part of the sheet that needs editing:
    \`\`\`json
    ${selectedContext}
    \`\`\`
    
    ### Instructions:
    The user has provided the following editing instructions:
    "${userEditInstructions}"
    
    ---
    
    ### Rules:
    1. Only modify the specific rows, columns, or cells relevant to the instructions. Do not include unrelated parts of the sheet.
    2. Maintain the correct **JSON structure**:
       - The response should include only the modified rows, columns, or cells.
       - Row and column indices must be consistent with the selected context.
    3. Do not overwrite or include data that was not mentioned in the instructions.
    
    ### Example Response:
    If the user asks to fix or modify a single cell:
    \`\`\`json
    {
      "tables": [
        {
          "rows": {
            "2": {
              "3": { "v": "Updated Value" }
            }
          }
        }
      ]
    }
    \`\`\`
    
    If a range of rows/columns is updated:
    \`\`\`json
    {
      "tables": [
        {
          "rows": {
            "4": {
              "2": { "v": "New City" },
              "3": { "v": "New Country" }
            },
            "5": {
              "2": { "v": "City A" },
              "3": { "v": "Country B" }
            }
          }
        }
      ]
    }
    \`\`\`
    
    Respond with a **valid JSON** output that reflects the user's instructions and modifies only the provided context.
    
    ### Your Output:
    `;
    
      const LLMresponse = await this.reply(meta_prompt);
      return LLMresponse;
    }
    
}

// const claude = new Claude()

// const response = claude.reply("Tell me a funny joke about Elon Musk")
// console.log(`Response: ${response}`)
