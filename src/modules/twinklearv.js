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
/* Twinkle.js - twinklearv.js */
/* <nowiki> */
(($) => {
/**
 * twinklearv.js: ARV module
 * Mode of invocation:  Tab ("ARV")
 * Active on:           Any page with relevant user name (userspace, contribs, etc.)
 */

Twinkle.arv = () => {
	const username = mw.config.get('wgRelevantUserName');
	if (!username || username === mw.config.get('wgUserName')) {
		return;
	}
	const windowTitle = mw.util.isIPAddress(username) ? '报告IP地址给管理员' : '报告用户给管理员';
	Twinkle.addPortletLink(() => {
		Twinkle.arv.callback(username);
	}, '告状', 'tw-arv', windowTitle);
};
Twinkle.arv.callback = (uid) => {
	if (uid === mw.config.get('wgUserName')) {
		alert('不可以告自己的状哦！');
		return;
	}
	const Window = new Morebits.simpleWindow(600, 500);
	Window.setTitle('报告用户给管理员'); // Backronym
	Window.setScriptName('Twinkle');
	Window.addFooterLink('AIV指引', 'QW:GAIV');
	Window.addFooterLink('UAA指引', 'QW:UAAI');
	Window.addFooterLink('SPI指引', 'Qiuwen:傀儡调查');
	Window.addFooterLink('参数设置', 'H:TW/PREF#arv');
	Window.addFooterLink('帮助文档', 'H:TW/DOC#arv');
	Window.addFooterLink('问题反馈', 'HT:TW');
	const form = new Morebits.quickForm(Twinkle.arv.callback.evaluate);
	const categories = form.append({
		type: 'select',
		name: 'category',
		label: '选择报告类型：',
		event: Twinkle.arv.callback.changeCategory
	});
	categories.append({
		type: 'option',
		label: '破坏 (QW:AIV)',
		value: 'aiv'
	});
	categories.append({
		type: 'option',
		label: '傀儡 - 主账号(QW:SPI)',
		value: 'sock'
	});
	categories.append({
		type: 'option',
		label: '傀儡 - 傀儡账号 (QW:SPI)',
		value: 'puppet'
	});
	form.append({
		type: 'div',
		label: '',
		style: 'color: red',
		id: 'twinkle-arv-blockwarning'
	});
	form.append({
		type: 'field',
		label: 'Work area',
		name: 'work_area'
	});
	form.append({
		type: 'submit',
		label: '提交'
	});
	form.append({
		type: 'hidden',
		name: 'uid',
		value: uid
	});
	const result = form.render();
	Window.setContent(result);
	Window.display();

	// Check if the user is blocked, update notice
	const query = {
		action: 'query',
		list: 'blocks',
		bkprop: 'range|flags',
		format: 'json'
	};
	query.bkusers = uid;
	new Morebits.wiki.api('检查用户的封禁状态', query, (apiobj) => {
		const blocklist = apiobj.getResponse().query.blocks;
		if (blocklist.length) {
			// If an IP is blocked *and* rangeblocked, only use whichever is more recent
			const block = blocklist[0];
			let message = '此账户已经被' + (block.partial ? '部分' : '');
			// Start and end differ, range blocked
			message += block.rangestart !== block.rangeend ? '段封禁。' : '封禁。';
			if (block.partial) {
				$('#twinkle-arv-blockwarning').css('color', 'black'); // Less severe
			}

			$('#twinkle-arv-blockwarning').text(message);
		}
	}).post();

	// We must init the
	const evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.category.dispatchEvent(evt);
};
Twinkle.arv.callback.changeCategory = (e) => {
	const value = e.target.value;
	const root = e.target.form;
	const old_area = Morebits.quickForm.getElements(root, 'work_area')[0];
	let work_area = null;
	switch (value) {
		case 'aiv':
		/* falls through */
		default:
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: '报告用户破坏',
				name: 'work_area'
			});
			work_area.append({
				type: 'input',
				name: 'page',
				label: '相关页面',
				tooltip: '如不希望让报告链接到页面，请留空',
				value: mw.util.getParamValue('vanarticle') || '',
				event: (e) => {
					const value = e.target.value;
					const root = e.target.form;
					if (value === '') {
						root.badid.disabled = root.goodid.disabled = true;
					} else {
						root.badid.disabled = false;
						root.goodid.disabled = root.badid.value === '';
					}
				}
			});
			work_area.append({
				type: 'input',
				name: 'badid',
				label: '受到破坏的修订版本：',
				tooltip: '留空以略过差异',
				value: mw.util.getParamValue('vanarticlerevid') || '',
				disabled: !mw.util.getParamValue('vanarticle'),
				event: (e) => {
					const value = e.target.value;
					const root = e.target.form;
					root.goodid.disabled = value === '';
				}
			});
			work_area.append({
				type: 'input',
				name: 'goodid',
				label: '破坏前的修订版本：',
				tooltip: '留空以略过差异的较早版本',
				value: mw.util.getParamValue('vanarticlegoodrevid') || '',
				disabled: !mw.util.getParamValue('vanarticle') || mw.util.getParamValue('vanarticlerevid')
			});
			work_area.append({
				type: 'checkbox',
				name: 'arvtype',
				list: [ {
					label: '已发出最后（层级4或4im）警告',
					value: 'final'
				}, {
					label: '封禁过期后随即破坏',
					value: 'postblock'
				}, {
					label: '显而易见的纯破坏用户',
					value: 'vandalonly'
				}, {
					label: '仅用来散发广告宣传的用户',
					value: 'promoonly'
				}, {
					label: '显而易见的spambot或失窃账户',
					value: 'spambot'
				} ]
			});
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: '评论：'
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;

		// not using, but keeping it for reference
		case 'username':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: '报告不当用户名',
				name: 'work_area'
			});
			work_area.append({
				type: 'header',
				label: '不当用户名类型'
			});
			work_area.append({
				type: 'checkbox',
				name: 'arvtype',
				list: [ {
					label: '误导性用户名',
					value: 'misleading',
					tooltip: '不得通过用户名暗示或让人误以为您在求闻百科有某种权限'
				}, {
					label: '宣传性用户名',
					value: 'promotional',
					tooltip: '不得注册宣传性用户名，不得以组织名义注册账号。不得以用户名宣扬特定政治及宗教观点。'
				}, {
					label: '违背公序良俗的用户名',
					value: 'illegal',
					tooltip: '包括但不限于：违反法律规定的用户名，可能引发严重争议的用户名，仿冒他人的用户名，侮辱性或破坏性用户名等'
				}, {
					label: '司法机关认定的驰名商标或包含其他为社会公众所熟知的商标',
					value: 'trademark'
				}, {
					label: '域名、电子邮件地址。',
					value: 'domain'
				} ]
			});
			work_area.append({
				type: 'textarea',
				name: 'reason',
				label: '评论：'
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'puppet':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: '提报傀儡账号',
				name: 'work_area'
			});
			work_area.append({
				type: 'input',
				name: 'sockmaster',
				label: '主账号',
				tooltip: '傀儡主账号的用户名（不带User:前缀）'
			});
			work_area.append({
				type: 'textarea',
				label: '证据：',
				name: 'evidence',
				tooltip: '输入能够用来体现这些用户可能滥用多重账户的证据，这通常包括互助客栈发言、页面历史或其他有关的信息。请避免在此处提供非与傀儡或滥用多重账户相关的其他讨论。'
			});
			work_area.append({
				type: 'checkbox',
				list: [ {
					label: '请求用户查核',
					name: 'checkuser',
					tooltip: '用户查核是一种用于获取傀儡指控相关技术证据的工具，若没有正当理由则不会使用，您必须在证据字段充分解释为什么需要使用该工具。用户查核不会用于公开连接用户账户使用的IP地址。'
				} ]
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
		case 'sock':
			work_area = new Morebits.quickForm.element({
				type: 'field',
				label: '提报傀儡主账号',
				name: 'work_area'
			});
			work_area.append({
				type: 'dyninput',
				name: 'sockpuppet',
				label: '傀儡账号',
				sublabel: '用户名：',
				tooltip: '傀儡账号的用户名（不带User:前缀）',
				min: 2
			});
			work_area.append({
				type: 'textarea',
				label: '证据：',
				name: 'evidence',
				tooltip: '输入能够用来体现这些用户可能滥用多重账户的证据，这通常包括互助客栈发言、页面历史或其他有关的信息。请避免在此处提供非与傀儡或滥用多重账户相关的其他讨论。'
			});
			work_area.append({
				type: 'checkbox',
				list: [ {
					label: '请求用户查核',
					name: 'checkuser',
					tooltip: '用户查核是一种用于获取傀儡指控相关技术证据的工具，若没有正当理由则不会使用，您必须在证据字段充分解释为什么需要使用该工具。用户查核不会用于公开连接用户账户使用的IP地址。'
				} ]
			});
			work_area = work_area.render();
			old_area.parentNode.replaceChild(work_area, old_area);
			break;
	}
};
Twinkle.arv.callback.evaluate = (e) => {
	const form = e.target;
	let reason = '';
	let comment = '';
	if (form.reason) {
		comment = form.reason.value;
	}
	const uid = form.uid.value;
	let types;
	switch (form.category.value) {
		// Report user for vandalism
		case 'aiv':
		/* falls through */
		default: {
			types = form.getChecked('arvtype');
			if (!types.length && comment === '') {
				alert('必须指定一个理由！');
				return;
			}
			types = types.map((v) => {
				switch (v) {
					case 'final':
						return '已发出最后警告';
					case 'postblock':
						return '封禁过期后随即破坏';
					case 'spambot':
						return '显而易见的spambot或失窃账户';
					case 'vandalonly':
						return '显而易见的纯破坏用户';
					case 'promoonly':
						return '仅用来散发广告宣传的用户';
					default:
						return '未知理由';
				}
			}).join('; ');
			if (form.page.value !== '') {
				// Allow links to redirects, files, and categories
				reason = '在 {{No redirect|:' + form.page.value + '}}';
				if (form.badid.value !== '') {
					reason += ' ({{diff|' + form.page.value + '|' + form.badid.value + '|' + form.goodid.value + '|diff}})';
				}
				reason += ':';
			}
			if (types) {
				reason += ' ' + types;
			}
			if (comment !== '') {
				reason += (reason === '' ? '' : '. ') + comment;
			}
			reason = reason.trim();
			if (!/[.?!;]$/.test(reason)) {
				reason += '.';
			}

			reason += ' ~~' + '~~';
			reason = reason.replace(/\r?\n/g, '\n*:'); // indent newlines

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);
			Morebits.wiki.actionCompleted.redirect = 'Qiuwen:当前的破坏';
			Morebits.wiki.actionCompleted.notice = '提报完成';
			const aivPage = new Morebits.wiki.page('Qiuwen:当前的破坏', '处理VIP请求');
			aivPage.setPageSection(1);
			aivPage.setFollowRedirect(true);
			aivPage.load(() => {
				const text = aivPage.getPageText();
				const $aivLink = '<a target="_blank" href="/wiki/QW:AIV">QW:AIV</a>';

				// check if user has already been reported
				if (new RegExp('\\{\\{\\s*(?:(?:[Ii][Pp])?[Vv]andal|[Uu]serlinks)\\s*\\|\\s*(?:1=)?\\s*' + Morebits.string.escapeRegExp(uid) + '\\s*\\}\\}').test(text)) {
					aivPage.getStatusElement().error('提报已存在，不会加入新提报');
					Morebits.status.printUserText(reason, '您输入的评论已在下方提供，您可以将其加入到' + $aivLink + ':');
					return;
				}
				aivPage.setPageSection(0);
				aivPage.getStatusElement().status('加入新提报');
				aivPage.setEditSummary('报告[[Special:Contributions/' + uid + '|' + uid + ']]');
				aivPage.setChangeTags(Twinkle.changeTags);
				aivPage.setAppendText('\n*{{vandal|' + (/=/.test(uid) ? '1=' : '') + uid + '}} &ndash; ' + reason);
				aivPage.append();
			});
			break;

			// Report inappropriate username
			// **not** i18n to Chinese as we pre-verify usernames
		}
		case 'username': {
			types = form.getChecked('arvtype').map(Morebits.string.toLowerCaseFirstChar);
			const hasShared = types.indexOf('shared') > -1;
			if (hasShared) {
				types.splice(types.indexOf('shared'), 1);
			}
			if (types.length <= 2) {
				types = types.join(' and ');
			} else {
				types = [ types.slice(0, -1).join(', '), types.slice(-1) ].join(' and ');
			}
			let article = 'a';
			if (/[aeiouwyh]/.test(types[0] || '')) {
				// non 100% correct, but whatever, including 'h' for Cockney
				article = 'an';
			}
			reason = '*{{user-uaa|1=' + uid + '}} &ndash; ';
			if (types.length || hasShared) {
				reason += 'Violation of the username policy as ' + article + ' ' + types + ' username' + (hasShared ? ' that implies shared use. ' : '. ');
			}
			if (comment !== '') {
				reason += Morebits.string.toUpperCaseFirstChar(comment) + '. ';
			}

			reason += '~~' + '~~';
			reason = reason.replace(/\r?\n/g, '\n*:'); // indent newlines

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);
			Morebits.wiki.actionCompleted.redirect = 'Qiuwen:Usernames for administrator attention';
			Morebits.wiki.actionCompleted.notice = 'Reporting complete';
			const uaaPage = new Morebits.wiki.page('Qiuwen:Usernames for administrator attention', 'Processing UAA request');
			uaaPage.setFollowRedirect(true);
			uaaPage.load(() => {
				const text = uaaPage.getPageText();

				// check if user has already been reported
				if (new RegExp('\\{\\{\\s*user-uaa\\s*\\|\\s*(1\\s*=\\s*)?' + Morebits.string.escapeRegExp(uid) + '\\s*(\\||\\})').test(text)) {
					uaaPage.getStatusElement().error('User is already listed.');
					const $uaaLink = '<a target="_blank" href="/wiki/QW:UAA">QW:UAA</a>';
					Morebits.status.printUserText(reason, 'The comments you typed are provided below, in case you wish to manually post them under the existing report for this user at ' + $uaaLink + ':');
					return;
				}
				uaaPage.getStatusElement().status('Adding new report...');
				uaaPage.setEditSummary('Reporting [[Special:Contributions/' + uid + '|' + uid + ']].');
				uaaPage.setChangeTags(Twinkle.changeTags);

				// Blank newline per [[Special:Permalink/996949310#Spacing]]; see also [[QW:LISTGAP]] and [[QW:INDENTGAP]]
				uaaPage.setPageText(text + '\n' + reason + '\n*');
				uaaPage.save();
			});
			break;

			// QW:SPI
		}
		case 'sock':
		/* falls through */
		case 'puppet': {
			const sockParameters = {
				evidence: form.evidence.value.trim(),
				checkuser: form.checkuser.checked
			};
			const puppetReport = form.category.value === 'puppet';
			if (puppetReport && !form.sockmaster.value.trim()) {
				alert('未指定主账户！');
				return;
			} else if (!puppetReport && !form.sockpuppet[0].value.trim()) {
				alert('未指定傀儡账户！');
				return;
			}
			sockParameters.uid = puppetReport ? form.sockmaster.value.trim() : uid;
			sockParameters.sockpuppets = puppetReport ? [ uid ] : Morebits.array.uniq($.map($('input:text[name=sockpuppet]', form), (o) => $(o).val() || null));
			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);
			Twinkle.arv.processSock(sockParameters);
			break;

			// not using, but keeping for reference
		}
		case 'an3': {
			const diffs = $.map($('input:checkbox[name=s_diffs]:checked', form), (o) => $(o).data('revinfo'));
			if (diffs.length < 3 && !confirm('You have selected fewer than three offending edits. Do you wish to make the report anyway?')) {
				return;
			}
			const warnings = $.map($('input:checkbox[name=s_warnings]:checked', form), (o) => $(o).data('revinfo'));
			if (!warnings.length && !confirm('You have not selected any edits where you warned the offender. Do you wish to make the report anyway?')) {
				return;
			}
			const resolves = $.map($('input:checkbox[name=s_resolves]:checked', form), (o) => $(o).data('revinfo'));
			const free_resolves = $('input[name=s_resolves_free]').val();
			const an3_next = (free_resolves) => {
				if (!resolves.length && !free_resolves && !confirm('You have not selected any edits where you tried to resolve the issue. Do you wish to make the report anyway?')) {
					return;
				}
				const an3Parameters = {
					uid: uid,
					page: form.page.value.trim(),
					comment: form.comment.value.trim(),
					diffs: diffs,
					warnings: warnings,
					resolves: resolves,
					free_resolves: free_resolves
				};
				Morebits.simpleWindow.setButtonsEnabled(false);
				Morebits.status.init(form);
				Twinkle.arv.processAN3(an3Parameters);
			};
			if (free_resolves) {
				let query;
				let diff, oldid;
				const specialDiff = /Special:Diff\/(\d+)(?:\/(\S+))?/i.exec(free_resolves);
				if (specialDiff) {
					if (specialDiff[2]) {
						oldid = specialDiff[1];
						diff = specialDiff[2];
					} else {
						diff = specialDiff[1];
					}
				} else {
					diff = mw.util.getParamValue('diff', free_resolves);
					oldid = mw.util.getParamValue('oldid', free_resolves);
				}
				const title = mw.util.getParamValue('title', free_resolves);
				const diffNum = /^\d+$/.test(diff); // used repeatedly

				// rvdiffto in prop=revisions is deprecated, but action=compare doesn't return
				// timestamps so we can't rely on it unless necessary.
				// Likewise, we can't rely on a meaningful comment for diff=cur.
				// Additionally, links like Special:Diff/123/next, Special:Diff/123/456, or ?diff=next&oldid=123
				// would each require making use of rvdir=newer in the revisions API.
				// That requires a title parameter, so we have to use compare instead of revisions.
				if (oldid && (diff === 'cur' || !title && (diff === 'next' || diffNum))) {
					query = {
						action: 'compare',
						fromrev: oldid,
						prop: 'ids|title',
						format: 'json'
					};
					if (diffNum) {
						query.torev = diff;
					} else {
						query.torelative = diff;
					}
				} else {
					query = {
						action: 'query',
						prop: 'revisions',
						rvprop: 'ids|timestamp|comment',
						format: 'json',
						indexpageids: true
					};
					if (diff && oldid) {
						if (diff === 'prev') {
							query.revids = oldid;
						} else {
							query.titles = title;
							query.rvdir = 'newer';
							query.rvstartid = oldid;
							if (diff === 'next' && title) {
								query.rvlimit = 2;
							} else if (diffNum) {
								// Diffs may or may not be consecutive, no limit
								query.rvendid = diff;
							}
						}
					} else {
						// diff=next|prev|cur with no oldid
						// Implies title= exists otherwise it's not a valid diff link (well, it is, but to the Main Page)
						if (diff && /^\D+$/.test(diff)) {
							query.titles = title;
						} else {
							query.revids = diff || oldid;
						}
					}
				}
				new mw.Api().get(query).done((data) => {
					let page;
					if (data.compare && data.compare.fromtitle === data.compare.totitle) {
						page = data;
					} else if (data.query) {
						const pageid = data.query.pageids[0];
						page = data.query.pages[pageid];
					} else {
						return;
					}
					an3_next(page);
				}).fail((data) => {
					console.log('API failed :(', data);
				});
			} else {
				an3_next();
			}
			break;
		}
	}
};
Twinkle.arv.processSock = (params) => {
	Morebits.wiki.addCheckpoint(); // prevent notification events from causing an erronous "action completed"

	// prepare the SPI report
	let text = '\n{{subst:SPI report|' + params.sockpuppets.map((sock, index) => index + 1 + '=' + sock).join('|') + '\n|evidence=' + params.evidence + ' \n';
	if (params.checkuser) {
		text += '|checkuser=yes';
	}
	text += '}}';
	const reportpage = 'Qiuwen:傀儡调查/' + params.uid;
	Morebits.wiki.actionCompleted.redirect = reportpage;
	Morebits.wiki.actionCompleted.notice = '提报完成';
	const spiPage = new Morebits.wiki.page(reportpage, '拉取讨论页面');
	spiPage.setFollowRedirect(true);
	spiPage.setEditSummary('加入对[[Special:Contributions/' + params.uid + '|' + params.uid + ']]的新提报');
	spiPage.setChangeTags(Twinkle.changeTags);
	spiPage.setAppendText(text);
	spiPage.setWatchlist(Twinkle.getPref('spiWatchReport'));
	spiPage.append();
	Morebits.wiki.removeCheckpoint(); // all page updates have been started
};

