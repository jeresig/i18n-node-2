/**
 * @author  John Resig <jeresig@gmail.com>
 * @author  Originally by Marcus Spiegel <marcus.spiegel@gmail.com>
 * @link    https://github.com/jeresig/i18n-node
 * @license http://opensource.org/licenses/MIT
 *
 * @version 0.4.7
 */

// dependencies
const vsprintf = require("sprintf-js").vsprintf;
const fs = require("fs");
const path = require("path");
const debugLog = require('debug')('i18n-2:log');
const debugWarn = require('debug')('i18n-2:warn');
const debugError = require('debug')('i18n-2:err');

function dotNotation (obj, is, value) {
  if (Object.prototype.hasOwnProperty.call(obj, is)) {
    return obj[is];
  }

  if (typeof is === 'string') {
    return dotNotation(obj, is.split('.'), value);
  } else if (is.length === 1 && value !== undefined) {
    obj[is[0]] = value;
    return value;
  } else if (is.length === 0) {
    return obj;
  } else if (Object.prototype.hasOwnProperty.call(obj, is[0])) {
    return dotNotation(obj[is[0]], is.slice(1), value);
  } else {
    obj[is.join('.')] = is.join('.');
    return is.join('.');
  }
}

const i18n = function (opt) {
  const self = this;

  // Put into dev or production mode
  this.devMode = process.env.NODE_ENV !== "production";

  // Copy over options
  for (const prop in opt) {
    this[prop] = opt[prop];
  }

  // you may register helpers in global scope, up to you
  if (typeof this.register === "object") {
    i18n.resMethods.forEach((method) => {
      self.register[method] = self[method].bind(self);
    });
  }

  // implicitly read all locales
  // if it's an array of locale names, read in the data
  if (opt.locales && opt.locales.forEach) {
    this.locales = {};

    opt.locales.forEach((locale) => {
      self.readFile(locale);
    });

    this.defaultLocale = opt.defaultLocale || opt.locales[0];
  }

  // Set the locale to the default locale
  this.setLocale(this.defaultLocale);

  // Check the defaultLocale
  if (!this.locales[this.defaultLocale]) {
    debugError("Not a valid default locale.");
  }

  if (this.request) {

    this.prefLocale = this.preferredLocale();

    if (this.prefLocale !== false && this.prefLocale !== this.locale) {
      this.setLocale(this.prefLocale);
    }

    if (this.subdomain) {
      this.setLocaleFromSubdomain(this.request);
    }

    if (this.query !== false) {
      this.setLocaleFromQuery(this.request);
    }

    if (this.session !== false) {
      this.setLocaleFromSessionVar(this.request);
    }

  }
};

i18n.version = "0.4.7";
i18n.localeCache = {};
i18n.resMethods = ["__", "__n", "getLocale", "isPreferredLocale"];

i18n.expressBind = function (app, opt) {
  if (!app) {
    return;
  }

  app.use((req, res, next) => {
    opt.request = req;
    req.i18n = new i18n(opt);

    // Express 3
    if (res.locals) {
      i18n.registerMethods(res.locals, req);
    }

    next();
  });

  // Express 2
  if (app.dynamicHelpers) {
    app.dynamicHelpers(i18n.registerMethods({}));
  }
};

i18n.registerMethods = function (helpers, req) {
  i18n.resMethods.forEach((method) => {
    if (req) {
      helpers[method] = req.i18n[method].bind(req.i18n);
    } else {
      helpers[method] = function (reqhelper) {
        return reqhelper.i18n[method].bind(reqhelper.i18n);
      };
    }
  });
  return helpers;
};

