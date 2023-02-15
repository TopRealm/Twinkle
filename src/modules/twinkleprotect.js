'use strict';

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
/* Twinkle.js - twinkleprotect.js */
/* <nowiki> */
(($) => {
/**
	 * twinkleprotect.js: Protect/RPP module
	 * Mode of invocation:  Tab ("PP"/"RPP")
	 * Active on:           Non-special, non-MediaWiki pages
	 */

// Note: a lot of code in this module is re-used/called by batchprotect.

Twinkle.protect = () => {
	if (mw.config.get('wgNamespaceNumber') < 0 || mw.config.get('wgNamespaceNumber') === 8) {
		return;
	}

	Twinkle.addPortletLink(
		Twinkle.protect.callback,
		'保护',
		'tw-rpp',
		Morebits.userIsSysop ? '保护页面' : '请求保护页面'
	);
};

Twinkle.protect.callback = () => {
	const Window = new Morebits.simpleWindow(620, 530);
	Window.setTitle(Morebits.userIsSysop ? '实施页面保护或请求保护页面' : '请求保护页面');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('保护模板', 'Template:Protection templates');
	Window.addFooterLink('保护方针', 'QW:PROT');
	Window.addFooterLink('保护设置', 'H:TW/PREF#保护');
	Window.addFooterLink('Twinkle帮助', 'H:TW/DOC#保护');
	Window.addFooterLink('问题反馈', 'HT:TW');

	const form = new Morebits.quickForm(Twinkle.protect.callback.evaluate);
	const actionfield = form.append({
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
				tooltip: `如果您想在管理员通告版请求保护此页${
					Morebits.userIsSysop ? '而不是自行完成。' : '。'
				}`,
				checked: !Morebits.userIsSysop
			},
			{
				label: '用保护模板标记此页',
				value: 'tag',
				tooltip: '可以用此为页面加上合适的保护模板。',
				disabled:
						mw.config.get('wgArticleId') === 0 ||
						mw.config.get('wgPageContentModel') === 'Scribunto'
			}
		]
	});

	form.append({
		type: 'field',
		label: '默认',
		name: 'field_preset'
	});
	form.append({
		type: 'field',
		label: '1',
		name: 'field1'
	});
	form.append({
		type: 'field',
		label: '2',
		name: 'field2'
	});
	form.append({
		type: 'submit'
	});

	const result = form.render();
	Window.setContent(result);
	Window.display();

	// We must init the controls
	const evt = document.createEvent('Event');
	evt.initEvent('change', true, true);
	result.actiontype[0].dispatchEvent(evt);

	// get current protection level asynchronously
	Twinkle.protect.fetchProtectionLevel();
};

// Customizable namespace and FlaggedRevs settings
// In theory it'd be nice to have restrictionlevels defined here,
// but those are only available via a siteinfo query

// Customizable namespace settings
// Limit template editor; a Twinkle restriction, not a site setting
const isTemplate =
		mw.config.get('wgNamespaceNumber') === 10 || mw.config.get('wgNamespaceNumber') === 828;

// Contains the current protection level in an object
// Once filled, it will look something like:
// { edit: { level: "sysop", expiry: <some date>, cascade: true }, ... }
Twinkle.protect.currentProtectionLevels = {};
Twinkle.protect.previousProtectionLevels = {};

