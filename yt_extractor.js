var ytplayer = document.getElementById("thumb") ;
var query = document.getElementById("query") ;
var urlist = document.getElementById("urlist") ;

var cors = "http://allow-any-origin.appspot.com/" ;
var func_def, helperobj, obj_name ;

var itag_values = {
  _141: '256k AAC',
  _140: '128k AAC',
  _251: '160k Opus',
  _250: '70k Opus',
  _249: '50k Opus',
  _171: '128k Vorbis',
   _22: '720p H.264 192k AAC',
   _84: '720p 3D 192k AAC',
   _18: '360p H.264 96k AAC',
   _82: '360p 3D 96k AAC',
   _36: '240p MPEG-4 36k AAC',
   _17: '144p MPEG-4 24k AAC',
   _43: '360p VP8 128k Vorbis',
  _100: '360p 3D 128k Vorbis',
    _5: '240p H.263 64k MP3',
  _138: '1440p 4400k H.264',
  _264: '1440p 3700k H.264',
  _137: '1080p H.264',
  _136: '720p H.264',
  _135: '480p H.264',
  _134: '360p H.264',
  _133: '240p H.264',
  _160: '144p H.264',
  _271: '1440p VP9',
  _248: '1080p VP9',
  _247: '720p VP9',
  _244: '480p VP9',
  _243: '360p VP9',
  _242: '240p VP9',
  _278: '144p VP9'
};

