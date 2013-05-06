/**
 * Stragety =  path
 * example: `http://localhost:3000/de-CH/rest/of/the/path` or `http://suuper.com/en/path-to-the-end`
 * in this case the locale would be `de-CH` or `en`
 */
exports.name = 'path';

/**
 * gets the locale from the given strategy
 *
 * @param {Object} req    connect / express request object
 * @return {String|false}     Locale if the locale was found with the given strategy, otherwise false.
 */
exports.getLocaleFrom = function(req) {
	if (!req || !req.path) return false;

	// match locale according to: http://www.ietf.org/rfc/rfc1766.txt  (caseinsensitive)
	if (/^\/([a-z]{2}(?:-(?:[A-Z]{2}))*)\//i.test(req.path)) {
		var locale = RegExp.$1;
		return locale;
	}
	return false;
}

/**
 * Stores the locale to the given strategy.
 * Note: not all strategies have to implement this. Most likely this is suitable for cookie or session strategy.
 *
 * @param {Object} req    connect / express request object
 * @param {String} locale the locale like `en` or `de-CH`
 * @return {Boolean}        true if stored sucessfully, otherwise false
 */
exports.storeLocaleTo = function(req, res, locale) {
	console.error("i18n path strategy. function storeLocaleTo not implemented");
}

