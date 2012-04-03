
/*このスクリプトでコメントしないで下さい*/

pn1 : function(obj) {

	var url;
	if (obj.sp.samlVersion == 1) {
	    url = obj.idp.ssosV1;
	}
	else if (obj.sp.samlVersion == 2) {
	    url = obj.idp.ssosV2;
	}
	url += "?target=" + encodeURIComponent(obj.sp.targetURL);
	url += "&shire=" + encodeURIComponent(obj.sp.assertionConsumerService);
	url += "&providerId=" + encodeURIComponent(obj.sp.entityId);
	return url;
}


pn2:function (object){
    var url = "http://www.nii.co.jp";
    return url;
}


pn3 : function() {
    var url = "http://www.secioss.co.jp";
    return url;
}


