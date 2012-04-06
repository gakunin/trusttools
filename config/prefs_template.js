// preferences for provider list validation module
pref("extensions.TrustTools.certListUrlPref", "PROVIDERS_URI");	// provider list URI (providers.json)
pref("extensions.TrustTools.validDatePref", 30);  // provider list cache duration
pref("extensions.TrustTools.userDefinedPref", "User defined string");  // user defined string to authenticate the toolbar (currently, it is readable from the other add-ons... FIXME)

// preferences for discovery service module
pref("extensions.TrustTools.cookieSetPref", true);  // use a cookie to detect SP side session duration (true/false)
pref("extensions.TrustTools.cookieValuePref", "COOKIE_VALUE");  // IdP's entityID
pref("extensions.TrustTools.cookieNamePref", "COOKIE_NAME");  // Cookie Name used for recording IdP at Discovery Service
pref("extensions.TrustTools.cookieDomainPref", "COOKIE_DOMAIN");  // domain name of the Discovery Service
pref("extensions.TrustTools.cookieBase64Pref", false);  // apply Base64 encoding to the cookie value (true/false)

// https://developer.mozilla.org/en/Localizing_extension_descriptions
