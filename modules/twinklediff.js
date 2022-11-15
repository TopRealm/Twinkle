/**
 * SPDX-License-Identifier: CC-BY-SA-4.0
 * _addText: '{{Gadget Header|license=CC-BY-SA-4.0}}'
 *
 * @url https://git.qiuwen.wiki/qiuwen/twinkle-new
 * @author © 2011-2022 English Wikipedia Contributors
 * @author © 2011-2021 Chinese Wikipedia Contributors
 * @author © 2021-     Qiuwen Baike Contributors
 * @license <https://creativecommons.org/licenses/by-sa/4.0/>
 */
/**
 * Twinkle.js - twinklediff.js
 * © 2011-2022 English Wikipedia Contributors
 * © 2011-2021 Chinese Wikipedia Contributors
 * © 2021-     Qiuwen Baike Contributors
 * This work is licensed under a Creative Commons
 * Attribution-ShareAlike 4.0 International License.
 * https://creativecommons.org/licenses/by-sa/4.0/
 */
// <nowiki>
(function ($) {

/*
	 ****************************************
	 *** twinklediff.js: Diff module
	 ****************************************
	 * Mode of invocation:     Tab on non-diff pages ("Last"); tabs on diff pages ("Since", "Since mine", "Current")
	 * Active on:              Existing non-special pages
	 */

Twinkle.diff = function twinklediff() {
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId')) {
		return;
	}
	Twinkle.addPortletLink(mw.util.getUrl(mw.config.get('wgPageName'), { diff: 'cur', oldid: 'prev' }), '最后', 'tw-lastdiff', '显示最后一次差异');

	// Show additional tabs only on diff pages
	if (mw.util.getParamValue('diff')) {
		Twinkle.addPortletLink(function () {
			Twinkle.diff.evaluate(false);
		}, '上异', 'tw-since', '显示与上一修订版本间的差异');
		Twinkle.addPortletLink(function () {
			Twinkle.diff.evaluate(true);
		}, '自异', 'tw-sincemine', '显示与我做出的修订版本的差异');

		var oldid = /oldid=(.+)/.exec($('#mw-diff-ntitle1').find('strong a').first().attr('href'))[1];
		Twinkle.addPortletLink(mw.util.getUrl(mw.config.get('wgPageName'), { diff: 'cur', oldid: oldid }), '当前', 'tw-curdiff', '显示与当前版本间的差异');
	}
};

Twinkle.diff.evaluate = function twinklediffEvaluate(me) {

	var user;
	if (me) {
		user = mw.config.get('wgUserName');
	} else {
		var node = document.getElementById('mw-diff-ntitle2');
		if (!node) {
			// nothing to do?
			return;
		}
		user = $(node).find('a').first().text();
	}
	var query = {
		prop: 'revisions',
		action: 'query',
		titles: mw.config.get('wgPageName'),
		rvlimit: 1,
		rvprop: [ 'ids', 'user' ],
		rvstartid: mw.config.get('wgCurRevisionId') - 1, // i.e. not the current one
		rvuser: user,
		format: 'json'
	};
	Morebits.status.init(document.getElementById('mw-content-text'));
	var qiuwen_api = new Morebits.wiki.api('抓取最初贡献者信息', query, Twinkle.diff.callbacks.main);
	qiuwen_api.params = { user: user };
	qiuwen_api.post();
};

Twinkle.diff.callbacks = {
	main: function (self) {
		var rev = self.response.query.pages[0].revisions;
		var revid = rev && rev[0].revid;

		if (!revid) {
			self.statelem.error('未找到合适的早期版本，或 ' + self.params.user + ' 是唯一贡献者。取消。');
			return;
		}
		window.location = mw.util.getUrl(mw.config.get('wgPageName'), {
			diff: mw.config.get('wgCurRevisionId'),
			oldid: revid
		});
	}
};

Twinkle.addInitCallback(Twinkle.diff, 'diff');
}(jQuery));

// </nowiki>
