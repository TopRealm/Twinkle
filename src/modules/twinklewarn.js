/* eslint-disable quote-props */
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
/* Twinkle.js - twinklewarn.js */
(($) => {
/**
 * twinklewarn.js: Warn module
 * Mode of invocation: Tab ("Warn")
 * Active on: Any page with relevant user name (userspace, contribs,
 * etc.), as well as the rollback success page
 */

const relevantUserName = mw.config.get('wgRelevantUserName');
Twinkle.warn = () => {
	if (relevantUserName) {
		Twinkle.addPortletLink(Twinkle.warn.callback, '警告', 'tw-warn', '警告或提醒用户');
		if (
			Twinkle.getPref('autoMenuAfterRollback') &&
				mw.config.get('wgNamespaceNumber') === 3 &&
				mw.util.getParamValue('vanarticle') &&
				!mw.util.getParamValue('friendlywelcome') &&
				!mw.util.getParamValue('noautowarn')
		) {
			Twinkle.warn.callback();
		}
	}

	// Modify URL of talk page on rollback success pages, makes use of a
	// custom message box in [[MediaWiki:Rollback-success]]
	if (mw.config.get('wgAction') === 'rollback') {
		const $vandalTalkLink = $('#mw-rollback-success').find('.mw-usertoollinks a').first();
		if ($vandalTalkLink.length > 0) {
			Twinkle.warn.makeVandalTalkLink($vandalTalkLink, Morebits.pageNameNorm);
			$vandalTalkLink.css('font-weight', 'bold');
		}
	}
	if (
		mw.config.get('wgCanonicalSpecialPageName') === 'AbuseLog' &&
			mw.config.get('wgAbuseFilterVariables') !== null
	) {
		const afTalkLink = $('.mw-usertoollinks-talk').first();
		if (afTalkLink.length > 0) {
			Twinkle.warn.makeVandalTalkLink(
				afTalkLink,
				mw.config.get('wgAbuseFilterVariables').page_prefixedtitle
			);
			afTalkLink.css('font-weight', 'bold');
		}
	}
};
Twinkle.warn.makeVandalTalkLink = ($vandalTalkLink, pagename) => {
	$vandalTalkLink.wrapInner(
		$('<span>').attr('title', '若合适，您可以用Twinkle在该用户讨论页上做出警告。')
	);
	const extraParam = `vanarticle=${mw.util.rawurlencode(pagename)}`;
	const href = $vandalTalkLink.attr('href');
	if (!href.includes('?')) {
		$vandalTalkLink.attr('href', `${href}?${extraParam}`);
	} else {
		$vandalTalkLink.attr('href', `${href}&${extraParam}`);
	}
};

// Used to close window when switching to ARV in autolevel
Twinkle.warn.dialog = null;
Twinkle.warn.callback = () => {
	if (
		relevantUserName === mw.config.get('wgUserName') &&
			!confirm('您将要警告自己！您确定要继续吗？')
	) {
		return;
	}
	const Window = new Morebits.simpleWindow(600, 440);
	Window.setTitle('警告或提醒用户');
	Window.setScriptName('Twinkle');
	Window.addFooterLink('警告设置', 'H:TW/PREF#警告');
	Window.addFooterLink('Twinkle帮助', 'H:TW/DOC#警告');
	const form = new Morebits.quickForm(Twinkle.warn.callback.evaluate);
	const main_select = form.append({
		type: 'field',
		label: '选择要发送的警告或提醒类型',
		tooltip: '首先选择一组，再选择具体的警告模板。'
	});
	const main_group = main_select.append({
		type: 'select',
		name: 'main_group',
		tooltip: '您可在Twinkle参数设置中设置默认选择的选项',
		event: Twinkle.warn.callback.change_category
	});
	const defaultGroup = Number.parseInt(Twinkle.getPref('defaultWarningGroup'), 10);
	main_group.append({
		type: 'option',
		label: '自动选择层级（1-4）',
		value: 'autolevel',
		selected: defaultGroup === 11
	});
	main_group.append({
		type: 'option',
		label: '1：提醒',
		value: 'level1',
		selected: defaultGroup === 1
	});
	main_group.append({
		type: 'option',
		label: '2：注意',
		value: 'level2',
		selected: defaultGroup === 2
	});
	main_group.append({
		type: 'option',
		label: '3：警告',
		value: 'level3',
		selected: defaultGroup === 3
	});
	main_group.append({
		type: 'option',
		label: '4：最后警告',
		value: 'level4',
		selected: defaultGroup === 4
	});
	main_group.append({
		type: 'option',
		label: '4im：唯一警告',
		value: 'level4im',
		selected: defaultGroup === 5
	});
	if (Twinkle.getPref('combinedSingletMenus')) {
		main_group.append({
			type: 'option',
			label: '单层级消息',
			value: 'singlecombined',
			selected: defaultGroup === 6 || defaultGroup === 7
		});
	} else {
		main_group.append({
			type: 'option',
			label: '单层级提醒',
			value: 'singlenotice',
			selected: defaultGroup === 6
		});
		main_group.append({
			type: 'option',
			label: '单层级警告',
			value: 'singlewarn',
			selected: defaultGroup === 7
		});
	}
	if (Twinkle.getPref('customWarningList').length > 0) {
		main_group.append({
			type: 'option',
			label: '自定义警告',
			value: 'custom',
			selected: defaultGroup === 9
		});
	}
	main_group.append({
		type: 'option',
		label: '所有警告模板',
		value: 'kitchensink',
		selected: defaultGroup === 10
	});
	main_select.append({
		type: 'select',
		name: 'sub_group',
		event: Twinkle.warn.callback.change_subcategory
	}); // Will be empty to begin with.

	form.append({
		type: 'input',
		name: 'article',
		label: '页面链接',
		value: mw.util.getParamValue('vanarticle') || '',
		size: 50,
		tooltip: '给模板中加入一页面链接，可留空。',
		placeholder: '仅限一个，勿使用网址、[[ ]]，可使用Special:Diff'
	});
	form.append({
		type: 'div',
		label: '',
		style: 'color: red',
		id: 'twinkle-warn-warning-messages'
	});
	const more = form.append({
		type: 'field',
		name: 'reasonGroup',
		label: '警告信息'
	});
	more.append({
		type: 'textarea',
		label: '可选信息：',
		name: 'reason',
		tooltip: '理由或是附加信息'
	});
	const previewlink = document.createElement('a');
	$(previewlink).on('click', () => {
		Twinkle.warn.callbacks.preview(result); // |result| is defined below
	});

	previewlink.style.cursor = 'pointer';
	previewlink.textContent = '预览';
	more.append({
		type: 'div',
		id: 'warningpreview',
		label: [previewlink]
	});
	more.append({
		type: 'div',
		id: 'twinklewarn-previewbox',
		style: 'display: none'
	});
	more.append({
		type: 'submit',
		label: '提交'
	});
	const result = form.render();
	Window.setContent(result);
	Window.display();
	result.main_group.root = result;
	result.previewer = new Morebits.wiki.preview(
		$(result).find('div#twinklewarn-previewbox').last()[0]
	);

	// Potential notices for staleness and missed reverts
	let message = '';
	let query = {};
	const vanrevid = mw.util.getParamValue('vanarticlerevid');
	if (vanrevid) {
		// If you tried reverting, check if *you* actually reverted
		if (!mw.util.getParamValue('noautowarn') && mw.util.getParamValue('vanarticle')) {
			// Via fluff link
			query = {
				action: 'query',
				titles: mw.util.getParamValue('vanarticle'),
				prop: 'revisions',
				rvstartid: vanrevid,
				rvlimit: 2,
				rvdir: 'newer',
				rvprop: 'user'
			};
			new Morebits.wiki.api('检查您是否成功回退该页面', query, (apiobj) => {
				const revertUser = $(apiobj.getResponse())
					.find('revisions rev')[1]
					.getAttribute('user');
				if (revertUser && revertUser !== mw.config.get('wgUserName')) {
					message += '其他人回退了该页面，并可能已经警告该用户。';
					$('#twinkle-warn-warning-messages').text(`注意：${message}`);
				}
			}).post();
		}

		// Confirm edit wasn't too old for a warning
		const checkStale = (vantimestamp) => {
			const revDate = new Morebits.date(vantimestamp);
			if (
				vantimestamp &&
					revDate.isValid() &&
					revDate.add(24, 'hours').isBefore(new Date())
			) {
				message += '这笔编辑是在24小时前做出的，现在警告可能已过时。';
				$('#twinkle-warn-warning-messages').text(`注意：${message}`);
			}
		};
		let vantimestamp = mw.util.getParamValue('vantimestamp');
		// Provided from a fluff module-based revert, no API lookup necessary
		if (vantimestamp) {
			checkStale(vantimestamp);
		} else {
			query = {
				action: 'query',
				prop: 'revisions',
				rvprop: 'timestamp',
				revids: vanrevid
			};
			new Morebits.wiki.api('获取版本时间戳', query, (apiobj) => {
				vantimestamp = $(apiobj.getResponse()).find('revisions rev').attr('timestamp');
				checkStale(vantimestamp);
			}).post();
		}
	}
	if (mw.util.isIPAddress(relevantUserName)) {
		query = {
			format: 'json',
			action: 'query',
			list: 'usercontribs',
			uclimit: 1,
			ucend: new Morebits.date()
				.subtract(30, 'days')
				.format('YYYY-MM-DDTHH:MM:ssZ', 'utc'),
			ucuser: relevantUserName
		};
		new Morebits.wiki.api('检查该IP用户上一笔贡献时间', query, (apiobj) => {
			if (apiobj.getResponse().query.usercontribs.length === 0) {
				message += '此IP用户上一次编辑在30日之前，现在警告可能已过时。';
				$('#twinkle-warn-warning-messages').text(`注意：${message}`);
			}
		}).post();
	}
	const init = () => {
		// We must init the first choice (General Note);
		const evt = document.createEvent('Event');
		evt.initEvent('change', true, true);
		result.main_group.dispatchEvent(evt);
	};
	init();
};

// This is all the messages that might be dispatched by the code
// Each of the individual templates require the following information:
//   label (required): A short description displayed in the dialog
//   summary (required): The edit summary used. If an article name is entered, the summary is postfixed with "on [[article]]", and it is always postfixed with ". $summaryAd"
//   suppressArticleInSummary (optional): Set to true to suppress showing the article name in the edit summary. Useful if the warning relates to attack pages, or some such.
Twinkle.warn.messages = {
	levels: {
		'不同类型的非建设编辑': {
			'uw-vandalism': {
				level1: {
					label: '明显的破坏',
					summary: '提醒：明显破坏'
				},
				level2: {
					label: '明显的破坏',
					summary: '注意：明显破坏'
				},
				level3: {
					label: '恶意破坏',
					summary: '警告：恶意破坏'
				},
				level4: {
					label: '恶意破坏',
					summary: '最后警告：恶意破坏'
				},
				level4im: {
					label: '恶意破坏',
					summary: '唯一警告：恶意破坏'
				}
			},
			'uw-test': {
				level1: {
					label: '进行编辑测试而未及时清理',
					summary: '提醒：进行编辑测试而未及时清理'
				},
				level2: {
					label: '进行损毁性的编辑测试',
					summary: '注意：进行编辑测试'
				},
				level3: {
					label: '编辑测试',
					summary: '警告：编辑测试'
				},
				level4: {
					label: '编辑测试',
					summary: '最后警告：编辑测试'
				}
			},
			'uw-delete': {
				level1: {
					label: '不恰当地移除页面内容、模板或资料',
					summary: '提醒：不恰当地移除页面内容、模板或资料'
				},
				level2: {
					label: '不恰当地移除页面内容、模板或资料',
					summary: '注意：不恰当地移除页面内容、模板或资料'
				},
				level3: {
					label: '不恰当地移除页面内容、模板或资料',
					summary: '警告：不恰当地移除页面内容、模板或资料'
				},
				level4: {
					label: '移除页面、移除内容或模板',
					summary: '最后警告：移除页面、移除内容或模板'
				},
				level4im: {
					label: '移除页面内容、模板或资料',
					summary: '唯一警告：移除页面内容、模板或资料'
				}
			},
			'uw-redirect': {
				level1: {
					label: '创建破坏性的重定向',
					summary: '提醒：创建破坏性的重定向'
				},
				level2: {
					label: '创建恶意重定向',
					summary: '注意：创建恶意重定向'
				},
				level3: {
					label: '创建恶意重定向',
					summary: '警告：创建恶意重定向'
				},
				level4: {
					label: '创建恶意重定向',
					summary: '最后警告：创建恶意重定向'
				},
				level4im: {
					label: '创建恶意重定向',
					summary: '唯一警告：创建恶意重定向'
				}
			},
			'uw-tdel': {
				level1: {
					label: '在问题仍未解决的情况下移除维护性模板',
					summary: '提醒：移除维护性模板'
				},
				level2: {
					label: '在问题仍未解决的情况下移除维护性模板',
					summary: '注意：移除维护性模板'
				},
				level3: {
					label: '移除维护性模板',
					summary: '警告：移除维护性模板'
				},
				level4: {
					label: '移除维护性模板',
					summary: '最后警告：移除维护性模板'
				}
			},
			'uw-joke': {
				level1: {
					label: '在百科全书内容中加入玩笑',
					summary: '提醒：加入不当玩笑'
				},
				level2: {
					label: '在百科全书内容中加入玩笑',
					summary: '注意：加入不当玩笑'
				},
				level3: {
					label: '在百科全书内容中加入不当玩笑',
					summary: '警告：在百科全书内容中加入不当玩笑'
				},
				level4: {
					label: '在百科全书内容中加入不当玩笑',
					summary: '最后警告：在百科全书内容中加入不当玩笑'
				},
				level4im: {
					label: '加入不当玩笑',
					summary: '唯一警告：加入不当玩笑'
				}
			},
			'uw-create': {
				level1: {
					label: '创建不当页面',
					summary: '提醒：创建不当页面'
				},
				level2: {
					label: '创建不当页面',
					summary: '注意：创建不当页面'
				},
				level3: {
					label: '创建不当页面',
					summary: '警告：创建不当页面'
				},
				level4: {
					label: '创建不当页面',
					summary: '最后警告：创建不当页面'
				},
				level4im: {
					label: '创建不当页面',
					summary: '唯一警告：创建不当页面'
				}
			},
			'uw-upload': {
				level1: {
					label: '上传不当图像',
					summary: '提醒：上传不当图像'
				},
				level2: {
					label: '上传不当图像',
					summary: '注意：上传不当图像'
				},
				level3: {
					label: '上传不当图像',
					summary: '警告：上传不当图像'
				},
				level4: {
					label: '上传不当图像',
					summary: '最后警告：上传不当图像'
				},
				level4im: {
					label: '上传不当图像',
					summary: '唯一警告：上传不当图像'
				}
			},
			'uw-image': {
				level1: {
					label: '在页面中加入不当图片',
					summary: '提醒：在页面中加入不当图片'
				},
				level2: {
					label: '在页面中加入不当图片',
					summary: '注意：在页面中加入不当图片'
				},
				level3: {
					label: '在页面中加入不当图片',
					summary: '警告：在页面中加入不当图片'
				},
				level4: {
					label: '在页面中加入不当图片',
					summary: '最后警告：在页面中加入不当图片'
				},
				level4im: {
					label: '加入不恰当的图片',
					summary: '唯一警告：加入不恰当的图片'
				}
			},
			'uw-nor': {
				level1: {
					label: '在条目中加入原创研究',
					summary: '提醒：在条目中加入原创研究'
				},
				level2: {
					label: '在条目中加入原创研究',
					summary: '注意：在条目中加入原创研究'
				},
				level3: {
					label: '在条目中加入原创研究',
					summary: '警告：在条目中加入原创研究'
				}
			},
			'uw-politicalbias': {
				level1: {
					label: '违反两岸四地用语、朝鲜半岛用语等相关规定',
					summary: '提醒：违反两岸四地用语、朝鲜半岛用语等相关规定'
				},
				level2: {
					label: '违反两岸四地用语、朝鲜半岛用语等相关规定',
					summary: '注意：违反两岸四地用语、朝鲜半岛用语等相关规定'
				},
				level3: {
					label: '违反两岸四地用语、朝鲜半岛用语等相关规定',
					summary: '警告：违反两岸四地用语、朝鲜半岛用语等相关规定'
				},
				level4: {
					label: '违反两岸四地用语、朝鲜半岛用语等相关规定',
					summary: '最后警告：违反两岸四地用语、朝鲜半岛用语等相关规定'
				},
				level4im: {
					label: '违反两岸四地用语、朝鲜半岛用语等相关规定',
					summary: '唯一警告：违反两岸四地用语、朝鲜半岛用语等相关规定'
				}
			}
		},
		'增加商品或政治广告': {
			'uw-spam': {
				level1: {
					label: '增加不合适的外部链接',
					summary: '提醒：增加不合适的外部链接'
				},
				level2: {
					label: '增加垃圾链接',
					summary: '注意：增加垃圾链接'
				},
				level3: {
					label: '增加垃圾链接',
					summary: '警告：增加垃圾链接'
				},
				level4: {
					label: '增加垃圾链接',
					summary: '最后警告：增加垃圾链接'
				},
				level4im: {
					label: '增加垃圾连结',
					summary: '唯一警告：增加垃圾连结'
				}
			},
			'uw-advert': {
				level1: {
					label: '利用求闻百科来发布广告或推广',
					summary: '提醒：利用求闻百科来发布广告或推广'
				},
				level2: {
					label: '利用求闻百科来发布广告或推广',
					summary: '注意：利用求闻百科来发布广告或推广'
				},
				level3: {
					label: '利用求闻百科来发布广告或推广',
					summary: '警告：利用求闻百科来发布广告或推广'
				},
				level4: {
					label: '利用求闻百科来发布广告或推广',
					summary: '最后警告：利用求闻百科来发布广告或推广'
				}
			},
			'uw-npov': {
				level1: {
					label: '不遵守中立的观点方针',
					summary: '提醒：不遵守中立的观点方针'
				},
				level2: {
					label: '不遵守中立的观点方针',
					summary: '注意：不遵守中立的观点方针'
				},
				level3: {
					label: '违反中立的观点方针',
					summary: '警告：违反中立的观点方针'
				},
				level4: {
					label: '违反中立的观点方针',
					summary: '最后警告：违反中立的观点方针'
				}
			}
		},
		'加插不实及/或诽谤文字': {
			'uw-unsourced': {
				level1: {
					label: '加入没有可靠来源佐证的内容',
					summary: '提醒：加入没有可靠来源佐证的内容'
				},
				level2: {
					label: '加入没有可靠来源佐证的内容',
					summary: '注意：加入没有可靠来源佐证的内容'
				},
				level3: {
					label: '加入没有可靠来源佐证的内容',
					summary: '警告：加入没有可靠来源佐证的内容'
				}
			},
			'uw-error': {
				level1: {
					label: '故意加入不实内容',
					summary: '提醒：故意加入不实内容'
				},
				level2: {
					label: '故意加入不实内容',
					summary: '注意：故意加入不实内容'
				},
				level3: {
					label: '故意加入不实内容',
					summary: '警告：故意加入不实内容'
				}
			},
			'uw-biog': {
				level1: {
					label: '在生者传记中加入没有可靠来源佐证而且可能引发争议的内容',
					summary: '提醒：在生者传记中加入没有可靠来源佐证而且可能引发争议的内容'
				},
				level2: {
					label: '在生者传记中加入没有可靠来源佐证而且可能引发争议的内容',
					summary: '注意：在生者传记中加入没有可靠来源佐证而且可能引发争议的内容'
				},
				level3: {
					label: '在生者传记中加入没有可靠来源佐证而且带有争议的内容',
					summary: '警告：在生者传记中加入没有可靠来源佐证而且可能引发争议的内容'
				},
				level4: {
					label: '加入有关在生人物而又缺乏来源的资料',
					summary: '最后警告：加入有关在生人物而又缺乏来源的资料'
				},
				level4im: {
					label: '加入有关在生人物而又缺乏来源的资料',
					summary: '唯一警告：加入有关在生人物而又缺乏来源的资料'
				}
			},
			'uw-defamatory': {
				level1: {
					label: '加入诽谤内容',
					summary: '提醒：加入诽谤内容'
				},
				level2: {
					label: '加入诽谤内容',
					summary: '注意：加入诽谤内容'
				},
				level3: {
					label: '加入诽谤内容',
					summary: '警告：加入诽谤内容'
				},
				level4: {
					label: '加入诽谤内容',
					summary: '最后警告：加入诽谤内容'
				},
				level4im: {
					label: '加入诽谤内容',
					summary: '唯一警告：加入诽谤内容'
				}
			}
		},
		'翻译品质': {
			'uw-roughtranslation': {
				level1: {
					label: '您翻译的质量有待改善',
					summary: '提醒：您翻译的质量有待改善'
				},
				level2: {
					label: '粗劣翻译',
					summary: '注意：粗劣翻译'
				},
				level3: {
					label: '粗劣翻译',
					summary: '警告：粗劣翻译'
				}
			}
		},
		'非能接受且违反方针或指引的单方面行为或操作': {
			'uw-mos': {
				level1: {
					label: '不恰当的条目格式、日期、语言等',
					summary: '提醒：不恰当的条目格式、日期、语言等'
				},
				level2: {
					label: '不恰当的条目格式、日期、语言等',
					summary: '注意：不恰当的条目格式、日期、语言等'
				},
				level3: {
					label: '违反格式、日期、语言等规定',
					summary: '警告：违反格式、日期、语言等规定'
				},
				level4: {
					label: '违反格式、日期、语言等相关规定',
					summary: '最后警告：违反格式、日期、语言等相关规定'
				}
			},
			'uw-move': {
				level1: {
					label: '无故移动条目/新名称不符合命名规范',
					summary: '提醒：不恰当地移动页面'
				},
				level2: {
					label: '把页面移动到不恰当、违反命名常规或违反共识的标题',
					summary: '注意：不恰当地移动页面'
				},
				level3: {
					label: '不恰当地移动页面',
					summary: '警告：不恰当地移动页面'
				},
				level4: {
					label: '不恰当地移动页面',
					summary: '最后警告：不恰当地移动页面'
				},
				level4im: {
					label: '不恰当地移动页面',
					summary: '唯一警告：不恰当地移动页面'
				}
			},
			'uw-cd': {
				level1: {
					label: '清空讨论页',
					summary: '提醒：清空讨论页'
				},
				level2: {
					label: '清空讨论页',
					summary: '注意：清空讨论页'
				},
				level3: {
					label: '清空讨论页',
					summary: '警告：清空讨论页'
				}
			},
			'uw-chat': {
				level1: {
					label: '在讨论页发表与改善条目无关的内容',
					summary: '提醒：在讨论页发表与改善条目无关的内容'
				},
				level2: {
					label: '在讨论页发表与改善条目无关的内容',
					summary: '注意：在讨论页发表与改善条目无关的内容'
				},
				level3: {
					label: '在讨论页发表无关内容',
					summary: '警告：在讨论页发表无关内容'
				},
				level4: {
					label: '在讨论页进行不当讨论',
					summary: '最后警告：在讨论页进行不当讨论'
				}
			},
			'uw-tpv': {
				level1: {
					label: '修改他人留言',
					summary: '提醒：修改他人留言'
				},
				level2: {
					label: '修改他人留言',
					summary: '注意：修改他人留言'
				},
				level3: {
					label: '修改他人留言',
					summary: '警告：修改他人留言'
				}
			},
			'uw-afd': {
				level1: {
					label: '移除{{afd}}（页面存废讨论）模板',
					summary: '提醒：移除{{afd}}（页面存废讨论）模板'
				},
				level2: {
					label: '移除{{afd}}（页面存废讨论）模板',
					summary: '注意：移除{{afd}}（页面存废讨论）模板'
				},
				level3: {
					label: '移除{{afd}}（页面存废讨论）模板',
					summary: '警告：移除{{afd}}（页面存废讨论）模板'
				},
				level4: {
					label: '移除{{afd}}模板',
					summary: '最后警告：移除{{afd}}模板'
				}
			},
			'uw-speedy': {
				level1: {
					label: '移除{{delete}}（快速删除）模板',
					summary: '提醒：移除{{delete}}（快速删除）模板'
				},
				level2: {
					label: '移除{{delete}}（快速删除）模板',
					summary: '注意：移除{{delete}}（快速删除）模板'
				},
				level3: {
					label: '移除{{delete}}（快速删除）模板',
					summary: '警告：移除{{delete}}（快速删除）模板'
				},
				level4: {
					label: '移除{{delete}}模板',
					summary: '最后警告：移除{{delete}}模板'
				}
			}
		},
		'对其他用户和条目的态度': {
			'uw-npa': {
				level1: {
					label: '针对用户的人身攻击',
					summary: '提醒：针对用户的人身攻击'
				},
				level2: {
					label: '针对用户的人身攻击',
					summary: '注意：针对用户的人身攻击'
				},
				level3: {
					label: '针对用户的人身攻击',
					summary: '警告：针对用户的人身攻击'
				},
				level4: {
					label: '针对用户的人身攻击',
					summary: '最后警告：针对用户的人身攻击'
				},
				level4im: {
					label: '针对用户的人身攻击',
					summary: '唯一警告：针对用户的人身攻击'
				}
			},
			'uw-agf': {
				level1: {
					label: '没有假定善意',
					summary: '提醒：没有假定善意'
				},
				level2: {
					label: '没有假定善意',
					summary: '注意：没有假定善意'
				},
				level3: {
					label: '没有假定善意',
					summary: '警告：没有假定善意'
				}
			},
			'uw-own': {
				level1: {
					label: '主张条目所有权',
					summary: '提醒：主张条目所有权'
				},
				level2: {
					label: '主张条目的所有权',
					summary: '注意：主张条目的所有权'
				},
				level3: {
					label: '主张条目的所有权',
					summary: '警告：主张条目的所有权'
				}
			},
			'uw-tempabuse': {
				level1: {
					label: '不当使用警告或封禁模板',
					summary: '提醒：不当使用警告或封禁模板'
				},
				level2: {
					label: '不当使用警告或封禁模板',
					summary: '注意：不当使用警告或封禁模板'
				},
				level3: {
					label: '不当使用警告或封禁模板',
					summary: '警告：不当使用警告或封禁模板'
				},
				level4: {
					label: '不当使用警告或封禁模板',
					summary: '最后警告：不当使用警告或封禁模板'
				},
				level4im: {
					label: '不当使用警告或封禁模板',
					summary: '唯一警告：不当使用警告或封禁模板'
				}
			}
		}
	},
	singlenotice: {
		'uw-2redirect': {
			label: '在移动页面后应该修复双重重定向',
			summary: '提醒：在移动页面后应该修复双重重定向'
		},
		'uw-aiv': {
			label: '举报的并不是破坏者，或者举报破坏前未进行警告',
			summary: '提醒：不恰当地举报破坏'
		},
		'uw-articlesig': {
			label: '在条目中签名',
			summary: '提醒：在条目中签名'
		},
		'uw-autobiography': {
			label: '建立自传',
			summary: '提醒：建立自传'
		},
		'uw-badcat': {
			label: '加入错误的页面分类',
			summary: '提醒：加入错误的页面分类'
		},
		'uw-bite': {
			label: '伤害新手',
			summary: '提醒：伤害新手'
		},
		'uw-booktitle': {
			label: '没有使用书名号来标示书籍、电影、音乐专辑等',
			summary: '提醒：没有使用书名号来标示书籍、电影、音乐专辑等'
		},
		'uw-c&pmove': {
			label: '剪贴移动',
			summary: '提醒：剪贴移动'
		},
		'uw-chinese': {
			label: '请使用标准汉语沟通',
			summary: '提醒：请使用标准汉语沟通'
		},
		'uw-coi': {
			label: '利益冲突',
			summary: '提醒：利益冲突'
		},
		'uw-concovid19': {
			label: '违反COVID-19条目共识',
			summary: '提醒：违反COVID-19条目共识'
		},
		'uw-copyright-friendly': {
			label: '初次加入侵犯版权的内容',
			summary: '提醒：初次加入侵犯版权的内容'
		},
		'uw-copyviorewrite': {
			label: '在侵权页面直接重写条目',
			summary: '提醒：在侵权页面直接重写条目'
		},
		'uw-crystal': {
			label: '加入臆测或未确认的讯息',
			summary: '提醒：加入臆测或未确认的讯息'
		},
		'uw-csd': {
			label: '快速删除理由不当',
			summary: '提醒：快速删除理由不当'
		},
		'uw-dab': {
			label: '消歧义页格式错误',
			summary: '提醒：消歧义页格式错误'
		},
		'uw-editsummary': {
			label: '没有使用编辑摘要',
			summary: '提醒：没有使用编辑摘要'
		},
		'uw-hangon': {
			label: '没有在讨论页说明暂缓快速删除理由',
			summary: '提醒：没有在讨论页说明暂缓快速删除理由'
		},
		'uw-lang': {
			label: '不必要地将文字换成简体或繁体中文',
			summary: '提醒：不必要地将文字换成简体或繁体中文'
		},
		'uw-langmove': {
			label: '不必要地将标题换成简体或繁体中文',
			summary: '提醒：不必要地将标题换成简体或繁体中文'
		},
		'uw-linking': {
			label: '过度加入红字连结或重复蓝字连结',
			summary: '提醒：过度加入红字连结或重复蓝字连结'
		},
		'uw-minor': {
			label: '不适当地使用小修改选项',
			summary: '提醒：不适当地使用小修改选项'
		},
		'uw-notaiv': {
			label: '向“当前的破坏”中报告的是用户纷争而不是破坏',
			summary: '提醒：向“当前的破坏”中报告的是用户纷争而不是破坏'
		},
		'uw-notvote': {
			label: '我们以共识处事，而不仅仅是投票',
			summary: '提醒：我们以共识处事，而不仅仅是投票'
		},
		'uw-preview': {
			label: '请使用预览按钮来避免不必要的错误',
			summary: '提醒：请使用预览按钮来避免不必要的错误'
		},
		'uw-sandbox': {
			label: '移除沙盒的置顶模板{{sandbox}}',
			summary: '提醒：移除沙盒的置顶模板{{sandbox}}'
		},
		'uw-selfrevert': {
			label: '感谢您自行回退自己的测试，以后不要再这样做了',
			summary: '提醒：回退个人的测试'
		},
		'uw-subst': {
			label: '谨记要替代模板（subst）',
			summary: '提醒：谨记要替代模板'
		},
		'uw-talkinarticle': {
			label: '在条目页中留下意见',
			summary: '提醒：在条目页中留下意见'
		},
		'uw-tilde': {
			label: '没有在讨论页上签名',
			summary: '提醒：没有在讨论页上签名'
		},
		'uw-translated': {
			label: '翻译条目未标注原作者',
			summary: '提醒：翻译条目未标注原作者'
		},
		'uw-uaa': {
			label: '向需要管理员注意的用户名报告的用户名称并不违反方针',
			summary: '提醒：向需要管理员注意的用户名报告的用户名称并不违反方针'
		},
		'uw-warn': {
			label: '警告破坏用户',
			summary: '提醒：警告破坏用户'
		},
		'uw-mosiw': {
			label: '不要使用跨语言链接',
			summary: '提醒：不要使用跨语言链接'
		},
		'uw-badtwinkle': {
			label: '不恰当地使用Twinkle警告别人',
			summary: '提醒：不恰当地使用Twinkle警告别人'
		}
	},
	singlewarn: {
		'uw-3rr': {
			label: '用户潜在违反回退不过三原则的可能性',
			summary: '警告：用户潜在违反回退不过三原则的可能性'
		},
		'uw-attack': {
			label: '建立人身攻击页面',
			summary: '警告：建立人身攻击页面',
			suppressArticleInSummary: true
		},
		'uw-bv': {
			label: '公然地破坏',
			summary: '警告：公然地破坏'
		},
		'uw-canvass': {
			label: '不恰当地拉票',
			summary: '警告：不恰当地拉票'
		},
		'uw-copyright': {
			label: '侵犯版权',
			summary: '警告：侵犯版权'
		},
		'uw-copyright-link': {
			label: '连结到有版权的材料',
			summary: '警告：连结到有版权的材料'
		},
		'uw-fakesource': {
			label: '虚构资料来源或引文',
			summary: '警告：虚构资料来源或引文'
		},
		'uw-hoax': {
			label: '建立恶作剧',
			summary: '警告：建立恶作剧'
		},
		'uw-incompletecite': {
			label: '列出的资料来源欠缺若干详情而不易查找',
			summary: '警告：列出的资料来源欠缺若干详情而不易查找'
		},
		'uw-longterm': {
			label: '长期的破坏',
			summary: '警告：长期的破坏'
		},
		'uw-npov-tvd': {
			label: '在剧集条目中加入奸角等非中立描述',
			summary: '警告：在剧集条目中加入奸角等非中立描述'
		},
		'uw-pinfo': {
			label: '张贴他人隐私',
			summary: '警告：张贴他人隐私'
		},
		'uw-upv': {
			label: '破坏他人用户页',
			summary: '警告：破坏他人用户页'
		},
		'uw-selfinventedname': {
			label: '不适当地自创新名词、新译名',
			summary: '警告：不适当地自创新名词、新译名'
		},
		'uw-substub': {
			label: '创建小小作品',
			summary: '警告：创建小小作品'
		},
		'uw-username': {
			label: '使用不恰当的用户名',
			summary: '警告：使用不恰当的用户名',
			suppressArticleInSummary: true
		},
		'uw-wrongsummary': {
			label: '在编辑摘要制造不适当的内容',
			summary: '警告：在编辑摘要制造不适当的内容'
		}
	}
};

// Used repeatedly below across menu rebuilds
Twinkle.warn.prev_article = null;
Twinkle.warn.prev_reason = null;
Twinkle.warn.talkpageObj = null;
Twinkle.warn.callback.change_category = (e) => {
	const value = e.target.value;
	const sub_group = e.target.root.sub_group;
	sub_group.main_group = value;
	let old_subvalue = sub_group.value;
	let old_subvalue_re;
	if (old_subvalue) {
		if (value === 'kitchensink') {
			// Exact match possible in kitchensink menu
			old_subvalue_re = new RegExp(mw.util.escapeRegExp(old_subvalue));
		} else {
			old_subvalue = old_subvalue.replace(/\d*(im)?$/, '');
			old_subvalue_re = new RegExp(`${mw.util.escapeRegExp(old_subvalue)}(\\d*(?:im)?)$`);
		}
	}
	while (sub_group.hasChildNodes()) {
		sub_group.firstChild.remove();
	}
	let selected = false;
	// worker function to create the combo box entries
	const createEntries = (contents, container, wrapInOptgroup, val = value) => {
		// level2->2, singlewarn->''; also used to distinguish the
		// scaled levels from singlenotice, singlewarn, and custom
		const level = val.replace(/^\D+/g, '');
		// due to an apparent iOS bug, we have to add an option-group to prevent truncation of text
		// (search WT:TW archives for "Problem selecting warnings on an iPhone")
		if (wrapInOptgroup && $.client.profile().platform === 'iphone') {
			let wrapperOptgroup = new Morebits.quickForm.element({
				type: 'optgroup',
				label: '可用模板'
			});
			wrapperOptgroup = wrapperOptgroup.render();
			container.appendChild(wrapperOptgroup);
			container = wrapperOptgroup;
		}
		$.each(contents, (itemKey, itemProperties) => {
			// Skip if the current template doesn't have a version for the current level
			if (!!level && !itemProperties[val]) {
				return;
			}
			const key = typeof itemKey === 'string' ? itemKey : itemProperties.value;
			const template = key + level;
			const elem = new Morebits.quickForm.element({
				type: 'option',
				label: `{{${template}}}: ${
					level ? itemProperties[val].label : itemProperties.label
				}`,
				value: template
			});

			// Select item best corresponding to previous selection
			if (!selected && old_subvalue && old_subvalue_re.test(template)) {
				elem.data.selected = selected = true;
			}
			const elemRendered = container.appendChild(elem.render());
			$(elemRendered).data('messageData', itemProperties);
		});
	};
	switch (value) {
		case 'singlenotice':
		case 'singlewarn': {
			createEntries(Twinkle.warn.messages[value], sub_group, true);
			break;
		}
		case 'singlecombined': {
			const unSortedSinglets = $.extend(
				{},
				Twinkle.warn.messages.singlenotice,
				Twinkle.warn.messages.singlewarn
			);
			const sortedSingletMessages = {};

			Object.keys(unSortedSinglets)
				.sort()
				.forEach((key) => {
					sortedSingletMessages[key] = unSortedSinglets[key];
				});
			createEntries(sortedSingletMessages, sub_group, true);
			break;
		}
		case 'custom': {
			createEntries(Twinkle.getPref('customWarningList'), sub_group, true);
			break;
		}
		case 'kitchensink': {
			['level1', 'level2', 'level3', 'level4', 'level4im'].forEach((lvl) => {
				$.each(Twinkle.warn.messages.levels, (_, levelGroup) => {
					createEntries(levelGroup, sub_group, true, lvl);
				});
			});
			createEntries(Twinkle.warn.messages.singlenotice, sub_group, true);
			createEntries(Twinkle.warn.messages.singlewarn, sub_group, true);
			createEntries(Twinkle.getPref('customWarningList'), sub_group, true);
			break;
		}
		case 'level1':
		case 'level2':
		case 'level3':
		case 'level4':
		case 'level4im': {
			// Creates subgroup regardless of whether there is anything to place in it;
			// leaves "Removal of deletion tags" empty for 4im
			$.each(Twinkle.warn.messages.levels, (groupLabel, groupContents) => {
				let optgroup = new Morebits.quickForm.element({
					type: 'optgroup',
					label: groupLabel
				});
				optgroup = optgroup.render();
				sub_group.appendChild(optgroup);
				// create the options
				createEntries(groupContents, optgroup, false);
			});
			break;
		}
		case 'autolevel': {
			// Check user page to determine appropriate level
			const autolevelProc = () => {
				const wikitext = Twinkle.warn.talkpageObj.getPageText();
				// history not needed for autolevel
				const latest = Twinkle.warn.callbacks.dateProcessing(wikitext)[0];
				// Pseudo-params with only what's needed to parse the level i.e. no messageData
				const params = {
					sub_group: old_subvalue,
					article: e.target.root.article.value
				};
				const lvl = `level${
					Twinkle.warn.callbacks.autolevelParseWikitext(wikitext, params, latest)[1]
				}`;

				// Identical to level1, etc. above but explicitly provides the level
				$.each(Twinkle.warn.messages.levels, (groupLabel, groupContents) => {
					let optgroup = new Morebits.quickForm.element({
						type: 'optgroup',
						label: groupLabel
					});
					optgroup = optgroup.render();
					sub_group.appendChild(optgroup);
					// create the options
					createEntries(groupContents, optgroup, false, lvl);
				});

				// Trigger subcategory change, add select menu, etc.
				Twinkle.warn.callback.postCategoryCleanup(e);
			};
			if (Twinkle.warn.talkpageObj) {
				autolevelProc();
			} else {
				const usertalk_page = new Morebits.wiki.page(
					`User_talk:${relevantUserName}`,
					'加载上次警告'
				);
				usertalk_page.setFollowRedirect(true, false);
				usertalk_page.load(
					(pageobj) => {
						Twinkle.warn.talkpageObj = pageobj; // Update talkpageObj
						autolevelProc();
					},
					() => {
						// Catch and warn if the talkpage can't load,
						// most likely because it's a cross-namespace redirect
						// Supersedes the typical $autolevelMessage added in autolevelParseWikitext
						const $noTalkPageNode = $('<strong>', {
							text: '无法加载用户讨论页，这可能是因为它是跨命名空间重定向，自动选择警告级别将不会运作。',
							id: 'twinkle-warn-autolevel-message',
							css: {
								color: 'red'
							}
						});
						$noTalkPageNode.insertBefore($('#twinkle-warn-warning-messages'));
						// If a preview was opened while in a different mode, close it
						// Should nullify the need to catch the error in preview callback
						e.target.root.previewer.closePreview();
					}
				);
			}
			break;
		}
		default: {
			alert('twinklewarn：未知的警告组');
			break;
		}
	}

	// Trigger subcategory change, add select menu, etc.
	// Here because of the async load for autolevel
	if (value !== 'autolevel') {
		// reset any autolevel-specific messages while we're here
		$('#twinkle-warn-autolevel-message').remove();
		Twinkle.warn.callback.postCategoryCleanup(e);
	}
};
Twinkle.warn.callback.postCategoryCleanup = (e) => {
	// clear overridden label on article textbox
	Morebits.quickForm.setElementTooltipVisibility(e.target.root.article, true);
	Morebits.quickForm.resetElementLabel(e.target.root.article);
	// Trigger custom label/change on main category change
	Twinkle.warn.callback.change_subcategory(e);

	// Use select2 to make the select menu searchable
	if (!Twinkle.getPref('oldSelect')) {
		$('select[name=sub_group]')
			.select2({
				width: '100%',
				matcher: Morebits.select2.matchers.optgroupFull,
				templateResult: Morebits.select2.highlightSearchMatches,
				language: {
					searching: Morebits.select2.queryInterceptor
				}
			})
			.change(Twinkle.warn.callback.change_subcategory);
		$('.select2-selection').on('keydown', Morebits.select2.autoStart).trigger('focus');
		mw.util.addCSS(
			// Increase height
			'.select2-container .select2-dropdown .select2-results > .select2-results__options { max-height: 350px; }' +
					// Reduce padding
					'.select2-results .select2-results__option { padding-top: 1px; padding-bottom: 1px; }.select2-results .select2-results__group { padding-top: 1px; padding-bottom: 1px; } ' +
					// Adjust font size
					'.select2-container .select2-dropdown .select2-results { font-size: 13px; }.select2-container .selection .select2-selection__rendered { font-size: 13px; }'
		);
	}
};
Twinkle.warn.callback.change_subcategory = (e) => {
	const main_group = e.target.form.main_group.value;
	const value = e.target.form.sub_group.value;

	// Tags that don't take a linked article, but something else (often a username).
	// The value of each tag is the label next to the input field
	const notLinkedArticle = {
		'uw-bite': '被“咬到”的用户（不含User:） ',
		'uw-username': '用户名违反方针，因为…… ',
		'uw-aiv': '可选输入被警告的用户名（不含User:） '
	};
	if (['singlenotice', 'singlewarn', 'singlecombined', 'kitchensink'].includes(main_group)) {
		if (notLinkedArticle[value]) {
			if (Twinkle.warn.prev_article === null) {
				Twinkle.warn.prev_article = e.target.form.article.value;
			}
			e.target.form.article.notArticle = true;
			e.target.form.article.value = '';

			// change form labels according to the warning selected
			Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, false);
			Morebits.quickForm.overrideElementLabel(
				e.target.form.article,
				notLinkedArticle[value]
			);
		} else if (e.target.form.article.notArticle) {
			if (Twinkle.warn.prev_article !== null) {
				e.target.form.article.value = Twinkle.warn.prev_article;
				Twinkle.warn.prev_article = null;
			}
			e.target.form.article.notArticle = false;
			Morebits.quickForm.setElementTooltipVisibility(e.target.form.article, true);
			Morebits.quickForm.resetElementLabel(e.target.form.article);
		}
	}

	// add big red notice, warning users about how to use {{uw-[coi-]username}} appropriately
	$('#tw-warn-red-notice').remove();
	let $redWarning;
	if (value === 'uw-username') {
		$redWarning = $(
			"<div style='color: red;' id='tw-warn-red-notice'>{{uw-username}}<b>不应</b>被用于<b>明显</b>违反用户名方针的用户。明显的违反方针应被报告给UAA。{{uw-username}}应只被用在边界情况下需要与用户讨论时。</div>"
		);
		$redWarning.insertAfter(
			Morebits.quickForm.getElementLabelObject(e.target.form.reasonGroup)
		);
	}
};
Twinkle.warn.callbacks = {
	getWarningWikitext: (templateName, article, reason, _isCustom, noSign) => {
		let text = `{{subst:${templateName}`;

		// add linked article for user warnings
		if (article) {
			text += `|1=${article}`;
		}
		if (reason) {
			// add extra message
			text += templateName === 'uw-csd' ? `|3=${reason}` : `|2=${reason}`;
		}
		text += '|subst=subst:}}';
		if (!noSign) {
			text += ' ~~' + '~~';
		}
		return text;
	},
	showPreview: (form, templatename) => {
		const input = Morebits.quickForm.getInputData(form);
		// Provided on autolevel, not otherwise
		templatename ||= input.sub_group;
		const linkedarticle = input.article;
		const templatetext = Twinkle.warn.callbacks.getWarningWikitext(
			templatename,
			linkedarticle,
			input.reason,
			input.main_group === 'custom'
		);
		form.previewer.beginRender(templatetext, `User_talk:${relevantUserName}`); // Force wikitext/correct username
	},

	// Just a pass-through unless the autolevel option was selected
	preview: (form) => {
		if (form.main_group.value === 'autolevel') {
			// Always get a new, updated talkpage for autolevel processing
			const usertalk_page = new Morebits.wiki.page(
				`User_talk:${relevantUserName}`,
				'加载上次警告'
			);
			usertalk_page.setFollowRedirect(true, false);
			// Will fail silently if the talk page is a cross-ns redirect,
			// removal of the preview box handled when loading the menu
			usertalk_page.load((pageobj) => {
				Twinkle.warn.talkpageObj = pageobj; // Update talkpageObj

				const wikitext = pageobj.getPageText();
				// history not needed for autolevel
				const latest = Twinkle.warn.callbacks.dateProcessing(wikitext)[0];
				const params = {
					sub_group: form.sub_group.value,
					article: form.article.value,
					messageData: $(form.sub_group)
						.find(`option[value="${$(form.sub_group).val()}"]`)
						.data('messageData')
				};
				const template = Twinkle.warn.callbacks.autolevelParseWikitext(
					wikitext,
					params,
					latest
				)[0];
				Twinkle.warn.callbacks.showPreview(form, template);

				// If the templates have diverged, fake a change event
				// to reload the menu with the updated pageobj
				if (form.sub_group.value !== template) {
					const evt = document.createEvent('Event');
					evt.initEvent('change', true, true);
					form.main_group.dispatchEvent(evt);
				}
			});
		} else {
			Twinkle.warn.callbacks.showPreview(form);
		}
	},
	/**
	 * Used in the main and autolevel loops to determine when to warn
	 * about excessively recent, stale, or identical warnings.
	 *
	 * @param {string} wikitext  The text of a user's talk page, from getPageText()
	 * @returns {Object[]} - Array of objects: latest contains most recent
	 * warning and date; history lists all prior warnings
	 */
	dateProcessing: (wikitext) => {
		const history_re =
				/<!--\s?Template:([Uu]w-.*?)\s?-->.*?(\d{4})年(\d{1,2})月(\d{1,2})日 \([一三二五六四日]\) (\d{1,2}):(\d{1,2}) \(UTC\)/g;
		const history = {};
		const latest = {
			date: new Morebits.date(0),
			type: ''
		};
		let current;
		while ((current = history_re.exec(wikitext)) !== null) {
			const template = current[1];
			const current_date = new Morebits.date(
				`${current[2]}-${current[3]}-${current[4]} ${current[5]}:${current[6]} UTC`
			);
			if (!(template in history) || history[template].isBefore(current_date)) {
				history[template] = current_date;
			}
			if (!latest.date.isAfter(current_date)) {
				latest.date = current_date;
				latest.type = template;
			}
		}
		return [latest, history];
	},
	/**
	 * Main loop for deciding what the level should increment to. Most of
	 * this is really just error catching and updating the subsequent data.
	 * May produce up to two notices in a twinkle-warn-autolevel-messages div
	 *
	 * @param {string} _wikitext  The text of a user's talk page, from getPageText() (required)
	 * @param {Object} params  Params object: sub_group is the template (required);
	 * article is the user-provided article (form.article) used to link ARV on recent level4 warnings;
	 * messageData is only necessary if getting the full template, as it's
	 * used to ensure a valid template of that level exists
	 * @param {Object} latest  First element of the array returned from
	 * dateProcessing. Provided here rather than processed within to avoid
	 * repeated call to dateProcessing
	 * @param {(Date|Morebits.date)} date  Date from which staleness is determined
	 * @param {Morebits.status} statelem  Status element, only used for handling error in final execution
	 *
	 * @returns {Array} - Array that contains the full template and just the warning level
	 */
	autolevelParseWikitext: (_wikitext, params, latest, date, statelem) => {
		let level; // undefined rather than '' means the Number.isNaN below will return true
		if (/\d(?:im)?$/.test(latest.type)) {
			// level1-4im
			level = Number.parseInt(latest.type.replace(/.*(\d)(?:im)?$/, '$1'), 10);
		} else if (latest.type) {
			// Non-numbered warning
			// Try to leverage existing categorization of
			// warnings, all but one are universally lowercased
			const loweredType = latest.type.toLowerCase();
			// It would be nice to account for blocks, but in most
			// cases the hidden message is terminal, not the sig
			level = Twinkle.warn.messages.singlewarn[loweredType] ? 3 : 1; // singlenotice or not found
		}

		const $autolevelMessage = $('<div>', {
			id: 'twinkle-warn-autolevel-message'
		});
		if (Number.isNaN(level)) {
			// No prior warnings found, this is the first
			level = 1;
		} else if (level > 4 || level < 1) {
			// Shouldn't happen
			const message = '无法解析上次的警告层级，请手动选择一个警告层级。';
			if (statelem) {
				statelem.error(message);
			} else {
				alert(message);
			}
			return;
		} else {
			date ||= new Date();
			const autoTimeout = new Morebits.date(latest.date.getTime()).add(
				Number.parseInt(Twinkle.getPref('autolevelStaleDays'), 10),
				'day'
			);
			if (autoTimeout.isAfter(date)) {
				if (level === 4) {
					level = 4;
					// Basically indicates whether we're in the final Main evaluation or not,
					// and thus whether we can continue or need to display the warning and link
					if (!statelem) {
						const $link = $('<a>', {
							href: '#',
							text: '单击此处打开告状工具',
							css: {
								fontWeight: 'bold'
							},
							click: () => {
								Morebits.wiki.actionCompleted.redirect = null;
								Twinkle.warn.dialog.close();
								Twinkle.arv.callback(relevantUserName);
								$('input[name=page]').val(params.article); // Target page
								$('input[value=final]').prop('checked', true); // Vandalism after final
							}
						});

						const statusNode = $('<div>', {
							text: `${relevantUserName}最后收到了一个层级4警告（${latest.type}），所以将其报告给管理人员会比较好；`,
							css: {
								color: 'red'
							}
						});
						statusNode.append($link[0]);
						$autolevelMessage.append(statusNode);
					}
				} else {
					// Automatically increase severity
					level += 1;
				}
			} else {
				// Reset warning level if most-recent warning is too old
				level = 1;
			}
		}
		$autolevelMessage.prepend(
			$(`<div>将发送<span style="font-weight: bold;">层级${level}</span>警告模板。</div>`)
		);
		// Place after the stale and other-user-reverted (text-only) messages
		$('#twinkle-warn-autolevel-message').remove(); // clean slate
		$autolevelMessage.insertAfter($('#twinkle-warn-warning-messages'));
		let template = params.sub_group.replace(/(.*)\d$/, '$1');
		// Validate warning level, falling back to the uw-generic series.
		// Only a few items are missing a level, and in all but a handful
		// of cases, the uw-generic series is explicitly used elsewhere.
		if (params.messageData && !params.messageData[`level${level}`]) {
			template = 'uw-generic';
		}
		template += level;
		return [template, level];
	},
	main: (pageobj) => {
		const text = pageobj.getPageText();
		const statelem = pageobj.getStatusElement();
		const params = pageobj.getCallbackParameters();
		let messageData = params.messageData;

		// JS somehow didn't get destructured assignment until ES6 so of course IE doesn't support it
		const warningHistory = Twinkle.warn.callbacks.dateProcessing(text);
		const latest = warningHistory[0];
		const history = warningHistory[1];
		const now = new Morebits.date(pageobj.getLoadTime());
		Twinkle.warn.talkpageObj = pageobj; // Update talkpageObj, just in case
		if (params.main_group === 'autolevel') {
			// [template, level]
			const templateAndLevel = Twinkle.warn.callbacks.autolevelParseWikitext(
				text,
				params,
				latest,
				now,
				statelem
			);

			// Only if there's a change from the prior display/load
			if (
				params.sub_group !== templateAndLevel[0] &&
					!confirm(`将发送给用户{{${templateAndLevel[0]}}}模板，好吗？`)
			) {
				statelem.error('用户取消');
				return;
			}
			// Update params now that we've selected a warning
			params.sub_group = templateAndLevel[0];
			messageData = params.messageData[`level${templateAndLevel[1]}`];
		} else if (
			params.sub_group in history &&
				new Morebits.date(history[params.sub_group]).add(1, 'day').isAfter(now) &&
				!confirm(`近24小时内一个同样的 ${params.sub_group} 模板已被发出。\n是否继续？`)
		) {
			statelem.error('用户取消');
			return;
		}
		latest.date.add(1, 'minute'); // after long debate, one minute is max

		if (
			latest.date.isAfter(now) &&
				!confirm(`近1分钟内 ${latest.type} 模板已被发出。\n是否继续？`)
		) {
			statelem.error('用户取消');
			return;
		}

		// build the edit summary
		// Function to handle generation of summary prefix for custom templates
		const customProcess = (template) => {
			template = template.split('|')[0];
			let prefix;
			switch (template.slice(-1)) {
				case '1': {
					prefix = '提醒';
					break;
				}
				case '2': {
					prefix = '注意';
					break;
				}
				case '3': {
					prefix = '警告';
					break;
				}
				case '4': {
					prefix = '最后警告';
					break;
				}
				case 'm': {
					if (template.slice(-3) === '4im') {
						prefix = '唯一警告';
						break;
					}
				}
				// falls through
				default: {
					prefix = '提醒';
					break;
				}
			}
			return `${prefix}：${Morebits.string.toUpperCaseFirstChar(messageData.label)}`;
		};
		let summary;
		if (params.main_group === 'custom') {
			summary = customProcess(params.sub_group);
		} else {
			// Normalize kitchensink to the 1-4im style
			if (params.main_group === 'kitchensink' && !/^D+$/.test(params.sub_group)) {
				let sub = params.sub_group.slice(-1);
				if (sub === 'm') {
					sub = params.sub_group.slice(-3);
				}
				// Don't overwrite uw-3rr, technically unnecessary
				if (/\d/.test(sub)) {
					params.main_group = `level${sub}`;
				}
			}
			// singlet || level1-4im, no need to /^\D+$/.test(params.main_group)
			summary =
					messageData.summary ||
					messageData[params.main_group] && messageData[params.main_group].summary;
			// Not in Twinkle.warn.messages, assume custom template
			if (!summary) {
				summary = customProcess(params.sub_group);
			}
			if (messageData.suppressArticleInSummary !== true && params.article) {
				if (params.sub_group === 'uw-aiv') {
					// these templates require a username
					summary += `（对于[[User:${params.article}]]）`;
				} else if (params.sub_group === 'uw-bite') {
					// this template requires a username
					summary += `，于[[User talk:${params.article}]]`;
				} else {
					summary += `，于[[${params.article}]]`;
				}
			}
		}
		pageobj.setEditSummary(summary);
		pageobj.setChangeTags(Twinkle.changeTags);
		pageobj.setWatchlist(Twinkle.getPref('watchWarnings'));

		// Get actual warning text
		const warningText = Twinkle.warn.callbacks.getWarningWikitext(
			params.sub_group,
			params.article,
			params.reason,
			params.main_group === 'custom'
		);

		let sectionExists = false;
		// Only check sections if there are sections or there's a chance we won't create our own

		let sectionNumber = 0;
		if (!messageData.heading && text.length > 0) {
			// Get all sections
			const sections = text.match(/^(=+).+\1/gm);
			if (sections && sections.length > 0) {
				// Find the index of the section header in question
				const dateHeaderRegex = now.monthHeaderRegex();
				sectionNumber = 0;
				// Find this month's section among L2 sections, preferring the bottom-most
				sectionExists = sections
					.reverse()
					.some(
						(sec, idx) =>
							/^(==)[^=].+\1/m.test(sec) &&
								dateHeaderRegex.test(sec) &&
								typeof (sectionNumber = sections.length - 1 - idx) === 'number'
					);
			}
		}
		if (sectionExists) {
			// append to existing section
			pageobj.setPageSection(sectionNumber + 1);
			pageobj.setAppendText(`\n\n${warningText}`);
			pageobj.append();
		} else {
			if (messageData.heading) {
				// create new section
				pageobj.setNewSectionTitle(messageData.heading);
			} else {
				Morebits.status.info('信息', '未找到当月的二级标题，将创建新的');
				pageobj.setNewSectionTitle(now.monthHeader());
			}
			pageobj.setNewSectionText(warningText);
			pageobj.newSection();
		}
	},
	main_flow: (flowobj) => {
		const params = flowobj.getCallbackParameters();
		const messageData = params.messageData;

		// build the edit summary
		// Function to handle generation of summary prefix for custom templates
		const customProcess = (template) => {
			template = template.split('|')[0];
			let prefix;
			switch (template.slice(-1)) {
				case '1': {
					prefix = '提醒';
					break;
				}
				case '2': {
					prefix = '注意';
					break;
				}
				case '3': {
					prefix = '警告';
					break;
				}
				case '4': {
					prefix = '最后警告';
					break;
				}
				case 'm': {
					if (template.slice(-3) === '4im') {
						prefix = '唯一警告';
						break;
					}
				}
				// falls through
				default: {
					prefix = '提醒';
					break;
				}
			}
			return `${prefix}：${Morebits.string.toUpperCaseFirstChar(messageData.label)}`;
		};
		let topic;
		if (messageData.heading) {
			topic = messageData.heading;
		} else {
			// Normalize kitchensink to the 1-4im style
			if (params.main_group === 'kitchensink' && !/^D+$/.test(params.sub_group)) {
				let sub = params.sub_group.slice(-1);
				if (sub === 'm') {
					sub = params.sub_group.slice(-3);
				}
				// Don't overwrite uw-3rr, technically unnecessary
				if (/\d/.test(sub)) {
					params.main_group = `level${sub}`;
				}
			}
			// singlet || level1-4im, no need to /^\D+$/.test(params.main_group)
			topic =
					messageData.summary ||
					messageData[params.main_group] && messageData[params.main_group].summary;
			// Not in Twinkle.warn.messages, assume custom template
			if (!topic) {
				topic = customProcess(params.sub_group);
			}
		}
		const content = Twinkle.warn.callbacks.getWarningWikitext(
			params.sub_group,
			params.article,
			params.reason,
			params.main_group === 'custom',
			true
		);
		flowobj.setTopic(topic);
		flowobj.setContent(content);
		flowobj.newTopic();
	}
};
Twinkle.warn.callback.evaluate = (e) => {
	const userTalkPage = `User_talk:${relevantUserName}`;

	// reason, main_group, sub_group, article
	const params = Morebits.quickForm.getInputData(e.target);

	// Check that a reason was filled in if uw-username was selected
	if (params.sub_group === 'uw-username' && !params.article) {
		alert('必须给{{uw-username}}提供理由。');
		return;
	}
	if (params.article) {
		if (/https?:\/\//.test(params.article)) {
			alert('“页面链接”不能使用网址。');
			return;
		}
		try {
			const article = new mw.Title(params.article);
			params.article = article.getPrefixedText();
			if (article.getFragment()) {
				params.article += `#${article.getFragment()}`;
			}
		} catch {
			alert(
				'“页面链接”不合法，仅能输入一个页面名称，勿使用网址、[[ ]]，可使用Special:Diff。'
			);
			return;
		}
	}

	// The autolevel option will already know by now if a user talk page
	// is a cross-namespace redirect (via !!Twinkle.warn.talkpageObj), so
	// technically we could alert an error here, but the user will have
	// already ignored the bold red error above.  Moreover, they probably
	// *don't* want to actually issue a warning, so the error handling
	// after the form is submitted is probably preferable
	// Find the selected <option> element so we can fetch the data structure
	const $selectedEl = $(e.target.sub_group).find(
		`option[value="${$(e.target.sub_group).val()}"]`
	);
	params.messageData = $selectedEl.data('messageData');
	if (typeof params.messageData === 'undefined') {
		alert('请选择警告模板。');
		return;
	}
	Morebits.simpleWindow.setButtonsEnabled(false);
	Morebits.status.init(e.target);
	Morebits.wiki.actionCompleted.redirect = userTalkPage;
	Morebits.wiki.actionCompleted.notice = '警告完成，将在几秒后刷新';
	const qiuwen_page = new Morebits.wiki.page(userTalkPage, '用户讨论页修改');
	qiuwen_page.setCallbackParameters(params);
	qiuwen_page.setFollowRedirect(true, false);
	qiuwen_page.load(Twinkle.warn.callbacks.main);
};
Twinkle.addInitCallback(Twinkle.warn, 'warn');
})(jQuery);

/* </nowiki> */
