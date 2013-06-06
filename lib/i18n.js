/**
 * dependencies
 */
var utils = require('./utils'),
	Translation = require('./translation'),
	debug = utils.debug;

/**
 * Auto-load bundled dependencies (plugins).
 */
I18n.prototype.strategies = utils.loadDependencies('strategy');
I18n.prototype.storages = utils.loadDependencies('storage');
I18n.prototype.storage = I18n.prototype.storages.file; //default storage: file


/**
 * module variables
 */
I18n.prototype.localeCache = {};
I18n.prototype.resMethods = ['t', 'tn', '__', '__n', 'getLocale', 'isPreferredLocale'];
I18n.prototype.defaultLocale = 'en';
I18n.prototype.extension = '.json';
I18n.prototype.directory = './locales';
I18n.prototype.tags;
I18n.prototype.ctx;

/**
 * Expose `I18n`.
 */
exports = module.exports = i18n;


function i18n(options) {
	return new I18n(options);
};

/**
 * I18n constructor function
 * @param {Object} options
 */

function I18n(options) {
	var self = this;
	options = options || {};

	// Put into dev or production mode
	I18n.prototype.devMode = process.env.NODE_ENV !== 'production';

	// Copy over options
	for (var prop in options) {
		I18n.prototype[prop] = options[prop];
	}

	debug("properties", this.excludeList, this.storage, this.locales);

	// get storage implementation
	if (options.storage) {
		this.storage = this.getStorage(options.storage);
	} else {
		this.storage = this.storages.file; // default storage: file
	}

	this.ctx = this.getContexts();

	// get defined locale this.tags
	this.tags = this.getLocales();
	debug("this.tags", this.tags);

	// cache all locale definitions
	if (self.tags && self.tags.length && self.tags.length > 0) {
		self.tags.forEach(function(locale) {
			self.ctx.forEach(function(context) {
				var keyPath = utils.getKeyPath(locale, context);
				if (!utils.existsObj(self.localeCache, keyPath)) {
					var success = self.storage.read(locale.toLowerCase(), self.directory, context, self.localeCache, self.extension);
					if (!success) {
						// unable to read, so create that definition
						self.write(locale, context);
					}
				}
			});
		});

		// set the this.defaultLocale (first element of the locales option array, if not set explicitely as option)
		if (!this.defaultLocale) {
			this.defaultLocale = this.tags[0].toLowerCase();
		}
		if (!this.localeCache[this.defaultLocale]) {
			debug('Not a valid default locale: ' + this.defaultLocale);
		}

	}
	debug("localeCache", JSON.stringify(this.localeCache));

	return this;
};

/**
 * i18n middleware bundle: it adds the init and the pathRewrite middleware.
 * It adds helper function middleware as well as path rewrite middleware when the 'path' strategy is selecte.
 * It also adds the functions defined in resMethods to the res.locals object. e.g. res.locals.getLocale()
 * @param  {Object} app     express instance
 */
I18n.prototype.bind = function(app) {
	var self = this;
	if (!app) {
		return;
	}

	app.use(this.loc());

	// request path rewrite middleware 
	if (this.getLocaleFrom && ~this.getLocaleFrom.join(' ').indexOf('path')) {
		app.use(this.pathRewrite());
	}

	app.use(this.urlTranslation());
};

/**
 * i18n Initialization middleware
 * @return {Object} Connect middleware
 */
I18n.prototype.loc = function() {
	var self = this;
	return function loc(req, res, next) {
		var translation = new Translation(self, req, res);
		req.i18n = translation;
		next();
	}
};

/**
 * i18n pathRewrite middleware for the path strategy.
 * @return {Object} Connect middleware
 */
I18n.prototype.pathRewrite = function() {
	var self = this;
	return Translation.pathRewrite(self);
};

I18n.prototype.urlTranslation = function() {
	var self = this;

	return function urlTranslation(req, res, next) {
		var translatedUrl = req.url;

		// split url segments
		var url = req.url.replace(/\//g, '.').replace(/\?/g, '.').replace(/\&/g, '.').replace(/\=/g, '.').replace(/\#/g, '.');
		var segments = url.split('.');
		var context = 'url/';
		debug('urlTranslation', url, req.i18n.locale, translatedUrl);
		
		// try translate each segment
		segments.forEach(function(segment) {
			var translation = req.i18n.translate(req.i18n.locale, context + segment);
			debug("segmentTranslation", req.i18n.locale, context + segment, translation);
			if (translation && 'string' == typeof translation) translatedUrl = translatedUrl.replace(segment, translation);
		})
		debug('urlTranslation after', translatedUrl);

		req.url = translatedUrl;
		next();
	}
};

I18n.prototype.getLocales = function() {
	if (this.tags && this.tags.forEach) return this.tags;
	if (this.locales && this.locales.forEach) return this.locales;
	return this.storage.getLocales(this.directory, this.extension);
};

I18n.prototype.getContexts = function() {
	var ctx;
	if (this.ctx && this.ctx.forEach) ctx = this.ctx;
	else if (this.contexts && this.contexts.forEach) ctx = this.contexts;
	else ctx = this.storage.getContexts(this.directory, this.contextSeparator);
	if (!ctx) ctx = [], ctx.push(this.contextSeparator);
	return ctx;
};

I18n.prototype.write = function(locale, context, value) {
	// write locale due to new locale entry
	if (this.devMode) {
		value = value || {};
		var keyPath = utils.getKeyPath(locale, context);

		if (!utils.existsObj(this.localeCache, keyPath)) {
			utils.setObj(this.localeCache, keyPath, value);
			debug("i18n.write.setObj", locale, context, keyPath);
		}
		debug("writeContext", locale, context, this.localeCache);
		this.storage.write(locale, this.directory, context, this.localeCache, this.extension);
	}
};

/**
 * Writes the locale definition from the `localeCache` to the file system for debugging.
 * This method is ment to be called from the application optionally for debug purposes.
 *
 * @param  {String} file   		The the file including the path to store the file. If it is not provided it defaults to localeDirectory/localeCache.json
 * @return {Boolean}             	`true`, if the operation was successful. Otherwise `false`
 */
I18n.prototype.writeLocaleCache = function(file) {
	var p = require('path'),
		fs = require('fs');

	file = file || this.directory + p.sep + 'localeCache' + this.extension;
	file = p.normalize(file);

	// create directory, if it does not exist
	var dir = p.dirname(file);
	if (!fs.existsSync(dir)) {
		debug('creating locales directory: ' + dir);
		mkdirp.sync(dir, 0755);
	}

	// writing to tmp and rename on success
	try {
		fs.writeFileSync(file, JSON.stringify(this.localeCache, null, '\t'), 'utf8');
	} catch (e) {
		debug('unexpected error writing localeCache (is ' + file + ' not writeable?): ', e);
		return false;
	}
	return true;
};

I18n.prototype.getStorage = function(storage) {
	// try loading the storage
	try {
		return utils.getDependency(this.storages, storage);
	} catch (err) {
		debug('storage could not be loaded', storage);
		// load the file storage (default)
		return utils.getDependency(this.storages, 'file');
	}
};