import { FunctionCallingMode, GoogleGenerativeAI, Tool } from "@google/generative-ai";
import { Tools } from "@univerjs/core";
export default class Gemini{
    constructor() {
    }

    async reply(prompt: string, systemInstruction: string, generationConfig: {} = {maxOutputTokens: 8192}) {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            systemInstruction: systemInstruction,
            generationConfig: generationConfig,
        })
        return (await model.generateContent(prompt)).response.text();
    }

    async replyWithFuncs(prompt: string, tools: Tool[] ,systemInstruction: string, generationConfig: {} = {maxOutputTokens: 8192}){
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-pro",
            tools: tools,
            systemInstruction: systemInstruction,
            generationConfig: generationConfig,
            toolConfig: {
                functionCallingConfig: {
                    mode: FunctionCallingMode.ANY,
                }
            }
        })
        let chat = model.startChat();
        let response = await chat.sendMessage(prompt);
        return response
    }
}

