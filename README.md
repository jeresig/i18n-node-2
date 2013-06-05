# loc

## Features
 * Full featured localization module for express.js
 * server side translation
 * Pluggable storages
 * Pluggable strategies like query, path, cookie ect.
 * Url Translation
 * Uses common __('...') syntax in app and templates
 * Support for plurals
 * Stores language files in json files compatible to [webtranslateit](http://webtranslateit.com/) json format
 * Adds new strings on-the-fly when first used in your app
 * Nested, hierarchical contexts, separated in different files
 * Uses the closest to the preferred user locale, if not set explicitely by the user request
 * Automatic fallback to more generic localization (http://www.rfc-editor.org/rfc/rfc4647.txt)
 * Support for locale names according to http://www.rfc-editor.org/rfc/bcp/bcp47.txt
 * No extra parsing needed.
 * Handles simultaneous requests with different locales correctly :-)

## Background
The module was originally developed by https://github.com/mashpie/i18n-node, then forked and refactored by https://github.com/jeresig/i18n-node-2. This is a serious refactoring of the latter. Reasons:
 * were not pluggable / extendable
 * not specific to express.js
 * complicated code
 * features missing: url translation, hierarchical contexts, locale fallback, preferred user locale, ...

## TODO
 * better description
 * more tests
 * client side translation / routes
 * import/export language definitions e.g. gettext

## Installation

Run the following:

	npm install loc

## Usage

### Load and Configure
In your app.js:

	// example localization initialization
	var i18n = require('loc')({
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
	  
	  // file extension
	  extension: ".json",

	  // Exclude List for the path rewrite middleware used for the path strategy.	
	  // problematic are static assets and url's that start with one to three letters in the path like:
	  // /p/, /js/ or /img/ and should therefore be excluded.
	  excludeList: [".css", ".js", '.ico', '/api/', '/img/', '/css/', '/js/']
	});

	// adds all middlewares as bundle
	//i18n.bind(app);
	//or add them separately

	// adds the loc middleware. adds the req.i18n object.
	app.use(i18n.loc());

	// adds the locPathRewrite middleware used for the `path` strategy.
	// it redirects the request to the url without the locale in the path. e.g. `/en-GB/about` to `/about` 
	app.use(i18n.pathRewrite());

	// adds the urlTranslation middleware
	app.use(i18n.urlTranslation());

	// print out localeCache for debugging purposes 
	i18n.writeLocaleCache();

### Inside Your Express View

	module.exports = {
		index: function(req, res) {
			req.render("index", {
				title: req.i18n.__("My Site Title"),
				desc: req.i18n.__("My Site Description")
			});
		}
	};

### Inside Your Templates: Swig example
	{% extends "page.swig" %}

	{% block content %}
	<h1>{{ __("Welcome to:") }} {{ title }}</h1>
	<p>{{ desc }}</p>
	{% endblock %}


### Inside Your Templates: ejs example
	<head>
	  <title><%=__("title") %></title>
	  ...

## loc API:

### `__(string, [...])`

Translates a string according to the current locale. Also supports sprintf syntax, allowing you to replace text, using the node-sprintf module.

For example:

	var greeting = i18n.__('Hello %s, how are you today?', 'Marcus');

this puts **Hello Marcus, how are you today?**. You might also add endless arguments or even nest it.

	var greeting = i18n.__('Hello %s, how are you today? How was your %s?', 
		'Marcus', i18n.__('weekend'));

which puts **Hello Marcus, how are you today? How was your weekend?**

You might even use dynamic variables. They get added to the current locale file if they do not yet exist.

	var greetings = ['Hi', 'Hello', 'Howdy'];
	for (var i = 0; i < greetings.length; i++) {
		console.log( i18n.__(greetings[i]) );
	};

which outputs:

	Hi
	Hello
	Howdy

### `__n(one, other, count, [...])`

Different plural forms are supported as a response to `count`:

	var singular = i18n.__n('%s cat', '%s cats', 1);
	var plural = i18n.__n('%s cat', '%s cats', 3);

this gives you **1 cat** and **3 cats**. As with `__(...)` these could be nested:

	var singular = i18n.__n('There is one monkey in the %%s', 'There are %d monkeys in the %%s', 1, 'tree');
	var plural = i18n.__n('There is one monkey in the %%s', 'There are %d monkeys in the %%s', 3, 'tree');

putting **There is one monkey in the tree** or **There are 3 monkeys in the tree**.

### `getLocale()`

Returns a string containing the current locale. If no locale has been specified then it default to the value specified in `defaultLocale`.

### `setLocale(locale)`

Sets a locale to the specified string. If the locale is unknown, the locale defaults to the one specified by `defaultLocale`. For example if you have locales of 'en' and 'de', and a `defaultLocale` of 'en', then call `.setLocale('ja')` it will be equivalent to calling `.setLocale('en')`.

### `isPreferredLocale()`

To be used with Express.js or another framework that provides a `request` object. This method works if a `request` option has been specified when the i18n object was instantiated.

This method returns true if the locale specified by `getLocale` matches a language desired by the browser's `Accept-language` header.

## Configuration

When you instantiate a new i18n object there are a few options that you can pass in. The only required option is `locales`.

### `locales`

You can pass in the locales in two ways: As an array of strings or as an object of objects. For example:

	locales: ['en', 'de']

This will set two locales (en and de) and read in the JSON contents of both translation files. (By default this is equal to "./locales/NAME.js", you can configure this by changing the `directory` and `extension` options.) Additionally when you pass in an array of locales the first locale is automatically set as the `defaultLocale`.

You can also pass in an object, like so:

	locales: {
		"en": {
			"Hello": "Hello"
		},
		"de": {
			"Hello": "Hallo"
		}
	}

In this particular case no files will ever be read when doing a translation. This is ideal if you are loading your translations from a different source. Note that no `defaultLocale` is set when you pass in an object, you'll need to set it yourself.

### `defaultLocale`

You can explicitly define a default locale to be used in cases where `.setLocale(locale)` is used with an unknown locale. For example if you have locales of 'en' and 'de', and a `defaultLocale` of 'en', then call `.setLocale('ja')` it will be equivalent to calling `.setLocale('en')`.

### `directory` and `extension`

These default to `"./locales"` and `".js"` accordingly. They are used for saving and reading the locale data files (see the `locales` option for more information on how this works).

When your server is in production mode it will read these files only once and then cache the result. It will not write any updated strings when in production mode.

When in development, or testing, mode the files will be read on every instantiation of the `i18n` object. Additionally newly-detected strings will be automatically added, and written out, to the locale JSON files.

A generated `en.js` inside `./locales/` may look something like:

	{
		"Hello": "Hello",
		"Hello %s, how are you today?": "Hello %s, how are you today?",
		"weekend": "weekend",
		"Hello %s, how are you today? How was your %s.": "Hello %s, how are you today? How was your %s.",
		"Hi": "Hi",
		"Howdy": "Howdy",
		"%s cat": {
			"one": "%s cat",
			"other": "%s cats"
		},
		"There is one monkey in the %%s": {
			"one": "There is one monkey in the %%s",
			"other": "There are %d monkeys in the %%s"
		},
		"tree": "tree"
	}

that file can be edited or just uploaded to [webtranslateit](http://docs.webtranslateit.com/file_formats/) for any kind of collaborative translation workflow.



## tests
run the tests with 

	mocha


## license

[MIT License](https://github.com/intesso/loc/blob/master/LICENSE)

