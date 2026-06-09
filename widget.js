#!/usr/bin/env node

require('dotenv').config();
const ArgParser = require('argparse');
const { parseTime, parseTimeLiteral } = require('./modules/utils');

const parser = new ArgParser.ArgumentParser({
    description: 'Dynamic Widget for Discord',
});

const globalOptions = new ArgParser.ArgumentParser({
    add_help: false,
});

globalOptions.add_argument('-a', '--auto', {
    type: 'string',
    help: 'Auto rerun interval, for example 10s, 3h2m, 1d2h3m, or 5 (defaults to minutes)'
});

function scheduleAutoRerun(action, intervalMs) {
    const run = async () => {
        try {
            await action();
        } catch (error) {
            console.error(error);
        } finally {
            setTimeout(run, intervalMs);
        }
    };

    return run();
}

const subparsers = parser.add_subparsers({
    title: 'modes',
    dest: 'mode',
    required: true,
    metavar: '{weather,custom}',
    help: 'Widget mode: weather or custom'
});

const weatherParser = subparsers.add_parser('weather', {
    help: 'Weather widget',
    parents: [globalOptions],
});
weatherParser.add_argument('-l', '--location', {
    type: 'string',
    default: 'Oslo',
    help: 'Location for weather widget (default: Oslo) (don\'t dox yourself)'
});

const customParser = subparsers.add_parser('custom', {
    help: 'Custom widget',
    parents: [globalOptions],
});
customParser.add_argument('path', {
    nargs: '?',
    type: 'string',
    help: 'Path to custom widget JSON file'
});

customParser.add_argument('-e', '--edit', {
    nargs: '+',
    help: 'Edit an existing widget by providing key=value pairs (e.g. -e label1="New Label" label2="Other")'
});

const args = parser.parse_args();

if (args.mode === 'custom' && args.path && args.edit) {
    parser.error('custom mode accepts either a JSON path or -e edits, not both');
}

let executeTask;

switch (args.mode) {
    case 'weather':
        const WeatherWidget = require('./modules/weather');
        const weatherWidget = new WeatherWidget(args.location, args.auto);
        
        executeTask = async () => weatherWidget.updateWeather();
        break;

    case 'custom':
        const DynamicWidgetProfile = require('./modules/widget');
        
        executeTask = async () => {
            const widgetProfile = new DynamicWidgetProfile();

            if (args.path) {
                console.log(`Loading custom widget from ${args.path}`);
                widgetProfile.load(args.path);
                await widgetProfile.push();
                return;
            }

            for (const edit of args.edit) {
                const [key, value] = edit.split('=');
                if (!key || value === undefined) {
                    parser.error(`Invalid edit format: ${edit}. Expected key=value.`);
                }
                widgetProfile.update(key, value);
            }

            await widgetProfile.push();
            console.log('Custom profile updated successfully!');
        };
        break;

    default:
        parser.error('Unknown mode selected');
        return; 
}

if (args.auto) {
    try {
        const ims = parseTime(args.auto);
        console.log(`Auto rerun enabled: every ${parseTimeLiteral(args.auto)}`);
        scheduleAutoRerun(executeTask, ims);
    } catch (error) {
        parser.error(error.message);
    }
} else {
    executeTask().catch((error) => console.error(`Error executing ${args.mode} mode:`, error));
}