// <nowiki>
/**
 * Twinkle.js - twinklespeedy.js
 * © 2011-2022 English Wikipedia Contributors
 * © 2011-2021 Chinese Wikipedia Contributors
 * © 2021-     Qiuwen Baike Contributors
 * This work is licensed under a Creative Commons
 * Attribution-ShareAlike 4.0 International License.
 * https://creativecommons.org/licenses/by-sa/4.0/
 */

(function($) {


/*
 ****************************************
 *** twinklespeedy.js: CSD module
 ****************************************
 * Mode of invocation:     Tab ("CSD")
 * Active on:              Non-special, existing pages
 *
 * NOTE FOR DEVELOPERS:
 *   If adding a new criterion, add it to the appropriate places at the top of
 *   twinkleconfig.js.  Also check out the default values of the CSD preferences
 *   in twinkle.js, and add your new criterion to those if you think it would be
 *   good.
 */

Twinkle.speedy = function twinklespeedy() {
	// Disable on:
	// * special pages
	// * Flow pages
	// * non-existent pages
	if (mw.config.get('wgNamespaceNumber') < 0 || !mw.config.get('wgArticleId')) {
		return;
	}

	Twinkle.addPortletLink(Twinkle.speedy.callback, '速删', 'tw-csd', Morebits.userIsSysop ? '快速删除' : '请求快速删除');
};

// This function is run when the CSD tab/header link is clicked
Twinkle.speedy.callback = function twinklespeedyCallback() {
	Twinkle.speedy.initDialog(Morebits.userIsSysop ? Twinkle.speedy.callback.evaluateSysop : Twinkle.speedy.callback.evaluateUser, true);
};

// Used by unlink feature
Twinkle.speedy.dialog = null;
// Used throughout
Twinkle.speedy.hasCSD = !!$('#delete-reason').length;

// The speedy criteria list can be in one of several modes
Twinkle.speedy.mode = {
	sysopSingleSubmit: 1,  // radio buttons, no subgroups, submit when "Submit" button is clicked
	sysopRadioClick: 2,  // radio buttons, no subgroups, submit when a radio button is clicked
	sysopMultipleSubmit: 3, // check boxes, subgroups, "Submit" button already present
	sysopMultipleRadioClick: 4, // check boxes, subgroups, need to add a "Submit" button
	userMultipleSubmit: 5,  // check boxes, subgroups, "Submit" button already pressent
	userMultipleRadioClick: 6,  // check boxes, subgroups, need to add a "Submit" button
	userSingleSubmit: 7,  // radio buttons, subgroups, submit when "Submit" button is clicked
	userSingleRadioClick: 8,  // radio buttons, subgroups, submit when a radio button is clicked

	// are we in "delete page" mode?
	// (sysops can access both "delete page" [sysop] and "tag page only" [user] modes)
	isSysop: function twinklespeedyModeIsSysop(mode) {
		return mode === Twinkle.speedy.mode.sysopSingleSubmit ||
			mode === Twinkle.speedy.mode.sysopMultipleSubmit ||
			mode === Twinkle.speedy.mode.sysopRadioClick ||
			mode === Twinkle.speedy.mode.sysopMultipleRadioClick;
	},
	// do we have a "Submit" button once the form is created?
	hasSubmitButton: function twinklespeedyModeHasSubmitButton(mode) {
		return mode === Twinkle.speedy.mode.sysopSingleSubmit ||
			mode === Twinkle.speedy.mode.sysopMultipleSubmit ||
			mode === Twinkle.speedy.mode.sysopMultipleRadioClick ||
			mode === Twinkle.speedy.mode.userMultipleSubmit ||
			mode === Twinkle.speedy.mode.userMultipleRadioClick ||
			mode === Twinkle.speedy.mode.userSingleSubmit;
	},
	// is db-multiple the outcome here?
	isMultiple: function twinklespeedyModeIsMultiple(mode) {
		return mode === Twinkle.speedy.mode.userMultipleSubmit ||
			mode === Twinkle.speedy.mode.sysopMultipleSubmit ||
			mode === Twinkle.speedy.mode.userMultipleRadioClick ||
			mode === Twinkle.speedy.mode.sysopMultipleRadioClick;
	}
};

// Prepares the speedy deletion dialog and displays it
Twinkle.speedy.initDialog = function twinklespeedyInitDialog(callbackfunc) {
	var dialog;
	Twinkle.speedy.dialog = new Morebits.simpleWindow(Twinkle.getPref('speedyWindowWidth'), Twinkle.getPref('speedyWindowHeight'));
	dialog = Twinkle.speedy.dialog;
	dialog.setTitle('选择快速删除理由');
	dialog.setScriptName('Twinkle');
	dialog.addFooterLink('快速删除方针', 'QW:SD');
	dialog.addFooterLink('参数设置', 'H:TW/PREF#speedy');
	dialog.addFooterLink('帮助文档', 'H:TW/DOC#speedy');
	dialog.addFooterLink('问题反馈', 'HT:TW');

	var form = new Morebits.quickForm(callbackfunc, Twinkle.getPref('speedySelectionStyle') === 'radioClick' ? 'change' : null);
	if (Morebits.userIsSysop) {
		form.append({
			type: 'checkbox',
			list: [
				{
					label: '只标记，不删除',
					value: 'tag_only',
					name: 'tag_only',
					tooltip: '如果您只想标记此页面而不是将其删除',
					checked: !(Twinkle.speedy.hasCSD || Twinkle.getPref('deleteSysopDefaultToDelete')),
					event: function(event) {
						var cForm = event.target.form;
						var cChecked = event.target.checked;
						// enable/disable talk page checkbox
						if (cForm.talkpage) {
							cForm.talkpage.disabled = cChecked;
							cForm.talkpage.checked = !cChecked && Twinkle.getPref('deleteTalkPageOnDelete');
						}
						// enable/disable redirects checkbox
						cForm.redirects.disabled = cChecked;
						cForm.redirects.checked = !cChecked;
						// enable/disable delete multiple
						cForm.delmultiple.disabled = cChecked;
						cForm.delmultiple.checked = false;
						// enable/disable open talk page checkbox
						cForm.openusertalk.disabled = cChecked;
						cForm.openusertalk.checked = false;

						// enable/disable notify checkbox
						cForm.notify.disabled = !cChecked;
						cForm.notify.checked = cChecked;
						// enable/disable multiple
						cForm.multiple.disabled = !cChecked;
						cForm.multiple.checked = false;

						Twinkle.speedy.callback.modeChanged(cForm);

						event.stopPropagation();
					}
				}
			]
		});

		var deleteOptions = form.append({
			type: 'div',
			name: 'delete_options'
		});
		deleteOptions.append({
			type: 'header',
			label: '删除相关选项'
		});
		if (mw.config.get('wgNamespaceNumber') % 2 === 0 && (mw.config.get('wgNamespaceNumber') !== 2 || (/\//).test(mw.config.get('wgTitle')))) {  // hide option for user pages, to avoid accidentally deleting user talk page
			deleteOptions.append({
				type: 'checkbox',
				list: [
					{
						label: '删除讨论页',
						value: 'talkpage',
						name: 'talkpage',
						tooltip: '删除时附带删除此页面的讨论页。',
						checked: Twinkle.getPref('deleteTalkPageOnDelete'),
						event: function(event) {
							event.stopPropagation();
						}
					}
				]
			});
		}
		deleteOptions.append({
			type: 'checkbox',
			list: [
				{
					label: '删除重定向',
					value: 'redirects',
					name: 'redirects',
					tooltip: '删除到此页的重定向。',
					checked: Twinkle.getPref('deleteRedirectsOnDelete'),
					event: function(event) {
						event.stopPropagation();
					}
				}
			]
		});
		deleteOptions.append({
			type: 'checkbox',
			list: [
				{
					label: '应用多个理由删除',
					value: 'delmultiple',
					name: 'delmultiple',
					tooltip: '您可选择应用于该页的多个理由。',
					event: function(event) {
						Twinkle.speedy.callback.modeChanged(event.target.form);
						event.stopPropagation();
					}
				}
			]
		});
		deleteOptions.append({
			type: 'checkbox',
			list: [
				{
					label: '开启用户讨论页',
					value: 'openusertalk',
					name: 'openusertalk',
					tooltip: '此项的默认值为您的开启讨论页设置。在您选择应用多条理由删除时此项将保持不变。',
					checked: false
				}
			]
		});
	}

	var tagOptions = form.append({
		type: 'div',
		name: 'tag_options'
	});

	if (Morebits.userIsSysop) {
		tagOptions.append({
			type: 'header',
			label: '标记相关选项'
		});
	}

	tagOptions.append({
		type: 'checkbox',
		list: [
			{
				label: '如可能，通知创建者',
				value: 'notify',
				name: 'notify',
				tooltip: '一个通知模板将会被加入创建者的讨论页，如果您启用了该理据的通知。',
				checked: !Morebits.userIsSysop || !(Twinkle.speedy.hasCSD || Twinkle.getPref('deleteSysopDefaultToDelete')),
				event: function(event) {
					event.stopPropagation();
				}
			}
		]
	});
	tagOptions.append({
		type: 'checkbox',
		list: [
			{
				label: '应用多个理由',
				value: 'multiple',
				name: 'multiple',
				tooltip: '您可选择应用于该页的多个理由。',
				event: function(event) {
					Twinkle.speedy.callback.modeChanged(event.target.form);
					event.stopPropagation();
				}
			}
		]
	});
	tagOptions.append({
		type: 'checkbox',
		list: [
			{
				label: '清空页面',
				value: 'blank',
				name: 'blank',
				tooltip: '在标记模板前，先清空页面，适用于严重破坏或负面生者传记等。'
			}
		]
	});

	form.append({
		type: 'div',
		id: 'prior-deletion-count'
	});

	form.append({
		type: 'div',
		name: 'work_area',
		label: '初始化CSD模块失败，请重试，或将这报告给Twinkle开发者。'
	});

	if (Twinkle.getPref('speedySelectionStyle') !== 'radioClick') {
		form.append({ type: 'submit', className: 'tw-speedy-submit' }); // Renamed in modeChanged
	}

	var result = form.render();
	dialog.setContent(result);
	dialog.display();

	Twinkle.speedy.callback.modeChanged(result);

	// Check for prior deletions.  Just once, upon init
	Twinkle.speedy.callback.priorDeletionCount();
};

Twinkle.speedy.callback.modeChanged = function twinklespeedyCallbackModeChanged(form) {
	var namespace = mw.config.get('wgNamespaceNumber');

	// first figure out what mode we're in
	var mode = {
		isSysop: !!form.tag_only && !form.tag_only.checked,
		isMultiple: form.tag_only && !form.tag_only.checked ? form.delmultiple.checked : form.multiple.checked,
		isRadioClick: Twinkle.getPref('speedySelectionStyle') === 'radioClick'
	};

	if (mode.isSysop) {
		$('[name=delete_options]').show();
		$('[name=tag_options]').hide();
		$('button.tw-speedy-submit').text('删除页面');
	} else {
		$('[name=delete_options]').hide();
		$('[name=tag_options]').show();
		$('button.tw-speedy-submit').text('标记页面');
	}

	var work_area = new Morebits.quickForm.element({
		type: 'div',
		name: 'work_area'
	});

	if (mode.isMultiple && mode.isRadioClick) {
		var evaluateType = mode.isSysop ? 'evaluateSysop' : 'evaluateUser';

		work_area.append({
			type: 'div',
			label: '当选择完成后，单击：'
		});
		work_area.append({
			type: 'button',
			name: 'submit-multiple',
			label: mode.isSysop ? '删除页面' : '标记页面',
			event: function(event) {
				Twinkle.speedy.callback[evaluateType](event);
				event.stopPropagation();
			}
		});
	}

	var appendList = function(headerLabel, csdList) {
		work_area.append({ type: 'header', label: headerLabel });
		work_area.append({ type: mode.isMultiple ? 'checkbox' : 'radio', name: 'csd', list: Twinkle.speedy.generateCsdList(csdList, mode) });
	};

	if (mode.isSysop && !mode.isMultiple) {
		appendList('自定义理由', Twinkle.speedy.customRationale);
	}

	if (namespace % 2 === 1 && namespace !== 3) {
		// show db-talk on talk pages, but not user talk pages
		appendList('讨论页', Twinkle.speedy.talkList);
	}

	if (!Morebits.isPageRedirect()) {
		switch (namespace) {
			case 0:  // article
				appendList('条目', Twinkle.speedy.articleList);
				break;

			case 2:  // user
				appendList('用户页', Twinkle.speedy.userList);
				break;

			case 6:  // file
				appendList('文件', Twinkle.speedy.fileList);
				if (!mode.isSysop) {
					work_area.append({ type: 'div', label: '标记快速删除F1（明显不符合本站著作权方针的文件）、F2（重复且不再被使用的文件），请使用Twinkle的“图权”功能。' });
				}
				break;

			case 14:  // category
				appendList('分类', Twinkle.speedy.categoryList);
				break;

			case 118:  // draft
				appendList('草稿', Twinkle.speedy.draftList);
				break;

			default:
				break;
		}
	} else {
		appendList('重定向', Twinkle.speedy.redirectList);
	}

	var generalCriteria = Twinkle.speedy.generalList;

	// custom rationale lives under general criteria when tagging
	if (!mode.isSysop) {
		generalCriteria = Twinkle.speedy.customRationale.concat(generalCriteria);
	}
	appendList('常规', generalCriteria);

	var old_area = Morebits.quickForm.getElements(form, 'work_area')[0];
	form.replaceChild(work_area.render(), old_area);

	// if sysop, check if CSD is already on the page and fill in custom rationale
	if (mode.isSysop && Twinkle.speedy.hasCSD) {
		var customOption = $('input[name=csd][value=reason]')[0];
		if (customOption) {
			if (Twinkle.getPref('speedySelectionStyle') !== 'radioClick') {
				// force listeners to re-init
				customOption.click();
				customOption.parentNode.appendChild(customOption.subgroup);
			}
			customOption.subgroup.querySelector('input').value = decodeURIComponent($('#delete-reason').text()).replace(/\+/g, ' ');
		}
	}

	// enlarge G1 radio/checkbox and its label
	if (document.querySelector('input[value="g1"]') && Twinkle.getPref('enlargeG1Input')) {
		document.querySelector('input[value="g1"]').style = 'height: 2em; width: 2em; height: -moz-initial; width: -moz-initial; -moz-transform: scale(2); -o-transform: scale(2);';
		document.querySelector('input[value="g1"]').labels[0].style = 'font-size: 1.5em; line-height: 1.5em;';
	}
};

Twinkle.speedy.callback.priorDeletionCount = function () {
	var query = {
		action: 'query',
		format: 'json',
		list: 'logevents',
		letype: 'delete',
		leaction: 'delete/delete', // Just pure page deletion, no redirect overwrites or revdel
		letitle: mw.config.get('wgPageName'),
		leprop: '', // We're just counting we don't actually care about the entries
		lelimit: 5  // A little bit goes a long way
	};

	new Morebits.wiki.api('检查之前的删除', query, function(apiobj) {
		var response = apiobj.getResponse();
		var delCount = response.query.logevents.length;
		if (delCount) {
			var message = delCount + '次';
			if (delCount > 1) {
				if (response.continue) {
					message += '被删除超过';
				}

				// 3+ seems problematic
				if (delCount >= 3) {
					$('#prior-deletion-count').css('color', 'red');
				}
			}

			// Provide a link to page logs (CSD templates have one for sysops)
			var link = Morebits.htmlNode('a', '（日志）');
			link.setAttribute('href', mw.util.getUrl('Special:Log', {page: mw.config.get('wgPageName')}));
			link.setAttribute('target', '_blank');

			$('#prior-deletion-count').text(message + ' '); // Space before log link
			$('#prior-deletion-count').append(link);
		}
	}).post();
};


Twinkle.speedy.generateCsdList = function twinklespeedyGenerateCsdList(list, mode) {

	var pageNamespace = mw.config.get('wgNamespaceNumber');

	var openSubgroupHandler = function(e) {
		$(e.target.form).find('input').prop('disabled', true);
		$(e.target.form).children().css('color', 'gray');
		$(e.target).parent().css('color', 'black').find('input').prop('disabled', false);
		$(e.target).parent().find('input:text')[0].focus();
		e.stopPropagation();
	};
	var submitSubgroupHandler = function(e) {
		var evaluateType = mode.isSysop ? 'evaluateSysop' : 'evaluateUser';
		Twinkle.speedy.callback[evaluateType](e);
		e.stopPropagation();
	};

	return $.map(list, function(critElement) {
		var criterion = $.extend({}, critElement);

		if (mode.isMultiple) {
			if (criterion.hideWhenMultiple) {
				return null;
			}
			if (criterion.hideSubgroupWhenMultiple) {
				criterion.subgroup = null;
			}
		} else {
			if (criterion.hideWhenSingle) {
				return null;
			}
			if (criterion.hideSubgroupWhenSingle) {
				criterion.subgroup = null;
			}
		}

		if (mode.isSysop) {
			if (criterion.hideWhenSysop) {
				return null;
			}
			if (criterion.hideSubgroupWhenSysop) {
				criterion.subgroup = null;
			}
		} else {
			if (criterion.hideWhenUser) {
				return null;
			}
			if (criterion.hideSubgroupWhenUser) {
				criterion.subgroup = null;
			}
		}

		if (Morebits.isPageRedirect() && criterion.hideWhenRedirect) {
			return null;
		}

		if (criterion.showInNamespaces && criterion.showInNamespaces.indexOf(pageNamespace) < 0) {
			return null;
		}
		if (criterion.hideInNamespaces && criterion.hideInNamespaces.indexOf(pageNamespace) > -1) {
			return null;
		}

		if (criterion.subgroup && !mode.isMultiple && mode.isRadioClick) {
			if (Array.isArray(criterion.subgroup)) {
				criterion.subgroup = criterion.subgroup.concat({
					type: 'button',
					name: 'submit',
					label: mode.isSysop ? '删除页面' : '标记页面',
					event: submitSubgroupHandler
				});
			} else {
				criterion.subgroup = [
					criterion.subgroup,
					{
						type: 'button',
						name: 'submit',  // ends up being called "csd.submit" so this is OK
						label: mode.isSysop ? '删除页面' : '标记页面',
						event: submitSubgroupHandler
					}
				];
			}
			// FIXME: does this do anything?
			criterion.event = openSubgroupHandler;
		}

		return criterion;
	});
};

Twinkle.speedy.customRationale = [
	{
		label: '自定义理由' + (Morebits.userIsSysop ? '（自定义删除理由）' : ''),
		value: 'reason',
		tooltip: '该页至少应该符合一条快速删除的标准，并且您必须在理由中提到。',
		subgroup: {
			name: 'reason_1',
			type: 'input',
			label: '理由：',
			size: 60
		},
		hideWhenMultiple: false
	}
];

Twinkle.speedy.fileList = [
	{
		label: 'F1：明显不符合本站著作权方针的文件',
		value: 'f1',
		tooltip: '包括以下情况：1.上传后3天内仍然来源不明、著作权不明的文件。2.上传者宣称拥有，而在其他来源找到的文件。3.文件宣称由某作者依据某自由著作权协议发布，但找不到该自由协议的声明。4.其他明显侵权的文件，可附加侵权理由。'
	},
	{
		label: 'F2：重复且不再被使用的文件',
		value: 'f2',
		tooltip: '包括以下情况：与现有文件完全相同（或与现有文件内容一致但尺寸较小），且没有客观需要（如某些场合需使用小尺寸图片）的文件。或是被更加清晰的文件、SVG格式文件所取代的文件。请提报者确定文件没有任何页面使用后再提报删除，并附注对应质量更好的文件名。',
		subgroup: {
			name: 'f2_filename',
			type: 'input',
			label: '新文件名：',
			tooltip: '可不含“File:”前缀。'
		}
	}
];

Twinkle.speedy.articleList = [
	{
		label: 'A1：内容空泛或完全没有内容。',
		value: 'a1',
		tooltip: '条目的内容笼统，或甚至根本没有提及条目主体，使条目不能用以区分其他事物；或条目只包括外部链接、参见、参考来源、分类、模板，而没有文字描述。消歧义页、重定向页不适用此条。请注意有些用户可能会多次保存，若此类页面的最后一次编辑时间超过24小时，则可提请快速删除。'
	},
	{
		label: 'A2：与其他条目或其历史版本重复，且不适合作为其重定向。',
		value: 'a2',
		tooltip: '条目创建时的内容，与其他现有条目（或其历史版本）内容完全相同或非常相似，且名称不适合作为后者的重定向。不包括拆分、合并、重组后产生的条目。如有疑虑，可转交删除讨论。若后创建的条目名称可作为重定向，可直接改为重定向；若先创建的条目宜作为后创建条目的重定向，请提请移动请求。',
		subgroup: {
			name: 'a2_pagename',
			type: 'input',
			label: '现有条目名：',
			tooltip: '不自动加上链接，若需要请自行加上[[]]。',
			size: 60
		}
	},
	{
		label: 'A3：非现代汉语或翻译拙劣的条目',
		value: 'a3',
		tooltip: '条目内容绝大部分非现代汉语，包括未翻译的外语、方言及文言文；或翻译质量低下，以至于难以理解或出现较多错误。'
	}
];

Twinkle.speedy.categoryList = [
	{
		label: 'O2：空分类。',
		value: 'o2',
		tooltip: '没有收录任何页面、文件、子分类的分类。Category:请勿删除的分类中的分类不适用。'
	}
];

Twinkle.speedy.draftList = [
	{
		label: 'O3：废弃草稿。',
		value: 'o3',
		tooltip: '草稿名字空间内六个月内无编辑的页面。'
	}
];

Twinkle.speedy.userList = [
	{
		label: 'O1：用户请求删除自己的用户页。',
		value: 'o1',
		tooltip: '管理员需查看编辑历史，确认该页面不是从其他名字空间移动而来。'
	}
];

Twinkle.speedy.generalList = [
	{
		label: 'G1：明显违反法律法规或违背公序良俗的页面',
		value: 'g1',
		tooltip: '明显违反服务器所在地（中华人民共和国天津市）的法律法规及有关规定，或突破社会公序良俗底线，按照中华人民共和国互联网管理规定应予删除的页面。'
	},
	{
		label: 'G2：没有实际内容的页面',
		value: 'g2',
		tooltip: '仅包括无意义字符串而没有实际内容的页面。由用户本人创建的用户页、用户讨论页，及专为测试提供的沙盒，不适用此准则。若遇此类用户讨论页，任何人可将其替换为{{subst:welcome}}。'
	},
	{
		label: 'G3：纯粹破坏',
		value: 'g3',
		tooltip: '包括但不限于明显的恶作剧、错误信息、人身攻击等，以及清理移动破坏时留下的重定向。若收到或发现严重的人身攻击与诋毁，管理员及其他用户应通知监督员进行监督隐藏。'
	},
	{
		label: 'G4：重新创建已被删除的页面',
		value: 'g4',
		tooltip: '若现有页面与曾在删除讨论（含页面存废讨论、文件存废讨论和侵权审核，不含快速删除）中被删除内容相同或非常相似，且现有内容仍然适用删除讨论中的结论，无论标题是否相同，都适用本标准。若现有页面标题与已删版本不一致，则提请速删者应一并注明已删版本的页面名；若该页面之前被快速删除，请以相同理由重新提请速删。若现有内容不适用删除讨论中的结论，应重新提出删除讨论。',
		subgroup: [
			{
				name: 'g4_pagename',
				type: 'input',
				label: '已删版本页面名：',
				size: 60
			}
		],
		hideSubgroupWhenMultiple: true
	},
	{
		label: 'G5：因技术原因删除页面',
		value: 'g5',
		tooltip: '包括以下情形：因移动请求而删除页面；以覆盖删除重定向；删除无用的MediaWiki页面，及其他技术团队或界面管理员认为有必要执行的快速删除情形。'
	},
	{
		label: 'G6：原作者提请删除或清空页面，且页面原作者仅有一人',
		value: 'g6',
		tooltip: '页面原作者持合理理由提出的快速删除；或页面原作者（实际贡献者）清空页面，其他用户提交的快速删除。页面原作者（实际贡献者）仅一人时满足本准则。若页面实际贡献者多于一人，请持合理理由提交删除讨论。后一情形不包括用户页、用户讨论页，且应在页面最后一次编辑6小时后提出。被导入的页面，导入者视为原作者。',
		subgroup: {
			name: 'g6_rationale',
			type: 'input',
			label: '删除原因：',
			size: 60
		},
		hideSubgroupWhenSysop: true
	},
	{
		label: 'G7：明显的广告宣传',
		value: 'g7',
		tooltip: '应用于明显的广告宣传，或只有相关人物、组织等事物联系方法（包括但不限于电话、地址、电子邮箱、即时通讯软件联系方式（如QQ号、微信号）、社交媒体链接）。若宣传语气不明显，建议转交删除讨论。'
	},
	{
		label: 'G8：未列明可靠来源且语调负面的生者传记',
		value: 'g8',
		tooltip: '本情况下有的页面严重侵犯他人名誉权，有时可能侵犯隐私权，可能需要提请监督。'
	},
	{
		label: 'G9：孤立页面',
		value: 'g9',
		tooltip: '包括以下几种类型：1.没有对应文件的文件页面；2.没有对应母页面的子页面（用户页子页面除外）；3.指向不存在页面的重定向；4.没有对应内容页面的讨论页（讨论页存档、用户讨论页，以及在主页面挂有{{CSD Placeholder}}模板的讨论页除外）；5.不存在注册用户的用户页及用户页子页面（随用户更名产生的用户页重定向除外）。请在删除时注意有无将内容移至他处的必要。'
	}
];

Twinkle.speedy.redirectList = [
	{
		label: 'R1：不能发挥实际作用的重定向。',
		value: 'r1',
		tooltip: '包括以下情况：1.指向本身或循环的重定向，如A→B→C→……→A或A→A（繁简重定向不适用此项）；2.格式错误的重定向，包括标题仅为繁体、繁简混用、消歧义使用的括弧或空格错误、间隔号使用错误（因类推简化字未收录至《通用规范汉字表》导致的繁简混杂情形，或系统无法自动进行繁简处理的情形，则不适用）。如果重定向页面标题，与合乎命名常规的目标页面标题之间，仅存在繁简字体的区别，而不存在词语用法区别，则不保留该重定向。因系统无法自动繁简转换而必须保留的重定向页面除外。对于其他未列出的情况，若用户认为该重定向无法发挥实际作用，且依据常识没有任何争议，可凭合理理由提请速删，由管理员判断。指向不存在页面的重定向，适用G5准则。',
		subgroup: {
			name: 'r1_type',
			type: 'select',
			label: '适用类型：',
			list: [
				{ label: '请选择', value: '' },
				{ label: '指向本身或循环的重定向', value: '指向本身或循环的重定向。' },
				{ label: '标题繁简混用', value: '标题繁简混用。' },
				{ label: '消歧义使用的括号或空格错误', value: '消歧义使用的括号或空格错误。' },
				{ label: '间隔号使用错误', value: '间隔号使用错误。' },
				{ label: '其他理由（请勾选上方“应用多个理由”，并填写自定义理由）', value: '' }
			]
		}
	},
	{
		label: 'R2：名称与导向目标代表事物不一致或不完全一致的重定向。',
		value: 'r2',
		tooltip: '包括但不限于以下情况：1.由任何非条目页面（除用户页）导向条目页的重定向，以及由条目页导向任何非条目页面的重定向。2.明显笔误的重定向，如出现不常见的错别字等。（别称重定向不适用此项。若含错别字或有笔误的重定向使用频率高，此类重定向有助于帮助用户寻找到正确的页面，不适用此标准。有争议的此类重定向宜提交删除讨论。）3.明显与导向目标所涵盖的主题无关，或比导向目标所涵盖的主题更广泛的重定向。（若不明显，可改为提交删除讨论。）',
		subgroup: {
			name: 'r2_type',
			type: 'select',
			label: '适用类型：',
			list: [
				{ label: '请选择', value: '' },
				{ label: '由非条目页面（除用户页）导向条目页的重定向', value: '由非条目页面（除用户页）导向条目页的重定向。' },
				{ label: '由条目页导向非条目页面的重定向', value: '由条目页导向任何非条目页面的重定向。' },
				{ label: '明显笔误的重定向', value: '明显笔误的重定向。' },
				{ label: '与导向目标无关或比其范围更广泛的重定向', value: '与导向目标无关或比其范围更广泛的重定向。' },
				{ label: '其他理由（请勾选上方“应用多个理由”，并填写自定义理由）', value: '' }
			]
		}
	}
];

Twinkle.speedy.normalizeHash = {
	'reason': 'db',
	'multiple': 'multiple',
	'multiple-finish': 'multiple-finish',
	'g1': 'g1',
	'g2': 'g2',
	'g3': 'g3',
	'g4': 'g4',
	'g5': 'g5',
	'g6': 'g6',
	'g7': 'g7',
	'g8': 'g8',
	'g9': 'g9',
	'a1': 'a1',
	'a2': 'a2',
	'a3': 'a3',
	'r1': 'r1',
	'r2': 'r2',
	'f1': 'f1',
	'f2': 'f2',
	'o1': 'o1',
	'o2': 'o2',
	'o3': 'o3'
};

Twinkle.speedy.callbacks = {
	getTemplateCodeAndParams: function(params) {
		var code, parameters, i;
		if (params.normalizeds.length > 1) {
			code = '{{delete';
			params.utparams = {};
			$.each(params.normalizeds, function(index, norm) {
				if (norm !== 'db') {
					code += '|' + norm.toUpperCase();
				}
				parameters = params.templateParams[index] || [];
				for (var i in parameters) {
					if (typeof parameters[i] === 'string') {
						code += '|' + parameters[i];
					}
				}
				$.extend(params.utparams, Twinkle.speedy.getUserTalkParameters(norm, parameters));
			});
			code += '}}';
		} else {
			parameters = params.templateParams[0] || [];
			code = '{{delete';
			if (params.values[0] !== 'reason') {
				code += '|' + params.values[0];
			}
			for (i in parameters) {
				if (typeof parameters[i] === 'string') {
					code += '|' + parameters[i];
				}
			}
			code += '}}';
			params.utparams = Twinkle.speedy.getUserTalkParameters(params.normalizeds[0], parameters);
		}

		return [code, params.utparams];
	},

	parseWikitext: function(wikitext, callback) {
		var query = {
			action: 'parse',
			prop: 'text',
			pst: 'true',
			text: wikitext,
			contentmodel: 'wikitext',
			title: mw.config.get('wgPageName'),
			disablelimitreport: true,
			format: 'json'
		};

		var statusIndicator = new Morebits.status('构造删除理由');
		var api = new Morebits.wiki.api('解析删除模板', query, function(apiObj) {
			var reason = decodeURIComponent($(apiObj.getXML().querySelector('text').childNodes[0].nodeValue).find('#delete-reason').text().replace(/\+/g, ' '));
			if (!reason) {
				statusIndicator.warn('未能从删除模板生成删除理由');
			} else {
				statusIndicator.info('完成');
			}
			callback(reason);
		}, statusIndicator);
		api.post();
	},

	sysop: {
		main: function(params) {
			var reason;

			if (!params.normalizeds.length && params.normalizeds[0] === 'db') {
				reason = prompt('输入删除理由：', '');
				Twinkle.speedy.callbacks.sysop.deletePage(reason, params);
			} else {
				var code = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params)[0];
				Twinkle.speedy.callbacks.parseWikitext(mw.config.get('wgPageName'), code, function(reason) {
					if (params.promptForSummary) {
						reason = prompt('输入删除理由，或单击“确定”以使用自动生成的理由：', reason);
					}
					Twinkle.speedy.callbacks.sysop.deletePage(reason, params);
				});
			}
		},
		deletePage: function(reason, params) {
			var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), '删除页面');

			if (reason === null) {
				return Morebits.status.error('询问理由', '用户取消操作。');
			} else if (!reason || !reason.replace(/^\s*/, '').replace(/\s*$/, '')) {
				return Morebits.status.error('询问理由', '用户未给出理由。');
			}

			var deleteMain = function() {
				thispage.setEditSummary(reason);
				thispage.setChangeTags(Twinkle.changeTags);
				thispage.setWatchlist(params.watch);
				thispage.deletePage(function() {
					thispage.getStatusElement().info('完成');
					Twinkle.speedy.callbacks.sysop.deleteTalk(params);
				});
			};

			// look up initial contributor. If prompting user for deletion reason, just display a link.
			// Otherwise open the talk page directly
			if (params.openUserTalk) {
				thispage.setCallbackParameters(params);
				thispage.lookupCreation(function() {
					Twinkle.speedy.callbacks.sysop.openUserTalkPage(thispage);
					deleteMain();
				});
			} else {
				deleteMain();
			}
		},
		deleteTalk: function(params) {
			// delete talk page
			if (params.deleteTalkPage &&
					params.normalized !== 'f7' &&
					params.normalized !== 'o1' &&
					!document.getElementById('ca-talk').classList.contains('new')) {
				var talkpage = new Morebits.wiki.page(mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceNumber') + 1] + ':' + mw.config.get('wgTitle'), '删除讨论页');
				talkpage.setEditSummary('[[QW:G9|G9]]：孤立页面（已删除页面“' + Morebits.pageNameNorm + '”的讨论页）');
				talkpage.setChangeTags(Twinkle.changeTags);
				talkpage.deletePage();
				// this is ugly, but because of the architecture of wiki.api, it is needed
				// (otherwise success/failure messages for the previous action would be suppressed)
				window.setTimeout(function() {
					Twinkle.speedy.callbacks.sysop.deleteRedirects(params);
				}, 1800);
			} else {
				Twinkle.speedy.callbacks.sysop.deleteRedirects(params);
			}
		},
		deleteRedirects: function(params) {
			// delete redirects
			if (params.deleteRedirects) {
				var query = {
					action: 'query',
					titles: mw.config.get('wgPageName'),
					prop: 'redirects',
					rdlimit: 5000  // 500 is max for normal users, 5000 for bots and sysops
				};
				var wikipedia_api = new Morebits.wiki.api('获取重定向列表…', query, Twinkle.speedy.callbacks.sysop.deleteRedirectsMain,
					new Morebits.status('删除重定向'));
				wikipedia_api.params = params;
				wikipedia_api.post();
			}

			// prompt for protect on G1
			var $link, $bigtext;
			if (params.normalized === 'g1') {
				$link = $('<a/>', {
					href: '#',
					text: '单击这里施行保护',
					css: { fontSize: '130%', fontWeight: 'bold' },
					click: function() {
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						mw.config.set('wgArticleId', 0);
						Twinkle.protect.callback();
					}
				});
				$bigtext = $('<span/>', {
					text: '白纸保护该页',
					css: { fontSize: '130%', fontWeight: 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			}

			// promote Unlink tool
			if (mw.config.get('wgNamespaceNumber') === 6 && params.normalized !== 'f1') {
				$link = $('<a/>', {
					href: '#',
					text: '单击这里前往取消链入工具',
					css: { fontWeight: 'bold' },
					click: function() {
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback('取消对已删除文件 ' + Morebits.pageNameNorm + ' 的使用');
					}
				});
				$bigtext = $('<span/>', {
					text: '取消对已删除文件的使用',
					css: { fontWeight: 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			} else if (params.normalized !== 'f1') {
				$link = $('<a/>', {
					href: '#',
					text: '单击这里前往取消链入工具',
					css: { fontWeight: 'bold' },
					click: function() {
						Morebits.wiki.actionCompleted.redirect = null;
						Twinkle.speedy.dialog.close();
						Twinkle.unlink.callback('取消对已删除页面 ' + Morebits.pageNameNorm + ' 的链接');
					}
				});
				$bigtext = $('<span/>', {
					text: '取消对已删除页面的链接',
					css: { fontWeight: 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			}

			$link = $('<a>', {
				href: mw.util.getUrl('Special:RandomInCategory/快速删除候选'),
				text: '单击前往下一个快速删除候选'
			});
			Morebits.status.info('工具', $link[0]);
		},
		openUserTalkPage: function(pageobj) {
			pageobj.getStatusElement().unlink();  // don't need it anymore
			var user = pageobj.getCreator();
			var params = pageobj.getCallbackParameters();

			var query = {
				title: 'User talk:' + user,
				action: 'edit',
				preview: 'yes',
				vanarticle: Morebits.pageNameNorm
			};

			if (params.normalized === 'db' || Twinkle.getPref('promptForSpeedyDeletionSummary').indexOf(params.normalized) !== -1) {
				// provide a link to the user talk page
				var $link, $bigtext;
				$link = $('<a/>', {
					href: mw.util.wikiScript('index') + '?' + $.param(query),
					text: '点此打开User talk:' + user,
					target: '_blank',
					css: { fontSize: '130%', fontWeight: 'bold' }
				});
				$bigtext = $('<span/>', {
					text: '通知页面创建者',
					css: { fontSize: '130%', fontWeight: 'bold' }
				});
				Morebits.status.info($bigtext[0], $link[0]);
			} else {
				// open the initial contributor's talk page
				var statusIndicator = new Morebits.status('打开用户', '打开中…');

				switch (Twinkle.getPref('userTalkPageMode')) {
					case 'tab':
						window.open(mw.util.wikiScript('index') + '?' + $.param(query), '_blank');
						break;
					case 'blank':
						window.open(mw.util.wikiScript('index') + '?' + $.param(query), '_blank', 'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800');
						break;
					case 'window':
					/* falls through */
					default:
						window.open(mw.util.wikiScript('index') + '?' + $.param(query),
							window.name === 'twinklewarnwindow' ? '_blank' : 'twinklewarnwindow',
							'location=no,toolbar=no,status=no,directories=no,scrollbars=yes,width=1200,height=800');
						break;
				}

				statusIndicator.info('完成');
			}
		},
		deleteRedirectsMain: function(apiobj) {
			var xmlDoc = apiobj.getXML();
			var $snapshot = $(xmlDoc).find('redirects rd');
			var total = $snapshot.length;
			var statusIndicator = apiobj.statelem;

			if (!total) {
				statusIndicator.status('未发现重定向');
				return;
			}

			statusIndicator.status('0%');

			var current = 0;
			var onsuccess = function(apiobjInner) {
				var now = parseInt(100 * ++current / total, 10) + '%';
				statusIndicator.update(now);
				apiobjInner.statelem.unlink();
				if (current >= total) {
					statusIndicator.info(now + '（完成）');
					Morebits.wiki.removeCheckpoint();
				}
			};

			Morebits.wiki.addCheckpoint();

			$snapshot.each(function(key, value) {
				var title = $(value).attr('title');
				var page = new Morebits.wiki.page(title, '删除重定向 "' + title + '"');
				page.setEditSummary('[[QW:G9|G9]]：孤立页面（重定向到已删除页面“' + Morebits.pageNameNorm + '”）');
				page.setChangeTags(Twinkle.changeTags);
				page.deletePage(onsuccess);
			});
		}
	},
	user: {
		main: function(pageobj) {
			var statelem = pageobj.getStatusElement();

			// defaults to /doc for lua modules, which may not exist
			if (!pageobj.exists() && mw.config.get('wgPageContentModel') !== 'Scribunto') {
				statelem.error('页面不存在，可能已被删除');
				return;
			}

			var text = pageobj.getPageText();
			var params = pageobj.getCallbackParameters();

			statelem.status('检查页面已有标记…');

			// check for existing deletion tags
			var textNoSd = text.replace(/\{\{\s*(db(-\w*)?|d|delete|deletebecause|speedy|csd|速刪|速删|快删|快刪)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/ig, '');
			if (text !== textNoSd && !confirm('在页面上找到快速删除模板，要移除并加入新的吗？')) {
				statelem.error('快速删除模板已被置于页面中。');
				return;
			}
			text = textNoSd;

			var xfd = /(?:\{\{([rsaiftcmv]fd|md1|proposed deletion)[^{}]*?\}\})/i.exec(text);
			if (xfd && !confirm('删除相关模板{{' + xfd[1] + '}}已被置于页面中，您是否仍想加入一个快速删除模板？')) {
				statelem.error('页面已被提交至存废讨论。');
				return;
			}

			// given the params, builds the template and also adds the user talk page parameters to the params that were passed in
			// returns => [<string> wikitext, <object> utparams]
			var buildData = Twinkle.speedy.callbacks.getTemplateCodeAndParams(params),
				code = buildData[0];
			params.utparams = buildData[1];

			var thispage = new Morebits.wiki.page(mw.config.get('wgPageName'));
			// patrol the page, if reached from Special:NewPages
			if (Twinkle.getPref('markSpeedyPagesAsPatrolled')) {
				thispage.patrol();
			}

			// Wrap SD template in noinclude tags if we are in template space.
			// Won't work with userboxes in userspace, or any other transcluded page outside template space
			if (mw.config.get('wgNamespaceNumber') === 10) {  // Template:
				code = '<noinclude>' + code + '</noinclude>';
			}

			// Remove tags that become superfluous with this action
			text = text.replace(/\{\{\s*([Nn]ew unreviewed article|[Uu]nreviewed|[Uu]serspace draft)\s*(\|(?:\{\{[^{}]*\}\}|[^{}])*)?\}\}\s*/g, '');
			if (mw.config.get('wgNamespaceNumber') === 6) {
				// remove "move to Commons" tag - deletion-tagged files cannot be moved to Commons
				text = text.replace(/\{\{(mtc|(copy |move )?to ?commons|move to wikimedia commons|copy to wikimedia commons)[^}]*\}\}/gi, '');
			}

			// Generate edit summary for edit
			var editsummary;
			if (params.normalizeds.length > 1) {
				editsummary = '请求快速删除（';
				$.each(params.normalizeds, function(index, norm) {
					if (norm !== 'db') {
						editsummary += '[[QW:CSD#' + norm.toUpperCase() + '|CSD ' + norm.toUpperCase() + ']]、';
					}
				});
				editsummary = editsummary.substr(0, editsummary.length - 1); // remove trailing comma
				editsummary += '）';
			} else if (params.normalizeds[0] === 'db') {
				editsummary = '请求[[QW:CSD|快速删除]]：' + params.templateParams[0]['1'];
			} else {
				editsummary = '请求快速删除' + '（[[QW:CSD#' + params.normalizeds[0].toUpperCase() + '|CSD ' + params.normalizeds[0].toUpperCase() + ']]）';
			}


			// Blank attack pages
			if (params.blank) {
				text = code;
			} else {
				// Insert tag after short description or any hatnotes
				var wikipage = new Morebits.wikitext.page(text);
				text = wikipage.insertAfterTemplates(code + '\n', Twinkle.hatnoteRegex).getText();
			}


			pageobj.setPageText(text);
			pageobj.setEditSummary(editsummary);
			pageobj.setChangeTags(Twinkle.changeTags);
			pageobj.setWatchlist(params.watch);
			if (params.scribunto) {
				pageobj.setCreateOption('recreate'); // Module /doc might not exist
				if (params.watch) {
					// Watch module in addition to /doc subpage
					var watch_query = {
						action: 'watch',
						titles: mw.config.get('wgPageName'),
						token: mw.user.tokens.get('watchToken')
					};
					new Morebits.wiki.api('将模块加入到监视列表', watch_query).post();
				}
			}
			pageobj.save(Twinkle.speedy.callbacks.user.tagComplete);
		},

		tagComplete: function(pageobj) {
			var params = pageobj.getCallbackParameters();

			// Notification to first contributor
			if (params.usertalk) {
				var callback = function(pageobj) {
					var initialContrib = pageobj.getCreator();

					// disallow warning yourself
					if (initialContrib === mw.config.get('wgUserName')) {
						Morebits.status.warn('您（' + initialContrib + '）创建了该页，跳过通知');
						initialContrib = null;

					// don't notify users when their user talk page is nominated
					} else if (initialContrib === mw.config.get('wgTitle') && mw.config.get('wgNamespaceNumber') === 3) {
						Morebits.status.warn('通知页面创建者：用户创建了自己的讨论页');
						initialContrib = null;

					} else {
						var talkPageName = 'User talk:' + initialContrib;
						Morebits.wiki.flow.check(talkPageName, function () {
							var flowpage = new Morebits.wiki.flow(talkPageName, '通知页面创建者（' + initialContrib + '）');
							flowpage.setTopic('[[:' + Morebits.pageNameNorm + ']]的快速删除通知');
							flowpage.setContent('{{subst:db-notice|target=' + Morebits.pageNameNorm + '|flow=yes}}');
							flowpage.newTopic();
						}, function() {
							var usertalkpage = new Morebits.wiki.page(talkPageName, '通知页面创建者（' + initialContrib + '）'),
								notifytext;

							notifytext = '\n{{subst:db-notice|target=' + Morebits.pageNameNorm;
							notifytext += '--~~~~';

							var editsummary = '通知：';
							if (params.normalizeds.indexOf('g12') === -1) {  // no article name in summary for G10 deletions
								editsummary += '页面[[' + Morebits.pageNameNorm + ']]';
							} else {
								editsummary += '一攻击性页面';
							}
							editsummary += '快速删除提名';

							usertalkpage.setAppendText(notifytext);
							usertalkpage.setEditSummary(editsummary);
							usertalkpage.setChangeTags(Twinkle.changeTags);
							usertalkpage.setCreateOption('recreate');
							usertalkpage.setFollowRedirect(true, false);
							usertalkpage.append();
						});
					}

					// add this nomination to the user's userspace log, if the user has enabled it
					if (params.lognomination) {
						Twinkle.speedy.callbacks.user.addToLog(params, initialContrib);
					}
				};
				var thispage = new Morebits.wiki.page(Morebits.pageNameNorm);
				thispage.lookupCreation(callback);
			// or, if not notifying, add this nomination to the user's userspace log without the initial contributor's name
			} else if (params.lognomination) {
				Twinkle.speedy.callbacks.user.addToLog(params, null);
			}
		},

		// note: this code is also invoked from twinkleimage
		// the params used are:
		//   for CSD: params.values, params.normalizeds  (note: normalizeds is an array)
		//   for DI: params.fromDI = true, params.templatename, params.normalized  (note: normalized is a string)
		addToLog: function(params, initialContrib) {
			var usl = new Morebits.userspaceLogger(Twinkle.getPref('speedyLogPageName'));
			usl.initialText =
				'这是该用户使用[[H:TW|Twinkle]]的速删模块做出的[[QW:CSD|快速删除]]提名列表。\n\n' +
				'如果您不再想保留此日志，请在[[' + Twinkle.getPref('configPage') + '|参数设置]]中关掉，并' +
				'使用[[QW:O1|CSD O1]]提交快速删除。' +
				(Morebits.userIsSysop ? '\n\n此日志并不记录用Twinkle直接执行的删除。' : '');

			var appendText = '# [[:' + Morebits.pageNameNorm + ']]：';
			if (params.fromDI) {
				if (params.normalized === 'f3 f4') {
					appendText += '图版[[QW:F1|CSD F1]]（{{tl|no source no license/auto}}）';
				} else {
					appendText += '图版[[QW:CSD#' + params.normalized.toUpperCase() + '|CSD ' + params.normalized.toUpperCase() + ']]（{{tl|' + params.templatename + '}}）';
				}
			} else {
				if (params.normalizeds.length > 1) {
					appendText += '多个理由（';
					$.each(params.normalizeds, function(index, norm) {
						appendText += '[[QW:CSD#' + norm.toUpperCase() + '|' + norm.toUpperCase() + ']]、';
					});
					appendText = appendText.substr(0, appendText.length - 1);  // remove trailing comma
					appendText += '）';
				} else if (params.normalizeds[0] === 'db') {
					appendText += '自定义理由';
				} else {
					appendText += '[[QW:CSD#' + params.normalizeds[0].toUpperCase() + '|CSD ' + params.normalizeds[0].toUpperCase() + ']]';
				}
			}

			if (initialContrib) {
				appendText += '；通知{{user|' + initialContrib + '}}';
			}
			appendText += ' ~~~~~\n';

			usl.changeTags = Twinkle.changeTags;
			usl.log(appendText, '记录对[[' + Morebits.pageNameNorm + ']]的快速删除提名');
		}
	}
};

// validate subgroups in the form passed into the speedy deletion tag
Twinkle.speedy.getParameters = function twinklespeedyGetParameters(form, values) {
	var parameters = [];

	$.each(values, function(index, value) {
		var currentParams = [];
		var redimage;
		switch (value) {
			case 'reason':
				if (form['csd.reason_1']) {
					var dbrationale = form['csd.reason_1'].value;
					if (!dbrationale || !dbrationale.trim()) {
						alert('自定义理由：请指定理由。');
						parameters = null;
						return false;
					}
					currentParams['1'] = dbrationale;
				}
				break;

			case 'a2':
				if (form['csd.a2_pagename']) {
					var a2_otherpage = form['csd.a2_pagename'].value;
					if (!a2_otherpage || !a2_otherpage.trim()) {
						alert('CSD A2：请提供现有条目的名称。');
						parameters = null;
						return false;
					}
					currentParams.pagename = a2_otherpage;
				}
				break;

			case 'g4':
				if (form['csd.g4_pagename']) {
					var g4_otherpage = form['csd.g4_pagename'].value;
					if (!g4_otherpage || !g4_otherpage.trim()) {
						alert('CSD G4：请提供已被删除页面的名称。');
						parameters = null;
						return false;
					}
					currentParams.pagename = g4_otherpage;
				}
				break;

			case 'f2':
				if (form['csd.f2_filename']) {
					redimage = form['csd.f2_filename'].value;
					if (!redimage || !redimage.trim()) {
						alert('CSD F2：请提供另一文件的名称。');
						parameters = null;
						return false;
					}
					currentParams.filename = redimage.replace(new RegExp('^\\s*' + Morebits.namespaceRegex(6) + ':', 'i'), '');
				}
				break;

			case 'r1':
				if (form['csd.r1_type']) {
					var r1_redirtype = form['csd.r1_type'].value;
					if (!r1_redirtype) {
						alert('CSD R1：请选择适用类型。');
						parameters = null;
						return false;
					}
					currentParams['1'] = r1_redirtype;
				}
				break;

			case 'r2':
				if (form['csd.r2_type']) {
					var r2_redirtype = form['csd.r2_type'].value;
					if (!r2_redirtype) {
						alert('CSD R2：请选择适用类型。');
						parameters = null;
						return false;
					}
					currentParams['1'] = r2_redirtype;
				}
				break;

			default:
				break;
		}
		parameters.push(currentParams);
	});
	return parameters;
};

// Function for processing talk page notification template parameters
Twinkle.speedy.getUserTalkParameters = function twinklespeedyGetUserTalkParameters(normalized, parameters) { // eslint-disable-line no-unused-vars
	var utparams = [];
	switch (normalized) {
		default:
			break;
	}
	return utparams;
};

/**
 * @param {Event} e
 * @returns {Array}
 */
Twinkle.speedy.resolveCsdValues = function twinklespeedyResolveCsdValues(e) {
	var values = (e.target.form ? e.target.form : e.target).getChecked('csd');
	if (values.length === 0) {
		alert('请选择一个理据。');
		return null;
	}
	return values;
};

Twinkle.speedy.callback.evaluateSysop = function twinklespeedyCallbackEvaluateSysop(e) {
	var form = e.target.form ? e.target.form : e.target;

	if (e.target.type === 'checkbox' || e.target.type === 'text' ||
			e.target.type === 'select') {
		return;
	}

	var tag_only = form.tag_only;
	if (tag_only && tag_only.checked) {
		Twinkle.speedy.callback.evaluateUser(e);
		return;
	}

	var values = Twinkle.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}
	var templateParams = Twinkle.speedy.getParameters(form, values);
	if (!templateParams) {
		return;
	}

	var normalizeds = values.map(function(value) {
		return Twinkle.speedy.normalizeHash[value];
	});

	// analyse each criterion to determine whether to watch the page, prompt for summary, or notify the creator
	var watchPage, promptForSummary;
	normalizeds.forEach(function(norm) {
		if (Twinkle.getPref('watchSpeedyPages').indexOf(norm) !== -1) {
			watchPage = Twinkle.getPref('watchSpeedyExpiry');
		}
		if (Twinkle.getPref('promptForSpeedyDeletionSummary').indexOf(norm) !== -1) {
			promptForSummary = true;
		}
	});

	var params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		deleteTalkPage: form.talkpage && form.talkpage.checked,
		deleteRedirects: form.redirects.checked,
		promptForSummary: promptForSummary,
		templateParams: templateParams
	};

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Twinkle.speedy.callbacks.sysop.main(params);
};

Twinkle.speedy.callback.evaluateUser = function twinklespeedyCallbackEvaluateUser(e) {
	var form = e.target.form ? e.target.form : e.target;

	if (e.target.type === 'checkbox' || e.target.type === 'text' ||
			e.target.type === 'select') {
		return;
	}

	var values = Twinkle.speedy.resolveCsdValues(e);
	if (!values) {
		return;
	}
	var templateParams = Twinkle.speedy.getParameters(form, values);
	if (!templateParams) {
		return;
	}

	// var multiple = form.multiple.checked;

	var normalizeds = values.map(function(value) {
		return Twinkle.speedy.normalizeHash[value];
	});

	// analyse each criterion to determine whether to watch the page/notify the creator
	var watchPage = normalizeds.some(function(norm) {
		return Twinkle.getPref('watchSpeedyPages').indexOf(norm) !== -1 && Twinkle.getPref('watchSpeedyExpiry');
	});
	var notifyuser = form.notify.checked && normalizeds.some(function(norm) {
		return Twinkle.getPref('notifyUserOnSpeedyDeletionNomination').indexOf(norm) !== -1;
	});
	var csdlog = Twinkle.getPref('logSpeedyNominations') && normalizeds.some(function(norm) {
		return Twinkle.getPref('noLogOnSpeedyNomination').indexOf(norm) === -1;
	});

	var blank = form.blank.checked;

	var params = {
		values: values,
		normalizeds: normalizeds,
		watch: watchPage,
		usertalk: notifyuser,
		lognomination: csdlog,
		requestsalt: form.salting.checked,
		templateParams: templateParams,
		blank: blank
	};

	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(form);

	Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
	Morebits.wiki.actionCompleted.notice = 'Tagging complete';

	var qiuwen_page = new Morebits.wiki.page(mw.config.get('wgPageName'), 'Tagging page');
	qiuwen_page.setChangeTags(Twinkle.changeTags); // Here to apply to triage
	qiuwen_page.setCallbackParameters(params);
	qiuwen_page.load(Twinkle.speedy.callbacks.user.main);
};

Twinkle.addInitCallback(Twinkle.speedy, 'speedy');
})(jQuery);


// </nowiki>
