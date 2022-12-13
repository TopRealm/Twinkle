/**
 * SPDX-License-Identifier: CC-BY-SA-4.0
 * _addText: '{{Gadget Header|license=CC-BY-SA-4.0}}'
 *
 * @source https://git.qiuwen.wiki/InterfaceAdmin/Twinkle
 * @author © 2011-2022 English Wikipedia Contributors
 * @author © 2011-2021 Chinese Wikipedia Contributors
 * @author © 2021-     Qiuwen Baike Contributors
 * @license <https://creativecommons.org/licenses/by-sa/4.0/>
 */
/* Twinkle.js - twinkleconfig.js */

/* <nowiki> */
(function ($) {
/*
 ****************************************
 *** twinkleconfig.js: Preferences module
 ****************************************
 * Mode of invocation:  Adds configuration form to Help:Twinkle/参数设置,
 *                      and adds an ad box to the top of user subpages belonging to the
 *                      currently logged-in user which end in '.js'
 * Active on:           What I just said. Yeah.
 */

Twinkle.config = {};
Twinkle.config.watchlistEnums = {
	'yes': '加入监视列表，长期监视',
	'no': '不加入监视列表',
	'default': '遵守站点设置',
	'1 week': '加入监视列表，监视7日',
	'1 month': '加入监视列表，监视1个月',
	'3 months': '加入监视列表，监视3个月',
	'6 months': '加入监视列表，监视6个月'
};
Twinkle.config.commonSets = {
	csdCriteria: {
		db: '自定义理由（{{db}}）',
		g1: 'G1', g2: 'G2', g3: 'G3', g4: 'G4', g5: 'G5', g6: 'G6', g7: 'G7', g8: 'G8', g9: 'G9',
		a1: 'A1', a2: 'A2', a3: 'A3',
		o1: 'O1', o2: 'O2', o3: 'O3',
		f1: 'F1', f2: 'F2',
		r1: 'R1', r2: 'R2'
	},
	csdCriteriaDisplayOrder: [
		'db',
		'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9',
		'a1', 'a2', 'a3',
		'o1', 'o2', 'o3',
		'f1', 'f2',
		'r1', 'r2'
	],
	csdCriteriaNotification: {
		db: '自定义理由（{{db}}）',
		g1: 'G1', g2: 'G2', g3: 'G3', g4: 'G4', g5: 'G5', g6: 'G6', g7: 'G7', g8: 'G8', g9: 'G9',
		a1: 'A1', a2: 'A2', a3: 'A3',
		o1: 'O1', o2: 'O2', o3: 'O3',
		f1: 'F1', f2: 'F2',
		r1: 'R1', r2: 'R2'
	},
	csdCriteriaNotificationDisplayOrder: [ 'db', 'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9', 'a1', 'a2', 'a3', 'o1', 'o2', 'o3', 'f1', 'f2', 'r1', 'r2' ],
	csdAndDICriteria: {
		db: '自定义理由（{{db}}）',
		g1: 'G1', g2: 'G2', g3: 'G3', g4: 'G4', g5: 'G5', g6: 'G6', g7: 'G7', g8: 'G8', g9: 'G9',
		a1: 'A1', a2: 'A2', a3: 'A3',
		o1: 'O1', o2: 'O2', o3: 'O3',
		f1: 'F1', f2: 'F2',
		r1: 'R1', r2: 'R2'
	},
	csdAndDICriteriaDisplayOrder: [
		'db',
		'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9',
		'a1', 'a2', 'a3',
		'o1', 'o2', 'o3',
		'f1', 'f2',
		'r1', 'r2'
	],
	namespacesNoSpecial: {
		0: '（条目）',
		1: 'Talk',
		2: 'User',
		3: 'User talk',
		4: 'Qiuwen',
		5: 'Qiuwen talk',
		6: 'File',
		7: 'File talk',
		8: 'MediaWiki',
		9: 'MediaWiki talk',
		10: 'Template',
		11: 'Template talk',
		12: 'Help',
		13: 'Help talk',
		14: 'Category',
		15: 'Category talk',
		118: 'Draft',
		119: 'Draft talk',
		828: 'Module',
		829: 'Module talk'
	}
};

/**
 * Section entry format:
 *
 * {
 *   title: <human-readable section title>,
 *   module: <name of the associated module, used to link to sections>,
 *   adminOnly: <true for admin-only sections>,
 *   hidden: <true for advanced preferences that rarely need to be changed - they can still be modified by manually editing twinkleoptions.js>,
 *   preferences: [
 *     {
 *       name: <TwinkleConfig property name>,
 *       label: <human-readable short description - used as a form label>,
 *       helptip: <(optional) human-readable text (using valid HTML) that complements the description, like limits, warnings, etc.>
 *       adminOnly: <true for admin-only preferences>,
 *       type: <string|boolean|integer|enum|set|customList> (customList stores an array of JSON objects { value, label }),
 *       enumValues: <for type = "enum": a JSON object where the keys are the internal names and the values are human-readable strings>,
 *       setValues: <for type = "set": a JSON object where the keys are the internal names and the values are human-readable strings>,
 *       setDisplayOrder: <(optional) for type = "set": an array containing the keys of setValues (as strings) in the order that they are displayed>,
 *       customListValueTitle: <for type = "customList": the heading for the left "value" column in the custom list editor>,
 *       customListLabelTitle: <for type = "customList": the heading for the right "label" column in the custom list editor>
 *     },
 *     . . .
 *   ]
 * },
 * . . .
 *
 */

Twinkle.config.sections = [ {
	title: '常规',
	module: 'general',
	preferences: [
		// TwinkleConfig.userTalkPageMode may take arguments:
		// 'window': open a new window, remember the opened window
		// 'tab': opens in a new tab, if possible.
		// 'blank': force open in a new window, even if such a window exists
		{
			name: 'userTalkPageMode',
			label: '当要打开用户讨论页时',
			type: 'enum',
			enumValues: {
				window: '在窗口中，替换成其它用户讨论页',
				tab: '在新标签页中',
				blank: '在新窗口中'
			}
		},
		// TwinkleConfig.dialogLargeFont (boolean)
		{
			name: 'dialogLargeFont',
			label: '在Twinkle对话框中使用大号字体',
			type: 'boolean'
		},
		// Twinkle.config.disabledModules (array)
		{
			name: 'disabledModules',
			label: '关闭指定的Twinkle模块',
			helptip: '被勾选的功能将被禁用；取消勾选以重新启用功能',
			type: 'set',
			setValues: {
				arv: '告状',
				warn: '警告',
				talkback: '通知',
				speedy: '速删',
				xfd: '提删',
				image: '文件',
				protect: '保护',
				tag: '标记',
				diff: '差异',
				unlink: '链入',
				fluff: '撤销'
			}
		},
		// Twinkle.config.disabledSysopModules (array)
		{
			name: 'disabledSysopModules',
			label: '关闭指定的Twinkle管理员模块',
			helptip: '被勾选的功能将被禁用；取消勾选以重新启用功能',
			adminOnly: true,
			type: 'set',
			setValues: {
				block: '封禁',
				batchdelete: '批删',
				batchprotect: '批保',
				batchundelete: '批复'
			}
		} ]
}, {
	title: '封禁',
	module: 'block',
	adminOnly: true,
	preferences: [
		// TwinkleConfig.defaultToBlock64 (boolean)
		// Whether to default to just blocking the /64 on or off
		{
			name: 'defaultToBlock64',
			label: '开启后，封禁对象为IPv6地址时将默认封禁/64地址块',
			type: 'boolean'
		},
		// TwinkleConfig.defaultToPartialBlocks (boolean)
		// Whether to default partial blocks on or off
		{
			name: 'defaultToPartialBlocks',
			label: '打开封禁菜单时默认选择部分封禁',
			helptip: '若该用户已封禁，该选项将被覆盖为对应现有封禁类型的默认选项',
			type: 'boolean'
		},
		// TwinkleConfig.blankTalkpageOnIndefBlock (boolean)
		// if true, blank the talk page when issuing an indef block notice (per [[QW:UWUL#Indefinitely blocked users]])
		{
			name: 'blankTalkpageOnIndefBlock',
			label: '当永封用户时，清空其用户讨论页',
			type: 'boolean'
		} ]
}, {
	title: '文件（图权）',
	module: 'image',
	preferences: [
		// TwinkleConfig.notifyUserOnDeli (boolean)
		// If the user should be notified after placing a file deletion tag
		{
			name: 'notifyUserOnDeli',
			label: '默认勾选“通知创建者”',
			type: 'boolean'
		},
		// TwinkleConfig.deliWatchPage (string)
		// The watchlist setting of the page tagged for deletion.
		{
			name: 'deliWatchPage',
			label: '标记图片时加入到监视列表',
			type: 'enum',
			enumValues: Twinkle.config.watchlistEnums
		},
		// TwinkleConfig.deliWatchUser (string)
		// The watchlist setting of the user talk page if a notification is placed.
		{
			name: 'deliWatchUser',
			label: '标记图片时，将文件上传者讨论页添加到监视列表',
			type: 'enum',
			enumValues: Twinkle.config.watchlistEnums
		} ]
}, {
	title: '保护',
	module: 'protect',
	preferences: [ {
		name: 'watchRequestedPages',
		label: '请求保护页面时，将被保护页面加入到监视列表',
		type: 'enum',
		enumValues: Twinkle.config.watchlistEnums
	}, {
		name: 'watchPPTaggedPages',
		label: '标记保护模板时，将被保护页面加入到监视列表',
		type: 'enum',
		enumValues: Twinkle.config.watchlistEnums
	}, {
		name: 'watchProtectedPages',
		label: '实施页面保护时，将被保护页面加入到监视列表',
		helptip: '如果在保护后也标记页面，则使用标记页面的参数设置。',
		adminOnly: true,
		type: 'enum',
		enumValues: Twinkle.config.watchlistEnums
	} ]
}, {
	title: '撤销',
	// twinklefluff module
	module: 'fluff',
	preferences: [
		// TwinkleConfig.autoMenuAfterRollback (bool)
		// Option to automatically open the warning menu if the user talk page is opened post-reversion
		{
			name: 'autoMenuAfterRollback',
			label: '使用Twinkle撤销编辑后，自动打开用户讨论页上的Twinkle警告菜单',
			helptip: '需要至少启用下方一个选项',
			type: 'boolean'
		},
		// TwinkleConfig.openTalkPage (array)
		// What types of actions that should result in opening of talk page
		{
			name: 'openTalkPage',
			label: '实施下列撤销后，跳转至用户讨论页',
			type: 'set',
			setValues: {
				agf: '假定善意撤销',
				norm: '常规撤销',
				vand: '反破坏撤销'
			}
		},
		// TwinkleConfig.openTalkPageOnAutoRevert (bool)
		// Defines if talk page should be opened when calling revert from contribs or recent changes pages. If set to true, openTalkPage defines then if talk page will be opened.
		{
			name: 'openTalkPageOnAutoRevert',
			label: '在用户贡献、最近更改等发起撤销后，打开用户讨论页',
			helptip: '本选项依赖前一设置，前一设置生效后，本选项方生效',
			type: 'boolean'
		},
		// TwinkleConfig.rollbackInPlace (bool)
		//
		{
			name: 'rollbackInPlace',
			label: '在用户贡献、最近更改等发起撤销后，不刷新页面',
			helptip: '当它打开时，Twinkle将不会在从用户贡献及最近更改中发起撤销时刷新页面，允许您一次性撤销多个编辑。',
			type: 'boolean'
		},
		// TwinkleConfig.markRevertedPagesAsMinor (array)
		// What types of actions that should result in marking edit as minor
		{
			name: 'markRevertedPagesAsMinor',
			label: '实施下列撤销时，将其标记为小编辑',
			type: 'set',
			setValues: {
				agf: '假定善意撤销',
				norm: '常规撤销',
				vand: '反破坏撤销',
				torev: '“恢复此版本”'
			}
		},
		// TwinkleConfig.watchRevertedPages (array)
		// What types of actions that should result in forced addition to watchlist
		{
			name: 'watchRevertedPages',
			label: '实施下列撤销时，将页面加入监视列表',
			type: 'set',
			setValues: {
				agf: '假定善意撤销',
				norm: '常规撤销',
				vand: '反破坏撤销',
				torev: '“恢复此版本”'
			}
		},
		// TwinkleConfig.watchRevertedExpiry
		// If any of the above items are selected, whether to expire the watch
		{
			name: 'watchRevertedExpiry',
			label: '实施撤销时，页面的监视期限',
			type: 'enum',
			enumValues: Twinkle.config.watchlistEnums
		},
		// TwinkleConfig.offerReasonOnNormalRevert (boolean)
		// If to offer a prompt for extra summary reason for normal reverts, default to true
		{
			name: 'offerReasonOnNormalRevert',
			label: '常规撤销时，询问理由',
			helptip: '“常规撤销”指点击页面中的“[撤销]”链接。',
			type: 'boolean'
		}, {
			name: 'confirmOnFluff',
			label: '撤销前，要求二次确认（所有设备）',
			helptip: '对于移动设备用户；或者，容易冲动操作的用户',
			type: 'boolean'
		}, {
			name: 'confirmOnMobileFluff',
			label: '撤销前，要求二次确认（仅移动设备）',
			helptip: '避免在移动设备意外点击“[撤销]”',
			type: 'boolean'
		},
		// TwinkleConfig.showRollbackLinks (array)
		// Where Twinkle should show rollback links:
		// diff, others, mine, contribs, history, recent
		// Note from TTO: |contribs| seems to be equal to |others| + |mine|, i.e. redundant, so I left it out heres
		{
			name: 'showRollbackLinks',
			label: '在这些页面上显示“撤销”链接',
			type: 'set',
			setValues: {
				diff: '差异',
				others: '其他用户的贡献',
				mine: '我的贡献',
				recent: '最近更改',
				history: '历史记录'
			}
		}, {
			name: 'customRevertSummary',
			label: '回退理由',
			helptip: '在查看差异时可选，仅善意回退、常规回退、恢复此版本',
			type: 'customList',
			customListValueTitle: '理由',
			customListLabelTitle: '显示的文字'
		} ]
}, {
	title: '快速删除',
	module: 'speedy',
	preferences: [ {
		name: 'speedySelectionStyle',
		label: '何时执行标记或删除',
		type: 'enum',
		enumValues: {
			buttonClick: '当点击“提交”时',
			radioClick: '当我点击任一选项时'
		}
	},
	// TwinkleConfig.watchSpeedyPages (array)
	// Whether to add speedy tagged or deleted pages to watchlist
	{
		name: 'watchSpeedyPages',
		label: '使用下列理由时，将相关页面加入到监视列表',
		type: 'set',
		setValues: Twinkle.config.commonSets.csdCriteria,
		setDisplayOrder: Twinkle.config.commonSets.csdCriteriaDisplayOrder
	},
	// TwinkleConfig.watchSpeedyExpiry
	// If any of the above items are selected, whether to expire the watch
	{
		name: 'watchSpeedyExpiry',
		label: '当标记页面时，页面的监视期限',
		type: 'enum',
		enumValues: Twinkle.config.watchlistEnums
	},
	// TwinkleConfig.markSpeedyPagesAsPatrolled (boolean)
	// If, when applying speedy template to page, to mark the page as patrolled (if the page was reached from NewPages)
	{
		name: 'markSpeedyPagesAsPatrolled',
		label: '当标记页面时，标记页面为已巡查（若可能）',
		helptip: '建议不勾选，这可能有违页面巡查功能的初衷',
		type: 'boolean'
	},
	// TwinkleConfig.watchSpeedyUser (string)
	// The watchlist setting of the user talk page if they receive a notification.
	{
		name: 'watchSpeedyUser',
		label: '当标记页面时，创建者用户讨论页的监视期限',
		type: 'enum',
		enumValues: Twinkle.config.watchlistEnums
	},
	// TwinkleConfig.notifyUserOnSpeedyDeletionNomination (array)
	// What types of actions should result in the author of the page being notified of nomination
	{
		name: 'notifyUserOnSpeedyDeletionNomination',
		label: '使用下列理由标记页面后，通知页面创建者',
		helptip: '尽管您在对话框中选择通知，通知也只会在使用这些理由时发出。',
		type: 'set',
		setValues: Twinkle.config.commonSets.csdCriteriaNotification,
		setDisplayOrder: Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder
	},
	// TwinkleConfig.warnUserOnSpeedyDelete (array)
	// What types of actions should result in the author of the page being notified of speedy deletion (admin only)
	{
		name: 'warnUserOnSpeedyDelete',
		label: '使用下列理由标记页面后，警告页面创建者',
		helptip: '尽管您在对话框中选择通知，警告也只会在使用这些理由时发出。',
		adminOnly: true,
		type: 'set',
		setValues: Twinkle.config.commonSets.csdCriteriaNotification,
		setDisplayOrder: Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder
	},
	// TwinkleConfig.promptForSpeedyDeletionSummary (array of strings)
	{
		name: 'promptForSpeedyDeletionSummary',
		label: '使用下列理由标记页面时，允许编辑删除摘要',
		adminOnly: true,
		type: 'set',
		setValues: Twinkle.config.commonSets.csdAndDICriteria,
		setDisplayOrder: Twinkle.config.commonSets.csdAndDICriteriaDisplayOrder
	},
	// TwinkleConfig.deleteTalkPageOnDelete (boolean)
	// If talk page if exists should also be deleted (CSD G8) when spedying a page (admin only)
	{
		name: 'deleteTalkPageOnDelete',
		label: '默认勾选“删除讨论页”',
		adminOnly: true,
		type: 'boolean'
	}, {
		name: 'deleteRedirectsOnDelete',
		label: '默认勾选“删除重定向”',
		adminOnly: true,
		type: 'boolean'
	},
	// TwinkleConfig.deleteSysopDefaultToDelete (boolean)
	// Make the CSD screen default to "delete" instead of "tag" (admin only)
	{
		name: 'deleteSysopDefaultToDelete',
		label: '默认为直接删除而不是标记',
		helptip: '若页面已有快速删除标记，则默认为直接删除，而非标记。',
		adminOnly: true,
		type: 'boolean'
	},
	// TwinkleConfig.speedyWindowWidth (integer)
	// Defines the width of the Twinkle SD window in pixels
	{
		name: 'speedyWindowWidth',
		label: '快速删除对话框宽度（像素）',
		type: 'integer'
	},
	// TwinkleConfig.speedyWindowWidth (integer)
	// Defines the width of the Twinkle SD window in pixels
	{
		name: 'speedyWindowHeight',
		label: '快速删除对话框高度（像素）',
		helptip: '如果您的屏幕很大，您可以将此调高。',
		type: 'integer'
	}, {
		name: 'logSpeedyNominations',
		label: '在用户空间中记录所有快速删除提名',
		helptip: '非管理员无法访问到已删除的贡献，可以使用用户空间日志予以记录。',
		type: 'boolean'
	}, {
		name: 'speedyLogPageName',
		label: '在此页保留日志',
		helptip: '在此框中输入子页面名称，您将在User:<i>用户名</i>/<i>子页面</i>找到CSD日志。仅在启用日志时工作。',
		type: 'string'
	}, {
		name: 'noLogOnSpeedyNomination',
		label: '使用下列理由标记页面时，不作日志记录',
		type: 'set',
		setValues: Twinkle.config.commonSets.csdAndDICriteria,
		setDisplayOrder: Twinkle.config.commonSets.csdAndDICriteriaDisplayOrder
	} ]
},
// translation in tag part is **not** perfected (issue #4)
{
	title: '标记',
	module: 'tag',
	preferences: [ {
		name: 'watchTaggedVenues',
		label: '当标记下列各类页面时，加入监视列表',
		type: 'set',
		setValues: {
			articles: '条目',
			drafts: '草稿',
			redirects: '重定向',
			files: '文件'
		}
	}, {
		name: 'watchTaggedPages',
		label: '当标记页面时，页面的监视期限',
		type: 'enum',
		enumValues: Twinkle.config.watchlistEnums
	}, {
		name: 'watchMergeDiscussions',
		label: '当请求合并页面时，页面的监视期限',
		type: 'enum',
		enumValues: Twinkle.config.watchlistEnums
	}, {
		name: 'markTaggedPagesAsMinor',
		label: '将标记页面的编辑设为小修改',
		type: 'boolean'
	}, {
		name: 'markTaggedPagesAsPatrolled',
		label: '默认勾选“标记页面为已巡查”框',
		type: 'boolean'
	}, {
		name: 'groupByDefault',
		label: '默认勾选“合并到{{multiple issues}}”复选框',
		type: 'boolean'
	}, {
		name: 'tagArticleSortOrder',
		label: '条目标记的默认查看方式',
		type: 'enum',
		enumValues: {
			cat: '按类别',
			alpha: '按字母序'
		}
	}, {
		name: 'customTagList',
		label: '自定义条目维护标记',
		helptip: '这些标记会出现在列表的末尾。',
		type: 'customList',
		customListValueTitle: '模板名（不含大括号）',
		customListLabelTitle: '显示的文字'
	}, {
		name: 'customFileTagList',
		label: '自定义文件维护标记',
		helptip: '这些会出现在列表的末尾。',
		type: 'customList',
		customListValueTitle: '模板名（不含大括号）',
		customListLabelTitle: '显示的文字'
	}, {
		name: 'customRedirectTagList',
		label: '自定义重定向维护标记',
		helptip: '这些会出现在列表的末尾。',
		type: 'customList',
		customListValueTitle: '模板名（不含大括号）',
		customListLabelTitle: '显示的文字'
	} ]
}, {
	title: '回复',
	module: 'talkback',
	preferences: [ {
		name: 'markTalkbackAsMinor',
		label: '将回复标记为小修改',
		type: 'boolean'
	}, {
		name: 'insertTalkbackSignature',
		label: '回复时加入签名',
		helptip: 'Flow页除外。',
		type: 'boolean'
	}, {
		name: 'talkbackHeading',
		label: '回复所用的小节标题',
		type: 'string'
	}, {
		name: 'mailHeading',
		label: '“有新邮件”所用的小节标题',
		type: 'string'
	} ]
}, {
	title: '取消链入',
	module: 'unlink',
	preferences: [
		// TwinkleConfig.unlinkNamespaces (array)
		// In what namespaces unlink should happen, default in 0 (article)
		{
			name: 'unlinkNamespaces',
			label: '取消以下命名空间中的反向链接',
			helptip: '请避免选择讨论页，这样会导致Twinkle试图修改讨论存档。',
			type: 'set',
			setValues: Twinkle.config.commonSets.namespacesNoSpecial
		} ]
}, {
	title: '警告用户',
	module: 'warn',
	preferences: [
		// TwinkleConfig.defaultWarningGroup (int)
		// if true, watch the page which has been dispatched an warning or notice, if false, default applies
		{
			name: 'defaultWarningGroup',
			label: '默认警告级别',
			type: 'enum',
			enumValues: {
				1: '1：提醒',
				2: '2：注意',
				3: '3：警告',
				4: '4：最后警告',
				5: '4im：唯一警告',
				6: '单层级提醒',
				7: '单层级警告',
				// 8 was used for block templates before #260
				9: '自定义警告',
				10: '所有警告模板',
				11: '自动选择层级（1-4）'
			}
		},
		// TwinkleConfig.combinedSingletMenus (boolean)
		// if true, show one menu with both single-issue notices and warnings instead of two separately
		{
			name: 'combinedSingletMenus',
			label: '将两个单层级菜单合并成一个',
			helptip: '当启用此选项时，无论默认警告级别选择单层级通知或单层级警告皆属于同一项。',
			type: 'boolean'
		},
		// TwinkleConfig.watchWarnings (string)
		// Watchlist setting for the page which has been dispatched an warning or notice
		{
			name: 'watchWarnings',
			label: '警告时加入用户讨论页到监视列表',
			helptip: '注意：如果对方使用Flow，对应讨论串总会加到监视列表中。',
			type: 'enum',
			enumValues: Twinkle.config.watchlistEnums
		},
		// TwinkleConfig.oldSelect (boolean)
		// if true, use the native select menu rather the jquery chosen-based one
		{
			name: 'oldSelect',
			label: '使用不可搜索的经典菜单',
			type: 'boolean'
		}, {
			name: 'customWarningList',
			label: '自定义警告模板',
			helptip: '您可以加入模板或用户子页面。自定义警告会出现在警告对话框中“自定义警告”一节。',
			type: 'customList',
			customListValueTitle: '模板名（不含大括号）',
			customListLabelTitle: '显示的文字（和编辑摘要）'
		} ]
}, {
	title: '存废讨论',
	module: 'xfd',
	preferences: [ {
		name: 'logXfdNominations',
		label: '在用户空间中记录所有存废讨论提名',
		helptip: '该日志供您追踪所有通过Twinkle提交的存废讨论',
		type: 'boolean'
	}, {
		name: 'xfdLogPageName',
		label: '在此页保留日志',
		helptip: '在此框中输入子页面名称，您将在User:<i>用户名</i>/<i>子页面</i>找到XFD日志。仅在启用日志时工作。',
		type: 'string'
	}, {
		name: 'noLogOnXfdNomination',
		label: '在使用以下理由时不做记录',
		type: 'set',
		setValues: {
			afd: 'AfD',
			tfd: 'TfD',
			ffd: 'FfD',
			cfd: 'CfD',
			cfds: 'CfD/S',
			mfd: 'MfD',
			rfd: 'RfD',
			rm: 'RM'
		}
		// TODO: remove redundant values from setValues
	},
	// TwinkleConfig.xfdWatchPage (string)
	// The watchlist setting of the page being nominated for XfD.
	{
		name: 'xfdWatchPage',
		label: '加入提名的页面到监视列表',
		type: 'enum',
		enumValues: Twinkle.config.watchlistEnums
	},
	// TwinkleConfig.xfdWatchDiscussion (string)
	// The watchlist setting of the newly created XfD page (for those processes that create discussion pages for each nomination),
	// or the list page for the other processes.
	{
		name: 'xfdWatchDiscussion',
		label: '加入存废讨论页到监视列表',
		helptip: '当日的存废讨论页面。',
		type: 'enum',
		enumValues: Twinkle.config.watchlistEnums
	},
	// TwinkleConfig.xfdWatchList (string)
	// The watchlist setting of the XfD list page, *if* the discussion is on a separate page.
	{
		name: 'xfdWatchList',
		label: '加入当日存废讨论页到监视列表（仅在AfD和MfD时）',
		helptip: '当且仅当AfD和MfD时工作，用于监视对应日期的存废讨论页。',
		type: 'enum',
		enumValues: Twinkle.config.watchlistEnums
	},
	// TwinkleConfig.xfdWatchUser (string)
	// The watchlist setting of the user talk page if they receive a notification.
	{
		name: 'xfdWatchUser',
		label: '加入创建者讨论页到监视列表（在通知时）',
		type: 'enum',
		enumValues: Twinkle.config.watchlistEnums
	},
	// TwinkleConfig.xfdWatchRelated (string)
	// The watchlist setting of the target of a redirect being nominated for RfD.
	{
		name: 'xfdWatchRelated',
		label: '加入重定向目标页到监视列表（在通知时）',
		helptip: '仅在RfD创建对应讨论页通知时工作。',
		type: 'enum',
		enumValues: Twinkle.config.watchlistEnums
	}, {
		name: 'markXfdPagesAsPatrolled',
		label: '标记时标记页面为已巡查（如可能）',
		type: 'boolean'
	} ]
}, {
	title: '隐藏',
	hidden: true,
	preferences: [
		// twinkle.js: portlet setup
		{
			name: 'portletArea',
			type: 'string'
		}, {
			name: 'portletId',
			type: 'string'
		}, {
			name: 'portletName',
			type: 'string'
		}, {
			name: 'portletType',
			type: 'string'
		}, {
			name: 'portletNext',
			type: 'string'
		},
		// twinklefluff.js: defines how many revision to query maximum, maximum possible is 50, default is 50
		{
			name: 'revertMaxRevisions',
			type: 'integer'
		},
		// twinklebatchdelete.js: How many pages should be processed maximum
		{
			name: 'batchMax',
			type: 'integer',
			adminOnly: true
		},
		// How many pages should be processed at a time by deprod and batchdelete/protect/undelete
		{
			name: 'batchChunks',
			type: 'integer',
			adminOnly: true
		},
		// twinklewarn.js: When using the autolevel select option, how many days makes a prior warning stale
		// Huggle is three days ([[Special:Diff/918980316]] and [[Special:Diff/919417999]]) while ClueBotNG is two:
		// https://github.com/DamianZaremba/cluebotng/blob/4958e25d6874cba01c75f11debd2e511fd5a2ce5/bot/action_functions.php#L62
		{
			name: 'autolevelStaleDays',
			type: 'integer'
		} ]
} ]; // end of Twinkle.config.sections

Twinkle.config.init = function twinkleconfigInit() {
	// create the config page at Qiuwen:Twinkle/Preferences
	if (mw.config.get('wgNamespaceNumber') === mw.config.get('wgNamespaceIds').help && mw.config.get('wgTitle') === 'Twinkle/参数设置' && mw.config.get('wgAction') === 'view') {
		if (!document.getElementById('twinkle-config')) {
			return; // maybe the page is misconfigured, or something - but any attempt to modify it will be pointless
		}

		// set style (the url() CSS function doesn't seem to work from wikicode - ?!)
		document.getElementById('twinkle-config-titlebar').style.backgroundImage = 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAkCAMAAAB%2FqqA%2BAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAEhQTFRFr73ZobTPusjdsMHZp7nVwtDhzNbnwM3fu8jdq7vUt8nbxtDkw9DhpbfSvMrfssPZqLvVztbno7bRrr7W1d%2Fs1N7qydXk0NjpkW7Q%2BgAAADVJREFUeNoMwgESQCAAAMGLkEIi%2FP%2BnbnbpdB59app5Vdg0sXAoMZCpGoFbK6ciuy6FX4ABAEyoAef0BXOXAAAAAElFTkSuQmCC)';
		var contentdiv = document.getElementById('twinkle-config-content');
		contentdiv.textContent = ''; // clear children

		// let user know about possible conflict with skin js/common.js file
		// (settings in that file will still work, but they will be overwritten by twinkleoptions.js settings)
		if (window.TwinkleConfig || window.FriendlyConfig) {
			var contentnotice = document.createElement('p');
			contentnotice.innerHTML = '<b>在这里修改您的参数设置之前，</b>确认您已移除了<a href="' + mw.util.getUrl('Special:MyPage/skin.js') + '" title="Special:MyPage/skin.js">用户JavaScript文件</a>中任何旧的<code>FriendlyConfig</code>设置。';
			contentdiv.appendChild(contentnotice);
		}

		// start a table of contents
		var toctable = document.createElement('div');
		toctable.className = 'toc';
		toctable.style.marginLeft = '0.4em';
		// create TOC title
		var toctitle = document.createElement('div');
		toctitle.id = 'toctitle';
		var toch2 = document.createElement('h2');
		toch2.textContent = '目录 ';
		toctitle.appendChild(toch2);
		// add TOC show/hide link
		var toctoggle = document.createElement('span');
		toctoggle.className = 'toctoggle';
		toctoggle.appendChild(document.createTextNode('['));
		var toctogglelink = document.createElement('a');
		toctogglelink.className = 'internal';
		toctogglelink.setAttribute('href', '#tw-tocshowhide');
		toctogglelink.textContent = '隐藏';
		toctoggle.appendChild(toctogglelink);
		toctoggle.appendChild(document.createTextNode(']'));
		toctitle.appendChild(toctoggle);
		toctable.appendChild(toctitle);
		// create item container: this is what we add stuff to
		var tocul = document.createElement('ul');
		toctogglelink.addEventListener('click', function twinkleconfigTocToggle() {
			var $tocul = $(tocul);
			$tocul.toggle();
			if ($tocul.find(':visible').length) {
				toctogglelink.textContent = '隐藏';
			} else {
				toctogglelink.textContent = '显示';
			}
		}, false);
		toctable.appendChild(tocul);
		contentdiv.appendChild(toctable);
		var contentform = document.createElement('form');
		// eslint-disable-next-line no-script-url
		contentform.setAttribute('action', 'javascript:void(0)'); // was #tw-save - changed to void(0) to work around Chrome issue
		contentform.addEventListener('submit', Twinkle.config.save, true);
		contentdiv.appendChild(contentform);
		var container = document.createElement('table');
		container.style.width = '100%';
		contentform.appendChild(container);
		$(Twinkle.config.sections).each(function (sectionkey, section) {
			if (section.hidden || section.adminOnly && !Morebits.userIsSysop) {
				return true; // i.e. "continue" in this context
			}

			// add to TOC
			var tocli = document.createElement('li');
			tocli.className = 'toclevel-1';
			var toca = document.createElement('a');
			toca.setAttribute('href', '#' + section.module);
			toca.appendChild(document.createTextNode(section.title));
			tocli.appendChild(toca);
			tocul.appendChild(tocli);
			var row = document.createElement('tr');
			var cell = document.createElement('td');
			cell.setAttribute('colspan', '3');
			var heading = document.createElement('h4');
			heading.style.borderBottom = '1px solid gray';
			heading.style.marginTop = '0.2em';
			heading.id = section.module;
			heading.appendChild(document.createTextNode(section.title));
			cell.appendChild(heading);
			row.appendChild(cell);
			container.appendChild(row);
			var rowcount = 1; // for row banding

			// add each of the preferences to the form
			$(section.preferences).each(function (prefkey, pref) {
				if (pref.adminOnly && !Morebits.userIsSysop) {
					return true; // i.e. "continue" in this context
				}

				row = document.createElement('tr');
				row.style.marginBottom = '0.2em';
				// create odd row banding
				if (rowcount++ % 2 === 0) {
					row.style.backgroundColor = 'rgba(128, 128, 128, 0.1)';
				}
				cell = document.createElement('td');
				var label,
					input,
					gotPref = Twinkle.getPref(pref.name);
				switch (pref.type) {
					case 'boolean':
						// create a checkbox
						cell.setAttribute('colspan', '2');
						label = document.createElement('label');
						input = document.createElement('input');
						input.setAttribute('type', 'checkbox');
						input.setAttribute('id', pref.name);
						input.setAttribute('name', pref.name);
						if (gotPref === true) {
							input.setAttribute('checked', 'checked');
						}
						label.appendChild(input);
						label.appendChild(document.createTextNode(pref.label));
						cell.appendChild(label);
						break;
					case 'string': // create an input box
					case 'integer':
						// add label to first column
						cell.style.textAlign = 'right';
						cell.style.paddingRight = '0.5em';
						label = document.createElement('label');
						label.setAttribute('for', pref.name);
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);
						row.appendChild(cell);

						// add input box to second column
						cell = document.createElement('td');
						cell.style.paddingRight = '1em';
						input = document.createElement('input');
						input.setAttribute('type', 'text');
						input.setAttribute('id', pref.name);
						input.setAttribute('name', pref.name);
						if (pref.type === 'integer') {
							input.setAttribute('size', 6);
							input.setAttribute('type', 'number');
							input.setAttribute('step', '1'); // integers only
						}

						if (gotPref) {
							input.setAttribute('value', gotPref);
						}
						cell.appendChild(input);
						break;
					case 'enum':
						// create a combo box
						// add label to first column
						// note: duplicates the code above, under string/integer
						cell.style.textAlign = 'right';
						cell.style.paddingRight = '0.5em';
						label = document.createElement('label');
						label.setAttribute('for', pref.name);
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);
						row.appendChild(cell);

						// add input box to second column
						cell = document.createElement('td');
						cell.style.paddingRight = '1em';
						input = document.createElement('select');
						input.setAttribute('id', pref.name);
						input.setAttribute('name', pref.name);
						$.each(pref.enumValues, function (enumvalue, enumdisplay) {
							var option = document.createElement('option');
							option.setAttribute('value', enumvalue);
							if (gotPref === enumvalue ||
							// Hack to convert old boolean watchlist prefs
							// to corresponding enums (added in v2.1)
                typeof gotPref === 'boolean' && (gotPref && enumvalue === 'yes' || !gotPref && enumvalue === 'no')) {
								option.setAttribute('selected', 'selected');
							}
							option.appendChild(document.createTextNode(enumdisplay));
							input.appendChild(option);
						});
						cell.appendChild(input);
						break;
					case 'set':
						// create a set of check boxes
						// add label first of all
						cell.setAttribute('colspan', '2');
						label = document.createElement('label'); // not really necessary to use a label element here, but we do it for consistency of styling
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);
						var checkdiv = document.createElement('div');
						checkdiv.style.paddingLeft = '1em';
						var worker = function worker(itemkey, itemvalue) {
							var checklabel = document.createElement('label');
							checklabel.style.marginRight = '0.7em';
							checklabel.style.display = 'inline-block';
							var check = document.createElement('input');
							check.setAttribute('type', 'checkbox');
							check.setAttribute('id', pref.name + '_' + itemkey);
							check.setAttribute('name', pref.name + '_' + itemkey);
							if (gotPref && gotPref.indexOf(itemkey) !== -1) {
								check.setAttribute('checked', 'checked');
							}
							// cater for legacy integer array values for unlinkNamespaces (this can be removed a few years down the track...)
							if (pref.name === 'unlinkNamespaces') {
								if (gotPref && gotPref.indexOf(parseInt(itemkey, 10)) !== -1) {
									check.setAttribute('checked', 'checked');
								}
							}
							checklabel.appendChild(check);
							checklabel.appendChild(document.createTextNode(itemvalue));
							checkdiv.appendChild(checklabel);
						};
						if (pref.setDisplayOrder) {
							// add check boxes according to the given display order
							$.each(pref.setDisplayOrder, function (itemkey, item) {
								worker(item, pref.setValues[item]);
							});
						} else {
							// add check boxes according to the order it gets fed to us (probably strict alphabetical)
							$.each(pref.setValues, worker);
						}
						cell.appendChild(checkdiv);
						break;
					case 'customList':
						// add label to first column
						cell.style.textAlign = 'right';
						cell.style.paddingRight = '0.5em';
						label = document.createElement('label');
						label.setAttribute('for', pref.name);
						label.appendChild(document.createTextNode(pref.label + ':'));
						cell.appendChild(label);
						row.appendChild(cell);

						// add button to second column
						cell = document.createElement('td');
						cell.style.paddingRight = '1em';
						var button = document.createElement('button');
						button.setAttribute('id', pref.name);
						button.setAttribute('name', pref.name);
						button.setAttribute('type', 'button');
						button.addEventListener('click', Twinkle.config.listDialog.display, false);
						// use jQuery data on the button to store the current config value
						$(button).data({
							value: gotPref,
							pref: pref
						});
						button.appendChild(document.createTextNode('编辑项目'));
						cell.appendChild(button);
						break;
					default:
						alert('twinkleconfig: unknown data type for preference ' + pref.name);
						break;
				}
				row.appendChild(cell);

				// add help tip
				cell = document.createElement('td');
				cell.style.fontSize = '90%';
				cell.style.color = 'gray';
				if (pref.helptip) {
					// convert mentions of templates in the helptip to clickable links
					cell.innerHTML = pref.helptip.replace(/{{(.+?)}}/g, '{{<a href="' + mw.util.getUrl('Template:') + '$1" target="_blank">$1</a>}}');
				}
				// add reset link (custom lists don't need this, as their config value isn't displayed on the form)
				if (pref.type !== 'customList') {
					var resetlink = document.createElement('a');
					resetlink.setAttribute('href', '#tw-reset');
					resetlink.setAttribute('id', 'twinkle-config-reset-' + pref.name);
					resetlink.addEventListener('click', Twinkle.config.resetPrefLink, false);
					resetlink.style.cssFloat = 'right';
					resetlink.style.margin = '0 0.6em';
					resetlink.appendChild(document.createTextNode('重置'));
					cell.appendChild(resetlink);
				}
				row.appendChild(cell);
				container.appendChild(row);
				return true;
			});
			return true;
		});
		var footerbox = document.createElement('div');
		footerbox.setAttribute('id', 'twinkle-config-buttonpane');
		footerbox.style.backgroundColor = '#BCCADF';
		footerbox.style.padding = '0.5em';
		var button = document.createElement('button');
		button.setAttribute('id', 'twinkle-config-submit');
		button.setAttribute('type', 'submit');
		button.appendChild(document.createTextNode('保存更改'));
		footerbox.appendChild(button);
		var footerspan = document.createElement('span');
		footerspan.className = 'plainlinks';
		footerspan.style.marginLeft = '2.4em';
		footerspan.style.fontSize = '90%';
		var footera = document.createElement('a');
		footera.setAttribute('href', '#tw-reset-all');
		footera.setAttribute('id', 'twinkle-config-resetall');
		footera.addEventListener('click', Twinkle.config.resetAllPrefs, false);
		footera.appendChild(document.createTextNode('恢复默认'));
		footerspan.appendChild(footera);
		footerbox.appendChild(footerspan);
		contentform.appendChild(footerbox);

		// since all the section headers exist now, we can try going to the requested anchor
		if (window.location.hash) {
			var loc = window.location.hash;
			window.location.hash = '';
			window.location.hash = loc;
		}
	} else if (mw.config.get('wgNamespaceNumber') === mw.config.get('wgNamespaceIds').user && mw.config.get('wgTitle').indexOf(mw.config.get('wgUserName')) === 0 && mw.config.get('wgPageName').slice(-3) === '.js') {
		var box = document.createElement('div');
		// Styled in twinkle.css
		box.setAttribute('id', 'twinkle-config-headerbox');
		var link,
			scriptPageName = mw.config.get('wgPageName').slice(mw.config.get('wgPageName').lastIndexOf('/') + 1, mw.config.get('wgPageName').lastIndexOf('.js'));
		if (scriptPageName === 'twinkleoptions') {
			// place "why not try the preference panel" notice
			box.setAttribute('class', 'config-twopt-box');
			if (mw.config.get('wgArticleId') > 0) {
				// page exists
				box.appendChild(document.createTextNode('本页包含您的Twinkle参数设置，您可使用'));
			} else {
				// page does not exist
				box.appendChild(document.createTextNode('您可配置您的Twinkle，配置页在'));
			}
			link = document.createElement('a');
			link.setAttribute('href', '/wiki/Help:Twinkle/参数设置');
			link.appendChild(document.createTextNode('Twinkle参数设置面板'));
			box.appendChild(link);
			box.appendChild(document.createTextNode('，或直接编辑本页。'));
			$(box).insertAfter($('#contentSub'));
		} else if ([ 'vector', 'vector-2022', 'gongbi', 'minerva', 'common' ].indexOf(scriptPageName) !== -1) {
			// place "Looking for Twinkle options?" notice
			box.setAttribute('class', 'config-userskin-box');
			box.appendChild(document.createTextNode('如果您需要调整Twinkle设置，请使用'));
			link = document.createElement('a');
			link.setAttribute('href', '/wiki/Help:Twinkle/参数设置');
			link.appendChild(document.createTextNode('Twinkle参数设置面板'));
			box.appendChild(link);
			box.appendChild(document.createTextNode('.'));
			$(box).insertAfter($('#contentSub'));
		}
	}
};

