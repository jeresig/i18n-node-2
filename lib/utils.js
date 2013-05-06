exports.acceptsHtmlExplicit = function(req) {
  var accept = req.headers["accept"];
  if (!accept) return false;
  return (~accept.indexOf("html"));
}

exports.isExcluded = function(url, excludeList) {
  var excluded = false;
  if (!url) return true;
  excludeList.forEach(function(exclude) {
    if (~url.indexOf(exclude)) {
      excluded = true;
    }
  });
  return excluded;
}