#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config();
const ArgParser = require('argparse');

const parser = new ArgParser.ArgumentParser({
    description: 'Dynamic Widget for Discord',
});

const subparsers = parser.add_subparsers({
    title: 'modes',
    dest: 'mode',
    required: true,
    metavar: '{weather,custom}',
    help: 'Widget mode: weather or custom'
});

const weatherParser = subparsers.add_parser('weather', { help: 'Weather widget' });
weatherParser.add_argument('-l', '--location', {
    type: 'string',
    default: 'Oslo',
    help: 'Location for weather widget (default: Oslo) (don\'t dox yourself)'
});

const customParser = subparsers.add_parser('custom', { help: 'Custom widget' });
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

switch (args.mode) {
    case 'weather':
        const WeatherWidget = require('./modules/weather');
        const weatherWidget = new WeatherWidget(args.location);
        weatherWidget.updateWeather();
        break;
    case 'custom':
        const DynamicWidgetProfile = require('./modules/widget');
        const widgetProfile = new DynamicWidgetProfile();
        if (args.path) {
            console.log(`Loading custom widget from ${args.path}`);
            widgetProfile.load(args.path);
            widgetProfile.push();
        } else {
            for (const edit of args.edit) {
                const [key, value] = edit.split('=');
                if (!key || value === undefined) {
                    parser.error(`Invalid edit format: ${edit}. Expected key=value.`);
                }
                widgetProfile.update(key, value);
            }
            widgetProfile.push().then(() => console.log('Custom profile updated successfully!'))
            .catch((error) => console.error('Error updating custom profile:', error));
        }
        break;
    default:
        parser.error('Unknown mode selected');
}