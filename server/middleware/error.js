export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Route not found: ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  let status = err.status || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'Server error';

  if (err.name === 'CastError') {
    status = 404;
    message = 'Resource not found';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join('. ');
  } else if (err.code === 11000) {
    status = 400;
    const field =
      Object.keys(err.keyValue || err.keyPattern || {})[0] || (String(err.message).match(/index: (\w+?)_\d/) || [])[1] || 'value';
    message = `That ${field} is already in use`;
  } else if (err.name === 'MulterError') {
    status = 400;
  }

  if (status >= 500) console.error(err);
  res.status(status).json({ message, stack: process.env.NODE_ENV === 'production' ? undefined : err.stack });
};
