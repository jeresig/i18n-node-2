/**
 * Stragety =  session
 * gets and stores the locale to the requests session.
 */
exports.name = 'session';

var name = 'lang';

/**
 * gets the locale from the given strategy
 *
 * @param {Object} req    connect / express request object
 * @return {String|false}     Locale if the locale was found with the given strategy, otherwise false.
 */
exports.getLocaleFrom = function(req) {
	if (!req || !req.session || !req.session[name]) return false;

	var locale = req.session[name];
	console.log("sess get", locale);
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
	if (!req || !locale) return false;
	if (!req.session) req.session = {};
	req.session[name] = locale;
	console.log("sess store", locale);
	return locale;
}