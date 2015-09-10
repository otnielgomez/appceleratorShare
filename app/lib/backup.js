// --------------------------------------------------------
// birdhouse.js
//
// BirdHouse is a Titanium Developer plugin for
// authenticating and sending API calls to Twitter.
//
// Copyright 2011 (c) iEntry, Inc
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
// Author: Joseph D. Purcell, iEntry Inc
// Version: 0.9
// Modified: May 2011
// --------------------------------------------------------

// INCLUDES
// iphone requires complete path
Ti.include('oauth.js');
Ti.include('sha1.js');
// THE CLASS
function BirdHouse(params) {
	// --------------------------------------------------------
	// ==================== PRIVATE ===========================
	// --------------------------------------------------------
	// VARIABLES
	var cfg = {
		// user config
		oauth_consumer_key : "",
		consumer_secret : "",
		show_login_toolbar : false,
		// system config
		oauth_version : "1.0",
		oauth_token : "",
		oauth_signature_method : "HMAC-SHA1",
		request_token : "",
		request_token_secret : "",
		request_verifier : "",
		access_token : "",
		access_token_secret : "",
		callback_url : ""
	};
	var accessor = {
		consumerSecret : cfg.consumer_secret,
		tokenSecret : cfg.access_token_secret
	};
	var authorized = false;

	// --------------------------------------------------------
	// set_message
	//
	// Creates a message to send to the Twitter service with
	// the given parameters, and adds the consumer key,
	// signature method, timestamp, and nonce.
	//
	// In Parameters:
	//	url (String) - the url to send the message to
	//	method (String) - 'POST' or 'GET'
	//	params (String) - parameters to add to the
	//	  message in URL form, i.e. var1=2&var2=3
	//
	// Returns:
	//	message (Array) - the message parameters to send
	//	  to Twitter
	// --------------------------------------------------------
	function set_message(url, method, params) {
		var message = {
			action : url,
			method : (method == 'GET') ? method : 'POST',
			parameters : (params != null) ? OAuth.decodeForm(params) : []
		};
		message.parameters.push(['oauth_consumer_key', cfg.oauth_consumer_key]);
		message.parameters.push(['oauth_signature_method', cfg.oauth_signature_method]);
		message.parameters.push(["oauth_timestamp", OAuth.timestamp().toFixed(0)]);
		message.parameters.push(["oauth_nonce", OAuth.nonce(42)]);
		message.parameters.push(["oauth_version", "1.0"]);

		return message;
	}

	// --------------------------------------------------------
	// get_request_token
	//
	// Sets the request token and token secret.
	//
	// In Parameters:
	//	callback (Function) - a function to call after
	//	  the user has been authorized; note that it won't
	//	  be executed until get_access_token()
	// --------------------------------------------------------
	function get_request_token(callback) {

		var url = 'https://api.twitter.com/oauth/request_token';

		var params = (cfg.callback_url != "") ? 'oauth_callback=' + escape(cfg.callback_url) : '';

		api(url, 'POST', params, function(resp) {
			if (resp != false) {
				var responseParams = OAuth.getParameterMap(resp);
				cfg.request_token = responseParams['oauth_token'];
				cfg.request_token_secret = responseParams['oauth_token_secret'];
				get_request_verifier(callback);
			}
		}, false, true, false);
	}

	// --------------------------------------------------------
	// get_request_verifier
	//
	// Sets the request verifier. There is no reason to call
	// this unless you have the request token and token secret.
	// In fact, it should only be called from get_request_token()
	// for that very reason.
	//
	// In Parameters:
	//	callback (Function) - a function to call after
	//	  the user has been authorized; note that it won't
	//	  be executed until get_access_token()
	// --------------------------------------------------------
	function get_request_verifier(callback) {

		var url = "http://api.twitter.com/oauth/authorize?oauth_token=" + cfg.request_token;
		var win = Ti.UI.createWindow({
			top : 0,
			modal : true,
			fullscreen : true
		});

		var leftnavBtn = Ti.UI.createButton({
			left : 10,
			height : 29,
			width : 62,
			title : 'Cancel'
		});
		win.leftNavButton = leftnavBtn;
		leftnavBtn.addEventListener('click', function(e) {
			win.close();
		});
		var webView = Ti.UI.createWebView({
			url : url,
			scalesPageToFit : true,
			touchEnabled : true,
			top : 0,

		});

		var request_token = "";
		var url_base = "";
		var params = "";
		var loading = false;
		// since the 'loading' property on webView is broke, use this
		var loads = 0;
		// number of times webView has loaded a URl
		var doinOurThing = false;
		// whether or not we are checking for oauth tokens

		// add the webview to the window and open the window

		win.add(webView);
		hideIndicator(win);
		win.open();

		// since there is no difference between the 'success' or 'denied' page apart from content,
		// we need to wait and see if Twitter redirects to the callback to determine success
		function checkStatus() {
			if (!doinOurThing) {
				// access denied or something else was clicked
				if (!loading) {
					webView.stopLoading();
					win.remove(webView);
					win.close();

					if ( typeof (callback) == 'function') {
						callback(false);
					}

					return false;
				}
			} else {
			}
		}


		webView.addEventListener('beforeload', function() {
			loading = true;
		});
		webView.addEventListener('load', function(e) {
			loads++;

			// the first time load, ignore, because it is the initial 'allow' page

			// set timeout to check for something other than 'allow', if 'allow' was clicked
			// then loads==3 will cancel this
			if (loads == 2) {
				// something else was clicked

				if (e.url != 'https://api.twitter.com/oauth/authorize') {
					webView.stopLoading();
					win.remove(webView);
					win.close();

					if ( typeof (callback) == 'function') {
						callback(false);
					}

					return false;
				}
				// wait a bit to see if Twitter will redirect
				else {
					setTimeout(checkStatus, 1000);
				}
			}
			// Twitter has redirected the page to our callback URL (most likely)
			else if (loads == 3) {

				doinOurThing = true;
				// kill the timeout b/c we are doin our thing

				// success!
				params = "";
				var parts = (e.url).replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
					params = params + m;

					if (key == 'oauth_verifier') {
						cfg.request_verifier = value;
					}
				});

				if (cfg.request_verifier != "") {
					// my attempt at making sure the stupid webview dies
					webView.stopLoading();
					win.remove(webView);
					win.close();
					showIndicator(win);
					get_access_token(callback);

					return true;
					// we are done here
				}
			}

			// we are done loading the page
			loading = false;
		});

	}

	// --------------------------------------------------------
	// get_access_token
	//
	// Trades the request token, token secret, and verifier
	// for a user's access token.
	//
	// In Parameters:
	//	callback (Function) - a function to call after
	//	  the user has been authorized; this is where
	//	  it will get executed after being authorized
	// --------------------------------------------------------
	function get_access_token(callback) {
		var url = 'https://api.twitter.com/oauth/access_token';

		api(url, 'POST', 'oauth_token=' + cfg.request_token + '&oauth_verifier=' + cfg.request_verifier, function(resp) {
			if (resp != false) {
				var responseParams = OAuth.getParameterMap(resp);

				cfg.access_token = responseParams['oauth_token'];
				cfg.access_token_secret = responseParams['oauth_token_secret'];
				cfg.user_id = responseParams['user_id'];
				cfg.screen_name = responseParams['screen_name'];

				accessor.tokenSecret = cfg.access_token_secret;
				save_access_token();
				authorized = load_access_token();

				// execute the callback function
				if ( typeof (callback) == 'function') {
					callback(true);
				}
			} else {
				// execute the callback function
				if ( typeof (callback) == 'function') {
					callback(false);
				}
			}
		}, false, true, false);
	}

	// --------------------------------------------------------
	// load_access_token
	//
	// Loads the access token and token secret from
	// 'twitter.config' to the class configuration.
	// --------------------------------------------------------
	function load_access_token() {
		// try to find file
		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'twitter.config');
		if (!file.exists()) {
			return false;
		}

		// try to read file
		var contents = file.read();
		if (contents == null) {
			return false;
		}

		// try to parse file into json
		try {
			var config = JSON.parse(contents.text);
		} catch(e) {
			return false;
		}

		// set config
		if (config.access_token) {
			cfg.access_token = config.access_token;
		}
		if (config.access_token_secret) {
			cfg.access_token_secret = config.access_token_secret;
			accessor.tokenSecret = cfg.access_token_secret;
		}

		return true;
	}

	// --------------------------------------------------------
	// save_access_token
	//
	// Writes the access token and token secret to
	// 'twitter.config'. Saving the config in a file instead
	// of using Ti.App.Property jazz allows the config to
	// stay around even if the app has been recompiled.
	// --------------------------------------------------------
	function save_access_token() {
		// get file if it exists
		var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'twitter.config');
		// create file if it doesn't exist
		if (file == null) {
			file = Ti.Filesystem.createFile(Ti.Filesystem.applicationDataDirectory, 'twitter.config');
		}

		Ti.App.Properties.setString('ttname', cfg.screen_name);
		Ti.App.Properties.setString('ttid', cfg.user_id);
		Ti.App.Properties.setString('ttimg', 'https://api.twitter.com/1/users/profile_image/' + cfg.screen_name);

		// 296732259
		//JAYESH_IDAR

		Ti.API.info(cfg.user_id);
		Ti.API.info(cfg.screen_name);
		//Ti.App.info('https://api.twitter.com/1/users/profile_image/' + cfg.screen_name);

		// write config
		var config = {
			access_token : cfg.access_token,
			access_token_secret : cfg.access_token_secret,
			user_id : cfg.user_id,
			screen_name : cfg.screen_name,

		};
		file.write(JSON.stringify(config));

	}

	// --------------------------------------------------------
	// api
	//
	// Makes a Twitter API call to the given URL by the
	// specified method with the given parameters.
	//
	// In Parameters:
	//	url (String) - the url to send the XHR to
	//	method (String) - POST or GET
	//	params (String) - the parameters to send in URL
	//	  form
	//	callback (Function) - after execution, call
	//	  this function and send the XHR data to it
	//	auth (Bool) - whether or not to force auth
	//	setUrlParams (Bool) - set the params in the URL
	//	setHeader (Bool) - set "Authorization" HTML header
	//
	// Notes:
	//	- the setUrlParams and setHeader should only need
	//	  to be set whenever getting request tokens; values
	//	  should be 'true' and 'false' respectively
	//	- take advantage of the callback function, if you
	//	  want to tweet a message and then display an alert:
	//	      BH.tweet("some text",function(){
	//	          alertDialog = Ti.UI.createAlertDialog({
	//	              message:'Tweet posted!'
	//	          });
	//	          alertDialog.show();
	//	      });
	//
	// Returns: false on failure and the responseText on
	//   success.
	// --------------------------------------------------------
	function api(url, method, params, callback, auth, setUrlParams, setHeader) {

		var finalUrl = '';

		// authorize user if not authorized, and call this in the callback
		if (!authorized && ( typeof (auth) == 'undefined' || auth === true)) {

			authorize(function(retval) {

				if (!retval) {
					// execute the callback function
					if ( typeof (callback) == 'function') {
						callback(false);
					}

					return false;
				} else {

					api(url, method, params, callback, auth);
				}
			});
		}
		// user is authorized so execute API
		else {

			// VALIDATE INPUT
			if (method != "POST" && method != "GET") {
				return false;
			}
			if (params == null || typeof (params) == "undefined") {
				params = "";
			}

			// VARIABLES
			var initparams = params;

			if (params != null) {
				params = params + "&";
			}

			if (cfg.access_token != '') {
				params = params + "oauth_token=" + cfg.access_token;
			}
			var message = set_message(url, method, params);

			OAuth.SignatureMethod.sign(message, accessor);

			// if we are getting request tokens, all params have to be set in URL
			if ( typeof (setUrlParams) != 'undefined' && setUrlParams == true) {
				finalUrl = OAuth.addToURL(message.action, message.parameters);

			}
			// for all other requests only custom params need set in the URL
			else {
				finalUrl = OAuth.addToURL(message.action, initparams);
			}

			var XHR = Ti.Network.createHTTPClient();

			// on success, grab the request token
			XHR.onload = function() {
				var json = JSON.parse(this.responseText);
				alert(json);
				// execute the callback function
				if ( typeof (callback) == 'function') {
					callback(XHR.responseText);
				}

				return XHR.responseText;
			};

			// on error, show message
			XHR.onerror = function(e) {
				hideIndicator(win);
				alert('Can not open Twiitter dialog....try again');
				// execute the callback function
				if ( typeof (callback) == 'function') {
					callback(false);
				}

				return false;
			}

			XHR.open(method, finalUrl, false);

			// if we are getting request tokens do not set the HTML header
			if ( typeof (setHeader) == 'undefined' || setHeader == true) {
				var init = true;
				var header = "OAuth ";
				for (var i = 0; i < message.parameters.length; i++) {
					if (init) {
						init = false;
					} else {
						header = header + ",";
					}
					header = header + message.parameters[i][0] + '="' + escape(message.parameters[i][1]) + '"';
				}

				XHR.setRequestHeader("Authorization", header);
			}

			XHR.send();

		}
	}

	// --------------------------------------------------------
	// send_tweet
	//
	// Makes an API call to Twitter to post a tweet.
	//
	// In Parameters:
	//	params (String) - the string of optional and
	//	  required parameters in url form
	//	callback (Function) - function to call on completion
	// --------------------------------------------------------
	function send_tweet(params, callback) {

		api('http://api.twitter.com/1/statuses/update.json', 'POST', params, function(resp) {

			if (resp != false) {
				
				Ti.API.debug("fn-send_tweet: response was " + resp + '--------------');
				if ( typeof (callback) == 'function') {
					callback(true);
				}
				return true;
			} else {
				Ti.API.info("Failed to send tweet." + '------------------');
				if ( typeof (callback) == 'function') {
					callback(false);
				}
				return false;
			}
		});
	}

	// --------------------------------------------------------
	// shorten_url
	//
	// Shortens a URL using twe.ly.
	//
	// In Parameters:
	//	url (String) - the url to shorten
	//
	// Returns:
	//	shorturl (String) - the shortened URL, else false
	//	callback (Function) - function to call on completion
	// --------------------------------------------------------
	function shorten_url(url, callback) {

		var XHR = Titanium.Network.createHTTPClient();
		XHR.open("GET", "http://www.twe.ly/short.php?url=" + url + "&json=1");
		XHR.onload = function() {
			try {
				shorturl = JSON.parse(XHR.responseText);
			} catch(e) {
				shorturl = false;
			}

			if (shorturl != false && shorturl.substr(0, 5) == 'Sorry') {
				shorturl = false;
			}

			if ( typeof (callback) == 'function') {
				callback(shorturl, url);
			}

			return shorturl;
		};
		XHR.onerror = function(e) {

			if ( typeof (callback) == 'function') {
				callback(false);
			}

			return false;
		};
		XHR.send();
	}

	// --------------------------------------------------------
	// get_tweets
	//
	// Makes a TWitter API call to get tweets.
	//
	// In Parameters:
	//	params (String) - the string of optional and
	//	  required parameters in url form
	//	callback (Function) - function to use on callback
	// --------------------------------------------------------
	function get_tweets(params, callback) {
		// just in case someone only wants to send a callback
		if ( typeof (params) == 'function' && typeof (callback) == 'undefined') {
			callback = params;
			params = '';
		}

		api("https://api.twitter.com/1/statuses/friends_timeline.json", "GET", params, function(tweets) {
			try {
				tweets = JSON.parse(tweets);
			} catch (e) {
				tweets = false;
			}

			// execute the callback function
			if ( typeof (callback) == 'function') {
				callback(tweets);
			}

			return tweets;
		})
	}

	// --------------------------------------------------------
	// authorize
	//
	// The whole authorization sequence begins with
	// get_request_token(), which calls get_request_verifier()
	// which finally calls get_access_token() which then
	// saves the token in a file.
	//
	// In Parameters:
	//	callback (Function) - a function to call after
	//	  the user has been authorized; note that it won't
	//	  be executed until get_access_token(), unless we
	//	  are already authorized.
	//
	// Returns: true if the user is authorized
	// --------------------------------------------------------
	function authorize(callback) {

		if (!authorized) {

			get_request_token(callback);
			// get_request_token or a function it calls will call callback

		} else {

			// execute the callback function
			if ( typeof (callback) == 'function') {
				callback(authorized);
			}
		}

		return authorized;
	}

	// --------------------------------------------------------
	// deauthorize
	//
	// Delete the stored access token file, delete the tokens
	// from the config and accessor, and set authorized to
	// load_access_token() which should return false since
	// we deleted the file, thus resulting in a deauthroized
	// state.
	//
	// In Parameters:
	//	callback (Function) - function to call after
	//	  user is deauthorized
	//
	// Returns: true if the user is deauthorized
	// --------------------------------------------------------
	function deauthorize(callback) {
		if (authorized) {
			var file = Ti.Filesystem.getFile(Ti.Filesystem.applicationDataDirectory, 'twitter.config');
			file.deleteFile();
			authorized = load_access_token();
			accessor.tokenSecret = "";
			cfg.access_token = "";
			cfg.access_token_secret = "";
			cfg.request_verifier = "";

			// execute the callback function
			if ( typeof (callback) == 'function') {
				callback(!authorized);
			}
		} else {
			// execute the callback function
			if ( typeof (callback) == 'function') {
				callback(!authorized);
			}
		}

		return !authorized;
	}

	var sendTwitterImage = function(postParams, pSuccessCallback, pErrorCallback) {
		var finalUrl = '';

		// authorize user if not authorized, and call this in the callback
		if (!authorized && ( typeof (auth) == 'undefined' || auth === true)) {
			authorize(function(retval) {
				if (!retval) {
					// execute the callback fun ction
					if ( typeof (callback) == 'function') {
						callback(false);
					}

					return false;
				} else {
					sendTwitterImage(postParams, pSuccessCallback, pErrorCallback);
				}
			});
		}
		// user is authorized so execute API
		else {
			var url = "http://upload.twitter.com/1/statuses/update_with_media.json";

			// VARIABLES
			var initparams = params;

			if (params != null) {
				params = params + "&";
			}

			var message = set_message(url, "POST");
			message.parameters.push(['oauth_token', cfg.access_token]);

			OAuth.SignatureMethod.sign(message, accessor);

			var XHR = Ti.Network.createHTTPClient();

			XHR.open("POST", url);

			// on success, grab the request token
			XHR.onload = function() {
				hideIndicator(win);
				alert('Successfully Shared On Twitter');
				Ti.API.debug("XHR.onload " + XHR.responseText);
				var json = JSON.parse(this.responseText);
				alert(json);

			};
			// on error, show message
			XHR.onerror = function(e) {
				hideIndicator(win);
				Ti.API.debug("XHR.onerror " + e);
				alert('Erro Occurs Please Try Again....');
			}
			// if we are getting request tokens do not set the HTML header
			if ( typeof (setHeader) == 'undefined' || setHeader == true) {
				var init = true;
				var header = "OAuth ";
				for (var i = 0; i < message.parameters.length; i++) {
					if (init) {
						init = false;
					} else {
						header = header + ",";
					}
					header = header + message.parameters[i][0] + '="' + escape(message.parameters[i][1]) + '"';
				}
				header = OAuth.getAuthorizationHeader("", message.parameters);
				XHR.setRequestHeader("Authorization", header);

			}

			XHR.send(postParams);

		}

	};
	this.sendTwitterImage = sendTwitterImage;

	//send tweet

	// --------------------------------------------------------
	// ===================== PUBLIC ===========================
	// --------------------------------------------------------
	this.authorize = authorize;
	this.deauthorize = deauthorize;
	this.api = api;
	this.authorized = function() {
		return authorized;
	}
	this.screen_name = cfg.screen_name;
	this.user_id = cfg.user_id;

	this.send_tweet = send_tweet;

	// --------------------------------------------------------
	// =================== INITIALIZE =========================
	// --------------------------------------------------------
	if ( typeof params == 'object') {
		if (params.consumer_key != undefined) {
			cfg.oauth_consumer_key = params.consumer_key;
		}
		if (params.consumer_secret != undefined) {
			cfg.consumer_secret = params.consumer_secret;
			accessor.consumerSecret = cfg.consumer_secret;
		}
		if (params.callback_url != undefined) {
			cfg.callback_url = params.callback_url;
		}
		if (params.show_login_toolbar != undefined) {
			cfg.show_login_toolbar = params.show_login_toolbar;
		}
	}
	authorized = load_access_token();
	// load the token on startup to see if authorized
};

