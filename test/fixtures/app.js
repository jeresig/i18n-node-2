var express = require('express');
var app = module.exports = express();

// load static content before routing takes place
app.use(express['static'](__dirname));

// setup ejs template enging
var ejs = require('ejs');
app.engine('.html', ejs.__express);
app.set('views', __dirname + '/fixtures');
app.set('view engine', 'html');
app.set('view options', {
  layout: false
});

// start the server
app.listen(3000);