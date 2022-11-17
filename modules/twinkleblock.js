/**
 * SPDX-License-Identifier: CC-BY-SA-4.0
 * _addText: '{{Gadget Header|license=CC-BY-SA-4.0}}'
 *
 * @url https://git.qiuwen.wiki/qiuwen/Twinkle
 * @author © 2011-2022 English Wikipedia Contributors
 * @author © 2011-2021 Chinese Wikipedia Contributors
 * @author © 2021-     Qiuwen Baike Contributors
 * @license <https://creativecommons.org/licenses/by-sa/4.0/>
 */
/* Twinkle.js - twinkleblock.js */
// <nowiki>
(function ($) {
var api = new mw.Api(),
	relevantUserName = mw.config.get('wgRelevantUserName');
var menuFormattedNamespaces = $.extend({}, mw.config.get('wgFormattedNamespaces'));
menuFormattedNamespaces[0] = '（条目）';
var blockActionText = {
	block: '封禁',
	reblock: '重新封禁',
	unblock: '解除封禁'
};

/*
 ****************************************
 *** twinkleblock.js: Block module
 ****************************************
 * Mode of invocation:     Tab ("Block")
 * Active on:              Any page with relevant user name (userspace, contribs, etc.)
 */

Twinkle.block = function twinkleblock() {
	// should show on Contributions or Block pages, anywhere there's a relevant user
	if (relevantUserName && (Morebits.userIsSysop || !mw.util.isIPAddress(relevantUserName, true))) {
		Twinkle.addPortletLink(Twinkle.block.callback, '封禁', 'tw-block', '封禁相关用户');
	}
};
Twinkle.block.callback = function twinkleblockCallback() {
	if (relevantUserName === mw.config.get('wgUserName') && !confirm('您即将对自己执行封禁相关操作！确认要继续吗？')) {
		return;
	}
	Twinkle.block.currentBlockInfo = undefined;
	Twinkle.block.field_block_options = {};
	Twinkle.block.field_template_options = {};
	var Window = new Morebits.simpleWindow(650, 530);
	// need to be verbose about who we're blocking
	Window.setTitle('封禁或向' + relevantUserName + '发出封禁模板');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('封禁方针', 'QW:BLOCK');
	Window.addFooterLink('封禁设置', 'H:TW/PREF#封禁');
	Window.addFooterLink('Twinkle帮助', 'H:TW/DOC#封禁');
	var form = new Morebits.quickForm(Twinkle.block.callback.evaluate);
	var actionfield = form.append({
		type: 'field',
		label: '操作类型'
	});
	actionfield.append({
		type: 'checkbox',
		name: 'actiontype',
		event: Twinkle.block.callback.change_action,
		list: [ {
			label: '封禁用户',
			value: 'block',
			tooltip: '用选择的选项全站封禁相关用户，如果未勾选部分封禁则为全站封禁。',
			hidden: !Morebits.userIsSysop,
			checked: Morebits.userIsSysop
		}, {
			label: '部分封禁',
			value: 'partial',
			tooltip: '启用部分封禁及部分封禁模板。',
			hidden: !Morebits.userIsSysop,
			checked: Twinkle.getPref('defaultToPartialBlocks')
		}, {
			label: '加入封禁模板到用户讨论页',
			value: 'template',
			tooltip: '如果执行封禁的管理员忘记发出封禁模板，或你封禁了用户而没有给其发出模板，则你可以用此来发出合适的模板。勾选部分封禁以使用部分封禁模板。',
			hidden: !Morebits.userIsSysop,
			checked: Morebits.userIsSysop
		}, {
			label: '标记用户页',
			value: 'tag',
			tooltip: '将用户页替换成相关的标记模板，仅限永久封禁使用。',
			hidden: true,
			checked: !Morebits.userIsSysop
		}, {
			label: '保护用户页',
			value: 'protect',
			tooltip: '全保护用户页，仅限永久封禁使用。',
			hidden: true
		}, {
			label: '解除封禁用户',
			value: 'unblock',
			tooltip: '解除封禁相关用户。',
			hidden: !Morebits.userIsSysop
		} ]
	});
	form.append({
		type: 'field',
		label: '默认',
		name: 'field_preset'
	});
	form.append({
		type: 'field',
		label: '模板选项',
		name: 'field_template_options'
	});
	form.append({
		type: 'field',
		label: '封禁选项',
		name: 'field_block_options'
	});
	form.append({
		type: 'field',
		label: '标记用户页',
		name: 'field_tag_options'
	});
	form.append({
		type: 'field',
		label: '解除封禁选项',
		name: 'field_unblock_options'
	});
	form.append({
		type: 'submit',
		label: '提交'
	});
	var result = form.render();
	Window.setContent(result);
	Window.display();
	result.root = result;
	Twinkle.block.fetchUserInfo(function () {
		if (Twinkle.block.isRegistered) {
			var $form = $(result);
			Morebits.quickForm.setElementVisibility($form.find('[name=actiontype][value=tag]').parent(), true);
			if (Morebits.userIsSysop) {
				Morebits.quickForm.setElementVisibility($form.find('[name=actiontype][value=protect]').parent(), true);
			}
		}

		// clean up preset data (defaults, etc.), done exactly once, must be before Twinkle.block.callback.change_action is called
		Twinkle.block.transformBlockPresets();

		// init the controls after user and block info have been fetched
		var evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		result.actiontype[0].dispatchEvent(evt);
	});
};
Twinkle.block.fetchUserInfo = function twinkleblockFetchUserInfo(fn) {
	var userName = relevantUserName;
	var query = {
		format: 'json',
		action: 'query',
		list: 'blocks|users|logevents',
		letype: 'block',
		lelimit: 2,
		ususers: userName,
		usprop: 'groupmemberships',
		letitle: 'User:' + userName
	};
	if (Morebits.ip.isRange(userName)) {
		query.bkip = userName;
	} else {
		query.bkusers = userName;
	}
	api.get(query).then(function (data) {
		var blockinfo = data.query.blocks[0],
			userinfo = data.query.users[0];
		Twinkle.block.isRegistered = !!userinfo.userid;
		if (Twinkle.block.isRegistered) {
			relevantUserName = 'User:' + userName;
			Twinkle.block.userIsBot = !!userinfo.groupmemberships && userinfo.groupmemberships.map(function (e) {
				return e.group;
			}).indexOf('bot') !== -1;
		} else {
			relevantUserName = userName;
			Twinkle.block.userIsBot = false;
		}
		if (blockinfo) {
			// handle frustrating system of inverted boolean values
			blockinfo.disabletalk = blockinfo.allowusertalk === undefined;
			blockinfo.hardblock = blockinfo.anononly === undefined;
			Twinkle.block.currentBlockInfo = blockinfo;
		}
		Twinkle.block.hasBlockLog = !!data.query.logevents.length;
		// Used later to check if block status changed while filling out the form and display block info in window
		Twinkle.block.blockLogId = Twinkle.block.hasBlockLog ? data.query.logevents[0].logid : false;
		// Only use block or reblock log
		Twinkle.block.recentBlockLog = data.query.logevents.length >= 1 && data.query.logevents[0].action !== 'unblock' ? data.query.logevents[0] : data.query.logevents.length >= 2 ? data.query.logevents[1] : null;
		// Only ongoing block could be unblocked
		Twinkle.block.manualUnblock = Twinkle.block.hasBlockLog && data.query.logevents[0].action === 'unblock';
		if (typeof fn === 'function') {
			return fn();
		}
	}, function (msg) {
		Morebits.status.init($('div[name="currentblock"] span').last()[0]);
		Morebits.status.warn('抓取用户信息出错', msg);
	});
};
Twinkle.block.callback.saveFieldset = function twinkleblockCallbacksaveFieldset(fieldset) {
	Twinkle.block[$(fieldset).prop('name')] = {};
	$(fieldset).serializeArray().forEach(function (el) {
		// namespaces and pages for partial blocks are overwritten
		// here, but we're handling them elsewhere so that's fine
		Twinkle.block[$(fieldset).prop('name')][el.name] = el.value;
	});
};
Twinkle.block.callback.change_action = function twinkleblockCallbackChangeAction(e) {
	var field_preset,
		field_template_options,
		field_block_options,
		field_tag_options,
		field_unblock_options,
		$form = $(e.target.form);
	// Make ifs shorter
	var block = $form.find('[name=actiontype][value=block]');
	var blockBox = block.is(':checked');
	var template = $form.find('[name=actiontype][value=template]');
	var templateBox = template.is(':checked');
	var tag = $form.find('[name=actiontype][value=tag]');
	var protect = $form.find('[name=actiontype][value=protect]');
	var partial = $form.find('[name=actiontype][value=partial]');
	var partialBox = partial.is(':checked');
	var unblock = $form.find('[name=actiontype][value=unblock]');
	var blockGroup = partialBox ? Twinkle.block.blockGroupsPartial : Twinkle.block.blockGroups;
	if (e.target.value === 'unblock') {
		if (!Twinkle.block.currentBlockInfo) {
			unblock.prop('checked', false);
			return alert('用户没有被封禁');
		}
		block.prop('checked', false);
		blockBox = false;
		template.prop('checked', false);
		templateBox = false;
		tag.prop('checked', false);
		protect.prop('checked', false);
		partial.prop('checked', false);
	} else {
		unblock.prop('checked', false);
	}
	partial.prop('disabled', !blockBox && !templateBox);
	Twinkle.block.callback.saveFieldset($('[name=field_block_options]'));
	Twinkle.block.callback.saveFieldset($('[name=field_template_options]'));
	Twinkle.block.callback.saveFieldset($('[name=field_tag_options]'));
	Twinkle.block.callback.saveFieldset($('[name=field_unblock_options]'));
	if (blockBox) {
		field_preset = new Morebits.quickForm.element({
			type: 'field',
			label: '默认',
			name: 'field_preset'
		});
		field_preset.append({
			type: 'select',
			name: 'preset',
			label: '选择默认：',
			event: Twinkle.block.callback.change_preset,
			list: Twinkle.block.callback.filtered_block_groups(blockGroup)
		});
		field_block_options = new Morebits.quickForm.element({
			type: 'field',
			label: '封禁选项',
			name: 'field_block_options'
		});
		field_block_options.append({
			type: 'div',
			name: 'currentblock',
			label: ' '
		});
		field_block_options.append({
			type: 'div',
			name: 'hasblocklog',
			label: ' '
		});
		field_block_options.append({
			type: 'select',
			name: 'expiry_preset',
			label: '过期时间：',
			event: Twinkle.block.callback.change_expiry,
			list: [ {
				label: '自定义',
				value: 'custom',
				selected: true
			}, {
				label: '无限期',
				value: 'infinity'
			}, {
				label: '3小时',
				value: '3 hours'
			}, {
				label: '12小时',
				value: '12 hours'
			}, {
				label: '1天',
				value: '1 day'
			}, {
				label: '31小时',
				value: '31 hours'
			}, {
				label: '2天',
				value: '2 days'
			}, {
				label: '3天',
				value: '3 days'
			}, {
				label: '1周',
				value: '1 week'
			}, {
				label: '2周',
				value: '2 weeks'
			}, {
				label: '1个月',
				value: '1 month'
			}, {
				label: '3个月',
				value: '3 months'
			}, {
				label: '6个月',
				value: '6 months'
			}, {
				label: '1年',
				value: '1 year'
			}, {
				label: '2年',
				value: '2 years'
			}, {
				label: '3年',
				value: '3 years'
			} ]
		});
		field_block_options.append({
			type: 'input',
			name: 'expiry',
			label: '自定义过期时间',
			tooltip: '您可以使用相对时间，如“1 minute”或“19 days”；或绝对时间，“yyyymmddhhmm”（如“200602011405”是2006年2月1日14:05 UTC。）',
			value: Twinkle.block.field_block_options.expiry || Twinkle.block.field_template_options.template_expiry
		});
		if (partialBox) {
			// Partial block
			field_block_options.append({
				type: 'select',
				multiple: true,
				name: 'pagerestrictions',
				label: '页面封禁',
				value: '',
				tooltip: '最多10页面。'
			});
			var ns = field_block_options.append({
				type: 'select',
				multiple: true,
				name: 'namespacerestrictions',
				label: '命名空间封禁',
				value: '',
				tooltip: '指定封禁的命名空间。'
			});
			$.each(menuFormattedNamespaces, function (number, name) {
				// Ignore -1: Special; -2: Media; and 2300-2303: Gadget (talk) and Gadget definition (talk)
				if (number >= 0 && number < 830) {
					ns.append({
						type: 'option',
						label: name,
						value: number
					});
				}
			});
		}
		var blockoptions = [ {
			checked: Twinkle.block.field_block_options.nocreate,
			label: '禁止创建账户',
			name: 'nocreate',
			value: '1'
		}, {
			checked: Twinkle.block.field_block_options.noemail,
			label: '电子邮件停用',
			name: 'noemail',
			value: '1'
		}, {
			checked: Twinkle.block.field_block_options.disabletalk,
			label: '不能编辑自己的讨论页',
			name: 'disabletalk',
			value: '1',
			tooltip: partialBox ? '如果使用部分封禁，不应选择此项，除非您也想要禁止编辑用户讨论页。' : ''
		} ];
		if (Twinkle.block.isRegistered) {
			blockoptions.push({
				checked: Twinkle.block.field_block_options.autoblock,
				label: '自动封禁',
				name: 'autoblock',
				value: '1'
			});
		} else {
			blockoptions.push({
				checked: Twinkle.block.field_block_options.hardblock,
				label: '阻止登录用户使用该IP地址编辑',
				name: 'hardblock',
				value: '1'
			});
		}
		blockoptions.push({
			checked: Twinkle.block.field_block_options.watchuser,
			label: '监视该用户的用户页和讨论页',
			name: 'watchuser',
			value: '1'
		});
		blockoptions.push({
			checked: true,
			label: '标记当前的破坏中的请求',
			name: 'closevip',
			value: '1'
		});
		field_block_options.append({
			type: 'checkbox',
			name: 'blockoptions',
			list: blockoptions
		});
		field_block_options.append({
			type: 'textarea',
			label: '理由（用于封禁日志）：',
			name: 'reason',
			value: Twinkle.block.field_block_options.reason
		});
		field_block_options.append({
			type: 'div',
			name: 'filerlog_label',
			label: '“参见”：',
			style: 'display:inline-block;font-style:normal !important',
			tooltip: '在封禁理由中标清特殊情况以供其他管理员参考'
		});
		field_block_options.append({
			type: 'checkbox',
			name: 'filter_see_also',
			event: Twinkle.block.callback.toggle_see_alsos,
			style: 'display:inline-block; margin-right:5px',
			list: [ {
				label: '过滤器日志',
				checked: false,
				value: '过滤器日志'
			} ]
		});
		field_block_options.append({
			type: 'checkbox',
			name: 'deleted_see_also',
			event: Twinkle.block.callback.toggle_see_alsos,
			style: 'display:inline-block',
			list: [ {
				label: '已删除的编辑',
				checked: false,
				value: '已删除的编辑'
			} ]
		});
		field_block_options.append({
			type: 'checkbox',
			name: 'filter_see_also',
			event: Twinkle.block.callback.toggle_see_alsos,
			style: 'display:inline-block; margin-right:5px',
			list: [ {
				label: '用户讨论页',
				checked: false,
				value: '用户讨论页'
			} ]
		});
		field_block_options.append({
			type: 'checkbox',
			name: 'filter_see_also',
			event: Twinkle.block.callback.toggle_see_alsos,
			style: 'display:inline-block; margin-right:5px',
			list: [ {
				label: '过去的封禁记录',
				checked: false,
				value: '过去的封禁记录'
			} ]
		});
		if (Twinkle.block.currentBlockInfo) {
			field_block_options.append({
				type: 'hidden',
				name: 'reblock',
				value: '1'
			});
		}
	}
	if (templateBox) {
		field_template_options = new Morebits.quickForm.element({
			type: 'field',
			label: '模板选项',
			name: 'field_template_options'
		});
		field_template_options.append({
			type: 'select',
			name: 'template',
			label: '选择讨论页模板：',
			event: Twinkle.block.callback.change_template,
			list: Twinkle.block.callback.filtered_block_groups(blockGroup, true),
			value: Twinkle.block.field_template_options.template
		});
		field_template_options.append({
			type: 'input',
			name: 'article',
			display: 'none',
			label: '条目链接',
			value: '',
			tooltip: '可以随通知链接页面，例如破坏的目标。没有条目需要链接则请留空。'
		});

		// Only visible if partial and not blocking
		field_template_options.append({
			type: 'input',
			name: 'area',
			display: 'none',
			label: '封禁区域',
			value: '',
			tooltip: '阻止用户编辑的页面或命名空间的可选说明。'
		});
		if (!blockBox) {
			field_template_options.append({
				type: 'input',
				name: 'template_expiry',
				display: 'none',
				label: '封禁期限：',
				value: '',
				tooltip: '封禁时长，如24小时、2周、无限期等。'
			});
		}
		field_template_options.append({
			type: 'input',
			name: 'block_reason',
			label: '“由于…您已被封禁”',
			display: 'none',
			tooltip: '可选的理由，用于替换默认理由。只在常规封禁模板中有效。',
			value: Twinkle.block.field_template_options.block_reason
		});
		if (blockBox) {
			field_template_options.append({
				type: 'checkbox',
				name: 'blank_duration',
				list: [ {
					label: '不在模板中包含封禁期限',
					checked: Twinkle.block.field_template_options.blank_duration,
					tooltip: '模板将会显示“一段时间”而不是具体时长'
				} ]
			});
		} else {
			field_template_options.append({
				type: 'checkbox',
				list: [ {
					label: '不能编辑自己的讨论页',
					name: 'notalk',
					checked: Twinkle.block.field_template_options.notalk,
					tooltip: '用此在保护模板中指明该用户编辑讨论页的权限已被移除'
				} /* ,
            {
            label: '不能发送电子邮件',
            name: 'noemail_template',
            checked: Twinkle.block.field_template_options.noemail_template,
            tooltip: '用此在保护模板中指明该用户发送电子邮件的权限已被移除'
            },
            {
            label: '不能创建账户',
            name: 'nocreate_template',
            checked: Twinkle.block.field_template_options.nocreate_template,
            tooltip: '用此在保护模板中指明该用户创建账户的权限已被移除'
            } */]
			});
		}

		var $previewlink = $('<a id="twinkleblock-preivew-link">预览</a>');
		$previewlink.off('click').on('click', function () {
			Twinkle.block.callback.preview($form[0]);
		});
		$previewlink.css({
			cursor: 'pointer'
		});
		field_template_options.append({
			type: 'div',
			id: 'blockpreview',
			label: [ $previewlink[0] ]
		});
		field_template_options.append({
			type: 'div',
			id: 'twinkleblock-previewbox',
			style: 'display: none'
		});
	}
	if ($form.find('[name=actiontype][value=tag]').is(':checked')) {
		field_tag_options = new Morebits.quickForm.element({
			type: 'field',
			label: '标记用户页',
			name: 'field_tag_options'
		});
		field_tag_options.append({
			type: 'checkbox',
			name: 'tag',
			label: '选择用户页模板：',
			list: [ {
				label: '{{Blocked user}}：一般永久封禁',
				value: 'Blocked user'
			}, {
				label: '{{Blocked sockpuppet}}：傀儡账户',
				value: 'Blocked sockpuppet',
				subgroup: [ {
					name: 'sppUsername',
					type: 'input',
					label: '主账户用户名：'
				}, {
					name: 'sppEvidence',
					type: 'input',
					label: '根据……确定：',
					tooltip: '纯文字或是带[[]]的链接，例如：[[Special:固定链接/xxxxxxxx|用户查核]]'
				} ]
			}, {
				label: '{{Sockpuppeteer|blocked}}：傀儡主账户',
				value: 'Sockpuppeteer',
				subgroup: [ {
					type: 'checkbox',
					list: [ {
						name: 'spmChecked',
						value: 'spmChecked',
						label: '经用户查核确认'
					} ]
				}, {
					name: 'spmEvidence',
					type: 'input',
					label: '额外理由：'
				} ]
			}, {
				label: '{{Locked global account}}：全域锁定',
				value: 'Locked global account',
				subgroup: [ {
					type: 'checkbox',
					list: [ {
						name: 'lockBlocked',
						value: 'lockBlocked',
						label: '亦被本地封禁'
					} ]
				} ]
			} ]
		});
		field_tag_options.append({
			type: 'input',
			name: 'category',
			label: 'Category:……的用户分身（主账户用户名）',
			tooltip: '您通常应该使用{{Blocked sockpuppet}}的主账户参数来产生分类，只有单独使用{{Locked global account}}才需填写此项。'
		});
	}
	if ($form.find('[name=actiontype][value=unblock]').is(':checked')) {
		field_unblock_options = new Morebits.quickForm.element({
			type: 'field',
			label: '解除封禁选项',
			name: 'field_unblock_options'
		});
		field_unblock_options.append({
			type: 'textarea',
			label: '理由（用于封禁日志）：',
			name: 'reason',
			value: Twinkle.block.field_unblock_options.reason
		});
	}
	var oldfield;
	if (field_preset) {
		oldfield = $form.find('fieldset[name="field_preset"]')[0];
		oldfield.parentNode.replaceChild(field_preset.render(), oldfield);
	} else {
		$form.find('fieldset[name="field_preset"]').hide();
	}
	if (field_block_options) {
		oldfield = $form.find('fieldset[name="field_block_options"]')[0];
		oldfield.parentNode.replaceChild(field_block_options.render(), oldfield);
		$form.find('[name=pagerestrictions]').select2({
			width: '100%',
			placeholder: '输入要阻止用户编辑的页面',
			language: {
				errorLoading: function () {
					return '搜索词汇不完整或无效';
				}
			},
			maximumSelectionLength: 10,
			// Software limitation [[phab:T202776]]
			minimumInputLength: 1,
			// prevent ajax call when empty
			ajax: {
				url: mw.util.wikiScript('api'),
				dataType: 'json',
				delay: 100,
				data: function (params) {
					var title = mw.Title.newFromText(params.term);
					if (!title) {
						return;
					}
					return {
						action: 'query',
						format: 'json',
						list: 'allpages',
						apfrom: title.title,
						apnamespace: title.namespace,
						aplimit: '10'
					};
				},
				processResults: function (data) {
					return {
						results: data.query.allpages.map(function (page) {
							var title = mw.Title.newFromText(page.title, page.ns).toText();
							return {
								id: title,
								text: title
							};
						})
					};
				}
			},
			templateSelection: function (choice) {
				return $('<a>').text(choice.text).attr({
					href: mw.util.getUrl(choice.text),
					target: '_blank'
				});
			}
		});
		$form.find('[name=namespacerestrictions]').select2({
			width: '100%',
			matcher: Morebits.select2.matchers.wordBeginning,
			language: {
				searching: Morebits.select2.queryInterceptor
			},
			templateResult: Morebits.select2.highlightSearchMatches,
			placeholder: '选择要阻止用户编辑的命名空间'
		});
		mw.util.addCSS(
			// Reduce padding
			'.select2-results .select2-results__option { padding-top: 1px; padding-bottom: 1px; }' +
      // Adjust font size
      '.select2-container .select2-dropdown .select2-results { font-size: 13px; } .select2-container .selection .select2-selection__rendered { font-size: 13px; }' +
      // Remove black border
      '.select2-container--default.select2-container--focus .select2-selection--multiple { border: 1px solid #aaa; }' +
      // Make the tiny cross larger
      '.select2-selection__choice__remove { font-size: 130%; }');
	} else {
		$form.find('fieldset[name="field_block_options"]').hide();
		// Clear select2 options
		$form.find('[name=pagerestrictions]').val(null).trigger('change');
		$form.find('[name=namespacerestrictions]').val(null).trigger('change');
	}
	if (field_tag_options) {
		oldfield = $form.find('fieldset[name="field_tag_options"]')[0];
		oldfield.parentNode.replaceChild(field_tag_options.render(), oldfield);
	} else {
		$form.find('fieldset[name="field_tag_options"]').hide();
	}
	if (field_unblock_options) {
		oldfield = $form.find('fieldset[name="field_unblock_options"]')[0];
		oldfield.parentNode.replaceChild(field_unblock_options.render(), oldfield);
	} else {
		$form.find('fieldset[name="field_unblock_options"]').hide();
	}
	if (field_template_options) {
		oldfield = $form.find('fieldset[name="field_template_options"]')[0];
		oldfield.parentNode.replaceChild(field_template_options.render(), oldfield);
		e.target.form.root.previewer = new Morebits.wiki.preview($(e.target.form.root).find('#twinkleblock-previewbox').last()[0]);
	} else {
		$form.find('fieldset[name="field_template_options"]').hide();
	}
	if (blockBox && Twinkle.block.hasBlockLog) {
		var $blockloglink = $('<a target="_blank" href="' + mw.util.getUrl('Special:Log', {
			action: 'view',
			page: relevantUserName,
			type: 'block'
		}) + '">封禁日志</a>)');
		Morebits.status.init($('div[name="hasblocklog"] span').last()[0]);
		Morebits.status.warn(Twinkle.block.currentBlockInfo ? '封禁详情' : [ '此用户曾在', $('<b>' + new Morebits.date(Twinkle.block.recentBlockLog.timestamp).calendar('utc') + '</b>')[0], '被' + Twinkle.block.recentBlockLog.user + '封禁', $('<b>' + Morebits.string.formatTime(Twinkle.block.recentBlockLog.params.duration) + '</b>')[0], Twinkle.block.manualUnblock ? '（手动解封）' : '（自动过期）' ], $blockloglink[0]);
	}
	if (blockBox && Twinkle.block.currentBlockInfo) {
		Morebits.status.init($('div[name="currentblock"] span').last()[0]);
		// list=blocks without bkprops (as we do in fetchUerInfo)
		// returns partial: '' if the user is partially blocked
		var statusStr = relevantUserName + (Twinkle.block.currentBlockInfo.partial === '' ? '已被部分封禁' : '已被全站封禁');
		if (Twinkle.block.currentBlockInfo.expiry === 'infinity') {
			statusStr += '（无限期）';
		} else if (new Morebits.date(Twinkle.block.currentBlockInfo.expiry).isValid()) {
			statusStr += '（终止于' + new Morebits.date(Twinkle.block.currentBlockInfo.expiry).calendar('utc') + '）';
		}
		var infoStr = '提交请求以变更封禁';
		if (Twinkle.block.currentBlockInfo.partial === undefined && partialBox) {
			infoStr += '为部分封禁';
		} else if (Twinkle.block.currentBlockInfo.partial === '' && !partialBox) {
			infoStr += '为全站封禁';
		}
		Morebits.status.warn(statusStr, infoStr);
		Twinkle.block.callback.update_form(e, Twinkle.block.currentBlockInfo);
	}
	if (templateBox) {
		// make sure all the fields are correct based on defaults
		if (blockBox) {
			Twinkle.block.callback.change_preset(e);
		} else {
			Twinkle.block.callback.change_template(e);
		}
	}
};

/*
 * Keep alphabetized by key name, Twinkle.block.blockGroups establishes
 *  the order they will appear in the interface
 *
 * Block preset format, all keys accept only 'true' (omit for false) except where noted:
 * <title of block template> : {
 *   autoblock: <autoblock any IP addresses used (for registered users only)>
 *   disabletalk: <disable user from editing their own talk page while blocked>
 *   expiry: <string - expiry timestamp, can include relative times like "5 months", "2 weeks" etc, use "infinity" for indefinite>
 *   forAnonOnly: <show block option in the interface only if the relevant user is an IP>
 *   forRegisteredOnly: <show block option in the interface only if the relevant user is registered>
 *   label: <string - label for the option of the dropdown in the interface (keep brief)>
 *   noemail: prevent the user from sending email through Special:Emailuser
 *   pageParam: <set if the associated block template accepts a page parameter>
 *   prependReason: <string - prepends the value of 'reason' to the end of the existing reason, namely for when revoking talk page access>
 *   nocreate: <block account creation from the user's IP (for anonymous users only)>
 *   nonstandard: <template does not conform to stewardship of WikiProject User Warnings and may not accept standard parameters>
 *   reason: <string - block rationale, as would appear in the block log,
 *           and the edit summary for when adding block template, unless 'summary' is set>
 *   reasonParam: <set if the associated block template accepts a reason parameter>
 *   sig: <string - set to ~~~~ if block template does not accept "true" as the value, or set null to omit sig param altogether>
 *   summary: <string - edit summary for when adding block template to user's talk page, if not set, 'reason' is used>
 *   suppressArticleInSummary: <set to suppress showing the article name in the edit summary, as with attack pages>
 *   templateName: <string - name of template to use (instead of key name), entry will be omitted from the Templates list.
 *           (e.g. use another template but with different block options)>
 *   useInitialOptions: <when preset is chosen, only change given block options, leave others as they were>
 *
 * WARNING: 'anononly' and 'allowusertalk' are enabled by default.
 *   To disable, set 'hardblock' and 'disabletalk', respectively
 */
Twinkle.block.blockPresetsInfo = {
	'anonblock': {
		expiry: '3 days',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{anonblock}}',
		summary: '匿名编辑封禁',
		sig: '~~~~'
	},
	'blocked proxy': {
		expiry: '2 years',
		nocreate: true,
		hardblock: true,
		nonstandard: true,
		reason: '{{blocked proxy}}',
		summary: '开放代理封禁',
		sig: '~~~~'
	},
	'checkuserblock': {
		expiry: '1 week',
		forAnonOnly: true,
		nocreate: true,
		hardblock: true,
		nonstandard: true,
		reason: '{{checkuserblock}}',
		summary: '用户查核IP封禁',
		sig: '~~~~'
	},
	'checkuserblock-account': {
		autoblock: true,
		expiry: 'infinity',
		forRegisteredOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{checkuserblock-account}}',
		summary: '用户查核账户封禁',
		sig: '~~~~'
	},
	'range block': {
		expiry: '1 week',
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{range block}}',
		summary: '广域封禁',
		sig: '~~~~'
	},
	'school block': {
		forAnonOnly: true,
		nocreate: true,
		nonstandard: true,
		reason: '{{School block}}',
		summary: '公用IP封禁',
		sig: '~~~~'
	},
	// uw-prefixed
	'uw-3block': {
		autoblock: true,
		expiry: '1 day',
		nocreate: true
	},
	'uw-ablock': {
		autoblock: true,
		expiry: '1 day',
		forAnonOnly: true,
		nocreate: true,
		reasonParam: true
	},
	'uw-block': {
		autoblock: true,
		nocreate: true,
		reasonParam: true
	},
	'uw-blockindef': {
		autoblock: true,
		expiry: 'infinity',
		nocreate: true,
		reasonParam: true
	},
	'uw-dblock': {
		autoblock: true,
		nocreate: true
	},
	'uw-sblock': {
		autoblock: true,
		nocreate: true
	},
	'uw-ublock': {
		expiry: 'infinity',
		summary: '不当用户名'
	},
	'uw-ublock|误导': {
		expiry: 'infinity',
		reason: '{{uw-ublock|误导}}',
		summary: '误导性用户名'
	},
	'uw-ublock|宣传': {
		expiry: 'infinity',
		reason: '{{uw-ublock|宣传}}',
		summary: '宣传性用户名'
	},
	'uw-ublock|攻击|或侮辱性': {
		expiry: 'infinity',
		reason: '{{uw-ublock|攻击|或侮辱性}}',
		summary: '攻击或侮辱性用户名'
	},
	'uw-ublock|混淆': {
		expiry: 'infinity',
		reason: '{{uw-ublock|混淆}}',
		summary: '令人混淆的用户名'
	},
	'uw-vblock': {
		autoblock: true,
		expiry: '1 day',
		nocreate: true
	},
	'Bot block message': {
		expiry: 'infinity',
		sig: '~~~~'
	},
	'uw-pblock': {
		autoblock: true,
		expiry: '1 day',
		nocreate: false,
		pageParam: false,
		reasonParam: true,
		summary: '您已被禁止编辑求闻百科的部分内容'
	}
};
Twinkle.block.blockGroupsUpdated = false;
Twinkle.block.transformBlockPresets = function twinkleblockTransformBlockPresets() {
	// supply sensible defaults
	$.each(Twinkle.block.blockPresetsInfo, function (preset, settings) {
		settings.summary = settings.summary || settings.reason;
		settings.sig = settings.sig !== undefined ? settings.sig : 'yes';
		settings.indefinite = settings.indefinite || Morebits.string.isInfinity(settings.expiry);
		if (!Twinkle.block.isRegistered && settings.indefinite) {
			settings.expiry = '1 day';
		} else {
			settings.expiry = settings.expiry || '1 day';
		}
		Twinkle.block.blockPresetsInfo[preset] = settings;
	});
	if (!Twinkle.block.blockGroupsUpdated) {
		$.each(Twinkle.block.blockGroups.concat(Twinkle.block.blockGroupsPartial), function (_, blockGroup) {
			if (blockGroup.custom) {
				blockGroup.list = Twinkle.getPref('customBlockReasonList');
			}
			$.each(blockGroup.list, function (_, blockPreset) {
				var value = blockPreset.value,
					reason = blockPreset.label,
					newPreset = value + ':' + reason;
				Twinkle.block.blockPresetsInfo[newPreset] = jQuery.extend(true, {}, Twinkle.block.blockPresetsInfo[value]);
				Twinkle.block.blockPresetsInfo[newPreset].template = value;
				if (blockGroup.meta) {
					// Twinkle.block.blockPresetsInfo[newPreset].forAnonOnly = false;
					Twinkle.block.blockPresetsInfo[newPreset].forRegisteredOnly = false;
				} else if (reason) {
					Twinkle.block.blockPresetsInfo[newPreset].reason = reason;
				}
				if (blockGroup.custom && Twinkle.block.blockPresetsInfo[blockPreset.value] === undefined) {
					Twinkle.block.blockPresetsInfo[newPreset].reasonParam = true;
					Twinkle.block.blockPresetsInfo[blockPreset.value] = Twinkle.block.blockPresetsInfo[newPreset];
				}
				if (blockGroup.custom && Twinkle.block.blockPresetsInfo[blockPreset.value].expiry === undefined) {
					Twinkle.block.blockPresetsInfo[blockPreset.value].expiry = '1 day';
				}
				blockPreset.value = newPreset;
			});
		});
		Twinkle.block.blockGroupsUpdated = true;
	}
};

