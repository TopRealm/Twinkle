/* Twinkle.js - twinklestub.js */
$(function TwinkleStub() {
	/**
	 * twinklestub.js: Tag module
	 * Mode of invocation: Tab ("Stub")
	 * Active on: Existing articles
	 * Config directives in: FriendlyConfig
	 * Note: customised friendlytag module
	 */
	Twinkle.stub = () => {
		if (Morebits.isPageRedirect()) {
			// Skip
			// article/draft article tagging
		} else if (([0, 118].includes(mw.config.get('wgNamespaceNumber')) && mw.config.get('wgCurRevisionId')) ||
			Morebits.pageNameNorm === Twinkle.getPref('sandboxPage')) {
			Twinkle.stub.mode = '条目';
			Twinkle.addPortletLink(Twinkle.stub.callback, '小作品', 'friendly-tag', '标记小作品');
		}
	};
	Twinkle.stub.callback = () => {
		const Window = new Morebits.simpleWindow(630, Twinkle.stub.mode === 'article' ? 450 : 400);
		Window.setScriptName('Twinkle');
		Window.addFooterLink('小作品说明', 'Qiuwen:小作品');
		Window.addFooterLink('参数设置', 'H:TW/PREF#小作品');
		Window.addFooterLink('帮助文档', 'H:TW/DOC#小作品');
		Window.addFooterLink('问题反馈', 'HT:TW');
		const form = new Morebits.quickForm(Twinkle.stub.callback.evaluate);
		if (document.querySelectorAll('.patrollink').length > 0) {
			form.append({
				type: 'checkbox',
				list: [
					{
						label: '标记页面为已巡查',
						value: 'patrolPage',
						name: 'patrolPage',
						checked: Twinkle.getPref('markStubbedPagesAsPatrolled'),
					},
				],
			});
		}
		switch (Twinkle.stub.mode) {
			case '條目':
			case '条目':
				Window.setTitle('条目小作品标记');
				form.append({
					type: 'select',
					name: 'sortorder',
					label: '查看列表：',
					tooltip: '您可以在Twinkle参数设置（H:TW/PREF）中更改此项。',
					event: Twinkle.stub.updateSortOrder,
					list: [
						{
							type: 'option',
							value: 'cat',
							label: '按类型',
							selected: Twinkle.getPref('stubArticleSortOrder') === 'cat',
						},
						{
							type: 'option',
							value: 'alpha',
							label: '按字母',
							selected: Twinkle.getPref('stubArticleSortOrder') === 'alpha',
						},
					],
				});
				form.append({
					type: 'div',
					id: 'tagWorkArea',
				});
				break;
			default:
				mw.notify(`Twinkle.stub：未知模式 ${Twinkle.stub.mode}`, { type: 'warn' });
				break;
		}
		form.append({
			type: 'submit',
		});
		const result = form.render();
		Window.setContent(result);
		Window.display();
		if (['条目', '條目'].includes(Twinkle.stub.mode)) {
			// fake a change event on the sort dropdown, to initialize the tag list
			const event = document.createEvent('Event');
			event.initEvent('change', true, true);
			result.sortorder.dispatchEvent(event);
		}
	};
	Twinkle.stub.checkedTags = [];
	Twinkle.stub.updateSortOrder = ({ target }) => {
		const sortorder = target.value;
		Twinkle.stub.checkedTags = target.form.getChecked('articleTags');
		if (!Twinkle.stub.checkedTags) {
			Twinkle.stub.checkedTags = [];
		}
		const container = new Morebits.quickForm.element({
			type: 'fragment',
		});
		// function to generate a checkbox, with appropriate subgroup if needed
		const makeCheckbox = (tag, description) => {
			const checkbox = {
				value: tag,
				label: `{{${tag}}}: ${description}`,
			};
			if (Twinkle.stub.checkedTags.includes(tag)) {
				checkbox.checked = true;
			}
			return checkbox;
		};
		// append any custom tags
		if (Twinkle.getPref('customStubList').length > 0) {
			container.append({
				type: 'header',
				label: '自定义模板',
			});
			const customcheckboxes = [];
			$.each(Twinkle.getPref('customStubList'), (index, { value, label }) => {
				customcheckboxes.push(makeCheckbox(value, label));
			});
			container.append({
				type: 'checkbox',
				name: 'articleTags',
				list: customcheckboxes,
			});
		}
		// categorical sort order
		if (sortorder === 'cat') {
			// function to iterate through the tags and create a checkbox for each one
			const doCategoryCheckboxes = (subdiv, array) => {
				const checkboxes = [];
				$.each(array, (_k, tag) => {
					const description = Twinkle.stub.article.tags[tag];
					checkboxes.push(makeCheckbox(tag, description));
				});
				subdiv.append({
					type: 'checkbox',
					name: 'articleTags',
					list: checkboxes,
				});
			};
			let i = 0;
			// go through each category and sub-category and append lists of checkboxes
			$.each(Twinkle.stub.article.tagCategories, (title, content) => {
				const titleName = Twinkle.stub.article.tagCategoriesHeader[title];
				container.append({
					type: 'header',
					id: `tagHeader${i}`,
					label: titleName,
				});
				const subdiv = container.append({
					type: 'div',
					id: `tagSubdiv${i++}`,
				});
				if (Array.isArray(content)) {
					doCategoryCheckboxes(subdiv, content);
				} else {
					$.each(content, (subtitle, subcontent) => {
						subdiv.append({
							type: 'div',
							label: [Morebits.htmlNode('b', subtitle)],
						});
						doCategoryCheckboxes(subdiv, subcontent);
					});
				}
			});
			// alphabetical sort order
		} else {
			const checkboxes = [];
			$.each(Twinkle.stub.article.tags, (tag, description) => {
				checkboxes.push(makeCheckbox(tag, description));
			});
			container.append({
				type: 'checkbox',
				name: 'articleTags',
				list: checkboxes,
			});
		}
		const $workarea = $(target.form).find('div#tagWorkArea');
		const rendered = container.render();
		$workarea.empty().append(rendered);
		// style adjustments
		$workarea.find('h5').css({
			'font-size': '110%',
		});
		$workarea.find('h5:not(:first-child)').css({
			'margin-top': '1em',
		});
		$workarea.find('div').filter(':has(span.quickformDescription)').css({
			'margin-top': '0.4em',
		});
		// add a link to each template's description page
		$.each(Morebits.quickForm.getElements(target.form, 'articleTags'), (_index, checkbox) => {
			const $checkbox = $(checkbox);
			const link = Morebits.htmlNode('a', '>');
			link.setAttribute('class', 'tag-template-link');
			link.setAttribute('href', mw.util.getUrl(`Template:${Morebits.string.toUpperCaseFirstChar(checkbox.values)}`));
			link.setAttribute('target', '_blank');
			$checkbox.parent().append(['\u00A0', link]);
		});
	};
	// Tags for ARTICLES start here
	Twinkle.stub.article = {};
	// A list of all article tags, in alphabetical order
	// To ensure tags appear in the default "categorized" view, add them to the tagCategories hash below.
	Twinkle.stub.article.tags = {
		'actor-stub': '演员',
		'asia-stub': '亚洲',
		'bio-stub': '人物',
		'biology-stub': '生物学',
		'chem-stub': '化学',
		'europe-stub': '欧洲',
		'expand list': '未完成列表',
		'food-stub': '食物',
		'france-geo-stub': '法国地理',
		'geo-stub': '地理位置',
		'hist-stub': '历史或历史学',
		'JP-stub': '日本',
		'lit-stub': '文学',
		'math-stub': '数学',
		'med-stub': '医学',
		'mil-stub': '军事',
		'movie-stub': '电影',
		'music-stub': '音乐',
		'physics-stub': '物理学',
		'politic-stub': '政治',
		'religion-stub': '宗教',
		'science-stub': '科学',
		'sport-stub': '体育',
		stub: '通用小作品',
		'switzerland-stub': '瑞士',
		'tech-stub': '科技',
		'transp-stub': '交通',
		'TV-stub': '电视',
		'UK-stub': '英国',
		'US-bio-stub': '美国人物',
		'US-geo-stub': '美国地理',
		'US-stub': '美国',
		'weather-stub': '天气和特别的天气事件',
	};
	// A list of tags in order of category
	// Tags should be in alphabetical order within the categories
	// Add new categories with discretion - the list is long enough as is!
	Twinkle.stub.article.tagCategoriesHeader = {
		general: '通用模板',
		geo: '国家和地理',
		others: '杂项',
		bio: '人物',
		science: '科学',
		sport: '体育',
		tech: '技术',
		art: '艺术',
	};
	Twinkle.stub.article.tagCategories = {
		general: ['stub', 'expand list'],
		geo: [
			'asia-stub',
			'europe-stub',
			'france-geo-stub',
			'geo-stub',
			'JP-stub',
			'switzerland-stub',
			'UK-stub',
			'US-bio-stub',
			'US-geo-stub',
			'US-stub',
		],
		others: ['food-stub', 'hist-stub', 'mil-stub', 'politic-stub', 'religion-stub', 'transp-stub'],
		bio: ['actor-stub', 'bio-stub', 'US-bio-stub'],
		science: ['biology-stub', 'chem-stub', 'math-stub', 'med-stub', 'physics-stub', 'science-stub', 'weather-stub'],
		sport: ['sport-stub'],
		tech: ['tech-stub'],
		art: ['actor-stub', 'lit-stub', 'movie-stub', 'music-stub', 'TV-stub'],
	};
	// Tags for REDIRECTS start here
	Twinkle.stub.callbacks = {
		main: (pageobj) => {
			const params = pageobj.getCallbackParameters();
			let tagRe;
			let summaryText = '加入';
			let tags = [];
			const groupableTags = [];
			let i;
			// Remove tags that become superfluous with this action
			let pageText = pageobj.getPageText();
			// Check for preexisting tags and separate tags into groupable and non-groupable arrays
			for (i = 0; i < params.tags.length; i++) {
				tagRe = new RegExp(`(\\{\\{${params.tags[i]}(\\||\\}\\}))`, 'im');
				if (tagRe.test(pageText)) {
					Morebits.status.info('信息', `在页面上找到{{${params.tags[i]}}}……跳过`);
				} else {
					tags = [...tags, ...params.tags[i]];
				}
			}
			tags = [...tags, ...groupableTags];
			tags.sort();
			const totalTags = tags.length;
			const addTag = (tagIndex, tagName) => {
				pageText += `\n{{${tagName}}}`;
				if (tagIndex > 0) {
					if (tagIndex === totalTags - 1) {
						summaryText += '和';
					} else if (tagIndex < totalTags - 1) {
						summaryText += '、';
					}
				}
				summaryText += '{{[[';
				summaryText += tagName.includes(':') ? tagName : `Template:${tagName}|${tagName}`;
				summaryText += ']]}}';
			};
			$.each(tags, addTag);
			summaryText += `标记到${Twinkle.stub.mode}`;
			pageobj.setPageText(pageText);
			pageobj.setEditSummary(summaryText);
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('watchStubbedPages'));
			pageobj.setMinorEdit(Twinkle.getPref('markStubbedPagesAsMinor'));
			pageobj.setCreateOption('nocreate');
			pageobj.save();
			if (params.patrol) {
				pageobj.patrol();
			}
		},
	};
	Twinkle.stub.callback.evaluate = ({ target }) => {
		const form = target;
		const params = {};
		if (form.patrolPage) {
			params.patrol = form.patrolPage.checked;
		}
		switch (Twinkle.stub.mode) {
			case '條目':
			case '条目':
				params.tags = form.getChecked('articleTags');
				params.group = false;
				break;
			default:
				mw.notify(`Twinkle.stub：未知模式 ${Twinkle.stub.mode}`, { type: 'warn' });
				break;
		}
		if (params.tags.length === 0) {
			mw.notify('必须选择至少一个标记！', { type: 'warn' });
			return;
		}
		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(form);
		Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
		Morebits.wiki.actionCompleted.notice = '标记完成，将在几秒内刷新页面';
		if (Twinkle.stub.mode === '重定向') {
			Morebits.wiki.actionCompleted.followRedirect = false;
		}
		const qiuwen_page = new Morebits.wiki.page(mw.config.get('wgPageName'), `正在标记${Twinkle.stub.mode}`);
		qiuwen_page.setCallbackParameters(params);
		switch (Twinkle.stub.mode) {
			case '条目':
			case '條目':
			/* falls through */
			case '重定向':
				qiuwen_page.load(Twinkle.stub.callbacks.main);
				return;
			case '文件':
			case '檔案':
				qiuwen_page.load(Twinkle.stub.callbacks.file);
				break;
			default:
				mw.notify(`Twinkle.stub：未知模式 ${Twinkle.stub.mode}`, { type: 'warn' });
				break;
		}
	};
	Twinkle.addInitCallback(Twinkle.stub, 'stub');
});
