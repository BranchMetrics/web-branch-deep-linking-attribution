const { exec } = require('child_process');
const fs = require('fs');
const Koa = require('koa');
const serve = require('koa-static');

function readDevConfig() {
    const devConfigPath = 'dev.config';
    if (fs.existsSync(devConfigPath)) {
        try {
            const config = JSON.parse(fs.readFileSync(devConfigPath, 'utf8'));
            return config;
        } catch (error) {
            console.error('Error reading dev.config:', error);
        }
    }
    return {};
}

function writeDevConfig(config) {
    const devConfigPath = 'dev.config';
    fs.writeFileSync(devConfigPath, JSON.stringify(config, null, 4), 'utf8');
}

async function startDev() {
    let config = readDevConfig();

    function executeBuild() {
        console.log('Building dev build...');
        exec(`make dev API_ENDPOINT=${config.APIEndpoint} KEY_VALUE=${config.sdkKey}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing makefile: ${error.message}`);
                return;
            }
            console.log('Dev build successful.');
            console.log('Starting server...');
            const app = new Koa();
            app.use(serve('dev'));
            app.listen(config.port, () => {
                console.log('Server started successfully.');
                console.log(`Example page running at http://localhost:${config.port}/example.html`);
            });
        });
    }

    if (!config.APIEndpoint || !config.sdkKey || !config.port) {
        const questions = [
            {
                type: 'input',
                name: 'apiEndpoint',
                message: 'Enter API endpoint URL (press Enter to use default):',
                default: 'https://api2.branch.io'
            },
            {
                type: 'input',
                name: 'sdkKey',
                message: 'Enter SDK key:',
                validate: function(input) {
                    if (input.trim() === '') {
                        return 'SDK key is required';
                    }
                    return true;
                }
            },
            {
                type: 'input',
                name: 'port',
                message: 'Enter port number (press Enter to use default):',
                default: '3000'
            }
        ];
        const { default: inquirer } = await import('inquirer');
        inquirer.prompt(questions).then(answers => {
            const { apiEndpoint, sdkKey, port } = answers;
            config.APIEndpoint = apiEndpoint;
            config.sdkKey = sdkKey;
            config.port = port;
            writeDevConfig(config);
            executeBuild();
        });
    }
    else{
        executeBuild();
    }
}

startDev();
