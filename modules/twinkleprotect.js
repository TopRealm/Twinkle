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
/* Twinkle.js - twinkleprotect.js */
// <nowiki>
(function ($) {

/*
	 ****************************************
	 *** twinkleprotect.js: Protect/RPP module
	 ****************************************
	 * Mode of invocation:     Tab ("PP"/"RPP")
	 * Active on:              Non-special, non-MediaWiki pages
	 */

// Note: a lot of code in this module is re-used/called by batchprotect.

Twinkle.protect = function twinkleprotect() {
	if (mw.config.get('wgNamespaceNumber') < 0 || mw.config.get('wgNamespaceNumber') === 8) {
		return;
	}

	Twinkle.addPortletLink(Twinkle.protect.callback, '保护', 'tw-rpp',
		Morebits.userIsSysop ? '保护页面' : '请求保护页面');
};

Twinkle.protect.callback = function twinkleprotectCallback() {
	var Window = new Morebits.simpleWindow(620, 530);
	Window.setTitle(Morebits.userIsSysop ? '实施页面保护或请求保护页面' : '请求保护页面');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('保护模板', 'Template:Protection templates');
	Window.addFooterLink('保护方针', 'QW:PROT');
	Window.addFooterLink('保护设置', 'H:TW/PREF#保护');
	Window.addFooterLink('Twinkle帮助', 'H:TW/DOC#保护');
	Window.addFooterLink('问题反馈', 'HT:TW');

	var form = new Morebits.quickForm(Twinkle.protect.callback.evaluate);
	var actionfield = form.append({
		type: 'field',
		label: '操作类型'
	});
	if (Morebits.userIsSysop) {
		actionfield.append({
			type: 'radio',
			name: 'actiontype',
			event: Twinkle.protect.callback.changeAction,
			list: [
				{
					label: '保护页面',
					value: 'protect',
					tooltip: '实施页面保护',
					checked: true
				}
			]
		});
	}
	actionfield.append({
		type: 'radio',
		name: 'actiontype',
		event: Twinkle.protect.callback.changeAction,
		list: [
			{
				label: '请求保护页面',
				value: 'request',
				tooltip: '如果您想在管理员通告版请求保护此页' + (Morebits.userIsSysop ? '而不是自行完成。' : '。'),
				checked: !Morebits.userIsSysop
			},
			{
				label: '用保护模板标记此页',
				value: 'tag',
				tooltip: '可以用此为页面加上合适的保护模板。',
				disabled: mw.config.get('wgArticleId') === 0 || mw.config.get('wgPageContentModel') === 'Scribunto'
			}
		]
	});

	form.append({ type: 'field', label: '默认', name: 'field_preset' });
	form.append({ type: 'field', label: '1', name: 'field1' });
	form.append({ type: 'field', label: '2', name: 'field2' });

	form.append({ type: 'submit' });

	var result = form.render();
	Window.setContent(result);
	Window.display();

	// We must init the controls
	var evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.actiontype[0].dispatchEvent(evt);

	// get current protection level asynchronously
	Twinkle.protect.fetchProtectionLevel();
};

// A list of bots who may be the protecting sysop, for whom we shouldn't
// remind the user contact before requesting unprotection (evaluate)
Twinkle.protect.trustedBots = [ ];

// Customizable namespace and FlaggedRevs settings
// In theory it'd be nice to have restrictionlevels defined here,
// but those are only available via a siteinfo query

// Limit template editor; a Twinkle restriction, not a site setting
var isTemplate = mw.config.get('wgNamespaceNumber') === 10 || mw.config.get('wgNamespaceNumber') === 828;

// Contains the current protection level in an object
// Once filled, it will look something like:
// { edit: { level: "sysop", expiry: <some date>, cascade: true }, ... }
Twinkle.protect.currentProtectionLevels = {};

// returns a jQuery Deferred object, usage:
//   Twinkle.protect.fetchProtectingAdmin(apiObject, pageName, protect).done(function(admin_username) { ...code... });
Twinkle.protect.fetchProtectingAdmin = function twinkleprotectFetchProtectingAdmin(api, pageName, protType, logIds) {
	logIds = logIds || [];

	return api.get({
		format: 'json',
		action: 'query',
		list: 'logevents',
		letitle: pageName,
		letype: protType
	}).then(function (data) {
		// don't check log entries that have already been checked (e.g. don't go into an infinite loop!)
		var event = data.query ? $.grep(data.query.logevents, function (le) {
			return $.inArray(le.logid, logIds);
		})[0] : null;
		if (!event) {
			// fail gracefully
			return null;
		} else if (event.action === 'move_prot') {
			return twinkleprotectFetchProtectingAdmin(api, protType === 'protect' ? event.params.oldtitle_title : event.params.oldtitle, protType, logIds.concat(event.logid));
		}
		return event.user;
	});
};

Twinkle.protect.fetchProtectionLevel = function twinkleprotectFetchProtectionLevel() {

	var api = new mw.Api();
	var protectDeferred = api.get({
		format: 'json',
		indexpageids: true,
		action: 'query',
		list: 'logevents',
		letype: 'protect',
		letitle: mw.config.get('wgPageName'),
		prop: 'info',
		inprop: 'protection|watched',
		titles: mw.config.get('wgPageName')
	});

	var earlyDecision = [ protectDeferred ];

	$.when.apply($, earlyDecision).done(function (protectData) {
		// $.when.apply is supposed to take an unknown number of promises
		// via an array, which it does, but the type of data returned varies.
		// If there are two or more deferreds, it returns an array (of objects),
		// but if there's just one deferred, it retuns a simple object.
		// This is annoying.
		protectData = $(protectData).toArray();

		var pageid = protectData[0].query.pageids[0];
		var page = protectData[0].query.pages[pageid];
		var current = {}, adminEditDeferred;

		// Save requested page's watched status for later in case needed when filing request
		Twinkle.protect.watched = page.watchlistexpiry || page.watched === '';

		$.each(page.protection, function (index, protection) {
			// Don't overwrite actual page protection with cascading protection
			if (!protection.source) {
				current[protection.type] = {
					level: protection.level,
					expiry: protection.expiry,
					cascade: protection.cascade === ''
				};
				// logs report last admin who made changes to either edit/move/create protection, regardless if they only modified one of them
				if (!adminEditDeferred) {
					adminEditDeferred = Twinkle.protect.fetchProtectingAdmin(api, mw.config.get('wgPageName'), 'protect');
				}
			} else {
				// Account for the page being covered by cascading protection
				current.cascading = {
					expiry: protection.expiry,
					source: protection.source,
					level: protection.level // should always be sysop, unused
				};
			}
		});

		// show the protection level and log info
		Twinkle.protect.hasProtectLog = !!protectData[0].query.logevents.length;
		Twinkle.protect.protectLog = Twinkle.protect.hasProtectLog && protectData[0].query.logevents;
		Twinkle.protect.hasStableLog = false;
		Twinkle.protect.currentProtectionLevels = current;

		if (adminEditDeferred) {
			adminEditDeferred.done(function (admin) {
				if (admin) {
					$.each([ 'edit', 'move', 'create', 'cascading' ], function (i, type) {
						if (Twinkle.protect.currentProtectionLevels[type]) {
							Twinkle.protect.currentProtectionLevels[type].admin = admin;
						}
					});
				}
				Twinkle.protect.callback.showLogAndCurrentProtectInfo();
			});
		} else {
			Twinkle.protect.callback.showLogAndCurrentProtectInfo();
		}
	});
};

Twinkle.protect.callback.showLogAndCurrentProtectInfo = function twinkleprotectCallbackShowLogAndCurrentProtectInfo() {
	var currentlyProtected = !$.isEmptyObject(Twinkle.protect.currentProtectionLevels);

	if (Twinkle.protect.hasProtectLog || Twinkle.protect.hasStableLog) {
		var $linkMarkup = $('<span>');

		if (Twinkle.protect.hasProtectLog) {
			$linkMarkup.append(
				$('<a target="_blank" href="' + mw.util.getUrl('Special:Log', { action: 'view', page: mw.config.get('wgPageName'), type: 'protect' }) + '">保护日志</a>'));
			if (!currentlyProtected || (!Twinkle.protect.currentProtectionLevels.edit && !Twinkle.protect.currentProtectionLevels.move)) {
				var lastProtectAction = Twinkle.protect.protectLog[0];
				if (lastProtectAction.action === 'unprotect') {
					$linkMarkup.append(' (unprotected ' + new Morebits.date(lastProtectAction.timestamp).calendar('utc') + ')');
				} else { // protect or modify
					$linkMarkup.append(' (expired ' + new Morebits.date(lastProtectAction.params.details[0].expiry).calendar('utc') + ')');
				}
			}
		}

		Morebits.status.init($('div[name="hasprotectlog"] span')[0]);
		Morebits.status.warn(
			currentlyProtected ? '先前保护' : '此页面过去曾被保护',
			$linkMarkup[0]
		);
	}

	Morebits.status.init($('div[name="currentprot"] span')[0]);
	var protectionNode = [], statusLevel = 'info';

	if (currentlyProtected) {
		$.each(Twinkle.protect.currentProtectionLevels, function (type, settings) {
			var label = Morebits.string.toUpperCaseFirstChar(type);

			if (type === 'cascading') { // Covered by another page
				label = '连锁保护';
				protectionNode.push($('<b>' + label + '</b>')[0]);
				if (settings.source) { // Should by definition exist
					var sourceLink = '<a target="_blank" href="' + mw.util.getUrl(settings.source) + '">' + settings.source + '</a>';
					protectionNode.push($('<span>，来自' + sourceLink + '</span>')[0]);
				}
			} else {
				var level = settings.level;
				// Make cascading protection more prominent
				if (settings.cascade) {
					level += ' (连锁保护)';
				}
				protectionNode.push($('<b>' + label + ': ' + level + '</b>')[0]);
			}

			if (settings.expiry === 'infinity') {
				protectionNode.push('（无限期）');
			} else {
				protectionNode.push(' (终止时间' + new Morebits.date(settings.expiry).calendar('utc') + ') ');
			}
			if (settings.admin) {
				var adminLink = '<a target="_blank" href="' + mw.util.getUrl('User talk:' + settings.admin) + '">' + settings.admin + '</a>';
				protectionNode.push($('<span>由' + adminLink + '做出</span>')[0]);
			}
			protectionNode.push($('<span> \u2022 </span>')[0]);
		});
		protectionNode = protectionNode.slice(0, -1); // remove the trailing bullet
		statusLevel = 'warn';
	} else {
		protectionNode.push($('<b>无保护</b>')[0]);
	}

	Morebits.status[statusLevel]('当前保护级别', protectionNode);
};

Twinkle.protect.callback.changeAction = function twinkleprotectCallbackChangeAction(e) {
	var field_preset;
	var field1;
	var field2;

	switch (e.target.values) {
		case 'protect':
			field_preset = new Morebits.quickForm.element({ type: 'field', label: '预设', name: 'field_preset' });
			field_preset.append({
				type: 'select',
				name: 'category',
				label: '选择预设：',
				event: Twinkle.protect.callback.changePreset,
				list: mw.config.get('wgArticleId') ? Twinkle.protect.protectionTypes : Twinkle.protect.protectionTypesCreate
			});

			field2 = new Morebits.quickForm.element({ type: 'field', label: '保护选项', name: 'field2' });
			field2.append({ type: 'div', name: 'currentprot', label: ' ' });  // holds the current protection level, as filled out by the async callback
			field2.append({ type: 'div', name: 'hasprotectlog', label: ' ' });
			// for existing pages
			if (mw.config.get('wgArticleId')) {
				field2.append({
					type: 'checkbox',
					event: Twinkle.protect.formevents.editmodify,
					list: [
						{
							label: '修改编辑权限',
							name: 'editmodify',
							tooltip: '如果此项关闭，编辑权限和终止时间将不会修改。',
							checked: true
						}
					]
				});
				field2.append({
					type: 'select',
					name: 'editlevel',
					label: '编辑权限：',
					event: Twinkle.protect.formevents.editlevel,
					list: Twinkle.protect.protectionLevels.filter(function (level) {
						// Filter TE outside of templates and modules
						return isTemplate || level.value !== 'templateeditor';
					})
				});
				field2.append({
					type: 'select',
					name: 'editexpiry',
					label: '终止时间：',
					event: function (e) {
						if (e.target.value === 'custom') {
							Twinkle.protect.doCustomExpiry(e.target);
						}
					},
					// default expiry selection (2 days) is conditionally set in Twinkle.protect.callback.changePreset
					list: Twinkle.protect.protectionLengths
				});
				field2.append({
					type: 'checkbox',
					event: Twinkle.protect.formevents.movemodify,
					list: [
						{
							label: '修改移动权限',
							name: 'movemodify',
							tooltip: '如果此项关闭，移动权限和终止时间将不会修改。',
							checked: true
						}
					]
				});
				field2.append({
					type: 'select',
					name: 'movelevel',
					label: '移动权限：',
					event: Twinkle.protect.formevents.movelevel,
					list: Twinkle.protect.protectionLevels.filter(function (level) {
						// Autoconfirmed is required for a move, redundant
						return level.value !== 'autoconfirmed' && (isTemplate || level.value !== 'templateeditor');
					})
				});
				field2.append({
					type: 'select',
					name: 'moveexpiry',
					label: '终止时间：',
					event: function (e) {
						if (e.target.value === 'custom') {
							Twinkle.protect.doCustomExpiry(e.target);
						}
					},
					// default expiry selection (2 days) is conditionally set in Twinkle.protect.callback.changePreset
					list: Twinkle.protect.protectionLengths
				});
			} else {  // for non-existing pages
				field2.append({
					type: 'select',
					name: 'createlevel',
					label: '创建权限',
					event: Twinkle.protect.formevents.createlevel,
					list: Twinkle.protect.protectionLevels.filter(function (level) {
						// Filter TE always, and autoconfirmed in mainspace, redundant since QW:ACPERM
						return level.value !== 'templateeditor' && (mw.config.get('wgNamespaceNumber') !== 0 || level.value !== 'autoconfirmed');
					})
				});
				field2.append({
					type: 'select',
					name: 'createexpiry',
					label: '终止时间：',
					event: function (e) {
						if (e.target.value === 'custom') {
							Twinkle.protect.doCustomExpiry(e.target);
						}
					},
					// default expiry selection (indefinite) is conditionally set in Twinkle.protect.callback.changePreset
					list: Twinkle.protect.protectionLengths
				});
			}
			field2.append({
				type: 'textarea',
				name: 'protectReason',
				label: '理由（保护日志）：'
			});
			field2.append({
				type: 'div',
				name: 'protectReason_notes',
				label: '备注',
				style: 'display:inline-block; margin-top:4px;',
				tooltip: '在保护日志中记载此次操作请求来源于RFPP'
			});
			field2.append({
				type: 'checkbox',
				event: Twinkle.protect.callback.annotateProtectReason,
				style: 'display:inline-block; margin-top:4px;',
				list: [
					{
						label: 'RFPP请求',
						name: 'protectReason_notes_rfpp',
						checked: false,
						value: 'requested at [[QW:RfPP]]'
					}
				]
			});
			field2.append({
				type: 'input',
				event: Twinkle.protect.callback.annotateProtectReason,
				label: 'RFRR版本号',
				name: 'protectReason_notes_rfppRevid',
				value: '',
				tooltip: 'RFPP的版本号，可选'
			});
			if (!mw.config.get('wgArticleId') || mw.config.get('wgPageContentModel') === 'Scribunto') {  // tagging isn't relevant for non-existing or module pages
				break;
			}
			/* falls through */
		case 'tag':
			field1 = new Morebits.quickForm.element({ type: 'field', label: '保护模板选项', name: 'field1' });
			field1.append({ type: 'div', name: 'currentprot', label: ' ' });  // holds the current protection level, as filled out by the async callback
			field1.append({ type: 'div', name: 'hasprotectlog', label: ' ' });
			field1.append({
				type: 'select',
				name: 'tagtype',
				label: '选择保护模板：',
				list: Twinkle.protect.protectionTags,
				event: Twinkle.protect.formevents.tagtype
			});
			field1.append({
				type: 'checkbox',
				list: [
					{
						name: 'small',
						label: '使用图标（small=yes）',
						tooltip: '将给模板加上|small=yes参数，显示成右上角的一把挂锁。',
						checked: true
					},
					{
						name: 'noinclude',
						label: '用&lt;noinclude&gt;包裹保护模板',
						tooltip: '将保护模板包裹在&lt;noinclude&gt;中',
						checked: mw.config.get('wgNamespaceNumber') === 10 || (mw.config.get('wgNamespaceNumber') === mw.config.get('wgNamespaceIds').project && mw.config.get('wgTitle').indexOf('Articles for deletion/') === 0)
					}
				]
			});
			break;

		case 'request':
			field_preset = new Morebits.quickForm.element({ type: 'field', label: '请求保护类型', name: 'field_preset' });
			field_preset.append({
				type: 'select',
				name: 'category',
				label: '类型和理由：',
				event: Twinkle.protect.callback.changePreset,
				list: mw.config.get('wgArticleId') ? Twinkle.protect.protectionTypes : Twinkle.protect.protectionTypesCreate
			});

			field1 = new Morebits.quickForm.element({ type: 'field', label: '请求保护选项', name: 'field1' });
			field1.append({ type: 'div', name: 'currentprot', label: ' ' });  // holds the current protection level, as filled out by the async callback
			field1.append({ type: 'div', name: 'hasprotectlog', label: ' ' });
			field1.append({
				type: 'select',
				name: 'expiry',
				label: '时长：',
				list: [
					{ label: '', selected: true, value: '' },
					{ label: '临时', value: 'temporary' },
					{ label: '永久', value: 'infinity' }
				]
			});
			field1.append({
				type: 'textarea',
				name: 'reason',
				label: '理由：'
			});
			break;
		default:
			alert('？');
			break;
	}

	var oldfield;

	if (field_preset) {
		oldfield = $(e.target.form).find('fieldset[name="field_preset"]')[0];
		oldfield.parentNode.replaceChild(field_preset.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field_preset"]').css('display', 'none');
	}
	if (field1) {
		oldfield = $(e.target.form).find('fieldset[name="field1"]')[0];
		oldfield.parentNode.replaceChild(field1.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field1"]').css('display', 'none');
	}
	if (field2) {
		oldfield = $(e.target.form).find('fieldset[name="field2"]')[0];
		oldfield.parentNode.replaceChild(field2.render(), oldfield);
	} else {
		$(e.target.form).find('fieldset[name="field2"]').css('display', 'none');
	}

	if (e.target.values === 'protect') {
		// fake a change event on the preset dropdown
		var evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		e.target.form.category.dispatchEvent(evt);

		// reduce vertical height of dialog
		$(e.target.form).find('fieldset[name="field2"] select').parent().css({ display: 'inline-block', marginRight: '0.5em' });
		$(e.target.form).find('fieldset[name="field2"] input[name="protectReason_notes_rfppRevid"]').parent().css({ display: 'inline-block', marginLeft: '15px' }).hide();
	}

	// re-add protection level and log info, if it's available
	Twinkle.protect.callback.showLogAndCurrentProtectInfo();
};

// NOTE: This function is used by batchprotect as well
Twinkle.protect.formevents = {
	editmodify: function twinkleprotectFormEditmodifyEvent(e) {
		e.target.form.editlevel.disabled = !e.target.checked;
		e.target.form.editexpiry.disabled = !e.target.checked || (e.target.form.editlevel.value === 'all');
		e.target.form.editlevel.style.color = e.target.form.editexpiry.style.color = e.target.checked ? '' : 'transparent';
	},
	editlevel: function twinkleprotectFormEditlevelEvent(e) {
		e.target.form.editexpiry.disabled = e.target.value === 'all';
	},
	movemodify: function twinkleprotectFormMovemodifyEvent(e) {
		// sync move settings with edit settings if applicable
		if (e.target.form.movelevel.disabled && !e.target.form.editlevel.disabled) {
			e.target.form.movelevel.value = e.target.form.editlevel.value;
			e.target.form.moveexpiry.value = e.target.form.editexpiry.value;
		} else if (e.target.form.editlevel.disabled) {
			e.target.form.movelevel.value = 'sysop';
			e.target.form.moveexpiry.value = 'infinity';
		}
		e.target.form.movelevel.disabled = !e.target.checked;
		e.target.form.moveexpiry.disabled = !e.target.checked || (e.target.form.movelevel.value === 'all');
		e.target.form.movelevel.style.color = e.target.form.moveexpiry.style.color = e.target.checked ? '' : 'transparent';
	},
	movelevel: function twinkleprotectFormMovelevelEvent(e) {
		e.target.form.moveexpiry.disabled = e.target.value === 'all';
	},
	createlevel: function twinkleprotectFormCreatelevelEvent(e) {
		e.target.form.createexpiry.disabled = e.target.value === 'all';
	},
	tagtype: function twinkleprotectFormTagtypeEvent(e) {
		e.target.form.small.disabled = e.target.form.noinclude.disabled = (e.target.value === 'none') || (e.target.value === 'noop');
	}
};

Twinkle.protect.doCustomExpiry = function twinkleprotectDoCustomExpiry(target) {
	var custom = prompt('输入自定义终止时间。\n您可以使用相对时间，如“1 minute”或“19 days”，或绝对时间“yyyymmddhhmm”（如“200602011405”是2006年02月01日14：05（UTC））', '');
	if (custom) {
		var option = document.createElement('option');
		option.setAttribute('value', custom);
		option.textContent = custom;
		target.appendChild(option);
		target.value = custom;
	} else {
		target.selectedIndex = 0;
	}
};

// NOTE: This list is used by batchprotect as well
Twinkle.protect.protectionLevels = [
	{ label: '全部', value: 'all' },
	{ label: '仅允许自动确认用户', value: 'autoconfirmed' },
	{ label: '仅模板编辑员和管理员', value: 'templateeditor' },
	{ label: '仅允许管理员', value: 'sysop', selected: true },
	{ label: '仅允许资深用户', value: 'revisionprotected' },
	{ label: '仅允许裁决委员', value: 'officialprotected' }
];

// default expiry selection is conditionally set in Twinkle.protect.callback.changePreset
// NOTE: This list is used by batchprotect as well
Twinkle.protect.protectionLengths = [
	{ label: '1天', value: '1 day' },
	{ label: '3天', value: '3 days' },
	{ label: '1周', value: '1 week' },
	{ label: '2周', value: '2 weeks' },
	{ label: '1个月', value: '1 month' },
	{ label: '3个月', value: '3 months' },
	{ label: '6个月', value: '6 months' },
	{ label: '1年', value: '1 year' },
	{ label: '无限期', value: 'infinity' },
	{ label: '自定义…', value: 'custom' }

];

Twinkle.protect.protectionTypes = [
	{ label: '解除保护', value: 'unprotect' },
	{
		label: '全保护',
		list: [
			{ label: '常规（全）', value: 'pp-protected' },
			{ label: '争议、编辑战（全）', value: 'pp-dispute' },
			{ label: '持续破坏（全）', value: 'pp-vandalism' },
			{ label: '已封禁用户的用户页（全）', value: 'pp-usertalk' }
		]
	},
	{
		label: '模板与模块保护',
		list: [
			{ label: '高风险模板（模板）', value: 'pp-template' },
			{ label: '高风险模块（模块）', value: 'pp-module' }
		]
	},
	{
		label: '半保护',
		list: [
			{ label: '常规（半）', value: 'pp-semi-protected' },
			{ label: '持续破坏（半）', selected: true, value: 'pp-semi-vandalism' },
			{ label: '破坏性编辑（半）', value: 'pp-semi-disruptive' },
			{ label: '加入无来源资讯（半）', value: 'pp-semi-unsourced' },
			{ label: '违反生者传记方针（半）', value: 'pp-semi-blp' },
			{ label: '傀儡破坏（半）', value: 'pp-semi-sock' },
			{ label: '已封禁用户的用户页 (半)', value: 'pp-semi-usertalk' }
		]
	},
	{
		label: '移动保护',
		list: [
			{ label: '常规（移动）', value: 'pp-move' },
			{ label: '争议、移动战（移动）', value: 'pp-move-dispute' },
			{ label: '移动破坏（移动）', value: 'pp-move-vandalism' },
			{ label: '高风险页面（移动）', value: 'pp-move-indef' }
		]
	}
].filter(function (type) {
	// Filter for templates, type.label below synced with above
	return isTemplate || type.label !== '模板与模块保护';
});

Twinkle.protect.protectionTypesCreate = [
	{ label: '解除保护', value: 'unprotect' },
	{
		label: '白纸保护',
		list: [
			{ label: '常规（白纸）', value: 'pp-create' },
			{ label: '攻击性名称（白纸）', value: 'pp-create-offensive' },
			{ label: '多次重复创建（白纸）', selected: true, value: 'pp-create-salt' },
			{ label: '近期删除的违反生者传记方针页面（白纸）', value: 'pp-create-blp' }
		]
	}
];

// A page with regular protection will be assigned its regular
// protection weight plus 2
Twinkle.protect.protectionWeight = {
	officialprotected: 40,
	revisionprotected: 40,
	sysop: 30,
	templateeditor: 20,
	autoconfirmed: 10,
	all: 0
};

// NOTICE: keep this synched with [[MediaWiki:Protect-dropdown]]
// expiry will override any defaults
Twinkle.protect.protectionPresetsInfo = {
	'pp-protected': {
		edit: 'sysop',
		move: 'sysop',
		reason: null
	},
	'pp-dispute': {
		edit: 'sysop',
		move: 'sysop',
		reason: '编辑战'
	},
	'pp-vandalism': {
		edit: 'sysop',
		move: 'sysop',
		reason: '自动确认用户破坏'
	},
	'pp-usertalk': {
		edit: 'sysop',
		move: 'sysop',
		expiry: 'infinity',
		reason: '被封禁用户滥用其讨论页'
	},
	'pp-template': {
		edit: 'templateeditor',
		move: 'templateeditor',
		expiry: 'infinity',
		reason: '高风险模板'
	},
	'pp-module': {
		edit: 'templateeditor',
		move: 'templateeditor',
		expiry: 'infinity',
		reason: '高风险模块'
	},
	'pp-semi-vandalism': {
		edit: 'autoconfirmed',
		reason: '非自动确认用户破坏',
		template: 'pp-vandalism'
	},
	'pp-semi-disruptive': {
		edit: 'autoconfirmed',
		reason: '非自动确认用户持续加入破坏性内容',
		template: 'pp-protected'
	},
	'pp-semi-unsourced': {
		edit: 'autoconfirmed',
		reason: '非自动确认用户持续加入无来源佐证的内容',
		template: 'pp-protected'
	},
	'pp-semi-blp': {
		edit: 'autoconfirmed',
		reason: '非自动确认用户违反生者传记方针'
	},
	'pp-semi-usertalk': {
		edit: 'autoconfirmed',
		move: 'autoconfirmed',
		expiry: 'infinity',
		reason: '被封禁用户滥用其讨论页',
		template: 'pp-usertalk'
	},
	'pp-semi-sock': {
		edit: 'autoconfirmed',
		reason: '持续的傀儡破坏'
	},
	'pp-semi-protected': {
		edit: 'autoconfirmed',
		reason: null,
		template: 'pp-protected'
	},
	'pp-move': {
		move: 'sysop',
		reason: null
	},
	'pp-move-dispute': {
		move: 'sysop',
		reason: '移动战'
	},
	'pp-move-vandalism': {
		move: 'sysop',
		reason: '移动破坏'
	},
	'pp-move-indef': {
		move: 'sysop',
		expiry: 'infinity',
		reason: '高风险页面'
	},
	'unprotect': {
		edit: 'all',
		move: 'all',
		create: 'all',
		reason: null,
		template: 'none'
	},
	'pp-create-offensive': {
		create: 'sysop',
		reason: '攻击性名称',
		template: 'pp-create'
	},
	'pp-create-salt': {
		create: 'autoconfirmed',
		reason: '多次重复创建',
		template: 'pp-create'
	},
	'pp-create-blp': {
		create: 'autoconfirmed',
		reason: '近期删除的违反生者传记方针页面',
		template: 'pp-create'
	},
	'pp-create': {
		create: 'autoconfirmed',
		reason: '常规白纸保护'
	}
};

Twinkle.protect.protectionTags = [
	{
		label: '无（移除现有模板）',
		value: 'none'
	},
	{
		label: '无（不移除现有模板）',
		value: 'noop'
	},
	{
		label: '编辑保护模板',
		list: [
			{ label: '{{pp-dispute}}: 争议、编辑战', value: 'pp-dispute' },
			{ label: '{{pp-vandalism}}: 破坏', value: 'pp-vandalism' },
			{ label: '{{pp-template}}: 高风险模板', value: 'pp-template' },
			{ label: '{{pp-module}}: 高风险模块', value: 'pp-module' },
			{ label: '{{pp-usertalk}}: 封禁用户讨论页', value: 'pp-usertalk' },
			{ label: '{{pp-semi-sock}}: 傀儡破坏', value: 'pp-semi-sock' },
			{ label: '{{pp-semi-blp}}: 违反生者传记', value: 'pp-semi-blp}' },
			{ label: '{{pp-semi-indef}}: 常规长期半保护', value: 'pp-semi-indef' },
			{ label: '{{pp-protected}}: 常规保护', value: 'pp-protected' }
		]
	},
	{
		label: '移动保护模板',
		list: [
			{ label: '{{pp-move-dispute}}: 争议、编辑战', value: 'pp-move-dispute' },
			{ label: '{{pp-move-vandalism}}: 页面移动破坏', value: 'pp-move-vandalism' },
			{ label: '{{pp-move-indef}}: 长期保护', value: 'pp-move-indef' },
			{ label: '{{pp-move}}: 常规', value: 'pp-move' }
		]
	}
];

Twinkle.protect.callback.changePreset = function twinkleprotectCallbackChangePreset(e) {
	var form = e.target.form;

	var actiontypes = form.actiontype;
	var actiontype;
	for (var i = 0; i < actiontypes.length; i++) {
		if (!actiontypes[i].checked) {
			continue;
		}
		actiontype = actiontypes[i].values;
		break;
	}

	if (actiontype === 'protect') {  // actually protecting the page
		var item = Twinkle.protect.protectionPresetsInfo[form.category.value];

		if (mw.config.get('wgArticleId')) {
			if (item.edit) {
				form.editmodify.checked = true;
				Twinkle.protect.formevents.editmodify({ target: form.editmodify });
				form.editlevel.value = item.edit;
				Twinkle.protect.formevents.editlevel({ target: form.editlevel });
			} else {
				form.editmodify.checked = false;
				Twinkle.protect.formevents.editmodify({ target: form.editmodify });
			}

			if (item.move) {
				form.movemodify.checked = true;
				Twinkle.protect.formevents.movemodify({ target: form.movemodify });
				form.movelevel.value = item.move;
				Twinkle.protect.formevents.movelevel({ target: form.movelevel });
			} else {
				form.movemodify.checked = false;
				Twinkle.protect.formevents.movemodify({ target: form.movemodify });
			}

			form.editexpiry.value = form.moveexpiry.value = item.expiry || '2 days';
		} else {
			if (item.create) {
				form.createlevel.value = item.create;
				Twinkle.protect.formevents.createlevel({ target: form.createlevel });
			}
			form.createexpiry.value = item.expiry || 'infinity';
		}

		var reasonField = actiontype === 'protect' ? form.protectReason : form.reason;
		if (item.reason) {
			reasonField.value = item.reason;
		} else {
			reasonField.value = '';
		}
		// Add any annotations
		Twinkle.protect.callback.annotateProtectReason(e);

		// sort out tagging options, disabled if nonexistent or lua
		if (mw.config.get('wgArticleId') && mw.config.get('wgPageContentModel') !== 'Scribunto') {
			if (form.category.value === 'unprotect') {
				form.tagtype.value = 'none';
			} else {
				form.tagtype.value = item.template ? item.template : form.category.value;
			}
			Twinkle.protect.formevents.tagtype({ target: form.tagtype });

			// We only have one TE template at the moment, so this
			// should be expanded if more are added (e.g. pp-semi-template)
			if (form.category.value === 'pp-template') {
				form.noinclude.checked = true;
			} else if (mw.config.get('wgNamespaceNumber') !== 10) {
				form.noinclude.checked = false;
			}
		}

	} else {  // RPP request
		if (form.category.value === 'unprotect') {
			form.expiry.value = '';
			form.expiry.disabled = true;
		} else {
			form.expiry.value = '';
			form.expiry.disabled = false;
		}
	}
};

Twinkle.protect.callback.evaluate = function twinkleprotectCallbackEvaluate(e) {
	var form = e.target;
	var input = Morebits.quickForm.getInputData(form);

	var tagparams;
	if (input.actiontype === 'tag' || (input.actiontype === 'protect' && mw.config.get('wgArticleId') && mw.config.get('wgPageContentModel') !== 'Scribunto')) {
		tagparams = {
			tag: input.tagtype,
			reason: (input.tagtype === 'pp-protected' || input.tagtype === 'pp-semi-protected' || input.tagtype === 'pp-move') && input.protectReason,
			small: input.small,
			noinclude: input.noinclude
		};
	}

	switch (input.actiontype) {
		case 'protect':
			// protect the page
			Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			Morebits.wiki.actionCompleted.notice = '保护完成';

			var statusInited = false;
			var thispage;

			var allDone = function twinkleprotectCallbackAllDone() {
				if (thispage) {
					thispage.getStatusElement().info('完成');
				}
				if (tagparams) {
					Twinkle.protect.callbacks.taggingPageInitial(tagparams);
				}
			};

			var protectIt = function twinkleprotectCallbackProtectIt(next) {
				thispage = new Morebits.wiki.page(mw.config.get('wgPageName'), '保护页面');
				if (mw.config.get('wgArticleId')) {
					if (input.editmodify) {
						thispage.setEditProtection(input.editlevel, input.editexpiry);
					}
					if (input.movemodify) {
						// Ensure a level has actually been chosen
						if (input.movelevel) {
							thispage.setMoveProtection(input.movelevel, input.moveexpiry);
						} else {
							alert('必须指定移动保护层级！');
							return;
						}
					}
					thispage.setWatchlist(Twinkle.getPref('watchProtectedPages'));
				} else {
					thispage.setCreateProtection(input.createlevel, input.createexpiry);
					thispage.setWatchlist(false);
				}

				if (input.protectReason) {
					thispage.setEditSummary(input.protectReason);
				} else {
					alert('您必须输入保护理由，这将被记录在保护日志中。');
					return;
				}

				if (!statusInited) {
					Morebits.simpleWindow.setButtonsEnabled(false);
					Morebits.status.init(form);
					statusInited = true;
				}

				thispage.setChangeTags(Twinkle.changeTags);
				thispage.protect(next);
			};

			if (input.editmodify || input.movemodify || !mw.config.get('wgArticleId')) {
				protectIt(allDone);
			} else {
				alert('给Twinkle找点事做呗？');
			}

			break;

		case 'tag':
			// apply a protection template

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			Morebits.wiki.actionCompleted.followRedirect = false;
			Morebits.wiki.actionCompleted.notice = '标记完成';

			Twinkle.protect.callbacks.taggingPageInitial(tagparams);
			break;

		case 'request':
			// file request at RFPP
			var typename, typereason;
			switch (input.category) {
				case 'pp-dispute':
				case 'pp-vandalism':
				case 'pp-usertalk':
				case 'pp-protected':
					typename = '全保护';
					break;
				case 'pp-template':
					typename = '模板保护';
					break;
				case 'pp-semi-vandalism':
				case 'pp-semi-disruptive':
				case 'pp-semi-unsourced':
				case 'pp-semi-usertalk':
				case 'pp-semi-sock':
				case 'pp-semi-blp':
				case 'pp-semi-protected':
					typename = '半保护';
					break;
				case 'pp-move':
				case 'pp-move-dispute':
				case 'pp-move-indef':
				case 'pp-move-vandalism':
					typename = '移动保护';
					break;
				case 'pp-create':
				case 'pp-create-offensive':
				case 'pp-create-blp':
				case 'pp-create-salt':
					typename = '白纸保护';
					break;
				case 'unprotect':
					var admins = $.map(Twinkle.protect.currentProtectionLevels, function (pl) {
						if (!pl.admin || Twinkle.protect.trustedBots.indexOf(pl.admin) !== -1) {
							return null;
						}
						return 'User:' + pl.admin;
					});
					if (admins.length && !confirm('是否已与管理员 (' + Morebits.array.uniq(admins).join(', ') + ')沟通？')) {
						return false;
					}
					// otherwise falls through
				default:
					alert('未知保护类型！');
					break;
			}
			switch (input.category) {
				case 'pp-dispute':
					typereason = '争议或编辑战';
					break;
				case 'pp-vandalism':
				case 'pp-semi-vandalism':
					typereason = '持续[[QW:VAND|破坏]]';
					break;
				case 'pp-template':
					typereason = '高风险模板';
					break;
				case 'pp-usertalk':
				case 'pp-semi-usertalk':
					typereason = '被封禁用户滥用其讨论页';
					break;
				case 'pp-semi-sock':
					typereason = '持续滥用[[QW:SOCK|多重账号]]';
					break;
				case 'pp-semi-blp':
					typereason = '违反[[QW:BLP|生者传记方针]]';
					break;
				case 'pp-move-dispute':
					typereason = '页面标题争议、编辑战';
					break;
				case 'pp-move-vandalism':
					typereason = '移动破坏';
					break;
				case 'pp-move-indef':
					typereason = '高风险页面';
					break;
				default:
					typereason = '';
					break;
			}

			var reason = typereason;
			if (input.reason !== '') {
				if (typereason !== '') {
					reason += '\u00A0\u2013 ';  // U+00A0 NO-BREAK SPACE; U+2013 EN RULE
				}
				reason += input.reason;
			}
			if (reason !== '' && reason.charAt(reason.length - 1) !== '.') {
				reason += '.';
			}

			var rppparams = {
				reason: reason,
				typename: typename,
				category: input.category,
				expiry: input.expiry
			};

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			var rppName = 'Qiuwen:页面保护请求';

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = 'Qiuwen:页面保护请求';
			Morebits.wiki.actionCompleted.notice = '提名完毕，正在转向讨论页';

			var rppPage = new Morebits.wiki.page(rppName, '请求保护页面');
			rppPage.setFollowRedirect(true);
			rppPage.setCallbackParameters(rppparams);
			rppPage.load(Twinkle.protect.callbacks.fileRequest);
			break;
		default:
			alert('twinkleprotect: 未知操作');
			break;
	}
};

Twinkle.protect.protectReasonAnnotations = [];
Twinkle.protect.callback.annotateProtectReason = function twinkleprotectCallbackAnnotateProtectReason(e) {
	var form = e.target.form;
	var protectReason = form.protectReason.value.replace(new RegExp('(?:; )?' + mw.util.escapeRegExp(Twinkle.protect.protectReasonAnnotations.join(': '))), '');

	if (this.name === 'protectReason_notes_rfpp') {
		if (this.checked) {
			Twinkle.protect.protectReasonAnnotations.push(this.value);
			$(form.protectReason_notes_rfppRevid).parent().show();
		} else {
			Twinkle.protect.protectReasonAnnotations = [];
			form.protectReason_notes_rfppRevid.value = '';
			$(form.protectReason_notes_rfppRevid).parent().hide();
		}
	} else if (this.name === 'protectReason_notes_rfppRevid') {
		Twinkle.protect.protectReasonAnnotations = Twinkle.protect.protectReasonAnnotations.filter(function (el) {
			return el.indexOf('[[Special:Permalink') === -1;
		});
		if (e.target.value.length) {
			var permalink = '[[Special:Permalink/' + e.target.value + '#' + Morebits.pageNameNorm + ']]';
			Twinkle.protect.protectReasonAnnotations.push(permalink);
		}
	}

	if (!Twinkle.protect.protectReasonAnnotations.length) {
		form.protectReason.value = protectReason;
	} else {
		form.protectReason.value = (protectReason ? protectReason + '; ' : '') + Twinkle.protect.protectReasonAnnotations.join(': ');
	}
};

Twinkle.protect.callbacks = {
	taggingPageInitial: function (tagparams) {
		if (tagparams.tag === 'noop') {
			Morebits.status.info('应用保护模板', '无事可做');
			return;
		}

		var protectedPage = new Morebits.wiki.page(mw.config.get('wgPageName'), '标记页面');
		protectedPage.setCallbackParameters(tagparams);
		protectedPage.load(Twinkle.protect.callbacks.taggingPage);
	},
	taggingPage: function (protectedPage) {
		var params = protectedPage.getCallbackParameters();
		var text = protectedPage.getPageText();
		var tag, summary;

		var oldtag_re = /\s*(?:<noinclude>)?\s*\{\{\s*(pp-[^{}]*?|protected|(?:t|v|s|p-|usertalk-v|usertalk-s|sb|move)protected(?:2)?|protected template|privacy protection)\s*?\}\}\s*(?:<\/noinclude>)?\s*/gi;
		var re_result = oldtag_re.exec(text);
		if (re_result) {
			if (params.tag === 'none' || confirm('{{' + re_result[1] + '}} was found on the page. \nClick OK to remove it, or click Cancel to leave it there.')) {
				text = text.replace(oldtag_re, '');
			}
		}

		if (params.tag === 'none') {
			summary = '移除保护模板';
		} else {
			tag = params.tag;
			if (params.reason) {
				tag += '|reason=' + params.reason;
			}
			if (params.small) {
				tag += '|small=yes';
			}

			if (/^\s*#redirect/i.test(text)) { // redirect page
				// Only tag if no {{rcat shell}} is found
				if (!text.match(/{{(?:redr|this is a redirect|r(?:edirect)?(?:.?cat.*)?[ _]?sh)/i)) {
					text = text.replace(/#REDIRECT ?(\[\[.*?\]\])(.*)/i, '#REDIRECT $1$2\n\n{{' + tag + '}}');
					text = text.replace(/#重定向 ?(\[\[.*?\]\])(.*)/i, '#重定向 $1$2\n\n{{' + tag + '}}');
				} else {
					Morebits.status.info('重定向模板', '无事可做');
					return;
				}
			} else {
				if (params.noinclude) {
					tag = '<noinclude>{{' + tag + '}}</noinclude>';
				} else {
					tag = '{{' + tag + '}}\n';
				}

				// Insert tag after short description or any hatnotes
				var wikipage = new Morebits.wikitext.page(text);
				text = wikipage.insertAfterTemplates(tag, Twinkle.hatnoteRegex).getText();
			}
			summary = '加入{{' + params.tag + '}}';
		}

		protectedPage.setEditSummary(summary);
		protectedPage.setChangeTags(Twinkle.changeTags);
		protectedPage.setWatchlist(Twinkle.getPref('watchPPTaggedPages'));
		protectedPage.setPageText(text);
		protectedPage.setCreateOption('nocreate');
		protectedPage.suppressProtectWarning(); // no need to let admins know they are editing through protection
		protectedPage.save();
	},

	fileRequest: function (rppPage) {

		var rppPage2 = new Morebits.wiki.page('Qiuwen:页面保护请求', '拉取请求页面');
		rppPage2.load(function () {
			var params = rppPage.getCallbackParameters();
			var text = rppPage.getPageText();
			var statusElement = rppPage.getStatusElement();
			var text2 = rppPage2.getPageText();

			var rppRe = new RegExp('===\\s*(\\[\\[)?\\s*:?\\s*' + Morebits.string.escapeRegExp(Morebits.pageNameNorm) + '\\s*(\\]\\])?\\s*===', 'm');
			var tag = rppRe.exec(text) || rppRe.exec(text2);

			var rppLink = document.createElement('a');
			rppLink.setAttribute('href', mw.util.getUrl('Qiuwen:页面保护请求'));
			rppLink.appendChild(document.createTextNode('Qiuwen:页面保护请求'));

			if (tag) {
				statusElement.error([ '已有保护请求，在 ', rppLink, ', 停止操作' ]);
				return;
			}

			var newtag = '=== [[:' + Morebits.pageNameNorm + ']] ===\n';
			if (new RegExp('^' + mw.util.escapeRegExp(newtag).replace(/\s+/g, '\\s*'), 'm').test(text) || new RegExp('^' + mw.util.escapeRegExp(newtag).replace(/\s+/g, '\\s*'), 'm').test(text2)) {
				statusElement.error([ '已有保护请求，在 ', rppLink, ', 停止操作' ]);
				return;
			}
			newtag += '* {{pagelinks|1=' + Morebits.pageNameNorm + '}}\n\n';

			var words;
			switch (params.expiry) {
				case 'temporary':
					words = 'Temporary ';
					break;
				case 'infinity':
					words = 'Indefinite ';
					break;
				default:
					words = '';
					break;
			}

			words += params.typename;

			newtag += "'''" + Morebits.string.toUpperCaseFirstChar(words) + (params.reason !== '' ? ":''' " +
					Morebits.string.formatReasonText(params.reason) : ".'''") + ' ~~~~';

			// If either protection type results in a increased status, then post it under increase
			// else we post it under decrease
			var increase = false;
			var protInfo = Twinkle.protect.protectionPresetsInfo[params.category];

			// function to compute protection weights (see comment at Twinkle.protect.protectionWeight)
			var computeWeight = function (mainLevel) {
				var result = Twinkle.protect.protectionWeight[mainLevel || 'all'];
				return result;
			};

			// compare the page's current protection weights with the protection we are requesting
			var editWeight = computeWeight(Twinkle.protect.currentProtectionLevels.edit &&
					Twinkle.protect.currentProtectionLevels.edit.level);
			if (computeWeight(protInfo.edit) > editWeight ||
					computeWeight(protInfo.move) > computeWeight(Twinkle.protect.currentProtectionLevels.move &&
					Twinkle.protect.currentProtectionLevels.move.level) ||
					computeWeight(protInfo.create) > computeWeight(Twinkle.protect.currentProtectionLevels.create &&
					Twinkle.protect.currentProtectionLevels.create.level)) {
				increase = true;
			}

			if (increase) {
				var originalTextLength = text.length;
				text += '\n' + newtag;
				if (text.length === originalTextLength) {
					statusElement.error([ '操作出错，请至[[QWT:TW]]回报错误' ]);
					return;
				}
				statusElement.status('添加保护请求');
				rppPage.setEditSummary('/* ' + Morebits.pageNameNorm + ' */ 请求 ' + params.typename + ' of [[:' +
						Morebits.pageNameNorm + ']].');
				rppPage.setChangeTags(Twinkle.changeTags);
				rppPage.setPageText(text);
				rppPage.setCreateOption('recreate');
				rppPage.save(function () {
					// Watch the page being requested
					var watchPref = Twinkle.getPref('watchRequestedPages');
					// action=watch has no way to rely on user preferences (T262912), so we do it manually.
					// The watchdefault pref appears to reliably return '1' (string),
					// but that's not consistent among prefs so might as well be "correct"
					var watch = watchPref !== 'no' && (watchPref !== 'default' || !!parseInt(mw.user.options.get('watchdefault'), 10));
					if (watch) {
						var watch_query = {
							action: 'watch',
							titles: mw.config.get('wgPageName'),
							token: mw.user.tokens.get('watchToken')
						};
							// Only add the expiry if page is unwatched or already temporarily watched
						if (Twinkle.protect.watched !== true && watchPref !== 'default' && watchPref !== 'yes') {
							watch_query.expiry = watchPref;
						}
						new Morebits.wiki.api('加入请求的页面到监视列表', watch_query).post();
					}
				});
			} else {
				var originalTextLength2 = text2.length;
				text2 += '\n' + newtag;
				if (text2.length === originalTextLength2) {
					statusElement.error([ '操作出错，请至[[QWT:TW]]回报错误' ]);
					return;
				}
				statusElement.status('添加保护请求');
				rppPage2.setEditSummary('/* ' + Morebits.pageNameNorm + ' */ 请求 ' + params.typename + ' of [[:' +
						Morebits.pageNameNorm + ']].');
				rppPage2.setChangeTags(Twinkle.changeTags);
				rppPage2.setPageText(text2);
				rppPage2.setCreateOption('recreate');
				rppPage2.save(function () {
					// Watch the page being requested
					var watchPref = Twinkle.getPref('watchRequestedPages');
					// action=watch has no way to rely on user preferences (T262912), so we do it manually.
					// The watchdefault pref appears to reliably return '1' (string),
					// but that's not consistent among prefs so might as well be "correct"
					var watch = watchPref !== 'no' && (watchPref !== 'default' || !!parseInt(mw.user.options.get('watchdefault'), 10));
					if (watch) {
						var watch_query = {
							action: 'watch',
							titles: mw.config.get('wgPageName'),
							token: mw.user.tokens.get('watchToken')
						};
							// Only add the expiry if page is unwatched or already temporarily watched
						if (Twinkle.protect.watched !== true && watchPref !== 'default' && watchPref !== 'yes') {
							watch_query.expiry = watchPref;
						}
						new Morebits.wiki.api('加入请求的页面到监视列表', watch_query).post();
					}
				});
			}
		});
	}
};

Twinkle.addInitCallback(Twinkle.protect, 'protect');
}(jQuery));

// </nowiki>
