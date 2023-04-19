/**
 * @source <github.com/wikimedia-gadgets/xfdcloser/blob/master/bin/deploy.js>
 * @license MIT + CC-BY-SA-3.0 + CC-BY-4.0
 */
// This software is published under the following licenses. You may select the license of your choice.
// - Note: Files published on Wikipedia, including previous versions of XFDcloser, are also available under
// Creative Commons Attribution-ShareAlike 3.0 Unported License (CC BY-SA 3.0)
// https://creativecommons.org/licenses/by-sa/3.0/ and GNU Free Documentation License (GFDL)
// http://www.gnu.org/copyleft/fdl.html
// ---------------------------------------------------------------------------------------------------
// MIT License
// Copyright (c) 2020 Evad37
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software
// and associated documentation files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom
// the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or
// substantial portions of the Software.
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
// ---------------------------------------------------------------------------------------------------
// Creative Commons Attribution 4.0 International Public License
// For a human-readable summary, see https://creativecommons.org/licenses/by/4.0/

/**
 * This script is used to deploy files to the wiki.
 * You must have interface-admin rights to deploy as gadget.
 *
 * ----------------------------------------------------------------------------
 *  Set up:
 * ----------------------------------------------------------------------------
 * 1) Use [[Special:BotPasswords]] to get credentials. Make sure you enable
 *  sufficient permissions.
 * 2) Create a JSON file to store the username and password. This should be
 *  a plain JSON object with keys "username" and "password", see README
 *  file for an example. Save it here in the "scripts" directory with file
 *  name "credentials.json".
 *
 * ---------------------------------------------------------------------------
 *  Pre-deployment checklist:
 * ---------------------------------------------------------------------------
 * 1) Changes committed and merged to master branch on GitHub repo
 * 2) Currently on master branch, and synced with GitHub repo
 * 3) Run a full build using "grunt build"
 * When all of the above are done ==> you are ready to proceed with deployment
 *
 * --------------------------------------------------------------------------
 *  Usage:
 * --------------------------------------------------------------------------
 * Ensure the pre-deployment steps above are completed, unless you are only
 * deploying to the testwiki (www.qiuwen.wiki). Then, run this script:
 * In the terminal, enter
 *   node deploy.js
 * and supply the requested details.
 * Notes:
 * - The default summary if not specified is "Updated from repository"
 * - Edit summaries will be prepended with the version number from
 *   the package.json file
 * - Changes to gadget definitions need to be done manually
 */
import { readFile as _readFile } from 'fs/promises';
import { mwn } from 'mwn';
import { execSync } from 'child_process';
import prompts from 'prompts';
import chalk from 'chalk';
import minimist from 'minimist';
import Credentials from './credentials.json' assert {type: 'json'};
import path from 'path';
const __dirname = path.resolve();

// Adjust target file names if necessary
// All file paths are with respect to repository root
const deployTargets = [{
	file: 'dist/twinkle.js',
	target: 'MediaWiki:Gadget-Twinkle.js'
}, {
	file: 'src/twinkle.css',
	target: 'MediaWiki:Gadget-Twinkle.css'
}, {
	file: 'dist/morebits.js',
	target: 'MediaWiki:Gadget-morebits.js'
}, {
	file: 'src/lib/select2.min.css',
	target: 'MediaWiki:Gadget-select2.min.css'
}, {
	file: 'dist/lib/select2.min.js',
	target: 'MediaWiki:Gadget-select2.min.js'
}, {
	file: 'src/morebits.css',
	target: 'MediaWiki:Gadget-morebits.css'
}, {
	file: 'src/twinkle-pagestyles.css',
	target: 'MediaWiki:Gadget-Twinkle-pagestyles.css'
}, {
	file: 'dist/modules/friendlytag.js',
	target: 'MediaWiki:Gadget-friendlytag.js'
}, {
	file: 'dist/modules/friendlytalkback.js',
	target: 'MediaWiki:Gadget-friendlytalkback.js'
}, {
	file: 'dist/modules/twinklearv.js',
	target: 'MediaWiki:Gadget-twinklearv.js'
}, {
	file: 'dist/modules/twinklebatchprotect.js',
	target: 'MediaWiki:Gadget-twinklebatchprotect.js'
}, {
	file: 'dist/modules/twinklebatchdelete.js',
	target: 'MediaWiki:Gadget-twinklebatchdelete.js'
}, {
	file: 'dist/modules/twinklebatchundelete.js',
	target: 'MediaWiki:Gadget-twinklebatchundelete.js'
}, {
	file: 'dist/modules/twinkleblock.js',
	target: 'MediaWiki:Gadget-twinkleblock.js'
}, {
	file: 'dist/modules/twinkleclose.js',
	target: 'MediaWiki:Gadget-twinkleclose.js'
}, {
	file: 'dist/modules/twinkleconfig.js',
	target: 'MediaWiki:Gadget-twinkleconfig.js'
}, {
	file: 'dist/modules/twinklecopyvio.js',
	target: 'MediaWiki:Gadget-twinklecopyvio.js'
}, {
	file: 'dist/modules/twinklediff.js',
	target: 'MediaWiki:Gadget-twinklediff.js'
}, {
	file: 'dist/modules/twinklefluff.js',
	target: 'MediaWiki:Gadget-twinklefluff.js'
}, {
	file: 'dist/modules/twinkleimage.js',
	target: 'MediaWiki:Gadget-twinkleimage.js'
}, {
	file: 'dist/modules/twinkleprotect.js',
	target: 'MediaWiki:Gadget-twinkleprotect.js'
}, {
	file: 'dist/modules/twinklespeedy.js',
	target: 'MediaWiki:Gadget-twinklespeedy.js'
}, {
	file: 'dist/modules/twinklestub.js',
	target: 'MediaWiki:Gadget-twinklestub.js'
}, {
	file: 'dist/modules/twinkleunlink.js',
	target: 'MediaWiki:Gadget-twinkleunlink.js'
}, {
	file: 'dist/modules/twinklewarn.js',
	target: 'MediaWiki:Gadget-twinklewarn.js'
}, {
	file: 'dist/modules/twinklexfd.js',
	target: 'MediaWiki:Gadget-twinklexfd.js'
}];

