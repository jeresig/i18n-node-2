// setup server
var app = require('./fixtures/app');
var ejs = require('ejs');
var Translation = require('../lib/translation');

// setup loc
var loc = require('../index')();

// test that the cookie is set
app.use(function(req, res, next) {
  next();
  var cookies = res.get('Set-Cookie');
  assert(~cookies.indexOf('lang='));
})

// route
app.get('/test', function(req, res) {
  var html = '<html><head></head><body><p><%=__("Hello") %></p></body></html>';
  res.send(ejs.render(html, res.locals));
})


// run the tests
var request = require('supertest');
var assert = require('assert');

function contains(res, string) {
  return (~res.text.indexOf(string));
}

it('translate', function(done) {
  var i18n = new Translation(loc);
  assert.equal(i18n.translate('de', 'Hello'), 'Hallo');
  assert.equal(i18n.translate('de-ch', 'Hello'), 'Tschau');
  assert.equal(i18n.translate('en', 'Hello'), 'Hello');
  done();
});

it('__', function(done) {
  var i18n = new Translation(loc);
  i18n.setLocale('de');
  assert.equal(i18n.getLocale(), 'de');
  assert.equal(i18n.__('Hello'), 'Hallo');
  assert.equal(i18n.t('Hello'), 'Hallo');
  done();
});


it('context', function(done) {
  var i18n = new Translation(loc);
  i18n.setLocale('de-CH');
  assert.equal(i18n.getLocale(), 'de-ch');
  assert.equal(i18n.t('Hello'), 'Tschau');
  assert.equal(i18n.__('customer/Hello'), 'Grüezi');
  assert.equal(i18n.__('customer/big/Hello'), 'Guete Tag');
  done();
});


it('singular', function(done) {
  var i18n = new Translation(loc);
  i18n.setLocale('en');
  assert.equal(i18n.__('Hello %s, how are you today?', 'Marcus'), 'Hello Marcus, how are you today?');
  assert.equal(i18n.__('Hello %s, how are you today? How was your %s?', 'Marcus', i18n.__('weekend')), 'Hello Marcus, how are you today? How was your weekend?');

  i18n.setLocale('de');
  assert.equal(i18n.__('Hello %s, how are you today?', 'Marcus'), 'Hallo Marcus, wie geht es dir heute?');
  assert.equal(i18n.__('Hello %s, how are you today? How was your %s?', 'Marcus', i18n.__('weekend')), 'Hallo Marcus, wie geht es dir heute? Wie war dein Wochenende?');

  done();
});

it('plural', function(done) {
  var i18n = new Translation(loc);
  i18n.setLocale('en');
  var singular = i18n.__n('%s cat', '%s cats', 1);
  var plural = i18n.__n('%s cat', '%s cats', 3);
  assert.equal(singular, '1 cat');
  assert.equal(plural, '3 cats');

  i18n.setLocale('de');
  singular = i18n.__n('%s cat', '%s cats', 1);
  plural = i18n.tn('%s cat', '%s cats', 3);
  assert.equal(singular, '1 Katze');
  assert.equal(plural, '3 Katzen');
  done();
});

it('nested plural', function(done) {
  var i18n = new Translation(loc);
  i18n.setLocale('en');
  var singular = i18n.__n('There is one monkey in the %%s', 'There are %d monkeys in the %%s', 1, i18n.__('tree'));
  var plural = i18n.__n('There is one monkey in the %%s', 'There are %d monkeys in the %%s', 3, i18n.__('tree'));
  assert.equal(singular, 'There is one monkey in the tree');
  assert.equal(plural, 'There are 3 monkeys in the tree');

  i18n.setLocale('de');
  singular = i18n.__n('There is one monkey in the %%s', 'There are %d monkeys in the %%s', 1, i18n.__('tree'));
  plural = i18n.__n('There is one monkey in the %%s', 'There are %d monkeys in the %%s', 3, i18n.__('tree'));
  assert.equal(singular, 'Im Baum sitzt ein Affe');
  assert.equal(plural, 'Im Baum sitzen 3 Affen');
  done();
});

it('variables', function(done) {
  var i18n = new Translation(loc);
  var i = 0;
  i18n.setLocale('en');
  var greetings = ['Hi', 'Hello', 'Howdy'];
  for (i = 0; i < greetings.length; i++) {
    assert.equal(greetings[i], i18n.__(greetings[i]));
  };

  i18n.setLocale('de');
  var greetingsDE = ['Hi', 'Hallo', 'Hallöchen'];
  for (i = 0; i < greetings.length; i++) {
    assert.equal(greetingsDE[i], i18n.__(greetings[i]));
  };
  done();
});