"use strict";

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
/* Twinkle.js - twinklediff.js */
/* <nowiki> */
( ( $ ) => {
/*
   ****************************************
   *** twinklediff.js: Diff module
   ****************************************
   * Mode of invocation:  Tab on non-diff pages ("Last"); tabs on diff pages ("Since", "Since mine", "Current")
   * Active on:           Existing non-special pages
   */

Twinkle.diff = () => {
	if ( mw.config.get( "wgNamespaceNumber" ) < 0 || !mw.config.get( "wgArticleId" ) ) {
		return;
	}
	Twinkle.addPortletLink( mw.util.getUrl( mw.config.get( "wgPageName" ), {
		diff: "cur",
		oldid: "prev"
	} ), "最后", "tw-lastdiff", "显示最后一次差异" );

	// Show additional tabs only on diff pages
	if ( mw.util.getParamValue( "diff" ) ) {
		var oldid = /oldid=(.+)/.exec( $( "#mw-diff-ntitle1" ).find( "strong a" ).first().attr( "href" ) )[ 1 ];
		Twinkle.addPortletLink( mw.util.getUrl( mw.config.get( "wgPageName" ), {
			diff: "cur",
			oldid: oldid
		} ), "当前", "tw-curdiff", "显示与当前版本间的差异" );
	}
};
Twinkle.addInitCallback( Twinkle.diff, "diff" );
} )( jQuery );

/* </nowiki> */