// no need to call this func as no an3 now, hence not i18n
Twinkle.arv.processAN3 = (params) => {
	// prepare the AN3 report
	let minid;
	for (let i = 0; i < params.diffs.length; ++i) {
		if (params.diffs[i].parentid && (!minid || params.diffs[i].parentid < minid)) {
			minid = params.diffs[i].parentid;
		}
	}
	new mw.Api().get({
		action: 'query',
		prop: 'revisions',
		format: 'json',
		rvprop: 'sha1|ids|timestamp|comment',
		rvlimit: 100,
		// intentionally limited
		rvstartid: minid,
		rvexcludeuser: params.uid,
		indexpageids: true,
		titles: params.page
	}).done(function (data) {
		Morebits.wiki.addCheckpoint(); // prevent notification events from causing an erronous "action completed"

		// In case an edit summary was revdel'd
		const hasHiddenComment = function (rev) {
			if (!rev.comment && typeof rev.commenthidden === 'string') {
				return '(comment hidden)';
			}
			return '"' + rev.comment + '"';
		};
		let orig;
		if (data.length) {
			const sha1 = data[0].sha1;
			for (let i = 1; i < data.length; ++i) {
				if (data[i].sha1 === sha1) {
					orig = data[i];
					break;
				}
			}
			if (!orig) {
				orig = data[0];
			}
		}
		let origtext = '';
		if (orig) {
			origtext = '{{diff2|' + orig.revid + '|' + orig.timestamp + '}} ' + hasHiddenComment(orig);
		}
		const grouped_diffs = {};
		let parentid, lastid;
		for (let j = 0; j < params.diffs.length; ++j) {
			const cur = params.diffs[j];
			if (cur.revid && cur.revid !== parentid || lastid === null) {
				lastid = cur.revid;
				grouped_diffs[lastid] = [];
			}
			parentid = cur.parentid;
			grouped_diffs[lastid].push(cur);
		}
		const difftext = $.map(grouped_diffs, function (sub) {
			let ret = '';
			if (sub.length >= 2) {
				const last = sub[0];
				const first = sub.slice(-1)[0];
				const label = 'Consecutive edits made from ' + new Morebits.date(first.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC) to ' + new Morebits.date(last.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)';
				ret = '# {{diff|oldid=' + first.parentid + '|diff=' + last.revid + '|label=' + label + '}}\n';
			}
			ret += sub.reverse().map(function (v) {
				return (sub.length >= 2 ? '#' : '') + '# {{diff2|' + v.revid + '|' + new Morebits.date(v.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)}} ' + hasHiddenComment(v);
			}).join('\n');
			return ret;
		}).reverse().join('\n');
		const warningtext = params.warnings.reverse().map(function (v) {
			return '#  {{diff2|' + v.revid + '|' + new Morebits.date(v.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)}} ' + hasHiddenComment(v);
		}).join('\n');
		let resolvetext = params.resolves.reverse().map(function (v) {
			return '#  {{diff2|' + v.revid + '|' + new Morebits.date(v.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC)}} ' + hasHiddenComment(v);
		}).join('\n');
		if (params.free_resolves) {
			const page = params.free_resolves;
			if (page.compare) {
				resolvetext += '\n#  {{diff|oldid=' + page.compare.fromrevid + '|diff=' + page.compare.torevid + '|label=Consecutive edits on ' + page.compare.totitle + '}}';
			} else if (page.revisions) {
				const revCount = page.revisions.length;
				let rev;
				if (revCount < 3) {
					// diff=prev or next
					rev = revCount === 1 ? page.revisions[0] : page.revisions[1];
					resolvetext += '\n#  {{diff2|' + rev.revid + '|' + new Morebits.date(rev.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC) on ' + page.title + '}} ' + hasHiddenComment(rev);
				} else {
					// diff and oldid are nonconsecutive
					rev = page.revisions[0];
					const revLatest = page.revisions[revCount - 1];
					const label = 'Consecutive edits made from ' + new Morebits.date(rev.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC) to ' + new Morebits.date(revLatest.timestamp).format('HH:mm, D MMMM YYYY', 'utc') + ' (UTC) on ' + page.title;
					resolvetext += '\n# {{diff|oldid=' + rev.revid + '|diff=' + revLatest.revid + '|label=' + label + '}}\n';
				}
			}
		}
		let comment = params.comment.replace(/~*$/g, '').trim();
		if (comment) {

			comment += ' ~~' + '~~';
		}
		const text = '\n\n{{subst:AN3 report|diffs=' + difftext + '|warnings=' + warningtext + '|resolves=' + resolvetext + '|pagename=' + params.page + '|orig=' + origtext + '|comment=' + comment + '|uid=' + params.uid + '}}';
		const reportpage = 'Qiuwen:Administrators\' noticeboard/Edit warring';
		Morebits.wiki.actionCompleted.redirect = reportpage;
		Morebits.wiki.actionCompleted.notice = 'Reporting complete';
		const an3Page = new Morebits.wiki.page(reportpage, 'Retrieving discussion page');
		an3Page.setFollowRedirect(true);
		an3Page.setEditSummary('Adding new report for [[Special:Contributions/' + params.uid + '|' + params.uid + ']].');
		an3Page.setChangeTags(Twinkle.changeTags);
		an3Page.setAppendText(text);
		an3Page.append();

		// notify user
		const notifyText = '\n\n{{subst:an3-notice|1=' + mw.util.wikiUrlencode(params.uid) + '|auto=1}} ~~' + '~~';
		const talkPage = new Morebits.wiki.page('User talk:' + params.uid, 'Notifying edit warrior');
		talkPage.setFollowRedirect(true);
		talkPage.setEditSummary('Notifying about edit warring noticeboard discussion.');
		talkPage.setChangeTags(Twinkle.changeTags);
		talkPage.setAppendText(notifyText);
		talkPage.append();
		Morebits.wiki.removeCheckpoint(); // all page updates have been started
	}).fail((data) => {
		console.log('API failed :(', data);
	});
};

Twinkle.addInitCallback(Twinkle.arv, 'arv');
})(jQuery);
/* </nowiki> */