// custom list-related stuff

Twinkle.config.listDialog = {};
Twinkle.config.listDialog.addRow = function twinkleconfigListDialogAddRow($dlgtable, value, label) {
	var $contenttr, $valueInput, $labelInput;
	$dlgtable.append($contenttr = $('<tr>').append($('<td>').append($('<button>').attr('type', 'button').on('click', function () {
		$contenttr.remove();
	}).text('移除')), $('<td>').append($valueInput = $('<input>').attr('type', 'text').addClass('twinkle-config-customlist-value').css('width', '97%')), $('<td>').append($labelInput = $('<input>').attr('type', 'text').addClass('twinkle-config-customlist-label').css('width', '98%'))));
	if (value) {
		$valueInput.val(value);
	}
	if (label) {
		$labelInput.val(label);
	}
};
Twinkle.config.listDialog.display = function twinkleconfigListDialogDisplay(e) {
	var $prefbutton = $(e.target);
	var curvalue = $prefbutton.data('value');
	var curpref = $prefbutton.data('pref');
	var dialog = new Morebits.simpleWindow(720, 400);
	dialog.setTitle(curpref.label);
	dialog.setScriptName('Twinkle参数设置');
	var $dlgtbody;
	dialog.setContent($('<div>').append($('<table>').addClass('wikitable').css({
		margin: '1.4em 1em',
		width: 'auto'
	}).append($dlgtbody = $('<tbody>').append(
		// header row
		$('<tr>').append($('<th>') // top-left cell
			.css('width', '5%'), $('<th>') // value column header
			.css('width', '35%').text(curpref.customListValueTitle ? curpref.customListValueTitle : '数值'), $('<th>') // label column header
			.css('width', '60%').text(curpref.customListLabelTitle ? curpref.customListLabelTitle : '标签'))), $('<tfoot>').append($('<tr>').append($('<td>').attr('colspan', '3').append($('<button>').text('添加').css('min-width', '8em').attr('type', 'button').on('click', function () {
		Twinkle.config.listDialog.addRow($dlgtbody);
	}))))), $('<button>').text('保存修改').attr('type', 'submit') // so Morebits.simpleWindow puts the button in the button pane
		.on('click', function () {
			Twinkle.config.listDialog.save($prefbutton, $dlgtbody);
			dialog.close();
		}), $('<button>').text('重置').attr('type', 'submit').on('click', function () {
		Twinkle.config.listDialog.reset($prefbutton, $dlgtbody);
	}), $('<button>').text('取消').attr('type', 'submit').on('click', function () {
		dialog.close();
	}))[0]);

	// content rows
	var gotRow = false;
	$.each(curvalue, function (k, v) {
		gotRow = true;
		Twinkle.config.listDialog.addRow($dlgtbody, v.value, v.label);
	});
	// if there are no values present, add a blank row to start the user off
	if (!gotRow) {
		Twinkle.config.listDialog.addRow($dlgtbody);
	}
	dialog.display();
};

