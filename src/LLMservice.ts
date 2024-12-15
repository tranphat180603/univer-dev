import { GoogleGenerativeAI, SchemaType  } from "@google/generative-ai"

  
// Make sure to include these imports:
// import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const schema = {
    type: SchemaType.OBJECT,
    properties: {
      tables: {
        description: "All the tables in the context of a spreadsheet",
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            tableName: {
              type: SchemaType.STRING,
              description: "The name of the table",
              nullable: false,
            },
            headers: {
              type: SchemaType.ARRAY,
              description: "An array of column headers",
              items: {
                type: SchemaType.STRING,
                description: "A column header",
                nullable: false,
              },
              nullable: false,
            },
            rows: {
              type: SchemaType.ARRAY,
              description: "An array of row objects, or null entries, each containing a columns array",
              items: {
                // Allow items to be either an object with columns or null
                type: SchemaType.OBJECT,
                description: "A single row object or null",
                properties: {
                  columns: {
                    type: SchemaType.ARRAY,
                    description: "Array of cell values in this row",
                    items: {
                      type: SchemaType.STRING,
                      description: "A cell value in this row",
                      nullable: false,
                    },
                    nullable: false,
                  },
                },
                required: ["columns"],
                nullable: true, // <-- This allows the item to be null as well
              },
              nullable: false,
            },
            tableBounds: {
              type: SchemaType.OBJECT,
              description: "An object containing the table bounds",
              properties: {
                left: {
                  type: SchemaType.STRING,
                  description: "The left bound (starting column index as a string)",
                  nullable: false,
                },
                top: {
                  type: SchemaType.STRING,
                  description: "The top bound (starting row index as a string)",
                  nullable: false,
                },
                right: {
                  type: SchemaType.STRING,
                  description: "The right bound (ending column index as a string)",
                  nullable: false,
                },
                bottom: {
                  type: SchemaType.STRING,
                  description: "The bottom bound (ending row index as a string)",
                  nullable: false,
                },
              },
              required: ["left", "top", "right", "bottom"],
              nullable: false,
            },
          },
          required: ["tableName", "headers", "rows", "tableBounds"],
        },
      },
    },
    required: ["tables"]
  };
  

interface LLM{
    input: string,
}

export default class Gemini implements LLM{
    private _input: string

    constructor(){
        this._input  = ""
    }

    get input():string{
        return this._input
    }
    
    set input(input: string){
        this._input = input
    }

    async reply(text: string = this._input): Promise<string>{
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro", 
                                                systemInstruction: `You are a helpful assistant who helps user on every tasks related to working on a spreadsheet.`,
                                                generationConfig: {
                                                    responseMimeType: "application/json",
                                                    responseSchema: schema
                                                }});        
        const result = await model.generateContent(text);
        console.log(result)
        return result.response.text()
    }
}

// const claude = new Claude()

// const response = claude.reply("Tell me a funny joke about Elon Musk")
// console.log(`Response: ${response}`)
