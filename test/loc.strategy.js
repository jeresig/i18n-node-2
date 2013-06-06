// setup server
var app = require('./fixtures/app');
var ejs = require('ejs');

// setup loc
var loc = require('./fixtures/setup')(app);


// test that the cookie is set
app.use(function(req, res, next) {
  var cookies = res.get('Set-Cookie');
  assert(~cookies.indexOf('lang='))
  next();
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

it('path strategy de', function(done) {
  request(app)
    .get('/de/test')
    .set('Accept', 'text/html')
    .expect(200)
    .end(function(err, res) {
    assert(contains(res, 'Hallo'));
    if (err) return done(err);
    done()
  });
})

it('path strategy de-ch', function(done) {
  request(app)
    .get('/de-CH/test')
    .set('Accept', 'text/html')
    .expect(200)
    .end(function(err, res) {
    assert(contains(res, 'Tschau'));
    if (err) return done(err);
    done()
  });
})

it('query strategy de-ch', function(done) {
  request(app)
    .get('/test?lang=de-ch')
    .set('Accept', 'text/html')
    .expect(200)
    .end(function(err, res) {
    assert(contains(res, 'Tschau'));
    if (err) return done(err);
    done()
  });
})

// TODO test subdomain