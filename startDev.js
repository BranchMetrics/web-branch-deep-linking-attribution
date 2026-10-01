const fs = require('fs').promises;
const path = require('path');

const defaultDev = {
    "APIEndpoint": "https://api.stage.branch.io",
    "sdkKey": 'key_live_plqOidX7fW71Gzt0LdCThkemDEjCbTgx',
    "port": "3000"
};

const TEMPLATE_FILE = 'examples/example.template.html';
const DEV_HTML = 'dev.html';

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch (e) {
        return false;
    }
}

async function getDevConfig() {
    const devConfigPath = 'dev.config';
    if (await fileExists(devConfigPath)) {
        try {
            const data = await fs.readFile(devConfigPath, 'utf8');
            const config = JSON.parse(data);
            return config;
        } catch (error) {
            console.error('Error reading dev.config:', error);
        }
    } else {
        await fs.writeFile(devConfigPath, JSON.stringify(
            defaultDev
        ));
        return defaultDev;
    }
}

async function writeDevConfig(config) {
    const devConfigPath = 'dev.config';
    await fs.writeFile(devConfigPath, JSON.stringify(config, null, 4), 'utf8');
}

async function processTemplate(templateFile, outputFile, replacements) {
    try {
        let content = await fs.readFile(templateFile, 'utf8');

        // Replace each placeholder with its replacement
        for (const [placeholder, replacement] of Object.entries(replacements)) {
            const regex = new RegExp(placeholder, 'g'); // Replace all occurrences
            content = content.replace(regex, replacement);
        }

        // Write the updated content back to the output file
        await fs.writeFile(outputFile, content, 'utf8');
    } catch (error) {
        console.error(`Error processing file: ${error}`);
    }
}

async function writeExampleHtml(config) {
    // Define your file paths and replacements
    const templateFile = path.join(__dirname, TEMPLATE_FILE);
    const outputFile = path.join(__dirname, DEV_HTML);
    const replacements = {
        'key_place_holder': config.sdkKey,
        'api_place_holder': config.APIEndpoint,
        'script_place_holder': './dist/build.min.js',
    };

    await processTemplate(templateFile, outputFile, replacements);
}

// Reloads open pages whenever the watched dist/build.js is rewritten.
function reloadOnBundleChange() {
    return {
        name: 'reload-on-bundle-change',
        configureServer(server) {
            const bundlePath = path.join(__dirname, 'dist/build.js');
            server.watcher.add(bundlePath);
            server.watcher.on('change', (file) => {
                if (file === bundlePath) {
                    server.ws.send({ type: 'full-reload' });
                }
            });
        },
    };
}

async function executeBuild(config) {
    console.log('Building build...');
    const { createServer } = await import('vite');
    const { bundle } = await import('./scripts/build.mjs');

    const watcher = await bundle('build.js', { watch: true });
    await new Promise((resolve, reject) => {
        watcher.on('event', (event) => {
            if (event.code === 'END') resolve();
            if (event.code === 'ERROR') reject(event.error);
        });
    });
    console.log(`Dev websdk build successful, ${DEV_HTML} built from ${TEMPLATE_FILE}`);

    const server = await createServer({
        configFile: false,
        root: __dirname,
        server: { port: Number(config.port), strictPort: true },
        plugins: [reloadOnBundleChange()],
    });
    await server.listen();
    console.log('Server started successfully.');
    console.log(`Example page running at http://localhost:${config.port}/${DEV_HTML}. To edit, update ${TEMPLATE_FILE}`);
}

async function startDev() {
    const config = await getDevConfig();

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
        const answers = await inquirer.prompt(questions);
        const { apiEndpoint, sdkKey, port } = answers;
        config.APIEndpoint = apiEndpoint;
        config.sdkKey = sdkKey;
        config.port = port;
        await writeDevConfig(config);
    }
    await writeExampleHtml(config);
    await executeBuild(config);
}

startDev();
