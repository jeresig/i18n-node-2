// example localization initialization

module.exports = function(app) {
  var loc = require('../../index')({
    // it gets the locale from the following strategies in this order.
    // if the locale is not part of the `path`it looks it up in the `query` ect.
    getLocaleFrom: ['path', 'query', 'subdomain', 'cookie'],

    // if the locale was found in one of the strategies above, it stores it with this strategy.
    // in this case in the `cookie`
    storeLocaleTo: ['cookie'],

    // the locale definitions (translations) are retrieved from `file`.
    storage: 'file',

    // the following locales are supported (optional). 
    // If this option is omitted, it accetps what ever is defined in the definitions.
    locales: ['de', 'de-ch', 'en', 'en-GB', 'en-us'],

    // locale definition director
    directory: "./locales",

    // locale definition file extension
    extension: ".json",

    // Exclude List for the path rewrite middleware used for the path strategy. 
    // problematic are static assets and url's that start with one to three letters in the path like:
    // /p/, /js/ or /img/ and should therefore be excluded.
    excludeList: [".css", ".js", '.ico', '/api/', '/img/', '/css/', '/js/']
  });

  // adds all middlewares as bundle
  //loc.bind(app);
  //or add them separately

  // adds the loc middleware. adds the req.i18n object.
  app.use(loc.loc());

  // adds the locPathRewrite middleware used for the `path` strategy.
  // it redirects the request to the url without the locale in the path. e.g. `/en-GB/about` to `/about` 
  app.use(loc.pathRewrite());

  // adds the urlTranslation middleware
  app.use(loc.urlTranslation());

  // print out localeCache for debugging purposes 
  loc.writeLocaleCache();
  return loc;
}