/*
 * Name: TrustTools
 * Version: 2.0
 * Date: 2011-12-22
 */

var TrustTools = {

	// 処理始まる
	init: function() {
		this.toolbar = document.getElementById('toolbarTrustTools');
		this.toolbarLabel1 = document.getElementById('toolbarLabel1');
		this.toolbarImage1 = document.getElementById('toolbarImage1');
		this.progressmeter = document.getElementById('progressTrustTools');

		// 初期化
		this.initToolbar();

		// 設定値取得
		this.getPreferences();
		this.providersUriTest = (this.providersUriPref.length != 0 && this.urlReg.test(this.providersUriPref));

		// default IdPを設定
		this.setDefaultIdP();

		// データベース初期化
		if (!this.initDB()) {
			return false;
		}

		// main処理
		this.onPageLoad();
	},


	// Application trigger
	initToolbar: function() {
		//this.toolbarLabel1.value = "initToolbar";

		// toolbar初期化
		this.progressmeter.style.visibility = "hidden";
		this.toolbar.className = "";

		this.toolbar.style.borderStyle = "";
		this.toolbar.style.borderWidth = "";
		this.toolbar.style.borderColor = "";
		this.toolbar.style.backgroundColor = "";
		this.toolbar.style.color = "";
		this.toolbar.style.fontStyle = "";
		this.toolbar.style.fontWeight = "";
		this.toolbar.style.cssText = "";

		this.toolbarImage1.src = "";
		this.toolbarLabel1.value = "TrustTools: initializing...";
	},


	// 設定値取得
	getPreferences: function() {
		this.urlReg = new RegExp("((^http)|(^https)|(^ftp)):\/\/+[A-Za-z0-9]+(\" || \s)");

		// アドオンのオプション値取得
		this.prefs = Cc["@mozilla.org/preferences-service;1"]
						.getService(Ci.nsIPrefService)
						.getBranch("extensions.TrustTools.")
						.QueryInterface(Ci.nsIPrefBranch2);

		// 証明書リスト管理の設定値取得
		// 証明書リスト(JSONファイル)のURL
		this.providersUriPref = this.prefs.getCharPref("providersUriPref");
		// 証明書リストの有効期間(日)
		this.validDatePref = this.prefs.getIntPref("validDatePref");
		// ユーザ定義の文字列
		this.userDefinedPref = this.prefs.getComplexValue("userDefinedPref", 
						Components.interfaces.nsISupportsString).data;


		// cookie(default IdP)の設定値取得
		// cookie自動作成フラグ
		this.cookieSetPref = this.prefs.getBoolPref("cookieSetPref");
		// cookie名(_saml_idp)
		this.cookieNamePref = this.prefs.getCharPref("cookieNamePref");
		// cookie値(Entity ID)
		this.cookieValuePref = this.prefs.getCharPref("cookieValuePref");
		// cookieドメイン(URL)
		this.cookieDomainPref = this.prefs.getCharPref("cookieDomainPref");
		// cookie Base64符号化フラグ
		this.cookieBase64Pref = this.prefs.getBoolPref("cookieBase64Pref");

		// GUI表示カスタマイズの設定値取得
		// 無ければ、ランダム値を設定
		if (!this.prefs.prefHasUserValue("borderStylePref")) {
			this.prefs.setCharPref("borderStylePref", getRandomOptions(new Array('none', 'hidden', 'dotted', 'dashed', 'solid', 'double', 'groove', 'ridge', 'inset', 'outset')));
		}
		if (!this.prefs.prefHasUserValue("borderWidthPref")) {
			this.prefs.setCharPref("borderWidthPref", getRandomOptions(new Array('thin', 'medium', 'thick')));
		}
		if (!this.prefs.prefHasUserValue("borderColorPref")) {
			this.prefs.setCharPref("borderColorPref", getRandomColor2());
		}
		if (!this.prefs.prefHasUserValue("backgroundColorPref")) {
			this.prefs.setCharPref("backgroundColorPref", getRandomColor());
		}
		if (!this.prefs.prefHasUserValue("fontColorPref")) {
			this.prefs.setCharPref("fontColorPref", getRandomColor());
		}
		if (!this.prefs.prefHasUserValue("fontStylePref")) {
			this.prefs.setCharPref("fontStylePref", getRandomOptions(new Array('normal', 'italic', 'oblique')));
		}
		if (!this.prefs.prefHasUserValue("fontWeightPref")) {
			this.prefs.setCharPref("fontWeightPref", getRandomOptions(new Array('normal', 'bolder')));
		}
		this.borderStylePref = this.prefs.getCharPref("borderStylePref");
		this.borderWidthPref = this.prefs.getCharPref("borderWidthPref");
		this.borderColorPref = this.prefs.getCharPref("borderColorPref");
		this.backgroundColorPref = this.prefs.getCharPref("backgroundColorPref");
		this.fontColorPref = this.prefs.getCharPref("fontColorPref");
		this.fontStylePref = this.prefs.getCharPref("fontStylePref");
		this.fontWeightPref = this.prefs.getCharPref("fontWeightPref");

		//msg = this.borderStylePref + " | " + this.borderWidthPref + " | " + this.borderColorPref + " | " + this.backgroundColorPref + " | " + this.fontColorPref + " | " + this.fontStylePref + " | " + this.fontWeightPref;
		//alert(msg);
	},


	// cookie(default IdP)の設定
	setDefaultIdP: function() {
		// Cookie設定
		if (this.cookieSetPref == true) {
			if (this.urlReg.test(this.cookieDomainPref)) {
				var now = new Date().getTime();
				var period = (1000 * 60 * 60 * 24) * 100;	//100日
				var expire = new Date(now + period);
				CookieGenerator.setCookie(this.cookieNamePref, this.cookieValuePref, this.cookieDomainPref, expire, this.cookieBase64Pref);
			}
		}

		// Cookie取得
		//if (this.urlReg.test(this.cookieDomainPref)) {
		//	var cookieArray = CookieGenerator.getCookieArray(this.cookieDomainPref);
		//}
	},


	// all pages
	onPageLoad: function() {
		//this.toolbarLabel1.value = "onPageLoad: main処理";

		// ==========BEGIN データベースリフレシュ処理==========
		var dbresult = true;
		// Mozilla/5.0 (Windows NT 6.1; WOW64; rv:8.0.1) Gecko/20100101 Firefox/8.0.1
		var ua = String(navigator.userAgent);
		var startindex = ua.indexOf("Firefox")+8;
		var endindex = ua.indexOf(".", startindex);
		var ffVersion = ua.substring(startindex, endindex);

		// ----------BEGIN データベース処理：プログレスバー表示----------
		if (ffVersion > 3) {
			this.progressmeter.style.visibility = "visible";
		}

		// 証明書取得URL有効の場合データベースの更新を行う
		if (this.providersUriTest) {
			//データベース最新情報取得
			dbresult = this.refreshDB();
		}

		// ----------END データベース処理：プログレスバー非表示----------
		this.progressmeter.style.visibility = "hidden";
		// ==========END データベースリフレシュ処理==========


		// プロトコルによって処理進める
		var doc = gBrowser.selectedBrowser.contentDocument;

		// セキュアな接続（https）の場合
		if (doc && doc.location && doc.location.protocol == "https:") {
			// onSecurePageLoad
			this.onSecurePageLoad();
		}
		else {
			this.toolbarLabel1.value = "";

			// ログインURL自動遷移
			this.redirectionProcess();
		}
	},


	// SSL pages only
	onSecurePageLoad: function() {

		// 証明書検証処理
		this.validationProcess();

		// ログインURL自動遷移
		this.redirectionProcess();

	},


	// データベース初期化
	initDB: function() {
		this.toolbarLabel1.value = "initializing sqlite database...";

		try {
			var file = Components.classes["@mozilla.org/file/directory_service;1"]
						.getService(Components.interfaces.nsIProperties)
						.get("ProfD", Components.interfaces.nsIFile);
			var storage = Components.classes["@mozilla.org/storage/service;1"]
						.getService(Components.interfaces.mozIStorageService);
			file.append("TrustTools2.sqlite");

			// Must be checked before openDatabase()
			var exists = file.exists();

			// Now, TrustTools.sqlite exists
			this.dbhandle = storage.openDatabase(file);

			// CertPatrol.sqlite initialization
			if (!exists) {
				this.dbhandle.executeSimpleSQL(
					"CREATE TABLE tbl_update_info (update_date DATE not NULL)");
				this.dbhandle.executeSimpleSQL(
					"CREATE TABLE tbl_entity_info (entity_id TEXT not NULL, verify_uri_prefix TEXT not NULL, " +
					"x509_certificate_fingerprint TEXT not NULL, idp_sp_flag TEXT not NULL, " +
					"ssos_v1 TEXT, ssos_v2 TEXT, " +
					"login_uri_prefix TEXT, pattern_name TEXT, " +
					"assertion_consumer_service TEXT, saml_version TEXT, cookie_flag TEXT" +
					")");
				this.dbhandle.executeSimpleSQL(
					"CREATE TABLE tbl_discovery_methods (pattern_name TEXT not NULL, pattern_value TEXT)");
			}

			// Prepared statements
			// tbl_update_info
			this.dbSelectDate = this.dbhandle.createStatement(
				"SELECT * FROM tbl_update_info");
			this.dbInsertDate = this.dbhandle.createStatement(
				"INSERT INTO tbl_update_info (update_date) VALUES (?1)");
			this.dbUpdateDate = this.dbhandle.createStatement(
				"UPDATE tbl_update_info set update_date = ?1");

			// tbl_entity_info
			this.dbSelectEntity = this.dbhandle.createStatement(
				"SELECT entity_id, verify_uri_prefix, x509_certificate_fingerprint, idp_sp_flag, ssos_v1, ssos_v2, login_uri_prefix, pattern_name, assertion_consumer_service, saml_version, cookie_flag FROM tbl_entity_info");
			this.dbSelectEntityByVerifyUri = this.dbhandle.createStatement(
				"SELECT x509_certificate_fingerprint FROM tbl_entity_info where verify_uri_prefix = ?1");
			this.dbSelectEntityByLoginUri = this.dbhandle.createStatement(
				"SELECT entity_id, pattern_name, assertion_consumer_service, saml_version, cookie_flag FROM tbl_entity_info where idp_sp_flag = 'sp' and login_uri_prefix = ?1");

			this.dbSelectEntityByEntityId = this.dbhandle.createStatement(
				"SELECT ssos_v1, ssos_v2 FROM tbl_entity_info where idp_sp_flag = 'idp' and entity_id = ?1");

			this.dbInsertEntity = this.dbhandle.createStatement(
				"INSERT INTO tbl_entity_info (entity_id, verify_uri_prefix, x509_certificate_fingerprint, idp_sp_flag, ssos_v1, ssos_v2, login_uri_prefix, pattern_name, assertion_consumer_service, saml_version, cookie_flag) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)");
			this.dbDeleteEntity = this.dbhandle.createStatement(
				"DELETE FROM tbl_entity_info");

			// tbl_discovery_methods
			this.dbSelectDiscoveryMethodByName = this.dbhandle.createStatement(
				"SELECT pattern_value FROM tbl_discovery_methods where pattern_name = ?1");
			this.dbInsertDiscoveryMethods = this.dbhandle.createStatement(
				"INSERT INTO tbl_discovery_methods (pattern_name, pattern_value) VALUES (?1, ?2)");
			this.dbDeleteDiscoveryMethods = this.dbhandle.createStatement(
				"DELETE FROM tbl_discovery_methods");
		}
		catch(err) {
			this.warn("データベース初期化失敗:\n"+ err);
			return false;
		}
		return true;
	},


	// 検証処理と処理結果を表示する
	validationProcess: function() {
		this.toolbarLabel1.value = "validation in progress...";

		// アクセスサイトの証明書取得
		var websiteCertFingerprint = this.getWebsiteCertFingerprint();

		// アクセスサイトの証明書情報をDBで検索
		var result = this.verifyCertFingerprintFromDBByUrl(websiteCertFingerprint);
		var hasSite = result[0];
		var hasCert = result[1];

		// アクセスサイトの証明書は証明書リストに存在します
		if (hasSite == 1) {
			// キャッシュされた証明書とアクセスしたサイトの証明書が一致の場合
			if (hasCert == 1) {
				//this.toolbar.className = "greentoolbar";
				this.toolbarImage1.src = srcCertified;
				this.toolbarLabel1.value = strCertified + this.userDefinedPref;

				// GUI表示カスタマイズ機能
				// windowsのみ対応
				//this.toolbar.style.borderStyle = this.borderStylePref;
				//this.toolbar.style.borderWidth = this.borderWidthPref;
				//this.toolbar.style.borderColor = this.borderColorPref;
				//this.toolbar.style.backgroundColor = this.backgroundColorPref;
				//this.toolbar.style.color = this.fontColorPref;
				//this.toolbar.style.fontStyle = this.fontStylePref;
				//this.toolbar.style.fontWeight = this.fontWeightPref;

				// alternative way to set style
				// windows & mac os 対応
				var toolbarStyle = "-moz-appearance: none;";
				toolbarStyle += "border: " + this.borderWidthPref + " " + this.borderStylePref + " " + this.borderColorPref + ";";
				toolbarStyle += "background-color: " + this.backgroundColorPref + " !important;";
				toolbarStyle += "color: " + this.fontColorPref + " !important;";
				toolbarStyle += "font-style: " + this.fontStylePref + " !important;";
				toolbarStyle += "font-weight: " + this.fontWeightPref + " !important;";
				this.toolbar.style.cssText = toolbarStyle;
			}
			else {
				this.toolbar.className = "redtoolbar";
				this.toolbarImage1.src = srcWarning;
				this.toolbarLabel1.value = strWarning + this.userDefinedPref;
			}
		}
		// アクセスサイトの証明書は証明書リストに存在しない
		else if (hasSite == 0) {
			this.toolbarLabel1.value = "TrustTools: 証明書検証対象外";
		}
		// アクセスサイトの証明書取得失敗
		else {
			this.toolbarLabel1.value = "TrustTools: Reload the page to validate again.";
		}
	},


	// SSL trigger
	getWebsiteCertFingerprint: function() {
		//this.toolbarLabel1.value = "get Website Certificate sha1 Fingerprint...";

		var err = 0;

		var browser = gBrowser.selectedBrowser;
		if (!browser) {
			err = -1;
			return err;
		}

		var securityUI = browser.securityUI;
		if (!securityUI) {
			err = -2;
			return err;
		}

		var sslStatusProvider = securityUI.QueryInterface(Ci.nsISSLStatusProvider);
		if (!sslStatusProvider) {
			err = -3;
			return err;
		}

		var sslStatus = sslStatusProvider.SSLStatus;
		if (!sslStatus) {
			err = -4;
			return err;
		}

		var sslStatusStruct = sslStatus.QueryInterface(Ci.nsISSLStatus);
		if (!sslStatusStruct) {
			err = -5;
			return err;
		}

		var serverCert = sslStatusStruct.serverCert;
		if (!serverCert) {
			err = -6;
			return err;
		}

		var validity = serverCert.validity.QueryInterface(Ci.nsIX509CertValidity);
		if (!validity) {
			err = -7;
			return err;
		}

		var fingerprint = serverCert.sha1Fingerprint;

		var protocol = browser.contentDocument.location.protocol;
		var hostname = browser.contentDocument.location.hostname;
		//var accessurl = protocol + "//" + hostname;
		var accessurl = hostname;

		//this.toolbarLabel1.value = err + ": " + accessurl + ": " + fingerprint;

		var websiteCertFingerprint = new Array();
		websiteCertFingerprint.push(accessurl);
		websiteCertFingerprint.push(fingerprint);

		return websiteCertFingerprint;
	},


	// URLからファイルを取得する
	getFileFromServer: function(fileUrl) {
		//this.toolbarLabel1.value = "downloading file from server...";
		this.toolbarLabel1.value = "ダウンロードしています、暫くお待ちください...";

		var req = new XMLHttpRequest();
		try {
			req.open("get", fileUrl, false);
			//req.onreadystatechange = onreadystateCallback(req);
			req.send(null);

			if (req.readyState == 4) {
				if (req.status == 200) {
					var fileContent = req.responseText;
					return fileContent;
				}
				else {
					this.warn("設定されたURLにファイル取得できません:\nreadyState = " + req.readyState + "\n" + fileUrl);
					return null;
				}
			}
			
		}
		catch (err) {
			this.warn("設定されたURLにファイル取得できません:\n" + fileUrl);
			return null;
		}
		return null;
	},


	// JSON形式のファイルを取得する
	getJSONFromServer: function(jsonUrl) {
		var jsonContent = this.getFileFromServer(jsonUrl);
		if (jsonContent == null) {
			return null;
		}
		var jsonObject = JSON.parse(jsonContent, null);

		// 証明書リストファイルの署名を検証する
		var isValid = this.validateJSON(jsonObject);
		// 署名検証失敗の場合
		if (!isValid) {
			this.warn("取得したJSONファイルの署名が検証されていない！");
			return null;
		}
		return jsonObject;
	},


	//証明書リストファイルの署名を検証する
	validateJSON: function(jsonObject) {
		this.toolbarLabel1.value = "validating json file...";

		var result = false;

		// 公開鍵のURIから公開鍵を取得
		var certs_uri = jsonObject.sig_params[0].certs_uri;
		var x509_certificate = this.getFileFromServer(certs_uri);
		if (x509_certificate == null) {
			this.warn("「certs_uri」で証明書取得できません:\n" + certs_uri);
			return null;
		}
		x509_certificate = _x509_pemToBase64(x509_certificate);

		// 公開鍵の有効チェックする
		var certdb = Components.classes["@mozilla.org/security/x509certdb;1"]
						.createInstance(Components.interfaces.nsIX509CertDB);
		var cert = certdb.constructX509FromBase64(x509_certificate);
		cert.QueryInterface(Components.interfaces.nsIX509Cert2);
		var certType = cert.certType;
		var validity = cert.validity.QueryInterface(Ci.nsIX509CertValidity);
		var verification = cert.verifyForUsage(Ci.nsIX509Cert.CERT_USAGE_ObjectSigner);
		// 公開鍵が無効の場合、証明書リストファイルの署名検証は失敗とします
		if (status == Ci.nsIX509Cert.CERT_NOT_TRUSTED) {
			this.warn("署名用証明書の検証に失敗しました！");
			return result;
		}


		// 公開鍵が有効の場合、署名検証を行う
		var x509 = new X509();
		x509.readCertPEM(x509_certificate);

		// 署名を16進数形式変換
		var signature_value = jsonObject.sigs[0];
		var hexSignature = Crypto.util.bytesToHex(Crypto.util.base64ToBytes(signature_value));

		// 元のデータを取得
		/*
		var originalData = JSON.stringify(jsonObject.contents, 
			function (key, value) {
				if (typeof value === 'string' && value.indexOf("\t") > 0) {
					var newvalue = value.replaceAll("\t", "ss");
					return newvalue;
				}
				return value;
			}
		);
		*/
		/**
		 * JSON.stringify(myObject, replacer); について
		 * Firefox 3.x： \t を自動的に \u0009 へ変更します。その為元のデータと一致しない、検証できません。
		 * Firefox 7.x： \t を自動変換しない、問題なく検証できます。
		 * その原因で、以下の関数（json2String）を使います。
		 */
		var originalData = json2String(jsonObject.contents);


		// ---------- 署名方式がSHA1の場合 ----------
		//result = x509.subjectPublicKeyRSA.verifyString(originalData, hexSignature);
		// ---------- 署名方式がSHA1の場合 ----------


		// ---------- 署名方式がSHA256の場合 ----------
		// 元データからhash値を生成
		var originalDataHash = Crypto.util.bytesToBase64(Crypto.util.hexToBytes(sha256_digest(originalData)));

		// 公開鍵を使って、署名からhash値を取得
		var hexSignatureHash = x509.subjectPublicKeyRSA.verifyString2(originalData, hexSignature);
		var b64SignatureHash = Crypto.util.bytesToBase64(Crypto.util.hexToBytes(hexSignatureHash));

		// JSONファイルのHash値を取得
		var digest_value = jsonObject.data;

		// Hash値が一致の場合、検証成功
		if (digest_value == originalDataHash && originalDataHash == b64SignatureHash) {
			result = true;
		}
		// ---------- 署名方式がSHA256の場合 ----------

		//this.toolbarLabel1.value = "originalDataHash: " + originalDataHash;

		return result;
	},


	// ==========BEGIN データベース処理==========
	// データベースから証明書リストを取得
	getProvidersFromDB: function() {
		var oneCert;
		var providers = new Array();
		var stmt = this.dbSelectEntity;
		try {
			while (stmt.executeStep()) {
				oneCert = new Object();

				// entity_id
				oneCert["entityId"] = stmt.getUTF8String(0);
				// verify_uri_prefix
				oneCert["verifyUriPrefix"] = stmt.getUTF8String(1);
				// x509_certificate_fingerprint
				oneCert["x509CertificateFingerprint"] = stmt.getUTF8String(2);
				// idp_sp_flag
				oneCert["idpSpFlag"] = stmt.getUTF8String(3);
				// ssos_v1
				oneCert["ssosV1"] = stmt.getUTF8String(4);
				// ssos_v2
				oneCert["ssosV2"] = stmt.getUTF8String(5);
				// login_uri_prefix
				oneCert["loginUriPrefix"] = stmt.getUTF8String(6);
				// pattern_name
				oneCert["patternName"] = stmt.getUTF8String(7);
				// assertion_consumer_service
				oneCert["assertionConsumerService"] = stmt.getUTF8String(8);
				// saml_version
				oneCert["samlVersion"] = stmt.getUTF8String(9);
				// cookie_flag
				oneCert["cookieFlag"] = stmt.getUTF8String(10);

				providers.push(oneCert);
			}
		}
		catch(err) {
			this.warn("SQLiteから証明書リスト取得失敗:\n" + err);
		}
		finally {
			stmt.reset();
		}
		return providers;
	},


	// データベースから証明書リストを取得
	verifyCertFingerprintFromDBByUrl: function(websiteCertFingerprint) {
		if (!websiteCertFingerprint.length) {
			return new Array(-1, -1);
		}

		var websiteUrl = websiteCertFingerprint[0];
		var websiteFp = websiteCertFingerprint[1];
		var found = 0;
		var match = 0;
		var foundFp;

		var stmt = this.dbSelectEntityByVerifyUri;
		try {
			stmt.bindUTF8StringParameter(0, websiteUrl);
			if (stmt.executeStep()) {
				found = 1;
				// x509_certificate_fingerprint
				foundFp = stmt.getUTF8String(0);
			}
		}
		catch(err) {
			this.warn("SQLiteから証明書取得失敗:\n" + err);
		}
		finally {
			stmt.reset();
		}

		if (found) {
			if (foundFp.toUpperCase() == websiteFp.toUpperCase()) {
				match = 1;
			}
		}

		var result = new Array();
		result.push(found);
		result.push(match);
		return result;
	},


	// データベース更新処理
	refreshDB: function() {
		this.toolbarLabel1.value = "updating all data in database...";

		var updateResult = 0;

		var found = false;
		// 現在日時取得
		var now = new Date();
		// 有効期間取得
		var period = (1000 * 60 * 60 * 24) * this.validDatePref;
		// 有効期日初期化
		var validDate = new Date();

		// 登録日取得
		var stmt = this.dbSelectDate;
		try {
			if (stmt.executeStep()) {
				found = true;
				// 登録日
				var updateDate = stmt.getUTF8String(0);
				// 有効期日
				validDate = new Date(Date.parse(updateDate) + period);
			}
		}
		catch(err) {
			this.warn("SQLiteから証明書登録日取得失敗:\n" + err);
			return false;
		}
		finally {
			stmt.reset();
		}

		// extension を初めてインストールの際に
		if (!found) {
			// 登録日登録
			stmt = this.dbInsertDate;
			try {
				stmt.bindUTF8StringParameter(0, now);
				stmt.execute();
			}
			catch(err) {
				this.warn("SQLiteへ証明書登録日登録失敗:\n" + err);
				return false;
			}
			finally {
				stmt.reset();
			}

			// サーバからJSONファイル取得
			var jsonObject = this.getJSONFromServer(this.providersUriPref);
			if (!jsonObject) {
				return false;
			}
			// 新証明書登録
			if (!this.insertNewProviders(jsonObject)) {
				return false;
			}
			// 新ディスカバリメソッド登録
			if (!this.insertNewDiscoveryMethods(jsonObject)) {
				return false;
			}
		}
		// 有効期限越えた場合新しい証明書をサーバから取得して、SQLiteデータベースに更新
		else if (found && (validDate.getTime() < now.getTime())) {
			// 登録日更新
			stmt = this.dbUpdateDate;
			try {
				stmt.bindUTF8StringParameter(0, now);
				stmt.execute();
			}
			catch(err) {
				this.warn("SQLiteへ証明書登録日更新失敗:\n" + err);
				return false;
			}
			finally {
				stmt.reset();
			}

			// 旧証明書削除
			if (!this.deleteProviders()) {
				return false;
			}
			// 旧ディスカバリメソッド削除
			if (!this.deleteDiscoveryMethods()) {
				return false;
			}

			// サーバからJSONファイル取得
			var jsonObject = this.getJSONFromServer(this.providersUriPref);
			if (!jsonObject) {
				return false;
			}
			// 新証明書登録
			if (!this.insertNewProviders(jsonObject)) {
				return false;
			}
			// 新ディスカバリメソッド登録
			if (!this.insertNewDiscoveryMethods(jsonObject)) {
				return false;
			}
		}

		return true;
	},


	// 旧証明書削除
	deleteProviders: function() {
		stmt = this.dbDeleteEntity;
		try {
			stmt.execute();
		}
		catch(err) {
			this.warn("SQLiteへ証明書削除失敗:\n" + err);
			return false;
		}
		finally {
			stmt.reset();
		}
		return true;
	},


	// 旧ディスカバリメソッド削除
	deleteDiscoveryMethods: function() {
		stmt = this.dbDeleteDiscoveryMethods;
		try {
			stmt.execute();
		}
		catch(err) {
			this.warn("SQLiteへディスカバリメソッド削除失敗:\n" + err);
			return false;
		}
		finally {
			stmt.reset();
		}
		return true;
	},


	// 証明書登録
	insertNewProviders: function(jsonObject) {
		this.toolbarLabel1.value = "updating cert list in database...";

		var providersObject = jsonObject.contents.providers;

		if (providersObject != null) {
			// 証明書登録
			var stmt = this.dbInsertEntity;
			try {
				for (i = 0; i < providersObject.length; i++) {
					// 証明書fingerprintを取得、データベースへ登録
					var entityId = providersObject[i].entity_id;
					var verifyUriPrefix = providersObject[i].verify_uri_prefix;
					var x509CertificateFingerprint = providersObject[i].x509_certificate_fingerprint;
					var idpSpFlag = providersObject[i].idp_sp_flag;
					var ssosV1 = providersObject[i].ssos_v1;
					var ssosV2 = providersObject[i].ssos_v2;
					var loginUriPrefix = providersObject[i].login_uri_prefix;
					var patternName = providersObject[i].pattern_name;
					var assertionConsumerService = providersObject[i].assertion_consumer_service;
					var samlVersion = providersObject[i].saml_version;
					var cookieFlag = providersObject[i].cookie_flag;

					stmt.bindUTF8StringParameter(0, entityId);
					stmt.bindUTF8StringParameter(1, verifyUriPrefix);
					stmt.bindUTF8StringParameter(2, x509CertificateFingerprint);
					stmt.bindUTF8StringParameter(3, idpSpFlag);
					stmt.bindUTF8StringParameter(4, ssosV1);
					stmt.bindUTF8StringParameter(5, ssosV2);
					stmt.bindUTF8StringParameter(6, loginUriPrefix);
					stmt.bindUTF8StringParameter(7, patternName);
					stmt.bindUTF8StringParameter(8, assertionConsumerService);
					stmt.bindUTF8StringParameter(9, samlVersion);
					stmt.bindUTF8StringParameter(10, cookieFlag);
					stmt.execute();
				}
			}
			catch(err) {
				this.warn("SQLiteへ証明書登録失敗:\n" + err);
				return false;
			}
			finally {
				stmt.reset();
			}
			return true;
		}
		else {
			return false;
		}
	},


	// ディスカバリメソッド登録
	insertNewDiscoveryMethods: function(jsonObject) {
		this.toolbarLabel1.value = "updating Discovery Methods in database...";

		var discoveryMethodsObject = jsonObject.contents.discovery_methods;
		var key;
		var j = 0;

		if (discoveryMethodsObject != null) {
			// ディスカバリメソッド登録
			var stmt = this.dbInsertDiscoveryMethods;
			try {
				for (key in discoveryMethodsObject) {
					var patternName = key;
					var patternValue = discoveryMethodsObject[key];

					stmt.bindUTF8StringParameter(0, patternName);
					stmt.bindUTF8StringParameter(1, patternValue);
					stmt.execute();
				}
			}
			catch(err) {
				this.warn("SQLiteへディスカバリメソッド登録失敗:\n" + err);
				return false;
			}
			finally {
				stmt.reset();
			}
			return true;
		}
		else {
			return false;
		}
	},


	// データベースからSP情報を取得
	getSpByLoginUri: function(accessurl) {
		// 検索条件を作成
		var targetURL;
		var startindex = accessurl.indexOf("//") + 2;
		var endindex = accessurl.indexOf("?");
		if (endindex > 0) {
			var targetIndex = accessurl.indexOf("targetURL=");
			if (targetIndex > 0) {
				targetURL = accessurl.substring(targetIndex + 10);
				targetURL = decodeURIComponent(targetURL.replace(/\+/g, " "));
			}
			else {
				targetURL = accessurl;
			}
		}
		else {
			endindex = accessurl.length;
			targetURL = accessurl;
		}
		var loginUriPrefix = accessurl.substring(startindex, endindex);

		// DBからSP情報を取得
		var found = 0;
		var entityObj;

		var stmt = this.dbSelectEntityByLoginUri;
		try {
			stmt.bindUTF8StringParameter(0, loginUriPrefix);
			if (stmt.executeStep()) {
				found = 1;
				entityObj = new Object();

				entityObj["entityId"] = stmt.getUTF8String(0);	//entity_id
				entityObj["patternName"] = stmt.getUTF8String(1);	//pattern_name
				entityObj["assertionConsumerService"] = stmt.getUTF8String(2);	//assertion_consumer_service
				entityObj["samlVersion"] = stmt.getUTF8String(3);	//saml_version
				entityObj["cookieFlag"] = stmt.getUTF8String(4);	//cookie_flag

				entityObj["targetURL"] = targetURL;
			}
		}
		catch(err) {
			this.warn("SQLiteからSP情報取得失敗:\n" + err);
		}
		finally {
			stmt.reset();
		}

		return entityObj;
	},


	// データベースからIdP情報を取得
	getIdpByEntityId: function(entityid) {
		var found = 0;
		var entityObj;

		var stmt = this.dbSelectEntityByEntityId;
		try {
			stmt.bindUTF8StringParameter(0, entityid);
			if (stmt.executeStep()) {
				found = 1;
				entityObj = new Object();

				entityObj["entityId"] = entityid;
				entityObj["ssosV1"] = stmt.getUTF8String(0);
				entityObj["ssosV2"] = stmt.getUTF8String(1);
			}
		}
		catch(err) {
			this.warn("SQLiteからIdP情報取得失敗:\n" + err);
		}
		finally {
			stmt.reset();
		}

		return entityObj;
	},


	// データベースからディスカバリメソッドを取得
	getDiscoveryMethodByPatternName: function(patternName) {
		var found = 0;
		var patternValue;

		var stmt = this.dbSelectDiscoveryMethodByName;
		try {
			stmt.bindUTF8StringParameter(0, patternName);
			if (stmt.executeStep()) {
				found = 1;
				patternValue = stmt.getUTF8String(0);
			}
		}
		catch(err) {
			this.warn("SQLiteからディスカバリメソッド取得失敗:\n" + err);
		}
		finally {
			stmt.reset();
		}

		return patternValue;
	},
	// ==========END データベース処理==========


	// SSOサービスバージョン1を取得
	getSsosV1: function() {
		var idpObj = this.getIdpByEntityId(this.cookieValuePref);
		if (idpObj) {
			return idpObj.ssosV1;
		}
		return "";
	},


	// SSOサービスバージョン2を取得
	getSsosV2: function() {
		var idpObj = this.getIdpByEntityId(this.cookieValuePref);
		if (idpObj) {
			return idpObj.ssosV2;
		}
		return "";
	},


	// ログインURL自動遷移機能
	redirectionProcess: function() {
		//this.toolbarLabel1.value = "redirection in progress...";

		// アクセスしているURL取得
		var accessurl = gBrowser.selectedBrowser.contentDocument.location.href;

		// データベースからSP情報を取得
		var spObj = this.getSpByLoginUri(accessurl);
		var idpObj = this.getIdpByEntityId(this.cookieValuePref);
		var superObj = new Object();
		superObj["sp"] = spObj;
		superObj["idp"] = idpObj;

		if (spObj && idpObj) {

			// 自動遷移済みチェック
			if (spObj.cookieFlag == 1) {
				var cookieStartIdx;
				var cookieEndIdx;
				var cookieName = "login_uri_redirect";
				var cookieValue = "redirected";
				var existCookieValue;

				var cookieString = CookieGenerator.getCookieStr(accessurl);
				if (cookieString) {
					cookieStartIdx = cookieString.indexOf(cookieName + "=");
					if (cookieStartIdx >= 0) {
						cookieString = cookieString.substring(cookieStartIdx);
						cookieEndIdx = cookieString.indexOf(";");
						if (cookieEndIdx < 0) {
							cookieEndIdx = cookieString.length;
						}
						existCookieValue = cookieString.substring(cookieName.length + 1, cookieEndIdx);
						existCookieValue = decodeBase64(unescape(existCookieValue));
						// 既に自動遷移しました、処理完了
						if (existCookieValue == cookieValue) {
							//this.toolbarLabel1.value = "cookie already set";
							return;
						}
					}
				}
			}

			//自動遷移処理開始
			// ディスカバリメソッドを取得
			var patternValue = this.getDiscoveryMethodByPatternName(spObj.patternName);
			if (patternValue) {
				// ----------method 1----------
				// all discovery methods start with "function(obj)" exactly
				//var snippet = "function doPattern(obj) " + patternValue.substring(10);
				//eval(snippet);
				//var redirectUrl = doPattern(superObj);

				// ----------method 2----------
				// discovery methods can start with "function(obj)"
				//var snippet = "var DiscoveryMethod={" + spObj.patternName + ":" + patternValue + "};";
				//eval(snippet);
				//var redirectUrl = eval("DiscoveryMethod." + spObj.patternName + "(superObj)");

				// ----------method 3----------
				// discovery methods can start with something like "function(obj)"
				var snippet = spObj.patternName + "=" + patternValue;
				eval(snippet);
				var redirectUrl = eval(spObj.patternName + "(superObj)");


				// 自動遷移URL有効チェック
				if (!this.urlReg.test(redirectUrl)) {
					return;
				}

				// 遷移する前にcookie作成
				if (spObj.cookieFlag == 1) {
					var now = new Date().getTime();
					var period = (1000 * 60) * 10;	//10分を設定の場合、一回遷移すると10分内で自動遷移しません
					var expire = new Date(now + period);
					CookieGenerator.setCookie(cookieName, cookieValue, accessurl, expire, this.cookieBase64Pref);
					//this.toolbarLabel1.value = "cookie set successful";
					//this.toolbarLabel1.value = "spObj: " + spObj.patternName + " | redirectUrl: " + redirectUrl;
				}

				// 遷移！！！
				gBrowser.selectedBrowser.contentDocument.location.href = redirectUrl;
			}
		}

	},


	//エラーメッセージダイアログ表示
	warn: function(result) {
		this.toolbarLabel1.value = "TrustTools: エラー";
		this.progressmeter.style.visibility = "hidden";
		window.openDialog("chrome://TrustTools/content/warning.xul",
				"_blank", "chrome,dialog,modal", result);
	},

};	//End of TrustTools




