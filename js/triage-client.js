var Triage = function () {
	"use strict";


	// Domain Public by Eric Wendelin http://eriwen.com/ (2008)
	//                  Luke Smith http://lucassmith.name/ (2008)
	//                  Loic Dachary <loic@dachary.org> (2008)
	//                  Johan Euphrosine <proppy@aminche.com> (2008)
	//                  Oyvind Sean Kinsey http://kinsey.no/blog (2010)
	//                  Victor Homyakov <victor-homyakov@users.sourceforge.net> (2010)

	/**
	*
	*  Base64 encode / decode
	*  http://www.webtoolkit.info/
	*
	**/
	var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(c){for(var a="",d,b,f,g,h,e,i=0,c=Base64._utf8_encode(c);i<c.length;)d=c.charCodeAt(i++),b=c.charCodeAt(i++),f=c.charCodeAt(i++),g=d>>2,d=(d&3)<<4|b>>4,h=(b&15)<<2|f>>6,e=f&63,isNaN(b)?h=e=64:isNaN(f)&&(e=64),a=a+this._keyStr.charAt(g)+this._keyStr.charAt(d)+this._keyStr.charAt(h)+this._keyStr.charAt(e);return a},decode:function(c){for(var a="",d,b,f,g,h,e=0,c=c.replace(/[^A-Za-z0-9\+\/\=]/g,"");e< c.length;)d=this._keyStr.indexOf(c.charAt(e++)),b=this._keyStr.indexOf(c.charAt(e++)),g=this._keyStr.indexOf(c.charAt(e++)),h=this._keyStr.indexOf(c.charAt(e++)),d=d<<2|b>>4,b=(b&15)<<4|g>>2,f=(g&3)<<6|h,a+=String.fromCharCode(d),64!=g&&(a+=String.fromCharCode(b)),64!=h&&(a+=String.fromCharCode(f));return a=Base64._utf8_decode(a)},_utf8_encode:function(c){for(var c=c.replace(/\r\n/g,"\n"),a="",d=0;d<c.length;d++){var b=c.charCodeAt(d);128>b?a+=String.fromCharCode(b):(127<b&&2048>b?a+=String.fromCharCode(b>> 6|192):(a+=String.fromCharCode(b>>12|224),a+=String.fromCharCode(b>>6&63|128)),a+=String.fromCharCode(b&63|128))}return a},_utf8_decode:function(c){for(var a="",d=0,b=c1=c2=0;d<c.length;)b=c.charCodeAt(d),128>b?(a+=String.fromCharCode(b),d++):191<b&&224>b?(c2=c.charCodeAt(d+1),a+=String.fromCharCode((b&31)<<6|c2&63),d+=2):(c2=c.charCodeAt(d+1),c3=c.charCodeAt(d+2),a+=String.fromCharCode((b&15)<<12|(c2&63)<<6|c3&63),d+=3);return a}};

	var Triage = {
		application: '',
		host: '',
		language: 'JAVASCRIPT',
		portal: null,
		queue: [],
		error: null,

		init: function (host, application) {
			this.host = host;
			this.application = application;

			var self = this;

			this.portal = new Triage.Portal(this.host);

			window.onerror = function (msg, url, line) {
				self.logError(msg, url, line);
			};
		},

		logError: function (msg, url, line, severity) {
			this.portal.request( this._urlData('error', msg, url, line, severity) );
		},

		logMsg: function (msg, url, line) {
			this.portal.request( this._urlData('msg', msg, url, line) );
		},

		isFireFox: function(e) {
			if (e.stack && typeof e['arguments'] === 'undefined') {
				return true;
			} else {
				return false;
			}
		},

		_urlData: function (name, exception, url, line, severity) {
			var data = new Triage.UrlData();
			var context = {
				'level' : name,
				'url' : url,
				'useragent' : navigator.userAgent,
				'cookies' : document.cookie,
				'host' : this.host
			};

			if (severity) {
				contest['severity'] = severity;
			}

			data
				.add('project', this.application)
				.add('language', this.language)
				.add('line', line)
				.add('type', 'error')
				.add('message', exception)
				.add('context', severity);

			return '?data='+data.output();
		}
	};

	Triage.UrlData = function() {
		var data = {};

		this.add = function (name, value) {
			data[name] = value;

			return this;
		};

		this.output = function(){
			return encodeURIComponent(Base64.encode(JSON.stringify(data)));
		};

		return this;
	};

	Triage.Portal = function(host){
		var queue = [];
		var iframe = null;
		var self = this;

		/** Setup iframe **/
		iframe = document.createElement('iframe');
		iframe.style.width   = '1px';
		iframe.style.height  = '1px';
		iframe.style.display = 'none';

		iframe.onload = function() {
			queue.shift();

			if(queue.length > 0){
				self.executeRequest();
			}
		};

		if (document.body) {
			document.body.appendChild(iframe);
		} else {
			_onWindowLoad(function() {
				document.body.appendChild(iframe);
			});
		}

		/** public functions **/

		this.request = function(data) {
			queue.push(_getUrl(data));

			if (queue.length === 1) {
				this.executeRequest();
			}
		};

		this.executeRequest = function() {
			iframe.src = queue[0];
		};

		/** private functions **/

		function _onWindowLoad(callback) {
			var previousOnload = window.onload;

			if(typeof window.onload != 'function'){
				window.onload = callback;
				return;
			}

			window.onload = function(){
				if(previousOnload){
					previousOnload();
				}

				callback();
			};
		}

		function _getUrl(data){
			return '//'+host + '/api/log'+data;
		}

		return this;
	};

	return Triage;
}();