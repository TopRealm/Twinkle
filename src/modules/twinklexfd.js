/* Twinkle.js - twinkleblock.js */
(($) => {
	/**
	 * twinklexfd.js: XFD module
	 * Mode of invocation: Tab ("XFD")
	 * Active on: Existing, non-special pages, except for file pages with no local (non-Commons) file which are not redirects
	 */
	Twinkle.xfd = () => {
		// Disable on:
		// * special pages
		// * non-existent pages
		// * files on Commons, whether there is a local page or not (unneeded local pages of files on Commons are eligible for CSD F2)
		// * file pages without actual files (these are eligible for CSD G8)
		if (
			mw.config.get('wgNamespaceNumber') < 0 ||
			!mw.config.get('wgArticleId') ||
			(mw.config.get('wgNamespaceNumber') === 6 &&
				(document.querySelector('#mw-sharedupload') ||
					(!document.querySelector('#mw-imagepage-section-filehistory') && !Morebits.isPageRedirect())))
		) {
			return;
		}
		Twinkle.addPortletLink(Twinkle.xfd.callback, '提删', 'tw-xfd', '提交删除讨论');
	};
	Twinkle.xfd.currentRationale = null;
	// error callback on Morebits.status.object
	Twinkle.xfd.printRationale = () => {
		if (Twinkle.xfd.currentRationale) {
			Morebits.status.printUserText(
				Twinkle.xfd.currentRationale,
				'您的理由已在下方提供，若您想重新提交，请将其复制到一新窗口中：'
			);
			// only need to print the rationale once
			Twinkle.xfd.currentRationale = null;
		}
	};
	Twinkle.xfd.callback = () => {
		const Window = new Morebits.simpleWindow(600, 350);
		Window.setTitle('提交存废讨论');
		Window.setScriptName('Twinkle');
		Window.addFooterLink('关于存废讨论', 'QW:XFD');
		Window.addFooterLink('提删设置', 'H:TW/PREF#提删');
		Window.addFooterLink('Twinkle帮助', 'H:TW/DOC#提删');
		const form = new Morebits.quickForm(Twinkle.xfd.callback.evaluate);
		const categories = form.append({
			type: 'select',
			name: 'category',
			label: '提交类型：',
			event: Twinkle.xfd.callback.change_category,
		});
		categories.append({
			type: 'option',
			label: '页面存废讨论',
			selected: mw.config.get('wgNamespaceNumber') === 0,
			// Main namespace
			value: 'afd',
		});
		categories.append({
			type: 'option',
			label: '文件存废讨论',
			selected: mw.config.get('wgNamespaceNumber') === 6,
			// File namespace
			value: 'ffd',
		});
		form.append({
			type: 'checkbox',
			list: [
				{
					label: '如可能，通知页面创建者或文件最初上传者',
					value: 'notify',
					name: 'notify',
					tooltip: '在页面创建者讨论页上放置一通知模板。',
					checked: true,
				},
			],
		});
		form.append({
			type: 'field',
			label: '工作区',
			name: 'work_area',
		});
		form.append({
			type: 'submit',
		});
		const result = form.render();
		Window.setContent(result);
		Window.display();
		// We must init the controls
		const evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		result.category.dispatchEvent(evt);
	};
	Twinkle.xfd.callback.change_category = (e) => {
		const value = e.target.value;
		const form = e.target.form;
		const old_area = Morebits.quickForm.getElements(e.target.form, 'work_area')[0];
		let work_area = null;
		const oldreasontextbox = form.querySelectorAll('textarea')[0];
		let oldreason = oldreasontextbox ? oldreasontextbox.value : '';
		const appendReasonBox = (xfd_cat) => {
			switch (xfd_cat) {
				case 'fwdcsd':
					oldreason = decodeURIComponent($('#delete-reason').text()).replace(/\+/g, ' ');
					break;
				case 'fame':
					oldreason = Twinkle.getPref('afdFameDefaultReason');
					break;
				case 'substub':
					oldreason = Twinkle.getPref('afdSubstubDefaultReason');
					break;
				default:
					break;
			}
			work_area.append({
				type: 'textarea',
				name: 'xfdreason',
				label: '提删理由：',
				value: oldreason,
				tooltip:
					'您可以使用Wikitext，Twinkle将自动为您加入签名。若您使用批量提删功能，存废讨论页只会使用第一次提交的理由，但之后您仍需提供以用于删除通告模板的参数。',
				placeholder: '此值亦显示于页面的删除通告模板内，故务必提供此值，避免使用“同上”等用语。',
			});
			// TODO possible future "preview" link here
		};
		switch (value) {
			case 'afd': {
				work_area = new Morebits.quickForm.element({
					type: 'field',
					label: '页面存废讨论',
					name: 'work_area',
				});
				work_area.append({
					type: 'checkbox',
					list: [
						{
							label: '使用&lt;noinclude&gt;包裹模板',
							value: 'noinclude',
							name: 'noinclude',
							checked:
								mw.config.get('wgNamespaceNumber') === 10 &&
								mw.config.get('wgPageContentModel') !== 'Scribunto',
							// Template namespace
							tooltip: '使其不会在被包含时出现。',
							disabled: mw.config.get('wgPageContentModel') === 'Scribunto',
						},
					],
				});
				const afd_category = work_area.append({
					type: 'select',
					name: 'xfdcat',
					label: '选择提删类型：',
					event: Twinkle.xfd.callback.change_afd_category,
				});
				let afd_cat = 'delete';
				if (Twinkle.getPref('afdDefaultCategory') === 'same') {
					if (localStorage.Twinkle_afdCategory === undefined) {
						localStorage.Twinkle_afdCategory = 'delete';
					} else {
						afd_cat = localStorage.Twinkle_afdCategory;
					}
				}
				afd_category.append({
					type: 'option',
					label: '删除',
					value: 'delete',
					selected: afd_cat === 'delete',
				});
				afd_category.append({
					type: 'option',
					label: '合并',
					value: 'merge',
					selected: afd_cat === 'merge',
				});
				if (Twinkle.getPref('FwdCsdToXfd')) {
					afd_category.append({
						type: 'option',
						label: '转交自快速删除候选',
						value: 'fwdcsd',
						selected: afd_cat === 'fwdcsd',
					});
				}
				afd_category.append({
					type: 'option',
					label: '批量关注度提删',
					value: 'fame',
					selected: afd_cat === 'fame',
				});
				afd_category.append({
					type: 'option',
					label: '批量小小作品提删',
					value: 'substub',
					selected: afd_cat === 'substub',
				});
				afd_category.append({
					type: 'option',
					label: '批量其他提删',
					value: 'batch',
					selected: afd_cat === 'batch',
				});
				work_area.append({
					type: 'input',
					name: 'mergeinto',
					label: '合并到：',
					hidden: true,
				});
				appendReasonBox(afd_cat);
				work_area.append({
					type: 'textarea',
					name: 'fwdcsdreason',
					label: '转交理由：',
					tooltip: '您可以使用Wikitext，Twinkle将自动为您加入签名。',
					hidden: true,
				});
				work_area = work_area.render();
				old_area.parentNode.replaceChild(work_area, old_area);
				const evt = document.createEvent('Event');
				evt.initEvent('change', true, true);
				form.xfdcat.dispatchEvent(evt);
				break;
			}
			case 'ffd':
				work_area = new Morebits.quickForm.element({
					type: 'field',
					label: '文件存废讨论',
					name: 'work_area',
				});
				appendReasonBox('ffd');
				work_area = work_area.render();
				old_area.parentNode.replaceChild(work_area, old_area);
				break;
			default:
				work_area = new Morebits.quickForm.element({
					type: 'field',
					label: '未定义',
					name: 'work_area',
				});
				work_area = work_area.render();
				old_area.parentNode.replaceChild(work_area, old_area);
				break;
		}
		// Return to checked state when switching
		form.notify.checked = true;
		form.notify.disabled = false;
	};
	Twinkle.xfd.callback.change_afd_category = (e) => {
		switch (e.target.value) {
			case 'merge':
				e.target.form.mergeinto.parentNode.removeAttribute('hidden');
				e.target.form.fwdcsdreason.parentNode.setAttribute('hidden', '');
				e.target.form.mergeinto.previousElementSibling.innerHTML = '合并到：';
				break;
			case 'fwdcsd':
				e.target.form.mergeinto.parentNode.removeAttribute('hidden');
				e.target.form.fwdcsdreason.parentNode.removeAttribute('hidden');
				e.target.form.mergeinto.previousElementSibling.innerHTML = '提交人：';
				e.target.form.xfdreason.value = decodeURIComponent($('#delete-reason').text()).replace(/\+/g, ' ');
				break;
			case 'fame':
				e.target.form.mergeinto.parentNode.setAttribute('hidden', '');
				e.target.form.fwdcsdreason.parentNode.setAttribute('hidden', '');
				e.target.form.xfdreason.value = Twinkle.getPref('afdFameDefaultReason');
				break;
			case 'substub':
				e.target.form.mergeinto.parentNode.setAttribute('hidden', '');
				e.target.form.fwdcsdreason.parentNode.setAttribute('hidden', '');
				e.target.form.xfdreason.value = Twinkle.getPref('afdSubstubDefaultReason');
				break;
			default:
				e.target.form.mergeinto.parentNode.setAttribute('hidden', '');
				e.target.form.fwdcsdreason.parentNode.setAttribute('hidden', '');
		}
		if (Twinkle.getPref('afdDefaultCategory') === 'same') {
			localStorage.Twinkle_afdCategory = e.target.value;
		}
	};
	Twinkle.xfd.callbacks = {
		afd: {
			main: (pageobj) => {
				// this is coming in from lookupCreation...!
				const params = pageobj.getCallbackParameters();
				// Adding discussion
				const qiuwen_page = new Morebits.wiki.page(params.logpage, '加入讨论到当日列表');
				qiuwen_page.setFollowRedirect(true);
				qiuwen_page.setCallbackParameters(params);
				qiuwen_page.load(Twinkle.xfd.callbacks.afd.todaysList);
				// Notification to first contributor
				if (params.usertalk) {
					let initialContrib = pageobj.getCreator();
					// Disallow warning yourself
					if (initialContrib === mw.config.get('wgUserName')) {
						pageobj.getStatusElement().warn(`您（${initialContrib}）创建了该页，跳过通知`);
						initialContrib = null;
					} else {
						const talkPageName = `User talk:${initialContrib}`;
						const usertalkpage = new Morebits.wiki.page(
							talkPageName,
							`通知页面创建者（${initialContrib}）`
						);
						const notifytext = `${`\n{{subst:AFDNote|${Morebits.pageNameNorm}}}--~~`}~~`;
						usertalkpage.setAppendText(notifytext);
						usertalkpage.setEditSummary(`通知：页面[[${Morebits.pageNameNorm}]]存废讨论提名`);
						usertalkpage.setChangeTags(Twinkle.changeTags);
						usertalkpage.setCreateOption('recreate');
						usertalkpage.setWatchlist(Twinkle.getPref('xfdWatchUser'));
						usertalkpage.setFollowRedirect(true, false);
						usertalkpage.append();
					}
					// add this nomination to the user's userspace log, if the user has enabled it
					if (params.lognomination) {
						Twinkle.xfd.callbacks.addToLog(params, initialContrib);
					}
					// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
				} else if (params.lognomination) {
					Twinkle.xfd.callbacks.addToLog(params, null);
				}
			},
			taggingArticle: (pageobj) => {
				let text = pageobj.getPageText();
				const params = pageobj.getCallbackParameters();
				let tag = `{{vfd|${Morebits.string.formatReasonText(params.reason)}`;
				if (Morebits.isPageRedirect()) {
					tag += '|r';
				}
				tag += '|date={{subst:#time:Y/m/d}}}}';
				if (params.noinclude) {
					tag = `<noinclude>${tag}</noinclude>`;
					// 只有表格需要单独加回车，其他情况加回车会破坏模板。
					if (text.indexOf('{|') === 0) {
						tag += '\n';
					}
				} else {
					tag += '\n';
				}
				// Then, test if there are speedy deletion-related templates on the article.
				const textNoSd = text.replace(
					/{{\s*(db(-\w*)?|d|delete|(?:hang|hold)[ -]?on)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/gi,
					''
				);
				if (text !== textNoSd && confirm('在页面上找到快速删除模板，要移除吗？')) {
					text = textNoSd;
				}
				const textNoNotMandarin = text.replace(
					/{{\s*(notmandarin|notchinese|非中文|非現代漢語|非现代汉语|非現代標準漢語|非现代标准汉语)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/gi,
					''
				);
				if (text !== textNoNotMandarin && confirm('在页面上找到非现代标准汉语模板，要移除吗？')) {
					text = textNoNotMandarin;
				}
				// Mark the page as patrolled, if wanted
				if (Twinkle.getPref('markXfdPagesAsPatrolled')) {
					pageobj.patrol();
				}
				// Insert tag after short description or any hatnotes
				const wikipage = new Morebits.wikitext.page(text);
				text = wikipage.insertAfterTemplates(tag, Twinkle.hatnoteRegex).getText();
				pageobj.setPageText(text);
				pageobj.setEditSummary(`页面存废讨论：[[${params.logpage}#${Morebits.pageNameNorm}]]`);
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				pageobj.save();
			},
			todaysList: (pageobj) => {
				let text = pageobj.getPageText();
				const params = pageobj.getCallbackParameters();
				let type = '';
				let to = '';
				switch (params.xfdcat) {
					case 'fwdcsd':
					case 'merge':
						to = params.mergeinto;
					/* Fall through */
					default:
						type = params.xfdcat;
						break;
				}
				let append = true;
				switch (type) {
					case 'fame':
					case 'substub':
					case 'batch': {
						const commentText = `<!-- Twinkle: User:${mw.config.get(
							'wgUserName'
						)} 的 ${type} 提删插入点，请勿变更或移除此行，除非不再于本页面提删 -->`;
						let newText = `===[[:${Morebits.pageNameNorm}]]===`;
						if (type === 'fame') {
							newText += `\n{{Findsources|${Morebits.pageNameNorm}}}`;
						}
						if (text.includes(commentText)) {
							text = text.replace(commentText, `${newText}\n\n${commentText}`);
							pageobj.setPageText(text);
							append = false;
						} else {
							const appendText = `${`\n{{safesubst:SafeAfdHead}}\n${
								{
									fame: '== 30天后仍挂有{{tl|notability}}模板的条目 ==\n<span style="font-size:smaller;">（已挂[[Template:notability|不符收录标准模板]]30天）</span>',
									substub:
										'== 30天后仍挂有{{tl|substub}}模板的条目 ==\n<span style="font-size:smaller;">（已挂[[Template:substub|小小条目模板]]30天）</span>',
									batch: '== 批量提删 ==',
								}[type]
							}\n${newText}\n\n${commentText}\n----\n:建议：删除前述页面；理由：${Morebits.string.formatReasonText(
								params.reason
							)}\n提报以上${
								{
									fame: '<u>不符合收录标准</u>条目',
									substub: '<u>长度过短</u>条目',
									batch: '页面',
								}[type]
							}的用户及时间：<br id="no-new-title" />~~`}~~`;
							pageobj.setAppendText(appendText);
						}
						break;
					}
					default:
						pageobj.setAppendText(
							`${`\n{{subst:DRItem|Type=${type}|DRarticles=${
								Morebits.pageNameNorm
							}|Reason=${Morebits.string.formatReasonText(params.reason)}${
								params.fwdcsdreason.trim() === '' ? '' : `<br>\n转交理由：${params.fwdcsdreason}`
							}|To=${to}}}~~`}~~`
						);
						break;
				}
				pageobj.setEditSummary(`加入[[${Morebits.pageNameNorm}]]`);
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
				pageobj.setCreateOption('recreate');
				if (append) {
					pageobj.append();
				} else {
					pageobj.save();
				}
				Twinkle.xfd.currentRationale = null; // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
			},
			tryTagging: (pageobj) => {
				const statelem = pageobj.getStatusElement();
				// defaults to /doc for lua modules, which may not exist
				if (!pageobj.exists() && mw.config.get('wgPageContentModel') !== 'Scribunto') {
					statelem.error('页面不存在，可能已被删除');
					return;
				}
				const text = pageobj.getPageText();
				const xfd = /(?:{{([acfimr-tv]fd|md1|proposed deletion)[^{}]*?}})/i.exec(text);
				if (xfd && !confirm(`删除相关模板{{${xfd[1]}}}已被置于页面中，您是否仍想继续提报？`)) {
					statelem.error('页面已被提交至存废讨论。');
					return;
				}
				const copyvio = /(?:{{\s*(copyvio)[^{}]*?}})/i.exec(text);
				if (copyvio) {
					statelem.error('页面中已有著作权验证模板。');
					return;
				}
				Twinkle.xfd.callbacks.afd.taggingArticle(pageobj);
				// Notification to first contributor
				const qiuwen_page = new Morebits.wiki.page(mw.config.get('wgPageName'));
				qiuwen_page.setCallbackParameters(pageobj.getCallbackParameters());
				if (mw.config.get('wgPageContentModel') === 'wikitext') {
					qiuwen_page.setLookupNonRedirectCreator(true); // Look for author of first non-redirect revision
				}
				qiuwen_page.lookupCreation(Twinkle.xfd.callbacks.afd.main);
			},
		},
		ffd: {
			main: (pageobj) => {
				// this is coming in from lookupCreation...!
				const params = pageobj.getCallbackParameters();
				const initialContrib = pageobj.getCreator();
				params.uploader = initialContrib;
				// Adding discussion
				const qiuwen_page = new Morebits.wiki.page(params.logpage, '加入讨论到当日列表');
				qiuwen_page.setFollowRedirect(true);
				qiuwen_page.setCallbackParameters(params);
				qiuwen_page.load(Twinkle.xfd.callbacks.ffd.todaysList);
				// Notification to first contributor
				if (params.usertalk) {
					// Disallow warning yourself
					if (initialContrib === mw.config.get('wgUserName')) {
						pageobj.getStatusElement().warn(`您（${initialContrib}）创建了该页，跳过通知`);
						return;
					}
					const talkPageName = `User talk:${initialContrib}`;
					const usertalkpage = new Morebits.wiki.page(talkPageName, `通知页面创建者（${initialContrib}）`);
					const notifytext = `${`\n{{subst:idw|File:${mw.config.get('wgTitle')}}}--~~`}~~`;
					usertalkpage.setAppendText(notifytext);
					usertalkpage.setEditSummary(`通知：文件[[${Morebits.pageNameNorm}]]存废讨论提名`);
					usertalkpage.setChangeTags(Twinkle.changeTags);
					usertalkpage.setCreateOption('recreate');
					usertalkpage.setWatchlist(Twinkle.getPref('xfdWatchUser'));
					usertalkpage.setFollowRedirect(true, false);
					usertalkpage.append();
					// add this nomination to the user's userspace log, if the user has enabled it
					if (params.lognomination) {
						Twinkle.xfd.callbacks.addToLog(params, initialContrib);
					}
					// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
				} else if (params.lognomination) {
					Twinkle.xfd.callbacks.addToLog(params, null);
				}
			},
			taggingImage: (pageobj) => {
				const text = pageobj.getPageText();
				const params = pageobj.getCallbackParameters();
				pageobj.setPageText(
					`{{ifd|${Morebits.string.formatReasonText(params.reason)}|date={{subst:#time:c}}}}\n${text}`
				);
				pageobj.setEditSummary(`文件存废讨论：[[${params.logpage}#${Morebits.pageNameNorm}]]`);
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchPage'));
				pageobj.setCreateOption('recreate'); // it might be possible for a file to exist without a description page
				pageobj.save();
			},
			todaysList: (pageobj) => {
				// var text = pageobj.getPageText();
				const params = pageobj.getCallbackParameters();
				pageobj.setAppendText(
					`${`\n{{subst:IfdItem|Filename=${mw.config.get('wgTitle')}|Uploader=${
						params.uploader
					}|Reason=${Morebits.string.formatReasonText(params.reason)}}}--~~`}~~`
				);
				pageobj.setEditSummary(`加入[[${Morebits.pageNameNorm}]]`);
				pageobj.setChangeTags(Twinkle.changeTags);
				pageobj.setWatchlist(Twinkle.getPref('xfdWatchDiscussion'));
				pageobj.setCreateOption('recreate');
				pageobj.append(() => {
					Twinkle.xfd.currentRationale = null; // any errors from now on do not need to print the rationale, as it is safely saved on-wiki
				});
			},
			tryTagging: (pageobj) => {
				const statelem = pageobj.getStatusElement();
				if (!pageobj.exists()) {
					statelem.error('页面不存在，可能已被删除');
					return;
				}
				const text = pageobj.getPageText();
				const xfd = /(?:{{([acfimr-tv]fd|md1|proposed deletion)[^{}]*?}})/i.exec(text);
				if (xfd && !confirm(`删除相关模板{{${xfd[1]}}}已被置于页面中，您是否仍想继续提报？`)) {
					statelem.error('页面已被提交至存废讨论。');
					return;
				}
				Twinkle.xfd.callbacks.ffd.taggingImage(pageobj);
				// Contributor specific edits
				const qiuwen_page = new Morebits.wiki.page(mw.config.get('wgPageName'));
				qiuwen_page.setCallbackParameters(pageobj.getCallbackParameters());
				qiuwen_page.setLookupNonRedirectCreator(true); // Look for author of first non-redirect revision
				qiuwen_page.lookupCreation(Twinkle.xfd.callbacks.ffd.main);
			},
		},
		addToLog: (params, initialContrib) => {
			const editsummary = `记录对[[${Morebits.pageNameNorm}]]的存废讨论提名`;
			const usl = new Morebits.userspaceLogger(Twinkle.getPref('xfdLogPageName'));
			usl.initialText = `这是该用户使用[[H:TW|Twinkle]]的提删模块做出的[[QW:XFD|存废讨论]]提名列表。\n\n若您不再想保留此日志，请在[[${Twinkle.getPref(
				'configPage'
			)}|参数设置]]中关掉，并使用[[QW:CSD#O1|CSD O1]]提交快速删除。`;
			let xfdCatName;
			switch (params.xfdcat) {
				case 'delete':
					xfdCatName = '删除';
					break;
				case 'merge':
					xfdCatName = '合并到';
					break;
				case 'fwdcsd':
					xfdCatName = '转交自快速删除候选';
					break;
				case 'fame':
					xfdCatName = '批量关注度提删';
					break;
				case 'substub':
					xfdCatName = '批量小小作品提删';
					break;
				case 'batch':
					xfdCatName = '批量其他提删';
					break;
				default:
					xfdCatName = '文件存废讨论';
					break;
			}
			// If a logged file is deleted but exists on Qiuwen Share, the wikilink will be blue, so provide a link to the log
			let appendText = `# [[:${Morebits.pageNameNorm}]]`;
			if (mw.config.get('wgNamespaceNumber') === 6) {
				appendText += `（[{{fullurl:Special:Log|page=${mw.util.wikiUrlencode(
					mw.config.get('wgPageName')
				)}}} 日志]）`;
			}
			appendText += `：${xfdCatName}`;
			if (params.xfdcat === 'merge') {
				appendText += `[[:${params.mergeinto}]]`;
			}
			appendText += '。';
			if (params.reason) {
				appendText += `'''${
					params.xfdcat === 'fwdcsd' ? '原删除理据' : '理据'
				}'''：${Morebits.string.formatReasonForLog(params.reason)}`;
				appendText = Morebits.string.appendPunctuation(appendText);
			}
			if (params.fwdcsdreason) {
				appendText += `'''${
					params.xfdcat === 'fwdcsd' ? '转交理据' : '理据'
				}'''：${Morebits.string.formatReasonForLog(params.fwdcsdreason)}`;
				appendText = Morebits.string.appendPunctuation(appendText);
			}
			if (initialContrib) {
				appendText += `；通知{{user|${initialContrib}}}`;
			}
			appendText += ' ~~' + '~' + '~~\n';
			usl.changeTags = Twinkle.changeTags;
			usl.log(appendText, editsummary);
		},
	};
	Twinkle.xfd.callback.evaluate = (e) => {
		const type = e.target.category.value;
		const usertalk = e.target.notify.checked;
		const reason = e.target.xfdreason.value;
		let fwdcsdreason;
		let xfdcat;
		let mergeinto;
		let noinclude;
		if (type === 'afd') {
			fwdcsdreason = e.target.fwdcsdreason.value;
			noinclude = e.target.noinclude.checked;
			xfdcat = e.target.xfdcat.value;
			mergeinto = e.target.mergeinto.value;
		}
		if (xfdcat === 'merge' && mergeinto.trim() === '') {
			alert('请提供合并目标！');
			return;
		}
		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(e.target);
		Twinkle.xfd.currentRationale = reason;
		Morebits.status.onError(Twinkle.xfd.printRationale);
		if (!type) {
			Morebits.status.error('错误', '未定义的动作');
			return;
		}
		let qiuwen_page;
		let logpage;
		let lognomination;
		let params;
		const date = new Morebits.date(); // XXX: avoid use of client clock, still used by TfD, FfD and CfD
		switch (type) {
			case 'afd': {
				// AFD
				logpage = `Qiuwen:存废讨论/记录/${date.format('YYYY/MM/DD', 'utc')}`;
				lognomination =
					Twinkle.getPref('logXfdNominations') && !Twinkle.getPref('noLogOnXfdNomination').includes(xfdcat);
				params = {
					usertalk,
					xfdcat,
					mergeinto,
					noinclude,
					reason,
					fwdcsdreason,
					logpage,
					lognomination,
				};
				Morebits.wiki.addCheckpoint();
				// Updating data for the action completed event
				Morebits.wiki.actionCompleted.redirect = logpage;
				Morebits.wiki.actionCompleted.notice = '提名完成，重定向到讨论页';
				// Tagging page
				const isScribunto = mw.config.get('wgPageContentModel') === 'Scribunto';
				qiuwen_page = isScribunto
					? new Morebits.wiki.page(`${mw.config.get('wgPageName')}/doc`, '加入存废讨论模板到模块文件页')
					: new Morebits.wiki.page(mw.config.get('wgPageName'), '加入存废讨论模板到页面');
				qiuwen_page.setFollowRedirect(false);
				qiuwen_page.setCallbackParameters(params);
				qiuwen_page.load(Twinkle.xfd.callbacks.afd.tryTagging);
				Morebits.wiki.removeCheckpoint();
				break;
			}
			case 'ffd':
				// FFD
				logpage = `Qiuwen:存废讨论/记录/${date.format('YYYY/MM/DD', 'utc')}`;
				lognomination =
					Twinkle.getPref('logXfdNominations') && !Twinkle.getPref('noLogOnXfdNomination').includes('ffd');
				params = {
					usertalk,
					reason,
					logpage,
					lognomination,
				};
				Morebits.wiki.addCheckpoint();
				// Updating data for the action completed event
				Morebits.wiki.actionCompleted.redirect = logpage;
				Morebits.wiki.actionCompleted.notice = '提名完成，重定向到讨论页';
				// Tagging file
				qiuwen_page = new Morebits.wiki.page(mw.config.get('wgPageName'), '加入存废讨论模板到文件描述页');
				qiuwen_page.setFollowRedirect(false);
				qiuwen_page.setCallbackParameters(params);
				qiuwen_page.load(Twinkle.xfd.callbacks.ffd.tryTagging);
				Morebits.wiki.removeCheckpoint();
				break;
			default:
				alert('twinklexfd：未定义的类别');
				break;
		}
	};
	Twinkle.addInitCallback(Twinkle.xfd, 'xfd');
})($);
