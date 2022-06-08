// <nowiki>
/**
 * Twinkle.js - twinklebatchundelete.js
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
 *** twinklebatchundelete.js: Batch undelete module
 ****************************************
 * Mode of invocation:     Tab ("Und-batch")
 * Active on:              Existing user and project pages
 */


Twinkle.batchundelete = function twinklebatchundelete() {
	if (!Morebits.userIsSysop || !mw.config.get('wgArticleId') || (
		mw.config.get('wgNamespaceNumber') !== mw.config.get('wgNamespaceIds').user &&
		mw.config.get('wgNamespaceNumber') !== mw.config.get('wgNamespaceIds').project)) {
		return;
	}
	Twinkle.addPortletLink(Twinkle.batchundelete.callback, '批复', 'tw-batch-undel', '反删除页面');
};

Twinkle.batchundelete.callback = function twinklebatchundeleteCallback() {
	var Window = new Morebits.simpleWindow(600, 400);
	Window.setScriptName('Twinkle');
	Window.setTitle('批量反删除');
	Window.addFooterLink('帮助文档', 'H:TW/DOC#batchundelete');
	Window.addFooterLink('问题反馈', 'HT:TW');

	var form = new Morebits.quickForm(Twinkle.batchundelete.callback.evaluate);
	form.append({
		type: 'checkbox',
		list: [
			{
				label: '如果存在已删除的讨论页，也恢复',
				name: 'undel_talk',
				value: 'undel_talk',
				checked: true
			}
		]
	});
	form.append({
		type: 'input',
		name: 'reason',
		label: '理由：',
		size: 60
	});

	var statusdiv = document.createElement('div');
	statusdiv.style.padding = '15px';  // just so it doesn't look broken
	Window.setContent(statusdiv);
	Morebits.status.init(statusdiv);
	Window.display();

	var query = {
		action: 'query',
		generator: 'links',
		prop: 'info',
		inprop: 'protection',
		titles: mw.config.get('wgPageName'),
		gpllimit: Twinkle.getPref('batchMax'),
		format: 'json'
	};
	var statelem = new Morebits.status('抓取页面列表');
	var qiuwen_api = new Morebits.wiki.api('加载中…', query, function(apiobj) {
		var response = apiobj.getResponse();
		var pages = (response.query && response.query.pages) || [];
		pages = pages.filter(function(page) {
			return page.missing;
		});
		var list = [];
		pages.sort(Twinkle.sortByNamespace);
		pages.forEach(function(page) {
			var editProt = page.protection.filter(function(pr) {
				return pr.type === 'create' && pr.level === 'sysop';
			}).pop();

			var title = page.title;
			list.push({
				label: title + (editProt ? '（全保护' +
					(editProt.expiry === 'infinity' ? '无限期' : '，' + new Morebits.date(editProt.expiry).calendar('utc') + ' (UTC) 过期') + ')' : ''),
				value: title,
				checked: true,
				style: editProt ? 'color:red' : ''
			});
		});
		apiobj.params.form.append({ type: 'header', label: '待恢复页面' });
		apiobj.params.form.append({
			type: 'button',
			label: '全选',
			event: function(e) {
				$(Morebits.quickForm.getElements(e.target.form, 'pages')).prop('checked', true);
			}
		});
		apiobj.params.form.append({
			type: 'button',
			label: '全不选',
			event: function(e) {
				$(Morebits.quickForm.getElements(e.target.form, 'pages')).prop('checked', false);
			}
		});
		apiobj.params.form.append({
			type: 'checkbox',
			name: 'pages',
			shiftClickSupport: true,
			list: list
		});
		apiobj.params.form.append({ type: 'submit' });

		var result = apiobj.params.form.render();
		apiobj.params.Window.setContent(result);

		Morebits.quickForm.getElements(result, 'pages').forEach(Twinkle.generateArrowLinks);

	}, statelem);
	qiuwen_api.params = { form: form, Window: Window };
	qiuwen_api.post();
};

Twinkle.batchundelete.callback.evaluate = function(event) {
	Morebits.wiki.actionCompleted.notice = '反删除已完成';

	var numProtected = Morebits.quickForm.getElements(event.target, 'pages').filter(function(element) {
		return element.checked && element.nextElementSibling.style.color === 'red';
	}).length;
	if (numProtected > 0 && !confirm('您正要反删除 ' + numProtected + ' 个全保护页面，您确定吗？')) {
		return;
	}

	var input = Morebits.quickForm.getInputData(event.target);

	if (!input.reason) {
		alert('您需要指定理由。');
		return;
	}
	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(event.target);

	if (!input.pages || !input.pages.length) {
		Morebits.status.error('错误', '没什么要反删除的，取消操作');
		return;
	}

	var pageUndeleter = new Morebits.batchOperation('反删除页面');
	pageUndeleter.setOption('chunkSize', Twinkle.getPref('batchChunks'));
	pageUndeleter.setOption('preserveIndividualStatusLines', true);
	pageUndeleter.setPageList(input.pages);
	pageUndeleter.run(function(pageName) {
		var params = {
			page: pageName,
			undel_talk: input.undel_talk,
			reason: input.reason,
			pageUndeleter: pageUndeleter
		};

		var qiuwen_page = new Morebits.wiki.page(pageName, '反删除页面' + pageName);
		qiuwen_page.setCallbackParameters(params);
		qiuwen_page.setEditSummary(input.reason + ' (批量)');
		qiuwen_page.setChangeTags(Twinkle.changeTags);
		qiuwen_page.suppressProtectWarning();
		qiuwen_page.setMaxRetries(3); // temporary increase from 2 to make batchundelete more likely to succeed [[phab:T222402]] #613
		qiuwen_page.undeletePage(Twinkle.batchundelete.callbacks.doExtras, pageUndeleter.workerFailure);
	});
};

Twinkle.batchundelete.callbacks = {
	// this stupid parameter name is a temporary thing until I implement an overhaul
	// of Morebits.wiki.* callback parameters
	doExtras: function(thingWithParameters) {
		var params = thingWithParameters.parent ? thingWithParameters.parent.getCallbackParameters() :
			thingWithParameters.getCallbackParameters();
		// the initial batch operation's job is to delete the page, and that has
		// succeeded by now
		params.pageUndeleter.workerSuccess(thingWithParameters);

		var query, qiuwen_api;

		if (params.undel_talk) {
			var talkpagename = new mw.Title(params.page).getTalkPage().getPrefixedText();
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
	undeleteTalk: function(apiobj) {
		var page = apiobj.getResponse().query.pages[0];
		var exists = !page.missing;
		var delrevs = page.deletedrevisions && page.deletedrevisions[0].revid;

		if (exists || !delrevs) {
			// page exists or has no deleted revisions; forget about it
			return;
		}

		var talkpage = new Morebits.wiki.page(apiobj.params.talkPage, '正在反删除' + apiobj.params.page + '的讨论页');
		talkpage.setEditSummary('反删除“' + apiobj.params.page + '”的[[Help:讨论页|讨论页]]');
		page.setChangeTags(Twinkle.changeTags);
		talkpage.setChangeTags(Twinkle.changeTags);
		talkpage.undeletePage();
	}
};

Twinkle.addInitCallback(Twinkle.batchundelete, 'batchundelete');
})(jQuery);


// </nowiki>
