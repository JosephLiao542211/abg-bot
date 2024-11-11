require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages] });
const FRIEND_ID = process.env.FRIEND_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

client.once('ready', () => {
    console.log(`Bot is online as ${client.user.tag}`);

    // Function to send a DM to the friend
    const sendMessageToFriend = async () => {
        try {
            const user = await client.users.fetch(FRIEND_ID);
            if (!user) {
                console.error('Friend ID is invalid or user not found.');
                return;
            }

            // Attempt to send the DM
            await user.send('Hello! This is an automated message.');
            console.log(`DM successfully sent to ${user.tag}`);
        } catch (error) {
            if (error.code === 50007) {
                console.error('Could not send DM: User privacy settings prevent DMs from this bot.');
            } else {
                console.error(`An error occurred: ${error.message}`);
            }
            console.error('Error details:', error);
        }
    };

    sendMessageToFriend();
});

// Log in with your bot's token
client.login(DISCORD_TOKEN);
