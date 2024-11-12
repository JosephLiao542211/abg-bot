const { exec } = require('child_process');

function runBot() {
    exec('node bot.js', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing bot.js: ${error}`);
            return;
        }
        if (stderr) {
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log(`stdout: ${stdout}`);
    });
}

// Run the bot immediately, then every 2 minutes
runBot();
// setInterval(runBot, 24 * 60 * 60 * 1000);