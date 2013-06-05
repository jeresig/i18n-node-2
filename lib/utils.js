/**
 * Checks if 'html' is part of the request header.
 * @param  {Object} req   Express / Connect Request Object
 * @return {Boolean}      true, if the term 'html' was found in the request header.
 */
exports.acceptsHtmlExplicit = function(req) {
  var accept = req.headers["accept"];
  if (!accept) return false;
  return (~accept.indexOf("html"));
}

/**
 * Checks whether the term 'str' contains a term that is in the 'excludeList'.
 * @param  {String} str         Term to search in.
 * @param  {Array} excludeList  The exclude list array.
 * @return {Boolean}            true if at least one of the 'excludeList' terms was found inside 'str'.
 */
exports.isExcluded = function(str, excludeList) {
  var excluded = false;
  if (!str) return true;
  excludeList.forEach(function(exclude) {
    if (~str.indexOf(exclude)) {
      excluded = true;
    }
  });
  return excluded;
}

/**
 * Load the dependency scripts from the file system.
 * @param  {Object} dependencies [optional: Dependency object]
 * @param  {String} type         dependency type
 * @return {Object}              dependencies lookup Object.
 */
exports.loadDependencies = function(dependencies, type) {
  if (!type) type = dependencies, dependencies = {};
  var fs = require('fs');
  fs.readdirSync(__dirname + '/' + type).forEach(function(filename) {
    if (!/\.js$/.test(filename)) return;
    var name = filename.replace('.js', '');
    dependencies[name] = require('./' + type + '/' + name);
  });
  return dependencies;
}


/**
 * Gets the dependency.
 * First looks it up in the `dependencies` Object.
 * Then tries to require the `dependency` String.
 * Then check if the `dependency` is a valid dependency Object.
 * If all of the checks fail, throws an error.
 *
 * @param  {Object}         dependencies dependencies lookup Object
 * @param  {String|Object}  dependency   String:path to the dependency  | or Object:the external dependency
 * @return {Object}         the dependency Object, or throws an error.
 */
exports.getDependency = function(dependencies, dependency) {
  var loaded;
  if (typeof dependency == 'string') {
    // try load built in dependency
    loaded = dependencies[dependency];
    if (loaded) return loaded;

    // try require the dependency
    try {
      loaded = require(dependency);
      dependencies[loaded.name] = loaded;
      return loaded;
    } catch (err) {
      throw new('dependency could not be loaded' + err);
    }
  } else if (dependency.name) {
    dependencies[dependency.name] = dependency;
    return dependency;
  }
  throw new('dependency could not be loaded' + err);
};

exports.languagePattern = '([a-zA-Z]{1,3}(?:-(?:[a-zA-Z0-9]{2,8}))*)';

/**
 * Extracts the context out of the translation key 'str'.
 * E.g.: url/sitewide -> returns: url/
 * @param  {String} str The translation key
 * @return {String}     The extracted context.
 */
exports.extractContext = function(str) {
  var index = str.lastIndexOf('/');
  str = str.substr(0, index + 1);
  if (str == '') str = '/';
  return str;
}
/**
 * Extracts the key out of the translation key 'str'.
 * E.g.: url/sitewide -> returns: sitewide
 * @param  {String} str The translation key
 * @return {String}     The extracted key.
 */
exports.extractKey = function(str) {
  var index = str.lastIndexOf('/');
  return str.substr(index + 1);
}

/**
 * Returns the key path to lookup in the 'localeCache'.
 * It converts e.g.
 * locale=de-ch
 * context=url/client/title
 * -> to:
 * de-ch.url.client./.title
 *
 * @param  {String} locale  The locale string: e.g. en or en-GB
 * @param  {String} context The context e.g. url/client/ or context combined with the key. e.g. url/client/title
 * @param  {String} key     Optional: key. e.g. title
 * @return {String}         The converted string for the localeCache lookup. E.g.: de-ch.url.client./.title
 */
exports.getKeyPath = function(locale, context, key) {
  var keyString = key ? '.' + Key : '';
  return locale + exports.ctxToQueryString(context) + keyString;
}

