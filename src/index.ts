const process = require("process")
const qrcode = require("qrcode-terminal");
const { Client } = require("whatsapp-web.js");
import { ChatGPTAPI } from 'chatgpt'

// Environment variables
require("dotenv").config()

// Prefix check
const prefixEnabled = process.env.PREFIX_ENABLED == "true"
const prefix = '!gpt'

// Whatsapp Client
const client = new Client()

// ChatGPT Client
// const api = new ChatGPTAPIBrowser({
//     email: process.env.EMAIL,
//     password: process.env.PASSWORD
// })

const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY
})

// Entrypoint
const start = async () => {
    // Ensure the API is properly authenticated
    // try {
    //     await api.initSession()
    // } catch (error: any) {
    //     console.error("[Whatsapp ChatGPT] Failed to authenticate with the ChatGPT API: " + error.message)
    //     process.exit(1)
    // }

    // Whatsapp auth
    client.on("qr", (qr: string) => {
        console.log("[Whatsapp ChatGPT] Scan this QR code in whatsapp to log in:")
        qrcode.generate(qr, { small: true });
    })

    // Whatsapp ready
    client.on("ready", () => {
        console.log("[Whatsapp ChatGPT] Client is ready!");
    })

    // Whatsapp message
    client.on("message", async (message: any) => {
        if (message.body.length == 0) return
        if (message.from == "status@broadcast") return

        if (prefixEnabled) {
            if (message.body.startsWith(prefix)) {
                // Get the rest of the message
                const prompt = message.body.substring(prefix.length + 1);
                await handleMessage(message, prompt)
            }
        } else {
            await handleMessage(message, message.body)
        }
    })

    client.initialize()
}

const handleMessage = async (message: any, prompt: any) => {
    try {
        const start = Date.now()

        // Send the prompt to the API
        console.log("[Whatsapp ChatGPT] Received prompt from " + message.from + ": " + prompt)
        const response = await api.sendMessage(prompt)

        console.log(`[Whatsapp ChatGPT] Answer to ${message.from}: ${response.text}`)

        const end = Date.now() - start

        console.log("[Whatsapp ChatGPT] ChatGPT took " + end + "ms")

        // Send the response to the chat
        message.reply(response.text)
    } catch (error: any) {
        console.error("An error occured", error)
        message.reply("An error occured, please contact the administrator. (" + error.message + ")")
    }
}

start()
