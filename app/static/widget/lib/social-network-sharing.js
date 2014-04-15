var HuffpostLabsSocialNetworks = function() {

	var setupTwitter = function() {
		window.HuffpostLabsShareTwitter = function(text, url, callback) {
			var twitterURL = 'https://twitter.com/share?';
				twitterURL+= ('url=' + (url || window.location.href));
				twitterURL+= ('&text=' + (text || ''));
				twitterURL+= '&via=HuffPostLabs';
			window.open(twitterURL, 'targetWindow','toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=300,height=300');
			if (callback) { callback(); }
		}
	}


	var setupFB = function() {
	    /*
	    facebook sharing plan:
	      only share on facebook if its from huffpost domain or other if specified -
	            - need app for each domain
	   */
		var defaultSharePicture = "http://www.huffingtonpost.com/favicon.ico";
	    var appIDMap = {
	    				/* application specific sharing support */
	    				"http://YOUR-SPECIFIC-DOMAIN": 'YOUR-SPECIFIC-APP-ID',

	    				"http://quizwidget-petri.dotcloud.com": '611233398931791',
					    "http://7edc0fcb.ngrok.com": '502717763181151',



					     /* subdomains supported by the HuffpostLabs app */
					     "http://code.huffingtonpost.com":'1427100424195799',
					     "http://www.huffingtonpost.com": '1427100424195799',
					     "http://p.huffingtonpost.com":   '1427100424195799',
					     "http://huffingtonpost.com": 	  '1427100424195799',
					     // mobile:
					     "http://m.huffpost.com": 		  '1427100424195799',

					     /* if there is a Huffpost subdomain that isn't supported above:
					     	- get added as an 'administrator' or 'developer' to the HuffpostLabs FB app
							- Add the subdomain
							- Edit this file
								"http://NEW-SUBDOMAIN.huffingtonpost.com": 	  '1427100424195799',
							- PLEASE make pull request so that everyone else can use it too
						*/
					};

		var appID = appIDMap[window.location.origin];
		if (!appID) { /* NO FB SHARING */
	    	disableFBsharing();
			return;
		}

	    /* NEED: <div style="display:none" id="fb-root"></div> */
	    var fb_root_div = document.getElementById('fb-root');
	    if (!fb_root_div) {
			fb_root_div = document.createElement('div');
			fb_root_div.id = 'fb-root';
			fb_root_div.style.display = 'none';
			document.body.appendChild(fb_root_div);
	    }

	   /* ------------- necessary setup straight from FB ------------- */
	   if (window.FB == undefined) {
		window.fbAsyncInit = function() {
			FB.init({
				appId      : appID,
				status     : true,
				xfbml      : true
			});
		};
		(function(d, s, id){var js, fjs = d.getElementsByTagName(s)[0];if (d.getElementById(id)) {return;}js = d.createElement(s); js.id = id;js.src = "//connect.facebook.net/en_US/all.js";fjs.parentNode.insertBefore(js, fjs);}(document, 'script', 'facebook-jssdk'));
	   }
		/* ------------- necessary setup straight from FB above ----------- */


		window.HuffpostLabsShareFB = function(shareData, onSuccess, onError) {
			shareData.method  = 'feed';
			shareData.picture = (shareData.picture || defaultSharePicture);
			shareData.link 	  = (shareData.link    || window.location.href);
			FB.ui(shareData, function(response) {
				if (response && response.post_id) {
					if (onSuccess) { onSuccess(); }
				} else {
					if (onError) { onError(); }
				}
			});
		}

	}
	function disableFBsharing() {
		/* hide all the share buttons */
		var rules = "#fb-share-btn,.fb-share-btn,huffpostlabs-quiz .fb-share-btn{display:none}";
		var stylesheet = document.createElement('style');
		document.body.appendChild(stylesheet);
    	stylesheet.innerHTML = rules; 
		console.log('FB sharing disabled.');
	}

	setupTwitter();
	setupFB();
}();