Twinkle.protect.fetchProtectionLevel = () => {
	const api = new mw.Api();
	const protectDeferred = api.get({
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

	$.when.apply(jQuery, [protectDeferred]).done((protectData) => {
		// $.when.apply is supposed to take an unknown number of promises
		// via an array, which it does, but the type of data returned varies.
		// If there are two or more deferreds, it returns an array (of objects),
		// but if there's just one deferred, it retuns a simple object.
		// This is annoying.
		const pageid = protectData.query.pageids[0];
		const page = protectData.query.pages[pageid];
		const current = {};
		const previous = {};

		// Save requested page's watched status for later in case needed when filing request
		Twinkle.protect.watched = page.watchlistexpiry || page.watched === '';

		$.each(page.protection, (_index, protection) => {
			if (protection.type !== 'aft') {
				current[protection.type] = {
					level: protection.level,
					expiry: protection.expiry,
					cascade: protection.cascade === ''
				};
			}
		});

		// Only use the log except unprotect
		Twinkle.protect.previousProtectionLog =
				protectData.query.logevents.length >= 1 &&
				protectData.query.logevents[0].action !== 'unprotect'
					? protectData.query.logevents[0]
					: protectData.query.logevents.length >= 2
						? protectData.query.logevents[1]
						: null;

		if (Twinkle.protect.previousProtectionLog) {
			$.each(
				Twinkle.protect.previousProtectionLog.params.details,
				(_index, protection) => {
					if (protection.type !== 'aft') {
						previous[protection.type] = {
							level: protection.level,
							expiry: protection.expiry,
							cascade: protection.cascade === ''
						};
					}
				}
			);
		}

		// show the protection level and log info
		Twinkle.protect.hasProtectLog = !!protectData.query.logevents.length;
		Twinkle.protect.currentProtectionLevels = current;
		Twinkle.protect.previousProtectionLevels = previous;
		Twinkle.protect.callback.showLogAndCurrentProtectInfo();
	});
};

Twinkle.protect.callback.showLogAndCurrentProtectInfo = () => {
	const currentlyProtected = !$.isEmptyObject(Twinkle.protect.currentProtectionLevels);

	if (Twinkle.protect.hasProtectLog || Twinkle.protect.hasStableLog) {
		const $linkMarkup = $('<span>');

		if (Twinkle.protect.hasProtectLog) {
			$linkMarkup.append(
				$(
					`<a target="_blank" href="${mw.util.getUrl('Special:Log', {
						action: 'view',
						page: mw.config.get('wgPageName'),
						type: 'protect'
					})}">保护日志</a>`
				),
				Twinkle.protect.hasStableLog ? $('<span> &bull; </span>') : null
			);
		}

		Morebits.status.init($('div[name="hasprotectlog"] span')[0]);
		Morebits.status.warn(
			currentlyProtected
				? '先前保护'
				: [
					'此页面曾在',
					$(
						`<b>${new Morebits.date(
							Twinkle.protect.previousProtectionLog.timestamp
						).calendar('utc')}</b>`
					)[0],
					`被${Twinkle.protect.previousProtectionLog.user}保护：`
				].concat(
					Twinkle.protect.formatProtectionDescription(
						Twinkle.protect.previousProtectionLevels
					)
				),
			$linkMarkup[0]
		);
	}

	Morebits.status.init($('div[name="currentprot"] span')[0]);
	let protectionNode = [],
		statusLevel = 'info';

	protectionNode = Twinkle.protect.formatProtectionDescription(
		Twinkle.protect.currentProtectionLevels
	);
	if (currentlyProtected) {
		statusLevel = 'warn';
	}

	Morebits.status[statusLevel]('当前保护等级', protectionNode);
};

Twinkle.protect.callback.changeAction = (e) => {
	let field_preset;
	let field1;
	let field2;

	switch (e.target.values) {
		case 'protect':
			field_preset = new Morebits.quickForm.element({
				type: 'field',
				label: '默认',
				name: 'field_preset'
			});
			field_preset.append({
				type: 'select',
				name: 'category',
				label: '选择默认：',
				event: Twinkle.protect.callback.changePreset,
				list: mw.config.get('wgArticleId')
					? Twinkle.protect.protectionTypesAdmin
					: Twinkle.protect.protectionTypesCreate
			});

			field2 = new Morebits.quickForm.element({
				type: 'field',
				label: '保护选项',
				name: 'field2'
			});
			field2.append({ type: 'div', name: 'currentprot', label: ' ' }); // holds the current protection level, as filled out by the async callback
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
							tooltip: '如果此项关闭，编辑权限将不会修改。',
							checked: true
						}
					]
				});
				field2.append({
					type: 'select',
					name: 'editlevel',
					label: '编辑权限：',
					event: Twinkle.protect.formevents.editlevel,
					list: Twinkle.protect.protectionLevels.filter(
						(level) =>
						// Filter TE outside of templates and modules
							isTemplate || level.value !== 'templateeditor'
					)
				});
				field2.append({
					type: 'select',
					name: 'editexpiry',
					label: '终止时间：',
					event: (e) => {
						if (e.target.value === 'custom') {
							Twinkle.protect.doCustomExpiry(e.target);
						}
						$('input[name=small]', $(e.target).closest('form'))[0].checked =
								e.target.selectedIndex >= 4; // 1 month
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
							tooltip: '如果此项被关闭，移动权限将不被修改。',
							checked: true
						}
					]
				});
				field2.append({
					type: 'select',
					name: 'movelevel',
					label: '移动权限：',
					event: Twinkle.protect.formevents.movelevel,
					list: Twinkle.protect.protectionLevels.filter(
						(level) =>
						// Autoconfirmed is required for a move, redundant
							level.value !== 'autoconfirmed' &&
								(isTemplate || level.value !== 'templateeditor')
					)
				});
				field2.append({
					type: 'select',
					name: 'moveexpiry',
					label: '终止时间：',
					event: (e) => {
						if (e.target.value === 'custom') {
							Twinkle.protect.doCustomExpiry(e.target);
						}
					},
					// default expiry selection (2 days) is conditionally set in Twinkle.protect.callback.changePreset
					list: Twinkle.protect.protectionLengths
				});
			} else {
				// for non-existing pages
				field2.append({
					type: 'select',
					name: 'createlevel',
					label: '创建权限：',
					event: Twinkle.protect.formevents.createlevel,
					list: Twinkle.protect.protectionLevels.filter(
						(level) =>
						// Filter TE always, and autoconfirmed in mainspace
							level.value !== 'templateeditor'
					)
				});
				field2.append({
					type: 'select',
					name: 'createexpiry',
					label: '终止时间：',
					event: (e) => {
						if (e.target.value === 'custom') {
							Twinkle.protect.doCustomExpiry(e.target);
						}
					},
					// default expiry selection (indefinite) is conditionally set in Twinkle.protect.callback.changePreset
					list: Twinkle.protect.protectionLengths
				});
			}
			field2.append({
				type: 'checkbox',
				list: [
					{
						name: 'close',
						label: '标记请求保护页面中的请求',
						checked: true
					}
				]
			});
			field2.append({
				type: 'textarea',
				name: 'protectReason',
				label: '理由（保护日志）：'
			});
			if (
				!mw.config.get('wgArticleId') ||
					mw.config.get('wgPageContentModel') === 'Scribunto'
			) {
				// tagging isn't relevant for non-existing or module pages
				break;
			}
			/* falls through */
		case 'tag':
			field1 = new Morebits.quickForm.element({
				type: 'field',
				label: '标记选项',
				name: 'field1'
			});
			field1.append({ type: 'div', name: 'currentprot', label: ' ' }); // holds the current protection level, as filled out by the async callback
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
						tooltip: '将给模板加上|small=yes参数，显示成右上角的一把挂锁。'
					},
					{
						name: 'noinclude',
						label: '用&lt;noinclude&gt;包裹保护模板',
						tooltip: '将保护模板包裹在&lt;noinclude&gt;中',
						checked: mw.config.get('wgNamespaceNumber') === 10
					},
					{
						name: 'showexpiry',
						label: '在模板显示到期时间',
						tooltip: '将给模板加上|expiry参数',
						checked: true,
						hidden: e.target.values === 'tag'
					}
				]
			});
			break;

		case 'request':
			field_preset = new Morebits.quickForm.element({
				type: 'field',
				label: '保护类型',
				name: 'field_preset'
			});
			field_preset.append({
				type: 'select',
				name: 'category',
				label: '类型和理由：',
				event: Twinkle.protect.callback.changePreset,
				list: mw.config.get('wgArticleId')
					? Twinkle.protect.protectionTypes
					: Twinkle.protect.protectionTypesCreate
			});

			field1 = new Morebits.quickForm.element({
				type: 'field',
				label: '选项',
				name: 'field1'
			});
			field1.append({ type: 'div', name: 'currentprot', label: ' ' }); // holds the current protection level, as filled out by the async callback
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
			alert('这玩意儿被逆袭的天邪鬼吃掉了！');
			break;
	}

	let oldfield;

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
		const evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		e.target.form.category.dispatchEvent(evt);

		// reduce vertical height of dialog
		$(e.target.form)
			.find('fieldset[name="field2"] select')
			.parent()
			.css({ display: 'inline-block', marginRight: '0.5em' });
	}

	// re-add protection level and log info, if it's available
	Twinkle.protect.callback.showLogAndCurrentProtectInfo();
};

