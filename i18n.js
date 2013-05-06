/**
 * @author  John Resig <jeresig@gmail.com>
 * @author  Originally by Marcus Spiegel <marcus.spiegel@gmail.com>
 * @link    https://github.com/jeresig/i18n-node
 * @license http://opensource.org/licenses/MIT
 *
 * @version 0.4.4
 */

// dependencies
var vsprintf = require("sprintf").vsprintf,
	fs = require("fs"),
	path = require("path");

var i18n = module.exports = function(opt) {
	var self = this;

	// Put into dev or production mode
	this.devMode = process.env.NODE_ENV !== "production";

	// Copy over options
	for (var prop in opt) {
		this[prop] = opt[prop];
	}

	// you may register helpers in global scope, up to you
	if (typeof this.register === "object") {
		i18n.registerMethods.forEach(function(method) {
			self.register[method] = self[method].bind(self);
		});
	}

	// implicitly read all locales
	// if it's an array of locale names, read in the data
	if (opt.locales && opt.locales.forEach) {
		this.locales = {};

		opt.locales.forEach(function(locale) {
			self.readFile(locale);
		});

		this.defaultLocale = opt.locales[0];
	}

	// Set the locale to the default locale
	this.setLocale(this.defaultLocale);

	// Check the defaultLocale
	if (!this.locales[this.defaultLocale]) {
		console.error("Not a valid default locale.");
	}

	if (this.request) {
		//console.log("i18n strategy", this.subdomain, this.query, this.path, this.request);
		if (this.subdomain) {
			this.setLocaleFromSubdomain(this.request);
		} else if (this.query) {
			this.setLocaleFromQuery(this.request);
		} else {
			this.setLocaleFromPath(this.request);
		} 
		this.prefLocale = this.preferredLocale();
	}
};

i18n.version = "0.4.4";

i18n.localeCache = {};
i18n.resMethods = ["__", "__n", "getLocale", "isPreferredLocale"];

i18n.expressBind = function(app, opt) {
	if (!app) {
		return;
	}

	app.use(function(req, res, next) {
		opt.request = req;
		req.i18n = new i18n(opt);

		// Express 3
		if (res.locals) {
			i18n.registerMethods(res.locals, req);
		}

		next();
	});

	// Express 2
	if (app.dynamicHelpers) {
		app.dynamicHelpers(i18n.registerMethods({}));
	}
};

i18n.registerMethods = function(helpers, req) {
	i18n.resMethods.forEach(function(method) {
		if (req) {
			helpers[method]	= req.i18n[method].bind(req.i18n);
		} else {
			helpers[method] = function(req) {
				return req.i18n[method].bind(req.i18n);
			};	
		}
	});

	return helpers;
};