// JSON object to string
function json2String(jsonObj) {
	var r = [], i, j = 0, len;
	if (jsonObj == null) {
		return jsonObj;
	}
	if (typeof jsonObj == 'string') {
		if (jsonObj.indexOf("\t") > 0) {
			jsonObj = jsonObj.replaceAll("\t", "\\t");
		}
		if (jsonObj.indexOf("\"") > 0) {
			jsonObj = jsonObj.replaceAll("\"", "\\\"");
		}
		return '"' + jsonObj + '"';
	}
	if (typeof jsonObj == 'object') {
		if (!jsonObj.sort) {
			r[j++]='{';
			for (i in jsonObj) {
				r[j++] = '"';
				r[j++ ]= i;
				r[j++] = '":';
				r[j++] = json2String(jsonObj[i]);
				r[j++] = ',';
			}
			// empty object
			//r[r[j-1] == '{' ? j:j-1]='}';
			r[j-1] = '}';
		}
		else {
			r[j++] = '[';
			for (i = 0, len = jsonObj.length; i < len; ++i) {
				r[j++] = json2String(jsonObj[i]);
				r[j++] = ',';
			}
			// empty array
			r[len==0 ? j : j-1] = ']';
		}
		return r.join('');
	}
	return jsonObj.toString();
}