// NOTE: This function is used by batchprotect as well
Twinkle.protect.formevents = {
	editmodify: (e) => {
		e.target.form.editlevel.disabled = !e.target.checked;
		e.target.form.editexpiry.disabled =
				!e.target.checked || e.target.form.editlevel.value === 'all';
		e.target.form.editlevel.style.color = e.target.form.editexpiry.style.color = e.target
			.checked
			? ''
			: 'transparent';
	},
	editlevel: (e) => {
		e.target.form.editexpiry.disabled = e.target.value === 'all';
	},
	movemodify: (e) => {
		// sync move settings with edit settings if applicable
		if (e.target.form.movelevel.disabled && !e.target.form.editlevel.disabled) {
			e.target.form.movelevel.value = e.target.form.editlevel.value;
			e.target.form.moveexpiry.value = e.target.form.editexpiry.value;
		} else if (e.target.form.editlevel.disabled) {
			e.target.form.movelevel.value = 'sysop';
			e.target.form.moveexpiry.value = 'infinity';
		}
		e.target.form.movelevel.disabled = !e.target.checked;
		e.target.form.moveexpiry.disabled =
				!e.target.checked || e.target.form.movelevel.value === 'all';
		e.target.form.movelevel.style.color = e.target.form.moveexpiry.style.color = e.target
			.checked
			? ''
			: 'transparent';
	},
	movelevel: (e) => {
		e.target.form.moveexpiry.disabled = e.target.value === 'all';
	},
	createlevel: (e) => {
		e.target.form.createexpiry.disabled = e.target.value === 'all';
	},
	tagtype: (e) => {
		e.target.form.small.disabled =
				e.target.form.noinclude.disabled =
				e.target.form.showexpiry.disabled =
					e.target.value === 'none' || e.target.value === 'noop';
	}
};

