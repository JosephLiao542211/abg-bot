require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { v4: uuid } = require("uuid");
const OpenAI = require('openai');
const { ElevenLabsClient } = require("elevenlabs");

// Environment variables
const FRIEND_ID = process.env.FRIEND_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_KEY;
const IMAGE_PATH = process.env.IMAGE_PATH || './images/sample.png';

// Discord client setup
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.DirectMessages
    ]
});

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const elevenlabs_client = new ElevenLabsClient({
    apiKey: ELEVENLABS_API_KEY,
});

// OpenAI API setup
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

// Utility function to delay execution
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Function to create audio with retry logic
const createAudioFileFromText = async (text, retries = 3, initialDelay = 1000) => {
    return new Promise(async (resolve, reject) => {
        let currentTry = 0;
        let currentDelay = initialDelay;

        while (currentTry < retries) {
            try {
                const audio = await elevenlabs_client.generate({
                    voice: "aEO01A4wXwd1O8GPgGlF",
                    model_id: "eleven_multilingual_v2",
                    text,
                });
                
                const fileName = `${uuid()}.mp3`;
                const fileStream = fs.createWriteStream(fileName);
                
                await new Promise((resolveStream, rejectStream) => {
                    audio.pipe(fileStream);
                    fileStream.on("finish", () => resolveStream());
                    fileStream.on("error", rejectStream);
                });

                return resolve(fileName);

            } catch (error) {
                currentTry++;
                console.log(`Attempt ${currentTry} failed. Status code: ${error.statusCode}`);

                if (error.statusCode === 429) {
                    if (currentTry < retries) {
                        console.log(`Rate limited. Waiting ${currentDelay}ms before retry...`);
                        await delay(currentDelay);
                        currentDelay *= 2; // Exponential backoff
                        continue;
                    }
                }

                if (currentTry === retries) {
                    return reject(error);
                }
            }
        }
    });
};

// Function to generate a GPT message
async function generateGptMessage() {
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{ 
                role: 'user', 
                content: ' USE HUMAN-LIKE inflections like dragging out words and tonal shifts and atleats one exclamation mark always end with a period  Write a introduction for a girls name and a unformal seductive and kinda flirty message to a potenital romantic interest reminding him that if he gets $2000 in sposorship money for INCUBATE, he can go on date with you. and be causal and flirty, keep it under 3 sentances'
            }]
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error generating GPT message:', error);
        return 'Hello! This is an automated message.';
    }
}

// Function to clean up audio file
const cleanupAudioFile = (fileName) => {
    try {
        if (fileName && fs.existsSync(fileName)) {
            fs.unlinkSync(fileName);
            console.log(`Cleaned up audio file: ${fileName}`);
        }
    } catch (error) {
        console.error('Error cleaning up audio file:', error);
    }
};

// Function to send a DM to a friend
const sendMessageToFriend = async () => {
    let audioFileName = null;
    try {
        const user = await client.users.fetch(FRIEND_ID);
        if (!user) {
            console.error('Friend ID is invalid or user not found.');
            return;
        }

        // Generate GPT message
        const message = await generateGptMessage();
        console.log('Generated message:', message);
        
        // Generate audio from the message with retry logic
        audioFileName = await createAudioFileFromText(message);
        console.log('Generated audio file:', audioFileName);
        
        // Read the image file

        // Get a random image from the directory
        const imageFiles = fs.readdirSync(path.resolve(IMAGE_PATH));
        const randomImageFile = imageFiles[Math.floor(Math.random() * imageFiles.length)];
        const imageAttachment = fs.readFileSync(path.resolve(IMAGE_PATH, randomImageFile));

        // Send the text message, audio, and image
        await user.send({ 
            content: message,
            files: [
                { 
                    attachment: audioFileName,
                    name: 'message.mp3'
                },
                {
                    attachment: imageAttachment,
                    name: 'image.png'
                }
            ] 
        });

        console.log(`DM successfully sent to ${user.tag}`);
        
    } catch (error) {
        if (error.code === 50007) {
            console.error('Could not send DM: User privacy settings prevent DMs from this bot.');
        } else {
            console.error(`An error occurred: ${error.message}`);
        }
        console.error('Error details:', error);
    } finally {
        // Clean up the audio file in the finally block to ensure it runs
        if (audioFileName) {
            cleanupAudioFile(audioFileName);
        }
    }
};

// Event handler when bot is ready
client.once('ready', () => {
    console.log(`Bot is online as ${client.user.tag}`);
    sendMessageToFriend();
});

// Log in with your bot's token
client.login(DISCORD_TOKEN).catch(error => {
    console.error('Failed to login:', error);
});