// Resets the data value, re-populates based on the new (default) value, then saves the
// old data value again (less surprising behaviour)
Twinkle.config.listDialog.reset = function twinkleconfigListDialogReset($button, $tbody) {
	// reset value on button
	var curpref = $button.data('pref');
	var oldvalue = $button.data('value');
	Twinkle.config.resetPref(curpref);

	// reset form
	$tbody.find('tr').slice(1).remove(); // all rows except the first (header) row
	// add the new values
	var curvalue = $button.data('value');
	$.each(curvalue, function (k, v) {
		Twinkle.config.listDialog.addRow($tbody, v.value, v.label);
	});

	// save the old value
	$button.data('value', oldvalue);
};
Twinkle.config.listDialog.save = function twinkleconfigListDialogSave($button, $tbody) {
	var result = [];
	var current = {};
	$tbody.find('input[type="text"]').each(function (inputkey, input) {
		if ($(input).hasClass('twinkle-config-customlist-value')) {
			current = {
				value: input.value
			};
		} else {
			current.label = input.value;
			// exclude totally empty rows
			if (current.value || current.label) {
				result.push(current);
			}
		}
	});
	$button.data('value', result);
};

// reset/restore defaults

Twinkle.config.resetPrefLink = function twinkleconfigResetPrefLink(e) {
	var wantedpref = e.target.id.slice(21); // "twinkle-config-reset-" prefix is stripped

	// search tactics
	$(Twinkle.config.sections).each(function (sectionkey, section) {
		if (section.hidden || section.adminOnly && !Morebits.userIsSysop) {
			return true; // continue: skip impossibilities
		}

		var foundit = false;
		$(section.preferences).each(function (prefkey, pref) {
			if (pref.name !== wantedpref) {
				return true; // continue
			}

			Twinkle.config.resetPref(pref);
			foundit = true;
			return false; // break
		});

		if (foundit) {
			return false; // break
		}
	});

	return false; // stop link from scrolling page
};

