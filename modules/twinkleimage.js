// <nowiki>
/**
 * Twinkle.js - twinkleimage.js
 * © 2011-2022 English Wikipedia Contributors
 * © 2011-2021 Chinese Wikipedia Contributors
 * © 2021-     Qiuwen Baike Contributors
 * This work is licensed under a Creative Commons
 * Attribution-ShareAlike 3.0 Unported License.
 * https://creativecommons.org/licenses/by-sa/3.0/
 */
(function($) {


/*
 ****************************************
 *** twinkleimage.js: Image CSD module
 ****************************************
 * Mode of invocation:     Tab ("DI")
 * Active on:              Local nonredirect file pages (not on Commons)
 */

Twinkle.image = function twinkleimage() {
	if (mw.config.get('wgNamespaceNumber') === 6 &&
			!document.getElementById('mw-sharedupload') &&
			document.getElementById('mw-imagepage-section-filehistory')) {

		Twinkle.addPortletLink(Twinkle.image.callback, '图权', 'tw-di', '提交文件快速删除');
	}
};

Twinkle.image.callback = function twinkleimageCallback() {
	var Window = new Morebits.simpleWindow(600, 330);
	Window.setTitle('文件快速删除');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('快速删除方针', 'QW:CSD');
	Window.addFooterLink('参数设置', 'H:TW/PREF#image');
	Window.addFooterLink('帮助文档', 'H:TW/DOC#image');
	Window.addFooterLink('问题反馈', 'HT:TW');

	var form = new Morebits.quickForm(Twinkle.image.callback.evaluate);
	form.append({
		type: 'checkbox',
		list: [
			{
				label: '通知上传者',
				value: 'notify',
				name: 'notify',
				tooltip: '如果您在标记同一用户的很多文件，请取消此复选框以避免发送过多消息。',
				checked: Twinkle.getPref('notifyUserOnDeli')
			}
		]
	}
	);
	var field = form.append({
		type: 'field',
		label: '需要的动作'
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
				tooltip: '包括以下情况：与现有文件完全相同（或与现有文件内容一致但尺寸较小），且没有客观需要（如某些场合需使用小尺寸图片）的文件；被更加清晰的文件、SVG格式文件所取代的文件。'
			}
		]
	});
	form.append({
		type: 'div',
		label: '工作区',
		name: 'work_area'
	});
	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// We must init the parameters
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.type[0].dispatchEvent(evt);
};

Twinkle.image.callback.choice = function twinkleimageCallbackChoose(event) {
	var value = event.target.values;
	var root = event.target.form;
	var work_area = new Morebits.quickForm.element({
		type: 'div',
		name: 'work_area'
	});

	switch (value) {
		case 'no source no license':
		case 'no source':
			work_area.append({
				type: 'checkbox',
				list: [
					{
						label: 'Non-free',
						name: 'non_free',
						tooltip: 'File is licensed under a fair use claim'
					}
				]
			});
		/* falls through */
		case 'no license':
			work_area.append({
				type: 'checkbox',
				list: [
					{
						name: 'derivative',
						label: 'Derivative work which lacks a source for incorporated works',
						tooltip: 'File is a derivative of one or more other works whose source is not specified'
					}
				]
			});
			break;
		case 'no permission':
			work_area.append({
				type: 'input',
				name: 'source',
				label: 'Source:'
			});
			break;
		case 'disputed fair use rationale':
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: 'Concern:'
			});
			break;
		case 'orphaned fair use':
			work_area.append({
				type: 'input',
				name: 'replacement',
				label: 'Replacement:',
				tooltip: 'Optional file that replaces this one.  The "File:" prefix is optional.'
			});
			break;
		case 'replaceable fair use':
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: 'Reason:'
			});
			break;
		default:
			break;
	}

	root.replaceChild(work_area.render(), $(root).find('div[name="work_area"]')[0]);
};

Twinkle.image.callback.evaluate = function twinkleimageCallbackEvaluate(event) {

	var input = Morebits.quickForm.getInputData(event.target);
	if (input.replacement) {
		input.replacement = (new RegExp('^' + Morebits.namespaceRegex(6) + ':', 'i').test(input.replacement) ? '' : 'File:') + input.replacement;
	}

	var csdcrit;
	switch (input.type) {
		case 'no source no license':
		case 'no source':
		case 'no license':
			csdcrit = 'F4';
			break;
		case 'orphaned fair use':
			csdcrit = 'F5';
			break;
		case 'no fair use rationale':
			csdcrit = 'F6';
			break;
		case 'disputed fair use rationale':
		case 'replaceable fair use':
			csdcrit = 'F7';
			break;
		case 'no permission':
			csdcrit = 'F11';
			break;
		default:
			throw new Error('Twinkle.image.callback.evaluate: unknown criterion');
	}

	var lognomination = Twinkle.getPref('logSpeedyNominations') && Twinkle.getPref('noLogOnSpeedyNomination').indexOf(csdcrit.toLowerCase()) === -1;
	var templatename = input.derivative ? 'dw ' + input.type : input.type;

	var params = $.extend({
		templatename: templatename,
		normalized: csdcrit,
		lognomination: lognomination
	}, input);

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(event.target);

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = 'Tagging complete';

	// Tagging image
	var qiuwen_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging file with deletion tag');
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
		var noteData = document.createElement('pre');
		noteData.appendChild(document.createTextNode('{{subst:di-' + templatename + '-notice|1=' + mw.config.get('wgTitle') + '}} ~~~~'));
		Morebits.status.info('Notification', [ 'Following/similar data should be posted to the original uploader:', document.createElement('br'), noteData ]);
	}
};