Twinkle.protect.doCustomExpiry = (target) => {
	const custom = prompt(
		'输入自定义终止时间。\n您可以使用相对时间，如“1 minute”或“19 days”，或绝对时间“yyyymmddhhmm”（如“200602011405”是2006年02月01日14：05（UTC））',
		''
	);
	if (custom) {
		const option = document.createElement('option');
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
	{
		label: '全部',
		value: 'all'
	},
	{
		label: '仅允许自动确认用户',
		value: 'autoconfirmed'
	},
	{
		label: '仅模板编辑员和管理员',
		value: 'templateeditor'
	},
	{
		label: '仅允许管理员',
		value: 'sysop',
		selected: true
	},
	{
		label: '仅允许资深用户',
		value: 'revisionprotected'
	},
	{
		label: '仅允许裁决委员',
		value: 'officialprotected'
	}
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

Twinkle.protect.protectionTypesAdmin = [
	{ label: '解除保护', value: 'unprotect' },
	{
		label: '全保护',
		list: [
			{ label: '常规（全）', value: 'pp-protected' },
			{ label: '争议、编辑战（全）', value: 'pp-dispute' }
		]
	},
	{
		label: '模板保护',
		list: [{ label: '高风险模板（模板）', value: 'pp-template' }]
	},
	{
		label: '半保护',
		list: [
			{ label: '常规（半）', value: 'pp-semi-protected' },
			{ label: '持续破坏（半）', value: 'pp-semi-vandalism' },
			{ label: '违反生者传记方针（半）', value: 'pp-semi-blp' },
			{ label: '傀儡破坏（半）', value: 'pp-semi-sock' },
			{ label: '高风险模板（半）', value: 'pp-semi-template' },
			{ label: '被封禁用户滥用讨论页（半）', value: 'pp-semi-usertalk' }
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
].filter(
	(type) =>
	// Filter for templates
		isTemplate || type.label !== '模板保护' && type.label !== '模板保護'
);

Twinkle.protect.protectionTypesCreateOnly = [
	{
		label: '白纸保护',
		list: [
			{ label: '常规（白纸）', value: 'pp-create' },
			{ label: '多次重复创建（白纸）', value: 'pp-create-repeat' },
			{ label: '持续破坏（白纸）', value: 'pp-create-vandalism' },
			{ label: '已封禁用户的用户页（白纸）', value: 'pp-create-userpage' }
		]
	}
];

Twinkle.protect.protectionTypes = Twinkle.protect.protectionTypesAdmin.concat(
	Twinkle.protect.protectionTypesCreateOnly
);

Twinkle.protect.protectionTypesCreate = [{ label: '解除保护', value: 'unprotect' }].concat(
	Twinkle.protect.protectionTypesCreateOnly
);

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
	unprotect: {
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
			{
				label: '{{pp-dispute}}: 争议、编辑战',
				value: 'pp-dispute'
			},
			{
				label: '{{pp-vandalism}}: 破坏',
				value: 'pp-vandalism'
			},
			{
				label: '{{pp-template}}: 高风险模板',
				value: 'pp-template'
			},
			{
				label: '{{pp-module}}: 高风险模块',
				value: 'pp-module'
			},
			{
				label: '{{pp-usertalk}}: 封禁用户讨论页',
				value: 'pp-usertalk'
			},
			{
				label: '{{pp-semi-sock}}: 傀儡破坏',
				value: 'pp-semi-sock'
			},
			{
				label: '{{pp-semi-blp}}: 违反生者传记',
				value: 'pp-semi-blp}'
			},
			{
				label: '{{pp-semi-indef}}: 常规长期半保护',
				value: 'pp-semi-indef'
			},
			{
				label: '{{pp-protected}}: 常规保护',
				value: 'pp-protected'
			}
		]
	},
	{
		label: '移动保护模板',
		list: [
			{
				label: '{{pp-move-dispute}}: 争议、编辑战',
				value: 'pp-move-dispute'
			},
			{
				label: '{{pp-move-vandalism}}: 页面移动破坏',
				value: 'pp-move-vandalism'
			},
			{
				label: '{{pp-move-indef}}: 长期保护',
				value: 'pp-move-indef'
			},
			{
				label: '{{pp-move}}: 常规',
				value: 'pp-move'
			}
		]
	}
];

Twinkle.protect.callback.changePreset = (e) => {
	const form = e.target.form;

	const actiontypes = form.actiontype;
	let actiontype;
	for (let i = 0; i < actiontypes.length; i++) {
		if (!actiontypes[i].checked) {
			continue;
		}
		actiontype = actiontypes[i].values;
		break;
	}

	if (actiontype === 'protect') {
		// actually protecting the page
		const item = Twinkle.protect.protectionPresetsInfo[form.category.value];

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

			form.editexpiry.value = form.moveexpiry.value = item.expiry || '1 week';
		} else {
			if (item.create) {
				form.createlevel.value = item.create;
				Twinkle.protect.formevents.createlevel({ target: form.createlevel });
				form.createexpiry.value = item.createexpiry || '1 week';
			}
			form.createexpiry.value = item.expiry || '1 week';
		}

		const reasonField = actiontype === 'protect' ? form.protectReason : form.reason;
		if (item.reason) {
			reasonField.value = item.reason;
		} else {
			reasonField.value = '';
		}

		// sort out tagging options, disabled if nonexistent or lua
		if (
			mw.config.get('wgArticleId') &&
				mw.config.get('wgPageContentModel') !== 'Scribunto'
		) {
			if (form.category.value === 'unprotect') {
				form.tagtype.value = 'none';
			} else {
				form.tagtype.value = item.template ? item.template : form.category.value;
			}
			Twinkle.protect.formevents.tagtype({ target: form.tagtype });

			if (/template/.test(form.category.value)) {
				form.noinclude.checked = true;
			} else if (mw.config.get('wgNamespaceNumber') !== 10) {
				form.noinclude.checked = false;
			}
		}
	} else {
		// RPP request
		if (form.category.value === 'unprotect') {
			form.expiry.value = '';
			form.expiry.disabled = true;
		} else {
			form.expiry.value = '';
			form.expiry.disabled = false;
		}
	}
};

Twinkle.protect.callback.evaluate = (e) => {
	const form = e.target;
	const input = Morebits.quickForm.getInputData(form);

	let tagparams;
	if (
		input.actiontype === 'tag' ||
			input.actiontype === 'protect' &&
				mw.config.get('wgArticleId') &&
				mw.config.get('wgPageContentModel') !== 'Scribunto'
	) {
		tagparams = {
			tag: input.tagtype,
			reason:
					(input.tagtype === 'pp-protected' ||
						input.tagtype === 'pp-semi-protected' ||
						input.tagtype === 'pp-move') &&
					input.protectReason
						? input.protectReason
						: null,
			showexpiry: input.actiontype === 'protect' ? input.showexpiry : null,
			expiry:
					input.actiontype === 'protect'
						? input.editmodify
							? input.editexpiry
							: input.movemodify
								? input.moveexpiry
								: null
						: null,
			small: input.small,
			noinclude: input.noinclude
		};
	}

	const closeparams = {};
	if (input.close) {
		if (input.category === 'unprotect') {
			closeparams.type = 'unprotect';
		} else if (mw.config.get('wgArticleId')) {
			if (input.editmodify) {
				if (input.editlevel === 'officialprotected') {
					closeparams.type = 'officialprotected';
					closeparams.expiry = input.editexpiry;
				} else if (input.editlevel === 'revisionprotected') {
					closeparams.type = 'revisionprotected';
					closeparams.expiry = input.editexpiry;
				} else if (input.editlevel === 'sysop') {
					closeparams.type = 'full';
					closeparams.expiry = input.editexpiry;
				} else if (input.editlevel === 'templateeditor') {
					closeparams.type = 'temp';
					closeparams.expiry = input.editexpiry;
				} else if (input.editlevel === 'autoconfirmed') {
					closeparams.type = 'semi';
					closeparams.expiry = input.editexpiry;
				}
			} else if (
				input.movemodify &&
					['officialprotected', 'revisionprotected', 'sysop', 'templateeditor'].indexOf(
						input.movelevel
					) !== -1
			) {
				closeparams.type = 'move';
				closeparams.expiry = input.moveexpiry;
			}
		} else {
			if (input.createlevel !== 'all') {
				closeparams.type = 'salt';
				closeparams.expiry = input.createexpiry;
			}
		}
	}

	switch (input.actiontype) {
		case 'protect': {
			// protect the page
			Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			Morebits.wiki.actionCompleted.notice = '保护完成';

			let statusInited = false;
			let thispage;

			const allDone = () => {
				if (thispage) {
					thispage.getStatusElement().info('完成');
				}
				if (tagparams) {
					Twinkle.protect.callbacks.taggingPageInitial(tagparams);
				}
				if (closeparams && closeparams.type) {
					const rppPage = new Morebits.wiki.page('Qiuwen:页面保护请求', '关闭请求');
					rppPage.setFollowRedirect(true);
					rppPage.setCallbackParameters(closeparams);
					rppPage.load(Twinkle.protect.callbacks.closeRequest);
				}
			};

			const protectIt = (next) => {
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
							alert('您需要选择保护层级！');
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
					thispage.setChangeTags(Twinkle.changeTags);
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
				alert(
					'请告诉Twinkle要做什么！\n如果您只是想标记该页，请选择上面的“用保护模板标记此页”选项。'
				);
			}

			break;
		}
		case 'tag':
			// apply a protection template
			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			Morebits.wiki.actionCompleted.redirect = mw.config.get('wgPageName');
			Morebits.wiki.actionCompleted.followRedirect = false;
			Morebits.wiki.actionCompleted.notice = '标记完成';

			Twinkle.protect.callbacks.taggingPageInitial(tagparams);
			break;

		case 'request': {
			// file request at RFPP
			let typename, typereason;
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
				case 'unprotect': {
					const admins = $.map(Twinkle.protect.currentProtectionLevels, (pl) => {
						if (!pl.admin || Twinkle.protect.trustedBots.indexOf(pl.admin) !== -1) {
							return null;
						}
						return `User:${pl.admin}`;
					});
					if (
						admins.length &&
							!confirm(
								`是否已与管理员 (${Morebits.array.uniq(admins).join(', ')})沟通？`
							)
					) {
						return false;
					}
					// otherwise falls through
				}
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

			let reason = typereason;
			if (input.reason !== '') {
				if (typereason !== '') {
					reason += '：';
				}
				reason += input.reason;
			}
			if (reason !== '') {
				reason = Morebits.string.appendPunctuation(reason);
			}

			const rppparams = {
				reason: reason,
				typename: typename,
				category: input.category,
				expiry: input.expiry
			};

			Morebits.simpleWindow.setButtonsEnabled(false);
			Morebits.status.init(form);

			const rppName = 'Qiuwen:页面保护请求';

			// Updating data for the action completed event
			Morebits.wiki.actionCompleted.redirect = rppName;
			Morebits.wiki.actionCompleted.notice = '提名完成，重定向到讨论页';

			const rppPage = new Morebits.wiki.page(rppName, '请求保护页面');
			rppPage.setFollowRedirect(true);
			rppPage.setCallbackParameters(rppparams);
			rppPage.load(Twinkle.protect.callbacks.fileRequest);
			break;
		}
		default:
			alert('twinkleprotect: 未知操作类型');
			break;
	}
};

Twinkle.protect.callbacks = {
	taggingPageInitial: (tagparams) => {
		if (tagparams.tag === 'noop') {
			Morebits.status.info('应用保护模板', '没什么要做的');
			return;
		}

		const pageName = mw.config.get('wgPageName');
		const protectedPage = new Morebits.wiki.page(pageName, '标记页面');
		protectedPage.setCallbackParameters(tagparams);
		protectedPage.load(Twinkle.protect.callbacks.taggingPage);
	},
	getTaggedPage: (params, text) => {
		let tag, summary;

		const oldtag_re =
				/(?:<noinclude>)?[ \t]*\{\{\s*(pp-[^{}]*?|protected|(?:t|v|s|p-|usertalk-v|usertalk-s|sb|move)protected(?:2)?|protected template|privacy protection)\s*?\}\}\s*(?:<\/noinclude>)?\s*/gi;
		const re_result = oldtag_re.exec(text);
		if (re_result) {
			if (
				params.tag === 'none' ||
					confirm(
						`在页面上找到{{${re_result[1]}}}\n单击确定以移除，或单击取消以取消操作。`
					)
			) {
				text = text.replace(oldtag_re, '');
			}
		}

		if (params.tag === 'none') {
			summary = '移除保护模板';
		} else {
			tag = params.tag;
			if (params.reason) {
				tag += `|reason=${params.reason}`;
			}
			if (
				params.showexpiry &&
					params.expiry &&
					!Morebits.string.isInfinity(params.expiry)
			) {
				tag += `|expiry={{subst:#time:c|${params.expiry}}}`;
			}
			if (params.small) {
				tag += '|small=yes';
			}

			if (/^\s*#(?:redirect|重定向|重新導向)/i.test(text)) {
				// redirect page
				// Only tag if no {{rcat shell}} is found
				if (
					!text.match(
						/{{(?:Redirect[ _]category shell|Rcat[ _]shell|This[ _]is a redirect|多种类型重定向|多種類型重定向|多種類型重新導向|多种类型重新导向|R0|其他重定向|RCS|Redirect[ _]shell)/i
					)
				) {
					text = text.replace(
						/#(?:redirect|重定向|重新導向) ?(\[\[.*?\]\])(.*)/i,
						`#REDIRECT $1$2\n\n{{${tag}}}`
					);
				} else {
					Morebits.status.info('已存在Redirect category shell', '没什么可做的');
					return;
				}
			} else {
				if (params.noinclude) {
					tag = `<noinclude>{{${tag}}}</noinclude>`;

					// 只有表格需要单独加回车，其他情况加回车会破坏模板。
					if (text.indexOf('{|') === 0) {
						tag += '\n';
					}
				} else {
					tag = `{{${tag}}}\n`;
				}

				// Insert tag after short description or any hatnotes
				const wikipage = new Morebits.wikitext.page(text);
				text = wikipage.insertAfterTemplates(tag, Twinkle.hatnoteRegex).getText();
			}
			summary = `加入{{${params.tag}}}`;
		}

		return {
			text: text,
			summary: summary
		};
	},
	taggingPage: (protectedPage) => {
		const params = protectedPage.getCallbackParameters();
		const text = protectedPage.getPageText();
		const newVersion = Twinkle.protect.callbacks.getTaggedPage(params, text);
		if (typeof newVersion === 'undefined') {
			protectedPage.getStatusElement().info('完成');
			return;
		}

		protectedPage.setEditSummary(newVersion.summary);
		protectedPage.setChangeTags(Twinkle.changeTags);
		protectedPage.setWatchlist(Twinkle.getPref('watchPPTaggedPages'));
		protectedPage.setPageText(newVersion.text);
		protectedPage.setCreateOption('nocreate');
		protectedPage.suppressProtectWarning(); // no need to let admins know they are editing through protection
		protectedPage.save();
	},

	fileRequest: (rppPage) => {
		const params = rppPage.getCallbackParameters();
		let text = rppPage.getPageText();
		const statusElement = rppPage.getStatusElement();

		const rppRe = new RegExp(
			`===\\s*(\\[\\[)?\\s*:?\\s*${Morebits.string.escapeRegExp(
				Morebits.pageNameNorm
			)}\\s*(\\]\\])?\\s*===`,
			'm'
		);
		const tag = rppRe.exec(text);

		const rppLink = document.createElement('a');
		rppLink.setAttribute('href', mw.util.getUrl(rppPage.getPageName()));
		rppLink.appendChild(document.createTextNode(rppPage.getPageName()));

		if (tag) {
			statusElement.error([rppLink, '已有对此页面的保护提名，取消操作。']);
			return;
		}

		let newtag = `=== [[:${mw.config.get('wgPageName')}]] ===\n`;
		if (
			new RegExp(`^${mw.util.escapeRegExp(newtag).replace(/\s+/g, '\\s*')}`, 'm').test(
				text
			)
		) {
			statusElement.error([rppLink, '已有对此页面的保护提名，取消操作。']);
			return;
		}

		let words;
		switch (params.expiry) {
			case 'temporary':
				words = '临时';
				break;
			case 'infinity':
				words = '永久';
				break;
			default:
				words = '';
				break;
		}

		words += params.typename;

		newtag += `* <small>当前保护状态：{{protection status|${mw.config.get(
			'wgPageName'
		)}}}</small>\n`;
		newtag +=
				`请求${Morebits.string.toUpperCaseFirstChar(words)}${
					params.reason !== ''
						? `：${Morebits.string.formatReasonText(params.reason)}`
						: '。'
				}--~~` + '~~';

		let reg;

		if (params.category === 'unprotect') {
			reg = /(==\s*请求解除保护\s*==)/;
		} else {
			reg = /({{\s*\/header\s*}})/;
		}

		const originalTextLength = text.length;
		text = text.replace(reg, `$1\n${newtag}\n`);
		if (text.length === originalTextLength) {
			statusElement.error(['无法在QW:RFPP上找到相关定位点标记。']);
			return;
		}
		statusElement.status('加入新提名…');
		rppPage.setEditSummary(
			`/* ${Morebits.pageNameNorm} */ 请求对[[${Morebits.pageNameNorm}]]${params.typename}`
		);
		rppPage.setChangeTags(Twinkle.changeTags);
		rppPage.setPageText(text);
		rppPage.setCreateOption('recreate');
		rppPage.save(() => {
			// Watch the page being requested
			const watchPref = Twinkle.getPref('watchRequestedPages');
			// action=watch has no way to rely on user preferences (T262912), so we do it manually.
			// The watchdefault pref appears to reliably return '1' (string),
			// but that's not consistent among prefs so might as well be "correct"
			const watch =
					watchPref !== 'no' &&
					(watchPref !== 'default' ||
						!!parseInt(mw.user.options.get('watchdefault'), 10));
			if (watch) {
				const watch_query = {
					action: 'watch',
					titles: mw.config.get('wgPageName'),
					token: mw.user.tokens.get('watchToken')
				};
					// Only add the expiry if page is unwatched or already temporarily watched
				if (
					Twinkle.protect.watched !== true &&
						watchPref !== 'default' &&
						watchPref !== 'yes'
				) {
					watch_query.expiry = watchPref;
				}
				new Morebits.wiki.api('将请求保护的页面加入到监视列表', watch_query).post();
			}
		});
	},

	closeRequest: (rppPage) => {
		const params = rppPage.getCallbackParameters();
		let text = rppPage.getPageText();
		const statusElement = rppPage.getStatusElement();

		const sections = text.split(/(?=\n==\s*请求解除保护\s*==)/);

		if (sections.length !== 2) {
			statusElement.error(['无法在QW:RFPP上找到相关定位点标记。']);
			return;
		}

		let sectionText,
			expiryText = '';
		if (params.type === 'unprotect') {
			sectionText = sections[1];
		} else {
			sectionText = sections[0];
			expiryText = Morebits.string.formatTime(params.expiry);
		}

		const requestList = sectionText.split(/(?=\n===.+===\s*\n)/);

		let found = false;
		const rppRe = new RegExp(
			`===\\s*(\\[\\[)?\\s*:?\\s*${Morebits.pageNameRegex(
				Morebits.pageNameNorm
			)}\\s*(\\]\\])?\\s*===`,
			'm'
		);
		for (let i = 1; i < requestList.length; i++) {
			if (rppRe.exec(requestList[i])) {
				requestList[i] = requestList[i].trimRight();
				if (params.type === 'unprotect') {
					requestList[i] += '\n: {{RFPP|isun}}。--~~' + '~~\n';
				} else {
					requestList[i] +=
							`\n: {{RFPP|${params.type}|${
								Morebits.string.isInfinity(params.expiry) ? 'infinity' : expiryText
							}}}。--~~` + '~~\n';
				}
				found = true;
				break;
			}
		}

		if (!found) {
			statusElement.warn('没有找到相关的请求');
			return;
		}

		if (params.type === 'unprotect') {
			text = sections[0] + requestList.join('');
		} else {
			text = requestList.join('') + sections[1];
		}

		let summary = '';

		if (params.type === 'unprotect') {
			sectionText = sections[1];
		} else {
			sectionText = sections[0];
		}
		switch (params.type) {
			case 'semi':
				summary = '半保护';
				break;
			case 'temp':
				summary = '模板保护';
				break;
			case 'full':
				summary = '全保护';
				break;
			case 'revisionprotected':
				summary = '版本保护';
				break;
			case 'officialprotected':
				summary = '裁委会保护';
				break;
			case 'move':
				summary = '移动保护';
				break;
			case 'salt':
				summary = '白纸保护';
				break;
			case 'unprotect':
				summary = '解除保护';
				break;
			default:
				statusElement.warn('未知保护类型');
				return;
		}

		if (Morebits.string.isInfinity(params.expiry)) {
			summary = expiryText + summary;
		} else {
			summary += expiryText;
		}

		rppPage.setEditSummary(`/* ${Morebits.pageNameNorm} */ ${summary}`);
		rppPage.setChangeTags(Twinkle.changeTags);
		rppPage.setPageText(text);
		rppPage.save();
	}
};

Twinkle.protect.formatProtectionDescription = (protectionLevels) => {
	const protectionNode = [];

	if (!$.isEmptyObject(protectionLevels)) {
		$.each(protectionLevels, (type, settings) => {
			let label;
			switch (type) {
				case 'edit':
					label = '编辑';
					break;
				case 'move':
					label = '移动';
					break;
				case 'create':
					label = '创建';
					break;
				default:
					label = type;
					break;
			}
			let level;
			switch (settings.level) {
				case 'officialprotected':
					level = '仅允许裁决委员';
					break;
				case 'revisionprotected':
					level = '仅允许资深用户';
					break;
				case 'sysop':
					level = '仅管理员';
					break;
				case 'templateeditor':
					level = '仅模板编辑员和管理员';
					break;
				case 'autoconfirmed':
					level = '仅允许自动确认用户';
					break;
				default:
					level = settings.level;
					break;
			}
			protectionNode.push($(`<b>${label}：${level}</b>`)[0]);
			if (Morebits.string.isInfinity(settings.expiry)) {
				protectionNode.push('（无限期）');
			} else {
				protectionNode.push(
					`（过期：${new Morebits.date(settings.expiry).calendar('utc')}）`
				);
			}
			if (settings.cascade) {
				protectionNode.push('（连锁）');
			}
		});
	} else {
		protectionNode.push($('<b>无保护</b>')[0]);
	}

	return protectionNode;
};

Twinkle.addInitCallback(Twinkle.protect, 'protect');
})(jQuery);
/* </nowiki> */
