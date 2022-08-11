// <nowiki>
/**
 * Twinkle.js - twinklecopyvio.js
 * © 2011-2022 English Wikipedia Contributors
 * © 2011-2021 Chinese Wikipedia Contributors
 * © 2021-     Qiuwen Baike Contributors
 * This work is licensed under a Creative Commons
 * Attribution-ShareAlike 3.0 Unported License.
 * https://creativecommons.org/licenses/by-sa/3.0/
 */

(function($) { // eslint-disable-line no-unused-vars


/*
 ****************************************
 *** twinklecopyvio.js: Copyvio module
 ****************************************
 * Mode of invocation:     Tab ("Copyvio")
 * Active on:              Existing, non-special pages, except for file pages with no local (non-Commons) file which are not redirects
 * Config directives in:   TwinkleConfig
 */

Twinkle.copyvio = function twinklecopyvio() {
	// Disable on:
	// * special pages
	// * non-existent pages
	// * files on Commons, whether there is a local page or not (unneeded local pages of files on Commons are eligible for CSD F2)
	// * file pages without actual files (these are eligible for CSD G8)
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId') || (mw.config.get('wgNamespaceNumber') === 6 && (document.getElementById('mw-sharedupload') || (!document.getElementById('mw-imagepage-section-filehistory') && !Morebits.isPageRedirect())))) {
		return;
	}
	Twinkle.addPortletLink(Twinkle.copyvio.callback, '侵权', 'tw-copyvio', '提报侵权页面', '');
};

Twinkle.copyvio.callback = function twinklecopyvioCallback() {
	var Window = new Morebits.simpleWindow(600, 350);
	Window.setTitle('提报侵权页面');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('常见错误', 'Qiuwen:管理员错误自查表/侵权处理');
	Window.addFooterLink('参数设置', 'H:TW/PREF#copyvio');
	Window.addFooterLink('帮助文档', 'H:TW/DOC#copyvio');
	Window.addFooterLink('问题反馈', 'HT:TW');

	var form = new Morebits.quickForm(Twinkle.copyvio.callback.evaluate);
	form.append({
		type: 'textarea',
		label: '侵权来源：',
		name: 'source'
	}
	);
	form.append({
		type: 'checkbox',
		list: [
			{
				label: '通知页面创建者',
				value: 'notify',
				name: 'notify',
				tooltip: '在页面创建者讨论页上放置一通知模板。',
				checked: true
			}
		]
	}
	);
	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();
};

Twinkle.copyvio.callbacks = {
	tryTagging: function (pageobj) {
		// 先尝试标记页面，如果发现已经标记则停止提报
		var text = pageobj.getPageText();

		if (text.indexOf('{{Copyvio|') === -1) {
			Twinkle.copyvio.callbacks.taggingArticle(pageobj);

			// Contributor specific edits
			var qiuwen_page = new Morebits.wiki.page(mw.config.get('wgPageName'));
			qiuwen_page.setCallbackParameters(pageobj.getCallbackParameters());
			qiuwen_page.lookupCreation(Twinkle.copyvio.callbacks.main);
		} else {
			Morebits.status.error('错误', '页面已经标记侵权，请人工确认是否已经提报。');
		}
	},
	main: function(pageobj) {
		// this is coming in from lookupCreation...!
		var params = pageobj.getCallbackParameters();
		var initialContrib = pageobj.getCreator();

		// Adding discussion
		var qiuwen_page = new Morebits.wiki.page(params.logpage, '加入侵权记录项');
		qiuwen_page.setFollowRedirect(true);
		qiuwen_page.setCallbackParameters(params);
		qiuwen_page.load(Twinkle.copyvio.callbacks.copyvioList);

		// Notification to first contributor
		if (params.usertalk) {
			var usertalkpage = new Morebits.wiki.page('User talk:' + initialContrib, '通知页面创建者（');
			var notifytext = '\n{{subst:CopyvioNotice|' + mw.config.get('wgPageName') + '}}';
			usertalkpage.setAppendText(notifytext);
			usertalkpage.setEditSummary('通知：页面[[' + mw.config.get('wgPageName') + ']]疑似侵犯著作权');
			usertalkpage.setChangeTags(Twinkle.changeTags);
			usertalkpage.setCreateOption('recreate');
			usertalkpage.setWatchlist(Twinkle.getPref('copyvioWatchUser'));
			usertalkpage.setFollowRedirect(true, false);
			usertalkpage.append();
		}
	},
	taggingArticle: function(pageobj) {
		var params = pageobj.getCallbackParameters();
		var revisionId = mw.config.get('wgRevisionId') || mw.config.get('wgDiffNewId') || mw.config.get('wgCurRevisionId');
		var tag = '{{subst:Copyvio/auto|url=' + params.source.replace(/http/g, '&#104;ttp').replace(/\n+/g, '\n').replace(/^\s*([^*])/gm, '* $1').replace(/^\* $/m, '') + '|OldRevision=' + revisionId + '}}';
		var text = pageobj.getPageText();
		var oldcsd = text.match(/\{\{\s*(db(-\w*)?|d|delete)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}/i);
		if (oldcsd && confirm('在页面上找到快速删除模板，要保留吗？\n\n当页面同时侵犯著作权又符合快速删除标准时，应该优先走快速删除程序。\n单击“确认”以保留快速删除模板，若您认为快速删除理由不合，单击“取消”以移除快速删除模板。')) {
			tag = oldcsd[0] + '\n' + tag;
		}

		pageobj.setPageText(tag);
		pageobj.setEditSummary('本页面疑似侵犯著作权');
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setWatchlist(Twinkle.getPref('copyvioWatchPage'));
		// pageobj.setCreateOption('recreate');
		pageobj.save();

		if (Twinkle.getPref('markCopyvioPagesAsPatrolled')) {
			pageobj.patrol();
		}
	},
	copyvioList: function(pageobj) {
		var text = pageobj.getPageText();
		var output = '';
		var date = new Date();

		var dateHeaderRegex = new RegExp('^===+\\s*' + (date.getUTCMonth() + 1) + '月' + date.getUTCDate() + '日' +
			'\\s*===+', 'mg');

		if (!dateHeaderRegex.exec(text)) {
			output = '\n\n===' + (date.getUTCMonth() + 1) + '月' + date.getUTCDate() + '日' + '===';
		}

		output += '\n{{subst:CopyvioVFDRecord|' + mw.config.get('wgPageName') + '}}';
		pageobj.setAppendText(output);
		pageobj.setEditSummary('加入[[' + mw.config.get('wgPageName') + ']]');
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setCreateOption('recreate');
		pageobj.append();
	}
};


Twinkle.copyvio.callback.evaluate = function(e) {
	mw.config.set('wgPageName', mw.config.get('wgPageName').replace(/_/g, ' '));  // for queen/king/whatever and country!

	var source = e.target.source.value;
	var usertalk = e.target.notify.checked;

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(e.target);

	if (!source.trim()) {
		Morebits.status.error('错误', '未指定侵权来源');
		return;
	}

	var query, qiuwen_page, qiuwen_api, logpage, params; // eslint-disable-line no-unused-vars
	logpage = 'Qiuwen:頁面存廢討論/疑似侵權';
	params = { source: source, logpage: logpage, usertalk: usertalk };

	Morebits.wiki.addCheckpoint();
	// Updating data for the action completed event
	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = '提报完成，将在几秒内刷新页面';

	// Tagging file
	qiuwen_page = new Morebits.wiki.page(mw.config.get('wgPageName'), '加入侵权模板到页面');
	qiuwen_page.setCallbackParameters(params);
	qiuwen_page.load(Twinkle.copyvio.callbacks.tryTagging);

	Morebits.wiki.removeCheckpoint();
};

Twinkle.addInitCallback(Twinkle.copyvio, 'copyvio');
})(jQuery);


// </nowiki>