Twinkle.config.resetPref = function twinkleconfigResetPref(pref) {
	switch (pref.type) {
		case 'boolean':
			document.getElementById(pref.name).checked = Twinkle.defaultConfig[pref.name];
			break;
		case 'string':
		case 'integer':
		case 'enum':
			document.getElementById(pref.name).value = Twinkle.defaultConfig[pref.name];
			break;
		case 'set':
			$.each(pref.setValues, function (itemkey) {
				if (document.getElementById(pref.name + '_' + itemkey)) {
					document.getElementById(pref.name + '_' + itemkey).checked = Twinkle.defaultConfig[pref.name].indexOf(itemkey) !== -1;
				}
			});
			break;
		case 'customList':
			$(document.getElementById(pref.name)).data('value', Twinkle.defaultConfig[pref.name]);
			break;
		default:
			alert('twinkleconfig: 发现未知的数据类型，在属性 ' + pref.name);
			break;
	}
};
Twinkle.config.resetAllPrefs = function twinkleconfigResetAllPrefs() {
	// no confirmation message - the user can just refresh/close the page to abort
	$(Twinkle.config.sections).each(function (sectionkey, section) {
		if (section.hidden || section.adminOnly && !Morebits.userIsSysop) {
			return true; // continue: skip impossibilities
		}

		$(section.preferences).each(function (prefkey, pref) {
			if (!pref.adminOnly || Morebits.userIsSysop) {
				Twinkle.config.resetPref(pref);
			}
		});
		return true;
	});
	return false; // stop link from scrolling page
};