// #0000FF
function getRandomColor() {
	return '#' + (0x1000000 + Math.random() * 0xFFFFFF).toString(16).substr(1,6);
}

// rgb(0,0,255)
function getRandomColor2() {
	var r = function () { return Math.floor(Math.random() * 256) };
	return "rgb(" + r() + "," + r() + "," + r() + ")";
}

function getRandomOptions(opts) {
	var r = Math.floor(Math.random() * (opts.length));
	return opts[r];
}


// Test用
function getPropList(myObject) {
	var s;
	for (prop in myObject) { 
		s += ("[" + prop + "] " + myObject[prop] + "\n");
	}
	alert(s);
}


// スペース削除
String.prototype.trim = function() { 
	return this.replace(/(^\s*)|(\s*$)/g, "");
}


// 文字列置き換え
String.prototype.replaceAll = function(s1, s2) {
	return this.replace(new RegExp(s1, "gm"), s2);
}


// lib/rsa-sign.js line:153 RSAKey.prototype.verifyString = _rsasign_verifyString;から参照
// 署名検証関数（署名からダイジェスト値を取得）
RSAKey.prototype.verifyString2 = _rsasign_verifyString_sha256hash;
function _rsasign_verifyString_sha256hash(sMsg, hSig) {
	hSig = hSig.replace(/[ \n]+/g, "");
	var biSig = parseBigInt(hSig, 16);
	var biDecryptedSig = this.doPublic(biSig);
	var hDigestInfo = biDecryptedSig.toString(16).replace(/^1f+00/, '');
	var digestInfoAry = _rsasign_getAlgNameAndHashFromHexDisgestInfo(hDigestInfo);

	if (digestInfoAry.length == 0) return false;
	var algName = digestInfoAry[0];
	var diHashValue = digestInfoAry[1];
	//var ff = _RSASIGN_HASHHEXFUNC[algName];
	//var msgHashValue = ff(sMsg);
	//return (diHashValue == msgHashValue);
	return diHashValue;
}


