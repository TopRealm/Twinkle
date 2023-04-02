/* <nowiki> */
/**
 * SPDX-License-Identifier: CC-BY-SA-4.0
 * _addText: '{{Twinkle Header}}'
 *
 * @source https://git.qiuwen.wiki/InterfaceAdmin/Twinkle
 * @source https://git.qiuwen.wiki/Mirror/xiplus-twinkle
 * @author © 2011-2022 English Wikipedia Contributors
 * @author © 2021-2023 Chinese Wikipedia Contributors
 * @author © 2021-2023 Qiuwen Baike Contributors
 * @license <https://creativecommons.org/licenses/by-sa/4.0/>
 */
/* Twinkle.js - friendlytag.js */
(($) => {
/**
 * friendlytag.js: Tag module
 * Mode of invocation: Tab ("Tag")
 * Active on: Existing articles and drafts; file pages with a corresponding file
 * which is local (not on Share); all redirects
 */
Twinkle.tag = () => {
	// redirect tagging
	if (Morebits.isPageRedirect()) {
		Twinkle.tag.mode = '重定向';
		Twinkle.addPortletLink(Twinkle.tag.callback, '标记', 'friendly-tag', '标记重定向');
		// file tagging
	} else if (
		mw.config.get('wgNamespaceNumber') === 6 &&
			!document.querySelector('#mw-sharedupload') &&
			document.querySelector('#mw-imagepage-section-filehistory')
	) {
		Twinkle.tag.mode = '文件';
		Twinkle.addPortletLink(
			Twinkle.tag.callback,
			'标记',
			'friendly-tag',
			'为文件添加或移除标记'
		);
		// article/draft tagging
	} else if (
		[0, 118].includes(mw.config.get('wgNamespaceNumber')) &&
				mw.config.get('wgCurRevisionId') ||
			Morebits.pageNameNorm === Twinkle.getPref('sandboxPage')
	) {
		Twinkle.tag.mode = '条目';
		// Can't remove tags when not viewing current version
		Twinkle.tag.canRemove =
				mw.config.get('wgCurRevisionId') === mw.config.get('wgRevisionId') &&
				// Disabled on latest diff because the diff slider could be used to slide
				// away from the latest diff without causing the script to reload
				!mw.config.get('wgDiffNewId');
		Twinkle.addPortletLink(
			Twinkle.tag.callback,
			'标记',
			'friendly-tag',
			'为条目或移除添加标记'
		);
	}
};
Twinkle.tag.checkedTags = [];
Twinkle.tag.callback = () => {
	const Window = new Morebits.simpleWindow(630, Twinkle.tag.mode === '条目' ? 500 : 400);
	Window.setScriptName('Twinkle');
	// anyone got a good policy/guideline/info page/instructional page link?
	Window.addFooterLink('参数设置', 'H:TW/PREF#tag');
	Window.addFooterLink('帮助文档', 'H:TW/DOC#tag');
	Window.addFooterLink('问题反馈', 'HT:TW');
	const form = new Morebits.quickForm(Twinkle.tag.callback.evaluate);
	form.append({
		type: 'input',
		label: '筛选标记列表：',
		name: 'quickfilter',
		size: '30',
		event: function () {
			// flush the DOM of all existing underline spans
			$allCheckboxDivs.find('.search-hit').each((_i, e) => {
				const label_element = e.parentElement;
				// This would convert <label>Hello <span class=search-hit>wo</span>rld</label>
				// to <label>Hello world</label>
				label_element.innerHTML = label_element.textContent;
			});
			if (this.value) {
				$allCheckboxDivs.hide();
				$allHeaders.hide();
				const searchString = this.value;
				const searchRegex = new RegExp(mw.util.escapeRegExp(searchString), 'i');
				$allCheckboxDivs.find('label').each(function () {
					const label_text = this.textContent;
					const searchHit = searchRegex.exec(label_text);
					if (searchHit) {
						const range = document.createRange();
						const textnode = this.childNodes[0];
						range.selectNodeContents(textnode);
						range.setStart(textnode, searchHit.index);
						range.setEnd(textnode, searchHit.index + searchString.length);
						const underline_span = $('<span>')
							.addClass('search-hit')
							.css('text-decoration', 'underline')[0];
						range.surroundContents(underline_span);
						this.parentElement.style.display = 'block'; // show
					}
				});
			} else {
				$allCheckboxDivs.show();
				$allHeaders.show();
			}
		}
	});

	switch (Twinkle.tag.mode) {
		case '条目': {
			Window.setTitle('条目维护标记');
			// Build sorting and lookup object flatObject, which is always
			// needed but also used to generate the alphabetical list
			// Would be infinitely better with Object.values, but, alas, IE 11
			Twinkle.tag.article.flatObject = {};
			Twinkle.tag.article.tagList.forEach((group) => {
				group.value.forEach((subgroup) => {
					if (subgroup.value) {
						subgroup.value.forEach((item) => {
							Twinkle.tag.article.flatObject[item.tag] = {
								description: item.description,
								excludeMI: !!item.excludeMI
							};
						});
					} else {
						Twinkle.tag.article.flatObject[subgroup.tag] = {
							description: subgroup.description,
							excludeMI: !!subgroup.excludeMI
						};
					}
				});
			});

			form.append({
				type: 'select',
				name: 'sortorder',
				label: '查看列表：',
				tooltip: '您可以在Twinkle参数设置（H:TW/PREF）中更改此项。',
				event: Twinkle.tag.updateSortOrder,
				list: [
					{
						type: 'option',
						value: 'cat',
						label: '按类型',
						selected: Twinkle.getPref('tagArticleSortOrder') === 'cat'
					},
					{
						type: 'option',
						value: 'alpha',
						label: '按字母顺序',
						selected: Twinkle.getPref('tagArticleSortOrder') === 'alpha'
					}
				]
			});

			if (!Twinkle.tag.canRemove) {
				const divElement = document.createElement('div');
				divElement.innerHTML = '要移除现有维护标记，请从当前条目版本中打开“标记”菜单';
				form.append({
					type: 'div',
					name: 'untagnotice',
					label: divElement
				});
			}

			form.append({
				type: 'div',
				id: 'tagWorkArea',
				className: 'morebits-scrollbox',
				style: 'max-height: 28em'
			});

			form.append({
				type: 'checkbox',
				list: [
					{
						label: '如可能，合并入{{multiple issues}}',
						value: 'group',
						name: 'group',
						tooltip:
								'若加入{{multiple issues}}支持的三个以上的模板，所有支持的模板都会被合并入{{multiple issues}}模板中。',
						checked: Twinkle.getPref('groupByDefault')
					}
				]
			});

			form.append({
				type: 'input',
				label: '理由：',
				name: 'reason',
				tooltip:
						'附加于编辑摘要的可选理由，例如指出条目内容的哪些部分有问题或移除模板的理由，但若理由很长则应该发表在讨论页。',
				size: '80'
			});

			break;
		}
		case '文件': {
			Window.setTitle('文件维护标记');

			Twinkle.tag.fileList.forEach((group) => {
				if (group.buildFilename) {
					group.value.forEach((el) => {
						el.subgroup = {
							type: 'input',
							label: '替换的文件：',
							tooltip: '输入替换此文件的文件名称（必填）',
							name: `${el.value.replace(/ /g, '_')}File`
						};
					});
				}

				form.append({ type: 'header', label: group.key });
				form.append({ type: 'checkbox', name: 'tags', list: group.value });
			});

			if (Twinkle.getPref('customFileTagList').length > 0) {
				form.append({ type: 'header', label: '自定义模板' });
				form.append({
					type: 'checkbox',
					name: 'tags',
					list: Twinkle.getPref('customFileTagList')
				});
			}
			break;
		}
		case '重定向': {
			Window.setTitle('重定向标记');

			const i = 1;
			Twinkle.tag.redirectList.forEach((group) => {
				form.append({ type: 'header', id: `tagHeader${i}`, label: group.key });
				form.append({
					type: 'checkbox',
					name: 'tags',
					list: group.value.map((item) => ({
						value: item.tag,
						label: `{{${item.tag}}}：${item.description}`,
						subgroup: item.subgroup
					}))
				});
			});

			if (Twinkle.getPref('customRedirectTagList').length > 0) {
				form.append({ type: 'header', label: '自定义模板' });
				form.append({
					type: 'checkbox',
					name: 'tags',
					list: Twinkle.getPref('customRedirectTagList')
				});
			}
			break;
		}
		default: {
			alert(`Twinkle.tag：未知模式 ${Twinkle.tag.mode}`);
			break;
		}
	}

	if (document.querySelectorAll('.patrollink').length > 0) {
		form.append({
			type: 'checkbox',
			list: [
				{
					label: '标记页面为已巡查',
					value: 'patrol',
					name: 'patrol',
					checked: Twinkle.getPref('markTaggedPagesAsPatrolled')
				}
			]
		});
	}
	form.append({ type: 'submit', className: 'tw-tag-submit' });

	const result = form.render();
	Window.setContent(result);
	Window.display();

	// for quick filter:
	$allCheckboxDivs = $(result).find('[name$=tags]').parent();
	$allHeaders = $(result).find('h5');
	result.quickfilter.focus(); // place cursor in the quick filter field as soon as window is opened
	result.quickfilter.autocomplete = 'off'; // disable browser suggestions
	result.quickfilter.addEventListener('keypress', (e) => {
		if (e.keyCode === 13) {
			// prevent enter key from accidentally submitting the form
			e.preventDefault();
			return false;
		}
	});

	if (Twinkle.tag.mode === '条目') {
		Twinkle.tag.alreadyPresentTags = [];

		if (Twinkle.tag.canRemove) {
			// Look for existing maintenance tags in the lead section and put them in array
			// All tags are HTML table elements that are direct children of .mw-parser-output,
			// except when they are within {{multiple issues}}
			$('.mw-parser-output')
				.children()
				.each((_i, e) => {
					// break out on encountering the first heading, which means we are no
					// longer in the lead section
					if (e.tagName === 'H2') {
						return false;
					}

					// The ability to remove tags depends on the template's {{ambox}} |name=
					// parameter bearing the template's correct name (preferably) or a name that at
					// least redirects to the actual name
					// All tags have their first class name as "box-" + template name
					if (e.className.indexOf('box-') === 0) {
						if (e.classList[0] === 'box-问题条目') {
							$(e)
								.find('.ambox')
								.each((_idx, e) => {
									if (e.classList[0].indexOf('box-') === 0) {
										const tag = e.classList[0]
											.slice('box-'.length)
											.replace(/_/g, ' ');
										Twinkle.tag.alreadyPresentTags.push(tag);
									}
								});
							return true; // continue
						}

						const tag = e.classList[0].slice('box-'.length).replace(/_/g, ' ');
						Twinkle.tag.alreadyPresentTags.push(tag);
					}
				});

			// {{Uncategorized}} and {{Improve categories}} are usually placed at the end
			if ($('.box-Uncategorized').length > 0) {
				Twinkle.tag.alreadyPresentTags.push('Uncategorized');
			}
			if ($('.box-Improve_categories').length > 0) {
				Twinkle.tag.alreadyPresentTags.push('Improve categories');
			}
		}

		// Add status text node after Submit button
		const statusNode = document.createElement('small');
		statusNode.id = 'tw-tag-status';
		Twinkle.tag.status = {
			// initial state; defined like this because these need to be available for reference
			// in the click event handler
			numAdded: 0,
			numRemoved: 0
		};
		$('button.tw-tag-submit').after(statusNode);

		// fake a change event on the sort dropdown, to initialize the tag list
		const evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		result.sortorder.dispatchEvent(evt);
	} else {
		// Redirects and files: Add a link to each template's description page
		Morebits.quickForm.getElements(result, 'tags').forEach(generateLinks);
	}
};

// $allCheckboxDivs and $allHeaders are defined globally, rather than in the
// quickfilter event function, to avoid having to recompute them on every keydown
let $allCheckboxDivs;

let $allHeaders;

Twinkle.tag.updateSortOrder = (e) => {
	const form = e.target.form;
	const sortorder = e.target.value;
	Twinkle.tag.checkedTags = form.getChecked('tags');

	const container = new Morebits.quickForm.element({ type: 'fragment' });

	// function to generate a checkbox, with appropriate subgroup if needed
	const makeCheckbox = (tag, description) => {
		const checkbox = { value: tag, label: `{{${tag}}}: ${description}` };
		if (Twinkle.tag.checkedTags.includes(tag)) {
			checkbox.checked = true;
		}
		switch (tag) {
			/* case 'Expand language': {
					checkbox.subgroup = [
						{
							name: 'expandLanguage',
							type: 'input',
							label: '外语版本语言代码（必填）：'
						},
						{
							type: 'checkbox',
							list: [
								{
									name: 'highQualityArticle',
									label: '高品质条目'
								}
							]
						},
						{
							name: 'expandLanguage2',
							type: 'input',
							label: '外语版本语言代码：'
						},
						{
							type: 'checkbox',
							list: [
								{
									name: 'highQualityArticle2',
									label: '高品质条目'
								}
							]
						},
						{
							name: 'expandLanguage3',
							type: 'input',
							label: '外语版本语言代码：'
						},
						{
							type: 'checkbox',
							list: [
								{
									name: 'highQualityArticle3',
									label: '高品质条目'
								}
							]
						}
					];
					break;
				} */
			case 'Expert needed': {
				checkbox.subgroup = [
					{
						name: 'expert',
						type: 'input',
						label: '哪个领域的专家（必填）：',
						tooltip: '必填，可参考 Category:需要专业人士关注的页面 使用现存的分类。'
					},
					{
						name: 'expert2',
						type: 'input',
						label: '哪个领域的专家：',
						tooltip: '可选，可参考 Category:需要专业人士关注的页面 使用现存的分类。'
					},
					{
						name: 'expert3',
						type: 'input',
						label: '哪个领域的专家：',
						tooltip: '可选，可参考 Category:需要专业人士关注的页面 使用现存的分类。'
					}
				];
				break;
			}
			case 'Merge':
			case 'Merge from':
			case 'Merge to': {
				let otherTagName = 'Merge';
				switch (tag) {
					case 'Merge from': {
						otherTagName = 'Merge to';
						break;
					}
					case 'Merge to': {
						otherTagName = 'Merge from';
						break;
					}
						// no default
				}
				checkbox.subgroup = [
					{
						name: 'mergeTarget',
						type: 'input',
						label: '其他条目：',
						tooltip: '如指定多个条目，请用管道符分隔：条目甲|条目乙'
					},
					{
						type: 'checkbox',
						list: [
							{
								name: 'mergeTagOther',
								label: `用{{${otherTagName}}}标记其他条目`,
								checked: true,
								tooltip: '仅在只输入了一个条目名时可用'
							}
						]
					}
				];
				if (mw.config.get('wgNamespaceNumber') === 0) {
					checkbox.subgroup.push({
						name: 'mergeReason',
						type: 'textarea',
						label: `合并理由（会被贴上${
							tag === 'Merge to' ? '其他' : '这'
						}条目的讨论页）：`,
						tooltip:
								'可选，但强烈推荐。如不需要请留空。仅在只输入了一个条目名时可用。'
					});
				}
				break;
			}
			case 'Missing information': {
				checkbox.subgroup = {
					name: 'missingInformation',
					type: 'input',
					label: '缺少的内容（必填）：',
					tooltip: '必填，显示为“缺少有关……的信息。”'
				};
				break;
			}
			case 'Notability': {
				checkbox.subgroup = {
					name: 'notability',
					type: 'select',
					list: [
						{ label: '{{Notability}}：' + '通用的关注度指引', value: 'none' },
						{ label: '{{Notability|Astro}}：' + '天体', value: 'Astro' },
						{
							label: '{{Notability|Biographies}}：' + '人物传记',
							value: 'Biographies'
						},
						{ label: '{{Notability|Book}}：' + '书籍', value: 'Book' },
						{
							label: '{{Notability|Companies}}：' + '组织与公司',
							value: 'Companies'
						},
						{ label: '{{Notability|Cyclone}}：' + '气旋', value: 'Cyclone' },
						{ label: '{{Notability|Fiction}}：' + '虚构事物', value: 'Fiction' },
						{
							label: '{{Notability|Geographic}}：' + '地理特征',
							value: 'Geographic'
						},
						{ label: '{{Notability|Geometry}}：' + '几何图形', value: 'Geometry' },
						{
							label: '{{Notability|Invention}}：' + '发明、研究',
							value: 'Invention'
						},
						{ label: '{{Notability|Music}}：' + '音乐', value: 'Music' },
						{ label: '{{Notability|Numbers}}：' + '数字', value: 'Numbers' },
						{ label: '{{Notability|Property}}：' + '性质表', value: 'Property' },
						{ label: '{{Notability|Traffic}}：' + '交通', value: 'Traffic' },
						{
							label: '{{Notability|Web}}：' + '网站、网络内容' + '（非正式指引）',
							value: 'Web'
						}
					]
				};
				break;
			}
			case 'Requested move': {
				checkbox.subgroup = [
					{
						name: 'moveTarget',
						type: 'input',
						label: '新名称：'
					},
					{
						name: 'moveReason',
						type: 'textarea',
						label: '移动理由（会被粘贴该条目的讨论页）：',
						tooltip: '可选，但强烈推荐。如不需要请留空。'
					}
				];
				break;
			}
			case 'Split': {
				checkbox.subgroup = [
					{
						name: 'target1',
						type: 'input',
						label: '页面名1：',
						tooltip: '可选。'
					},
					{
						name: 'target2',
						type: 'input',
						label: '页面名2：',
						tooltip: '可选。'
					},
					{
						name: 'target3',
						type: 'input',
						label: '页面名3：',
						tooltip: '可选。'
					}
				];
				break;
			}
			case 'Cleanup': {
				checkbox.subgroup = [
					{
						name: 'cleanupReason',
						type: 'input',
						label: '需要清理的理由',
						tooltip: '可选，但强烈推荐。如不需要请留空。'
					}
				];
				break;
			}
			default: {
				break;
			}
		}
		return checkbox;
	};

	const makeCheckboxesForAlreadyPresentTags = () => {
		container.append({ type: 'header', id: 'tagHeader0', label: '已放置的维护标记' });
		const subdiv = container.append({ type: 'div', id: 'tagSubdiv0' });
		const checkboxes = [];
		const unCheckedTags = e.target.form.getUnchecked('existingTags');
		Twinkle.tag.alreadyPresentTags.forEach((tag) => {
			const checkbox = {
				value: tag,
				label: `{{${tag}}}${
					Twinkle.tag.article.flatObject[tag]
						? `: ${Twinkle.tag.article.flatObject[tag].description}`
						: ''
				}`,
				checked: !unCheckedTags.includes(tag)
			};

			checkboxes.push(checkbox);
		});
		subdiv.append({
			type: 'checkbox',
			name: 'existingTags',
			list: checkboxes
		});
	};

	if (sortorder === 'cat') {
		// categorical sort order
		// function to iterate through the tags and create a checkbox for each one
		const doCategoryCheckboxes = (subdiv, subgroup) => {
			const checkboxes = [];
			$.each(subgroup, (_k, item) => {
				if (!Twinkle.tag.alreadyPresentTags.includes(item.tag)) {
					checkboxes.push(makeCheckbox(item.tag, item.description));
				}
			});
			subdiv.append({
				type: 'checkbox',
				name: 'tags',
				list: checkboxes
			});
		};

		if (Twinkle.tag.alreadyPresentTags.length > 0) {
			makeCheckboxesForAlreadyPresentTags();
		}
		let i = 1;
		// go through each category and sub-category and append lists of checkboxes
		Twinkle.tag.article.tagList.forEach((group) => {
			container.append({ type: 'header', id: `tagHeader${i}`, label: group.key });
			const subdiv = container.append({ type: 'div', id: `tagSubdiv${i++}` });
			if (group.value[0].tag) {
				doCategoryCheckboxes(subdiv, group.value);
			} else {
				group.value.forEach((subgroup) => {
					subdiv.append({
						type: 'div',
						label: [Morebits.htmlNode('b', subgroup.key)]
					});
					doCategoryCheckboxes(subdiv, subgroup.value);
				});
			}
		});
	} else {
		// alphabetical sort order
		if (Twinkle.tag.alreadyPresentTags.length > 0) {
			makeCheckboxesForAlreadyPresentTags();
			container.append({ type: 'header', id: 'tagHeader1', label: '可用的维护标记' });
		}

		// Avoid repeatedly resorting
		Twinkle.tag.article.alphabeticalList ||= Object.keys(
			Twinkle.tag.article.flatObject
		).sort();
		const checkboxes = [];
		Twinkle.tag.article.alphabeticalList.forEach((tag) => {
			if (!Twinkle.tag.alreadyPresentTags.includes(tag)) {
				checkboxes.push(
					makeCheckbox(tag, Twinkle.tag.article.flatObject[tag].description)
				);
			}
		});
		container.append({
			type: 'checkbox',
			name: 'tags',
			list: checkboxes
		});
	}

	// append any custom tags
	if (Twinkle.getPref('customTagList').length > 0) {
		container.append({ type: 'header', label: '自定义模板' });
		container.append({
			type: 'checkbox',
			name: 'tags',
			list: Twinkle.getPref('customTagList').map((el) => {
				el.checked = Twinkle.tag.checkedTags.includes(el.value);
				return el;
			})
		});
	}

	const $workarea = $(form).find('#tagWorkArea');
	const rendered = container.render();
	$workarea.empty().append(rendered);

	// for quick filter:
	$allCheckboxDivs = $workarea.find('[name=tags], [name=existingTags]').parent();
	$allHeaders = $workarea.find('h5, .quickformDescription');
	form.quickfilter.value = ''; // clear search, because the search results are not preserved over mode change
	form.quickfilter.focus();

	// style adjustments
	$workarea.find('h5').css({ 'font-size': '110%' });
	$workarea.find('h5:not(:first-child)').css({ 'margin-top': '1em' });
	$workarea
		.find('div')
		.filter(':has(span.quickformDescription)')
		.css({ 'margin-top': '0.4em' });

	Morebits.quickForm.getElements(form, 'existingTags').forEach(generateLinks);
	Morebits.quickForm.getElements(form, 'tags').forEach(generateLinks);

	// tally tags added/removed, update statusNode text
	const statusNode = document.querySelector('#tw-tag-status');
	$('[name=tags], [name=existingTags]').on('click', function () {
		if (this.name === 'tags') {
			Twinkle.tag.status.numAdded += this.checked ? 1 : -1;
		} else if (this.name === 'existingTags') {
			Twinkle.tag.status.numRemoved += this.checked ? -1 : 1;
		}

		const firstPart = `加入${Twinkle.tag.status.numAdded}个标记`;
		const secondPart = `移除${Twinkle.tag.status.numRemoved}个标记`;
		statusNode.textContent =
				(Twinkle.tag.status.numAdded ? `  ${firstPart}` : '') +
				(Twinkle.tag.status.numRemoved
					? (Twinkle.tag.status.numAdded ? '；' : '  ') + secondPart
					: '');
	});
};

/**
 * Adds a link to each template's description page
 *
 * @param {Morebits.quickForm.element} checkbox  associated with the template
 */
const generateLinks = (checkbox) => {
	const link = Morebits.htmlNode('a', '>');
	link.setAttribute('class', 'tag-template-link');
	const tagname = checkbox.values;
	link.setAttribute(
		'href',
		mw.util.getUrl(
			(!tagname.includes(':') ? 'Template:' : '') +
					(!tagname.includes('|') ? tagname : tagname.slice(0, tagname.indexOf('|')))
		)
	);
	link.setAttribute('target', '_blank');
	$(checkbox).parent().append(['\u00A0', link]);
};

// Tags for ARTICLES start here
Twinkle.tag.article = {};

// Tags arranged by category; will be used to generate the alphabetical list,
// but tags should be in alphabetical order within the categories
// excludeMI: true indicate a tag that *does not* work inside {{multiple issues}}
// Add new categories with discretion - the list is long enough as is!
Twinkle.tag.article.tagList = [
	{
		key: '清理和维护模板',
		value: [
			{
				key: '常规清理',
				value: [
					{
						tag: 'Cleanup',
						description: '可能需要进行清理，以符合求闻百科的质量标准'
					},
					{
						tag: 'Cleanup rewrite',
						description: '不符合求闻百科的质量标准，需要完全重写'
					},
					{
						tag: 'Cleanup-jargon',
						description: '包含过多行话或专业术语，可能需要简化或提出进一步解释'
					},
					{
						tag: 'Copy edit',
						description: '需要编修，以确保文法、用词、语气、格式、标点等使用恰当'
					}
				]
			},
			{
				key: '可能多余的内容',
				value: [
					{ tag: 'Copypaste', description: '内容可能是从某个来源处拷贝后粘贴' },
					{
						tag: 'External links',
						description: '使用外部链接的方式可能不符合求闻百科的方针或指引'
					},
					{
						tag: 'Non-free',
						description:
								'可能过多或不当地使用了受著作权保护的文字、图像或多媒体文件'
					}
				]
			},
			{
				key: '结构和导言',
				value: [
					{ tag: 'Lead too long', description: '导言部分也许过于冗长' },
					{ tag: 'Lead too short', description: '导言部分也许不足以概括其内容' },
					{ tag: 'Very long', description: '可能过于冗长' }
				]
			},
			{
				key: '虚构作品相关清理',
				value: [
					{ tag: 'In-universe', description: '使用小说故事内的观点描述一个虚构事物' },
					{ tag: 'Long plot', description: '可能包含过于详细的剧情摘要' }
				]
			}
		]
	},
	{
		key: '常规条目问题',
		value: [
			{
				key: '重要性和知名度',
				value: [
					{
						tag: 'Notability',
						description: '可能不符合通用关注度指引',
						excludeMI: true
					}, // has a subgroup with subcategories
					{
						tag: 'Notability Unreferenced',
						description: '可能具备关注度，但需要来源加以彰显'
					}
				]
			},
			{
				key: '写作风格',
				value: [
					{ tag: 'Advert', description: '类似广告或宣传性内容' },
					{ tag: 'Fanpov', description: '类似爱好者网页' },
					{ tag: 'How-to', description: '包含指南或教学内容' },
					{
						tag: 'Inappropriate person',
						description: '使用不适当的第一人称和第二人称'
					},
					{
						tag: 'Newsrelease',
						description: '阅读起来像是新闻稿及包含过度的宣传性语调'
					},
					{
						tag: 'Prose',
						description: '使用了日期或时间列表式记述，需要改写为连贯的叙述性文字'
					},
					{ tag: 'Review', description: '阅读起来类似评论，需要清理' },
					{ tag: 'Tone', description: '语调或风格可能不适合百科全书的写作方式' }
				]
			},
			{
				key: '内容',
				value: [
					/* { tag: 'Expand language', description: '可以根据其他语言版本扩展' }, */ // these three have a subgroup with several options
					{ tag: 'Missing information', description: '缺少必要的信息' }, // these three have a subgroup with several options
					{ tag: 'Substub', description: '过于短小', excludeMI: true },
					{ tag: 'Unencyclopedic', description: '可能不适合写入百科全书' }
				]
			},
			{
				key: '信息和细节',
				value: [
					{
						tag: 'Expert needed',
						description: '需要精通或熟悉本主题的专业人士（专家）参与及协助编辑'
					},
					{ tag: 'Overly detailed', description: '包含太多过度细节内容' },
					{ tag: 'Trivia', description: '应避免有陈列杂项、琐碎资料的部分' }
				]
			},
			{
				key: '时间性',
				value: [
					{ tag: 'Current', description: '记述新闻动态', excludeMI: true }, // Works but not intended for use in MI
					{ tag: 'Update', description: '当前条目或章节需要更新' }
				]
			},
			{
				key: '中立、偏见和事实准确性',
				value: [
					{
						tag: 'Autobiography',
						description:
								'类似一篇自传，或内容主要由条目描述的当事人或组织撰写、编辑'
					},
					{
						tag: 'COI',
						description: '主要贡献者与本条目所宣扬的内容可能存在利益冲突'
					},
					{ tag: 'Disputed', description: '内容疑欠准确，有待查证' },
					{ tag: 'Globalize', description: '仅具有一部分地区的信息或观点' },
					{ tag: 'Hoax', description: '真实性被质疑' },
					{
						tag: 'POV',
						description: '中立性有争议。内容、语调可能带有明显的个人观点或地方色彩'
					},
					{ tag: 'Self-contradictory', description: '内容自相矛盾' },
					{ tag: 'Weasel', description: '语义模棱两可而损及其中立性或准确性' }
				]
			},
			{
				key: '可供查证和来源',
				value: [
					{ tag: 'BLPdispute', description: '可能违反了求闻百科关于生者传记的方针' },
					{ tag: 'BLPsources', description: '生者传记需要补充更多可供查证的来源' },
					{ tag: 'BLP unsourced', description: '生者传记没有列出任何参考或来源' },
					{
						tag: 'Citecheck',
						description:
								'可能包含不适用或被曲解的引用资料，部分内容的准确性无法被证实'
					},
					{
						tag: 'More footnotes needed',
						description: '因为文内引用不足，部分字句的来源仍然不明'
					},
					{ tag: 'No footnotes', description: '因为没有内文引用而来源仍然不明' },
					{ tag: 'Onesource', description: '极大或完全地依赖于某个单一的来源' },
					{ tag: 'Original research', description: '可能包含原创研究或未查证内容' },
					{ tag: 'Primarysources', description: '依赖第一手来源' },
					{ tag: 'Refimprove', description: '需要补充更多来源' },
					{ tag: 'Unreferenced', description: '没有列出任何参考或来源' }
				]
			}
		]
	},
	{
		key: '具体内容问题',
		value: [
			{
				key: '语言',
				value: [
					{
						tag: 'NotMandarin',
						description: '包含过多不是现代标准汉语的内容',
						excludeMI: true
					},
					{ tag: 'Rough translation', description: '翻译品质不佳' }
				]
			},
			{
				key: '链接',
				value: [
					{
						tag: 'Dead end',
						description: '需要加上内部链接以构筑百科全书的链接网络'
					},
					{ tag: 'Orphan', description: '没有或只有很少链入页面' },
					{ tag: 'Overlinked', description: '含有过多、重复、或不必要的内部链接' },
					{
						tag: 'Underlinked',
						description: '需要更多内部链接以构筑百科全书的链接网络'
					}
				]
			},
			{
				key: '参考技术',
				value: [{ tag: 'Citation style', description: '引用需要进行清理' }]
			},
			{
				key: '分类',
				value: [
					{
						tag: 'Improve categories',
						description: '需要更多页面分类',
						excludeMI: true
					},
					{ tag: 'Uncategorized', description: '缺少页面分类', excludeMI: true }
				]
			}
		]
	},
	{
		key: '合并、拆分、移动',
		value: [
			{ tag: 'Merge from', description: '建议将页面并入本页面', excludeMI: true },
			{ tag: 'Merge to', description: '建议将此页面并入页面', excludeMI: true },
			{ tag: 'Merge', description: '建议此页面与页面合并', excludeMI: true },
			{ tag: 'Requested move', description: '建议将此页面移动到新名称', excludeMI: true },
			{ tag: 'Split', description: '建议将此页面分割为多个页面', excludeMI: true }
		]
	}
];

// Tags for REDIRECTS start here
// Not by policy, but the list roughly approximates items with >500
// transclusions from Template:R template index
Twinkle.tag.redirectList = [
	{
		key: '常用模板',
		value: [
			{
				tag: '合并重定向',
				description: '保持页面题名至相应主条目，令页面内容在合并后仍能保存其编辑历史'
			},
			{ tag: '简繁重定向', description: '引导简体至繁体，或繁体至简体' },
			{
				tag: '关注度重定向',
				description: '缺乏关注度的子主题向有关注度的母主题的重定向'
			},
			{ tag: '模板重定向', description: '指向模板的重定向页面' },
			{ tag: '别名重定向', description: '标题的其他名称、笔名、绰号、同义字等' },
			{ tag: '译名重定向', description: '人物、作品等各项事物的其他翻译名称' },
			{ tag: '缩写重定向', description: '标题缩写' },
			{ tag: '拼写重定向', description: '标题的其他不同拼写' },
			{ tag: '错字重定向', description: '纠正标题的常见错误拼写或误植' },
			{ tag: '旧名重定向', description: '将事物早前的名称引导至更改后的主题' },
			{ tag: '全名重定向', description: '标题的完整或更完整名称' },
			{
				tag: '短名重定向',
				description: '完整标题名称或人物全名的部分、不完整的名称或简称'
			},
			{ tag: '姓氏重定向', description: '人物姓氏' },
			{ tag: '名字重定向', description: '人物人名' },
			{ tag: '本名重定向', description: '人物本名' },
			{
				tag: '非中文重定向',
				description: '非中文标题',
				subgroup: [
					{
						name: 'altLangFrom',
						type: 'input',
						label: '本重新導向的語言（可選）',
						tooltip:
								'輸入重新導向名稱所使用語言的ISO 639代碼，例如en代表英語，代碼可參見 Template:ISO_639_name'
					}
				]
			},
			{ tag: '日文重定向', description: '日语名称' }
		]
	},
	{
		key: '偶用模板',
		value: [
			{ tag: '角色重定向', description: '电视剧、电影、书籍等作品的角色' },
			{ tag: '章节重定向', description: '导向至较高密度组织的页面' },
			{ tag: '列表重定向', description: '导向至低密度的列表' },
			{ tag: '可能性重定向', description: '导向至当前提供内容更为详尽的目标页面' },
			{ tag: '关联字重定向', description: '标题名称关联字' },
			{
				tag: '条目请求重定向',
				description: '需要独立条目的页面',
				subgroup: [
					{
						name: 'reqArticleLang',
						type: 'input',
						label: '外语语言代码：',
						tooltip: '使用ISO 639代码，可参见 Template:ISO_639_name'
					},
					{
						name: 'reqArticleTitle',
						type: 'input',
						label: '外语页面名称：',
						size: 60
					}
				]
			},
			{ tag: '快捷方式重定向', description: '求闻百科快捷方式' }
		]
	},
	{
		key: '鲜用模板',
		value: [
			{ tag: '词组重定向', description: '将词组/词组/成语指向切题的条目及恰当章节' },
			{ tag: '消歧义页重定向', description: '指向消歧义页' },
			{ tag: '域名重定向', description: '域名' },
			{ tag: '年代重定向', description: '于年份条目导向至年代条目' },
			{ tag: '用户框模板重定向', description: '用户框模板' },
			{ tag: '重定向模板用重定向', description: '导向至重定向模板' },
			{ tag: 'EXIF重定向', description: 'JPEG图像文件包含EXIF信息' }
		]
	}
];

// maintenance tags for FILES start here

Twinkle.tag.fileList = [
	{
		key: '著作权和来源问题标签',
		value: [
			{
				label:
						'{{Non-free reduce}}：' + '非低分辨率的合理使用图像（或过长的音频剪辑等）',
				value: 'Non-free reduce'
			}
		]
	},
	/* {
			key: '求闻共享资源相关标签',
			value: [
				{
					label:
							'{{Copy to Qiuwen Share}}：' +
							'自由著作权文件应该被移动至求闻共享资源',
					value: 'Copy to Qiuwen Share'
				},
				{
					label: '{{Do not move to Share}}：' + '不要移动至求闻共享资源',
					value: 'Do not move to Share',
					subgroup: {
						type: 'input',
						name: 'DoNotMoveToShare_reason',
						label: '原因：',
						tooltip: '输入不应该将该图像移动到求闻共享资源的原因（必填）。'
					}
				},
				{
					label: '{{Keep local}}：' + '请求在本地保留求闻共享资源的文件副本',
					value: 'Keep local',
					subgroup: [
						{
							type: 'input',
							name: 'keeplocalName',
							label: '共享资源的不同图像名称：',
							tooltip:
									'输入在共享资源的图像名称（若不同于本地名称），不包括 File: 前缀'
						},
						{
							type: 'input',
							name: 'keeplocalReason',
							label: '原因：',
							tooltip: '输入请求在本地保留文件副本的原因（可选）：'
						}
					]
				},
				{
					label: '{{Now Share}}：' + '文件已被复制到求闻共享资源',
					value: 'Now Share',
					subgroup: {
						type: 'input',
						name: 'nowshareName',
						label: '共享资源的不同图像名称：',
						tooltip: '输入在共享资源的图像名称（若不同于本地名称），不包括 File: 前缀'
					}
				}
			]
		}, */
	{
		key: '清理标签',
		value: [
			{ label: '{{Watermark}}：' + '图像包含了水印', value: 'Watermark' },
			{
				label: '{{Rename media}}：' + '文件应该根据文件名称指引被重命名',
				value: 'Rename media',
				subgroup: [
					{
						type: 'input',
						name: 'renamemediaNewname',
						label: '新名称：',
						tooltip: '输入图像的新名称（可选）'
					},
					{
						type: 'input',
						name: 'renamemediaReason',
						label: '原因：',
						tooltip: '输入重命名的原因（可选）'
					}
				]
			},
			{
				label: '{{Should be SVG}}：' + 'PNG、GIF、JPEG文件应该重制成矢量图形',
				value: 'Should be SVG'
			}
		]
	},
	{
		key: '文件取代标签',
		value: [
			{ label: '{{Obsolete}}：' + '有新版本可用的过时文件', value: 'Obsolete' },
			{
				label: '{{Vector version available}}：' + '有矢量图形可用的非矢量图形文件',
				value: 'Vector version available'
			}
		],
		buildFilename: true
	}
];

Twinkle.tag.callbacks = {
	article: (pageobj) => {
		// Remove tags that become superfluous with this action
		let pageText = pageobj
			.getPageText()
			.replace(
				/{{\s*([Nn]ew unreviewed article|[Uu]nreviewed|[Uu]serspace draft)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/g,
				''
			);
		const params = pageobj.getCallbackParameters();

		/**
		 * Saves the page following the removal of tags if any. The last step.
		 * Called from removeTags()
		 */
		const postRemoval = () => {
			if (params.tagsToRemove.length > 0) {
				// Remove empty {{multiple issues}} if found
				pageText = pageText.replace(
					/{{(multiple ?issues|article ?issues|mi|ai|issues|多個問題|多个问题|問題條目|问题条目|數個問題|数个问题)\s*\|\s*}}\n?/im,
					''
				);
				// Remove single-element {{multiple issues}} if found
				pageText = pageText.replace(
					/{{(?:multiple ?issues|article ?issues|mi|ai|issues|多個問題|多个问题|問題條目|问题条目|數個問題|数个问题)\s*\|\s*({{(?:{{[^{}]*}}|[^{}])+}})\s*}}/im,
					'$1'
				);
			}

			// Build edit summary
			const makeSentence = (array) => {
				if (array.length < 3) {
					return array.join('和');
				}
				const last = array.pop();
				return `${array.join('、')}和${last}`;
			};
			const makeTemplateLink = (tag) => {
				let text = '{{[[';
				// if it is a custom tag with a parameter
				if (tag.includes('|')) {
					tag = tag.slice(0, tag.indexOf('|'));
				}
				text += tag.includes(':') ? tag : `Template:${tag}|${tag}`;
				return `${text}]]}}`;
			};

			let summaryText;
			const addedTags = params.tags.map(makeTemplateLink);
			const removedTags = params.tagsToRemove.map(makeTemplateLink);
			if (addedTags.length > 0) {
				summaryText = `加入${makeSentence(addedTags)}`;
				summaryText += removedTags.length > 0 ? `並移除${makeSentence(removedTags)}` : '';
			} else {
				summaryText = `移除${makeSentence(removedTags)}`;
			}
			summaryText += '标记';
			if (params.reason) {
				summaryText += `：${params.reason}`;
			}

			// avoid truncated summaries
			if (summaryText.length > 499) {
				summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)]]/g, '$1');
			}

			pageobj.setPageText(pageText);
			pageobj.setEditSummary(summaryText);
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
			pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
			pageobj.setCreateOption('nocreate');
			pageobj.save(() => {
				// special functions for merge tags
				if (params.mergeReason) {
					// post the rationale on the talk page (only operates in main namespace)
					const talkpage = new Morebits.wiki.page(
						`Talk:${params.discussArticle}`,
						'将理由贴进讨论页'
					);
					talkpage.setNewSectionText(`${params.mergeReason.trim()} ~~` + `~~`);
					talkpage.setNewSectionTitle(`请求与[[${params.nonDiscussArticle}]]合并`);
					talkpage.setChangeTags(Twinkle.changeTags);
					talkpage.setWatchlist(Twinkle.getPref('watchMergeDiscussions'));
					talkpage.setCreateOption('recreate');
					talkpage.newSection();
				}
				if (params.mergeTagOther) {
					// tag the target page if requested
					let otherTagName = 'Merge';
					if (params.mergeTag === 'Merge from') {
						otherTagName = 'Merge to';
					} else if (params.mergeTag === 'Merge to') {
						otherTagName = 'Merge from';
					}
					const newParams = {
						tags: [otherTagName],
						tagsToRemove: [],
						tagsToRemain: [],
						mergeTarget: Morebits.pageNameNorm,
						discussArticle: params.discussArticle,
						talkDiscussionTitle: params.talkDiscussionTitle,
						talkDiscussionTitleLinked: params.talkDiscussionTitleLinked
					};
					const otherpage = new Morebits.wiki.page(
						params.mergeTarget,
						`标记其他页面（${params.mergeTarget}）`
					);
					otherpage.setCallbackParameters(newParams);
					otherpage.load(Twinkle.tag.callbacks.article);
				}
				// special functions for requested move tags
				if (params.moveReason) {
					// post the rationale on the talk page (only operates in main namespace)
					let moveTalkpageText = `\n\n{{subst:RM|1=${params.moveReason.trim()}`;
					if (params.moveTarget) {
						moveTalkpageText += `|2=${params.moveTarget}`;
					}
					moveTalkpageText += '}}';

					const moveTalkpage = new Morebits.wiki.page(
						`Talk:${params.discussArticle}`,
						'将理由贴进讨论页'
					);
					moveTalkpage.setAppendText(moveTalkpageText);
					moveTalkpage.setEditSummary(
						`请求移动${params.moveTarget ? `至[[${params.moveTarget}]]` : ''}`
					);
					moveTalkpage.setChangeTags(Twinkle.changeTags);
					moveTalkpage.setCreateOption('recreate');
					moveTalkpage.append();
				}
			});

			if (params.patrol) {
				pageobj.patrol();
			}
		};

		/**
		 * Removes the existing tags that were deselected (if any)
		 * Calls postRemoval() when done
		 */
		const removeTags = () => {
			if (params.tagsToRemove.length === 0) {
				postRemoval();
				return;
			}

			Morebits.status.info('信息', '移除取消选择的已存在标记');

			const getRedirectsFor = [];

			// Remove the tags from the page text, if found in its proper name,
			// otherwise moves it to `getRedirectsFor` array earmarking it for
			// later removal
			params.tagsToRemove.forEach((tag) => {
				const tag_re = new RegExp(
					`\\{\\{${Morebits.pageNameRegex(tag)}\\s*(\\|[^}]+)?\\}\\}\\n?`
				);

				if (tag_re.test(pageText)) {
					pageText = pageText.replace(tag_re, '');
				} else {
					getRedirectsFor.push(`Template:${tag}`);
				}
			});

			if (getRedirectsFor.length === 0) {
				postRemoval();
				return;
			}

			// Remove tags which appear in page text as redirects
			const api = new Morebits.wiki.api(
				'获取模板重定向',
				{
					action: 'query',
					prop: 'linkshere',
					titles: getRedirectsFor.join('|'),
					redirects: 1,
					lhnamespace: '10',
					lhshow: 'redirect',
					lhlimit: 'max' // 500 is max for normal users, 5000 for bots and sysops
				},
				(apiobj) => {
					$(apiobj.responseXML)
						.find('page')
						.each((_idx, page) => {
							let removed = false;
							$(page)
								.find('lh')
								.each((_idx, el) => {
									const tag = $(el).attr('title').slice(9);
									const tag_re = new RegExp(
										`\\{\\{${Morebits.pageNameRegex(
											tag
										)}\\s*(\\|(?:\\{\\{[^{}]*\\}\\}|[^{}])*)?\\}\\}\\n?`
									);
									if (tag_re.test(pageText)) {
										pageText = pageText.replace(tag_re, '');
										removed = true;
										return false; // break out of $.each
									}
								});
							if (!removed) {
								Morebits.status.warn(
									'信息',
									`无法在页面上找到{{${$(page).attr('title').slice(9)}}}…跳过`
								);
							}
						});

					postRemoval();
				}
			);
			api.post();
		};

		if (params.tags.length === 0) {
			removeTags();
			return;
		}

		let tagRe;
		let tagText = '';
		let tags = [];

		const groupableTags = [];
		// Executes first: addition of selected tags

		const groupableExistingTags = [];
		/**
		 * Updates `tagText` with the syntax of `tagName` template with its parameters
		 *
		 * @param {number} _tagIndex
		 * @param {string} tagName
		 */
		const addTag = (_tagIndex, tagName) => {
			let currentTag = '';
			if (tagName === 'Uncategorized' || tagName === 'Improve categories') {
				pageText += `\n\n{{${tagName}|time={{subst:#time:c}}}}`;
			} else {
				currentTag += `{{${tagName}`;
				// fill in other parameters, based on the tag
				switch (tagName) {
					/* case 'Expand language': {
							currentTag += `|1=${params.expandLanguage}`;
							if (params.highQualityArticle) {
								currentTag += '|status=yes';
							}
							if (params.expandLanguage2) {
								currentTag += `|2=${params.expandLanguage2}`;
								if (params.highQualityArticle2) {
									currentTag += '|status2=yes';
								}
							}
							if (params.expandLanguage3) {
								currentTag += `|3=${params.expandLanguage3}`;
								if (params.highQualityArticle3) {
									currentTag += '|status3=yes';
								}
							}
							break;
						} */
					case 'Expert needed': {
						currentTag += `|subject=${params.expert}`;
						if (params.expert2) {
							currentTag += `|subject2=${params.expert2}`;
						}
						if (params.expert3) {
							currentTag += `|subject3=${params.expert3}`;
						}
						break;
					}
					case 'Merge':
					case 'Merge to':
					case 'Merge from': {
						if (params.mergeTarget) {
							// normalize the merge target for now and later
							params.mergeTarget = Morebits.string.toUpperCaseFirstChar(
								params.mergeTarget.replace(/_/g, ' ')
							);

							currentTag += `|${params.mergeTarget}`;

							// link to the correct section on the talk page, for article space only
							if (
								mw.config.get('wgNamespaceNumber') === 0 &&
									(params.mergeReason || params.discussArticle)
							) {
								if (!params.discussArticle) {
									// discussArticle is the article whose talk page will contain the discussion
									params.discussArticle =
											tagName === 'Merge to'
												? params.mergeTarget
												: mw.config.get('wgTitle');
									// nonDiscussArticle is the article which won't have the discussion
									params.nonDiscussArticle =
											tagName === 'Merge to'
												? mw.config.get('wgTitle')
												: params.mergeTarget;
									params.talkDiscussionTitle = `请求与${params.nonDiscussArticle}合并`;
								}
								currentTag += `|discuss=Talk:${params.discussArticle}#${params.talkDiscussionTitle}`;
							}
						}
						break;
					}
					case 'Missing information': {
						currentTag += `|1=${params.missingInformation}`;
						break;
					}
					case 'Notability': {
						if (params.notability !== 'none') {
							currentTag += `|3=${params.notability}`;
						}
						break;
					}
					case 'Requested move': {
						if (params.moveTarget) {
							// normalize the move target for now and later
							params.moveTarget = Morebits.string.toUpperCaseFirstChar(
								params.moveTarget.replace(/_/g, ' ')
							);
							params.discussArticle = mw.config.get('wgTitle');
							currentTag += `|${params.moveTarget}`;
						}
						break;
					}
					case 'Split': {
						if (params.target1) {
							currentTag += `|1=${params.target1}`;
						}
						if (params.target2) {
							currentTag += `|2=${params.target2}`;
						}
						if (params.target3) {
							currentTag += `|3=${params.target3}`;
						}
						break;
					}
					case 'Cleanup': {
						if (params.cleanupReason) {
							currentTag += `|reason=${params.cleanupReason}`;
						}
						break;
					}
					default: {
						break;
					}
				}

				currentTag += '|time={{subst:#time:c}}}}\n';
				tagText += currentTag;
			}
		};

		/**
		 * Adds the tags which go outside {{multiple issues}}, either because
		 * these tags aren't supported in {{multiple issues}} or because
		 * {{multiple issues}} is not being added to the page at all
		 */
		const addUngroupedTags = () => {
			$.each(tags, addTag);

			// Insert tag after short description or any hatnotes,
			// as well as deletion/protection-related templates
			const wikipage = new Morebits.wikitext.page(pageText);
			const templatesAfter =
					// CSD
					// AfD
					`${`${
						Twinkle.hatnoteRegex
						// Protection templates
					}pp|pp-.*?|`}(?:Delete|Db-reason|D|Deletebecause|Db|速删|速刪|Speedy|SD|快删|快刪|CSD)|[rsaiftcmv]fd`;
			pageText = wikipage.insertAfterTemplates(tagText, templatesAfter).getText();

			removeTags();
		};

		// Separate tags into groupable ones (`groupableTags`) and non-groupable ones (`tags`)
		params.tags.forEach((tag) => {
			tagRe = new RegExp(`\\{\\{${tag}(\\||\\}\\})`, 'im');
			// regex check for preexistence of tag can be skipped if in canRemove mode
			if (Twinkle.tag.canRemove || !tagRe.test(pageText)) {
				if (
					tag === 'Notability' &&
						(mw.config.get('wgNamespaceNumber') === 0 ||
							confirm('该页面不是条目，您仍要提报到关注度提报吗？'))
				) {
					const qiuwen_page = new Morebits.wiki.page(
						'qiuwen:关注度/提报',
						'加入关注度记录项'
					);
					qiuwen_page.setFollowRedirect(true);
					qiuwen_page.setCallbackParameters(params);
					qiuwen_page.load(Twinkle.tag.callbacks.notabilityList);
				}
				// condition Twinkle.tag.article.tags[tag] to ensure that its not a custom tag
				// Custom tags are assumed non-groupable, since we don't know whether MI template supports them
				if (
					Twinkle.tag.article.flatObject[tag] &&
						!Twinkle.tag.article.flatObject[tag].excludeMI
				) {
					groupableTags.push(tag);
				} else {
					tags.push(tag);
				}
			} else {
				if (tag === 'Merge from') {
					tags.push(tag);
				} else {
					Morebits.status.warn('信息', `在页面上找到{{${tag}}}…跳过`);
					// don't do anything else with merge tags
					if (['Merge', 'Merge to'].includes(tag)) {
						params.mergeTarget = params.mergeReason = params.mergeTagOther = null;
					}
				}
			}
		});

		// To-be-retained existing tags that are groupable
		params.tagsToRemain.forEach((tag) => {
			// If the tag is unknown to us, we consider it non-groupable
			if (
				Twinkle.tag.article.flatObject[tag] &&
					!Twinkle.tag.article.flatObject[tag].excludeMI
			) {
				groupableExistingTags.push(tag);
			}
		});

		const miTest =
				/{{(multiple ?issues|article ?issues|mi|ai|issues|多個問題|多个问题|問題條目|问题条目|數個問題|数个问题)\s*\|[^}]+{/im.exec(
					pageText
				);

		if (miTest && groupableTags.length > 0) {
			Morebits.status.info('信息', '加入支持的标记入已存在的{{multiple issues}}');

			tagText = '';
			$.each(groupableTags, addTag);

			const miRegex = new RegExp(
				`(\\{\\{\\s*${miTest[1]}\\s*(?:\\|(?:\\{\\{[^{}]*\\}\\}|[^{}])*)?)\\}\\}\\s*`,
				'im'
			);
			pageText = pageText.replace(miRegex, `$1${tagText}}}\n`);
			tagText = '';

			addUngroupedTags();
		} else if (
			params.group &&
				!miTest &&
				groupableExistingTags.length + groupableTags.length >= 2
		) {
			Morebits.status.info('信息', '加入支持的标记入{{multiple issues}}');

			tagText += '{{Multiple issues|\n';

			/**
			 * Adds newly added tags to MI
			 */
			const addNewTagsToMI = () => {
				$.each(groupableTags, addTag);
				tagText += '}}\n';

				addUngroupedTags();
			};

			const getRedirectsFor = [];

			// Reposition the tags on the page into {{multiple issues}}, if found with its
			// proper name, else moves it to `getRedirectsFor` array to be handled later
			groupableExistingTags.forEach((tag) => {
				const tag_re = new RegExp(
					`(\\{\\{${Morebits.pageNameRegex(tag)}\\s*(\\|[^}]+)?\\}\\}\\n?)`
				);
				if (tag_re.test(pageText)) {
					tagText += tag_re.exec(pageText)[1];
					pageText = pageText.replace(tag_re, '');
				} else {
					getRedirectsFor.push(`Template:${tag}`);
				}
			});

			if (getRedirectsFor.length === 0) {
				addNewTagsToMI();
				return;
			}

			const api = new Morebits.wiki.api(
				'获取模板重定向',
				{
					action: 'query',
					prop: 'linkshere',
					titles: getRedirectsFor.join('|'),
					redirects: 1,
					lhnamespace: '10',
					lhshow: 'redirect',
					lhlimit: 'max' // 500 is max for normal users, 5000 for bots and sysops
				},
				(apiobj) => {
					$(apiobj.responseXML)
						.find('page')
						.each((_idx, page) => {
							let found = false;
							$(page)
								.find('lh')
								.each((_idx, el) => {
									const tag = $(el).attr('title').slice(9);
									const tag_re = new RegExp(
										`(\\{\\{${Morebits.pageNameRegex(
											tag
										)}\\s*(\\|[^}]*)?\\}\\}\\n?)`
									);
									if (tag_re.test(pageText)) {
										tagText += tag_re.exec(pageText)[1];
										pageText = pageText.replace(tag_re, '');
										found = true;
										return false; // break out of $.each
									}
								});
							if (!found) {
								Morebits.status.warn(
									'信息',
									`无法在页面上找到{{${$(page).attr('title').slice(9)}}}…跳过`
								);
							}
						});
					addNewTagsToMI();
				}
			);
			api.post();
		} else {
			tags = tags.concat(groupableTags);
			addUngroupedTags();
		}
	},

	notabilityList: (pageobj) => {
		// var text = pageobj.getPageText();
		// var params = pageobj.getCallbackParameters();
		pageobj.setAppendText(`\n{{subst:Fameitem|title=${Morebits.pageNameNorm}}}`);
		pageobj.setEditSummary(`加入${`[[${Morebits.pageNameNorm}]]`}`);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setCreateOption('recreate');
		pageobj.append();
	},

	redirect: (pageobj) => {
		const params = pageobj.getCallbackParameters();
		let pageText = pageobj.getPageText();
		let tagRe;
		let tagText = '';
		let summaryText = '加入';
		const tags = [];
		let i;

		for (i = 0; i < params.tags.length; i++) {
			tagRe = new RegExp(`(\\{\\{${params.tags[i]}(\\||\\}\\}))`, 'im');
			if (!tagRe.test(pageText)) {
				tags.push(params.tags[i]);
			} else {
				Morebits.status.warn('信息', `在重定向上找到{{${params.tags[i]}}}…跳过`);
			}
		}

		const addTag = (tagIndex, tagName) => {
			tagText += `\n{{${tagName}`;
			if (tagName === '非中文重定向') {
				if (params.altLangFrom) {
					tagText += `|1=${params.altLangFrom}`;
				}
			} else if (
				(tagName === '条目请求重定向' || tagName === '條目請求重定向') &&
					params.reqArticleLang &&
					params.reqArticleTitle
			) {
				tagText += `|1=${params.reqArticleLang}`;
				tagText += `|2=${params.reqArticleTitle}`;
			}
			tagText += '}}';

			if (tagIndex > 0) {
				if (tagIndex === tags.length - 1) {
					summaryText += '和';
				} else if (tagIndex < tags.length - 1) {
					summaryText += '、';
				}
			}

			summaryText += `{{[[:${
				tagName.includes(':') ? tagName : `Template:${tagName}|${tagName}`
			}]]}}`;
		};

		if (tags.length === 0) {
			Morebits.status.warn('信息', '没有标签可供标记');
		}

		tags.sort();
		$.each(tags, addTag);

		// Check for all Rcat shell redirects (from #433)
		if (/{{(?:redr|this is a redirect|r(?:edirect)?(?:.?cat.*)?[ _]?sh)/i.test(pageText)) {
			// Regex inspired by [[User:Kephir/gadgets/sagittarius.js]] ([[Special:PermaLink/831402893]])
			const oldTags = pageText.match(
				/(\s*{{[\sa-z]+\|(?:\s*1=)?)((?:[^{|}]|{{[^}]+}})+)(}})\s*/i
			);
			pageText = pageText.replace(
				oldTags[0],
				oldTags[1] + tagText + oldTags[2] + oldTags[3]
			);
		} else {
			// Fold any pre-existing Rcats into taglist and under Rcatshell
			const pageTags = pageText.match(/\s*{{.+?重定向.*?}}/gim);
			let oldPageTags = '';
			if (pageTags) {
				pageTags.forEach((pageTag) => {
					const pageRe = new RegExp(Morebits.string.escapeRegExp(pageTag), 'img');
					pageText = pageText.replace(pageRe, '');
					pageTag = pageTag.trim();
					oldPageTags += `\n${pageTag}`;
				});
			}
			pageText += `\n{{Redirect category shell|${tagText}${oldPageTags}\n}}`;
		}

		summaryText += `${tags.length > 0 ? '标记' : '{{Redirect category shell}}'}到重定向`;

		// avoid truncated summaries
		if (summaryText.length > 499) {
			summaryText = summaryText.replace(/\[\[[^|]+\|([^\]]+)]]/g, '$1');
		}

		pageobj.setPageText(pageText);
		pageobj.setEditSummary(summaryText);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if (params.patrol) {
			pageobj.patrol();
		}
	},

	file: (pageobj) => {
		let text = pageobj.getPageText();
		const params = pageobj.getCallbackParameters();
		let summary = '加入';

		// Add maintenance tags
		if (params.tags.length > 0) {
			let tagtext = '';
			let currentTag;
			$.each(params.tags, (_k, tag) => {
				// when other Qiuwen Share-related tags are placed, remove "move to Share" tag
				if (['Keep local', 'Now Share', 'Do not move to Share'].includes(tag)) {
					text = text.replace(
						/{{(mtc|(copy |move )?to ?share|move to qiuwen share|copy to qiuwen share)[^}]*}}/gi,
						''
					);
				}
				if (tag === 'Vector version available') {
					text = text.replace(
						/{{((convert to |convertto|should be |shouldbe|to)?svg|badpng|vectorize)[^}]*}}/gi,
						''
					);
				}

				currentTag = tag;

				switch (tag) {
					case 'Now Share': {
						currentTag = `subst:${currentTag}`; // subst
						if (params.nowshareName !== '') {
							currentTag += `|1=${params.nowshareName}`;
						}
						break;
					}
					case 'Keep local': {
						if (params.keeplocalName !== '') {
							currentTag += `|1=${params.keeplocalName}`;
						}
						if (params.keeplocalReason !== '') {
							currentTag += `|reason=${params.keeplocalReason}`;
						}
						break;
					}
					case 'Rename media': {
						if (params.renamemediaNewname !== '') {
							currentTag += `|1=${params.renamemediaNewname}`;
						}
						if (params.renamemediaReason !== '') {
							currentTag += `|2=${params.renamemediaReason}`;
						}
						break;
					}
					case 'Vector version available':
						/* falls through */
					case 'Obsolete': {
						currentTag += `|1=${params[`${tag.replace(/ /g, '_')}File`]}`;
						break;
					}
					case 'Do not move to Share': {
						currentTag += `|reason=${params.DoNotMoveToShare_reason}`;
						break;
					}
					case 'Copy to Qiuwen Share': {
						currentTag += `|human=${mw.config.get('wgUserName')}`;
						break;
					}
					default: {
						break;
					} // don't care
				}

				currentTag = `{{${currentTag}}}\n`;

				tagtext += currentTag;
				summary += `{{${tag}}}、`;
			});

			if (!tagtext) {
				pageobj.getStatusElement().warn('用户取消操作，没什么要做的');
				return;
			}

			text = tagtext + text;
		}

		pageobj.setPageText(text);
		pageobj.setEditSummary(summary.substring(0, summary.length - 1));
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setWatchlist(Twinkle.getPref('watchTaggedPages'));
		pageobj.setMinorEdit(Twinkle.getPref('markTaggedPagesAsMinor'));
		pageobj.setCreateOption('nocreate');
		pageobj.save();

		if (params.patrol) {
			pageobj.patrol();
		}
	}
};

