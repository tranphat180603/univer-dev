import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai"

// import Sheet from "./getSheetData";

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
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", 
                                                systemInstruction: `You are a helpful assistant who helps user on every tasks related to working on a spreadsheet.
                                                Your job is to complete the command that the user's ask. Basically by responding in valid JSON format and follow
                                                the data structure on the user's spreadsheet.` });        
        const result = await model.generateContent(text);
        console.log(result)
        return result.response.text()
    }
}

// const claude = new Claude()

// const response = claude.reply("Tell me a funny joke about Elon Musk")
// console.log(`Response: ${response}`)
