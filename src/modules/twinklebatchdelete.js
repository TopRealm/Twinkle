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
/* Twinkle.js - twinklebatchdelete.js */
/* <nowiki> */
(($) => {
/**
 * twinklebatchdelete.js: Batch delete module (sysops only)
 * Mode of invocation:     Tab ("D-batch")
 * Active on:              Existing non-articles, and Special:PrefixIndex
 */

Twinkle.batchdelete = () => {
	if (
		Morebits.userIsSysop &&
			((mw.config.get('wgCurRevisionId') && mw.config.get('wgNamespaceNumber') > 0) ||
				mw.config.get('wgCanonicalSpecialPageName') === 'Prefixindex' ||
				mw.config.get('wgCanonicalSpecialPageName') === 'BrokenRedirects')
	) {
		Twinkle.addPortletLink(Twinkle.batchdelete.callback, '批删', 'tw-batch', '删除此分类或页面中的所有链接');
	}
};

Twinkle.batchdelete.unlinkCache = {};

// Has the subpages list been loaded?
let subpagesLoaded;

Twinkle.batchdelete.callback = () => {
	subpagesLoaded = false;
	const Window = new Morebits.simpleWindow(600, 400);
	Window.setTitle('批量删除');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('帮助文档', 'H:TW/DOC#批量删除');
	Window.addFooterLink('问题反馈', 'HT:TW');
	const form = new Morebits.quickForm(Twinkle.batchdelete.callback.evaluate);
	form.append({
		type: 'checkbox',
		list: [
			{
				label: '删除页面',
				name: 'delete_page',
				value: 'delete',
				checked: true,
				subgroup: {
					type: 'checkbox',
					list: [
						{
							label: '删除关联的讨论页（用户讨论页除外）',
							name: 'delete_talk',
							value: 'delete_talk',
							checked: true
						},
						{
							label: '删除到已删页面的重定向页',
							name: 'delete_redirects',
							value: 'delete_redirects',
							checked: true
						},
						{
							label: '删除已删页面的子页面',
							name: 'delete_subpages',
							value: 'delete_subpages',
							checked: false,
							event: Twinkle.batchdelete.callback.toggleSubpages,
							subgroup: {
								type: 'checkbox',
								list: [
									{
										label: '删除已删子页面的讨论页',
										name: 'delete_subpage_talks',
										value: 'delete_subpage_talks'
									},
									{
										label: '删除到已删子页面的重定向页',
										name: 'delete_subpage_redirects',
										value: 'delete_subpage_redirects'
									},
									{
										label: '取消所有已删页面的链入（仅处理条目及Portal命名空间）',
										name: 'unlink_subpages',
										value: 'unlink_subpages'
									}
								]
							}
						}
					]
				}
			},
			{
				label: '取消链入（仅处理条目）',
				name: 'unlink_page',
				value: 'unlink',
				checked: false
			},
			{
				label: '移除文件使用（所有命名空间）',
				name: 'unlink_file',
				value: 'unlink_file',
				checked: true
			}
		]
	});
	form.append({
		type: 'select',
		name: 'common_reason',
		label: '常用理由：',
		style: 'width: 85%;',
		list: Twinkle.batchdelete.deletereasonlist,
		event: Twinkle.batchdelete.callback.change_common_reason
	});
	form.append({
		name: 'reason',
		type: 'input',
		label: '理由：',
		size: 75
	});
	const query = {
		action: 'query',
		prop: 'revisions|info|imageinfo',
		inprop: 'protection',
		rvprop: 'size|user',
		format: 'json'
	};

	// On categories
	if (mw.config.get('wgNamespaceNumber') === 14) {
		query.generator = 'categorymembers';
		query.gcmtitle = mw.config.get('wgPageName');
		query.gcmlimit = Twinkle.getPref('batchMax');

		// On Special:PrefixIndex
	} else if (mw.config.get('wgCanonicalSpecialPageName') === 'Prefixindex') {
		query.generator = 'allpages';
		query.gaplimit = Twinkle.getPref('batchMax');
		if (mw.util.getParamValue('prefix')) {
			query.gapnamespace = mw.util.getParamValue('namespace');
			query.gapprefix = mw.util.getParamValue('prefix');
		} else {
			let pathSplit = decodeURIComponent(location.pathname).split('/');
			if (pathSplit.length < 3 || pathSplit[2] !== 'Special:前缀索引') {
				return;
			}
			const titleSplit = pathSplit[3].split(':');
			query.gapnamespace = mw.config.get('wgNamespaceIds')[titleSplit[0].toLowerCase()];
			if (titleSplit.length < 2 || typeof query.gapnamespace === 'undefined') {
				query.gapnamespace = 0; // article namespace
				query.gapprefix = pathSplit.splice(3).join('/');
			} else {
				pathSplit = pathSplit.splice(4);
				pathSplit.splice(0, 0, titleSplit.splice(1).join(':'));
				query.gapprefix = pathSplit.join('/');
			}
		}

		// On Special:BrokenRedirects
	} else if (mw.config.get('wgCanonicalSpecialPageName') === 'BrokenRedirects') {
		query.generator = 'querypage';
		query.gqppage = 'BrokenRedirects';
		query.gqplimit = Twinkle.getPref('batchMax');

		// On normal pages
	} else {
		query.generator = 'links';
		query.titles = mw.config.get('wgPageName');
		query.gpllimit = Twinkle.getPref('batchMax');
	}

	const statusdiv = document.createElement('div');
	statusdiv.style.padding = '15px'; // just so it doesn't look broken
	Window.setContent(statusdiv);
	Morebits.status.init(statusdiv);
	Window.display();
	Twinkle.batchdelete.pages = {};
	const statelem = new Morebits.status('抓取页面列表');
	const qiuwen_api = new Morebits.wiki.api(
		'加载中…',
		query,
		(apiobj) => {
			const xml = apiobj.responseXML;
			const $pages = $(xml).find('page').filter(':not([missing])'); // :not([imagerepository="shared"])
			$pages.each((_index, page) => {
				const $page = $(page);
				const ns = $page.attr('ns');
				const title = $page.attr('title');
				const isRedir = $page.attr('redirect') === '';
				const $editprot = $page.find('pr[type="edit"][level="sysop"]');
				const editProt = $editprot.length > 0;
				const size = $page.find('rev').attr('size');

				const metadata = [];
				if (isRedir) {
					metadata.push('重定向');
				}
				if (editProt) {
					metadata.push('全保护，' + ($editprot.attr('expiry') === 'infinity' ? '无限期' : new Morebits.date($editprot.attr('expiry')).calendar('utc') + ' (UTC)') + '过期');
				}
				if (ns === '6') {
					// mimic what delimages used to show for files
					metadata.push('上传者：' + $page.find('ii').attr('user'));
					metadata.push('最后编辑：' + $page.find('rev').attr('user'));
				} else {
					metadata.push(mw.language.convertNumber(size) + '字节');
				}
				Twinkle.batchdelete.pages[title] = {
					label: title + (metadata.length ? '（' + metadata.join('，') + '）' : ''),
					value: title,
					checked: true,
					style: editProt ? 'color:red' : ''
				};
			});

			const form = apiobj.params.form;
			form.append({ type: 'header', label: '待删除页面' });
			form.append({
				type: 'button',
				label: '全选',
				event: () => {
					$(result)
						.find('input[name=pages]:not(:checked)')
						.each((_, e) => {
							e.click(); // check it, and invoke click event so that subgroup can be shown
						});

					// Check any unchecked subpages too
					$('input[name="pages.subpages"]').prop('checked', true);
				}
			});
			form.append({
				type: 'button',
				label: '全不选',
				event: () => {
					$(result)
						.find('input[name=pages]:checked')
						.each((_, e) => {
							e.click(); // uncheck it, and invoke click event so that subgroup can be hidden
						});
				}
			});
			form.append({
				type: 'checkbox',
				name: 'pages',
				id: 'tw-dbatch-pages',
				shiftClickSupport: true,
				list: $.map(Twinkle.batchdelete.pages, (e) => {
					return e;
				})
			});
			form.append({ type: 'submit' });

			const result = form.render();
			apiobj.params.Window.setContent(result);

			Morebits.quickForm.getElements(result, 'pages').forEach(generateArrowLinks);
		},
		statelem
	);

	qiuwen_api.params = { form: form, Window: Window };
	qiuwen_api.post();
};

const generateArrowLinks = (checkbox) => {
	const link = Morebits.htmlNode('a', ' >');
	link.setAttribute('class', 'tw-dbatch-page-link');
	link.setAttribute('href', mw.util.getUrl(checkbox.value));
	link.setAttribute('target', '_blank');
	checkbox.nextElementSibling.append(link);
};

Twinkle.batchdelete.generateNewPageList = (form) => {
	// Update the list of checked pages in Twinkle.batchdelete.pages object
	const elements = form.elements.pages;
	if (elements instanceof NodeList) {
		// if there are multiple pages
		for (let i = 0; i < elements.length; ++i) {
			Twinkle.batchdelete.pages[elements[i].value].checked = elements[i].checked;
		}
	} else if (elements instanceof HTMLInputElement) {
		// if there is just one page
		Twinkle.batchdelete.pages[elements.value].checked = elements.checked;
	}

	return new Morebits.quickForm.element({
		type: 'checkbox',
		name: 'pages',
		id: 'tw-dbatch-pages',
		shiftClickSupport: true,
		list: $.map(Twinkle.batchdelete.pages, (e) => {
			return e;
		})
	}).render();
};

Twinkle.batchdelete.deletereasonlist = [
	{
		label: '请选择',
		value: ''
	},
	{
		label: 'G10: 原作者清空页面或提出删除，且实际贡献者只有一人',
		value: '[[Wikipedia:CSD#G10|G10]]: 原作者清空页面或提出删除，且实际贡献者只有一人'
	},
	{
		label: 'G15: 孤立页面，比如没有主页面的讨论页、指向空页面的重定向等',
		value: '[[Wikipedia:CSD#G15|G15]]: 孤立页面'
	},
	{
		label: 'F6: 没有被条目使用的非自由著作权文件',
		value: '[[Wikipedia:CSD#F6|F6]]: 没有被条目使用的[[Wikipedia:合理使用|非自由著作权]]文件'
	},
	{
		label: 'F7: 与维基共享资源文件重复的文件',
		value: '[[Wikipedia:CSD#F7|F7]]: 与[[维基共享资源]]文件重复的文件'
	},
	{
		label: 'F10: 可被替代的非自由著作权文件',
		value: '[[Wikipedia:CSD#F10|F10]]: 可被替代的非自由著作权文件'
	},
	{
		label: 'O1: 用户请求删除自己的用户页或其子页面',
		value: '[[Wikipedia:CSD#O1|O1]]: 用户请求删除自己的[[Help:用户页|用户页]]或其子页面。'
	},
	{
		label: 'O4: 空的分类（没有条目也没有子分类）',
		value: '[[Wikipedia:CSD#O4|O4]]: 空的分类（没有条目也没有子分类）。'
	},
	{
		label: 'O7: 废弃草稿',
		value: '[[Wikipedia:CSD#O7|O7]]: 废弃草稿。'
	},
	{
		label: 'R2: 跨命名空间的重定向',
		value: '[[WP:CSD#R2|R2]]: 跨[[H:NS|命名空间]]的[[WP:R|重定向]]'
	}
];

Twinkle.batchdelete.callback.change_common_reason = (e) => {
	if (e.target.form.reason.value !== '') {
		e.target.form.reason.value = Morebits.string.appendPunctuation(e.target.form.reason.value);
	}
	e.target.form.reason.value += e.target.value;
	e.target.value = '';
};

Twinkle.batchdelete.callback.toggleSubpages = (e) => {
	const form = e.target.form;
	let newPageList;

	if (e.target.checked) {
		form.delete_subpage_redirects.checked = form.delete_redirects.checked;
		form.delete_subpage_talks.checked = form.delete_talk.checked;
		form.unlink_subpages.checked = form.unlink_page.checked;

		// If lists of subpages were already loaded once, they are
		// available without use of any API calls
		if (subpagesLoaded) {
			$.each(Twinkle.batchdelete.pages, (_i, el) => {
				// Get back the subgroup from subgroup_, where we saved it
				if (el.subgroup === null && el.subgroup_) {
					el.subgroup = el.subgroup_;
				}
			});

			newPageList = Twinkle.batchdelete.generateNewPageList(form);
			$('#tw-dbatch-pages').replaceWith(newPageList);

			Morebits.quickForm.getElements(newPageList, 'pages').forEach(generateArrowLinks);
			Morebits.quickForm.getElements(newPageList, 'pages.subpages').forEach(generateArrowLinks);

			return;
		}

		// Proceed with API calls to get list of subpages
		const loadingText = '<strong id="dbatch-subpage-loading">' + '加载中...' + '</strong>';
		$(e.target).after(loadingText);

		const pages = $(form.pages)
			.map((_i, el) => {
				return el.value;
			})
			.get();

		const subpageLister = new Morebits.batchOperation();
		subpageLister.setOption('chunkSize', Twinkle.getPref('batchChunks'));
		subpageLister.setPageList(pages);
		subpageLister.run(
			(pageName) => {
				const pageTitle = mw.Title.newFromText(pageName);

				// No need to look for subpages in main/file/mediawiki space
				if ([ 0, 6, 8 ].indexOf(pageTitle.namespace) > -1) {
					subpageLister.workerSuccess();
					return;
				}
				const qiuwen_api = new Morebits.wiki.api(
					'正在获取“' + pageName + '”的子页面',
					{
						action: 'query',
						prop: 'revisions|info|imageinfo',
						generator: 'allpages',
						rvprop: 'size',
						inprop: 'protection',
						gapprefix: pageTitle.title + '/',
						gapnamespace: pageTitle.namespace,
						gaplimit: 'max', // 500 is max for normal users, 5000 for bots and sysops
						format: 'json',
						pageNameFull: pageName // Not used by API, but added for access in onSuccess()
					},
					(apiobj) => {
						const xml = apiobj.responseXML;
						const $pages = $(xml).find('page');
						const subpageList = [];
						$pages.each((_index, page) => {
							const $page = $(page);
							const ns = $page.attr('ns');
							const title = $page.attr('title');
							const isRedir = $page.attr('redirect') === '';
							const $editprot = $page.find('pr[type="edit"][level="sysop"]');

							const editProt = $editprot.length > 0;
							const size = $page.find('rev').attr('size');

							const metadata = [];
							if (isRedir) {
								metadata.push('redirect');
							}
							if (editProt) {
								metadata.push('全保护，' + ($editprot.attr('expiry') === 'infinity' ? '无限期' : new Morebits.date($editprot.attr('expiry')).calendar('utc') + ' (UTC)') + '过期');
							}
							if (ns === '6') {
								// mimic what delimages used to show for files
								metadata.push('上传者：' + $page.find('ii').attr('user'));
								metadata.push('最后编辑：' + $page.find('rev').attr('user'));
							} else {
								metadata.push(mw.language.convertNumber(size) + '字节');
							}
							subpageList.push({
								label: title + (metadata.length ? ' (' + metadata.join('; ') + ')' : ''),
								value: title,
								checked: true,
								style: editProt ? 'color:red' : ''
							});
						});
						if (subpageList.length) {
							const pageName = apiobj.query.pageNameFull;
							Twinkle.batchdelete.pages[pageName].subgroup = {
								type: 'checkbox',
								name: 'subpages',
								className: 'dbatch-subpages',
								shiftClickSupport: true,
								list: subpageList
							};
						}
						subpageLister.workerSuccess();
					},
					null /* statusElement */,
					() => {
						subpageLister.workerFailure();
					}
				);
				qiuwen_api.post();
			},
			() => {
				// List 'em on the interface
				newPageList = Twinkle.batchdelete.generateNewPageList(form);
				$('#tw-dbatch-pages').replaceWith(newPageList);

				Morebits.quickForm.getElements(newPageList, 'pages').forEach(generateArrowLinks);
				Morebits.quickForm.getElements(newPageList, 'pages.subpages').forEach(generateArrowLinks);

				subpagesLoaded = true;

				// Remove "Loading... " text
				$('#dbatch-subpage-loading').remove();
			}
		);
	} else if (!e.target.checked) {
		$.each(Twinkle.batchdelete.pages, (_i, el) => {
			if (el.subgroup) {
				// Remove subgroup after saving its contents in subgroup_
				// so that it can be retrieved easily if user decides to
				// delete the subpages again
				el.subgroup_ = el.subgroup;
				el.subgroup = null;
			}
		});

		newPageList = Twinkle.batchdelete.generateNewPageList(form);
		$('#tw-dbatch-pages').replaceWith(newPageList);

		Morebits.quickForm.getElements(newPageList, 'pages').forEach(generateArrowLinks);
	}
};

Twinkle.batchdelete.callback.evaluate = (event) => {
	Morebits.wiki.actionCompleted.notice = '批量删除已完成';

	const form = event.target;

	const numProtected = $(Morebits.quickForm.getElements(form, 'pages')).filter((_index, element) => {
		return element.checked && element.nextElementSibling.style.color === 'red';
	}).length;
	if (numProtected > 0 && !confirm('您正要删除 ' + mw.language.convertNumber(numProtected) + ' 个全保护页面，您确定吗？')) {
		return;
	}

	const pages = form.getChecked('pages');
	const subpages = form.getChecked('pages.subpages');
	const reason = form.reason.value;
	const delete_page = form.delete_page.checked;
	let delete_talk, delete_redirects, delete_subpages;
	let delete_subpage_redirects, delete_subpage_talks, unlink_subpages;
	if (delete_page) {
		delete_talk = form.delete_talk.checked;
		delete_redirects = form.delete_redirects.checked;
		delete_subpages = form.delete_subpages.checked;
		if (delete_subpages) {
			delete_subpage_redirects = form.delete_subpage_redirects.checked;
			delete_subpage_talks = form.delete_subpage_talks.checked;
			unlink_subpages = form.unlink_subpages.checked;
		}
	}
	const unlink_page = form.unlink_page.checked;
	const unlink_file = form.unlink_file.checked;
	if (!reason) {
		alert('您需要给出一个理由');
		return;
	}
	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);
	if (!pages) {
		Morebits.status.error('错误', '没有要删除的内容，中止');
		return;
	}

	const pageDeleter = new Morebits.batchOperation(delete_page ? '正在删除页面' : '正在启动要求的任务');
	pageDeleter.setOption('chunkSize', Twinkle.getPref('batchChunks'));
	// we only need the initial status lines if we're deleting the pages in the pages array
	pageDeleter.setOption('preserveIndividualStatusLines', delete_page);
	pageDeleter.setPageList(pages);
	pageDeleter.run(
		(pageName) => {
			const params = {
				page: pageName,
				delete_page: delete_page,
				delete_talk: delete_talk,
				delete_redirects: delete_redirects,
				unlink_page: unlink_page,
				unlink_file: unlink_file && new RegExp('^' + Morebits.namespaceRegex(6) + ':', 'i').test(pageName),
				reason: reason,
				pageDeleter: pageDeleter
			};

			const qiuwen_page = new Morebits.wiki.page(pageName, '正在删除页面 ' + pageName);
			qiuwen_page.setCallbackParameters(params);
			if (delete_page) {
				qiuwen_page.setEditSummary(reason + ' (批量)');
				qiuwen_page.setChangeTags(Twinkle.changeTags);
				qiuwen_page.suppressProtectWarning();
				qiuwen_page.deletePage(Twinkle.batchdelete.callbacks.doExtras, pageDeleter.workerFailure);
			} else {
				Twinkle.batchdelete.callbacks.doExtras(qiuwen_page);
			}
		},
		() => {
			if (delete_subpages) {
				const subpageDeleter = new Morebits.batchOperation('正在删除子页面');
				subpageDeleter.setOption('chunkSize', Twinkle.getPref('batchChunks'));
				subpageDeleter.setOption('preserveIndividualStatusLines', true);
				subpageDeleter.setPageList(subpages);
				subpageDeleter.run((pageName) => {
					const params = {
						page: pageName,
						delete_page: true,
						delete_talk: delete_subpage_talks,
						delete_redirects: delete_subpage_redirects,
						unlink_page: unlink_subpages,
						unlink_file: false,
						reason: reason,
						pageDeleter: subpageDeleter
					};

					const qiuwen_page = new Morebits.wiki.page(pageName, '正在删除子页面 ' + pageName);
					qiuwen_page.setCallbackParameters(params);
					qiuwen_page.setEditSummary(reason + ' (批量)');
					qiuwen_page.setChangeTags(Twinkle.changeTags);
					qiuwen_page.suppressProtectWarning();
					qiuwen_page.deletePage(Twinkle.batchdelete.callbacks.doExtras, pageDeleter.workerFailure);
				});
			}
		}
	);
};

Twinkle.batchdelete.callbacks = {
	// this stupid parameter name is a temporary thing until I implement an overhaul
	// of Morebits.wiki.* callback parameters
	doExtras: (thingWithParameters) => {
		const params = thingWithParameters.parent ? thingWithParameters.parent.getCallbackParameters() : thingWithParameters.getCallbackParameters();
		// the initial batch operation's job is to delete the page, and that has
		// succeeded by now
		params.pageDeleter.workerSuccess(thingWithParameters);

		let query, qiuwen_api;

		if (params.unlink_page) {
			Twinkle.batchdelete.unlinkCache = {};
			query = {
				action: 'query',
				list: 'backlinks',
				blfilterredir: 'nonredirects',
				blnamespace: [ 0 ],
				bltitle: params.page,
				bllimit: 'max' // 500 is max for normal users, 5000 for bots and sysops
			};
			qiuwen_api = new Morebits.wiki.api('正在获取链入', query, Twinkle.batchdelete.callbacks.unlinkBacklinksMain);
			qiuwen_api.params = params;
			qiuwen_api.post();
		}

		if (params.unlink_file) {
			query = {
				action: 'query',
				list: 'imageusage',
				iutitle: params.page,
				iulimit: 'max' // 500 is max for normal users, 5000 for bots and sysops
			};
			qiuwen_api = new Morebits.wiki.api('正在获取文件链入', query, Twinkle.batchdelete.callbacks.unlinkImageInstancesMain);
			qiuwen_api.params = params;
			qiuwen_api.post();
		}

		if (params.delete_page) {
			if (params.delete_redirects) {
				query = {
					action: 'query',
					titles: params.page,
					prop: 'redirects',
					rdlimit: 'max' // 500 is max for normal users, 5000 for bots and sysops
				};
				qiuwen_api = new Morebits.wiki.api('正在获取重定向', query, Twinkle.batchdelete.callbacks.deleteRedirectsMain);
				qiuwen_api.params = params;
				qiuwen_api.post();
			}
			if (params.delete_talk) {
				const pageTitle = mw.Title.newFromText(params.page);
				if (pageTitle && pageTitle.namespace % 2 === 0 && pageTitle.namespace !== 2) {
					pageTitle.namespace++; // now pageTitle is the talk page title!
					query = {
						action: 'query',
						titles: pageTitle.toText()
					};
					qiuwen_api = new Morebits.wiki.api('正在检查讨论页面是否存在', query, Twinkle.batchdelete.callbacks.deleteTalk);
					qiuwen_api.params = params;
					qiuwen_api.params.talkPage = pageTitle.toText();
					qiuwen_api.post();
				}
			}
		}
	},
	deleteRedirectsMain: (apiobj) => {
		const xml = apiobj.responseXML;
		const pages = $(xml)
			.find('rd')
			.map(function () {
				return $(this).attr('title');
			})
			.get();
		if (!pages.length) {
			return;
		}

		const redirectDeleter = new Morebits.batchOperation('正在删除到 ' + apiobj.params.page + ' 的重定向');
		redirectDeleter.setOption('chunkSize', Twinkle.getPref('batchChunks'));
		redirectDeleter.setPageList(pages);
		redirectDeleter.run((pageName) => {
			const qiuwen_page = new Morebits.wiki.page(pageName, '正在删除 ' + pageName);
			qiuwen_page.setEditSummary('[[WP:CSD#G15|G15]]: ' + '指向已删页面“' + apiobj.params.page + '”的重定向');
			qiuwen_page.setChangeTags(Twinkle.changeTags);
			qiuwen_page.deletePage(redirectDeleter.workerSuccess, redirectDeleter.workerFailure);
		});
	},
	deleteTalk: (apiobj) => {
		const xml = apiobj.responseXML;
		const exists = $(xml).find('page:not([missing])').length > 0;

		if (!exists) {
			// no talk page; forget about it
			return;
		}

		const page = new Morebits.wiki.page(apiobj.params.talkPage, '正在删除页面 ' + apiobj.params.page + ' 的讨论页');
		page.setEditSummary('[[WP:CSD#G15|G15]]: ' + '已删页面“' + apiobj.params.page + '”的[[Wikipedia:讨论页|讨论页]]');
		page.setChangeTags(Twinkle.changeTags);
		page.deletePage();
	},
	unlinkBacklinksMain: (apiobj) => {
		const xml = apiobj.responseXML;
		const pages = $(xml)
			.find('bl')
			.map(function () {
				return $(this).attr('title');
			})
			.get();
		if (!pages.length) {
			return;
		}

		const unlinker = new Morebits.batchOperation('正在取消到 ' + apiobj.params.page + ' 的链入');
		unlinker.setOption('chunkSize', Twinkle.getPref('batchChunks'));
		unlinker.setPageList(pages);
		unlinker.run((pageName) => {
			const qiuwen_page = new Morebits.wiki.page(pageName, '正在取消 ' + pageName + ' 上的链入');
			const params = $.extend({}, apiobj.params);
			params.title = pageName;
			params.unlinker = unlinker;
			qiuwen_page.setCallbackParameters(params);
			qiuwen_page.load(Twinkle.batchdelete.callbacks.unlinkBacklinks);
		});
	},
	unlinkBacklinks: (pageobj) => {
		const params = pageobj.getCallbackParameters();
		if (!pageobj.exists()) {
			// we probably just deleted it, as a recursive backlink
			params.unlinker.workerSuccess(pageobj);
			return;
		}

		let text;
		if (params.title in Twinkle.batchdelete.unlinkCache) {
			text = Twinkle.batchdelete.unlinkCache[params.title];
		} else {
			text = pageobj.getPageText();
		}
		const old_text = text;
		const wikiPage = new Morebits.wikitext.page(text);
		text = wikiPage.removeLink(params.page).getText();

		Twinkle.batchdelete.unlinkCache[params.title] = text;
		if (text === old_text) {
			// Nothing to do, return
			params.unlinker.workerSuccess(pageobj);
			return;
		}
		pageobj.setEditSummary('取消到已删页面' + params.page + '的链入');
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setPageText(text);
		pageobj.setCreateOption('nocreate');
		pageobj.setMaxConflictRetries(10);
		pageobj.save(params.unlinker.workerSuccess, params.unlinker.workerFailure);
	},
	unlinkImageInstancesMain: (apiobj) => {
		const xml = apiobj.responseXML;
		const pages = $(xml)
			.find('iu')
			.map(function () {
				return $(this).attr('title');
			})
			.get();
		if (!pages.length) {
			return;
		}

		const unlinker = new Morebits.batchOperation('正在取消到 ' + apiobj.params.page + ' 的链入');
		unlinker.setOption('chunkSize', Twinkle.getPref('batchChunks'));
		unlinker.setPageList(pages);
		unlinker.run((pageName) => {
			const qiuwen_page = new Morebits.wiki.page(pageName, '取消 ' + pageName + ' 的文件使用');
			const params = $.extend({}, apiobj.params);
			params.title = pageName;
			params.unlinker = unlinker;
			qiuwen_page.setCallbackParameters(params);
			qiuwen_page.load(Twinkle.batchdelete.callbacks.unlinkImageInstances);
		});
	},
	unlinkImageInstances: (pageobj) => {
		const params = pageobj.getCallbackParameters();
		if (!pageobj.exists()) {
			// we probably just deleted it, as a recursive backlink
			params.unlinker.workerSuccess(pageobj);
			return;
		}

		const image = params.page.replace(new RegExp('^' + Morebits.namespaceRegex(6) + ':'), '');
		let text;
		if (params.title in Twinkle.batchdelete.unlinkCache) {
			text = Twinkle.batchdelete.unlinkCache[params.title];
		} else {
			text = pageobj.getPageText();
		}
		const old_text = text;
		const wikiPage = new Morebits.wikitext.page(text);
		text = wikiPage.commentOutImage(image, '因文件已删，故注解').getText();

		Twinkle.batchdelete.unlinkCache[params.title] = text;
		if (text === old_text) {
			pageobj.getStatusElement().error('在 ' + pageobj.getPageName() + ' 上取消 ' + image + ' 的文件使用失败');
			params.unlinker.workerFailure(pageobj);
			return;
		}
		pageobj.setEditSummary('取消使用已被删除文件' + image + '，因为：' + params.reason);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setPageText(text);
		pageobj.setCreateOption('nocreate');
		pageobj.setMaxConflictRetries(10);
		pageobj.save(params.unlinker.workerSuccess, params.unlinker.workerFailure);
	}
};

Twinkle.addInitCallback(Twinkle.batchdelete, 'batchdelete');
})(jQuery);
/* </nowiki> */