Twinkle.config.save = function twinkleconfigSave(e) {
	Morebits.status.init(document.getElementById('twinkle-config-content'));
	var userjs = mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceIds').user] + ':' + mw.config.get('wgUserName') + '/twinkleoptions.js';
	var qiuwen_page = new Morebits.wiki.page(userjs, '保存参数设置到 ' + userjs);
	qiuwen_page.setCallbackParameters(e.target);
	qiuwen_page.load(Twinkle.config.writePrefs);
	return false;
};
Twinkle.config.writePrefs = function twinkleconfigWritePrefs(pageobj) {
	var form = pageobj.getCallbackParameters();

	// this is the object which gets serialized into JSON; only
	// preferences that this script knows about are kept
	var newConfig = {
		optionsVersion: 2.1
	};

	// a comparison function is needed later on
	// it is just enough for our purposes (i.e. comparing strings, numbers, booleans,
	// arrays of strings, and arrays of { value, label })
	// and it is not very robust: e.g. compare([2], ["2"]) === true, and
	// compare({}, {}) === false, but it's good enough for our purposes here
	var compare = function (a, b) {
		if (Array.isArray(a)) {
			if (a.length !== b.length) {
				return false;
			}
			var asort = a.sort(), bsort = b.sort();
			for (var i = 0; asort[i]; ++i) {
				// comparison of the two properties of custom lists
				if ((typeof asort[i] === 'object') && (asort[i].label !== bsort[i].label ||
					asort[i].value !== bsort[i].value)) {
					return false;
				} else if (asort[i].toString() !== bsort[i].toString()) {
					return false;
				}
			}
			return true;
		}
		return a === b;

	};

	$(Twinkle.config.sections).each(function (sectionkey, section) {
		if (section.adminOnly && !Morebits.userIsSysop) {
			return; // i.e. "continue" in this context
		}

		// reach each of the preferences from the form
		$(section.preferences).each(function (prefkey, pref) {
			var userValue; // = undefined

			// only read form values for those prefs that have them
			if (!pref.adminOnly || Morebits.userIsSysop) {
				if (!section.hidden) {
					switch (pref.type) {
						case 'boolean': // read from the checkbox
							userValue = form[pref.name].checked;
							break;

						case 'string': // read from the input box or combo box
						case 'enum':
							userValue = form[pref.name].value;
							break;

						case 'integer': // read from the input box
							userValue = parseInt(form[pref.name].value, 10);
							if (isNaN(userValue)) {
								Morebits.status.warn('保存您为' + pref.name + ' 指定的值（' + pref.value + '）不合法，会继续保存操作，但此值将会跳过。');
								userValue = null;
							}
							break;

						case 'set': // read from the set of check boxes
							userValue = [];
							if (pref.setDisplayOrder) {
							// read only those keys specified in the display order
								$.each(pref.setDisplayOrder, function (itemkey, item) {
									if (form[pref.name + '_' + item].checked) {
										userValue.push(item);
									}
								});
							} else {
							// read all the keys in the list of values
								$.each(pref.setValues, function (itemkey) {
									if (form[pref.name + '_' + itemkey].checked) {
										userValue.push(itemkey);
									}
								});
							}
							break;

						case 'customList': // read from the jQuery data stored on the button object
							userValue = $(form[pref.name]).data('value');
							break;

						default:
							alert('twinkleconfig: 未知数据类型，属性 ' + pref.name);
							break;
					}
				} else if (Twinkle.prefs) {
					// Retain the hidden preferences that may have customised by the user from twinkleoptions.js
					// undefined if not set
					userValue = Twinkle.prefs[pref.name];
				}
			}

			// only save those preferences that are *different* from the default
			if (userValue !== undefined && !compare(userValue, Twinkle.defaultConfig[pref.name])) {
				newConfig[pref.name] = userValue;
			}
		});
	});

	var text =
		'// <nowiki>\n' +
		'// twinkleoptions.js：用户Twinkle参数设置文件\n' +
		'//\n' +
		'// 注：修改您的参数设置最简单的办法是使用\n' +
		'// Twinkle参数设置面板，在[[' + Morebits.pageNameNorm + ']]。\n' +
		'//\n' +
		'// 这个文件是自动生成的，您所做的任何修改（除了\n' +
		'// 以一种合法的JavaScript的方式来修改这些属性值）会\n' +
		'// 在下一次您点击“保存”时被覆盖。\n' +
		'// 修改此文件时，请记得使用合法的JavaScript。\n' +
		'\n' +
		'window.Twinkle.prefs = ';
	text += JSON.stringify(newConfig, null, 2);
	text +=
		';\n' +
		'\n' +
		'// twinkleoptions.js到此为止\n' +
		'// </nowiki>';

	pageobj.setPageText(text);
	pageobj.setEditSummary('保存Twinkle参数设置：来自[[:' + Morebits.pageNameNorm + ']]的自动编辑');
	pageobj.setChangeTags(Twinkle.changeTags);
	pageobj.setCreateOption('recreate');
	pageobj.save(Twinkle.config.saveSuccess);
};

Twinkle.config.saveSuccess = function twinkleconfigSaveSuccess(pageobj) {
	pageobj.getStatusElement().info('成功');

	var noticebox = document.createElement('div');
	noticebox.className = 'mw-message-box mw-message-box-success';
	noticebox.style.fontSize = '100%';
	noticebox.style.marginTop = '2em';
	noticebox.innerHTML = '<p><b>您的Twinkle参数设置已被保存。</b></p><p>要看到这些更改，您可能需要<a href="' + mw.util.getUrl('QW:BYPASS') + '" title="QW:BYPASS"><b>绕过浏览器缓存</b></a>。</p>';
	Morebits.status.root.appendChild(noticebox);
	var noticeclear = document.createElement('br');
	noticeclear.style.clear = 'both';
	Morebits.status.root.appendChild(noticeclear);
};

Twinkle.addInitCallback(Twinkle.config.init);
}(jQuery));

/* </nowiki> */