Twinkle.image.callbacks = {
	taggingImage: function(pageobj) {
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();

		// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
		text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');

		var tag = '{{di-' + params.templatename + '|date={{subst:#time:j F Y}}';
		switch (params.type) {
			case 'no source no license':
			case 'no source':
				tag += params.non_free ? '|non-free=yes' : '';
				break;
			case 'no permission':
				tag += params.source ? '|source=' + params.source : '';
				break;
			case 'disputed fair use rationale':
				tag += params.reason ? '|concern=' + params.reason : '';
				break;
			case 'orphaned fair use':
				tag += params.replacement ? '|replacement=' + params.replacement : '';
				break;
			case 'replaceable fair use':
				tag += params.reason ? '|1=' + params.reason : '';
				break;
			default:
				break;  // doesn't matter
		}
		tag += '|help=off}}\n';

		pageobj.setPageText(tag + text);
		pageobj.setEditSummary('This file is up for deletion, per [[QW:CSD#' + params.normalized + '|CSD ' + params.normalized + ']] (' + params.type + ').');
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setWatchlist(Twinkle.getPref('deliWatchPage'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();
	},
	userNotification: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var initialContrib = pageobj.getCreator();

		// disallow warning yourself
		if (initialContrib === mw.config.get('wgUserName')) {
			pageobj.getStatusElement().warn('You (' + initialContrib + ') created this page; skipping user notification');
		} else {
			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, 'Notifying initial contributor (' + initialContrib + ')');
			var notifytext = '\n{{subst:di-' + params.templatename + '-notice|1=' + mw.config.get('wgTitle');
			if (params.type === 'no permission') {
				notifytext += params.source ? '|source=' + params.source : '';
			}
			notifytext += '}} ~~~~';
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary('Notification: tagging for deletion of [[:' + Morebits.pageNameNorm + ']].');
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
	addToLog: function(params, initialContrib) {
		var usl = new Morebits.userspaceLogger(Twinkle.getPref('speedyLogPageName'));
		usl.initialText =
			"This is a log of all [[QW:CSD|speedy deletion]] nominations made by this user using [[H:TW|Twinkle]]'s CSD module.\n\n" +
			'If you no longer wish to keep this log, you can turn it off using the [[H:TW/PREF|preferences panel]], and ' +
			'nominate this page for speedy deletion under [[QW:CSD#U1|CSD U1]].' +
			(Morebits.userIsSysop ? '\n\nThis log does not track outright speedy deletions made using Twinkle.' : '');

		var formatParamLog = function(normalize, csdparam, input) {
			if (normalize === 'F5' && csdparam === 'replacement') {
				input = '[[:' + input + ']]';
			}
			return ' {' + normalize + ' ' + csdparam + ': ' + input + '}';
		};

		var extraInfo = '';

		// If a logged file is deleted but exists on commons, the wikilink will be blue, so provide a link to the log
		var fileLogLink = ' ([{{fullurl:Special:Log|page=' + mw.util.wikiUrlencode(mw.config.get('wgPageName')) + '}} log])';

		var appendText = '# [[:' + Morebits.pageNameNorm + ']]' + fileLogLink + ': DI [[QW:CSD#' + params.normalized.toUpperCase() + '|CSD ' + params.normalized.toUpperCase() + ']] ({{tl|di-' + params.templatename + '}})';

		['reason', 'replacement', 'source'].forEach(function(item) {
			if (params[item]) {
				extraInfo += formatParamLog(params.normalized.toUpperCase(), item, params[item]);
				return false;
			}
		});

		if (extraInfo) {
			appendText += '; additional information:' + extraInfo;
		}
		if (initialContrib) {
			appendText += '; notified {{user|1=' + initialContrib + '}}';
		}
		appendText += ' ~~~~~\n';

		var editsummary = 'Logging speedy deletion nomination of [[:' + Morebits.pageNameNorm + ']].';

		usl.changeTags = Twinkle.changeTags;
		usl.log(appendText, editsummary);
	}
};

Twinkle.addInitCallback(Twinkle.image, 'image');
})(jQuery);


// </nowiki>
