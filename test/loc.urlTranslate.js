// setup server
var app = require('./fixtures/app');
var ejs = require('ejs');

// setup loc
var loc = require('./fixtures/setup')(app);

// test that the cookie is set and that req.i18n and res.locals are present.
app.use(function cookieTest(req, res, next) {
  var cookies = res.get('Set-Cookie');
  assert(~cookies.indexOf('lang='));
  assert(req.i18n);
  assert(res.locals.__);
  assert(res.locals.__n);
  assert(res.locals.t);
  assert(res.locals.tn);
  assert(res.locals.getLocale());
  assert(res.locals.isPreferredLocale());
  next();
})

// route
app.get('/test', function(req, res) {
  var html = '<html><head></head><body><p><%=__("Hello") %></p></body></html>';
  res.send(ejs.render(html, res.locals));
})

app.get('/test/site', function(req, res) {
  var html = '<html><head></head><body><p><%=__("Hi") %></p></body></html>';
  res.send(ejs.render(html, res.locals));
})


// run the tests
var request = require('supertest');
var assert = require('assert');

function contains(res, string) {
  return (~res.text.indexOf(string));
}

it('url de-ch', function(done) {
  request(app)
    .get('/de-ch/Tescht')
    .set('Accept', 'text/html')
    .expect(200)
    .end(function(err, res) {
    assert(contains(res, 'Tschau'));
    if (err) return done(err);
    done()
  });
});

it('url de-ch', function(done) {
  request(app)
    .get('/de-ch/Tescht/Siite')
    .set('Accept', 'text/html')
    .expect(200)
    .end(function(err, res) {
    assert(contains(res, 'Ciao'));
    if (err) return done(err);
    done()
  });
});

it('url en', function(done) {
  request(app)
    .get('/en/exam')
    .set('Accept', 'text/html')
    .expect(200)
    .end(function(err, res) {
    assert(contains(res, 'Hello'));
    if (err) return done(err);
    done()
  });
});