i18n.prototype = {
  defaultLocale: "en",
  extension: ".json",
  directory: "./locales",
  queryName: "lang",
  cookieName: "lang",
  sessionVarName: "locale",
  indent: "\t",
  parse: JSON.parse,

  dump: function (data, indent) {
    return JSON.stringify(data, null, indent);
  },

  __: function (...args) {
    let msg = this.translate(this.locale, args[0]);

    if (args.length > 1) {
      msg = vsprintf(msg, Array.prototype.slice.call(args, 1));
    }
    return msg;
  },

  __n: function (pathOrSingular, countOrPlural, additionalOrCount) {
    let msg;
    if (typeof countOrPlural === 'number') {
      msg = this.translate(this.locale, pathOrSingular);
      msg = vsprintf(parseInt(countOrPlural, 10) > 1 ? msg.other : msg.one, Array.prototype.slice.call(arguments, 1));
    } else {
      msg = this.translate(this.locale, pathOrSingular, countOrPlural);
      msg = vsprintf(parseInt(additionalOrCount, 10) > 1 ? msg.other : msg.one, [additionalOrCount]);

      if (arguments.length > 3) {
        msg = vsprintf(msg, Array.prototype.slice.call(arguments, 3));
      }
    }

    return msg;
  },

  setLocale: function (locale) {

    if (!locale) return;

    let setlocale = locale;

    if (!this.locales[locale]) {
      if (this.devMode) {
        debugWarn("Locale (" + locale + ") not found.");
      }

      setlocale = this.defaultLocale;
    }
    this.locale = setlocale;

    return (setlocale);
  },

  getLocale: function () {
    return this.locale;
  },

  isPreferredLocale: function () {
    return !this.prefLocale || this.prefLocale === this.getLocale();
  },

  setLocaleFromSessionVar: function (req) {
    const varreq = req || this.request;

    if (!varreq || !varreq.session || !varreq.session[this.sessionVarName]) {
      return;
    }

    const locale = varreq.session[this.sessionVarName];

    if (this.locales[locale]) {
      if (this.devMode) {
        debugLog("Overriding locale from query: " + locale);
      }
      this.setLocale(locale);
    }
  },

  setLocaleFromQuery: function (req) {
    const varreq = req || this.request;

    if (!varreq || !varreq.query || !varreq.query[this.queryName]) {
      return;
    }

    const locale = (varreq.query[this.queryName] + '').toLowerCase();

    if (this.locales[locale]) {
      if (this.devMode) {
        debugLog("Overriding locale from query: " + locale);
      }
      this.setLocale(locale);
    }
  },

  setLocaleFromSubdomain: function (req) {
    const varreq = req || this.request;

    if (!varreq || !varreq.headers || !varreq.headers.host) {
      return;
    }

    if (/^([^.]+)/.test(varreq.headers.host) && this.locales[RegExp.$1]) {
      if (this.devMode) {
        debugLog("Overriding locale from host: " + RegExp.$1);
      }
      this.setLocale(RegExp.$1);
    }
  },

  setLocaleFromCookie: function (req) {
    const varreq = req || this.request;

    if (!varreq || !varreq.cookies || !this.cookieName || !varreq.cookies[this.cookieName]) {
      return;
    }

    const locale = varreq.cookies[this.cookieName].toLowerCase();

    if (this.locales[locale]) {
      if (this.devMode) {
        debugLog("Overriding locale from cookie: " + locale);
      }
      this.setLocale(locale);
    }
  },

  setLocaleFromEnvironmentVariable: function () {
    if (!process.env.LANG) {
      return;
    }
    const locale = process.env.LANG.split("_")[0];
    if (this.locales[locale]) {
      if (this.devMode) {
        debugLog("Overriding locale from environment variable: " + locale);
      }
      this.setLocale(locale);
    }
  },

  preferredLocale: function (req) {
    const varreq = req || this.request;

    if (!varreq || !varreq.headers) {
      return;
    }

    const accept = varreq.headers["accept-language"] || "";
    const regExp = /(^|,\s*)([a-z0-9-]+)/gi;
    const self = this;
    let prefLocale;

    const match = regExp.exec(accept);
    while (!prefLocale && (match)) {
      const locale = match[2].toLowerCase();
      const parts = locale.split("-");

      if (self.locales[locale]) {
        prefLocale = locale;
      } else if (parts.length > 1 && self.locales[parts[0]]) {
        prefLocale = parts[0];
      }
    }
    return prefLocale || this.defaultLocale;
  },


  // read locale file, translate a msg and write to fs if new
  translate: function (locale, singular, plural) {
    let translocale = locale;

    if (!locale || !this.locales[locale]) {
      if (this.devMode) {
        debugWarn("WARN: No locale found. Using the default (" + this.defaultLocale + ") as current locale");
      }

      translocale = this.defaultLocale;

      if ((this.devMode) && (fs.existsSync(this.locateFile(translocale)))) {
        throw new Error('Please correct potential parse errors in i18n JSON file ' + this.locateFile(translocale));
      }

      this.initLocale(translocale, {});
    }

    if (!this.locales[translocale][singular]) {
      if (this.devMode) {
        dotNotation(this.locales[translocale], singular, plural ? { one: singular, other: plural } : undefined);
        this.writeFile(translocale);
      }
    }

    return dotNotation(this.locales[translocale], singular, plural ? { one: singular, other: plural } : undefined);
  },

  // try reading a file
  readFile: function (locale) {

    const file = this.locateFile(locale);

    if (!this.devMode && i18n.localeCache[file]) {
      this.initLocale(locale, i18n.localeCache[file]);
      return;
    }

    try {
      const localeFile = fs.readFileSync(file);
      let base;

      // reading base file if 'base' provided
      if (typeof this.base === "function") {
        let baseFilename;

        try {
          baseFilename = this.base(locale);
        } catch (e) {
          debugError('base function threw exception for locale %s', locale, e);
        }

        if (typeof baseFilename === "string") {
          try {
            base = this.parse(fs.readFileSync(this.locateFile(baseFilename)));
          } catch (e) {
            debugError('unable to read or parse base file %s for locale %s', baseFilename, locale, e);
          }
        }
      }

      try {
        // parsing file content
        let content = this.parse(localeFile);

        if (base) {
        // writing content to the base and swapping
          for (const prop in content) {
            base[prop] = content[prop];
          }
          content = base;
        }

        // putting content to locales[locale]
        this.initLocale(locale, content);
      } catch (e) {
        debugError('unable to parse locales from file (maybe ' + file
        + ' is empty or invalid ' + this.extension + '?): ', e);
      }
    } catch (e) {
      // unable to read, so intialize that file
      // locales[locale] are already set in memory, so no extra read required
      // or locales[locale] are empty, which initializes an empty locale.json file
      if (!fs.existsSync(file)) {
        this.writeFile(locale);
      }
    }
  },

  // try writing a file in a created directory
  writeFile: function (locale) {
    // don't write new locale information to disk if we're not in dev mode
    if (!this.devMode) {
      // Initialize the locale if didn't exist already
      this.initLocale(locale, {});
      return;
    }

    // creating directory if necessary
    try {
      fs.lstatSync(this.directory);
    } catch (e) {
      if (this.devMode) {
        debugLog('creating locales dir in: ' + this.directory);
      }
      fs.mkdirSync(this.directory, 0o755);
    }

    // Initialize the locale if didn't exist already
    this.initLocale(locale, {});

    // writing to tmp and rename on success
    const target = this.locateFile(locale);
    const tmp = target + ".tmp";
    try {
      fs.writeFileSync(tmp, this.dump(this.locales[locale], this.indent), "utf8");

      if (fs.statSync(tmp).isFile()) {
        fs.renameSync(tmp, target);
      } else {
        debugError('unable to write locales to file (either ' + tmp + ' or ' + target + ' are not writeable?): ');
      }
    } catch (e) {
      debugError('unexpected error writing files (either ' + tmp + ' or ' + target + ' are not writeable?): ', e);
    }
  },

  // basic normalization of filepath
  locateFile: function (locale) {
    return path.normalize(this.directory + '/' + locale + this.extension);
  },

  initLocale: function (locale, data) {
    if (!this.locales[locale]) {
      this.locales[locale] = data;

      // Only cache the files when we're not in dev mode
      if (!this.devMode) {
        const file = this.locateFile(locale);
        if (!i18n.localeCache[file]) {
          i18n.localeCache[file] = data;
        }
      }
    }
  }
};

module.exports = i18n;
