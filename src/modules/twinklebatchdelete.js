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
			(mw.config.get("wgCurRevisionId") && mw.config.get("wgNamespaceNumber") > 0 ||
				mw.config.get("wgCanonicalSpecialPageName") === "Prefixindex" ||
				mw.config.get("wgCanonicalSpecialPageName") === "BrokenRedirects")
	) {
		Twinkle.addPortletLink(Twinkle.batchdelete.callback, "批删", "tw-batch", "删除此分类或页面中的所有链接");
	}
};
Twinkle.batchdelete.unlinkCache = {};

// Has the subpages list been loaded?
let subpagesLoaded;
Twinkle.batchdelete.callback = () => {
	subpagesLoaded = false;
	const Window = new Morebits.simpleWindow(600, 400);
	Window.setTitle("批量删除");
	Window.setScriptName("Twinkle");
	Window.addFooterLink("帮助文档", "H:TW/DOC#批量删除");
	Window.addFooterLink("问题反馈", "HT:TW");
	const form = new Morebits.quickForm(Twinkle.batchdelete.callback.evaluate);
	form.append({
		type: "checkbox",
		list: [
			{
				label: "删除页面",
				name: "delete_page",
				value: "delete",
				checked: true,
				subgroup: {
					type: "checkbox",
					list: [
						{
							label: "删除关联的讨论页（用户讨论页除外）",
							name: "delete_talk",
							value: "delete_talk",
							checked: true
						},
						{
							label: "删除到已删页面的重定向页",
							name: "delete_redirects",
							value: "delete_redirects",
							checked: true
						},
						{
							label: "删除已删页面的子页面",
							name: "delete_subpages",
							value: "delete_subpages",
							checked: false,
							event: Twinkle.batchdelete.callback.toggleSubpages,
							subgroup: {
								type: "checkbox",
								list: [
									{
										label: "删除已删子页面的讨论页",
										name: "delete_subpage_talks",
										value: "delete_subpage_talks"
									},
									{
										label: "删除到已删子页面的重定向页",
										name: "delete_subpage_redirects",
										value: "delete_subpage_redirects"
									},
									{
										label: "取消所有已删页面的链入（仅处理条目）",
										name: "unlink_subpages",
										value: "unlink_subpages"
									}
								]
							}
						}
					]
				}
			},
			{
				label: "取消链入（仅处理条目）",
				name: "unlink_page",
				value: "unlink",
				checked: false
			},
			{
				label: "移除文件使用（所有命名空间）",
				name: "unlink_file",
				value: "unlink_file",
				checked: true
			}
		]
	});
	form.append({
		type: "select",
		name: "common_reason",
		label: "常用理由：",
		list: Twinkle.batchdelete.deletereasonlist,
		event: Twinkle.batchdelete.callback.change_common_reason
	});
	form.append({
		type: "input",
		name: "reason",
		label: "理由：",
		size: 60
	});
	const query = {
		action: "query",
		prop: "revisions|info|imageinfo",
		inprop: "protection",
		rvprop: "size|user",
		format: "json"
	};

	// On categories
	if (mw.config.get("wgNamespaceNumber") === 14) {
		query.generator = "categorymembers";
		query.gcmtitle = mw.config.get("wgPageName");
		query.gcmlimit = Twinkle.getPref("batchMax");

		// On Special:PrefixIndex
	} else if (mw.config.get("wgCanonicalSpecialPageName") === "Prefixindex") {
		query.generator = "allpages";
		query.gaplimit = Twinkle.getPref("batchMax");
		if (mw.util.getParamValue("prefix")) {
			query.gapnamespace = mw.util.getParamValue("namespace");
			query.gapprefix = mw.util.getParamValue("prefix");
		} else {
			let pathSplit = decodeURIComponent(location.pathname).split("/");
			if (pathSplit.length < 3 || pathSplit[2] !== "Special:前缀索引") {
				return;
			}
			const titleSplit = pathSplit[3].split(":");
			query.gapnamespace = mw.config.get("wgNamespaceIds")[titleSplit[0].toLowerCase()];
			if (titleSplit.length < 2 || typeof query.gapnamespace === "undefined") {
				query.gapnamespace = 0; // article namespace
				query.gapprefix = pathSplit.splice(3).join("/");
			} else {
				pathSplit = pathSplit.splice(4);
				pathSplit.splice(0, 0, titleSplit.splice(1).join(":"));
				query.gapprefix = pathSplit.join("/");
			}
		}

		// On normal pages
	} else {
		query.generator = "links";
		query.titles = mw.config.get("wgPageName");
		query.gpllimit = Twinkle.getPref("batchMax");
	}
	const statusdiv = document.createElement("div");
	statusdiv.style.padding = "15px"; // just so it doesn't look broken
	Window.setContent(statusdiv);
	Morebits.status.init(statusdiv);
	Window.display();
	Twinkle.batchdelete.pages = {};
	const statelem = new Morebits.status("抓取页面列表");
	const qiuwen_api = new Morebits.wiki.api(
		"加载中……",
		query,
		(apiobj) => {
			const response = apiobj.getResponse();
			let pages = response.query && response.query.pages || [];
			pages = pages.filter((page) => !page.missing && page.imagerepository !== "shared");
			pages.sort(Twinkle.sortByNamespace);
			pages.forEach((page) => {
				const metadata = [];
				if (page.redirect) {
					metadata.push("重定向");
				}
				const editProt = page.protection.filter((pr) => pr.type === "edit" && pr.level === "sysop").pop();
				if (editProt) {
					metadata.push(`全保护${editProt.expiry === "infinity" ? "（无限期）" : `（${new Morebits.date(editProt.expiry).calendar("utc")} (UTC)过期）`}`);
				}
				if (page.ns === 6) {
					metadata.push(`上传者：${page.imageinfo[0].user}`);
					metadata.push(`最后编辑：${page.revisions[0].user}`);
				} else {
					metadata.push(`${mw.language.convertNumber(page.revisions[0].size)}字节`);
				}
				const title = page.title;
				Twinkle.batchdelete.pages[title] = {
					label: title + (metadata.length ? `（${metadata.join("、")}）` : ""),
					value: title,
					checked: true,
					style: editProt ? "color:red" : ""
				};
			});
			const form = apiobj.params.form;
			form.append({
				type: "header",
				label: "待删除页面"
			});
			form.append({
				type: "button",
				label: "全选",
				event: () => {
					$(result)
						.find("input[name=pages]:not(:checked)")
						.each((_, e) => {
							e.click(); // check it, and invoke click event so that subgroup can be shown
						});

					// Check any unchecked subpages too
					$('input[name="pages.subpages"]').prop("checked", true);
				}
			});
			form.append({
				type: "button",
				label: "全不选",
				event: () => {
					$(result)
						.find("input[name=pages]:checked")
						.each((_, e) => {
							e.click(); // uncheck it, and invoke click event so that subgroup can be hidden
						});
				}
			});

			form.append({
				type: "checkbox",
				name: "pages",
				id: "tw-dbatch-pages",
				shiftClickSupport: true,
				list: $.map(Twinkle.batchdelete.pages, (e) => e)
			});
			form.append({
				type: "submit"
			});
			const result = form.render();
			apiobj.params.Window.setContent(result);
			Morebits.quickForm.getElements(result, "pages").forEach(Twinkle.generateArrowLinks);
		},
		statelem
	);
	qiuwen_api.params = {
		form: form,
		Window: Window
	};
	qiuwen_api.post();
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
		type: "checkbox",
		name: "pages",
		id: "tw-dbatch-pages",
		shiftClickSupport: true,
		list: $.map(Twinkle.batchdelete.pages, (e) => e)
	}).render();
};
Twinkle.batchdelete.deletereasonlist = [
	{
		label: "请选择",
		value: ""
	},
	{
		label: "G1：明显违反法律法规或违背公序良俗的页面",
		value: "[[QW:G1|G1]]：明显违反法律法规或违背公序良俗的页面"
	},
	{
		label: "G2：没有实际内容的页面",
		value: "[[QW:G2|G2]]：没有实际内容的页面"
	},
	{
		label: "G3：纯粹破坏",
		value: "[[QW:G3|G3]]：纯粹[[QW:VAN|破坏]]"
	},
	{
		label: "G5：因技术原因删除页面",
		value: "[[QW:G5|G5]]：因技术原因删除页面"
	},
	{
		label: "G6：原作者提请删除或清空页面，且页面原作者仅有一人",
		value: "[[QW:G6|G6]]：原作者提请删除或清空页面，且页面原作者仅有一人"
	},
	{
		label: "G9：孤立页面",
		value: "[[QW:G9|G9]]：孤立页面"
	},
	{
		label: "R1：不能发挥实际作用的重定向",
		value: "[[QW:R1|R1]]：不能发挥实际作用的重定向"
	},
	{
		label: "R2：名称与导向目标代表事物不一致或不完全一致的重定向",
		value: "[[QW:R2|R2]]：名称与导向目标代表事物不一致或不完全一致的重定向"
	},
	{
		label: "F1：不符合本站著作权方针的文件",
		value: "[[QW:F1|F1]]：不符合本站著作权方针的文件"
	},
	{
		label: "O1：用户请求删除自己的用户页",
		value: "[[QW:O1|O1]]：用户请求删除自己的用户页"
	},
	{
		label: "O2：空分类",
		value: "[[QW:O2|O2]]：空分类"
	},
	{
		label: "O3：废弃草稿",
		value: "[[QW:O3|O3]]：废弃草稿"
	}
];
Twinkle.batchdelete.callback.change_common_reason = (e) => {
	if (e.target.form.reason.value !== "") {
		e.target.form.reason.value = Morebits.string.appendPunctuation(e.target.form.reason.value);
	}
	e.target.form.reason.value += e.target.value;
	e.target.value = "";
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
			$.each(Twinkle.batchdelete.pages, (i, el) => {
				// Get back the subgroup from subgroup_, where we saved it
				if (el.subgroup === null && el.subgroup_) {
					el.subgroup = el.subgroup_;
				}
			});
			newPageList = Twinkle.batchdelete.generateNewPageList(form);
			$("#tw-dbatch-pages").replaceWith(newPageList);
			Morebits.quickForm.getElements(newPageList, "pages").forEach(Twinkle.generateArrowLinks);
			Morebits.quickForm.getElements(newPageList, "pages.subpages").forEach(Twinkle.generateArrowLinks);
			return;
		}

		// Proceed with API calls to get list of subpages
		const loadingText = '<strong id="dbatch-subpage-loading">加载中...</strong>';
		$(e.target).after(loadingText);
		const pages = $(form.pages)
			.map((i, el) => el.value)
			.get();
		const subpageLister = new Morebits.batchOperation();
		subpageLister.setOption("chunkSize", Twinkle.getPref("batchChunks"));
		subpageLister.setPageList(pages);
		subpageLister.run(
			(pageName) => {
				const pageTitle = mw.Title.newFromText(pageName);

				// No need to look for subpages in main/file/mediawiki space
				if ([0, 6, 8].indexOf(pageTitle.namespace) > -1) {
					subpageLister.workerSuccess();
					return;
				}
				const qiuwen_api = new Morebits.wiki.api(
					`正在获取“${pageName}”的子页面`,
					{
						action: "query",
						prop: "revisions|info|imageinfo",
						generator: "allpages",
						rvprop: "size",
						inprop: "protection",
						gapprefix: `${pageTitle.title}/`,
						gapnamespace: pageTitle.namespace,
						gaplimit: "max",
						// 500 is max for normal users, 5000 for bots and sysops
						format: "json"
					},
					(apiobj) => {
						const response = apiobj.getResponse();
						const pages = response.query && response.query.pages || [];
						const subpageList = [];
						pages.sort(Twinkle.sortByNamespace);
						pages.forEach((page) => {
							const metadata = [];
							if (page.redirect) {
								metadata.push("重定向");
							}
							const editProt = page.protection.filter((pr) => pr.type === "edit" && pr.level === "sysop").pop();
							if (editProt) {
								metadata.push(`全保护（${editProt.expiry === "infinity" ? "永久" : `至${new Morebits.date(editProt.expiry).calendar("utc")} (UTC)过期`}`);
							}
							if (page.ns === 6) {
								metadata.push(`上传者：${page.imageinfo[0].user}`);
								metadata.push(`最后编辑：${page.revisions[0].user}`);
							} else {
								metadata.push(`${mw.language.convertNumber(page.revisions[0].size)}字节`);
							}
							const title = page.title;
							subpageList.push({
								label: title + (metadata.length ? ` (${metadata.join("; ")})` : ""),
								value: title,
								checked: true,
								style: editProt ? "color:red" : ""
							});
						});
						if (subpageList.length) {
							const pageName = apiobj.params.pageNameFull;
							Twinkle.batchdelete.pages[pageName].subgroup = {
								type: "checkbox",
								name: "subpages",
								className: "dbatch-subpages",
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
				qiuwen_api.params = {
					pageNameFull: pageName
				}; // Used in onSuccess()
				qiuwen_api.post();
			},
			() => {
				// List 'em on the interface
				newPageList = Twinkle.batchdelete.generateNewPageList(form);
				$("#tw-dbatch-pages").replaceWith(newPageList);
				Morebits.quickForm.getElements(newPageList, "pages").forEach(Twinkle.generateArrowLinks);
				Morebits.quickForm.getElements(newPageList, "pages.subpages").forEach(Twinkle.generateArrowLinks);
				subpagesLoaded = true;

				// Remove "Loading... " text
				$("#dbatch-subpage-loading").remove();
			}
		);
	} else if (!e.target.checked) {
		$.each(Twinkle.batchdelete.pages, (i, el) => {
			if (el.subgroup) {
				// Remove subgroup after saving its contents in subgroup_
				// so that it can be retrieved easily if user decides to
				// delete the subpages again
				el.subgroup_ = el.subgroup;
				el.subgroup = null;
			}
		});
		newPageList = Twinkle.batchdelete.generateNewPageList(form);
		$("#tw-dbatch-pages").replaceWith(newPageList);
		Morebits.quickForm.getElements(newPageList, "pages").forEach(Twinkle.generateArrowLinks);
	}
};
Twinkle.batchdelete.callback.evaluate = (event) => {
	Morebits.wiki.actionCompleted.notice = "批量删除已完成";
	const form = event.target;
	const numProtected = $(Morebits.quickForm.getElements(form, "pages")).filter((index, element) => element.checked && element.nextElementSibling.style.color === "red").length;
	if (numProtected > 0 && !confirm(`您将删除${mw.language.convertNumber(numProtected)}个全保护页面，您确定吗？`)) {
		return;
	}
	const input = Morebits.quickForm.getInputData(form);
	if (!input.reason) {
		alert("您需要给出一个理由");
		return;
	}
	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);
	if (input.pages.length === 0) {
		Morebits.status.error("错误", "没有要删除的内容，中止");
		return;
	}
	const pageDeleter = new Morebits.batchOperation(input.delete_page ? "正在删除页面" : "正在启动要求的任务");
	pageDeleter.setOption("chunkSize", Twinkle.getPref("batchChunks"));
	// we only need the initial status lines if we're deleting the pages in the pages array
	pageDeleter.setOption("preserveIndividualStatusLines", input.delete_page);
	pageDeleter.setPageList(input.pages);
	pageDeleter.run(
		(pageName) => {
			const params = {
				page: pageName,
				delete_page: input.delete_page,
				delete_talk: input.delete_talk,
				delete_redirects: input.delete_redirects,
				unlink_page: input.unlink_page,
				unlink_file: input.unlink_file && new RegExp(`^${Morebits.namespaceRegex(6)}:`, "i").test(pageName),
				reason: input.reason,
				pageDeleter: pageDeleter
			};
			const qiuwen_page = new Morebits.wiki.page(pageName, `正在删除页面${pageName}`);
			qiuwen_page.setCallbackParameters(params);
			if (input.delete_page) {
				qiuwen_page.setEditSummary(`${input.reason}（批量）`);
				qiuwen_page.setChangeTags(Twinkle.changeTags);
				qiuwen_page.suppressProtectWarning();
				qiuwen_page.deletePage(Twinkle.batchdelete.callbacks.doExtras, pageDeleter.workerFailure);
			} else {
				Twinkle.batchdelete.callbacks.doExtras(qiuwen_page);
			}
		},
		() => {
			if (input.delete_subpages && input.subpages) {
				const subpageDeleter = new Morebits.batchOperation("正在删除子页面");
				subpageDeleter.setOption("chunkSize", Twinkle.getPref("batchChunks"));
				subpageDeleter.setOption("preserveIndividualStatusLines", true);
				subpageDeleter.setPageList(input.subpages);
				subpageDeleter.run((pageName) => {
					const params = {
						page: pageName,
						delete_page: true,
						delete_talk: input.delete_subpage_talks,
						delete_redirects: input.delete_subpage_redirects,
						unlink_page: input.unlink_subpages,
						unlink_file: false,
						reason: input.reason,
						pageDeleter: subpageDeleter
					};
					const qiuwen_page = new Morebits.wiki.page(pageName, `正在删除子页面${pageName}`);
					qiuwen_page.setCallbackParameters(params);
					qiuwen_page.setEditSummary(`${input.reason}（批量）`);
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
				action: "query",
				list: "backlinks",
				blfilterredir: "nonredirects",
				blnamespace: [0],
				// main space only
				bltitle: params.page,
				bllimit: "max",
				// 500 is max for normal users, 5000 for bots and sysops
				format: "json"
			};
			qiuwen_api = new Morebits.wiki.api("正在获取链入页面", query, Twinkle.batchdelete.callbacks.unlinkBacklinksMain);
			qiuwen_api.params = params;
			qiuwen_api.post();
		}
		if (params.unlink_file) {
			query = {
				action: "query",
				list: "imageusage",
				iutitle: params.page,
				iulimit: "max",
				// 500 is max for normal users, 5000 for bots and sysops
				format: "json"
			};
			qiuwen_api = new Morebits.wiki.api("正在获取文件链入", query, Twinkle.batchdelete.callbacks.unlinkImageInstancesMain);
			qiuwen_api.params = params;
			qiuwen_api.post();
		}
		if (params.delete_page) {
			if (params.delete_redirects) {
				query = {
					action: "query",
					titles: params.page,
					prop: "redirects",
					rdlimit: "max",
					// 500 is max for normal users, 5000 for bots and sysops
					format: "json"
				};
				qiuwen_api = new Morebits.wiki.api("正在获取重定向", query, Twinkle.batchdelete.callbacks.deleteRedirectsMain);
				qiuwen_api.params = params;
				qiuwen_api.post();
			}
			if (params.delete_talk) {
				const pageTitle = mw.Title.newFromText(params.page);
				if (pageTitle && pageTitle.namespace % 2 === 0 && pageTitle.namespace !== 2) {
					pageTitle.namespace++; // now pageTitle is the talk page title!
					query = {
						action: "query",
						titles: pageTitle.toText(),
						format: "json"
					};
					qiuwen_api = new Morebits.wiki.api("正在检查讨论页是否存在", query, Twinkle.batchdelete.callbacks.deleteTalk);
					qiuwen_api.params = params;
					qiuwen_api.params.talkPage = pageTitle.toText();
					qiuwen_api.post();
				}
			}
		}
	},
	deleteRedirectsMain: (apiobj) => {
		const response = apiobj.getResponse();
		let pages = response.query.pages[0].redirects || [];
		pages = pages.map((redirect) => redirect.title);
		if (!pages.length) {
			return;
		}
		const redirectDeleter = new Morebits.batchOperation(`正在删除到${apiobj.params.page}的重定向`);
		redirectDeleter.setOption("chunkSize", Twinkle.getPref("batchChunks"));
		redirectDeleter.setPageList(pages);
		redirectDeleter.run((pageName) => {
			const qiuwen_page = new Morebits.wiki.page(pageName, `正在删除 ${pageName}`);
			qiuwen_page.setEditSummary(`[[QW:G9|G9]]：孤立页面（已删页面“${apiobj.params.page}”的讨论页）`);
			qiuwen_page.setChangeTags(Twinkle.changeTags);
			qiuwen_page.deletePage(redirectDeleter.workerSuccess, redirectDeleter.workerFailure);
		});
	},
	deleteTalk: (apiobj) => {
		const response = apiobj.getResponse();

		// no talk page; forget about it
		if (response.query.pages[0].missing) {
			return;
		}
		const page = new Morebits.wiki.page(apiobj.params.talkPage, `正在取消到${apiobj.params.page}的链入`);
		page.setEditSummary(`[[QW:G9|G9]]：孤立页面（已删页面“${apiobj.params.page}”的讨论页）`);
		page.setChangeTags(Twinkle.changeTags);
		page.deletePage();
	},
	unlinkBacklinksMain: (apiobj) => {
		const response = apiobj.getResponse();
		let pages = response.query.backlinks || [];
		pages = pages.map((page) => page.title);
		if (!pages.length) {
			return;
		}
		const unlinker = new Morebits.batchOperation(`正在取消到${apiobj.params.page}的链入`);
		unlinker.setOption("chunkSize", Twinkle.getPref("batchChunks"));
		unlinker.setPageList(pages);
		unlinker.run((pageName) => {
			const qiuwen_page = new Morebits.wiki.page(pageName, `正在取消${pageName}上的链入`);
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
		pageobj.setEditSummary(`取消到已删页面${params.page}的链入`);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setPageText(text);
		pageobj.setCreateOption("nocreate");
		pageobj.setMaxConflictRetries(10);
		pageobj.save(params.unlinker.workerSuccess, params.unlinker.workerFailure);
	},
	unlinkImageInstancesMain: (apiobj) => {
		const response = apiobj.getResponse();
		let pages = response.query.imageusage || [];
		pages = pages.map((page) => page.title);
		if (!pages.length) {
			return;
		}
		const unlinker = new Morebits.batchOperation(`正在取消到${apiobj.params.page}的链入`);
		unlinker.setOption("chunkSize", Twinkle.getPref("batchChunks"));
		unlinker.setPageList(pages);
		unlinker.run((pageName) => {
			const qiuwen_page = new Morebits.wiki.page(pageName, `取消${pageName}的文件使用`);
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
		const image = params.page.replace(new RegExp(`^${Morebits.namespaceRegex(6)}:`), "");
		let text;
		if (params.title in Twinkle.batchdelete.unlinkCache) {
			text = Twinkle.batchdelete.unlinkCache[params.title];
		} else {
			text = pageobj.getPageText();
		}
		const old_text = text;
		const wikiPage = new Morebits.wikitext.page(text);
		text = wikiPage.commentOutImage(image, "因文件已删，故注释之").getText();
		Twinkle.batchdelete.unlinkCache[params.title] = text;
		if (text === old_text) {
			pageobj.getStatusElement().error(`在 ${pageobj.getPageName()} 上取消 ${image} 的文件使用失败`);
			params.unlinker.workerFailure(pageobj);
			return;
		}
		pageobj.setEditSummary(`取消使用已被删除文件${image}，因为：${params.reason}`);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setPageText(text);
		pageobj.setCreateOption("nocreate");
		pageobj.setMaxConflictRetries(10);
		pageobj.save(params.unlinker.workerSuccess, params.unlinker.workerFailure);
	}
};
Twinkle.addInitCallback(Twinkle.batchdelete, "batchdelete");
})(jQuery);
/* </nowiki> */