const strCertified = " 「学認 Certified」 ";
const strWarning = " 「学認 Warning」 ";
const srcCertified = "chrome://TrustTools/content/_certified.gif";
const srcWarning = "chrome://TrustTools/content/_warning.gif";


// ==========BEGIN extension event handling==========
gBrowser.addEventListener("DOMContentLoaded", function(e) { loadCurrent(e); }, false);
if (gBrowser.tabContainer) {
	gBrowser.tabContainer.addEventListener("TabSelect", function() { TrustTools.init(); }, false);
}


document.getElementById("back-button").addEventListener(
	'click',
	function (e) {
		gBrowser.addEventListener("DOMTitleChanged", function(e) { loadCurrent(e); }, false);
	},
	false
);


document.getElementById("forward-button").addEventListener(
	'click',
	function (e) {
		gBrowser.addEventListener("DOMTitleChanged", function(e) { loadCurrent(e); }, false);
	},
	false
);
// ==========END extension event handling==========


/*
 * When firefox browser starts with multiple tabs, 
 * only after the selected tab has been loaded would initialize the process.
 */
function loadCurrent(aEvent) {
	if (aEvent.originalTarget.location) {
		var currentSelectTabUrl = gBrowser.selectedBrowser.contentDocument.location.href;
		var dOMContentLoadedUrl = aEvent.originalTarget.location.href;
		//document.getElementById('toolbarLabel1').value = currentSelectTabUrl;
		if (currentSelectTabUrl == dOMContentLoadedUrl) {
			TrustTools.init();
		}
	}
	else {
		//TrustTools.init();
	}
}



