/**
 * Stragety =  cookie
 * gets and stores the locale to the response cookies.
 */
exports.name = 'cookie';

var cookiename = 'lang';

/**
 * gets the locale from the given strategy
 *
 * @param {Object} req    connect / express request object
 * @return {String|false}     Locale if the locale was found with the given strategy, otherwise false.
 */
exports.getLocaleFrom = function(req) {
	if (!req || !req.cookies || !req.cookies[cookiename]) return false;

	var locale = req.cookies[cookiename];
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
	if (!req || !res || !locale) return false;
	res.cookie(cookiename, locale);
	return locale;
}