i18n.prototype = {
	defaultLocale: "en",
	extension: ".js",
	directory: "./locales",
	cookiename: "lang",

	__: function() {
		var msg = this.translate(this.locale, arguments[0]);

		if (arguments.length > 1) {
			msg = vsprintf(msg, Array.prototype.slice.call(arguments, 1));
		}

		return msg;
	},

	__n: function(singular, plural, count) {
		var msg = this.translate(this.locale, singular, plural);

		msg = vsprintf(parseInt(count, 10) > 1 ? msg.other : msg.one, [count]);

		if (arguments.length > 3) {
			msg = vsprintf(msg, Array.prototype.slice.call(arguments, 3));
		}

		return msg;
	},

	setLocale: function(locale) {
		if (!locale) return;

		if (!this.locales[locale]) {
			if (this.devMode) {
				console.warn("Locale (" + locale + ") not found.");
			}

			locale = this.defaul/**
 * @author  John Resig <jeresig@gmail.com>
 * @author  Originally by Marcus Spiegel <marcus.spiegel@gmail.com>
 * @link    https://github.com/jeresig/i18n-node
 * @license http://opensource.org/licenses/MIT
 *
 * @version 0.4.4
 */

// dependencies
var vsprintf = require("sprintf").vsprintf,
	fs = require("fs"),
	path = require("path");

var i18n = module.exports = function(opt) {
	var self = this;

	// Put into dev or production mode
	this.devMode = process.env.NODE_ENV !== "production";

	// Copy over options
	for (var prop in opt) {
		this[prop] = opt[prop];
	}

	// you may register helpers in global scope, up to you
	if (typeof this.register === "object") {
		i18n.registerMethods.forEach(function(method) {
			self.register[method] = self[method].bind(self);
		});
	}

	// implicitly read all locales
	// if it's an array of locale names, read in the data
	if (opt.locales && opt.locales.forEach) {
		this.locales = {};

		opt.locales.forEach(function(locale) {
			self.readFile(locale.toLowerCase());
		});

		this.defaultLocale = opt.locales[0].toLowerCase();
		// Check the defaultLocale
		if (!this.locales[this.defaultLocale]) {
			console.error("Not a valid default locale.");
		}
	}

	// Set the locale to the prefered accepted locale of the user
	this.setPreferredLocale();
	this.setLocale(this.preferredLocale);

	if (this.request) {
		console.log("i18n strategy", this.path);
		if (this.subdomain) {
			this.setLocaleFromSubdomain(this.request);
		} else if (this.query) {
			this.setLocaleFromQuery(this.request);
		} else {
			this.setLocaleFromPath(this.request);
		}

		console.log("this.preferredLocale", this.preferredLocale, this.locale);
	}
};

i18n.version = "0.4.4";

i18n.localeCache = {};
i18n.resMethods = ["__", "__n", "getLocale", "isPreferredLocale"];

i18n.expressBind = function(app, opt) {
	if (!app) {
		return;
	}

	// registerMethod connect middleware
	app.use(function(req, res, next) {
		opt.request = req;
		req.i18n = new i18n(opt);

		// Express 3
		if (res.locals) {
			i18n.registerMethods(res.locals, req);
		}
		next();
	});

	// Express 2
	if (app.dynamicHelpers) {
		app.dynamicHelpers(i18n.registerMethods({}));
	}

	// request path rewrite middleware 
	console.log("pathMiddleware init", opt.path);
	if (opt && opt.path) {
		app.use(i18n.pathRewriteMiddleware);
	}
};

i18n.pathRewriteMiddleware = function(req, res, next) {
	console.log("pathRewriteMiddleware", req.i18n.path, req.url)
	var url = req.url
	if (!url) return next();

	// extract the locale segment from the url if it is stored in the path
	if (req.i18n && req.i18n.path && req.i18n.locales) {
		if (/^\/([a-z]{2}(?:-(?:[A-Z]{2}))*)\//i.test(url)) { // && req.i18n.locales[RegExp.$1]
			req.url = url.replace(RegExp.$1 + '/', '');
			console.log('locale: ' + req.i18n.getLocale(), req.i18n.path);
		}
	}
	console.log("pathRewriteMiddleware after", url, req.url)
	next();
}

i18n.registerMethods = function(helpers, req) {
	i18n.resMethods.forEach(function(method) {
		if (req) {
			helpers[method] = req.i18n[method].bind(req.i18n);
		} else {
			helpers[method] = function(req) {
				return req.i18n[method].bind(req.i18n);
			};
		}
	});

	return helpers;
};

i18n.prototype = {
	defaultLocale: "en",
	extension: ".js",
	directory: "./locales",
	cookiename: "lang",

	__: function() {
		var msg = this.translate(this.locale, arguments[0]);

		if (arguments.length > 1) {
			msg = vsprintf(msg, Array.prototype.slice.call(arguments, 1));
		}

		return msg;
	},

	__n: function(singular, plural, count) {
		var msg = this.translate(this.locale, singular, plural);

		msg = vsprintf(parseInt(count, 10) > 1 ? msg.other : msg.one, [count]);

		if (arguments.length > 3) {
			msg = vsprintf(msg, Array.prototype.slice.call(arguments, 3));
		}

		return msg;
	},

	initLocale: function(locale, data) {
		if (!this.locales[locale]) {
			this.locales[locale] = data;

			// Only cache the files when we're not in dev mode
			if (!this.devMode) {
				var file = this.locateFile(locale);
				if (!i18n.localeCache[file]) {
					i18n.localeCache[file] = data;
				}
			}
		}
	},

	// find exact locale
	findLocale: function(locale) {
		locale = locale.toLowerCase();
		if (this.locales[locale]) {
			return locale;
		}
		return false;
	},

	// find locale or the sublocale e.g. en-GB -> finds also en if available
	findSubLocale: function(locale) {
		var primary = this.findLocale(locale);
		if (primary) return primary;
		if (~locale.indexOf('-')) {
			locale = locale.split('-')[0];
			return this.findLocale(locale);
		}
		return false;
	},

  // find the closest locale. 
  // first try the exact one,
  // then try the sub locale,
  // otherwise do the same for the preferredLocales (acceptedLanguages) of the user.
	findClosestLocale: function(locale) {
		var loc = this.findSubLocale(locale);
		if (loc) return loc;
		for (var i = 0; this.preferredLocales.length; i++) {
			var closest = this.preferredLocales[i];
			var loc = this.findSubLocale(closest);
			if (loc) return loc;
		}
		return this.defaultLocale;
	},

	setLocale: function(locale) {
		if (!locale) return false;
		this.locale = this.findClosestLocale(locale);
	},

	getLocale: function() {
		return this.locale;
	},

	setPreferredLocale: function(req) {
		req = req || this.request;

		if (!req || !req.acceptedLanguages) {
			return this.defaultLocale;;
		}

		var acceptedLanguages = this.preferredLocales = req.acceptedLanguages;
		console.log("acceptedLanguages", acceptedLanguages);
		this.preferredLocale = acceptedLanguages[0];



		// if (!req || !req.headers) {
		// 	return;
		// }

		// var accept = req.headers["accept-language"] || "",
		// 	self = this,
		// 	preferredLocale = false;

		// console.log("accept-language", accept, this.defaultLocale);

		// // first check with the full locale like `de-CH` or `en-GB
		// this.preferredLocales = accept.match(/([a-z]{2}(?:-(?:[A-Z]{2}))*)/ig) || [];
		// (this.preferredLocales).forEach(function(locale) {
		// 	console.log("ACCEPT NEW", locale)
		// 	if (!preferredLocale && self.locales[locale]) {
		// 		preferredLocale = locale;
		// 	}
		// });

		// // if the locale wasn't found at all, return the default locale
		// return preferredLocale || this.defaultLocale;

		// // TODO remove
		// // if (preferredLocale) return preferredLocale;

		// // // if the locale was not found, fall back to the short one like `de` or `en`
		// // (accept.match(/([a-z]{2})/g) || []).forEach(function(locale) {
		// // 	console.log("ACCEPT", locale)
		// // 	if (!preferredLocale && self.locales[locale]) {
		// // 		preferredLocale = locale;
		// // 	}
		// // });

		// // // if the locale wasn't found at all, return the default locale
		// // return preferredLocale || this.defaultLocale;
	},

	isPreferredLocale: function() {
		return !this.preferredLocale || this.preferredLocale === this.getLocale();
	},

	setLocaleFromQuery: function(req) {
		//console.log("i18n Query", req.path, req.query, this.query);
		req = req || this.request;

		if (!req || !req.query || !req.query.lang) {
			return;
		}

		var locale = req.query.lang.toLowerCase();

		if (this.locales[locale]) {
			if (this.devMode) {
				console.log("Overriding locale from query: " + locale);
			}

			this.setLocale(locale);
		}
	},

	setLocaleFromSubdomain: function(req) {
		//console.log("i18n subdomain", req.headers.host, this.subdomain);
		req = req || this.request;

		if (!req || !req.headers || !req.headers.host) {
			return;
		}

		if (/^([^.]+)/.test(req.headers.host) && this.locales[RegExp.$1]) {
			if (this.devMode) {
				console.log("Overriding locale from host: " + RegExp.$1);
			}

			this.setLocale(RegExp.$1);
		}
	},

	// locale in the beginning of the path like: http://suuper.com/en-GB/drill/down/path-to-the-end
	setLocaleFromPath: function(req) {
		console.log("i18n path", req.path, req.query);
		req = req || this.request;

		if (!req || !req.path) {
			return;
		}

		// match locale according to: http://www.ietf.org/rfc/rfc1766.txt  (caseinsensitive)
		if (/^\/([a-z]{2}(?:-(?:[A-Z]{2}))*)\//i.test(req.path)) {
			if (this.devMode) {
				console.log("Overriding locale from host: " + RegExp.$1);
			}
			this.setLocale(RegExp.$1);
		}
	},

	setLocaleFromCookie: function(req) {
		req = req || this.request;

		if (!req || !req.cookies || !this.cookiename || !req.cookies[this.cookiename]) {
			return;
		}

		var locale = req.cookies[this.cookiename].toLowerCase();

		if (this.locales[locale]) {
			if (this.devMode) {
				console.log("Overriding locale from cookie: " + locale);
			}

			this.setLocale(locale);
		}
	},


	// read locale file, translate a msg and write to fs if new
	translate: function(locale, singular, plural) {
		if (!locale || !this.locales[locale]) {
			if (this.devMode) {
				console.warn("WARN: No locale found. Using the default (" + this.defaultLocale + ") as current locale");
			}

			locale = this.defaultLocale;

			this.initLocale(locale, {});
		}

		if (!this.locales[locale][singular]) {
			this.locales[locale][singular] = plural ? {
				one: singular,
				other: plural
			} : singular;

			if (this.devMode) {
				this.writeFile(locale);
			}
		}

		return this.locales[locale][singular];
	},

	// try reading a file
	readFile: function(locale) {
		var file = this.locateFile(locale);

		if (!this.devMode && i18n.localeCache[file]) {
			this.initLocale(locale, i18n.localeCache[file]);
			return;
		}

		try {
			var localeFile = fs.readFileSync(file);

			try {
				// parsing filecontents to locales[locale]
				this.initLocale(locale, JSON.parse(localeFile));

			} catch (e) {
				console.error('unable to parse locales from file (maybe ' + file +
					' is empty or invalid json?): ', e);
			}

		} catch (e) {
			// unable to read, so intialize that file
			// locales[locale] are already set in memory, so no extra read required
			// or locales[locale] are empty, which initializes an empty locale.json file
			this.writeFile(locale);
		}
	},

	// try writing a file in a created directory
	writeFile: function(locale) {
		// don't write new locale information to disk if we're not in dev mode
		if (!this.devMode) {
			// Initialize the locale if didn't exist already
			this.initLocale(locale, {});
		}

		// creating directory if necessary
		try {
			fs.lstatSync(this.directory);

		} catch (e) {
			if (this.devMode) {
				console.log('creating locales dir in: ' + this.directory);
			}

			fs.mkdirSync(this.directory, 0755);
		}

		// Initialize the locale if didn't exist already
		this.initLocale(locale, {});

		// writing to tmp and rename on success
		try {
			var target = this.locateFile(locale),
				tmp = target + ".tmp";

			fs.writeFileSync(tmp, JSON.stringify(
			this.locales[locale], null, "\t"), "utf8");

			if (fs.statSync(tmp).isFile()) {
				fs.renameSync(tmp, target);

			} else {
				console.error('unable to write locales to file (either ' + tmp +
					' or ' + target + ' are not writeable?): ');
			}

		} catch (e) {
			console.error('unexpected error writing files (either ' + tmp +
				' or ' + target + ' are not writeable?): ', e);
		}
	},

	// basic normalization of filepath
	locateFile: function(locale) {
		return path.normalize(this.directory + '/' + locale + this.extension);
	}
};tLocale;
		}

		return (this.locale = locale);
	},

	getLocale: function() {
		return this.locale;
	},

	isPreferredLocale: function() {
		return !this.prefLocale ||
			this.prefLocale === this.getLocale();
	},

	setLocaleFromQuery: function(req) {
		//console.log("i18n Query", req.path, req.query, this.query);
		req = req || this.request;

		if (!req || !req.query || !req.query.lang) {
			return;
		}

		var locale = req.query.lang.toLowerCase();

		if (this.locales[locale]) {
			if (this.devMode) {
				console.log("Overriding locale from query: " + locale);
			}

			this.setLocale(locale);
		}
	},

	setLocaleFromSubdomain: function(req) {
		//console.log("i18n subdomain", req.headers.host, this.subdomain);
		req = req || this.request;

		if (!req || !req.headers || !req.headers.host) {
			return;
		}

		if (/^([^.]+)/.test(req.headers.host) && this.locales[RegExp.$1]) {
			if (this.devMode) {
				console.log("Overriding locale from host: " + RegExp.$1);
			}

			this.setLocale(RegExp.$1);
		}
	},

	// locale in the beginning of the path like: http://suuper.com/en-GB/drill/down/path-to-the-end
	setLocaleFromPath: function(req) {
		//console.log("i18n path", req.path, req.query, req.query.lang, this.request.subdomain, this.request.query);

		req = req || this.request;

		if (!req || !req.path) {
			return;
		}

		// match locale according to: http://www.ietf.org/rfc/rfc1766.txt  (caseinsensitive)
		if (/^\/([a-z]{2}(?:-(?:[A-Z]{2}))*)\//i.test(req.path) && this.locales[RegExp.$1]) {
			if (this.devMode) {
				console.log("Overriding locale from host: " + RegExp.$1);
			}

			this.setLocale(RegExp.$1);
		}
	},

  setLocaleFromCookie: function(req) {
    req = req || this.request;

    if (!req || !req.cookies || !this.cookiename || !req.cookies[this.cookiename]) {
      return;
    }

    var locale = req.cookies[this.cookiename].toLowerCase();

    if (this.locales[locale]) {
      if (this.devMode) {
        console.log("Overriding locale from cookie: " + locale);
      }

      this.setLocale(locale);
    }
  },



	preferredLocale: function(req) {
		req = req || this.request;

		if (!req || !req.headers) {
			return;
		}

		var accept = req.headers["accept-language"] || "",
			self = this,
			prefLocale = false;

		console.log("accept-language", accept, self.locales, this.defaultLocale);

		// first check with the full locale like `de-CH` or `en-GB
		(accept.match(/([a-z]{2}(?:-(?:[A-Z]{2}))*)/ig) || []).forEach(function(locale) {
			console.log("ACCEPT NEW", locale) 
			if (!prefLocale && self.locales[locale]) {
				prefLocale = locale;
			}
		});
		if (prefLocale) return prefLocale;

		// if the locale was not found, fall back to the short one like `de` or `en`
		(accept.match(/([a-z]{2})/g) || []).forEach(function(locale) {
			console.log("ACCEPT", locale)
			if (!prefLocale && self.locales[locale]) {
				prefLocale = locale;
			}
		});

		// if the locale wasn't found at all, return the default locale
		return prefLocale || this.defaultLocale;
	},

	// read locale file, translate a msg and write to fs if new
	translate: function(locale, singular, plural) {
		if (!locale || !this.locales[locale]) {
			if (this.devMode) {
				console.warn("WARN: No locale found. Using the default (" +
					this.defaultLocale + ") as current locale");
			}

			locale = this.defaultLocale;

			this.initLocale(locale, {});
		}

		if (!this.locales[locale][singular]) {
			this.locales[locale][singular] = plural ?
				{ one: singular, other: plural } :
				singular;

			if (this.devMode) {
				this.writeFile(locale);
			}
		}

		return this.locales[locale][singular];
	},

	// try reading a file
	readFile: function(locale) {
		var file = this.locateFile(locale);

		if (!this.devMode && i18n.localeCache[file]) {
			this.initLocale(locale, i18n.localeCache[file]);
			return;
		}

		try {
			var localeFile = fs.readFileSync(file);

			try {
				// parsing filecontents to locales[locale]
				this.initLocale(locale, JSON.parse(localeFile));

			} catch (e) {
				console.error('unable to parse locales from file (maybe ' + file +
					' is empty or invalid json?): ', e);
			}

		} catch (e) {
			// unable to read, so intialize that file
			// locales[locale] are already set in memory, so no extra read required
			// or locales[locale] are empty, which initializes an empty locale.json file
			this.writeFile(locale);
		}
	},

	// try writing a file in a created directory
	writeFile: function(locale) {
		// don't write new locale information to disk if we're not in dev mode
		if (!this.devMode) {
			// Initialize the locale if didn't exist already
			this.initLocale(locale, {});
		}

		// creating directory if necessary
		try {
			fs.lstatSync(this.directory);

		} catch (e) {
			if (this.devMode) {
				console.log('creating locales dir in: ' + this.directory);
			}

			fs.mkdirSync(this.directory, 0755);
		}

		// Initialize the locale if didn't exist already
		this.initLocale(locale, {});

		// writing to tmp and rename on success
		try {
			var target = this.locateFile(locale),
				tmp = target + ".tmp";

			fs.writeFileSync(tmp, JSON.stringify(
				this.locales[locale], null, "\t"), "utf8");

			if (fs.statSync(tmp).isFile()) {
				fs.renameSync(tmp, target);

			} else {
				console.error('unable to write locales to file (either ' + tmp +
					' or ' + target + ' are not writeable?): ');
			}

		} catch (e) {
			console.error('unexpected error writing files (either ' + tmp +
				' or ' + target + ' are not writeable?): ', e);
		}
	},

	// basic normalization of filepath
	locateFile: function(locale) {
		return path.normalize(this.directory + '/' + locale + this.extension);
	},

	initLocale: function(locale, data) {
		if (!this.locales[locale]) {
			this.locales[locale] = data;

			// Only cache the files when we're not in dev mode
			if (!this.devMode) {
			    var file = this.locateFile(locale);
				if ( !i18n.localeCache[file] ) {
			    	i18n.localeCache[file] = data;
				}
			}
		}
	}
};
