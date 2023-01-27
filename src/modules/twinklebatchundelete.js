'use strict';

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
/* Twinkle.js - twinklebatchundelete.js */
/* <nowiki> */
(($) => {
/**
 * twinklebatchundelete.js: Batch undelete module
 * Mode of invocation:     Tab ("Und-batch")
 * Active on:              Existing user and project pages
 */

Twinkle.batchundelete = function twinklebatchundelete() {
	if (!Morebits.userIsSysop || !mw.config.get('wgArticleId') || mw.config.get('wgNamespaceNumber') !== mw.config.get('wgNamespaceIds').user && mw.config.get('wgNamespaceNumber') !== mw.config.get('wgNamespaceIds').project) {
		return;
	}
	Twinkle.addPortletLink(Twinkle.batchundelete.callback, '批复', 'tw-batch-undel', '恢复页面');
};
Twinkle.batchundelete.callback = function twinklebatchundeleteCallback() {
	const Window = new Morebits.simpleWindow(600, 400);
	Window.setScriptName('Twinkle');
	Window.setTitle('批量恢复');
	Window.addFooterLink('帮助文档', 'H:TW/DOC#批量恢复');
	Window.addFooterLink('问题反馈', 'HT:TW');
	const form = new Morebits.quickForm(Twinkle.batchundelete.callback.evaluate);
	form.append({
		type: 'checkbox',
		list: [ {
			label: '如果存在已删除的讨论页，也恢复',
			name: 'undel_talk',
			value: 'undel_talk',
			checked: true
		} ]
	});
	form.append({
		type: 'input',
		name: 'reason',
		label: '理由：',
		size: 60
	});
	const statusdiv = document.createElement('div');
	statusdiv.style.padding = '15px'; // just so it doesn't look broken
	Window.setContent(statusdiv);
	Morebits.status.init(statusdiv);
	Window.display();
	const query = {
		action: 'query',
		generator: 'links',
		prop: 'info',
		inprop: 'protection',
		titles: mw.config.get('wgPageName'),
		gpllimit: Twinkle.getPref('batchMax'),
		format: 'json'
	};
	const statelem = new Morebits.status('抓取页面列表');
	const qiuwen_api = new Morebits.wiki.api('加载中……', query, function (apiobj) {
		const response = apiobj.getResponse();
		let pages = response.query && response.query.pages || [];
		pages = pages.filter(function (page) {
			return page.missing;
		});
		const list = [];
		pages.sort(Twinkle.sortByNamespace);
		pages.forEach(function (page) {
			const editProt = page.protection.filter(function (pr) {
				return pr.type === 'create' && pr.level === 'sysop';
			}).pop();
			const title = page.title;
			list.push({
				label: title + (editProt ? '（全保护' + (editProt.expiry === 'infinity' ? '无限期' : '，' + new Morebits.date(editProt.expiry).calendar('utc') + ' (UTC) 过期') + ')' : ''),
				value: title,
				checked: true,
				style: editProt ? 'color:red' : ''
			});
		});
		apiobj.params.form.append({
			type: 'header',
			label: '待恢复页面'
		});
		apiobj.params.form.append({
			type: 'button',
			label: '全选',
			event: function (e) {
				$(Morebits.quickForm.getElements(e.target.form, 'pages')).prop('checked', true);
			}
		});
		apiobj.params.form.append({
			type: 'button',
			label: '全不选',
			event: function (e) {
				$(Morebits.quickForm.getElements(e.target.form, 'pages')).prop('checked', false);
			}
		});
		apiobj.params.form.append({
			type: 'checkbox',
			name: 'pages',
			shiftClickSupport: true,
			list: list
		});
		apiobj.params.form.append({
			type: 'submit'
		});
		const result = apiobj.params.form.render();
		apiobj.params.Window.setContent(result);
		Morebits.quickForm.getElements(result, 'pages').forEach(Twinkle.generateArrowLinks);
	}, statelem);
	qiuwen_api.params = {
		form: form,
		Window: Window
	};
	qiuwen_api.post();
};
Twinkle.batchundelete.callback.evaluate = function (event) {
	Morebits.wiki.actionCompleted.notice = '恢复已完成';
	const numProtected = Morebits.quickForm.getElements(event.target, 'pages').filter(function (element) {
		return element.checked && element.nextElementSibling.style.color === 'red';
	}).length;
	if (numProtected > 0 && !confirm('您正要恢复 ' + numProtected + ' 个全保护页面，您确定吗？')) {
		return;
	}
	const input = Morebits.quickForm.getInputData(event.target);
	if (!input.reason) {
		alert('您需要指定理由。');
		return;
	}
	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(event.target);
	if (!input.pages || !input.pages.length) {
		Morebits.status.error('错误', '没什么要恢复的，取消操作');
		return;
	}
	const pageUndeleter = new Morebits.batchOperation('恢复页面');
	pageUndeleter.setOption('chunkSize', Twinkle.getPref('batchChunks'));
	pageUndeleter.setOption('preserveIndividualStatusLines', true);
	pageUndeleter.setPageList(input.pages);
	pageUndeleter.run(function (pageName) {
		const params = {
			page: pageName,
			undel_talk: input.undel_talk,
			reason: input.reason,
			pageUndeleter: pageUndeleter
		};
		const qiuwen_page = new Morebits.wiki.page(pageName, '恢复页面' + pageName);
		qiuwen_page.setCallbackParameters(params);
		qiuwen_page.setEditSummary(input.reason + ' (批量)');
		qiuwen_page.setChangeTags(Twinkle.changeTags);
		qiuwen_page.suppressProtectWarning();
		qiuwen_page.setMaxRetries(3); // temporary increase from 2 to make batchundelete more likely to succeed
		qiuwen_page.undeletePage(Twinkle.batchundelete.callbacks.doExtras, pageUndeleter.workerFailure);
	});
};
Twinkle.batchundelete.callbacks = {
	// this stupid parameter name is a temporary thing until I implement an overhaul
	// of Morebits.wiki.* callback parameters
	doExtras: function (thingWithParameters) {
		const params = thingWithParameters.parent ? thingWithParameters.parent.getCallbackParameters() : thingWithParameters.getCallbackParameters();
		// the initial batch operation's job is to delete the page, and that has
		// succeeded by now
		params.pageUndeleter.workerSuccess(thingWithParameters);
		let query, qiuwen_api;
		if (params.undel_talk) {
			const talkpagename = new mw.Title(params.page).getTalkPage().getPrefixedText();
			if (talkpagename !== params.page) {
				query = {
					action: 'query',
					prop: 'deletedrevisions',
					drvprop: 'ids',
					drvlimit: 1,
					titles: talkpagename,
					format: 'json'
				};
				qiuwen_api = new Morebits.wiki.api('检查讨论页的已删版本', query, Twinkle.batchundelete.callbacks.undeleteTalk);
				qiuwen_api.params = params;
				qiuwen_api.params.talkPage = talkpagename;
				qiuwen_api.post();
			}
		}
	},
	undeleteTalk: function (apiobj) {
		const page = apiobj.getResponse().query.pages[0];
		const exists = !page.missing;
		const delrevs = page.deletedrevisions && page.deletedrevisions[0].revid;
		if (exists || !delrevs) {
			// page exists or has no deleted revisions; forget about it
			return;
		}
		const talkpage = new Morebits.wiki.page(apiobj.params.talkPage, '正在恢复' + apiobj.params.page + '的讨论页');
		talkpage.setEditSummary('恢复“' + apiobj.params.page + '”的[[Help:讨论页|讨论页]]');
		page.setChangeTags(Twinkle.changeTags);
		talkpage.setChangeTags(Twinkle.changeTags);
		talkpage.undeletePage();
	}
};
Twinkle.addInitCallback(Twinkle.batchundelete, 'batchundelete');
})(jQuery);
/* </nowiki> */
