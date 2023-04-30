/* Twinkle.js - friendlytalkback.js */
(($) => {
	/**
	 * friendlytalkback.js: Talkback module
	 * Mode of invocation: Tab ("TB")
	 * Active on: Any page with relevant user name (userspace, contribs, etc.) except IP ranges
	 * Config directives in: FriendlyConfig
	 */
	Twinkle.talkback = () => {
		if (!mw.config.exists('wgRelevantUserName')) {
			return;
		}
		Twinkle.addPortletLink(Twinkle.talkback.callback, '通知', 'friendly-talkback', '回复通知');
	};
	Twinkle.talkback.callback = () => {
		if (
			mw.config.get('wgRelevantUserName') === mw.config.get('wgUserName') &&
			!confirm('您寂寞到了要自己回复自己的程度么？')
		) {
			return;
		}
		const Window = new Morebits.simpleWindow(600, 350);
		Window.setTitle('通知');
		Window.setScriptName('Twinkle');
		Window.addFooterLink('参数设置', 'H:TW/PREF#talkback');
		Window.addFooterLink('帮助文档', 'H:TW/DOC#talkback');
		Window.addFooterLink('问题反馈', 'HT:TW');
		const form = new Morebits.quickForm(Twinkle.talkback.evaluate);
		form.append({
			type: 'radio',
			name: 'tbtarget',
			list: [
				{
					label: '回复：我的讨论页',
					value: 'mytalk',
					checked: 'true',
				},
				{
					label: '回复：其他用户的讨论页',
					value: 'usertalk',
				},
				{
					label: '回复：其它页面',
					value: 'other',
				},
				{
					label: '邀请讨论',
					value: 'see',
				},
				{
					label: '通告板通知',
					value: 'notice',
				},
				{
					label: '“有新邮件”',
					value: 'mail',
				},
			],
			event: Twinkle.talkback.changeTarget,
		});
		form.append({
			type: 'field',
			label: '工作区',
			name: 'work_area',
		});
		const previewlink = document.createElement('a');
		$(previewlink).on('click', () => {
			Twinkle.talkback.callbacks.preview(result); // |result| is defined below
		});
		previewlink.style.cursor = 'pointer';
		previewlink.textContent = '预览';
		form.append({
			type: 'div',
			id: 'talkbackpreview',
			label: [previewlink],
		});
		form.append({
			type: 'div',
			id: 'friendlytalkback-previewbox',
			style: 'display: none',
		});
		form.append({
			type: 'submit',
		});
		const result = form.render();
		Window.setContent(result);
		Window.display();
		result.previewer = new Morebits.wiki.preview($(result).find('div#friendlytalkback-previewbox').last()[0]);
		// We must init the
		const event = document.createEvent('Event');
		event.initEvent('change', true, true);
		result.tbtarget[0].dispatchEvent(event);
		// Check whether the user has opted out from talkback
		const query = {
			action: 'query',
			prop: 'extlinks',
			titles: `User talk:${mw.config.get('wgRelevantUserName')}`,
			elquery: 'userjs.invalid/noTalkback',
			ellimit: '1',
			format: 'json',
		};
		const qwapi = new Morebits.wiki.api('抓取退出通告信息', query, Twinkle.talkback.callback.optoutStatus);
		qwapi.post();
	};
	Twinkle.talkback.optout = '';
	Twinkle.talkback.callback.optoutStatus = (apiobj) => {
		const element = apiobj.getResponse().query.pages[0].extlinks;
		if (element && element.length > 0) {
			Twinkle.talkback.optout = `${mw.config.get('wgRelevantUserName')}不希望收到回复通告`;
			const url = element[0].url;
			const reason = mw.util.getParamValue('reason', url);
			Twinkle.talkback.optout += reason ? `: ${reason}` : '.';
		}
		$('#twinkle-talkback-optout-message').text(Twinkle.talkback.optout);
	};
	let prev_page = '';
	let prev_section = '';
	let prev_message = '';
	Twinkle.talkback.changeTarget = (event) => {
		const value = event.target.values;
		const root = event.target.form;
		const old_area = Morebits.quickForm.getElements(root, 'work_area')[0];
		if (root.section) {
			prev_section = root.section.value;
		}
		if (root.message) {
			prev_message = root.message.value;
		}
		if (root.page) {
			prev_page = root.page.value;
		}
		let work_area = new Morebits.quickForm.element({
			type: 'field',
			label: '回复通告信息',
			name: 'work_area',
		});
		root.previewer.closePreview();
		switch (value) {
			case 'talkback':
			/* falls through */
			default:
				work_area.append({
					type: 'div',
					label: '',
					style: 'color: red',
					id: 'twinkle-talkback-optout-message',
				});
				work_area.append({
					type: 'input',
					name: 'page',
					label: '讨论页面名称',
					tooltip:
						'正在进行讨论的页面名称。例如：“User talk:QiuWen”或“Qiuwen talk:首页”。仅限于所有讨论页面、项目和模板命名空间。',
					value: prev_page || `User talk:${mw.config.get('wgUserName')}`,
				});
				work_area.append({
					type: 'input',
					name: 'section',
					label: '章节（可选）',
					tooltip: '您留言的章节标题，留空则不会产生章节链接。',
					value: prev_section,
				});
				break;
			case 'notice': {
				const noticeboard = work_area.append({
					type: 'select',
					name: 'noticeboard',
					label: '通告板：',
					event: (event) => {
						if (event.target.value === 'afchd') {
							Morebits.quickForm.overrideElementLabel(root.section, '标题或草稿名称（去除Draft前缀）：');
							Morebits.quickForm.setElementTooltipVisibility(root.section, false);
						} else {
							Morebits.quickForm.resetElementLabel(root.section);
							Morebits.quickForm.setElementTooltipVisibility(root.section, true);
						}
					},
				});
				$.each(Twinkle.talkback.noticeboards, (value_, data) => {
					noticeboard.append({
						type: 'option',
						label: data.label,
						value: value_,
						selected: !!data.defaultSelected,
					});
				});
				work_area.append({
					type: 'input',
					name: 'section',
					label: '章节（可选）',
					tooltip: '章节标题，留空则不会产生章节链接。',
					value: prev_section,
				});
				break;
			}
			case 'other':
				work_area.append({
					type: 'div',
					label: '',
					style: 'color: red',
					id: 'twinkle-talkback-optout-message',
				});
				work_area.append({
					type: 'input',
					name: 'page',
					label: '完整页面名',
					tooltip: '您留下消息的完整页面名，例如“Qiuwen talk:首页”。',
					value: prev_page,
					required: true,
				});
				work_area.append({
					type: 'input',
					name: 'section',
					label: '章节（可选）',
					tooltip: '您留言的章节标题，留空则不会产生章节链接。',
					value: prev_section,
				});
				break;
			case 'mail':
				work_area.append({
					type: 'input',
					name: 'section',
					label: '电子邮件主题（可选）',
					tooltip: '您发出的电子邮件的主题。',
				});
				break;
			case 'see':
				work_area.append({
					type: 'input',
					name: 'page',
					label: '完整页面名',
					tooltip: '您留下消息的完整页面名，例如“Qiuwen talk:首页”。',
					value: prev_page,
					required: true,
				});
				work_area.append({
					type: 'input',
					name: 'section',
					label: '章节（可选）',
					tooltip: '您留言的章节标题，留空则不会产生章节链接。',
					value: prev_section,
				});
				break;
		}
		if (value !== 'notice') {
			work_area.append({
				type: 'textarea',
				label: '附加信息（可选）：',
				name: 'message',
				tooltip: '会在回复通告模板下出现的消息，您的签名会被加在最后。',
			});
		}
		work_area = work_area.render();
		old_area.replaceWith(work_area);
		if (root.message) {
			root.message.value = prev_message;
		}
		$('#twinkle-talkback-optout-message').text(Twinkle.talkback.optout);
	};
	Twinkle.talkback.noticeboards = {
		affp: {
			label: 'QW:AF/FP（防滥用过滤器/错误报告）',
			title: '防滥用过滤器错误报告通知',
			content: '您的[[Qiuwen:防滥用过滤器/错误报告|防滥用过滤器错误报告]]已有处理结果，请前往查看。--~~' + '~~',
			editSummary: '有关[[Qiuwen:防滥用过滤器/错误报告|防滥用过滤器错误报告]]的通知',
			defaultSelected: true,
		},
		// let's keep AN and its cousins at the top
		afchd: {
			label: 'QW:AFCHD（条目创建帮助）',
			text: '您在[[Qiuwen:AFCHD|条目创建帮助]]页面的提问已有回复，请前往查看。--~~' + '~~',
			editSummary: '您在[[Qiuwen:AFCHD|条目创建帮助]]页面的提问已有回复，请前往查看。',
		},
	};
	Twinkle.talkback.evaluate = (event) => {
		const input = Morebits.quickForm.getInputData(event.target);
		const fullUserTalkPageName = new mw.Title(mw.config.get('wgRelevantUserName'), 3).toText();
		const talkpage = new Morebits.wiki.page(fullUserTalkPageName, '加入回复通告');
		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(event.target);
		Morebits.wiki.actionCompleted.redirect = fullUserTalkPageName;
		Morebits.wiki.actionCompleted.notice = '回复通告完成，将在几秒内刷新页面';
		switch (input.tbtarget) {
			case 'notice':
				talkpage.setEditSummary(Twinkle.talkback.noticeboards[input.noticeboard].editSummary);
				break;
			case 'mail':
				talkpage.setEditSummary('通知：有新邮件');
				break;
			case 'see':
				input.page = Twinkle.talkback.callbacks.normalizeTalkbackPage(input.page);
				talkpage.setEditSummary(`请看看[[:${input.page}${input.section ? `#${input.section}` : ''}]]上的讨论`);
				break;
			default:
				// talkback
				input.page = Twinkle.talkback.callbacks.normalizeTalkbackPage(input.page);
				talkpage.setEditSummary(`回复通告：[[:${input.page}${input.section ? `#${input.section}` : ''}]])`);
				break;
		}
		talkpage.setAppendText(`\n\n${Twinkle.talkback.callbacks.getNoticeWikitext(input)}`);
		talkpage.setChangeTags(Twinkle.changeTags);
		talkpage.setCreateOption('recreate');
		talkpage.setMinorEdit(Twinkle.getPref('markTalkbackAsMinor'));
		talkpage.setFollowRedirect(true);
		talkpage.append();
	};
	Twinkle.talkback.callbacks = {
		// Not used for notice or mail, default to user page
		normalizeTalkbackPage: (page) => {
			page || (page = mw.config.get('wgUserName'));
			// Assume no prefix is a username, convert to user talk space
			let normal = mw.Title.newFromText(page, 3);
			// Normalize erroneous or likely mis-entered items
			if (normal) {
				// Only allow talks and WPspace, as well as Template-space for DYK
				if (normal.namespace !== 4 && normal.namespace !== 10) {
					normal = normal.getTalkPage();
				}
				page = normal.getPrefixedText();
			}
			return page;
		},
		preview: (form) => {
			const input = Morebits.quickForm.getInputData(form);
			if (input.tbtarget === 'talkback' || input.tbtarget === 'see') {
				input.page = Twinkle.talkback.callbacks.normalizeTalkbackPage(input.page);
			}
			const noticetext = Twinkle.talkback.callbacks.getNoticeWikitext(input);
			form.previewer.beginRender(noticetext, `User talk:${mw.config.get('wgRelevantUserName')}`); // Force wikitext/correct username
		},
		getNoticeWikitext: (input) => {
			let text;
			switch (input.tbtarget) {
				case 'notice':
					text = Morebits.string.safeReplace(
						Twinkle.talkback.noticeboards[input.noticeboard].text,
						'$SECTION',
						input.section
					);
					break;
				case 'mail':
					text = `${`==${Twinkle.getPref('mailHeading')}==\n{{YGM|subject=${input.section}|ts=~~`}~` + `~~}}`;
					if (input.message) {
						text += `${`\n${input.message}  ~~`}~~`;
					} else if (Twinkle.getPref('insertTalkbackSignature')) {
						text += '\n~~' + '~~';
					}
					break;
				case 'see': {
					const heading = Twinkle.getPref('talkbackHeading');
					text = `{{subst:Please see|location=${input.page}${input.section ? `#${input.section}` : ''}|more=${
						input.message
					}|heading=${heading}}}`;
					break;
				}
				default:
					// talkback
					text =
						`${`==${Twinkle.getPref('talkbackHeading')}==\n{{talkback|${input.page}${
							input.section ? `|${input.section}` : ''
						}|ts=~~`}~` + `~~}}`;
					if (input.message) {
						text += `${`\n${input.message} ~~`}~~`;
					} else if (Twinkle.getPref('insertTalkbackSignature')) {
						text += '\n~~' + '~~';
					}
			}
			return text;
		},
	};
	Twinkle.addInitCallback(Twinkle.talkback, 'talkback');
})($);
