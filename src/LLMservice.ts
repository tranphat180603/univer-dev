import Anthropic from "@anthropic-ai/sdk";
import Sheet from "./getSheetData";


interface LLM{
    input: string,
}

export default class Claude implements LLM{
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

    async reply(text: string = this._input): Promise<Anthropic.Messages.Message>{
        const anthropic = new Anthropic();

        const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 500,
        temperature: 0,
        system: "You are a helpful assistant that will help users with spreadsheet tasks such as: reading data, recognize data relations, etc.",
        messages: [
            {
            "role": "user",
            "content": [
                {
                "type": "text",
                "text": text
                }
            ]
            }
        ]
        });
        return msg
    }
}

