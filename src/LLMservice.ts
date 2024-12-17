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

    constructor(){
        this._input  = "Create a detailed timeline for a period of 2 years for me to become an insane fullstack developer as a beginner in programming."
        this._systemInstruction = `You are a helpful assistant who helps user on every tasks related to working on a spreadsheet.`
        this._generationConfig = {
          
        }
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

    async reply(text: string = this._input, systemInstruction = this._systemInstruction , generationConfig = this._generationConfig): Promise<string>{
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp", 
                                                systemInstruction: systemInstruction,
                                                generationConfig: {
                                                  maxOutputTokens: 8192
                                                }});        
        const result = await model.generateContent(text);
        return result.response.text()
    }

    // Request New Spreadsheet Creation Function
    async requestNewSpreadsheetFromLLM(userCreationInstructions: string, fullSheetJSON: string, feedback: string = ""): Promise<string> {
      let creationPrompt: string = ""
      if (!feedback){
        creationPrompt = `
        You are an AI assistant specialized in creating spreadsheet data structures. The spreadsheet data is represented in JSON format with the following schema:
        {
          "tables": [
            {
              "tableName": "string",
              "rows": {
                "row_index": {
                  "col_index": { "v": "Value" }
                }
              }
            }
          ]
        }
        ---
    
        ### **Important Guidelines:**
        1. **Unique Row and Column Indices:**
          - For each table, row and column indices inside the "rows" object must be unique across all tables.
          - Increment the indices systematically so that rows and columns for one table do not conflict with another table's indices.
            - For example:
              - Table 1 rows: "0", "1", "2", columns: "0", "1", "2".
              - Table 2 rows: "10", "11", "12", columns: "10", "11", "12".
          - Leave sufficient gaps (e.g., increment by 10) to ensure no overlap.
    
        2. **Systematic Layout:*
          - Increment row and column indices proportionally for new tables to avoid reuse.
          - Example positioning for multiple tables:
            - **Table 1**: Rows: "0", "1", "2", Columns: "0", "1", "2".
            - **Table 2**: Rows: "10", "11", "12", Columns: "10", "11", "12".
            - **Table 3**: Rows: "20", "21", "22", Columns: "20", "21", "22".
    
        ---
    
        ### **Example Output:**
        \`\`\`json
        {
          "tables": [
            {
              "tableName": "Project Timeline",
              "rows": {
                "0": { "0": { "v": "Phase" }, "1": { "v": "Task" } },
                "1": { "0": { "v": "1" }, "1": { "v": "Setup" } }
              },
        \      },
            {
              "tableName": "Budget Overview",
              "rows": {
                "10": { "10": { "v": "Item" }, "11": { "v": "Cost" } },
                "11": { "10": { "v": "Materials" }, "11": { "v": "1000" } }
              },
        \      }
          ]
        }
        ### **Task:**
        Based on the instructions below, create one or more tables with the following requirements:
        - Row and column indices inside the "rows" object must be **completely unique** across all tables.
        - Increment indices systematically to avoid overlap (e.g., by 10 or more per table).
        - Ensure the output strictly follows the JSON schema provided above.
    
        **Instructions:**  
        ${userCreationInstructions}
    
        **Output:**
        Provide the complete JSON structure adhering strictly to the schema above. Do not include any additional text or explanations. Focus solely on the 'v' field within each cell.
          `;    
      }
      else{
        //paste the prompt with feedback here
        creationPrompt = `
        
        `
      }
    const creationResponse = await this.reply(creationPrompt);
    return creationResponse
    }

    async requestEditFromLLM(userEditInstructions: string, fullSheetJSON: string, feedback: string = ""): Promise<string>{
      let meta_prompt: string = ""
      if(!feedback){
        meta_prompt = `
        You are an AI assistant specialized in managing and modifying spreadsheet data represented in JSON format. The JSON structure encapsulates the entire spreadsheet, organized into tables with defined headers, rows, and boundaries. Your task is to accurately modify the spreadsheet based on the user's instructions while preserving the original structure and order.
    
        ### **Spreadsheet JSON Structure:**
        {
          "tables": [
            {
              "rows": {
                "0": { "0": { "v": "Value1" }, "1": { "v": "Value2" }, ... },
                "1": { "0": { "v": "Value1" }, "1": { "v": "Value2" }, ... },
                ...
              },
              "tableBounds": {
                "left": "0",
                "top": "0",
                "right": "N",   // N is the maximum column index as a string
                "bottom": "M"   // M is the maximum row index as a string
              }
            }
          ]
        }
    
        **Important Guidelines:**
    
        1. **Preserve Structure and Order:**
          - **Order of Tables:** Maintain the sequence of tables as they appear.
          - **Order of Rows and Columns:** Keep rows and columns in their original order. Do not rearrange or reorder them unless explicitly instructed.
          - **Empty Rows/Columns:** Retain empty rows and columns ("v": "" values) to preserve the spreadsheet's layout and order.
          - **Response structure:** When you response to user about making their changes, you only need to output the rows that have been modified and are different than before. No need to return the initial data structure if not neccessary.
    
        2. **Consistent Column Counts:**
          - Ensure that the number of columns in each row matches the "right" bound minus the "left" bound plus one. If a row has fewer columns, fill the remaining cells with empty strings ("").
    
        3. **Table Bounds:**
          - Accurately update the 'tableBounds' if rows or columns are added or removed, ensuring that 'left', 'top', 'right', and 'bottom' correctly reflect the table's new dimensions.
    
        4. **No Additional Commentary:**
          - Only return the updated JSON structure without any extra explanations or comments.
    
        ### **User Instructions:**
    
        **Task:** ${userEditInstructions}
    
        **Current Spreadsheet Data:**
        ${fullSheetJSON}
    
        **Instructions:**
        - Analyze the user's task and determine how to modify the provided JSON data to fulfill the request.
        - Make sure to preserve the table's structure, order, and any empty rows or columns.
        - Only modify the parts of the spreadsheet as per the user's instructions.
        - Ensure the final JSON adheres to the defined schema and guidelines.
    
        **Output:**
        - Provide the updated spreadsheet data in JSON format as per the structure defined above.
        - Do not include any additional text or explanations—only return the JSON.
        `;
      }
      else{
        //prompt with feedback
        meta_prompt = ""
      }

      const LLMresponse = await this.reply(meta_prompt);
      return LLMresponse
    }
}

// const claude = new Claude()

// const response = claude.reply("Tell me a funny joke about Elon Musk")
// console.log(`Response: ${response}`)
