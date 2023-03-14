/**
 * SPDX-License-Identifier: CC-BY-SA-4.0
 * _addText: '{{Twinkle Header}}'
 *
 * @source https://git.qiuwen.wiki/InterfaceAdmin/Twinkle
 * @source https://git.qiuwen.wiki/Mirror/xiplus-twinkle
 * @author © 2011-2022 English Wikipedia Contributors
 * @author © 2011-2021 Chinese Wikipedia Contributors
 * @author © 2021-     Qiuwen Baike Contributors
 * @license <https://creativecommons.org/licenses/by-sa/4.0/>
 */
/* Twinkle.js - twinkleimage.js */
/* <nowiki> */
(($) => {
/**
 * twinkleimage.js: Image CSD module
 * Mode of invocation:  Tab ("DI")
 * Active on:           Local nonredirect file pages (not on Commons)
 */

Twinkle.image = () => {
	if (
		mw.config.get('wgNamespaceNumber') === 6 &&
			!document.querySelector('#mw-sharedupload') &&
			document.querySelector('#mw-imagepage-section-filehistory')
	) {
		Twinkle.addPortletLink(Twinkle.image.callback, '图权', 'tw-di', '提交文件快速删除');
	}
};
Twinkle.image.callback = () => {
	const Window = new Morebits.simpleWindow(600, 330);
	Window.setTitle('文件快速删除');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('快速删除方针', 'QW:CSD');
	Window.addFooterLink('参数设置', 'H:TW/PREF#图权');
	Window.addFooterLink('帮助文档', 'H:TW/DOC#图权');
	Window.addFooterLink('问题反馈', 'HT:TW');
	const form = new Morebits.quickForm(Twinkle.image.callback.evaluate);
	form.append({
		type: 'checkbox',
		list: [
			{
				label: '通知上传者',
				value: 'notify',
				name: 'notify',
				tooltip: '若您在标记同一用户的很多文件，请取消此复选框以避免发送过多消息。',
				checked: Twinkle.getPref('notifyUserOnDeli')
			}
		]
	});
	const field = form.append({
		type: 'field',
		label: '理由'
	});
	field.append({
		type: 'radio',
		name: 'type',
		event: Twinkle.image.callback.choice,
		list: [
			{
				label: '来源不明（CSD F1）',
				value: 'no source',
				checked: true,
				tooltip: '上传后3天内仍然来源不明、著作权不明'
			},
			{
				label: '著作权不明（CSD F1）',
				value: 'no license',
				tooltip: '上传后3天内仍著作权情况不明'
			},
			{
				label: '来源、著作权均不明（CSD F1）',
				value: 'no source no license',
				tooltip: '上传后3天内仍然来源不明、著作权不明'
			},
			{
				label: '其他来源找到的文件（CSD F1）',
				value: 'no permission',
				tooltip: '上传者宣称拥有，而在其他来源找到的文件'
			},
			{
				label: '无法找到作者授权的文件（CSD F1）',
				value: 'no permission',
				tooltip: '文件宣称由某作者依据某自由著作权协议发布，但找不到该自由协议的声明'
			},
			{
				label: '其他明显侵权的文件（CSD F1）',
				value: 'no permission',
				tooltip: '其他明显侵权的文件'
			},
			{
				label: '重复且不再使用的文件（CSD F2）',
				value: 'duplicate',
				tooltip:
						'包括以下情况：与现有文件完全相同（或与现有文件内容一致但尺寸较小），且没有客观需要（如某些场合需使用小尺寸图片）的文件；被更加清晰的文件、SVG格式文件所取代的文件。'
			}
		]
	});
	form.append({
		type: 'div',
		label: '工作区',
		name: 'work_area'
	});
	form.append({
		type: 'submit'
	});
	const result = form.render();
	Window.setContent(result);
	Window.display();

	// We must init the parameters
	const evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.type[0].dispatchEvent(evt);
};
Twinkle.image.callback.choice = (event) => {
	const value = event.target.values;
	const root = event.target.form;
	const work_area = new Morebits.quickForm.element({
		type: 'div',
		name: 'work_area'
	});
	switch (value) {
		case 'no source no license':
		case 'no source': {
			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: '非自由版权文件',
						name: 'non_free'
					}
				]
			});
		}
		/* falls through */
		case 'no license': {
			work_area.append({
				type: 'checkbox',
				list: [
					{
						name: 'derivative',
						label: '未知来源的媒体衍生物',
						tooltip: '文件是若干个未指明来源媒体的衍生物'
					}
				]
			});
			break;
		}
		case 'no permission': {
			work_area.append({
				type: 'input',
				name: 'source',
				label: '来源：'
			});
			break;
		}
		default: {
			break;
		}
	}
	root.replaceChild(work_area.render(), $(root).find('div[name="work_area"]')[0]);
};
Twinkle.image.callback.evaluate = (event) => {
	const input = Morebits.quickForm.getInputData(event.target);
	if (input.replacement) {
		input.replacement =
				(new RegExp(`^${Morebits.namespaceRegex(6)}:`, 'i').test(input.replacement)
					? ''
					: 'File:') + input.replacement;
	}
	let csdcrit;
	switch (input.type) {
		case 'no source no license':
		case 'no source':
		case 'no license': {
			csdcrit = 'F1';
			break;
		}
		case 'no permission': {
			csdcrit = 'F2';
			break;
		}
		default: {
			throw new Error('Twinkle.image.callback.evaluate: 未知理由');
		}
	}
	const lognomination =
			Twinkle.getPref('logSpeedyNominations') &&
			!Twinkle.getPref('noLogOnSpeedyNomination').includes(csdcrit.toLowerCase());
	const templatename = input.derivative ? `dw ${input.type}` : input.type;
	const params = $.extend(
		{
			templatename: templatename,
			normalized: csdcrit,
			lognomination: lognomination
		},
		input
	);
	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(event.target);
	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = '标记完成';

	// Tagging image
	const qiuwen_page = new Morebits.wiki.page(
		mw.config.get('wgPageName'),
		'以删除模板标记文件'
	);
	qiuwen_page.setCallbackParameters(params);
	qiuwen_page.load(Twinkle.image.callbacks.taggingImage);

	// Notifying uploader
	if (input.notify) {
		qiuwen_page.lookupCreation(Twinkle.image.callbacks.userNotification);
	} else {
		// add to CSD log if desired
		if (lognomination) {
			Twinkle.image.callbacks.addToLog(params, null);
		}
		// No auto-notification, display what was going to be added.
		const noteData = document.createElement('pre');

		noteData.appendChild(
			document.createTextNode(
				`{{subst:di-${templatename}-notice|1=${mw.config.get('wgTitle')}}} ~~` + '~~'
			)
		);
		Morebits.status.info('提醒', [
			'这些内容也应当通知到原始上传者:',
			document.createElement('br'),
			noteData
		]);
	}
};
Twinkle.image.callbacks = {
	taggingImage: (pageobj) => {
		const text = pageobj.getPageText();
		const params = pageobj.getCallbackParameters();

		// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
		// text = text.replace(/\{\{(mtc|(copy |move )?to ?share|move to qiuwen share|copy to qiuwen share)[^}]*\}\}/gi, '');
		let tag = `{{di-${params.templatename}|date={{subst:#time:c}}`;
		switch (params.type) {
			case 'no source no license':
			case 'no source': {
				tag += params.non_free ? '|non-free=yes' : '';
				break;
			}
			case 'no permission': {
				tag += params.source ? `|source=${params.source}` : '';
				break;
			}
			default: {
				break;
			}
				// doesn't matter
		}

		tag += '|help=off}}\n';
		pageobj.setPageText(tag + text);
		pageobj.setEditSummary(
			`文件正被检查是否需要删除, 原因是[[QW:CSD#${params.normalized}|CSD ${params.normalized}]] (${params.type}).`
		);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setWatchlist(Twinkle.getPref('deliWatchPage'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();
	},
	userNotification: (pageobj) => {
		const params = pageobj.getCallbackParameters();
		const initialContrib = pageobj.getCreator();

		// disallow warning yourself
		if (initialContrib === mw.config.get('wgUserName')) {
			pageobj
				.getStatusElement()
				.warn(`你 (${initialContrib}) 创建了这个页面；跳过通知步骤`);
		} else {
			const usertalkpage = new Morebits.wiki.page(
				`User talk:${initialContrib}`,
				`通知原始上传者 (${initialContrib})`
			);
			let notifytext = `\n{{subst:di-${params.templatename}-notice|1=${mw.config.get(
				'wgTitle'
			)}`;
			if (params.type === 'no permission') {
				notifytext += params.source ? `|source=${params.source}` : '';
			}

			notifytext += '}} ~~' + '~~';
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary(`[[:${Morebits.pageNameNorm}]]的文件删除提醒。`);
			usertalkpage.setChangeTags(Twinkle.changeTags);
			usertalkpage.setCreateOption('recreate');
			usertalkpage.setWatchlist(Twinkle.getPref('deliWatchUser'));
			usertalkpage.setFollowRedirect(true, false);
			usertalkpage.append();
		}

		// add this nomination to the user's userspace log, if the user has enabled it
		if (params.lognomination) {
			Twinkle.image.callbacks.addToLog(params, initialContrib);
		}
	},
	addToLog: (params, initialContrib) => {
		const usl = new Morebits.userspaceLogger(Twinkle.getPref('speedyLogPageName'));
		usl.initialText = `这是该用户使用[[H:TW|Twinkle]]的速删模块做出的[[QW:CSD|快速删除]]提名列表。\n\n若您不再想保留此日志，请在[[${Twinkle.getPref(
			'configPage'
		)}|参数设置]]中关掉，并使用[[QW:O1|CSD O1]]提交快速删除。${
			Morebits.userIsSysop ? '\n\n此日志并不记录用Twinkle直接执行的删除。' : ''
		}`;
		const formatParamLog = (normalize, csdparam, input) => {
			if (normalize === 'F5' && csdparam === 'replacement') {
				input = `[[:${input}]]`;
			}
			return ` {${normalize} ${csdparam}: ${input}}`;
		};
		let extraInfo = '';

		// If a logged file is deleted but exists on Qiuwen Share, the wikilink will be blue, so provide a link to the log
		const fileLogLink = ` ([{{fullurl:Special:Log|page=${mw.util.wikiUrlencode(
			mw.config.get('wgPageName')
		)}}} log])`;
		let appendText = `# [[:${
			Morebits.pageNameNorm
		}]]${fileLogLink}: DI [[QW:CSD#${params.normalized.toUpperCase()}|CSD ${params.normalized.toUpperCase()}]] ({{tl|di-${
			params.templatename
		}}})`;
		['reason', 'replacement', 'source'].forEach((item) => {
			if (params[item]) {
				extraInfo += formatParamLog(
					params.normalized.toUpperCase(),
					item,
					params[item]
				);
				return false;
			}
		});
		if (extraInfo) {
			appendText += `; 其他信息:${extraInfo}`;
		}
		if (initialContrib) {
			appendText += `; 已通知 {{user|1=${initialContrib}}}`;
		}

		appendText += ' ~~' + '~' + '~~\n';
		const editsummary = `在日志记录[[:${Morebits.pageNameNorm}]]的快速删除提名`;
		usl.changeTags = Twinkle.changeTags;
		usl.log(appendText, editsummary);
	}
};
Twinkle.addInitCallback(Twinkle.image, 'image');
})(jQuery);
/* </nowiki> */