// These are the groups of presets and defines the order in which they appear. For each list item:
//   label: <string, the description that will be visible in the dropdown>
//   value: <string, the key of a preset in blockPresetsInfo>
Twinkle.block.blockGroups = [ {
	meta: true,
	label: '封禁模板',
	list: [ {
		label: '一般封禁',
		value: 'uw-block'
	}, {
		label: '永久封禁',
		value: 'uw-blockindef'
	}, {
		label: '匿名封禁',
		value: 'uw-ablock',
		forAnonOnly: true
	} ]
}, {
	label: '一般的封禁理由',
	list: [ {
		label: '[[QW:VAN|破坏]]',
		value: 'uw-vblock'
	}, {
		label: '[[QW:VAN|纯粹破坏]]',
		value: 'uw-blockindef',
		forRegisteredOnly: true
	}, {
		label: '[[QW:NOT#AD|散发广告、宣传或垃圾链接]]',
		value: 'uw-block'
	}, {
		label: '仅[[QW:NOT#AD|散发广告、宣传或垃圾链接]]',
		value: 'uw-blockindef',
		forRegisteredOnly: true
	}, {
		label: '违反[[QW:3RR|回退不过三原则]]',
		value: 'uw-3block'
	}, {
		label: '无礼的行为、[[QW:NPA|攻击别人]]',
		value: 'uw-block'
	}, {
		label: '[[QW:骚扰|骚扰用户]]',
		value: 'uw-block'
	}, {
		label: '[[QW:POINT|为阐释观点扰乱求闻百科]]',
		value: 'uw-block'
	}, {
		label: '[[QW:GAME|打求闻百科制度擦边球]]',
		value: 'uw-block'
	}, {
		label: '涉嫌[[QW:SOCK|滥用多重账号]] - 根据用户贡献确定',
		value: 'uw-block',
		forAnonOnly: true
	}, {
		label: '涉嫌[[QW:SOCK|滥用多重账号]] - 用户查核确认',
		value: 'uw-block',
		forAnonOnly: true
	}, {
		label: '涉嫌[[QW:SOCK|滥用多重账号]] - 根据用户贡献确定',
		value: 'uw-blockindef',
		forRegisteredOnly: true
	}, {
		label: '涉嫌[[QW:SOCK|滥用多重账号]] - 用户查核确认',
		value: 'uw-blockindef',
		forRegisteredOnly: true
	}, {
		label: '滥用[[QW:SOCK|傀儡]]',
		value: 'uw-block',
		forRegisteredOnly: true
	}, {
		label: '屡次增加不实资料',
		value: 'uw-block'
	}, {
		label: '在条目中增加无意义文字',
		value: 'uw-block'
	}, {
		label: '无故删除条目内容',
		value: 'uw-dblock'
	}, {
		label: '多次加入[[QW:COPYVIO|侵犯著作权]]的内容',
		value: 'uw-block'
	}, {
		label: '机器人发生故障并必须紧急停止',
		value: 'Bot block message',
		forRegisteredOnly: true
	}
		// { label: '剥夺编辑讨论页权限', value: '' }
	]
}, {
	custom: true,
	label: '自定义的封禁理由'
}, {
	label: '用户名封禁',
	list: [ {
		label: '',
		value: 'uw-ublock|误导',
		forRegisteredOnly: true
	}, {
		label: '',
		value: 'uw-ublock|宣传',
		forRegisteredOnly: true
	}, {
		label: '',
		value: 'uw-ublock|攻击|或侮辱性',
		forRegisteredOnly: true
	}, {
		label: '',
		value: 'uw-ublock|混淆',
		forRegisteredOnly: true
	} ]
}, {
	label: '其他模板',
	list: [ {
		label: '',
		value: 'uw-ublock',
		forRegisteredOnly: true
	}, {
		label: '',
		value: 'anonblock',
		forAnonOnly: true
	}, {
		label: '',
		value: 'range block',
		forAnonOnly: true
	}, {
		label: '',
		value: 'school block',
		forAnonOnly: true
	}, {
		label: '',
		value: 'blocked proxy',
		forAnonOnly: true
	}, {
		label: '',
		value: 'checkuserblock',
		forAnonOnly: true
	}, {
		label: '',
		value: 'checkuserblock-account',
		forRegisteredOnly: true
	} ]
} ];
Twinkle.block.blockGroupsPartial = [ {
	label: '部分封禁原因',
	list: [ {
		label: '部分封禁',
		value: 'uw-pblock',
		selected: true
	} ]
} ];
Twinkle.block.callback.filtered_block_groups = function twinkleblockCallbackFilteredBlockGroups(group, show_template) {
	return $.map(group, function (blockGroup) {
		if (!show_template && blockGroup.meta) {
			return;
		}
		var list = $.map(blockGroup.list, function (blockPreset) {
			// only show uw-talkrevoked if reblocking
			if (!Twinkle.block.currentBlockInfo && blockPreset.value === 'uw-talkrevoked') {
				return;
			}
			var blockSettings = Twinkle.block.blockPresetsInfo[blockPreset.value];
			var registrationRestrict = blockPreset.forRegisteredOnly ? Twinkle.block.isRegistered : blockPreset.forAnonOnly ? !Twinkle.block.isRegistered : true;
			if (!(blockSettings.templateName && show_template) && registrationRestrict) {
				var templateName = blockSettings.templateName || blockSettings.template || blockPreset.value;
				return {
					label: (show_template ? '{{' + templateName + '}}: ' : '') + (blockPreset.label || '{{' + templateName + '}}'),
					value: blockPreset.value,
					data: [ {
						name: 'template-name',
						value: templateName
					} ],
					selected: !!blockPreset.selected
				};
			}
		});
		if (list.length) {
			return {
				label: blockGroup.label,
				list: list
			};
		}
	});
};
Twinkle.block.callback.change_preset = function twinkleblockCallbackChangePreset(e) {
	var key = e.target.form.preset.value;
	if (!key) {
		return;
	}
	e.target.form.template.value = Twinkle.block.blockPresetsInfo[key].templateName || key;
	e.target.form.template.value = key;
	Twinkle.block.callback.update_form(e, Twinkle.block.blockPresetsInfo[key]);
	Twinkle.block.callback.change_template(e);
};
Twinkle.block.callback.change_expiry = function twinkleblockCallbackChangeExpiry(e) {
	var expiry = e.target.form.expiry;
	if (e.target.value === 'custom') {
		Morebits.quickForm.setElementVisibility(expiry.parentNode, true);
	} else {
		Morebits.quickForm.setElementVisibility(expiry.parentNode, false);
		expiry.value = e.target.value;
	}
};
Twinkle.block.seeAlsos = [];
Twinkle.block.callback.toggle_see_alsos = function twinkleblockCallbackToggleSeeAlso() {
	var reason = this.form.reason.value.replace(new RegExp('(<!-- )(参见|參見)' + Twinkle.block.seeAlsos.join('、') + '( -->)'), '');
	Twinkle.block.seeAlsos = Twinkle.block.seeAlsos.filter(function (el) {
		return el !== this.value;
	}.bind(this));
	if (this.checked) {
		Twinkle.block.seeAlsos.push(this.value);
	}
	var seeAlsoMessage = Twinkle.block.seeAlsos.join('、');
	if (!Twinkle.block.seeAlsos.length) {
		this.form.reason.value = reason;
	} else {
		this.form.reason.value = reason + '<!-- 参见' + seeAlsoMessage + ' -->';
	}
};
Twinkle.block.callback.update_form = function twinkleblockCallbackUpdateForm(e, data) {
	var form = e.target.form,
		expiry = data.expiry;

	// don't override original expiry if useInitialOptions is set
	if (!data.useInitialOptions) {
		if (Date.parse(expiry)) {
			expiry = new Date(expiry).toGMTString();
			form.expiry_preset.value = 'custom';
		} else {
			form.expiry_preset.value = data.expiry || 'custom';
		}
		form.expiry.value = expiry;
		if (form.expiry_preset.value === 'custom') {
			Morebits.quickForm.setElementVisibility(form.expiry.parentNode, true);
		} else {
			Morebits.quickForm.setElementVisibility(form.expiry.parentNode, false);
		}
	}

	// boolean-flipped options, more at [[mw:API:Block]]
	data.disabletalk = data.disabletalk !== undefined ? data.disabletalk : false;
	data.hardblock = data.hardblock !== undefined ? data.hardblock : false;

	// disable autoblock if blocking a bot
	if (Twinkle.block.userIsBot || relevantUserName.search(/bot\b/i) > 0) {
		data.autoblock = false;
	}
	$(form).find('[name=field_block_options]').find(':checkbox').each(function (i, el) {
		// don't override original options if useInitialOptions is set
		if (data.useInitialOptions && data[el.name] === undefined) {
			return;
		}
		if (el.name === 'closevip') {
			return;
		}
		var check = data[el.name] === '' || !!data[el.name];
		$(el).prop('checked', check);
	});
	if (data.prependReason && data.reason) {
		form.reason.value = data.reason + '; ' + form.reason.value;
	} else {
		form.reason.value = data.reason || '';
	}
};
Twinkle.block.callback.change_template = function twinkleblockcallbackChangeTemplate(e) {
	var form = e.target.form,
		value = form.template.value,
		settings = Twinkle.block.blockPresetsInfo[value];
	var blockBox = $(form).find('[name=actiontype][value=block]').is(':checked');
	var partialBox = $(form).find('[name=actiontype][value=partial]').is(':checked');
	var templateBox = $(form).find('[name=actiontype][value=template]').is(':checked');

	// Block form is not present
	if (!blockBox) {
		if (settings.indefinite || settings.nonstandard) {
			if (Twinkle.block.prev_template_expiry === null) {
				Twinkle.block.prev_template_expiry = form.template_expiry.value || '';
			}
			form.template_expiry.parentNode.style.display = 'none';
			form.template_expiry.value = 'infinity';
		} else if (form.template_expiry.parentNode.style.display === 'none') {
			if (Twinkle.block.prev_template_expiry !== null) {
				form.template_expiry.value = Twinkle.block.prev_template_expiry;
				Twinkle.block.prev_template_expiry = null;
			}
			form.template_expiry.parentNode.style.display = 'block';
		}
		if (Twinkle.block.prev_template_expiry) {
			form.expiry.value = Twinkle.block.prev_template_expiry;
		}
		Morebits.quickForm.setElementVisibility(form.notalk.parentNode, !settings.nonstandard);
		// Partial
		// Morebits.quickForm.setElementVisibility(form.noemail_template.parentNode, partialBox);
		// Morebits.quickForm.setElementVisibility(form.nocreate_template.parentNode, partialBox);
	} else if (templateBox) {
		// Only present if block && template forms both visible
		Morebits.quickForm.setElementVisibility(form.blank_duration.parentNode, !settings.indefinite && !settings.nonstandard);
	}

	// Only particularly relevant if template form is present
	Morebits.quickForm.setElementVisibility(form.article.parentNode, settings && !!settings.pageParam);
	Morebits.quickForm.setElementVisibility(form.block_reason.parentNode, settings && !!settings.reasonParam);
	form.block_reason.value = settings.reason || '';

	// Partial block
	Morebits.quickForm.setElementVisibility(form.area.parentNode, partialBox && !blockBox);
	form.root.previewer.closePreview();
};
Twinkle.block.prev_template_expiry = null;
Twinkle.block.prev_block_reason = null;
Twinkle.block.prev_article = null;
Twinkle.block.prev_reason = null;
Twinkle.block.callback.preview = function twinkleblockcallbackPreview(form) {
	var params = {
		article: form.article.value,
		blank_duration: form.blank_duration ? form.blank_duration.checked : false,
		disabletalk: form.disabletalk.checked || (form.notalk ? form.notalk.checked : false),
		expiry: form.template_expiry ? form.template_expiry.value : form.expiry.value,
		hardblock: Twinkle.block.isRegistered ? form.autoblock.checked : form.hardblock.checked,
		indefinite: Morebits.string.isInfinity(form.template_expiry ? form.template_expiry.value : form.expiry.value),
		reason: form.block_reason.value,
		template: form.template.value.split(':', 1)[0],
		partial: $(form).find('[name=actiontype][value=partial]').is(':checked'),
		pagerestrictions: $(form.pagerestrictions).val() || [],
		namespacerestrictions: $(form.namespacerestrictions).val() || [],
		// noemail: form.noemail.checked || (form.noemail_template ? form.noemail_template.checked : false),
		// nocreate: form.nocreate.checked || (form.nocreate_template ? form.nocreate_template.checked : false),
		area: form.area.value
	};
	var templateText = Twinkle.block.callback.getBlockNoticeWikitext(params);
	form.previewer.beginRender(templateText);
};
Twinkle.block.callback.evaluate = function twinkleblockCallbackEvaluate(e) {
	var params = Morebits.quickForm.getInputData(e.target);
	var $form = $(e.target),
		toBlock = $form.find('[name=actiontype][value=block]').is(':checked'),
		toWarn = $form.find('[name=actiontype][value=template]').is(':checked'),
		toPartial = $form.find('[name=actiontype][value=partial]').is(':checked'),
		toTag = $form.find('[name=actiontype][value=tag]').is(':checked'),
		toProtect = $form.find('[name=actiontype][value=protect]').is(':checked'),
		toUnblock = $form.find('[name=actiontype][value=unblock]').is(':checked'),
		blockoptions = {},
		templateoptions = {},
		unblockoptions = {};
	Twinkle.block.callback.saveFieldset($form.find('[name=field_block_options]'));
	Twinkle.block.callback.saveFieldset($form.find('[name=field_template_options]'));
	Twinkle.block.callback.saveFieldset($form.find('[name=field_tag_options]'));
	Twinkle.block.callback.saveFieldset($form.find('[name=field_unblock_options]'));
	blockoptions = Twinkle.block.field_block_options;
	unblockoptions = Twinkle.block.field_unblock_options;
	var toClosevip = !!blockoptions.closevip;
	templateoptions = Twinkle.block.field_template_options;
	templateoptions.disabletalk = !!(templateoptions.disabletalk || blockoptions.disabletalk);
	templateoptions.hardblock = !!blockoptions.hardblock;

	// remove extraneous
	delete blockoptions.expiry_preset;
	delete blockoptions.closevip;

	// Partial API requires this to be gone, not false or 0
	if (toPartial) {
		blockoptions.partial = templateoptions.partial = true;
	}
	templateoptions.pagerestrictions = $form.find('[name=pagerestrictions]').val() || [];
	templateoptions.namespacerestrictions = $form.find('[name=namespacerestrictions]').val() || [];
	// Format for API here rather than in saveFieldset
	blockoptions.pagerestrictions = templateoptions.pagerestrictions.join('|');
	blockoptions.namespacerestrictions = templateoptions.namespacerestrictions.join('|');

	// use block settings as warn options where not supplied
	templateoptions.summary = templateoptions.summary || blockoptions.reason;
	templateoptions.expiry = templateoptions.template_expiry || blockoptions.expiry;

	// Check tags
	// Given an array of incompatible tags, check if we have two or more selected
	var checkIncompatible = function (conflicts, extra) {
		var count = conflicts.reduce(function (sum, tag) {
			sum += params.tag.indexOf(tag) !== -1;
			return sum;
		}, 0);
		if (count > 1) {
			var message = '请在以下标签中择一使用：{{' + conflicts.join('}}、{{') + '}}。';
			message += extra || '';
			alert(message);
			return true;
		}
	};
	if (toTag) {
		if (params.tag.length === 0) {
			return alert('请至少选择一个用户页标记！');
		}
		if (checkIncompatible([ 'Blocked user', 'Blocked sockpuppet' ], '{{Blocked sockpuppet}}已涵盖{{Blocked user}}的功能。')) {
			return;
		}
		if (checkIncompatible([ 'Blocked user', 'Sockpuppeteer' ], '{{Sockpuppeteer}}已涵盖{{Blocked user}}的功能。')) {
			return;
		}
		if (checkIncompatible([ 'Blocked user', 'Locked global account' ], '请使用{{Locked global account}}的“亦被本地封禁”选项。')) {
			return;
		}
		if (checkIncompatible([ 'Blocked sockpuppet', 'Sockpuppeteer' ], '请从主账户和分身账户中选择一个。')) {
			return;
		}
		if (params.tag.indexOf('Blocked sockpuppet') > -1 && params.sppUsername.trim() === '') {
			return alert('请提供傀儡账户的主账户用户名！');
		}
	}
	if (toBlock) {
		if (blockoptions.partial) {
			if (blockoptions.disabletalk && blockoptions.namespacerestrictions.indexOf('3') === -1) {
				return alert('部分封禁无法阻止编辑自己的讨论页，除非也封禁了User talk命名空间！');
			}
			if (!blockoptions.namespacerestrictions && !blockoptions.pagerestrictions) {
				if (!blockoptions.noemail && !blockoptions.nocreate) {
					// Blank entries technically allowed [[phab:T208645]]
					return alert('没有选择页面或命名空间，也没有停用电子邮件或禁止创建账户；请选择至少一个选项以应用部分封禁！');
				} else if (!confirm('您将要进行封禁，但没有阻止任何页面或命名空间的编辑，确定要继续？')) {
					return;
				}
			}
		}
		if (!blockoptions.expiry) {
			return alert('请提供过期时间！');
		} else if (Morebits.string.isInfinity(blockoptions.expiry) && !Twinkle.block.isRegistered) {
			return alert('禁止无限期封禁IP地址！');
		}
		if (!blockoptions.reason) {
			return alert('请提供封禁理由！');
		}
		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(e.target);
		var statusElement = new Morebits.status('执行封禁');
		blockoptions.action = 'block';
		blockoptions.user = relevantUserName;

		// boolean-flipped options
		blockoptions.anononly = blockoptions.hardblock ? undefined : true;
		blockoptions.allowusertalk = blockoptions.disabletalk ? undefined : true;

		// fix for bug with block API, see [[phab:T68646]]
		if (blockoptions.expiry === 'infinity') {
			blockoptions.expiry = 'infinite';
		}

		/*
        Check if block status changed while processing the form.
       			  There's a lot to consider here. list=blocks provides the
        current block status, but there are at least two issues with
        relying on it. First, the id doesn't update on a reblock,
        meaning the individual parameters need to be compared. This
        can be done roughly with JSON.stringify - we can thankfully
        rely on order from the server, although sorting would be
        fine if not - but falsey values are problematic and is
        non-ideal. More importantly, list=blocks won't indicate if a
        non-blocked user is blocked then unblocked. This should be
        exceedingy rare, but regardless, we thus need to check
        list=logevents, which has a nicely updating logid
        parameter. We can't rely just on that, though, since it
        doesn't account for blocks that have expired on their own.
       			  As such, we use both. Using some ternaries, the logid
        variables are false if there's no logevents, so if they
        aren't equal we defintely have a changed entry (send
        confirmation). If they are equal, then either the user was
        never blocked (the block statuses will be equal, no
        confirmation) or there's no new block, in which case either
        a block expired (different statuses, confirmation) or the
        same block is still active (same status, no confirmation).
       	*/
		var query = {
			format: 'json',
			action: 'query',
			list: 'blocks|logevents',
			letype: 'block',
			lelimit: 1,
			letitle: 'User:' + blockoptions.user
		};
		if (Morebits.ip.isRange(blockoptions.user)) {
			query.bkip = blockoptions.user;
		} else {
			query.bkusers = blockoptions.user;
		}
		api.get(query).then(function (data) {
			var block = data.query.blocks[0];
			var logevents = data.query.logevents[0];
			var logid = data.query.logevents.length ? logevents.logid : false;
			if (logid !== Twinkle.block.blockLogId || !!block !== !!Twinkle.block.currentBlockInfo) {
				var message = mw.config.get('wgRelevantUserName') + '的封禁状态已被修改。';
				if (block) {
					message += '新状态：';
				} else {
					message += '最新日志：';
				}
				var logExpiry = '';
				if (logevents.params.duration) {
					if (logevents.params.duration === 'infinity') {
						logExpiry = '无限期';
					} else {
						var expiryDate = new Morebits.date(logevents.params.expiry);
						logExpiry += '到' + expiryDate.calendar();
					}
				} else {
					// no duration, action=unblock, just show timestamp
					logExpiry = '于' + new Morebits.date(logevents.timestamp).calendar();
				}
				message += '由' + logevents.user + '以“' + logevents.comment + '”' + blockActionText[logevents.action] + logExpiry + '，你想要以你的设置变更封禁吗？';
				if (!confirm(message)) {
					Morebits.status.error('执行封禁', '用户取消操作');
					return;
				}
				blockoptions.reblock = 1; // Writing over a block will fail otherwise
			}

			// execute block
			blockoptions.tags = Twinkle.changeTags;
			blockoptions.token = mw.user.tokens.get('csrfToken');
			var mbApi = new Morebits.wiki.api('执行封禁', blockoptions, function () {
				statusElement.info('完成');
				if (toWarn) {
					Twinkle.block.callback.issue_template(templateoptions);
				}
				if (toClosevip) {
					var vipPage = new Morebits.wiki.page('Qiuwen:当前的破坏', '关闭请求');
					vipPage.setFollowRedirect(true);
					vipPage.setCallbackParameters(blockoptions);
					vipPage.load(Twinkle.block.callback.closeRequest);
				}
			});
			mbApi.post();
		});
	} else if (toWarn) {
		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(e.target);
		Twinkle.block.callback.issue_template(templateoptions);
	}
	if (toTag || toProtect) {
		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(e.target);
		var userPage = 'User:' + relevantUserName;
		var qiuwen_page = new Morebits.wiki.page(userPage, '标记或保护用户页');
		qiuwen_page.setCallbackParameters(params);
		qiuwen_page.load(Twinkle.block.callback.taguserpage);
	}
	if (toUnblock) {
		if (!unblockoptions.reason) {
			return alert('请提供解除封禁理由！');
		}
		Morebits.simpleWindow.setButtonsEnabled(false);
		Morebits.status.init(e.target);
		var unblockStatusElement = new Morebits.status('执行解除封禁');
		unblockoptions.action = 'unblock';
		unblockoptions.user = relevantUserName;
		// execute unblock
		unblockoptions.tags = Twinkle.changeTags;
		unblockoptions.token = mw.user.tokens.get('csrfToken');
		var unblockMbApi = new Morebits.wiki.api('执行解除封禁', unblockoptions, function () {
			unblockStatusElement.info('完成');
		});
		unblockMbApi.post();
	}
	if (!toBlock && !toWarn && !toTag && !toProtect && !toUnblock) {
		return alert('Twinkle没有要执行的任务！');
	}
};
Twinkle.block.callback.taguserpage = function twinkleblockCallbackTagUserpage(pageobj) {
	var params = pageobj.getCallbackParameters();
	var statelem = pageobj.getStatusElement();
	if (params.actiontype.indexOf('tag') > -1) {
		var tags = [];
		params.tag.forEach(function (tag) {
			var tagtext = '{{' + tag;
			switch (tag) {
				case 'Blocked user':
					break;
				case 'Blocked sockpuppet':
					tagtext += '|1=' + params.sppUsername.trim();
					if (params.sppEvidence.trim()) {
						tagtext += '|evidence=' + params.sppEvidence.trim();
					}
					break;
				case 'Sockpuppeteer':
					tagtext += '|blocked';
					if (params.spmChecked) {
						tagtext += '|check=yes';
					}
					if (params.spmEvidence.trim()) {
						tagtext += '|evidence=' + params.spmEvidence.trim();
					}
					break;
				case 'Locked global account':
					if (params.lockBlocked) {
						tagtext += '|blocked=yes';
					}
					break;
				default:
					return alert('未知的用户页模板！');
			}
			tagtext += '}}';
			tags.push(tagtext);
		});
		var text = tags.join('\n');
		if (params.category) {
			text += '\n[[Category:' + params.category.trim() + '的用户分身]]';
		}
		pageobj.setPageText(text);
		pageobj.setEditSummary('标记被永久封禁的用户页');
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.save(function () {
			Morebits.status.info('标记用户页', '完成');
			statelem.status('正在保护页面');
			pageobj.load(Twinkle.block.callback.protectuserpage);
		});
	} else {
		Twinkle.block.callback.protectuserpage(pageobj);
	}
};
Twinkle.block.callback.protectuserpage = function twinkleblockCallbackProtectUserpage(pageobj) {
	var params = pageobj.getCallbackParameters();
	var statelem = pageobj.getStatusElement();
	if (params.actiontype.indexOf('protect') > -1) {
		if (pageobj.exists()) {
			pageobj.setEditProtection('sysop', 'indefinite');
			pageobj.setMoveProtection('sysop', 'indefinite');
		} else {
			pageobj.setCreateProtection('sysop', 'indefinite');
		}
		pageobj.setEditSummary('被永久封禁的用户页');
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.protect(function () {
			Morebits.status.info('保护用户页', pageobj.exists() ? '已全保护' : '已白纸保护');
			statelem.info('全部完成');
		});
	} else {
		statelem.info('全部完成');
	}
};
Twinkle.block.callback.issue_template = function twinkleblockCallbackIssueTemplate(formData) {
	if (Morebits.ip.isRange(relevantUserName)) {
		// eslint-disable-next-line no-new
		new Morebits.status('信息', '由于封禁目标为IP段，加入封禁模板已略过', 'warn');
		return;
	}
	var userTalkPage = 'User_talk:' + relevantUserName;
	var params = $.extend(formData, {
		messageData: Twinkle.block.blockPresetsInfo[formData.template],
		reason: Twinkle.block.field_template_options.block_reason,
		disabletalk: Twinkle.block.field_template_options.notalk
		// noemail: Twinkle.block.field_template_options.noemail_template,
		// nocreate: Twinkle.block.field_template_options.nocreate_template
	});

	params.template = params.template.split(':', 1)[0];
	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = '完成，将在几秒后加载用户讨论页';
	var qiuwen_page = new Morebits.wiki.page(userTalkPage, '用户讨论页修改');
	qiuwen_page.setCallbackParameters(params);
	qiuwen_page.setFollowRedirect(true);
	qiuwen_page.load(Twinkle.block.callback.main);
};
Twinkle.block.callback.closeRequest = function twinkleblockCallbackCloseRequest(vipPage) {
	var params = vipPage.getCallbackParameters();
	var text = vipPage.getPageText();
	var statusElement = vipPage.getStatusElement();
	var userName = relevantUserName;
	var expiryText = Morebits.string.formatTime(params.expiry);
	var comment = '{{Blocked|' + (Morebits.string.isInfinity(params.expiry) ? 'indef' : expiryText) + '}}。';
	var requestList = text.split(/(?=\n===.+===\s*\n)/);
	var found = false;
	var hidename = false;
	var vipRe = new RegExp('===\\s*{{\\s*[Vv]andal\\s*\\|\\s*(1\\s*=\\s*)?' + Morebits.pageNameRegex(userName) + '\\s*(\\|\\s*hidename\\s*=[^|]+)?}}\\s*===', 'm');
	for (var i = 1; i < requestList.length; i++) {
		if (vipRe.exec(requestList[i])) {
			hidename = /\|\s*hidename\s*=[^|]+/.test(requestList[i]);
			requestList[i] = requestList[i].trimRight();
			var newText = requestList[i].replace(/^(\*\s*处理：)[ \t]*(<!-- 非管理員僅可標記已執行的封禁，針對提報的意見請放在下一行 -->)?[ \t]*$/m, '$1' + comment + '--~~~~');
			if (requestList[i] === newText) {
				newText = requestList[i] + '\n* 处理：' + comment + '--~~~~';
			}
			requestList[i] = newText + '\n';
			found = true;
			break;
		}
	}
	if (!found) {
		statusElement.warn('没有找到相关的请求');
		return;
	}
	text = requestList.join('');
	var summary;
	if (hidename) {
		summary = '标记为已处理';
	} else {
		summary = '/* ' + userName + ' */ ';
		if (Morebits.string.isInfinity(params.expiry)) {
			summary += '不限期封禁';
		} else {
			summary += '封禁' + expiryText;
		}
	}
	vipPage.setEditSummary(summary);
	vipPage.setChangeTags(Twinkle.changeTags);
	vipPage.setPageText(text);
	vipPage.save();
};
Twinkle.block.callback.getBlockNoticeWikitext = function (params, nosign) {
	var text = '{{',
		settings = Twinkle.block.blockPresetsInfo[params.template];
	if (!settings.nonstandard) {
		text += 'subst:' + params.template;
		if (params.article && settings.pageParam) {
			text += '|page=' + params.article;
		}
		if (!/te?mp|^\s*$|min/.exec(params.expiry)) {
			if (params.indefinite) {
				text += '|indef=yes';
			} else if (!params.blank_duration) {
				text += '|time=' + Morebits.string.formatTime(params.expiry);
			}
		}
		if (!Twinkle.block.isRegistered && !params.hardblock) {
			text += '|anon=yes';
		}
		if (params.reason) {
			text += '|reason=' + params.reason;
		}
		if (params.disabletalk) {
			text += '|notalk=yes';
		}
		text += '|subst=subst:';

		// Currently, all partial block templates are "standard"
		// Building the template, however, takes a fair bit of logic
		if (params.partial) {
			if (params.pagerestrictions.length || params.namespacerestrictions.length) {
				var makeSentence = function (array) {
					if (array.length < 3) {
						return array.join('和');
					}
					var last = array.pop();
					return array.join('、') + '和' + last;
				};
				text += '|area=某些';
				if (params.pagerestrictions.length) {
					text += '頁面（' + makeSentence(params.pagerestrictions.map(function (p) {
						return '[[:' + p + ']]';
					}));
					text += params.namespacerestrictions.length ? '）和某些' : '）';
				}
				if (params.namespacerestrictions.length) {
					// 1 => Talk, 2 => User, etc.
					var namespaceNames = params.namespacerestrictions.map(function (id) {
						return menuFormattedNamespaces[id];
					});
					text += '[[Qiuwen:命名空间|命名空间]]（' + makeSentence(namespaceNames) + '）';
				}
			} else if (params.area) {
				text += '|area=' + params.area;
			} else {
				if (params.noemail) {
					text += '|email=yes';
				}
				if (params.nocreate) {
					text += '|accountcreate=yes';
				}
			}
		}
	} else {
		text += params.template;
	}
	if ((settings.sig === '~~~~' || settings.sig === undefined) && !nosign) {
		text += '}}--~~~~';
	} else if (settings.sig && !nosign) {
		text += '|sig=' + settings.sig;
		text += '}}';
	} else {
		text += '}}';
	}
	return text;
};
Twinkle.block.callback.main = function twinkleblockcallbackMain(pageobj) {
	var params = pageobj.getCallbackParameters(),
		date = new Morebits.date(pageobj.getLoadTime()),
		messageData = params.messageData,
		text;
	params.indefinite = Morebits.string.isInfinity(params.expiry);
	if (Twinkle.getPref('blankTalkpageOnIndefBlock') && params.template !== 'uw-lblock' && params.indefinite) {
		Morebits.status.info('信息', '根据参数设置清空讨论页并为日期创建新二级标题');
		text = date.monthHeader() + '\n';
	} else {
		text = pageobj.getPageText();
		var dateHeaderRegex = date.monthHeaderRegex(),
			dateHeaderRegexLast,
			dateHeaderRegexResult;
		while ((dateHeaderRegexLast = dateHeaderRegex.exec(text)) !== null) {
			dateHeaderRegexResult = dateHeaderRegexLast;
		}
		// If dateHeaderRegexResult is null then lastHeaderIndex is never checked. If it is not null but
		// \n== is not found, then the date header must be at the very start of the page. lastIndexOf
		// returns -1 in this case, so lastHeaderIndex gets set to 0 as desired.
		var lastHeaderIndex = text.lastIndexOf('\n==') + 1;
		if (text.length > 0) {
			text += '\n\n';
		}
		if (!dateHeaderRegexResult || dateHeaderRegexResult.index !== lastHeaderIndex) {
			Morebits.status.info('信息', '未找到当月的二级标题，将创建新的');
			text += date.monthHeader() + '\n';
		}
	}
	params.expiry = typeof params.template_expiry !== 'undefined' ? params.template_expiry : params.expiry;
	text += Twinkle.block.callback.getBlockNoticeWikitext(params);

	// build the edit summary
	var summary = '封禁通知：';
	summary += messageData.summary || messageData.reason || params.reason;
	if (messageData.suppressArticleInSummary !== true && params.article) {
		summary += '，于[[' + params.article + ']]';
	}
	pageobj.setPageText(text);
	pageobj.setEditSummary(summary);
	pageobj.setChangeTags(Twinkle.changeTags);
	pageobj.setWatchlist(Twinkle.getPref('watchWarnings'));
	pageobj.save();
};
Twinkle.block.callback.main_flow = function twinkleblockcallbackMain(flowobj) {
	var params = flowobj.getCallbackParameters();
	params.indefinite = /indef|infinity|never|\*|max/.test(params.expiry);
	params.expiry = typeof params.template_expiry !== 'undefined' ? params.template_expiry : params.expiry;
	var title = '封禁通知';
	var content = Twinkle.block.callback.getBlockNoticeWikitext(params, true);
	flowobj.setTopic(title);
	flowobj.setContent(content);
	flowobj.newTopic();
};
Twinkle.addInitCallback(Twinkle.block, 'block');
}(jQuery));

// </nowiki>
