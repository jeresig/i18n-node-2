/**
 * @author 	Andi Neck <andi.neck@intesso.com>
 * @author  John Resig <jeresig@gmail.com>
 * @author  Originally by Marcus Spiegel <marcus.spiegel@gmail.com>
 * @link    https://github.com/intesso/loc
 * @license http://opensource.org/licenses/MIT
 *
 */

/**
 * dependencies
 */
var vsprintf = require('sprintf').vsprintf,
	utils = require('./utils'),
	debug = utils.debug;

/**
 * Expose `Translation`.
 */
exports = module.exports = Translation;

/**
 * Translation constructor function
 * @param {Object} options
 */

function Translation(i18n, req, res) {
	var self = this;
	this.i18n = i18n;

	if(!req || !res) return this;

	this.applyLocaleStrategy(req, res);

	if (res.locals) {
		this.registerMethods(res.locals, req);
	}
	return this;
};


exports.pathRewrite = function(i18n) {
	var path = i18n.strategies['path'];
	// problematic are static assets and url's that start with one to three letters in the path like /p/, /js/ or /img/
	this.excludeList = this.excludeList || ['.css', '.js', '.ico', '/img/', '/css/', '/js/', '/rss/', '/api/'];

	return function pathRewrite(req, res, next) {
		debug('pathRewriteMiddleware', req.url, res.locals.getLocale());
		var url = req.url
		if (!url || !res.locals || !res.locals.getLocale) return next();
		if (!utils.acceptsHtmlExplicit(req) || utils.isExcluded(url, i18n.excludeList)) return next();
		debug('pathRewriteMiddleware pattern', path.pattern, url, path.pattern.test(url))
		// extract the locale segment from the url if it is stored in the path
		if (path.pattern.test(url)) {
			req.url = url.replace(RegExp.$1 + '/', '');
			debug('locale: ' + res.locals.getLocale());
		}
		debug('pathRewriteMiddleware AFTER', url, req.url)
		next();
	}
};

Translation.prototype.applyLocaleStrategy = function(req, res) {
	// Set the locale to the prefered locale (acceptedLanguage) of the user
	this.setPreferredLocale(req);

	if (req && req.accepts('html') && this.i18n.getLocaleFrom) {
		var locale;
		// getLocaleFrom
		var from = this.i18n.getLocaleFrom;
		for (var i = 0; i < from.length; i++) {
			var strategy = this.getStrategy(from[i]);
			if (!strategy.getLocaleFrom) {
				debug('strategy not valid, function getLocaleFrom is missing.', strategy);
				continue;
			}
			locale = strategy.getLocaleFrom(req);
			if (locale) break;
		}

		// storeLocaleTo
		if (locale) {
			this.setLocale(locale);
			var to = this.i18n.storeLocaleTo;
			for (var i = 0; i < to.length; i++) {
				var strategy = this.getStrategy(to[i]);
				if (!strategy.storeLocaleTo) {
					debug('strategy not valid, function storeLocaleTo is missing.', strategy);
					continue;
				}
				locale = strategy.storeLocaleTo(req, res, locale);
				if (locale) break;
			}
		}
	}
	if (!this.locale) this.setLocale(this.preferredLocale);
};

Translation.prototype.registerMethods = function(helpers, req) {
	var self = this;
	this.i18n.resMethods.forEach(function(method) {
		helpers[method] = self[method].bind(self);
	});
	return helpers;
};

Translation.prototype.t =
Translation.prototype.__ = function() {
	var msg = this.translate(this.locale, arguments[0], undefined, true);
	if (arguments.length > 1) {
		msg = vsprintf(msg, Array.prototype.slice.call(arguments, 1));
	}
	return msg;
};

Translation.prototype.tn =
Translation.prototype.__n = function(singular, plural, count) {
	var msg = this.translate(this.locale, singular, plural, true);
	msg = vsprintf(parseInt(count, 10) > 1 ? msg.other : msg.one, [count]);
	if (arguments.length > 3) {
		msg = vsprintf(msg, Array.prototype.slice.call(arguments, 3));
	}
	return msg;
};

