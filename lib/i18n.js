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
	path = require("path"),
	utils = require("./utils");

/**
 * Auto-load bundled strategies.
 */

var strategies = {};
fs.readdirSync(__dirname + '/strategy').forEach(function(filename) {
	if (!/\.js$/.test(filename)) return;
	var name = filename.replace('.js', '');
	strategies[name] = require('./strategy/' + name);
});

/**
 * Auto-load bundled storages.
 */

var storages = {};
fs.readdirSync(__dirname + '/storage').forEach(function(filename) {
	if (!/\.js$/.test(filename)) return;
	var name = filename.replace('.js', '');
	storages[name] = require('./storage/' + name);
});



var i18n = module.exports = function(opt) {
	var self = this;

	// Put into dev or production mode
	this.devMode = false; // TODO process.env.NODE_ENV !== "production";

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

		// set the defaultLocale (first element of the locales option array)
		this.defaultLocale = opt.locales[0].toLowerCase();
		if (!this.locales[this.defaultLocale]) {
			console.error("Not a valid default locale.");
		}
	}

	// Set the locale to the prefered locale (acceptedLanguage) of the user
	this.setPreferredLocale(this.request);


	if (this.request && this.request.accepts('html') && this.getLocaleFrom) {
		var locale;

		// getLocaleFrom
		var from = this.getLocaleFrom;
		for (var i = 0; i < from.length; i++) {
			strategy = this.loadStrategy(from[i]);
			if (!strategy.getLocaleFrom) {
				console.error("strategy not valid, function getLocaleFrom is missing.", strategy);
				continue;
			}
			locale = strategy.getLocaleFrom(this.request);
			if (locale) break;
		}

		// storeLocaleTo
		if (locale) {
			this.setLocale(locale);
			var to = this.storeLocaleTo;
			for (var i = 0; i < to.length; i++) {
				strategy = this.loadStrategy(to[i]);
				if (!strategy.storeLocaleTo) {
					console.error("strategy not valid, function storeLocaleTo is missing.", strategy);
					continue;
				}
				locale = strategy.storeLocaleTo(this.request, this.response, locale);
				if (locale) break;
			}
		}

	}

	if (!this.locale) this.setLocale(this.preferredLocale);
	// console.log("this.preferredLocale", this.preferredLocale, this.locale);
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
		opt.response = res;
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
	console.log("pathMiddleware init", opt.getLocaleFrom.join(' '));

	if (opt && opt.getLocaleFrom && ~opt.getLocaleFrom.join(' ').indexOf('path')) {
		console.log("ready for takeoff")
		app.use(i18n.pathRewriteMiddleware);
	}
};

i18n.pathRewriteMiddleware = function(req, res, next) {
	console.log("pathRewriteMiddleware", req.url);
	var url = req.url
	if (!url || !req.i18n) return next();
	if(!utils.acceptsHtmlExplicit(req)) return next();

	// extract the locale segment from the url if it is stored in the path

	if (/^\/([a-z]{2}(?:-(?:[A-Z]{2}))*)\//i.test(url)) { // && req.i18n.locales[RegExp.$1]
		req.url = url.replace(RegExp.$1 + '/', '');
		console.log('locale: ' + req.i18n.getLocale());
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

	loadStrategy: function(strategy) {
		var defaultStrategy = {
			name: 'default',
			getLocaleFrom: function(req) {
				return false;
			},
			storeLocaleTo: function(req, locale) {
				console.error("i18n default strategy. function storeLocaleTo not implemented");
			}
		}

		var loaded;

		if (typeof strategy == 'string') {
			// try load built in strategy
			loaded = strategies[strategy];
			if (loaded) return loaded;

			// try require the strategy
			try {
				loaded = require(strategy);
				// store the loaded stategy into the strategies array
				strategies[loaded.name] = loaded;
				return loaded;
			} catch (err) {
				console.error("strategy could not be loaded", strategy);
				return defaultStrategy;
			}
		} else if (strategy.getLocaleFrom) {
			return strategy;
		}

		console.error("strategy could not be loaded", strategy);
		return defaultStrategy;
	},

	initLocale: function(locale, data) {
		if (!this.locales[locale]) {
			console.log("loc again", file);
			this.locales[locale] = data;

			// Only cache the files when we're not in dev mode
			if (!this.devMode) {
				var file = this.locateFile(locale);
				if (!i18n.localeCache[file]) {
					console.log("cache again", file);
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
		if (!req || !req.acceptedLanguages) return;
		var acceptedLanguages = this.preferredLocales = req.acceptedLanguages;

		if(!acceptedLanguages || !acceptedLanguages.length || acceptedLanguages.length < 1) return;
		this.preferredLocale = acceptedLanguages[0];
	},

	isPreferredLocale: function() {
		return !this.preferredLocale || this.preferredLocale === this.getLocale();
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
};