class Deploy {
	async deploy() {
		if (!isGitWorkDirClean()) {
			log('red', '[WARN] Git working directory is not clean.');
		}
		const config = this.loadConfig();
		await this.getApi(config);
		await this.login();
		await this.makeEditSummary();
		await this.savePages();
	}

	loadConfig() {
		try {
			return Credentials;
		} catch (e) {
			log('red', 'No credentials.json file found.');
			return {};
		}
	}

	async getApi(config) {
		this.api = new mwn(config);
		try {
			this.api.initOAuth();
			this.usingOAuth = true;
		} catch (e) {
			if (!config.username) {
				config.username = await input('> Enter username');
			}
			if (!config.password) {
				config.password = await input('> Enter bot password', 'password');
			}
		}
		if (args.testwiki) {
			config.apiUrl = `https://www.qiuwen.wiki/api.php`;
		} else {
			if (!config.apiUrl) {
				if (Object.keys(config).length) {
					log('yellow', 'Tip: you can avoid this prompt by setting the apiUrl as well in credentials.json');
				}
				const site = await input('> Enter sitename (eg. www.qiuwen.wiki)');
				config.apiUrl = `https://${site}/api.php`;
			}
		}
		this.api.setOptions(config);
	}

	async login() {
		this.siteName = this.api.options.apiUrl.replace(/^https:\/\//, '').replace(/\/.*/, '');
		log('yellow', '--- Logging in ...');
		if (this.usingOAuth) {
			await this.api.getTokensAndSiteInfo();
		} else {
			await this.api.login();
		}
	}

	async makeEditSummary() {
		this.sha = execSync('git rev-parse --short HEAD').toString('utf8').trim();
		const message = await input('> Edit summary message (optional): ');
		this.editSummary = `Git 版本 ${this.sha}: ${message || '代码仓库同步更新'}`;
		console.log(`Edit summary is: "${this.editSummary}"`);
	}

	async readFile(filepath) {
		return (await _readFile(__dirname + '/' + filepath)).toString();
	}

	async savePages() {
		await input(`> Press [Enter] to start deploying to ${this.siteName} or [ctrl + C] to cancel`);

		log('yellow', '--- starting deployment ---');

		for await (let { file, target } of deployTargets) {
			let fileText = await this.readFile(file);
			let fileHeader = '/* <nowiki> */\n';
			let fileFooter = '\n/* </nowiki> */';
			fileText = fileHeader + fileText + fileFooter;
			try {
				const response = await this.api.save(target, fileText, this.editSummary);
				if (response && response.nochange) {
					log('yellow', `━ No change saving ${file} to ${target} on ${this.siteName}`);
				} else {
					log('green', `✔ Successfully saved ${file} to ${target} on ${this.siteName}`);
				}
			} catch (error) {
				log('red', `✘ Failed to save ${file} to ${target} on ${this.siteName}`);
				logError(error);
			}
		}
		log('yellow', '--- end of deployment ---');
	}
}

const isGitWorkDirClean = () => {
	try {
		execSync('git diff-index --quiet HEAD --');
		return true;
	} catch (e) {
		return false;
	}
};

const input = async (message, type = 'text', initial = '') => {
	let name = String(Math.random());
	return (
		await prompts({
			type,
			name,
			message,
			initial,
		})
	)[name];
};

const logError = (error) => {
	error = error || {};
	console.log((error.info || 'Unknown error') + '\n', error.response || error);
};

const log = (color, ...args) => {
	console.log(chalk[color](...args));
};

const args = minimist(process.argv.slice(2));
new Deploy().deploy();
