

var CookieGenerator = {

	// cookieを生成
	setCookie: function(name, value, url, expire, base64Flag) {

		// cookie名を設定
		name = escape(name);

		//cookie Base64符号化フラグ
		if (base64Flag) {
			// cookie値をBase64エンコーディングする
			value = encodeBase64(value);
		}

		// cookie値を設定
		value = escape(value);
		// cookieの内容
		var cookieString = name + "=" + value + ";expires=" + expire;

		var ios = Components.classes["@mozilla.org/network/io-service;1"]
						.getService(Components.interfaces.nsIIOService);
		var cookieUri = ios.newURI(url, null, null);
		var cookieSvc = Components.classes["@mozilla.org/cookieService;1"]
						.getService(Components.interfaces.nsICookieService);

		// 指定のURLにcookieを設定する
		cookieSvc.setCookieString(cookieUri, null, cookieString, null);
	},


	// cookieStringを取得
	getCookieStr: function(url) {
		var ios = Components.classes["@mozilla.org/network/io-service;1"]
						.getService(Components.interfaces.nsIIOService);
		var cookieUri = ios.newURI(url, null, null);
		var cookieSvc = Components.classes["@mozilla.org/cookieService;1"]
						.getService(Components.interfaces.nsICookieService);

		var cookieString = cookieSvc.getCookieString(cookieUri, null);
		// cookieStringの内容（文字列）
		return cookieString;
	},


	// ********** cookieArrayを取得 **********
	getCookieArray: function() {
		var cookieArray = new Array();
		var cookieMgr = Components.classes["@mozilla.org/cookiemanager;1"]
						.getService(Components.interfaces.nsICookieManager);

		// see https://developer.mozilla.org/en/nsICookie
		for (var e = cookieMgr.enumerator; e.hasMoreElements();) {
			var cookieObj = e.getNext().QueryInterface(Components.interfaces.nsICookie);
			cookieArray.push(cookieObj);
		}
		return cookieArray;
	},


	// ********** cookieObjを取得 **********
	getCookieByName: function(name, url) {
		var cookieObj;
		var index = url.indexOf("/");
		var host = url.substring(0, index);
		var path = url.substring(index);
		var cookieArray = this.getCookieArray();
		for (i = 0; i < cookieArray.length; i++) {
			cookieObj = cookieArray[i];
			if (cookieObj.host == host && cookieObj.name == name) {
				break;
			}
		}
		return cookieObj;
	},


	// ********** cookieを削除 **********
	delCookie: function(name, url) {
		var index = url.indexOf("/");
		var host = url.substring(0, index);
		var path = url.substring(index);
		var cookieMgr = Components.classes["@mozilla.org/cookiemanager;1"]
						.getService(Components.interfaces.nsICookieManager);
		cookieMgr.remove(host, name, path, false);

		// ========== alternative way ==========
		var expire = new Date();
		expire.setTime(expire.getTime() - 1);
		var cookieObj = this.getCookieByName(name, url);
		if (cookieObj) {
			document.cookie = name + "=" + cookieObj.value + ";expires=" + expire;
		}
	},

};




// embedded-wayf.js
function encodeBase64(input) {
	var base64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var output = "", c1, c2, c3, e1, e2, e3, e4;
	
	for ( var i = 0; i < input.length; ) {
		c1 = input.charCodeAt(i++);
		c2 = input.charCodeAt(i++);
		c3 = input.charCodeAt(i++);
		e1 = c1 >> 2;
		e2 = ((c1 & 3) << 4) + (c2 >> 4);
		e3 = ((c2 & 15) << 2) + (c3 >> 6);
		e4 = c3 & 63;
		if (isNaN(c2)){
			e3 = e4 = 64;
		} else if (isNaN(c3)){
			e4 = 64;
		}
		output += base64chars.charAt(e1) + base64chars.charAt(e2) + base64chars.charAt(e3) + base64chars.charAt(e4);
	}
	
	return output;
}


function decodeBase64(input) {
	var base64chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var output = "", chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	var i = 0;

	// Remove all characters that are not A-Z, a-z, 0-9, +, /, or =
	var base64test = /[^A-Za-z0-9\+\/\=]/g;
	input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
	
	do {
		enc1 = base64chars.indexOf(input.charAt(i++));
		enc2 = base64chars.indexOf(input.charAt(i++));
		enc3 = base64chars.indexOf(input.charAt(i++));
		enc4 = base64chars.indexOf(input.charAt(i++));

		chr1 = (enc1 << 2) | (enc2 >> 4);
		chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		chr3 = ((enc3 & 3) << 6) | enc4;

		output = output + String.fromCharCode(chr1);

		if (enc3 != 64) {
			output = output + String.fromCharCode(chr2);
		}
		if (enc4 != 64) {
			output = output + String.fromCharCode(chr3);
		}
		
		chr1 = chr2 = chr3 = "";
		enc1 = enc2 = enc3 = enc4 = "";
		
	} while (i < input.length);
	
	return output;
}