function extract_URL () {

	var input_url = document.getElementById("input_url").value ;
	var video_id = extractID(input_url) ;

	var url_list = [] ;

	// Getting video webpage
	var url = "http://www.youtube.com/watch?v=" + video_id ;// "&gl=US&hl=en&has_verified=1&bpctr=9999999999" ;
	var video_webpage ;
	{
		var xhr = new XMLHttpRequest();
		xhr.open("GET",cors + url, false) ;

		xhr.onload = function(){

		if(xhr.responseText != undefined)
			video_webpage = xhr.responseText ;
		else
			alert("Webpage with url = " + url + "couldn't be loaded!") ;
		}

		xhr.send();
	}

	console.log(video_webpage);

	// Getting video info
	var embed_webpage = undefined ;
	var age_gate, url_data, video_info_url, param_arr, video_info_webpage;

	// Checks if age-gate, loads embed_webpage if true
	if(search_regex('player-age-gate-content">',video_webpage) != undefined)
	{
		var STS_RE = /"sts"\s*:\s*(\d+)/ ;

		age_gate = true ;
		url = "http://www.youtube.com/embed/" + video_id ;
		{
			var xhr = new XMLHttpRequest();
			xhr.open("GET",cors + url, false) ;

			xhr.onload = function(){

			if(xhr.responseText != undefined)
				embed_webpage = xhr.responseText ;
			else
				alert("Webpage with url = " + url + "couldn't be loaded!") ;
			}

			xhr.send();
		}

		var url_data = "video_id=" + video_id + "&eurl=http://youtube.googleapis.com/v/" + video_id + "&sts=" + search_regex(STS_RE, embed_webpage)[1] ;
		video_info_url = "http://www.youtube.com/get_video_info?" + url_data ;
		{
			var xhr = new XMLHttpRequest();
			xhr.open("GET",cors + video_info_url, false) ;

			xhr.onload = function(){

			if(xhr.responseText != undefined)
				video_info_webpage = xhr.responseText ;
			else
				alert("Webpage with url = " + url + "couldn't be loaded!") ;
			}

			xhr.send();
		}
		param_arr = separate_params(video_info_webpage) ;
		for(var property in param_arr){
			if(param_arr.hasOwnProperty(property)){
				param_arr[property] = unescape(param_arr[property]);
			}
		}
	}
	else
	{
		//Works with video_webpage if age-gate is false
		age_gate = false ;

		try{

			var yt_check = search_regex(/;ytplayer\.config\s*=\s*({.*?});/,video_webpage) ;
			if (yt_check == undefined)
				throw "Couldn't find ytplayer.config" ;

			var url_json = yt_check[1] ;
			var ytplayer_config = JSON.parse(url_json) ;
			var param_arr = ytplayer_config.args ;

			if (param_arr.url_encoded_fmt_stream_map == undefined){
				console.log("No stream map present")
				throw "No stream map is present" ;
			}

		}catch(err)
		{
			alert(err) ;

			//Tries out different combinations of el_values if ytplayer.config is unavavilable due to some reason
			var el_types = ["&el=embedded","&el=detailpage","&el=vevo"] ;
			for (var el of el_types)
			{
				video_info_url = "http://www.youtube.com/get_video_info?&video_id="+ video_id + el +"&ps=default&eurl==http://youtube.googleapis.com/v/" + video_id + "&gl=US&hl=en" ;

				{
					var xhr = new XMLHttpRequest();
					xhr.open("GET",cors + url, false) ;

					xhr.onload = function(){

					if(xhr.responseText != undefined)
							video_info_webpage = xhr.responseText ;
					else
					alert("Webpage with url = " + url + "couldn't be loaded!") ;
					}
					xhr.send();
				}
				param_arr = separate_params(video_info_webpage) ;
				if(param_arr.token != undefined)
					break ;

				console.log(el) ;
			}
		}
	}

	if(param_arr.token == undefined)
	{
		if(param_arr.reason != undefined)
			alert(param_arr.reason) ;
		else
			alert("Token for the video is unavailable due to unknown reason.") ;
	}


	if((param_arr.conn != undefined) && param_arr.conn.startsWith('rtmp')){
		alert("RTMP downloads are not supported!") ;
	}
	else
	{

		var encoded_url_map = (param_arr.url_encoded_fmt_stream_map.concat(param_arr.adaptive_fmts)) ;

		//console.log(encoded_url_map);
		for (var url of encoded_url_map.split(','))
		{

			url_data = separate_params(url) ;
			if((url_data.itag == undefined) || (url_data.url == undefined)){

				continue ;
			}

			var itag = url_data.itag ;
			var video_url = unescape(url_data.url) ;


			if('sig' in url_data){

				video_url += "&signature=" + url_data.sig ;
			}
			else if('s' in url_data)
			{

				var encrypted_sig = url_data.s ;
				var ASSETS_RE = /assets":.+?"js":\s*("[^"]+")/ ;

				var jsplayer_json = search_regex(ASSETS_RE, age_gate ? embed_webpage : video_webpage) ;

				if ((jsplayer_json == undefined) && (age_gate == false))
				{
					if (embed_webpage == undefined){
						var embed_url = "http://www.youtube.com/embed/" + video_id ;
						{
							var xhr = new XMLHttpRequest();
							xhr.open("GET",cors + embed_url, false) ;

							xhr.onload = function(){

							if(xhr.responseText != undefined)
									embed_webpage = xhr.responseText ;
							else
							alert("Webpage with url = " + url + "couldn't be loaded!") ;
							}
							xhr.send();
						}
						jsplayer_json = search_regex(ASSETS_RE, embed_webpage) ;
					}
				}


				var player_url = (jsplayer_json[1])
				player_url = player_url.replace(/\\/g,"") ;
				player_url = player_url.replace(/\"/g,"") ;

				if(player_url == undefined){
					var player_url_json = search_regex(/ytplayer\.config.*?"url"\s*:\s*("[^"]+")/, video_webpage) ;
					player_url = JSON.parse(player_url_json) ;
				}


				var signature = decrypt_s(encrypted_sig, player_url, video_id) ;
				video_url += "&signature=" + signature ;
			}

			if('title' in param_arr){
				video_url += "&title=" + escape(param_arr.title) ;
			}

			url_list[itag] = video_url ;
			console.log(itag_values["_" + itag] + " : " + url_list[itag]) ;
		}
	}

	set_YTPlayer(param_arr);

	for (var u in url_list){
		if(url_list[u] != undefined)
			urlist.innerHTML += "<a href=" + url_list[u] + ">" + itag_values["_" + u] + "</a><br><br>" ;
	}

	console.log(param_arr);
}

function decrypt_s (encrypted_sig, player_url, video_id) {

	if (player_url == undefined){
		alert("Cannot decrypt signature without player_url");
		return ;
	}


	if (player_url.startsWith('//')){
		player_url = "http:" + player_url ;
	}

	try{

		var func = extract_signature_function(encrypted_sig, player_url, video_id) ;

		//The following statements normalize the decrypting function and helper object and bind them into 'signature_extractor_definition'
		var extrct_def = func_def.slice(0, func_def.indexOf('{') + 1) + helperobj + ";" + func_def.slice(func_def.indexOf('{') + 1) ;
		var signature_extractor_definition = extrct_def.substring(extrct_def.indexOf('{') + 1,extrct_def.lastIndexOf('}')) ;

		//console.log("encrypted_sig - " + encrypted_sig + "\n" + signature_extractor_definition) ;

		var sig_func = new Function('a', signature_extractor_definition) ;
		var decrypted_sig =	sig_func(encrypted_sig) ;

		//console.log("decrypted_sig - " + decrypted_sig) ;
		return decrypted_sig ;

	}catch(error)
	{
		alert(error.message) ;
	}

}

function extract_signature_function (s, player_url, video_id) {

	var PLAYER_RE = /.*?-([a-zA-Z0-9_-]+)(?:\/watch_as3|\/html5player)?\.([a-z]+)$/ ;
	var player_details = search_regex(PLAYER_RE, player_url) ;

	var player_type = player_details[2] ;
	var player_id = player_details[1] ;

	if (player_type == 'js')
	{
		var jsplayer_code ;
		{
			var xhr = new XMLHttpRequest();
			xhr.open("GET",cors + player_url, false) ;

			xhr.onload = function(){
				if(xhr.responseText != undefined){
					jsplayer_code = xhr.responseText ;
				}
				else
					alert("Webpage with url = " + player_url + "couldn't be loaded!") ;
			}
			xhr.send();
		}

		parse_js_func(jsplayer_code) ;
		func_def = func_def[0] ;
		helperobj = helperobj[0] ;
	}
	else{
		alert("Unknown player_type") ;
	}

}

function parse_js_func (js_code) {


	var FUNC_NAME_RE = /\.sig\|\|([a-zA-Z0-9$]+)\(/ ;
	var func_name = search_regex(FUNC_NAME_RE, js_code) ;

	var FUNC_RE = "(function " + func_name[1] + "\\([^\\)]+\\){.*?})";
	func_def = search_regex(FUNC_RE, js_code) ;

	var OBJ_RE = /;([A-Za-z0-9$]+)\./ ;
	obj_name = search_regex(OBJ_RE, func_def[0]) ;

	if(obj_name[1].match(/\$./gmi)){
		obj_name[1] = obj_name[1].replace("$","\\$");
	}

	var OBJ_DEF = "(var " + obj_name[1] + "={.*?}})";
	helperobj = search_regex(OBJ_DEF, js_code) ;
}

function search_regex (pattern, string) {

	var REGEXP_OBJ = new RegExp(pattern) ;
	//console.log(REGEXP_OBJ) ;
	var match = REGEXP_OBJ.exec(string) ;
	if (match != undefined)
		return match ;
	else{
		console.log("RegExp \""+ pattern +"\" not found");
		return undefined;
	}
}

RegExp.quote = function(str) {
    return (str+'').replace(/[.?*+^$[\]\\(){}|-]/g, "\\$&");
};

function extractID(){

	var j = burl.indexOf("v=") ;
	return burl.substr(j+2,11) ;
}

function extractID (url) {

	var regExp = /.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=)([^#\&\?]*).*/ ;
    var match = url.match(regExp);

    if (match && match[1].length == 11){
        return match[1];
    }else{
        alert("Incorrect URL");
    }
}

function set_YTPlayer (param_arr) {

	var image = document.getElementById('thumbnail_image');

	if(param_arr.iurlsd)
		image.setAttribute("src",param_arr.iurlsd);
	else if(param_arr.iurlhq)
		image.setAttribute("src",param_arr.iurlhq);
	else if(param_arr.iurlmq)
		image.setAttribute("src",param_arr.iurlmq);
	else
		image.setAttribute("src",param_arr.iurl);

	ytplayer.style.display = "block" ;
}

function separate_params(data) {

  	var sep_arr = [];
  	for (var unit of data.split('&')) {
    	var part = unit.split('=');
    	sep_arr[part[0]] = part[1];
  	}
  	return sep_arr;
}


function respond() {

	;
}
