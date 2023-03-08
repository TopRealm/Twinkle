/**
 * @source https://github.com/wikimedia-gadgets/xfdcloser/blob/master/bin/deploy.js
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
 * When all of the above are done → you are ready to proceed with deployment
 *
 * --------------------------------------------------------------------------
 *  Usage:
 * --------------------------------------------------------------------------
 * Ensure the pre-deployment steps above are completed, unless you are only
 * deploying to the testwiki (test.qiuwen.org). Then, run this script:
 * In the terminal, enter
 *   node deploy.js
 * and supply the requested details.
 * Notes:
 * - The default summary if not specified is "Updated from repository"
 * - Edit summaries will be prepended with the version number from
 *   the package.json file
 * - Changes to gadget definitions need to be done manually
 *
 */
const fs = require('fs/promises');
const {
	mwn
} = require('mwn');
const {
	execSync
} = require('child_process');
const prompts = require('prompts');
const chalk = require('chalk');
const minimist = require('minimist');

// Adjust target file names if necessary
// All file paths are with respect to repository root
// Remove twinkle-pagestyles.css if deploying as user script
const deployTargets = [{
	file: 'src/twinkle.js',
	target: 'User:WaitSpring/TW-ES6/Twinkle.js'
}, {
	file: 'src/twinkle.css',
	target: 'User:WaitSpring/TW-ES6/Twinkle.css'
}, {
	file: 'src/morebits.js',
	target: 'User:WaitSpring/TW-ES6/morebits.js'
}, {
	file: 'src/morebits.css',
	target: 'User:WaitSpring/TW-ES6/morebits.css'
}, {
	file: 'src/twinkle-pagestyles.css',
	target: 'User:WaitSpring/TW-ES6/Twinkle-pagestyles.css'
}, {
	file: 'src/modules/friendlytag.js',
	target: 'User:WaitSpring/TW-ES6/friendlytag.js'
}, {
	file: 'src/modules/friendlytalkback.js',
	target: 'User:WaitSpring/TW-ES6/friendlytalkback.js'
}, {
	file: 'src/modules/twinklearv.js',
	target: 'User:WaitSpring/TW-ES6/twinklearv.js'
}, {
	file: 'src/modules/twinklebatchprotect.js',
	target: 'User:WaitSpring/TW-ES6/twinklebatchprotect.js'
}, {
	file: 'src/modules/twinklebatchdelete.js',
	target: 'User:WaitSpring/TW-ES6/twinklebatchdelete.js'
}, {
	file: 'src/modules/twinklebatchundelete.js',
	target: 'User:WaitSpring/TW-ES6/twinklebatchundelete.js'
}, {
	file: 'src/modules/twinkleblock.js',
	target: 'User:WaitSpring/TW-ES6/twinkleblock.js'
}, {
	file: 'src/modules/twinkleclose.js',
	target: 'User:WaitSpring/TW-ES6/twinkleclose.js'
}, {
	file: 'src/modules/twinkleconfig.js',
	target: 'User:WaitSpring/TW-ES6/twinkleconfig.js'
}, {
	file: 'src/modules/twinklecopyvio.js',
	target: 'User:WaitSpring/TW-ES6/twinklecopyvio.js'
}, {
	file: 'src/modules/twinklediff.js',
	target: 'User:WaitSpring/TW-ES6/twinklediff.js'
}, {
	file: 'src/modules/twinklefluff.js',
	target: 'User:WaitSpring/TW-ES6/twinklefluff.js'
}, {
	file: 'src/modules/twinkleimage.js',
	target: 'User:WaitSpring/TW-ES6/twinkleimage.js'
}, {
	file: 'src/modules/twinkleprotect.js',
	target: 'User:WaitSpring/TW-ES6/twinkleprotect.js'
}, {
	file: 'src/modules/twinklespeedy.js',
	target: 'User:WaitSpring/TW-ES6/twinklespeedy.js'
}, {
	file: 'src/modules/twinklestub.js',
	target: 'User:WaitSpring/TW-ES6/twinklestub.js'
}, {
	file: 'src/modules/twinkleunlink.js',
	target: 'User:WaitSpring/TW-ES6/twinkleunlink.js'
}, {
	file: 'src/modules/twinklewarn.js',
	target: 'User:WaitSpring/TW-ES6/twinklewarn.js'
}, {
	file: 'src/modules/twinklexfd.js',
	target: 'User:WaitSpring/TW-ES6/twinklexfd.js'
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
		  return require(__dirname + '/credentials.json');
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
		  config.apiUrl = `https://test2.qiuwen.wiki/api.php`;
		} else {
		  if (!config.apiUrl) {
		    if (Object.keys(config).length) {
		      log('yellow', 'Tip: you can avoid this prompt by setting the apiUrl as well in credentials.json');
		    }
		    const site = await input('> Enter sitename (eg. test.qiuwen.org)');
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
		const sha = execSync('git rev-parse --short HEAD').toString('utf8').trim();
		const message = await input('> Edit summary message (optional): ');
		this.editSummary = `版本 ${sha}: ${message || '代码仓库同步更新'}`;
		console.log(`Edit summary is: "${this.editSummary}"`);
	}
	async readFile(filepath) {
		return (await fs.readFile(__dirname + '/../' + filepath)).toString();
	}
	async savePages() {
		await input(`> Press [Enter] to start deploying to ${this.siteName} or [ctrl + C] to cancel`);
		log('yellow', '--- starting deployment ---');
		for await (let {
		  file,
		  target
		} of deployTargets) {
		  let fileText = await this.readFile(file);
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
}
const input = async (message, type = 'text', initial = '') => {
	let name = String(Math.random());
	return (await prompts({
		type,
		name,
		message,
		initial
	}))[name];
}
const logError = (error) => {
	error = error || {};
	console.log((error.info || 'Unknown error') + '\n', error.response || error);
}
const log = (color, ...args) => {
	console.log(chalk[color](...args));
}
const args = minimist(process.argv.slice(2));
new Deploy().deploy();
