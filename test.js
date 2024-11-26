require('dotenv').config();
const OpenAI = require('openai');

const OPENAI_API_KEY = process.env.OPENAI_KEY;
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

async function generateGptMessage() {
    try {
        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'user',
                    content: 'Hello say hi back!',
                },
            ],
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('Error generating GPT message:', error.message);
        return error.message + OPENAI_API_KEY;
    }
}

let x = generateGptMessage();
console.log(x);
console.log(OPENAI_API_KEY);