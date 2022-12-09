/**
 * SPDX-License-Identifier: CC-BY-SA-4.0
 * _addText: '{{Gadget Header|license=CC-BY-SA-4.0}}'
 *
 * @source https://git.qiuwen.wiki/qiuwen/Twinkle
 * @author © 2011-2022 English Wikipedia Contributors
 * @author © 2011-2021 Chinese Wikipedia Contributors
 * @author © 2021-     Qiuwen Baike Contributors
 * @license <https://creativecommons.org/licenses/by-sa/4.0/>
 */
/* Twinkle.js - twinkleclose.js */
/* <nowiki> */
(function ($) {
/*
 ****************************************
 *** twinkleclose.js: XFD closing module
 ****************************************
 * Mode of invocation:    Links after section heading
 * Active on:             AfD dated archive pages
 * Config directives in:  TwinkleConfig
 */

Twinkle.close = function twinkleclose() {
	if (Twinkle.getPref('XfdClose') === 'hide' || !/^Qiuwen:存废讨论\/记录\/\d+\/\d+\/\d+$/.test(mw.config.get('wgPageName'))) {
		return;
	}
	mw.hook('wikipage.content').add(function (item) {
		if (item.attr('id') === 'mw-content-text') {
			Twinkle.close.addLinks();
		}
	});
};
Twinkle.close.addLinks = function twinklecloseAddLinks() {
	var spanTag = function (color, content) {
		var span = document.createElement('span');
		span.style.color = color;
		span.appendChild(document.createTextNode(content));
		return span;
	};
	$('h1:has(.mw-headline),h2:has(.mw-headline),h3:has(.mw-headline),h4:has(.mw-headline),h5:has(.mw-headline),h6:has(.mw-headline)', '#bodyContent').each(function (index, current) {
		current.setAttribute('data-section', index + 1);
	});
	var selector = ':has(.mw-headline a:only-of-type):not(:has(+ div.NavFrame))';
	var titles = $('#bodyContent').find('h2' + selector + ':not(:has(+ p + h3)), h3' + selector); // really needs to work on

	var delNode = document.createElement('strong');
	var delLink = document.createElement('a');
	delLink.appendChild(spanTag('Black', '['));
	delLink.appendChild(spanTag('Red', '关闭讨论'));
	delLink.appendChild(spanTag('Black', ']'));
	delNode.appendChild(delLink);
	titles.each(function (key, current) {
		var headlinehref = $(current).find('.mw-headline a').attr('href');
		if (headlinehref === undefined) {
			return;
		}
		var title = null;
		if (headlinehref.indexOf('redlink=1') !== -1) {
			title = headlinehref.slice(19, -22);
		} else {
			var m = headlinehref.match(/\/wiki\/([^?]+)/, '$1');
			if (m !== null) {
				title = m[1];
			}
		}
		if (title === null) {
			return;
		}
		title = decodeURIComponent(title);
		title = title.replace(/_/g, ' '); // Normalize for using in interface and summary
		var pagenotexist = $(current).find('.mw-headline a').hasClass('new');
		var section = current.getAttribute('data-section');
		var node = current.getElementsByClassName('mw-headline')[0];
		node.appendChild(document.createTextNode(' '));
		var tmpNode = delNode.cloneNode(true);
		tmpNode.firstChild.href = '#' + section;
		$(tmpNode.firstChild).on('click', function () {
			Twinkle.close.callback(title, section, pagenotexist);
			return false;
		});
		node.appendChild(tmpNode);
	});
};

// Keep this synchronized with {{delh}}
/* eslint-disable quote-props */
Twinkle.close.codes = {
	'请求无效': {
		ir: {
			label: '请求无效',
			action: 'keep'
		},
		rep: {
			label: '重复提出，无效',
			action: 'keep'
		},
		ne: {
			label: '目标页面或档案不存在，无效',
			action: 'keep'
		},
		nq: {
			label: '提删者未取得提删资格，无效',
			action: 'keep'
		}
	},
	'保留': {
		k: {
			label: '保留',
			action: 'keep',
			adminonly: true
		},
		sk: {
			label: '快速保留',
			action: 'keep'
		},
		tk: {
			label: '暂时保留',
			action: 'keep'
		},
		rr: {
			label: '请求理由消失',
			action: 'keep',
			selected: Twinkle.getPref('XfdClose') === 'nonadminonly'
		},
		dan: {
			label: '删后重建',
			action: 'keep',
			adminonly: true
		}
	},
	'删除': {
		d: {
			label: '删除',
			action: 'del',
			adminonly: true,
			selected: Twinkle.getPref('XfdClose') === 'all'
		},
		ic: {
			label: '图像因侵权被删',
			action: 'del',
			adminonly: true
		}
	},
	'快速删除': {
		sd: {
			label: '快速删除',
			action: 'del'
		},
		lssd: {
			label: '无来源或版权资讯，快速删除',
			action: 'del'
		},
		svg: {
			label: '已改用SVG图形，快速删除',
			action: 'del'
		},
		drep: {
			label: '多次被删除，条目锁定',
			action: 'del',
			adminonly: true
		}
	},
	/* '转移至其他计划': {
             		twc: {
             			label: '转移至求闻共享资源',
             			action: 'noop',
             			adminonly: true
             		},
             		two: {
             			label: '转移至其他计划',
             			action: 'noop',
             			adminonly: true
             		}
             	}, */
	'其他处理方法': {
		c: {
			label: '转交侵权',
			action: 'noop'
		},
		'm2pfd': {
			label: '转送存废讨论',
			action: 'noop'
		},
		r: {
			label: '重定向',
			action: 'keep',
			adminonly: true
		},
		cr: {
			label: '分类重定向',
			action: 'keep',
			adminonly: true
		},
		m: {
			label: '移动',
			action: 'keep',
			adminonly: true
		},
		merge: {
			label: '并入',
			action: 'keep',
			adminonly: true
		},
		mergeapproved: {
			label: '允许并入',
			action: 'keep',
			adminonly: true
		},
		nc: {
			label: '无共识',
			action: 'keep'
		}
	}
};
/* eslint-enable quote-props */

Twinkle.close.callback = function twinklecloseCallback(title, section, noop) {
	var Window = new Morebits.simpleWindow(410, 200);
	Window.setTitle('关闭存废讨论 \u00B7 ' + title);
	Window.setScriptName('Twinkle');
	Window.addFooterLink('存废讨论设置', 'H:TW/PREF#关闭存废讨论');
	Window.addFooterLink('Twinkle帮助', 'H:TW/DOC#关闭存废讨论');
	var form = new Morebits.quickForm(Twinkle.close.callback.evaluate);
	form.append({
		type: 'select',
		label: '处理结果：',
		name: 'sub_group',
		event: Twinkle.close.callback.change_code
	});
	form.append({
		type: 'input',
		name: 'sdreason',
		label: '速删理由：',
		tooltip: '用于删除日志，使用{{delete}}的参数格式，例如 A1 或 A1|G1',
		hidden: true
	});
	form.append({
		type: 'input',
		name: 'remark',
		label: '补充说明：'
	});
	form.append({
		type: 'checkbox',
		list: [ {
			label: '只关闭讨论，不进行其他操作',
			value: 'noop',
			name: 'noop',
			event: Twinkle.close.callback.change_operation,
			checked: noop
		} ]
	});
	if (new mw.Title(title).namespace % 2 === 0 && new mw.Title(title).namespace !== 2) {
		// hide option for user pages, to avoid accidentally deleting user talk page
		form.append({
			type: 'checkbox',
			list: [ {
				label: '删除关联的讨论页',
				value: 'talkpage',
				name: 'talkpage',
				tooltip: '删除时附带删除此页面的讨论页。',
				checked: true,
				event: function (event) {
					event.stopPropagation();
				}
			} ]
		});
	}
	form.append({
		type: 'checkbox',
		list: [ {
			label: '删除重定向页',
			value: 'redirects',
			name: 'redirects',
			tooltip: '删除到此页的重定向。',
			checked: true,
			event: function (event) {
				event.stopPropagation();
			}
		} ]
	});
	form.append({
		type: 'submit'
	});
	var result = form.render();
	Window.setContent(result);
	Window.display();
	var sub_group = result.getElementsByTagName('select')[0]; // hack

	var resultData = {
		title: title,
		section: parseInt(section),
		noop: noop
	};
	$(result).data('resultData', resultData);
	// worker function to create the combo box entries
	var createEntries = function (contents, container) {
		$.each(contents, function (itemKey, itemProperties) {
			var key = typeof itemKey === 'string' ? itemKey : itemProperties.value;
			var elem = new Morebits.quickForm.element({
				type: 'option',
				label: key + '：' + itemProperties.label,
				value: key,
				selected: itemProperties.selected,
				disabled: Twinkle.getPref('XfdClose') !== 'all' && itemProperties.adminonly
			});
			var elemRendered = container.appendChild(elem.render());
			$(elemRendered).data('messageData', itemProperties);
		});
	};
	$.each(Twinkle.close.codes, function (groupLabel, groupContents) {
		var optgroup = new Morebits.quickForm.element({
			type: 'optgroup',
			label: groupLabel
		});
		optgroup = optgroup.render();
		sub_group.appendChild(optgroup);
		// create the options
		createEntries(groupContents, optgroup);
	});
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.sub_group.dispatchEvent(evt);
};
Twinkle.close.callback.change_operation = function twinklecloseCallbackChangeOperation(e) {
	var noop = e.target.checked;
	var code = e.target.form.sub_group.value;
	var messageData = $(e.target.form.sub_group).find('option[value="' + code + '"]').data('messageData');
	var talkpage = e.target.form.talkpage;
	var redirects = e.target.form.redirects;
	if (noop || messageData.action === 'keep') {
		if (talkpage) {
			talkpage.checked = false;
			talkpage.disabled = true;
		}
		redirects.checked = false;
		redirects.disabled = true;
	} else {
		if (talkpage) {
			talkpage.checked = true;
			talkpage.disabled = false;
		}
		redirects.checked = true;
		redirects.disabled = false;
	}
};
Twinkle.close.callback.change_code = function twinklecloseCallbackChangeCode(e) {
	var resultData = $(e.target.form).data('resultData');
	var messageData = $(e.target).find('option[value="' + e.target.value + '"]').data('messageData');
	var noop = e.target.form.noop;
	var talkpage = e.target.form.talkpage;
	var redirects = e.target.form.redirects;
	if (resultData.noop || messageData.action === 'noop') {
		noop.checked = true;
		noop.disabled = true;
		if (talkpage) {
			talkpage.checked = false;
			talkpage.disabled = true;
		}
		redirects.checked = false;
		redirects.disabled = true;
	} else {
		noop.checked = false;
		noop.disabled = false;
		if (messageData.action === 'keep') {
			if (talkpage) {
				talkpage.checked = false;
				talkpage.disabled = true;
			}
			redirects.checked = false;
			redirects.disabled = true;
		} else {
			if (talkpage) {
				talkpage.checked = true;
				talkpage.disabled = false;
			}
			redirects.checked = true;
			redirects.disabled = false;
		}
		if (e.target.value === 'sd') {
			e.target.form.sdreason.parentNode.removeAttribute('hidden');
		} else {
			e.target.form.sdreason.parentNode.setAttribute('hidden', '');
		}
	}
};
Twinkle.close.callback.evaluate = function twinklecloseCallbackEvaluate(e) {
	var code = e.target.sub_group.value;
	var resultData = $(e.target).data('resultData');
	var messageData = $(e.target.sub_group).find('option[value="' + code + '"]').data('messageData');
	var noop = e.target.noop.checked;
	var talkpage = e.target.talkpage && e.target.talkpage.checked;
	var redirects = e.target.redirects.checked;
	var params = {
		title: resultData.title,
		code: code,
		remark: e.target.remark.value,
		sdreason: e.target.sdreason.value,
		section: resultData.section,
		messageData: messageData,
		talkpage: talkpage,
		redirects: redirects
	};
	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(e.target);
	Morebits.wiki.actionCompleted.notice = '操作完成';
	if (noop || messageData.action === 'noop') {
		Twinkle.close.callbacks.talkend(params);
	} else {
		switch (messageData.action) {
			case 'del':
				Twinkle.close.callbacks.del(params);
				break;
			case 'keep':
				var qiuwen_page = new Morebits.wiki.page(params.title, '移除存废讨论模板');
				qiuwen_page.setCallbackParameters(params);
				qiuwen_page.load(Twinkle.close.callbacks.keep);
				break;
			default:
				alert('关闭存废讨论：未定义 ' + code);
		}
	}
};
Twinkle.close.callbacks = {
	del: function (params) {
		var query, qiuwen_api;
		Morebits.wiki.addCheckpoint();
		var page = new Morebits.wiki.page(params.title, '删除页面');
		if (params.code === 'sd') {
			Twinkle.speedy.callbacks.parseWikitext(params.title, '{{delete|' + params.sdreason + '}}', function (reason) {
				reason = prompt('输入删除理由，或点击确定以接受自动生成的：', reason);
				if (reason === null) {
					page.getStatusElement().warn('没有执行删除');
					Twinkle.close.callbacks.talkend(params);
				} else {
					page.setEditSummary(reason);
					page.setChangeTags(Twinkle.changeTags);
					page.deletePage(function () {
						page.getStatusElement().info('完成');
						Twinkle.close.callbacks.talkend(params);
					});
				}
			});
		} else {
			page.setEditSummary('存废讨论通过：[[' + mw.config.get('wgPageName') + '#' + params.title + ']]');
			page.setChangeTags(Twinkle.changeTags);
			page.deletePage(function () {
				page.getStatusElement().info('完成');
				Twinkle.close.callbacks.talkend(params);
			});
		}
		if (params.redirects) {
			query = {
				action: 'query',
				titles: params.title,
				prop: 'redirects',
				rdlimit: 'max' // 500 is max for normal users, 5000 for bots and sysops
			};

			qiuwen_api = new Morebits.wiki.api('正在获取重定向', query, Twinkle.close.callbacks.deleteRedirectsMain);
			qiuwen_api.params = params;
			qiuwen_api.post();
		}
		if (params.talkpage) {
			var pageTitle = mw.Title.newFromText(params.title);
			if (pageTitle && pageTitle.namespace % 2 === 0 && pageTitle.namespace !== 2) {
				pageTitle.namespace++; // now pageTitle is the talk page title!
				query = {
					action: 'query',
					titles: pageTitle.toText()
				};
				qiuwen_api = new Morebits.wiki.api('正在检查讨论页面是否存在', query, Twinkle.close.callbacks.deleteTalk);
				qiuwen_api.params = params;
				qiuwen_api.params.talkPage = pageTitle.toText();
				qiuwen_api.post();
			}
		}
		Morebits.wiki.removeCheckpoint();
	},
	deleteRedirectsMain: function (apiobj) {
		var xml = apiobj.responseXML;
		var pages = $(xml).find('rd').map(function () {
			return $(this).attr('title');
		}).get();
		if (!pages.length) {
			return;
		}
		var redirectDeleter = new Morebits.batchOperation('正在删除到 ' + apiobj.params.title + ' 的重定向');
		redirectDeleter.setOption('chunkSize', Twinkle.getPref('batchdeleteChunks'));
		redirectDeleter.setPageList(pages);
		redirectDeleter.run(function (pageName) {
			var qiuwen_page = new Morebits.wiki.page(pageName, '正在删除 ' + pageName);
			qiuwen_page.setEditSummary('[[QW:CSD#G5|G5]]: 指向已删页面“' + apiobj.params.title + '”的重定向');
			qiuwen_page.setChangeTags(Twinkle.changeTags);
			qiuwen_page.deletePage(redirectDeleter.workerSuccess, redirectDeleter.workerFailure);
		});
	},
	deleteTalk: function (apiobj) {
		var xml = apiobj.responseXML;
		var exists = $(xml).find('page:not([missing])').length > 0;
		if (!exists) {
			// no talk page; forget about it
			return;
		}
		var page = new Morebits.wiki.page(apiobj.params.talkPage, '正在删除页面 ' + apiobj.params.title + ' 的讨论页');
		page.setEditSummary('[[QW:CSD#G5|G5]]: 已删页面“' + apiobj.params.title + '”的[[Qiuwen:讨论页|讨论页]]');
		page.setChangeTags(Twinkle.changeTags);
		page.deletePage();
	},
	keep: function (pageobj) {
		var statelem = pageobj.getStatusElement();
		if (!pageobj.exists()) {
			statelem.error('页面不存在，可能已被删除');
			return;
		}
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		var pagetitle = mw.Title.newFromText(params.title);
		if (pagetitle.getNamespaceId() % 2 === 0) {
			var talkpagetitle = new mw.Title(pagetitle.getMainText(), pagetitle.getNamespaceId() + 1);
			var talkpage = new Morebits.wiki.page(talkpagetitle.toString(), '标记讨论页');
			var vfdkept = '{{Old vfd multi|' + mw.config.get('wgPageName').split('/').slice(2).join('/') + '|' + params.messageData.label + '}}\n';
			talkpage.setPrependText(vfdkept);
			talkpage.setEditSummary('[[' + mw.config.get('wgPageName') + '#' + params.title + ']]：' + params.messageData.label);
			talkpage.setChangeTags(Twinkle.changeTags);
			talkpage.setCreateOption('recreate');
			talkpage.prepend();
		}
		var newtext = text.replace(/<noinclude>\s*\{\{([rsaiftcmv]fd)(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*<\/noinclude>\s*/gi, '');
		newtext = newtext.replace(/\{\{([rsaiftcmv]fd)(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/gi, '');
		if (params.code !== 'tk') {
			newtext = newtext.replace(/\{\{(notability|fame|mair|知名度|重要性|显著性|顯著性|知名度不足|人物重要性|重要性不足|notable|关注度|关注度不足|關注度|關注度不足|重要|重要度)(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\n*/gi, '');
			newtext = newtext.replace(/\{\{(substub|小小作品|cod|小小條目|小小条目)(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\n*/gi, '');
		}
		if (params.code === 'mergeapproved') {
			var tag = '{{subst:Merge approved/auto|discuss=' + mw.config.get('wgPageName') + '#' + params.title + '}}\n';

			// Insert tag after short description or any hatnotes
			var wikipage = new Morebits.wikitext.page(newtext);
			newtext = wikipage.insertAfterTemplates(tag, Twinkle.hatnoteRegex).getText();
		}
		if (newtext === text) {
			statelem.warn('未找到存废讨论模板，可能已被移除');
			Twinkle.close.callbacks.talkend(params);
			return;
		}
		var editsummary = '存废讨论关闭：[[' + mw.config.get('wgPageName') + '#' + params.title + ']]';
		pageobj.setPageText(newtext);
		pageobj.setEditSummary(editsummary);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setCreateOption('nocreate');
		pageobj.save(Twinkle.close.callbacks.keepComplete);
	},
	keepComplete: function (pageobj) {
		var params = pageobj.getCallbackParameters();
		Twinkle.close.callbacks.talkend(params);
	},
	talkend: function (params) {
		var qiuwen_page = new Morebits.wiki.page(mw.config.get('wgPageName'), '关闭讨论');
		qiuwen_page.setCallbackParameters(params);
		qiuwen_page.setPageSection(params.section);
		qiuwen_page.load(Twinkle.close.callbacks.saveTalk);
	},
	saveTalk: function (pageobj) {
		var statelem = pageobj.getStatusElement();
		var text = pageobj.getPageText();
		var params = pageobj.getCallbackParameters();
		if (text.indexOf('{{delh') !== -1) {
			statelem.error('讨论已被关闭');
			return;
		}
		var sbegin = text.indexOf('<section begin=backlog />') !== -1;
		var send = text.indexOf('<section end=backlog />') !== -1;
		text = text.replace('\n<section begin=backlog />', '');
		text = text.replace('\n<section end=backlog />', '');
		var bar = text.split('\n----\n');
		var split = bar[0].split('\n');
		text = split[0] + '\n{{delh|' + params.code + '}}\n' + split.slice(1).join('\n');
		text += '\n<hr>\n: ' + params.messageData.label;
		if (params.remark) {
			text += '：' + Morebits.string.appendPunctuation(params.remark);
		} else {
			text += '。';
		}
		if (!Morebits.userIsSysop) {
			text += '{{subst:NAC}}';
		}
		// eslint-disable-next-line no-useless-concat
		text += '--~~' + '~~\n{{delf}}';
		if (bar[1]) {
			text += '\n----\n' + bar.slice(1).join('\n----\n');
		}
		if (send) {
			text += '\n<section end=backlog />';
		}
		if (sbegin) {
			// guaranteed to be at tne end?
			text += '\n<section begin=backlog />';
		}
		pageobj.setPageText(text);
		pageobj.setEditSummary('/* ' + params.title + ' */ ' + params.messageData.label);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setCreateOption('nocreate');
		pageobj.save(Twinkle.close.callbacks.disableLink);
	},
	disableLink: function (pageobj) {
		var params = pageobj.getCallbackParameters();
		$('strong a[href=#' + params.section + '] span').css('color', 'grey');
	}
};
Twinkle.addInitCallback(Twinkle.close, 'close');
}(jQuery));

/* </nowiki> */
