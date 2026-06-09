const DynamicWidgetProfile = require('./widget.js');
const { parseTime, parseTimeLiteral } = require('./utils');

class WeatherWidget {
    constructor(location='Oslo', updateInterval = null) {
        this.widgetProfile = new DynamicWidgetProfile();
        this.location = location;
        this.updateInterval = updateInterval;
    }

    async updateWeather() {
        try {
            const response = await fetch(`https://wttr.in/${this.location}?format="%l;%C;%c;%M;%m;%t;%h;%w;%u;%f"`, {
                headers: { 'User-Agent': 'curl/7.79.1' }
            });

            const text = await response.text();
            const [location, condition, conditionIcon, moonDay, moonPhase, temp, humidity, wind, uv, feelsLike] = text.replace(/"/g, '').split(';');

            this.widgetProfile.update('image1', this.emojiToUrl(conditionIcon));
            //console.log('Debug: Condition icon URL:', this.emojiToUrl(conditionIcon));
            
            const text1 = `${location.charAt(0).toUpperCase() + location.slice(1)}, ${new Date().toLocaleDateString(undefined, {dateStyle:'full'})}`; 
            this.widgetProfile.update('text1', text1);

            this.widgetProfile.update('label1', condition);
            this.widgetProfile.update('label2', `UV Index: ${uv}`);
            this.widgetProfile.update('label3', 'Live weather update every ' + (parseTimeLiteral(this.updateInterval)));

            this.widgetProfile.update('statimg1', this.emojiToUrl(moonPhase));
            this.widgetProfile.update('statname1', `Lunar day: ${moonDay}`);

            this.widgetProfile.update('statimg2', this.emojiToUrl("🌡️"));
            this.widgetProfile.update('statname2', `Temperature: ${temp}`);
            this.widgetProfile.update('statlabel2', `Feels like: ${feelsLike}`);


            
            this.widgetProfile.update('statimg3', this.emojiToUrl("💧"))
            this.widgetProfile.update('statname3', `Humidity: ${humidity}`)
            
            

            this.widgetProfile.update('statimg4', this.emojiToUrl("💨"));
            this.widgetProfile.update('statname4', `Wind: ${wind}`);
            this.widgetProfile.push().then(() => console.log('Weather profile updated successfully!'))
            .catch((error) => console.error('Error updating weather profile:', error));
        } catch (error) {
            console.error('Error updating weather profile:', error);
        }
    }

    emojiToUrl(emoji){
        const codePoint = emoji.codePointAt(0).toString(16);
        return `https://emojiapi.dev/api/v1/${codePoint}/128.png`;
    }
}

module.exports = WeatherWidget;

if (require.main === module) {
    const weatherWidget = new WeatherWidget(location='Curitiba');
    weatherWidget.updateWeather();
}
