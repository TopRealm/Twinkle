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
/* Twinkle.js - twinkleunlink.js */
/* <nowiki> */
(($) => {
/**
	 * twinkleunlink.js: Unlink module
	 * Mode of invocation:  Tab ("Unlink")
	 * Active on:           Non-special pages, except Qiuwen:Sandbox
	 */

Twinkle.unlink = () => {
	if (
		mw.config.get('wgNamespaceNumber') < 0 ||
			mw.config.get('wgPageName') === Twinkle.getPref('sandboxPage') ||
			!Morebits.userIsSysop
	) {
		return;
	}
	Twinkle.addPortletLink(Twinkle.unlink.callback, '消链', 'tw-unlink', '取消到本页的链接');
};

// the parameter is used when invoking unlink from admin speedy
Twinkle.unlink.callback = (presetReason) => {
	const fileSpace = mw.config.get('wgNamespaceNumber') === 6;
	const Window = new Morebits.simpleWindow(600, 440);
	Window.setTitle(`取消页面链入${fileSpace ? '及文件使用' : ''}`);
	Window.setScriptName('Twinkle');
	Window.addFooterLink('参数设置', 'H:TW/PREF#消链');
	Window.addFooterLink('帮助文档', 'H:TW/DOC#销链');
	Window.addFooterLink('问题反馈', 'HT:TW');
	const form = new Morebits.quickForm(Twinkle.unlink.callback.evaluate);

	// prepend some documentation: files are commented out, while any
	// display text is preserved for links (otherwise the link itself is used)
	const linkTextBefore = Morebits.htmlNode(
		'code',
		`[[${fileSpace ? ':' : ''}${Morebits.pageNameNorm}|链接文字]]`
	);
	const linkTextAfter = Morebits.htmlNode('code', '链接文字');
	const linkPlainBefore = Morebits.htmlNode('code', `[[${Morebits.pageNameNorm}]]`);
	let linkPlainAfter;
	if (fileSpace) {
		linkPlainAfter = Morebits.htmlNode('code', `<!-- [[${Morebits.pageNameNorm}]] -->`);
	} else {
		linkPlainAfter = Morebits.htmlNode('code', Morebits.pageNameNorm);
	}
	form.append({
		type: 'div',
		style: 'margin-bottom: 0.5em; font-style: normal;',
		label: [
			`这个工具可以取消所有指向该页的链接（“链入”）${
				fileSpace ? '，或通过加入<!-- -->注释标记隐藏所有对此文件的使用' : ''
			}。例如：`,
			linkTextBefore,
			'将会变成',
			linkTextAfter,
			'，',
			linkPlainBefore,
			'将会变成',
			linkPlainAfter,
			'。请小心使用。'
		]
	});
	form.append({
		type: 'input',
		name: 'reason',
		label: '理由：',
		value: presetReason || '',
		size: 60
	});
	const query = {
		action: 'query',
		list: 'backlinks',
		bltitle: mw.config.get('wgPageName'),
		bllimit: 'max',
		// 500 is max for normal users, 5000 for bots and sysops
		blnamespace: Twinkle.getPref('unlinkNamespaces'),
		rawcontinue: true,
		format: 'json'
	};
	if (fileSpace) {
		query.list += '|imageusage';
		query.iutitle = query.bltitle;
		query.iulimit = query.bllimit;
		query.iunamespace = query.blnamespace;
	} else {
		query.blfilterredir = 'nonredirects';
	}
	const qiuwen_api = new Morebits.wiki.api(
		'抓取链入',
		query,
		Twinkle.unlink.callbacks.display.backlinks
	);
	qiuwen_api.params = {
		form: form,
		Window: Window,
		image: fileSpace
	};
	qiuwen_api.post();
	const root = document.createElement('div');
	root.style.padding = '15px'; // just so it doesn't look broken
	Morebits.status.init(root);
	qiuwen_api.statelem.status('加载中……');
	Window.setContent(root);
	Window.display();
};
Twinkle.unlink.callback.evaluate = (event) => {
	const form = event.target;
	const input = Morebits.quickForm.getInputData(form);
	if (!input.reason) {
		alert('您必须指定取消链入的理由。');
		return;
	}
	input.backlinks ||= [];
	input.imageusage ||= [];
	const pages = Morebits.array.uniq(input.backlinks.concat(input.imageusage));
	if (!pages.length) {
		alert('您必须至少选择一个要取消链入的页面。');
		return;
	}
	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);
	const unlinker = new Morebits.batchOperation(
		`取消${
			input.backlinks.length
				? `链入${input.imageusage.length ? '与文件使用' : ''}`
				: '文件使用'
		}`
	);
	unlinker.setOption('preserveIndividualStatusLines', true);
	unlinker.setPageList(pages);
	const params = {
		reason: input.reason,
		unlinker: unlinker
	};
	unlinker.run((pageName) => {
		const qiuwen_page = new Morebits.wiki.page(pageName, `在页面“${pageName}”中取消链入`);
		qiuwen_page.setBotEdit(true); // unlink considered a floody operation
		qiuwen_page.setCallbackParameters(
			$.extend(
				{
					doBacklinks: input.backlinks.indexOf(pageName) !== -1,
					doImageusage: input.imageusage.indexOf(pageName) !== -1
				},
				params
			)
		);
		qiuwen_page.load(Twinkle.unlink.callbacks.unlinkBacklinks);
	});
};
Twinkle.unlink.callbacks = {
	display: {
		backlinks: (apiobj) => {
			const response = apiobj.getResponse();
			let havecontent = false;
			let list, namespaces, i;
			if (apiobj.params.image) {
				const imageusage = response.query.imageusage.sort(Twinkle.sortByNamespace);
				list = [];
				for (i = 0; i < imageusage.length; ++i) {
					// Label made by Twinkle.generateBatchPageLinks
					list.push({
						label: '',
						value: imageusage[i].title,
						checked: true
					});
				}
				if (!list.length) {
					apiobj.params.form.append({
						type: 'div',
						label: '未找到文件使用。'
					});
				} else {
					apiobj.params.form.append({
						type: 'header',
						label: '文件使用'
					});
					namespaces = [];
					$.each(Twinkle.getPref('unlinkNamespaces'), (k, v) => {
						namespaces.push(
							v === '0' ? '（条目）' : mw.config.get('wgFormattedNamespaces')[v]
						);
					});
					apiobj.params.form.append({
						type: 'div',
						label: `已选择的命名空间：${namespaces.join('、')}`,
						tooltip: '您可在Twinkle参数设置中更改相关事项，请参见[[H:TW/PREF]]'
					});
					if (response['query-continue'] && response['query-continue'].imageusage) {
						apiobj.params.form.append({
							type: 'div',
							label: `显示前${mw.language.convertNumber(list.length)}个文件使用。`
						});
					}
					apiobj.params.form.append({
						type: 'button',
						label: '全选',
						event: (e) => {
							$(Morebits.quickForm.getElements(e.target.form, 'imageusage')).prop(
								'checked',
								true
							);
						}
					});
					apiobj.params.form.append({
						type: 'button',
						label: '全不选',
						event: (e) => {
							$(Morebits.quickForm.getElements(e.target.form, 'imageusage')).prop(
								'checked',
								false
							);
						}
					});
					apiobj.params.form.append({
						type: 'checkbox',
						name: 'imageusage',
						shiftClickSupport: true,
						list: list
					});
					havecontent = true;
				}
			}
			const backlinks = response.query.backlinks.sort(Twinkle.sortByNamespace);
			if (backlinks.length > 0) {
				list = [];
				for (i = 0; i < backlinks.length; ++i) {
					// Label made by Twinkle.generateBatchPageLinks
					list.push({
						label: '',
						value: backlinks[i].title,
						checked: true
					});
				}
				apiobj.params.form.append({
					type: 'header',
					label: '链入'
				});
				namespaces = [];
				$.each(Twinkle.getPref('unlinkNamespaces'), (k, v) => {
					namespaces.push(
						v === '0' ? '（条目）' : mw.config.get('wgFormattedNamespaces')[v]
					);
				});
				apiobj.params.form.append({
					type: 'div',
					label: `已选择的命名空间：${namespaces.join('、')}`,
					tooltip: '您可在Twinkle参数设置中更改相关事项，请参见[[H:TW/PREF]]'
				});
				if (response['query-continue'] && response['query-continue'].backlinks) {
					apiobj.params.form.append({
						type: 'div',
						label: `显示前${mw.language.convertNumber(list.length)}个链入。`
					});
				}
				apiobj.params.form.append({
					type: 'button',
					label: '全选',
					event: (e) => {
						$(Morebits.quickForm.getElements(e.target.form, 'backlinks')).prop(
							'checked',
							true
						);
					}
				});
				apiobj.params.form.append({
					type: 'button',
					label: '全不选',
					event: (e) => {
						$(Morebits.quickForm.getElements(e.target.form, 'backlinks')).prop(
							'checked',
							false
						);
					}
				});
				apiobj.params.form.append({
					type: 'checkbox',
					name: 'backlinks',
					shiftClickSupport: true,
					list: list
				});
				havecontent = true;
			} else {
				apiobj.params.form.append({
					type: 'div',
					label: '未找到链入。'
				});
			}
			if (havecontent) {
				apiobj.params.form.append({
					type: 'submit'
				});
			}
			const result = apiobj.params.form.render();
			apiobj.params.Window.setContent(result);
			Morebits.quickForm
				.getElements(result, 'backlinks')
				.forEach(Twinkle.generateBatchPageLinks);
			Morebits.quickForm
				.getElements(result, 'imageusage')
				.forEach(Twinkle.generateBatchPageLinks);
		}
	},
	unlinkBacklinks: (pageobj) => {
		let oldtext = pageobj.getPageText();
		const params = pageobj.getCallbackParameters();
		const wikiPage = new Morebits.wikitext.page(oldtext);
		let summaryText = '',
			warningString = false;
		let text;

		// remove image usages
		if (params.doImageusage) {
			text = wikiPage.commentOutImage(mw.config.get('wgTitle'), '注释').getText();
			// did we actually make any changes?
			if (text === oldtext) {
				warningString = '文件使用';
			} else {
				summaryText = '注释文件使用';
				oldtext = text;
			}
		}

		// remove backlinks
		if (params.doBacklinks) {
			text = wikiPage.removeLink(Morebits.pageNameNorm).getText();
			// did we actually make any changes?
			if (text === oldtext) {
				warningString = warningString ? '取消链入或文件使用' : '取消链入';
			} else {
				summaryText = `${summaryText ? `${summaryText} / ` : ''}取消链结到`;
				oldtext = text;
			}
		}
		if (warningString) {
			// nothing to do!
			pageobj.getStatusElement().error(`未能在页面上找到${warningString}。`);
			params.unlinker.workerFailure(pageobj);
			return;
		}
		pageobj.setPageText(text);
		pageobj.setEditSummary(`${summaryText}“${Morebits.pageNameNorm}”：${params.reason}`);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setCreateOption('nocreate');
		pageobj.save(params.unlinker.workerSuccess, params.unlinker.workerFailure);
	}
};
Twinkle.addInitCallback(Twinkle.unlink, 'unlink');
})(jQuery);
/* </nowiki> */
