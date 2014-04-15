/* name is q.js: let's make the name as short as possible as for easy reference
	
	This is pure javascript - no jQuery

*/


/* wrap in anonymous function as to not interfere with existing function and variable names */
(function() {

	var domain = 'http://127.0.0.1:8080';
	//var domain = 'http://quizwidget-petri.dotcloud.com';


	 /* akamai cache domain: 'quiz.huffingtonpost.com'
			Only use it for GET requests on foreign host
			- if on our own host, we care to see changes right away, not cache
	 */
	var static_domain = 'http://quiz.huffingtonpost.com';
	if (window.location.origin == domain) {
		static_domain = domain;
	}


	this.QuizWidgets = {};
	this.QuizFunctions = null;
	this.QuizMobile;

	var scripts 	= [
					   	(static_domain + "/widget/quiz-object.js"),
					   	(static_domain + "/widget/lib/btn-master.js"),
					   	(static_domain + "/widget/lib/social-network-sharing.js"),
					   ];
	var stylesheets = [(static_domain + "/widget/widget.css")];


	var setupGlobalQuizFunctions = function() {
		/* define a set of quiz functions that are global
			- defined functions are callable by 
				quizFunctions.f_name(arguments)
		*/
		this.QuizFunctions = (this.QuizFunctions || {});

		this.QuizFunctions.twitterShare = function(text, share) {
			/* using HuffpostLabs social-network-sharing library */
			HuffpostLabsShareTwitter(text, share.link, function() {
				PUT("/api/share/" + share._id + "/increment-twitter-count", null);
			});
		}
		this.QuizFunctions.fbShare = function(shareData, share) { 
			/* using HuffpostLabs social-network-sharing library */
			HuffpostLabsShareFB(shareData, function() {
				console.log('FB quiz post was published.');
				if (share._id) { /* log that it was shared */
					PUT("/api/share/" + share._id + "/increment-fb-count", null);
				}
			});
		}
		this.QuizFunctions.quizStarted = function(quiz) {
			PUT("/stats/" + quiz._id + "/increment/started-null", null);
		}
		this.QuizFunctions.quizRestarted = function(quiz) {
			PUT("/stats/" + quiz._id + "/increment/restarted-null", null);
		}
		this.QuizFunctions.quizCompleted = function(quiz, outcome, chosenAnswers) {
			/* increment counts for quiz, outcome and each chosenAnswer */
			var completedDataString = ("/stats/" + quiz._id + "/increment/");
				completedDataString+= ("completed-null");
				completedDataString+= ("-Outcome-" + outcome._id);
			for (var i=0; i<chosenAnswers.length; i++) {
				completedDataString+= ("-Answer-" + chosenAnswers[i]._id);
			}

			PUT(completedDataString, null);
		}
	}





	var addWindowFunction = function(f_name, f) {
		window[f_name] = f;
	}

	/* helper for 'getting' and 'posting' 
		
		- using static_domain for GET requests and true domain for POSTS
		because I want my POST requests to actually make it to my server rather than getting caught in the cache
		- This is important because of the fact that JSONP is really using a GET	
	*/
	function jsonp(domain, endpoint, callback){
		var f_name = "quizModuleJSONPcallbacks_" + String(endpoint.split('/').join('_'));
		
		var tempscript  = document.createElement('script');
		tempscript.id   = "tempscript-" + f_name;
		tempscript.src  = domain + endpoint + "?callback=" + f_name + "";
		tempscript.type = "text/javascript";
		document.body.appendChild(tempscript);

		addWindowFunction(f_name, function(data) {
			document.body.removeChild(tempscript);
			tempscript = null;
			if (callback) { callback(data); }
		});
	}
	function GET(endpoint, callback) {
		jsonp(static_domain, endpoint, callback);
	}
	/* (cough... jsonp hack to get around cross origin issue...) */
	function PUT(endpoint, callback) {
		jsonp(domain, endpoint, callback);
	}



	/* check if user is using mobile browser -- return true if so */
	function isMobile() {
		var check = false;
		(function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4)))check = true})(navigator.userAgent||navigator.vendor||window.opera);
		if(window.innerWidth <= 600) { check = true; }
		return check;
	}
	
	function isIE8or9() {
		var rv = -1;
		if (navigator.appName == 'Microsoft Internet Explorer') {
			var ua = navigator.userAgent;
			var re  = new RegExp("MSIE ([0-9]{1,}[\.0-9]{0,})");
			if (re.exec(ua) != null)
				rv = parseFloat( RegExp.$1 );
		}
		if ((rv > 0) && (rv < 10)) {
			return true;
		} else {
			return false;
		}
	}

	var withScripts = function(srcList, callback) {
		var numScripts = srcList.length;
		var numLoaded = 0;
        function scriptLoaded() {
            numLoaded++;
            if (numLoaded === numScripts) {
                callback();
            }
        }
		for (var i=0; i<numScripts; i++) {

			var script_tag = document.createElement('script');
			script_tag.setAttribute("type","text/javascript");
			script_tag.setAttribute("src", srcList[i]);
			if (script_tag.readyState) {
				script_tag.onreadystatechange = function () { // For old versions of IE
					if (this.readyState == 'complete' || this.readyState == 'loaded') {
						scriptLoaded();
					}
				};
			} else {
				script_tag.onload = scriptLoaded;
			}
			// Try to find the head, otherwise default to the documentElement
			(document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
		}
		if (!numScripts) {
			callback();
		}
	};

	var withStyleSheets = function(srcList, callback) {
		for (var i=0; i<srcList.length; i++) {
			if (document.createStyleSheet) {
				document.createStyleSheet(srcList[i]);
			} else {
				var ss = document.createElement("link");
				ss.type = "text/css";
				ss.rel = "stylesheet";
				ss.href = srcList[i];
				document.getElementsByTagName("head")[0].appendChild(ss);
			}
		}
		if (callback) { callback(); }
	};
	function loadDependencies(callback) {
		withStyleSheets(stylesheets);
		withScripts(scripts, callback);
	}
	function disablePinterestBullshit(container) {
		/* Huffpost decided it was a great idea to make EVERY IMAGE PINABLE - no thanks, especially not on the images that are actually my facebook buttons... awkward.. */
		container.className += " no-pin";
	}
	function showLoading(container) {
		if (!container) { return; }
		/* show only the loading gif */
		container.style.display = "none";
		
		var loadingGif = document.createElement("img");
		loadingGif.src = (static_domain + "/widget/icon/loading.gif");
		loadingGif.className = "huffpostlabs-loading";
		loadingGif.style.display = "block";
		loadingGif.style.margin = "auto";
		container.parentNode.insertBefore(loadingGif, container.nextSibling);
	}
	function doneLoadingCallback(container) {
		/* undoes the work of showLoading - shows widget and removes loading gif */
		container.style.display = 'block';
        container.parentNode.removeChild(container.nextSibling);
	}

	function createQuiz(quizID, container, callback){
		if (!quizID) { return null; }
		/* load quiz data - create quiz widet object, replace loading display with widget */
        GET("/api/quiz/" + quizID, function(data) {
			this.QuizWidgets[quizID] = new HuffpostLabsQuizObject(container, data);//, mobile, quizStartedCallback, quizCompletedCallback, quizRestartedCallback);
			doneLoadingCallback(container);
        	if (callback) { callback(); }
		});
	};

	// load dependencies before calling main
	function main(){

		this.QuizMobile = isMobile();

		var widgetContainers = document.getElementsByClassName('huffpostlabs-quiz');
		
		loadDependencies(function() { /* callback after stylesheets and scripts loaded */
			for (var i=0; i<widgetContainers.length; i++) {
				var container = widgetContainers[i];
				/* create quiz widget object, replace loading display with widget */
				createQuiz(container.id, container);
			}
		});
		/* while loading that quizData.... */
		for (var c=0; c<widgetContainers.length; c++) {
			showLoading(widgetContainers[c]);
			disablePinterestBullshit(widgetContainers[c]);
		}
		setupGlobalQuizFunctions();
	}
	main();
	console.log('*****s',this.QuizFunctions, this.QuizWidgets)

	return {
		What:'What',
		QuizWidgets: this.quizWidgets,
		QuizFunctions: this.QuizFunctions,
		QuizMobile: this.QuizMobile,
	};	
})();
