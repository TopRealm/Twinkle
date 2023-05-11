/* Twinkle.js - twinkleimage.js */
$(function TwinkleImage() {
	/**
	 * twinkleimage.js: Image CSD module
	 * Mode of invocation: Tab ("DI")
	 * Active on: Local nonredirect file pages (not on Commons)
	 */
	Twinkle.image = () => {
		if (
			mw.config.get('wgNamespaceNumber') === 6 &&
			!document.querySelector('#mw-sharedupload') &&
			document.querySelector('#mw-imagepage-section-filehistory')
		) {
			Twinkle.addPortletLink(Twinkle.image.callback, '图权', 'tw-di', '提交文件快速删除');
		}
	};
	Twinkle.image.callback = () => {
		const Window = new Morebits.simpleWindow(600, 330);
		Window.setTitle('文件快速删除');
		Window.setScriptName('Twinkle');
		Window.addFooterLink('快速删除方针', 'QW:CSD');
		Window.addFooterLink('参数设置', 'H:TW/PREF#图权');
		Window.addFooterLink('帮助文档', 'H:TW/DOC#图权');
		Window.addFooterLink('问题反馈', 'HT:TW');
		const form = new Morebits.quickForm(Twinkle.image.callback.evaluate);
		form.append({
			type: 'checkbox',
			list: [
				{
					label: '通知上传者',
					value: 'notify',
					name: 'notify',
					tooltip: '若您在标记同一用户的很多文件，请取消此复选框以避免发送过多消息。',
					checked: Twinkle.getPref('notifyUserOnDeli'),
				},
			],
		});
		const field = form.append({
			type: 'field',
			label: '理由',
		});
		field.append({
			type: 'radio',
			name: 'type',
			list: [
				{
					label: '来源不明（CSD F1）',
					value: 'no source',
					checked: true,
					tooltip: '上传后3天内仍然来源不明、著作权不明',
				},
				{
					label: '著作权不明（CSD F1）',
					value: 'no license',
					tooltip: '上传后3天内仍著作权情况不明',
				},
				{
					label: '来源、著作权均不明（CSD F1）',
					value: 'no source no license',
					tooltip: '上传后3天内仍然来源不明、著作权不明',
				},
				{
					label: '其他来源找到的文件（CSD F1）',
					value: 'no permission',
					tooltip: '上传者宣称拥有，而在其他来源找到的文件',
					subgroup: {
						name: 'f1_source',
						type: 'textarea',
						label: '侵权来源：',
					},
				},
				{
					label: '无法找到作者授权的文件（CSD F1）',
					value: 'no permission',
					tooltip: '文件宣称由某作者依据某自由著作权协议发布，但找不到该自由协议的声明',
				},
				{
					label: '其他明显侵权的文件（CSD F1）',
					value: 'no permission',
					tooltip: '其他明显侵权的文件',
					subgroup: {
						name: 'f1_source',
						type: 'textarea',
						label: '侵权来源：',
					},
				},
				{
					label: '没有填写任何合理使用依据的非自由著作权文件（CSD F1）',
					value: 'no fair use rationale',
					tooltip:
						'不适用于有争议但完整的合理使用依据。如果非自由著作权文件只有部分条目的使用依据，但同时被使用于未提供合理使用依据的条目，则本方针也不适用。',
				},
				{
					label: '重复且不再使用的文件（CSD F2）',
					value: 'duplicate',
					tooltip:
						'包括以下情况：与现有文件完全相同（或与现有文件内容一致但尺寸较小），且没有客观需要（如某些场合需使用小尺寸图片）的文件；被更加清晰的文件、SVG格式文件所取代的文件。',
				},
			],
		});
		form.append({
			type: 'submit',
		});
		const result = form.render();
		Window.setContent(result);
		Window.display();
		// We must init the parameters
		const event = document.createEvent('Event');
		event.initEvent('change', true, true);
		result.type[0].dispatchEvent(event);
	};
	Twinkle.image.callback.evaluate = ({target}) => {
		let type;
		const notify = target.notify.checked;
		const types = target.type;
		for (const type_ of types) {
			if (type_.checked) {
				type = type_.values;
				break;
			}
		}
		let csdcrit;
		switch (type) {
			case 'no source no license':
			case 'no source':
			case 'no license':
			case 'no fair use rationale':
				csdcrit = 'f1';
				break;
			case 'no permission':
				csdcrit = 'f2';
				break;
			default:
				throw new Error('Twinkle.image.callback.evaluate：未知条款');
		}
		const lognomination =
			Twinkle.getPref('logSpeedyNominations') &&
			!Twinkle.getPref('noLogOnSpeedyNomination').includes(csdcrit.toLowerCase());
		const templatename = type;
		const params = {
			type,
			templatename,
			normalized: csdcrit,
			lognomination,
		};
		if (csdcrit === 'f1') {
			params.f1_source = target['type.f1_source'].value;
		}
		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(target);
		Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
		Morebits.wiki.actionCompleted.notice = '标记完成';
		// Tagging image
		const qiuwen_page = new Morebits.wiki.page(mw.config.get('wgPageName'), '加入删除标记');
		qiuwen_page.setCallbackParameters(params);
		qiuwen_page.load(Twinkle.image.callbacks.taggingImage);
		// Notifying uploader
		if (notify) {
			qiuwen_page.lookupCreation(Twinkle.image.callbacks.userNotification);
		} else {
			// add to CSD log if desired
			if (lognomination) {
				params.fromDI = true;
				Twinkle.speedy.callbacks.user.addToLog(params, null);
			}
			// No auto-notification, display what was going to be added.
			if (type !== 'orphaned fair use') {
				const noteData = document.createElement('pre');
				noteData.appendChild(
					document.createTextNode(`{{subst:Uploadvionotice|${Morebits.pageNameNorm}}}--~~` + `~~`)
				);
				Morebits.status.info('提示', ['这些内容应贴进上传者对话页：', document.createElement('br'), noteData]);
			}
		}
	};
	Twinkle.image.callbacks = {
		taggingImage: (pageobj) => {
			let text = pageobj.getPageText();
			const params = pageobj.getCallbackParameters();
			// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
			text = text.replace(
				/{{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*}}/gi,
				''
			);
			// Adding discussion
			if (params.type !== 'orphaned fair use') {
				const qiuwen_page = new Morebits.wiki.page('Qiuwen:存废讨论/文件快速删除提报', '加入快速删除记录项');
				qiuwen_page.setFollowRedirect(true);
				qiuwen_page.setCallbackParameters(params);
				qiuwen_page.load(Twinkle.image.callbacks.imageList);
			}
			let tag = '';
			switch (params.type) {
				case 'orphaned fair use':
					tag = '{{subst:orphaned fair use}}\n';
					break;
				case 'no permission':
					tag = `{{subst:${params.templatename}/auto|1=${params.f1_source
						.replace(/http/g, '&#104;ttp')
						.replace(/\n+/g, '\n')
						.replace(/^\s*([^*])/gm, '* $1')
						.replace(/^\* $/m, '')}}}\n`;
					break;
				case 'replaceable fair use':
					tag = `{{subst:${params.templatename}/auto|1=${params.f10_type}}}\n`;
					break;
				default:
					tag = `{{subst:${params.templatename}/auto}}\n`;
					break;
			}
			const textNoSd = text.replace(
				/{{\s*(db(-\w*)?|d|delete|(?:hang|hold)[ -]?on)\s*(\|(?:{{[^{}]*}}|[^{}])*)?}}\s*/gi,
				''
			);
			if (text !== textNoSd && confirm('在页面上找到快速删除模板，要移除吗？')) {
				text = textNoSd;
			}
			pageobj.setPageText(tag + text);
			let editSummary = '请求快速删除（';
			editSummary +=
				params.normalized ===
				`[[QW:CSD#${params.normalized.toUpperCase()}|CSD ${params.normalized.toUpperCase()}]]`;
			editSummary += '）';
			pageobj.setEditSummary(editSummary);
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(Twinkle.getPref('deliWatchPage'));
			pageobj.setCreateOption('nocreate');
			pageobj.save();
		},
		userNotification: (pageobj) => {
			const params = pageobj.getCallbackParameters();
			const initialContrib = pageobj.getCreator();
			// disallow warning yourself
			if (initialContrib === mw.config.get('wgUserName')) {
				pageobj.getStatusElement().warn(`您（${initialContrib}）创建了该页，跳过通知`);
			} else {
				const usertalkpage = new Morebits.wiki.page(
					`User talk:${initialContrib}`,
					`通知原始上传者 (${initialContrib})`
				);
				new Morebits.wiki.page(`User talk:${initialContrib}`, `通知原始上传者 (${initialContrib})`);
				const notifytext = `\n{{subst:Di-${params.templatename}-notice|1=${Morebits.pageNameNorm}}}--~~` + `~~`;
				usertalkpage.setAppendText(notifytext);
				usertalkpage.setEditSummary(`通知：文件[[${Morebits.pageNameNorm}]]快速删除提名`);
				usertalkpage.setChangeTags(Twinkle.changeTags);
				usertalkpage.setCreateOption('recreate');
				usertalkpage.setWatchlist(Twinkle.getPref('deliWatchUser'));
				usertalkpage.setFollowRedirect(true, false);
				usertalkpage.append();
			}
			// add this nomination to the user's userspace log, if the user has enabled it
			if (params.lognomination) {
				params.fromDI = true;
				Twinkle.speedy.callbacks.user.addToLog(params, initialContrib);
			}
		},
		imageList: (pageobj) => {
			const text = pageobj.getPageText();
			// const params = pageobj.getCallbackParameters();
			pageobj.setPageText(`${text}\n* [[:${Morebits.pageNameNorm}]]--~~` + `~~`);
			pageobj.setEditSummary(`加入[[${Morebits.pageNameNorm}]]`);
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setCreateOption('recreate');
			pageobj.save();
		},
	};
	Twinkle.addInitCallback(Twinkle.image, 'image');
});
