const fs = require('fs');
const path = require('path');
require('dotenv').config();
class DynamicWidgetProfile {
	constructor(profilePath = path.join(__dirname, '..', 'profile.json')) {
		this.profilePath = profilePath;
		this.tempPath = path.join(__dirname, '..', 'temp.json');
		if (profilePath !== path.join(__dirname, '..', 'profile.json')){
			this.profile = this.load(profilePath);
		} else {
			this.profile = this._readProfileFromDisk();
		}
	}

	_readProfileFromDisk() {
		const sourcePath = this._getActiveProfilePath();
		return JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
	}

	_getActiveProfilePath() {
		if (fs.existsSync(this.tempPath)) {
			const tempStats = fs.statSync(this.tempPath);

			if (tempStats.size > 0) {
				return this.tempPath;
			}
		}

		return this.profilePath;
	}
	load(jsonPath) {
		this.profile = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
		return this.profile;
	}
	update(key, value) {
		const dynamicEntries = this.profile?.data?.dynamic;

		if (!Array.isArray(dynamicEntries)) {
			throw new Error('Invalid profile structure: data.dynamic is missing or not an array.');
		}

		const entry = dynamicEntries.find((item) => item?.name === key);

		if (!entry) {
			throw new Error(`Dynamic entry not found for key: ${key}`);
		}
		if (entry.value.url && typeof value === 'string') {
			entry.value = { url: value };
		} else {
			entry.value = value;
		}
		return entry;
	}
	dump(){
		console.log('Current profile data:', JSON.stringify(this.profile, null, 2));
	}
	async push() {
		const applicationId = process.env.DISCORD_APPLICATION_ID;
		const userId = process.env.DISCORD_USER_ID;
		const botToken = process.env.DISCORD_TOKEN;
		const username = process.env.DISCORD_USERNAME || 'n0n0k0';

		if (!applicationId || !userId) {
			throw new Error('Missing DISCORD_APPLICATION_ID or DISCORD_USER_ID environment variable.');
		}

		if (!botToken) {
			throw new Error('Missing Discord bot token environment variable. Set DISCORD_BOT_TOKEN or DISCORD_TOKEN.');
		}

		const payload = {
			username,
			data: {
				dynamic: this.profile?.data?.dynamic ?? [],
			},
		};
		
        console.log('Debug: Fetch url:', `https://discord.com/api/v9/applications/${applicationId}/users/${userId}/identities/0/profile`);
		const response = await fetch(
			`https://discord.com/api/v9/applications/${applicationId}/users/${userId}/identities/0/profile`,
			{
				method: 'PATCH',
				headers: {
					Authorization: `Bot ${botToken}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(payload),
			}
		);

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(`Discord API error ${response.status}: ${errorText}`);
		} else {
			console.log('Profile updated successfully on Discord!');
			fs.writeFileSync(this.tempPath, JSON.stringify(this.profile, null, 2), 'utf8');
		}

		return response.json().catch(() => null);
	}
}

module.exports = DynamicWidgetProfile;

if (require.main === module) {
	console.log("Hello")
	console.log("Below are the testing sequences")
	const profile = new DynamicWidgetProfile();
	profile.push().then(() => console.log('Profile updated successfully!'))
	.catch((error) => console.error('Error updating profile:', error));
}
