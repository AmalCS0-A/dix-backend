import mongoose from 'mongoose';

// An error that carries an HTTP status code. We throw it from controllers.
export class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

// Runs when no route matched.
export function notFound(req, res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

// One place that turns every error into the same JSON shape:
// { "status": 400, "message": "...", "errors": [ ... ] }
export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message;
  let errors = err.errors;

  if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Validation failed';
    errors = Object.values(err.errors).map((e) => e.message);
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid value for "${err.path}"`;
  } else if (err.code === 11000) {
    status = 409;
    message = 'This value already exists (duplicate)';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON in the request body';
  }

  if (status >= 500) {
    console.error(err); // details stay in the server console only
    message = 'Internal server error';
    errors = undefined;
  }

  res.status(status).json({ status, message, ...(errors && { errors }) });
}