// find exact locale
Translation.prototype.findLocale = function(locale) {
	if (!locale) return false;
	locale = locale.toLowerCase();
	if (this.i18n.localeCache[locale]) {
		return locale;
	}
	return false;
};

// find locale or the sublocale e.g. en-GB -> finds en-GB but also en if available (incremental fallback)
Translation.prototype.findSubLocale = function(locale) {
	if (!locale) return false;
	var primary = this.findLocale(locale);
	if (primary) return primary;
	return this.getSubLocale(locale);
};

// find the sublocale e.g. en-GB -> finds en if available (incremental fallback)
Translation.prototype.getSubLocale = function(locale) {
	if (!locale) return false;
	var foundLocale = false;
	while (~locale.indexOf('-')) {
		var index = locale.lastIndexOf('-');
		locale = locale.substring(0, index);
		foundLocale = this.findLocale(locale);
		if (foundLocale) break;
	}
	return foundLocale;
};

// find the closest locale. 
// first try the exact one,
// then try the sub locale,
// otherwise do the same for the preferredLocales (acceptedLanguages) of the user.
Translation.prototype.findClosestLocale = function(locale) {
	if (!locale) return false;
	var translation = this.findSubLocale(locale);
	if (translation) return translation;
	for (var i = 0; this.preferredLocales.length; i++) {
		var closest = this.preferredLocales[i];
		var translation = this.findSubLocale(closest);
		if (translation) return translation;
	}
	return this.i18n.defaultLocale;
};

Translation.prototype.setLocale = function(locale) {
	if (!locale) return false;
	this.locale = this.findClosestLocale(locale);
	debug('setLocale', this.locale, locale);
},

Translation.prototype.getLocale = function() {
	return this.locale;
};

Translation.prototype.setPreferredLocale = function(req) {
	if (!req || !req.acceptedLanguages) return;
	var acceptedLanguages = this.preferredLocales = req.acceptedLanguages;

	if (!acceptedLanguages || !acceptedLanguages.length || acceptedLanguages.length < 1) return;
	this.preferredLocale = acceptedLanguages[0];
};

Translation.prototype.isPreferredLocale = function() {
	return !this.preferredLocale || this.preferredLocale === this.getLocale();
};

// read locale file, translate a msg and write to fs if new
Translation.prototype.translate = function(locale, singular, plural, insert) {
	var self = this;
	var localeCache = this.i18n.localeCache;
	if (!locale || !localeCache[locale]) {
		locale = this.findClosestLocale(locale);
		//localeCache[locale] = localeCache[locale] || {};
		debug('WARN: No locale definition found. Using the locale (' + locale + ') as current locale');
	}

	var context = utils.extractContext(singular);
	var key = utils.extractKey(singular);
	var sublocale = locale;
	var keyPath, obj;

	// find the translation with locale fallback
	while (true) {
		var keyPath = utils.getKeyPath(sublocale, singular);
		var obj = utils.getObj(localeCache, keyPath);
		if (obj) break;
		sublocale = this.getSubLocale(sublocale);
		if (!sublocale) break;
	}

	if (!obj && insert) {
		var val = plural ? {
			one: key,
			other: plural
		} : key;

		keyPath = utils.getKeyPath(locale, singular);
		utils.setObj(localeCache, keyPath, val);

		// write locale due to new locale entry
		if (this.i18n.devMode) {
			debug("Mr Write", locale, context, val);
			this.i18n.write(locale, context, val);
		}

		debug('INFO: added new locale definition entry', locale, keyPath, obj);
	}

	return obj;
};

Translation.prototype.getStrategy = function(strategy) {
	var defaultStrategy = {
		name: 'default',
		getLocaleFrom: function(req) {
			return false;
		},
		storeLocaleTo: function(req, locale) {
			debug('I18n default strategy. function storeLocaleTo not implemented');
		}
	}
	// try loading the strategy
	try {
		var loaded = utils.getDependency(this.i18n.strategies, strategy);
		if (loaded.fieldname && this.i18n.fieldname) loaded.fieldname = this.i18n.fieldname;
		return loaded;
	} catch (err) {
		debug('strategy could not be loaded', strategy);
		return defaultStrategy;
	}
};