Twinkle.tag.callback.evaluate = (e) => {
	const form = e.target;
	const params = Morebits.quickForm.getInputData(form);

	// Validation
	// Given an array of incompatible tags, check if we have two or more selected
	const checkIncompatible = (conflicts, extra) => {
		const count = conflicts.reduce((sum, tag) => {
			sum += params.tags.includes(tag);
			return sum;
		}, 0);
		if (count > 1) {
			let message = `请在以下标签中择一使用${`：{{${conflicts.join('}}、{{')}}}。`}`;
			message += extra || '';
			alert(message);
			return true;
		}
	};
		// Given a tag, ensure an associate parameter is present
		// Maybe just sock this away in each function?
	const checkParameter = (tag, parameter, description) => {
		description ||= '理由';
		if (params.tags.includes(tag) && params[parameter].trim() === '') {
			alert(`您必须指定${`{{${tag}}}的${description}。`}`);
			return true;
		}
	};

	// We could theoretically put them all checkIncompatible calls in a
	// forEach loop, but it's probably clearer not to have [[array one],
	// [array two]] devoid of context. Likewise, all the checkParameter
	// calls could be in one if, but could be similarly confusing.
	switch (Twinkle.tag.mode) {
		case '条目': {
			params.tagsToRemove = form.getUnchecked('existingTags'); // not in `input`
			params.tagsToRemain = params.existingTags || []; // container not created if none present

			if (
				params.tags.includes('Merge') ||
					params.tags.includes('Merge from') ||
					params.tags.includes('Merge to')
			) {
				if (
					checkIncompatible(
						['Merge', 'Merge from', 'Merge to'],
						'若需要多次合并，请使用{{Merge}}并用管道符分隔条目名（但在这种情形中Twinkle不能自动标记其他条目）。'
					)
				) {
					return;
				}
				if (!params.mergeTarget) {
					alert('请指定使用于merge模板中的另一个页面标题。');
					return;
				}
				if (
					(params.mergeTagOther || params.mergeReason) &&
						params.mergeTarget.includes('|')
				) {
					alert(
						'当前还不支持在一次合并中标记多个条目，与开启关于多个条目的讨论。请不要勾选“标记其他条目”并清空“理由”框后再提交。'
					);
					return;
				}
			}

			/* if (checkParameter('Expand language', 'expandLanguage', '语言代码')) {
					return;
				} */
			if (checkParameter('Missing information', 'missingInformation', '缺少的内容')) {
				return;
			}
			if (checkParameter('Expert needed', 'expert', '专家领域')) {
				return;
			}
			break;
		}

		case '文件': {
			// Silly to provide the same string to each of these
			if (
				checkParameter('Obsolete', 'ObsoleteFile', '替换的文件名称') ||
					checkParameter(
						'Vector version available',
						'Vector_version_availableFile',
						'替换的文件名称'
					)
			) {
				return;
			}
			if (checkParameter('Do not move to Share', 'DoNotMoveToShare_reason')) {
				return;
			}
			break;
		}

		case '重定向': {
			break;
		}

		default: {
			alert(`Twinkle.tag：未知模式 ${Twinkle.tag.mode}`);
			break;
		}
	}

	// File/redirect: return if no tags selected
	// Article: return if no tag is selected and no already present tag is deselected
	if (
		params.tags.length === 0 &&
			(Twinkle.tag.mode !== '条目' || params.tagsToRemove.length === 0)
	) {
		alert('必须选择至少一个标记！');
		return;
	}

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Morebits.wiki.actionCompleted.redirect = Morebits.pageNameNorm;
	Morebits.wiki.actionCompleted.notice = '标记完成，将在几秒内刷新页面';
	if (Twinkle.tag.mode === '重定向') {
		Morebits.wiki.actionCompleted.followRedirect = false;
	}

	const qiuwen_page = new Morebits.wiki.page(
		Morebits.pageNameNorm,
		`正在标记${Twinkle.tag.mode}`
	);
	qiuwen_page.setCallbackParameters(params);
	qiuwen_page.load(Twinkle.tag.callbacks[Twinkle.tag.mode]);
};

Twinkle.addInitCallback(Twinkle.tag, 'tag');
})(jQuery);

/* </nowiki> */
