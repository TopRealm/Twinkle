/* Twinkle.js - twinkleconfig.js */
$(function TwinkleConfig() {
	/**
	 * twinkleconfig.js: Preferences module
	 * Mode of invocation: Adds configuration form to Help:Twinkle/参数设置,
	 * and adds an ad box to the top of user subpages belonging to the
	 * currently logged-in user which end in '.js'
	 * Active on: What I just said. Yeah.
	 */
	Twinkle.config = {};
	Twinkle.config.watchlistEnums = {
		yes: '加入监视列表，长期监视',
		no: '不加入监视列表',
		default: '遵守站点设置',
		'1 week': '加入监视列表，监视7日',
		'1 month': '加入监视列表，监视1个月',
		'3 months': '加入监视列表，监视3个月',
		'6 months': '加入监视列表，监视6个月',
	};
	Twinkle.config.commonSets = {
		csdCriteria: {
			db: '自定义理由（{{db}}）',
			g1: 'G1',
			g2: 'G2',
			g3: 'G3',
			g4: 'G4',
			g5: 'G5',
			g6: 'G6',
			g7: 'G7',
			g8: 'G8',
			g9: 'G9',
			a1: 'A1',
			a2: 'A2',
			a3: 'A3',
			o1: 'O1',
			o2: 'O2',
			o3: 'O3',
			f1: 'F1',
			f2: 'F2',
			r1: 'R1',
			r2: 'R2',
		},
		csdCriteriaDisplayOrder: [
			'db',
			'g1',
			'g2',
			'g3',
			'g4',
			'g5',
			'g6',
			'g7',
			'g8',
			'g9',
			'a1',
			'a2',
			'a3',
			'o1',
			'o2',
			'o3',
			'f1',
			'f2',
			'r1',
			'r2',
		],
		csdCriteriaNotification: {
			db: '自定义理由（{{db}}）',
			g1: 'G1',
			g2: 'G2',
			g3: 'G3',
			g4: 'G4',
			g5: 'G5',
			g6: 'G6',
			g7: 'G7',
			g8: 'G8',
			g9: 'G9',
			a1: 'A1',
			a2: 'A2',
			a3: 'A3',
			o1: 'O1',
			o2: 'O2',
			o3: 'O3',
			f1: 'F1',
			f2: 'F2',
			r1: 'R1',
			r2: 'R2',
		},
		csdCriteriaNotificationDisplayOrder: [
			'db',
			'g1',
			'g2',
			'g3',
			'g4',
			'g5',
			'g6',
			'g7',
			'g8',
			'g9',
			'a1',
			'a2',
			'a3',
			'o1',
			'o2',
			'o3',
			'f1',
			'f2',
			'r1',
			'r2',
		],
		csdAndDICriteria: {
			db: '自定义理由（{{db}}）',
			g1: 'G1',
			g2: 'G2',
			g3: 'G3',
			g4: 'G4',
			g5: 'G5',
			g6: 'G6',
			g7: 'G7',
			g8: 'G8',
			g9: 'G9',
			a1: 'A1',
			a2: 'A2',
			a3: 'A3',
			o1: 'O1',
			o2: 'O2',
			o3: 'O3',
			f1: 'F1',
			f2: 'F2',
			r1: 'R1',
			r2: 'R2',
		},
		csdAndDICriteriaDisplayOrder: [
			'db',
			'g1',
			'g2',
			'g3',
			'g4',
			'g5',
			'g6',
			'g7',
			'g8',
			'g9',
			'a1',
			'a2',
			'a3',
			'o1',
			'o2',
			'o3',
			'f1',
			'f2',
			'r1',
			'r2',
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
			829: 'Module talk',
		},
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
	 *	 {
	 *	   name: <TwinkleConfig property name>,
	 *	   label: <human-readable short description - used as a form label>,
	 *	   helptip: <(optional) human-readable text (using valid HTML) that complements the description, like limits, warnings, etc.>
	 *	   adminOnly: <true for admin-only preferences>,
	 *	   type: <string|boolean|integer|enum|set|customList> (customList stores an array of JSON objects { value, label }),
	 *	   enumValues: <for type = "enum": a JSON object where the keys are the internal names and the values are human-readable strings>,
	 *	   setValues: <for type = "set": a JSON object where the keys are the internal names and the values are human-readable strings>,
	 *	   setDisplayOrder: <(optional) for type = "set": an array containing the keys of setValues (as strings) in the order that they are displayed>,
	 *	   customListValueTitle: <for type = "customList": the heading for the left "value" column in the custom list editor>,
	 *	   customListLabelTitle: <for type = "customList": the heading for the right "label" column in the custom list editor>
	 *	 },
	 *	 . . .
	 *   ]
	 * },
	 * . . .
	 *
	 */
	Twinkle.config.sections = [
		{
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
						blank: '在新窗口中',
					},
				},
				// TwinkleConfig.dialogLargeFont (boolean)
				{
					name: 'dialogLargeFont',
					label: '在Twinkle对话框中使用大号字体',
					type: 'boolean',
				},
				// Twinkle.config.disabledModules (array)
				{
					name: 'disabledModules',
					label: '关闭指定的Twinkle模块',
					helptip: '您在此选择的功能将无法使用，取消选择以重新启用功能。',
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
						fluff: '撤销',
					},
				},
				// Twinkle.config.disabledSysopModules (array)
				{
					name: 'disabledSysopModules',
					label: '关闭指定的Twinkle管理员模块',
					helptip: '您在此选择的功能将无法使用，取消选择以重新启用功能。',
					adminOnly: true,
					type: 'set',
					setValues: {
						block: '封禁',
						batchdelete: '批删',
						batchprotect: '批保',
						batchundelete: '批复',
					},
				},
			],
		},
		{
			title: '告状',
			module: 'arv',
			preferences: [
				{
					name: 'spiWatchReport',
					label: '发起傀儡调查时加入到监视列表',
					type: 'enum',
					enumValues: Twinkle.config.watchlistEnums,
				},
			],
		},
		{
			title: '封禁用户',
			module: 'block',
			adminOnly: true,
			preferences: [
				// TwinkleConfig.defaultToBlock64 (boolean)
				// Whether to default to just blocking the /64 on or off
				{
					name: 'defaultToBlock64',
					label: '开启后，封禁对象为IPv6地址时将默认封禁/64地址块',
					type: 'boolean',
				},
				// TwinkleConfig.defaultToPartialBlocks (boolean)
				// Whether to default partial blocks on or off
				{
					name: 'defaultToPartialBlocks',
					label: '打开封禁菜单时默认选择部分封禁',
					helptip: '若该用户已封禁，该选项将被覆盖为对应现有封禁类型的默认选项',
					type: 'boolean',
				},
				{
					name: 'customBlockReasonList',
					label: '自定义封禁理由',
					helptip: '您可以加入常用的封禁理由。自定义的封禁理由会出现在一般的封禁理由下方。',
					type: 'customList',
					customListValueTitle: '使用封禁模板（默认为 uw-block1）',
					customListLabelTitle: '“由于…您已被封禁”及封禁日志理由',
				},
			],
		},
		{
			title: '图片删除',
			module: 'image',
			preferences: [
				// TwinkleConfig.notifyUserOnDeli (boolean)
				// If the user should be notified after placing a file deletion tag
				{
					name: 'notifyUserOnDeli',
					label: '默认勾选“通知创建者”',
					type: 'boolean',
				},
				// TwinkleConfig.deliWatchPage (string)
				// The watchlist setting of the page tagged for deletion.
				{
					name: 'deliWatchPage',
					label: '标记图片时加入到监视列表',
					type: 'enum',
					enumValues: Twinkle.config.watchlistEnums,
				},
				// TwinkleConfig.deliWatchUser (string)
				// The watchlist setting of the user talk page if a notification is placed.
				{
					name: 'deliWatchUser',
					label: '标记图片时加入创建者讨论页到监视列表',
					type: 'enum',
					enumValues: Twinkle.config.watchlistEnums,
				},
			],
		},
		{
			title: '保护',
			module: 'protect',
			preferences: [
				{
					name: 'watchRequestedPages',
					label: '请求保护页面时，将被保护页面加入到监视列表',
					type: 'enum',
					enumValues: Twinkle.config.watchlistEnums,
				},
				{
					name: 'watchPPTaggedPages',
					label: '标记保护模板时，将被保护页面加入到监视列表',
					type: 'enum',
					enumValues: Twinkle.config.watchlistEnums,
				},
				{
					name: 'watchProtectedPages',
					label: '实施页面保护时，将被保护页面加入到监视列表',
					helptip: '若在保护后也标记页面，则使用标记页面的参数设置。',
					adminOnly: true,
					type: 'enum',
					enumValues: Twinkle.config.watchlistEnums,
				},
			],
		},
		{
			title: '撤销',
			// twinklefluff module
			module: 'fluff',
			preferences: [
				// TwinkleConfig.autoMenuAfterRollback (bool)
				// Option to automatically open the warning menu if the user talk page is opened post-reversion
				{
					name: 'autoMenuAfterRollback',
					label: '使用Twinkle撤销编辑后，自动打开用户讨论页上的Twinkle警告菜单',
					helptip: '仅在选取下方对应框时才执行',
					type: 'boolean',
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
						vand: '反破坏撤销',
					},
				},
				// TwinkleConfig.openTalkPageOnAutoRevert (bool)
				// Defines if talk page should be opened when calling revert from contribs or recent changes pages. If set to true, openTalkPage defines then if talk page will be opened.
				{
					name: 'openTalkPageOnAutoRevert',
					label: '在用户贡献、最近更改等发起撤销后，打开用户讨论页',
					helptip: '本选项依赖前一设置，前一设置生效后，本选项方生效',
					type: 'boolean',
				},
				// TwinkleConfig.rollbackInPlace (bool)
				//
				{
					name: 'rollbackInPlace',
					label: '在用户贡献、最近更改等发起撤销后，不刷新页面',
					helptip:
						'当它打开时，Twinkle将不会在从用户贡献及最近更改中发起撤销时刷新页面，允许您一次性撤销多个编辑。',
					type: 'boolean',
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
						torev: '“恢复此版本”',
					},
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
						torev: '“恢复此版本”',
					},
				},
				// TwinkleConfig.watchRevertedExpiry
				// If any of the above items are selected, whether to expire the watch
				{
					name: 'watchRevertedExpiry',
					label: '实施撤销时，页面的监视期限',
					type: 'enum',
					enumValues: Twinkle.config.watchlistEnums,
				},
				// TwinkleConfig.offerReasonOnNormalRevert (boolean)
				// If to offer a prompt for extra summary reason for normal reverts, default to true
				{
					name: 'offerReasonOnNormalRevert',
					label: '常规撤销时，询问理由',
					helptip: '“常规撤销”指点击页面中的“[撤销]”链接。',
					type: 'boolean',
				},
				{
					name: 'confirmOnFluff',
					label: '撤销前，要求二次确认（所有设备）',
					helptip: '对于移动设备用户；或者，容易冲动操作的用户',
					type: 'boolean',
				},
				{
					name: 'confirmOnMobileFluff',
					label: '撤销前，要求二次确认（仅移动设备）',
					helptip: '避免在移动设备意外点击“[撤销]”',
					type: 'boolean',
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
						history: '历史记录',
					},
				},
				{
					name: 'customRevertSummary',
					label: '回退理由',
					helptip: '在查看差异时可选，仅善意回退、常规回退、恢复此版本',
					type: 'customList',
					customListValueTitle: '理由',
					customListLabelTitle: '显示的文字',
				},
			],
		},
		{
			title: '快速删除',
			module: 'speedy',
			preferences: [
				{
					name: 'speedySelectionStyle',
					label: '什么时候执行标记或删除',
					type: 'enum',
					enumValues: {
						buttonClick: '当我点“提交”时',
						radioClick: '当我点一个选项时',
					},
				},
				// TwinkleConfig.watchSpeedyPages (array)
				// Whether to add speedy tagged pages to watchlist
				{
					name: 'watchSpeedyPages',
					label: '将以下理由加入到监视列表',
					type: 'set',
					setValues: Twinkle.config.commonSets.csdCriteria,
					setDisplayOrder: Twinkle.config.commonSets.csdCriteriaDisplayOrder,
				},
				// TwinkleConfig.watchSpeedyExpiry
				// If any of the above items are selected, whether to expire the watch
				{
					name: 'watchSpeedyExpiry',
					label: '当标记页面时，加入到监视列表的期限',
					type: 'enum',
					enumValues: Twinkle.config.watchlistEnums,
				},
				// TwinkleConfig.markSpeedyPagesAsPatrolled (boolean)
				// If, when applying speedy template to page, to mark the page as patrolled (if the page was reached from NewPages)
				{
					name: 'markSpeedyPagesAsPatrolled',
					label: '标记时标记页面为已巡查（如可能）',
					type: 'boolean',
				},
				// TwinkleConfig.notifyUserOnSpeedyDeletionNomination (array)
				// What types of actions should result that the author of the page being notified of nomination
				{
					name: 'notifyUserOnSpeedyDeletionNomination',
					label: '仅在使用以下理由时通知页面创建者',
					helptip: '尽管您在对话框中选择通知，通知仍只会在使用这些理由时发出。',
					type: 'set',
					setValues: Twinkle.config.commonSets.csdCriteriaNotification,
					setDisplayOrder: Twinkle.config.commonSets.csdCriteriaNotificationDisplayOrder,
				},
				// TwinkleConfig.promptForSpeedyDeletionSummary (array of strings)
				{
					name: 'promptForSpeedyDeletionSummary',
					label: '使用以下理由删除时允许编辑删除理由',
					adminOnly: true,
					type: 'set',
					setValues: Twinkle.config.commonSets.csdAndDICriteria,
					setDisplayOrder: Twinkle.config.commonSets.csdAndDICriteriaDisplayOrder,
				},
				// TwinkleConfig.openUserTalkPageOnSpeedyDelete (array of strings)
				// What types of actions that should result user talk page to be opened when speedily deleting (admin only)
				{
					name: 'openUserTalkPageOnSpeedyDelete',
					label: '使用以下理由时打开用户讨论页',
					adminOnly: true,
					type: 'set',
					setValues: Twinkle.config.commonSets.csdAndDICriteria,
					setDisplayOrder: Twinkle.config.commonSets.csdAndDICriteriaDisplayOrder,
				},
				// TwinkleConfig.deleteTalkPageOnDelete (boolean)
				// If talk page if exists should also be deleted (CSD G8) when spedying a page (admin only)
				{
					name: 'deleteTalkPageOnDelete',
					label: '默认勾选“删除讨论页”',
					adminOnly: true,
					type: 'boolean',
				},
				{
					name: 'deleteRedirectsOnDelete',
					label: '默认勾选“删除重定向”',
					adminOnly: true,
					type: 'boolean',
				},
				// TwinkleConfig.deleteSysopDefaultToDelete (boolean)
				// Make the CSD screen default to "delete" instead of "tag" (admin only)
				{
					name: 'deleteSysopDefaultToDelete',
					label: '默认为直接删除而不是标记',
					helptip: '若已放置快速删除标记，则永远默认为删除模式。',
					adminOnly: true,
					type: 'boolean',
				},
				// TwinkleConfig.speedyWindowWidth (integer)
				// Defines the width of the Twinkle SD window in pixels
				{
					name: 'speedyWindowWidth',
					label: '快速删除对话框宽度（像素）',
					type: 'integer',
				},
				// TwinkleConfig.speedyWindowWidth (integer)
				// Defines the width of the Twinkle SD window in pixels
				{
					name: 'speedyWindowHeight',
					label: '快速删除对话框高度（像素）',
					helptip: '若您有一台很大的显示器，您可以将此调高。',
					type: 'integer',
				},
				{
					name: 'logSpeedyNominations',
					label: '在用户空间中记录所有快速删除提名',
					helptip: '非管理员无法访问到已删除的贡献，用户空间日志提供了一个很好的方法来记录这些历史。',
					type: 'boolean',
				},
				{
					name: 'speedyLogPageName',
					label: '在此页保留日志',
					helptip:
						'在此框中输入子页面名称，您将在User:<i>用户名</i>/<i>子页面</i>找到CSD日志。仅在启用日志时工作。',
					type: 'string',
				},
				{
					name: 'noLogOnSpeedyNomination',
					label: '在使用以下理由时不做记录',
					type: 'set',
					setValues: Twinkle.config.commonSets.csdAndDICriteria,
					setDisplayOrder: Twinkle.config.commonSets.csdAndDICriteriaDisplayOrder,
				},
				{
					name: 'enlargeG7Input',
					label: '扩大CSD G7的按钮',
					helptip: '扩为默认的两倍大。',
					type: 'boolean',
				},
			],
		},
		{
			title: '标记',
			module: 'tag',
			preferences: [
				{
					name: 'watchTaggedPages',
					label: '标记时加入到监视列表',
					type: 'enum',
					enumValues: Twinkle.config.watchlistEnums,
				},
				{
					name: 'watchMergeDiscussions',
					label: '加入合并讨论时监视讨论页',
					type: 'enum',
					enumValues: Twinkle.config.watchlistEnums,
				},
				{
					name: 'markTaggedPagesAsMinor',
					label: '将标记标记为小修改',
					type: 'boolean',
				},
				{
					name: 'markTaggedPagesAsPatrolled',
					label: '默认勾选“标记页面为已巡查”框',
					type: 'boolean',
				},
				{
					name: 'groupByDefault',
					label: '默认勾选“合并到{{multiple issues}}”复选框',
					type: 'boolean',
				},
				{
					name: 'tagArticleSortOrder',
					label: '条目标记的默认查看方式',
					type: 'enum',
					enumValues: {
						cat: '按类型',
						alpha: '按字母',
					},
				},
				{
					name: 'customTagList',
					label: '自定义条目维护标记',
					helptip: '这些会出现在列表的末尾。',
					type: 'customList',
					customListValueTitle: '模板名（不含大括号）',
					customListLabelTitle: '显示的文字',
				},
				{
					name: 'customFileTagList',
					label: '自定义文件维护标记',
					helptip: '这些会出现在列表的末尾。',
					type: 'customList',
					customListValueTitle: '模板名（不含大括号）',
					customListLabelTitle: '显示的文字',
				},
				{
					name: 'customRedirectTagList',
					label: '自定义重定向维护标记',
					helptip: '这些会出现在列表的末尾。',
					type: 'customList',
					customListValueTitle: '模板名（不含大括号）',
					customListLabelTitle: '显示的文字',
				},
			],
		},
		{
			title: '小作品',
			module: 'stub',
			preferences: [
				{
					name: 'watchStubbedPages',
					label: '标记时加入到监视列表',
					type: 'boolean',
				},
				{
					name: 'markStubbedPagesAsMinor',
					label: '将小作品标记为小修改',
					type: 'boolean',
				},
				{
					name: 'markStubbedPagesAsPatrolled',
					label: '默认勾选“标记页面为已巡查”框',
					type: 'boolean',
				},
				{
					name: 'stubArticleSortOrder',
					label: '条目小作品的默认查看方式',
					type: 'enum',
					enumValues: {
						cat: '按类型',
						alpha: '按字母',
					},
				},
				{
					name: 'customStubList',
					label: '自定义条目小作品标记',
					helptip: '这些会出现在列表的末尾。',
					type: 'customList',
					customListValueTitle: '模板名（不含大括号）',
					customListLabelTitle: '显示的文字',
				},
			],
		},
		{
			title: '回复',
			module: 'talkback',
			preferences: [
				{
					name: 'markTalkbackAsMinor',
					label: '将回复标记为小修改',
					type: 'boolean',
				},
				{
					name: 'insertTalkbackSignature',
					label: '回复时加入签名',
					type: 'boolean',
				},
				{
					name: 'talkbackHeading',
					label: '回复所用的小节标题',
					type: 'string',
				},
				{
					name: 'mailHeading',
					label: '“有新邮件”所用的小节标题',
					type: 'string',
				},
			],
		},
		{
			title: '取消链入',
			module: 'unlink',
			preferences: [
				// TwinkleConfig.unlinkNamespaces (array)
				// In what namespaces unlink should happen, default in 0 (article)
				{
					name: 'unlinkNamespaces',
					label: '取消以下命名空间中的反向链接',
					helptip: '请避免选择讨论页，因这样会导致Twinkle试图修改讨论存档。',
					type: 'set',
					setValues: Twinkle.config.commonSets.namespacesNoSpecial,
				},
			],
		},
		{
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
						11: '自动选择层级（1-4）',
					},
				},
				// TwinkleConfig.combinedSingletMenus (boolean)
				// if true, show one menu with both single-issue notices and warnings instead of two separately
				{
					name: 'combinedSingletMenus',
					label: '将两个单层级菜单合并成一个',
					helptip: '当启用此选项时，无论默认警告级别选择单层级通知或单层级警告皆属于此项。',
					type: 'boolean',
				},
				// TwinkleConfig.watchWarnings (string)
				// Watchlist setting for the page which has been dispatched an warning or notice
				{
					name: 'watchWarnings',
					label: '警告时加入用户讨论页到监视列表',
					helptip: '注意：若对方使用Flow，对应讨论串总会加到监视列表中。',
					type: 'enum',
					enumValues: Twinkle.config.watchlistEnums,
				},
				// TwinkleConfig.oldSelect (boolean)
				// if true, use the native select menu rather the jquery chosen-based one
				{
					name: 'oldSelect',
					label: '使用不可搜索的经典菜单',
					type: 'boolean',
				},
				{
					name: 'customWarningList',
					label: '自定义警告模板',
					helptip: '您可以加入模板或用户子页面。自定义警告会出现在警告对话框中“自定义警告”一节。',
					type: 'customList',
					customListValueTitle: '模板名（不含大括号）',
					customListLabelTitle: '显示的文字（和编辑摘要）',
				},
			],
		},
		{
			title: '存废讨论',
			module: 'xfd',
			preferences: [
				{
					name: 'logXfdNominations',
					label: '在用户空间中记录所有存废讨论提名',
					helptip: '该日志供您追踪所有通过Twinkle提交的存废讨论',
					type: 'boolean',
				},
				{
					name: 'xfdLogPageName',
					label: '在此页保留日志',
					helptip:
						'在此框中输入子页面名称，您将在User:<i>用户名</i>/<i>子页面</i>找到XFD日志。仅在启用日志时工作。',
					type: 'string',
				},
				{
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
						rm: 'RM',
					},
				},
				// TwinkleConfig.xfdWatchPage (string)
				// The watchlist setting of the page being nominated for XfD.
				{
					name: 'xfdWatchPage',
					label: '加入提名的页面到监视列表',
					type: 'enum',
					enumValues: Twinkle.config.watchlistEnums,
				},
				// TwinkleConfig.xfdWatchDiscussion (string)
				// The watchlist setting of the newly created XfD page (for those processes that create discussion pages for each nomination),
				// or the list page for the other processes.
				{
					name: 'xfdWatchDiscussion',
					label: '加入存废讨论页到监视列表',
					helptip: '当日的页面。',
					type: 'enum',
					enumValues: Twinkle.config.watchlistEnums,
				},
				// TwinkleConfig.xfdWatchUser (string)
				// The watchlist setting of the user talk page if they receive a notification.
				{
					name: 'xfdWatchUser',
					label: '加入创建者讨论页到监视列表（在通知时）',
					type: 'enum',
					enumValues: Twinkle.config.watchlistEnums,
				},
				{
					name: 'markXfdPagesAsPatrolled',
					label: '标记时标记页面为已巡查（如可能）',
					helptip: '基于技术原因，页面仅会在由Special:NewPages到达时被标记为已巡查。',
					type: 'boolean',
				},
				{
					name: 'FwdCsdToXfd',
					label: '提删类型增加转交自快速删除候选',
					helptip: '请确保您充分了解快速删除方针才开启此功能。',
					type: 'boolean',
				},
				{
					name: 'afdDefaultCategory',
					label: '默认提删类型',
					helptip: '若选择“相同于上次选择”将使用localStorage来记忆。',
					type: 'enum',
					enumValues: {
						delete: '删除',
						same: '相同于上次选择',
					},
				},
				{
					name: 'afdFameDefaultReason',
					label: '默认关注度提删理由',
					helptip: '用于批量提删。',
					type: 'string',
				},
				{
					name: 'afdSubstubDefaultReason',
					label: '默认小小作品提删理由',
					helptip: '用于批量提删。',
					type: 'string',
				},
			],
		},
		{
			title: '关闭存废讨论',
			module: 'close',
			preferences: [
				{
					name: 'XfdClose',
					label: '在存废讨论显示关闭讨论按钮',
					helptip: '请确保您充分了解存废讨论相关方针才开启此功能。',
					type: 'enum',
					enumValues: {
						hide: '不显示',
						nonadminonly: '只包含非管理员可使用选项',
						all: '显示所有选项',
					},
				},
			],
		},
		{
			title: '侵犯著作权',
			module: 'copyvio',
			preferences: [
				// TwinkleConfig.copyvioWatchPage (string)
				// The watchlist setting of the page being nominated for XfD.
				{
					name: 'copyvioWatchPage',
					label: '加入提报的页面到监视列表',
					type: 'enum',
					enumValues: Twinkle.config.watchlistEnums,
				},
				// TwinkleConfig.copyvioWatchUser (string)
				// The watchlist setting of the user if he receives a notification.
				{
					name: 'copyvioWatchUser',
					label: '加入创建者讨论页到监视列表（在通知时）',
					type: 'enum',
					enumValues: Twinkle.config.watchlistEnums,
				},
				// TwinkleConfig.markCopyvioPagesAsPatrolled (boolean)
				// If, when applying copyvio template to page, to mark the page as patrolled (if the page was reached from NewPages)
				{
					name: 'markCopyvioPagesAsPatrolled',
					label: '标记时标记页面为已巡查（如可能）',
					helptip: '基于技术原因，页面仅会在由Special:NewPages到达时被标记为已巡查。',
					type: 'boolean',
				},
			],
		},
		{
			title: '隐藏',
			hidden: true,
			preferences: [
				// twinkle.js: portlet setup
				{
					name: 'portletArea',
					type: 'string',
				},
				{
					name: 'portletId',
					type: 'string',
				},
				{
					name: 'portletName',
					type: 'string',
				},
				{
					name: 'portletType',
					type: 'string',
				},
				{
					name: 'portletNext',
					type: 'string',
				},
				// twinklefluff.js: defines how many revision to query maximum, maximum possible is 50, default is 50
				{
					name: 'revertMaxRevisions',
					type: 'integer',
				},
				// twinklebatchdelete.js: How many pages should be processed maximum
				{
					name: 'batchMax',
					type: 'integer',
					adminOnly: true,
				},
				// How many pages should be processed at a time by deprod and batchdelete/protect/undelete
				{
					name: 'batchChunks',
					type: 'integer',
					adminOnly: true,
				},
				// twinklewarn.js: When using the autolevel select option, how many days makes a prior warning stale
				// Huggle is three days while ClueBotNG is two:
				{
					name: 'autolevelStaleDays',
					type: 'integer',
				},
			],
		},
	]; // end of Twinkle.config.sections
	Twinkle.config.init = () => {
		// create the config page at Twinkle.getPref('configPage')
		if (mw.config.get('wgPageName') === Twinkle.getPref('configPage') && mw.config.get('wgAction') === 'view') {
			if (!document.querySelector('#twinkle-config')) {
				return; // maybe the page is misconfigured, or something - but any attempt to modify it will be pointless
			}
			// set style (the url() CSS function doesn't seem to work from wikicode - ?!)
			document.querySelector('#twinkle-config-titlebar').style.backgroundImage =
				'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAkCAIAAADHFsdbAAAAO0lEQVR4AWK6ev81E6BqaSAAAIiB61/4jdk8AID3Gpf3udex/Y7s9Yp27B2+c/zuI+67wzNF472W+qM/RP8gdFf6CWQAAAAASUVORK5CYII=)';
			const contentdiv = document.querySelector('#twinkle-config-content');
			contentdiv.textContent = ''; // clear children
			// start a table of contents
			const toctable = document.createElement('div');
			toctable.className = 'toc';
			toctable.style.marginLeft = '0.4em';
			// create TOC title
			const toctitle = document.createElement('div');
			toctitle.id = 'toctitle';
			const toch2 = document.createElement('h2');
			toch2.textContent = '目录 ';
			toctitle.appendChild(toch2);
			// add TOC show/hide link
			const toctoggle = document.createElement('span');
			toctoggle.className = 'toctoggle';
			toctoggle.appendChild(document.createTextNode('['));
			const toctogglelink = document.createElement('a');
			toctogglelink.className = 'internal';
			toctogglelink.setAttribute('href', '#tw-tocshowhide');
			toctogglelink.textContent = '隐藏';
			toctoggle.appendChild(toctogglelink);
			toctoggle.appendChild(document.createTextNode(']'));
			toctitle.appendChild(toctoggle);
			toctable.appendChild(toctitle);
			// create item container: this is what we add stuff to
			const tocul = document.createElement('ul');
			toctogglelink.addEventListener(
				'click',
				() => {
					const $tocul = $(tocul);
					$tocul.toggle();
					toctogglelink.textContent = $tocul.find(':visible').length > 0 ? '隐藏' : '显示';
				},
				false
			);
			toctable.appendChild(tocul);
			contentdiv.appendChild(toctable);
			const contentform = document.createElement('form');
			contentform.setAttribute('action', 'javascript:void(0)'); // was #tw-save - changed to void(0) to work around Chrome issue
			contentform.addEventListener('submit', Twinkle.config.save, true);
			contentdiv.appendChild(contentform);
			const container = document.createElement('table');
			container.style.width = '100%';
			contentform.appendChild(container);
			$(Twinkle.config.sections).each((_sectionkey, section) => {
				if (section.hidden || (section.adminOnly && !Morebits.userIsSysop)) {
					return true; // i.e. "continue" in this context
				}
				// add to TOC
				const tocli = document.createElement('li');
				tocli.className = 'toclevel-1';
				const toca = document.createElement('a');
				toca.setAttribute('href', `#${section.module}`);
				toca.appendChild(document.createTextNode(section.title));
				tocli.appendChild(toca);
				tocul.appendChild(tocli);
				let row = document.createElement('tr');
				let cell = document.createElement('td');
				cell.setAttribute('colspan', '3');
				const heading = document.createElement('h4');
				heading.style.borderBottom = '1px solid gray';
				heading.style.marginTop = '0.2em';
				heading.id = section.module;
				heading.appendChild(document.createTextNode(section.title));
				cell.appendChild(heading);
				row.appendChild(cell);
				container.appendChild(row);
				let rowcount = 1; // for row banding
				// add each of the preferences to the form
				$(section.preferences).each((_prefkey, pref) => {
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
					let label;
					let input;
					const gotPref = Twinkle.getPref(pref.name);
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
							label.appendChild(document.createTextNode(`${pref.label}：`));
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
						case 'enum': {
							// create a combo box
							// add label to first column
							// note: duplicates the code above, under string/integer
							cell.style.textAlign = 'right';
							cell.style.paddingRight = '0.5em';
							label = document.createElement('label');
							label.setAttribute('for', pref.name);
							label.appendChild(document.createTextNode(`${pref.label}：`));
							cell.appendChild(label);
							row.appendChild(cell);
							// add input box to second column
							cell = document.createElement('td');
							cell.style.paddingRight = '1em';
							input = document.createElement('select');
							input.setAttribute('id', pref.name);
							input.setAttribute('name', pref.name);
							let optionExists = false;
							$.each(pref.enumValues, (enumvalue, enumdisplay) => {
								const option = document.createElement('option');
								option.setAttribute('value', enumvalue);
								if (
									gotPref === enumvalue ||
									// Hack to convert old boolean watchlist prefs
									// to corresponding enums (added in v2.1)
									(typeof gotPref === 'boolean' &&
										((gotPref && enumvalue === 'yes') || (!gotPref && enumvalue === 'no')))
								) {
									option.setAttribute('selected', 'selected');
									optionExists = true;
								}
								option.appendChild(document.createTextNode(enumdisplay));
								input.appendChild(option);
							});
							// Append user-defined value to options
							if (!optionExists) {
								const option = document.createElement('option');
								option.setAttribute('value', gotPref);
								option.setAttribute('selected', 'selected');
								option.appendChild(document.createTextNode(gotPref));
								input.appendChild(option);
							}
							cell.appendChild(input);
							break;
						}
						case 'set': {
							// create a set of check boxes
							// add label first of all
							cell.setAttribute('colspan', '2');
							label = document.createElement('label'); // not really necessary to use a label element here, but we do it for consistency of styling
							label.appendChild(document.createTextNode(`${pref.label}：`));
							cell.appendChild(label);
							const checkdiv = document.createElement('div');
							checkdiv.style.paddingLeft = '1em';
							const worker = (itemkey, itemvalue) => {
								const checklabel = document.createElement('label');
								checklabel.style.marginRight = '0.7em';
								checklabel.style.display = 'inline-block';
								const check = document.createElement('input');
								check.setAttribute('type', 'checkbox');
								check.setAttribute('id', `${pref.name}_${itemkey}`);
								check.setAttribute('name', `${pref.name}_${itemkey}`);
								if (gotPref && gotPref.includes(itemkey)) {
									check.setAttribute('checked', 'checked');
								}
								// cater for legacy integer array values for unlinkNamespaces (this can be removed a few years down the track...)
								if (
									pref.name === 'unlinkNamespaces' &&
									gotPref &&
									gotPref.includes(Number.parseInt(itemkey, 10))
								) {
									check.setAttribute('checked', 'checked');
								}
								checklabel.appendChild(check);
								checklabel.appendChild(document.createTextNode(itemvalue));
								checkdiv.appendChild(checklabel);
							};
							if (pref.setDisplayOrder) {
								// add check boxes according to the given display order
								$.each(pref.setDisplayOrder, (_itemkey, item) => {
									worker(item, pref.setValues[item]);
								});
							} else {
								// add check boxes according to the order it gets fed to us (probably strict alphabetical)
								$.each(pref.setValues, worker);
							}
							cell.appendChild(checkdiv);
							break;
						}
						case 'customList': {
							// add label to first column
							cell.style.textAlign = 'right';
							cell.style.paddingRight = '0.5em';
							label = document.createElement('label');
							label.setAttribute('for', pref.name);
							label.appendChild(document.createTextNode(`${pref.label}：`));
							cell.appendChild(label);
							row.appendChild(cell);
							// add button to second column
							cell = document.createElement('td');
							cell.style.paddingRight = '1em';
							const button_ = document.createElement('button');
							button_.setAttribute('id', pref.name);
							button_.setAttribute('name', pref.name);
							button_.setAttribute('type', 'button');
							button_.addEventListener('click', Twinkle.config.listDialog.display, false);
							// use jQuery data on the button to store the current config value
							$(button_).data({
								value: gotPref,
								pref,
							});
							button_.appendChild(document.createTextNode('编辑项目'));
							cell.appendChild(button_);
							break;
						}
						default:
							mw.notify(`twinkleconfig: 未知类型的属性 ${pref.name}`, {type: 'warn'});
							break;
					}
					row.appendChild(cell);
					// add help tip
					cell = document.createElement('td');
					cell.style.fontSize = '90%';
					cell.style.color = 'gray';
					if (pref.helptip) {
						// convert mentions of templates in the helptip to clickable links
						cell.innerHTML = pref.helptip
							.replace(
								/{{(.+?)}}/g,
								`{{<a href="${mw.util.getUrl('Template:')}$1" rel="noopener" target="_blank">$1</a>}}`
							)
							.replace(
								/\[\[(.+?)]]/g,
								`<a href="${mw.util.getUrl('')}$1" rel="noopener" target="_blank">$1</a>`
							);
					}
					// add reset link (custom lists don't need this, as their config value isn't displayed on the form)
					if (pref.type !== 'customList') {
						const resetlink = document.createElement('a');
						resetlink.setAttribute('href', '#tw-reset');
						resetlink.setAttribute('id', `twinkle-config-reset-${pref.name}`);
						resetlink.addEventListener('click', Twinkle.config.resetPrefLink, false);
						resetlink.style.cssFloat = 'right';
						resetlink.style.margin = '0 0.6em';
						resetlink.appendChild(document.createTextNode('复位'));
						cell.appendChild(resetlink);
					}
					row.appendChild(cell);
					container.appendChild(row);
					return true;
				});
				return true;
			});
			const footerbox = document.createElement('div');
			footerbox.setAttribute('id', 'twinkle-config-buttonpane');
			footerbox.style.backgroundColor = '#BCCADF';
			footerbox.style.padding = '0.5em';
			const button = document.createElement('button');
			button.setAttribute('id', 'twinkle-config-submit');
			button.setAttribute('type', 'submit');
			button.appendChild(document.createTextNode('保存更改'));
			footerbox.appendChild(button);
			const footerspan = document.createElement('span');
			footerspan.className = 'plainlinks';
			footerspan.style.marginLeft = '2.4em';
			footerspan.style.fontSize = '90%';
			const footera = document.createElement('a');
			footera.setAttribute('href', '#tw-reset-all');
			footera.setAttribute('id', 'twinkle-config-resetall');
			footera.addEventListener('click', Twinkle.config.resetAllPrefs, false);
			footera.appendChild(document.createTextNode('恢复默认'));
			footerspan.appendChild(footera);
			footerbox.appendChild(footerspan);
			contentform.appendChild(footerbox);
			// since all the section headers exist now, we can try going to the requested anchor
			if (window.location.hash) {
				const loc = window.location.hash;
				window.location.hash = '';
				window.location.hash = loc;
			}
		} else if (
			mw.config.get('wgNamespaceNumber') === mw.config.get('wgNamespaceIds').user &&
			mw.config.get('wgTitle').indexOf(mw.config.get('wgUserName')) === 0 &&
			mw.config.get('wgPageName').slice(-3) === '.js'
		) {
			const box = document.createElement('div');
			// Styled in twinkle.css
			box.setAttribute('id', 'twinkle-config-headerbox');
			let link;
			const scriptPageName = mw.config
				.get('wgPageName')
				.slice(
					mw.config.get('wgPageName').lastIndexOf('/') + 1,
					mw.config.get('wgPageName').lastIndexOf('.js')
				);
			if (scriptPageName === 'twinkleoptions') {
				// place "why not try the preference panel" notice
				box.setAttribute('class', 'config-twopt-box');
				if (mw.config.get('wgArticleId') > 0) {
					// page exists
					box.appendChild(document.createTextNode('这页包含您的Twinkle参数设置，您可使用'));
				} else {
					// page does not exist
					box.appendChild(document.createTextNode('您可配置您的Twinkle，通过使用'));
				}
				link = document.createElement('a');
				link.setAttribute('href', mw.util.getUrl(Twinkle.getPref('configPage')));
				link.appendChild(document.createTextNode('Twinkle参数设置面板'));
				box.appendChild(link);
				box.appendChild(document.createTextNode('，或直接编辑本页。'));
				$(box).insertAfter($('#contentSub'));
			} else if (['vector', 'vector-2022', 'gongbi', 'citizen', 'common'].includes(scriptPageName)) {
				// place "Looking for Twinkle options?" notice
				box.setAttribute('class', 'config-userskin-box');
				box.appendChild(document.createTextNode('若您想配置您的Twinkle，请使用'));
				link = document.createElement('a');
				link.setAttribute('href', mw.util.getUrl(Twinkle.getPref('configPage')));
				link.appendChild(document.createTextNode('Twinkle参数设置面板'));
				box.appendChild(link);
				box.appendChild(document.createTextNode('。'));
				$(box).insertAfter($('#contentSub'));
			}
		}
	};
	// custom list-related stuff
	Twinkle.config.listDialog = {};
	Twinkle.config.listDialog.addRow = (dlgtable, value, label) => {
		const contenttr = document.createElement('tr');
		// "remove" button
		let contenttd = document.createElement('td');
		const removeButton = document.createElement('button');
		removeButton.setAttribute('type', 'button');
		removeButton.addEventListener(
			'click',
			() => {
				$(contenttr).remove();
			},
			false
		);
		removeButton.textContent = '移除';
		contenttd.appendChild(removeButton);
		contenttr.appendChild(contenttd);
		// value input box
		contenttd = document.createElement('td');
		let input = document.createElement('input');
		input.setAttribute('type', 'text');
		input.className = 'twinkle-config-customlist-value';
		input.style.width = '97%';
		if (value) {
			input.setAttribute('value', value);
		}
		contenttd.appendChild(input);
		contenttr.appendChild(contenttd);
		// label input box
		contenttd = document.createElement('td');
		input = document.createElement('input');
		input.setAttribute('type', 'text');
		input.className = 'twinkle-config-customlist-label';
		input.style.width = '98%';
		if (label) {
			input.setAttribute('value', label);
		}
		contenttd.appendChild(input);
		contenttr.appendChild(contenttd);
		dlgtable.appendChild(contenttr);
	};
	Twinkle.config.listDialog.display = ({target}) => {
		const $prefbutton = $(target);
		const curvalue = $prefbutton.data('value');
		const curpref = $prefbutton.data('pref');
		const dialog = new Morebits.simpleWindow(720, 400);
		dialog.setTitle(curpref.label);
		dialog.setScriptName('Twinkle参数设置');
		const dialogcontent = document.createElement('div');
		const dlgtable = document.createElement('table');
		dlgtable.className = 'wikitable';
		dlgtable.style.margin = '1.4em 1em';
		dlgtable.style.width = '97%';
		const dlgtbody = document.createElement('tbody');
		// header row
		let dlgtr = document.createElement('tr');
		// top-left cell
		let dlgth = document.createElement('th');
		dlgth.style.width = '5%';
		dlgtr.appendChild(dlgth);
		// value column header
		dlgth = document.createElement('th');
		dlgth.style.width = '35%';
		dlgth.textContent = curpref.customListValueTitle || '数值';
		dlgtr.appendChild(dlgth);
		// label column header
		dlgth = document.createElement('th');
		dlgth.style.width = '60%';
		dlgth.textContent = curpref.customListLabelTitle || '标签';
		dlgtr.appendChild(dlgth);
		dlgtbody.appendChild(dlgtr);
		// content rows
		let gotRow = false;
		$.each(curvalue, (_k, {value, label}) => {
			gotRow = true;
			Twinkle.config.listDialog.addRow(dlgtbody, value, label);
		});
		// if there are no values present, add a blank row to start the user off
		if (!gotRow) {
			Twinkle.config.listDialog.addRow(dlgtbody);
		}
		// final "add" button
		const dlgtfoot = document.createElement('tfoot');
		dlgtr = document.createElement('tr');
		const dlgtd = document.createElement('td');
		dlgtd.setAttribute('colspan', '3');
		const addButton = document.createElement('button');
		addButton.style.minWidth = '8em';
		addButton.setAttribute('type', 'button');
		addButton.addEventListener(
			'click',
			() => {
				Twinkle.config.listDialog.addRow(dlgtbody);
			},
			false
		);
		addButton.textContent = '添加';
		dlgtd.appendChild(addButton);
		dlgtr.appendChild(dlgtd);
		dlgtfoot.appendChild(dlgtr);
		dlgtable.appendChild(dlgtbody);
		dlgtable.appendChild(dlgtfoot);
		dialogcontent.appendChild(dlgtable);
		// buttonpane buttons: [Save changes] [Reset] [Cancel]
		let button = document.createElement('button');
		button.setAttribute('type', 'submit'); // so Morebits.simpleWindow puts the button in the button pane
		button.addEventListener(
			'click',
			() => {
				Twinkle.config.listDialog.save($prefbutton, dlgtbody);
				dialog.close();
			},
			false
		);
		button.textContent = '保存修改';
		dialogcontent.appendChild(button);
		button = document.createElement('button');
		button.setAttribute('type', 'submit'); // so Morebits.simpleWindow puts the button in the button pane
		button.addEventListener(
			'click',
			() => {
				Twinkle.config.listDialog.reset($prefbutton, dlgtbody);
			},
			false
		);
		button.textContent = '复位';
		dialogcontent.appendChild(button);
		button = document.createElement('button');
		button.setAttribute('type', 'submit'); // so Morebits.simpleWindow puts the button in the button pane
		button.addEventListener(
			'click',
			() => {
				dialog.close(); // the event parameter on this function seems to be broken
			},
			false
		);
		button.textContent = '取消';
		dialogcontent.appendChild(button);
		dialog.setContent(dialogcontent);
		dialog.display();
	};
	// Resets the data value, re-populates based on the new (default) value, then saves the
	// old data value again (less surprising behaviour)
	Twinkle.config.listDialog.reset = (button, tbody) => {
		// reset value on button
		const $button = $(button);
		const curpref = $button.data('pref');
		const oldvalue = $button.data('value');
		Twinkle.config.resetPref(curpref);
		// reset form
		const $tbody = $(tbody);
		$tbody.find('tr').slice(1).remove(); // all rows except the first (header) row
		// add the new values
		const curvalue = $button.data('value');
		$.each(curvalue, (_k, {value, label}) => {
			Twinkle.config.listDialog.addRow(tbody, value, label);
		});
		// save the old value
		$button.data('value', oldvalue);
	};
	Twinkle.config.listDialog.save = (button, tbody) => {
		const result = [];
		let current = {};
		$(tbody)
			.find('input[type="text"]')
			.each((_inputkey, input) => {
				if ($(input).hasClass('twinkle-config-customlist-value')) {
					current = {
						value: input.value,
					};
				} else {
					current.label = input.value;
					// exclude totally empty rows
					if (current.value || current.label) {
						result.push(current);
					}
				}
			});
		$(button).data('value', result);
	};
	// reset/restore defaults
	Twinkle.config.resetPrefLink = ({target}) => {
		const wantedpref = target.id.slice(21); // "twinkle-config-reset-" prefix is stripped
		// search tactics
		$(Twinkle.config.sections).each((_sectionkey, {hidden, adminOnly, preferences}) => {
			if (hidden || (adminOnly && !Morebits.userIsSysop)) {
				return true; // continue: skip impossibilities
			}
			let foundit = false;
			$(preferences).each((_prefkey, pref) => {
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
	Twinkle.config.resetPref = ({type, name, setValues}) => {
		switch (type) {
			case 'boolean':
				document.querySelector(`#${name}`).checked = Twinkle.defaultConfig[name];
				break;
			case 'string':
			case 'integer':
			case 'enum':
				document.querySelector(`#${name}`).value = Twinkle.defaultConfig[name];
				break;
			case 'set':
				$.each(setValues, (itemkey) => {
					if (document.querySelector(`#${name}_${itemkey}`)) {
						document.querySelector(`#${name}_${itemkey}`).checked =
							Twinkle.defaultConfig[name].includes(itemkey);
					}
				});
				break;
			case 'customList':
				$(document.querySelector(`#${name}`)).data('value', Twinkle.defaultConfig[name]);
				break;
			default:
				mw.notify(`twinkleconfig: unknown data type for preference ${name}`, {type: 'warn'});
				break;
		}
	};
	Twinkle.config.resetAllPrefs = () => {
		// no confirmation message - the user can just refresh/close the page to abort
		$(Twinkle.config.sections).each((_sectionkey, {hidden, adminOnly, preferences}) => {
			if (hidden || (adminOnly && !Morebits.userIsSysop)) {
				return true; // continue: skip impossibilities
			}
			$(preferences).each((_prefkey, pref) => {
				if (!pref.adminOnly || Morebits.userIsSysop) {
					Twinkle.config.resetPref(pref);
				}
			});
			return true;
		});
		return false; // stop link from scrolling page
	};
	Twinkle.config.save = ({target}) => {
		Morebits.status.init(document.querySelector('#twinkle-config-content'));
		const userjs = `${mw.config.get('wgFormattedNamespaces')[mw.config.get('wgNamespaceIds').user]}:${mw.config.get(
			'wgUserName'
		)}/twinkleoptions.js`;
		const qiuwen_page = new Morebits.wiki.page(userjs, `保存参数设置到 ${userjs}`);
		qiuwen_page.setCallbackParameters(target);
		qiuwen_page.load(Twinkle.config.writePrefs);
		return false;
	};
	Twinkle.config.writePrefs = (pageobj) => {
		const form = pageobj.getCallbackParameters();
		// this is the object which gets serialized into JSON; only
		// preferences that this script knows about are kept
		const newConfig = {
			optionsVersion: 2.1,
		};
		$(Twinkle.config.sections).each((_sectionkey, {adminOnly, preferences, hidden}) => {
			if (adminOnly && !Morebits.userIsSysop) {
				return; // i.e. "continue" in this context
			}
			// reach each of the preferences from the form
			$(preferences).each((_prefkey, pref) => {
				let userValue; // = undefined
				// only read form values for those prefs that have them
				if (!pref.adminOnly || Morebits.userIsSysop) {
					if (!hidden) {
						switch (pref.type) {
							case 'boolean':
								// read from the checkbox
								userValue = form[pref.name].checked;
								break;
							case 'string': // read from the input box or combo box
							case 'enum':
								userValue = form[pref.name].value;
								break;
							case 'integer':
								// read from the input box
								userValue = Number.parseInt(form[pref.name].value, 10);
								if (Number.isNaN(userValue)) {
									Morebits.status.warn(
										'保存',
										`您为 ${pref.name} 指定的值（${pref.value}）不合法，会继续保存操作，但此值将会跳过。`
									);
									userValue = null;
								}
								break;
							case 'set':
								// read from the set of check boxes
								userValue = [];
								if (pref.setDisplayOrder) {
									// read only those keys specified in the display order
									$.each(pref.setDisplayOrder, (_itemkey, item) => {
										if (form[`${pref.name}_${item}`].checked) {
											userValue.push(item);
										}
									});
								} else {
									// read all the keys in the list of values
									$.each(pref.setValues, (itemkey) => {
										if (form[`${pref.name}_${itemkey}`].checked) {
											userValue.push(itemkey);
										}
									});
								}
								break;
							case 'customList':
								// read from the jQuery data stored on the button object
								userValue = $(form[pref.name]).data('value');
								break;
							default:
								mw.notify(`twinkleconfig: 未知数据类型，属性 ${pref.name}`, {type: 'warn'});
								break;
						}
					} else if (Twinkle.prefs) {
						// Retain the hidden preferences that may have customised by the user from twinkleoptions.js
						// undefined if not set
						userValue = Twinkle.prefs[pref.name];
					}
				}
				if (userValue !== undefined) {
					newConfig[pref.name] = userValue;
				}
			});
		});
		let text = `// <nowiki>\n// twinkleoptions.js：用户Twinkle参数设置文件\n//\n// 注：修改您的参数设置最简单的办法是使用\n${`// Twinkle参数设置面板，在[[${Morebits.pageNameNorm}]]。\n`}//\n// 这个文件是自动生成的，您所做的任何修改（除了\n// 以一种合法的JavaScript的方式来修改这些属性值）会\n// 在下一次您点击“保存”时被覆盖。\n// 修改此文件时，请记得使用合法的JavaScript。\n\nwindow.Twinkle.prefs = `;
		text += JSON.stringify(newConfig, null, 2);
		text += ';\n\n// twinkleoptions.js到此为止\n// </nowiki>';
		pageobj.setPageText(text);
		pageobj.setEditSummary(`保存Twinkle参数设置：来自[[:${Morebits.pageNameNorm}]]的自动编辑`);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setCreateOption('recreate');
		pageobj.save(Twinkle.config.saveSuccess);
	};
	Twinkle.config.saveSuccess = (pageobj) => {
		pageobj.getStatusElement().info('成功');
		const noticebox = document.createElement('div');
		noticebox.className = 'mw-message-box mw-message-box-success';
		noticebox.style.fontSize = '100%';
		noticebox.style.marginTop = '2em';
		noticebox.innerHTML = `<p><b>您的Twinkle参数设置已被保存。</b></p><p>要看到这些更改，您可能需要${`<a href="${mw.util.getUrl(
			'QW:BYPASS'
		)}" title="QW:BYPASS"><b>`}绕过浏览器缓存</b></a>。</p>`;
		Morebits.status.root.appendChild(noticebox);
		const noticeclear = document.createElement('br');
		noticeclear.style.clear = 'both';
		Morebits.status.root.appendChild(noticeclear);
	};
	Twinkle.addInitCallback(Twinkle.config.init);
});
