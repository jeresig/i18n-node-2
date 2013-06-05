/**
 * storage =  file
 *
 * reads and writes locale definitions from and to the file system resp. locale cache.
 * fileSystem <-> localeCache
 */

var mkdirp = require('mkdirp'),
	fs = require('fs'),
	p = require('path'),
	utils = require('../utils'),
	debug = require('../utils').debug;


exports.name = 'file';

/**
 * Returns an Array with all the existing locales in the storage.
 * @param  {String} path      The path or directory to the storage
 * @param  {String} extension Optional file extension like ".json"
 * @return {Array}           The locales Array
 */
exports.getLocales = function(path, extension) {
	var pattern = new RegExp('\\' + extension + '$'); // if (!/\.js$/.test(filename)) return;
	var tags = [];

	fs.readdirSync(path).forEach(function(filename) {
		if (!pattern.test(filename)) return;
		var name = filename.replace(extension, '');
		tags.push(name);
	});
	debug("tags", tags);
	return tags;
}


/**
 * Returns an Array with all the existing contexts in the storage.
 * @param  {String} path      				The path or directory to the storage
 * @return {Array}           					The contexts Array. E.g. [ '/', 'url/', 'url/cms/' ]
 */
exports.getContexts = function(path) {
	var contextSeparator = '/';
	var originalPath = path + contextSeparator;
	var ctx = [];
	ctx.push(contextSeparator);

	function recursiveContexts(path) {
		fs.readdirSync(path).forEach(function(dirname) {
			var dir = path + "/" + dirname;
			if (fs.statSync(dir).isDirectory()) {
				var context = dir.replace(originalPath, '');
				context = (context == contextSeparator) ? context : context + contextSeparator;
				ctx.push(context);
				recursiveContexts(dir);
			}
		});
		return ctx;
	}

	recursiveContexts(path);
	debug("ctx", ctx);
	return ctx;
}

/**
 * Reads the locale definition from the storage into the `localeCache`.
 * @param  {String} locale      	The locale like e.g. "de" or "en-us"
 * @param  {String} path      		The path or directory to the storage
 * @param  {String} context      	The locale definition context. e.g. url
 * @param  {Object} localeCache 	The locale definition cache object
 * @param  {String} extension 		Optional file extension like ".json"
 * @return {Boolean}             	`true`, if the operation was successful. Otherwise `false`
 */
exports.read = function(locale, path, context, localeCache, extension) {
	var file = p.normalize(path + p.sep + context + p.sep + locale + extension);

	try {
		var localeFile = fs.readFileSync(file);

		try {
			// parsing filecontents to localeCache[locale]
			if (!utils.contextExists(localeCache, locale, context)) {
				var obj = JSON.parse(localeFile);
				var keyPath = utils.getKeyPath(locale, context);
				utils.setObj(localeCache, keyPath, obj);
				debug("localeObj", locale, context, keyPath, obj);
			}

		} catch (e) {
			debug('unable to parse locales from file (maybe ' + file +
				' is empty or invalid json?): ', e);
			return false;
		}

	} catch (e) {
		return false;
	}
	return true;
};

/**
 * Writes (persist) the locale definition from the `localeCache` into the storage.
 * @param  {String} locale      	The locale like e.g. "de" or "en-us"
 * @param  {String} path      		The path or directory to the storage
 * @param  {String} context      	The locale definition context. e.g. url
 * @param  {Object} localeCache 	The locale definition cache object
 * @param  {String} extension 		Optional file extension like ".json"
 * @return {Boolean}             	`true`, if the operation was successful. Otherwise `false`
 */
var write = exports.write = function(locale, path, context, localeCache, extension) {
	var file = p.normalize(path + p.sep + context + p.sep + locale + extension);

	// create directory, if it does not exist
	var dir = p.dirname(file);
	if (!fs.existsSync(dir)) {
		debug('creating locales directory: ' + dir);
		mkdirp.sync(dir, 0755);
	}

	// writing to tmp and rename on success
	try {
		var keyPath = utils.getKeyPath(locale, context);
		var obj = utils.getObj(localeCache, keyPath);
		fs.writeFileSync(file, JSON.stringify(obj, null, '\t'), 'utf8');
	} catch (e) {
		debug('unexpected error writing files (is ' + file + ' not writeable?): ', e);
		return false;
	}
	return true;
};