exports.ctxToQueryString = function(ctx) {
  var index = ctx.lastIndexOf('/');
  ctx = ctx.replace('/', '.');
  ctx = ctx.substr(0, index) + './.' + ctx.substr(index + 1);
  if (ctx.charAt(0) != '.') ctx = '.' + ctx; // add dot in the beginning
  if (ctx.charAt(ctx.length - 1) == '.') ctx = ctx.substr(0, ctx.length - 1); // remove dot in the end
  return ctx;
}

/**
 * @see: http://stackoverflow.com/questions/6491463/accessing-nested-javascript-objects-with-string-key.
 * @param  {Object} o The Object to query
 * @param  {String} s The String query like: 'part3[0].name'
 * @return {Object}   The search result according to the query(s) on the object(o).
 */
exports.queryObj = function(o, s) {
  s = s.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
  s = s.replace(/^\./, ''); // strip a leading dot
  var a = s.split('.');
  while (a.length) {
    var n = a.shift();
    if (n in o) {
      o = o[n];
    } else {
      return;
    }
  }
  return o;
}

/**
 * @see: http://stackoverflow.com/questions/5484673/javascript-how-to-dynamically-create-nested-objects-using-object-names-given-by
 * @param  {Object} o               Object to query.
 * @param  {Object|String} keyPath  The Key path on the object(o) to set the value on. e.g. 'a.b.c' or ['a', 'b', 'c']
 * @return {Boolean}                true, if the object exists, else false.
 */
exports.existsObj = function(o, keyPath) {
  if ('string' == typeof keyPath) keyPath = keyPath.split('.');
  for (var i = 0; i < keyPath.length; i++) {
    key = keyPath[i];
    if (!(key in o)) return false;
    o = o[key];
  }
  return true;
}

/**
 * @see: http://stackoverflow.com/questions/5484673/javascript-how-to-dynamically-create-nested-objects-using-object-names-given-by
 * @param  {Object} o               Object to query.
 * @param  {Object|String} keyPath  The Key path on the object(o) to set the value on. e.g. 'a.b.c' or ['a', 'b', 'c']
 * @return {Boolean}                true, if the object exists, else false.
 */
exports.getObj = function(o, keyPath) {
  if ('string' == typeof keyPath) keyPath = keyPath.split('.');
  for (var i = 0; i < keyPath.length; i++) {
    key = keyPath[i];
    if (!(key in o)) return false;
    o = o[key];
  }
  return o;
}

/**
 * @see: http://stackoverflow.com/questions/5484673/javascript-how-to-dynamically-create-nested-objects-using-object-names-given-by
 * @param  {Object} o               Object to assign something.
 * @param  {Object|String} keyPath  The Key path on the object(o) to set the value on. e.g. 'a.b.c' or ['a', 'b', 'c']
 * @param  {Object} value           Any value to set on the Object(o) with the given path(keyPath)
 * @return {Object}                 Returns the value.
 */
exports.setObj = function(o, keyPath, value) {
  if ('string' == typeof keyPath) keyPath = keyPath.split('.');
  lastKeyIndex = keyPath.length - 1;
  for (var i = 0; i < lastKeyIndex; i++) {
    key = keyPath[i];
    if (!(key in o)) o[key] = {}
    o = o[key];
  }
  o[keyPath[lastKeyIndex]] = value;
  return value;
}

exports.contextExists = function(localeCache, locale, context) {
  var query = exports.getKeyPath(locale, context);
  return exports.existsObj(localeCache, query);
}

/**
 * debug function for development log outputs.
 * usage e.g. NODE_DEBUG='i18n http' node app.js
 * @param  {String} x Message
 */
if (process.env.NODE_DEBUG && /i18n/.test(process.env.NODE_DEBUG)) {
  exports.debug = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift('i18n: %s')
    console.error.apply(this, args);
  };
} else {
  exports.debug = function() {};
}

/**
 * Merge object b with object a.
 *
 *     var a = { foo: 'bar' }
 *       , b = { bar: 'baz' };
 *
 *     utils.merge(a, b);
 *     // => { foo: 'bar', bar: 'baz' }
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object}
 * @api private
 */
exports.merge = function(a, b) {
  if (a && b) {
    for (var key in b) {
      a[key] = b[key];
    }
  }
  return a;
};
