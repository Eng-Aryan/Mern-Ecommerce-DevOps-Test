// Strips MongoDB operator keys ("$ne", "a.b") from request input so a request
// body like { "email": { "$gt": "" } } can never reach a query.
const clean = (v) => {
  if (Array.isArray(v)) return v.map(clean);
  if (v && typeof v === 'object') {
    for (const k of Object.keys(v)) {
      if (k.startsWith('$') || k.includes('.')) delete v[k];
      else v[k] = clean(v[k]);
    }
  }
  return v;
};

export default (req, res, next) => {
  clean(req.body);
  clean(req.params);
  // Express 4 exposes req.query as a plain writable object.
  clean(req.query);
  next();
};
