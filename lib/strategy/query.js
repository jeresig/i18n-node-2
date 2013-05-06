/**
 * Stragety =  query
 * example: `http://localhost:3000?lang=de-CH` or `http://suuper.com?query=true&lang=en`
 * in this case the locale would be `de-CH` or `en`
 */
exports.name = 'query';

/**
 * gets the locale from the given strategy
 *
 * @param {Object} req    connect / express request object
 * @return {String|false}     Locale if the locale was found with the given strategy, otherwise false.
 */
exports.getLocaleFrom = function(req) {
	if (!req || !req.query || !req.query.lang) return false;

	var locale = req.query.lang;
	return locale;
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
	console.error("i18n query strategy. function storeLocaleTo not implemented");
}