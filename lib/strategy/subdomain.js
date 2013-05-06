/**
 * Stragety =  subdomain
 * example: `http://de-CH.test.localhost:3000/rest/of/the/path` or `http://en.suuper.com/path-to-the-end`
 * in this case the locale would be `de-CH` or `en`
 */
exports.name = 'subdomain';

/**
 * gets the locale from the given strategy
 *
 * @param {Object} req    connect / express request object
 * @return {String|false}     Locale if the locale was found with the given strategy, otherwise false.
 */
exports.getLocaleFrom = function(req) {
	if (!req || !req.headers || !req.headers.host) return false;

	// match the first subdomain
	if (/^([a-z]{2}(?:-(?:[A-Z]{2}))*)(?=\.)/ig.test(req.headers.host)) {
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
	console.error("i18n subdomain strategy. function storeLocaleTo not implemented");
}