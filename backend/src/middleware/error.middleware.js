export const errorHandler = (err, req, res, next) => {
  console.error(err);

  const statusCode = Number(err?.statusCode) || 500;
  const message =
    statusCode >= 500 ? "Internal Server Error" : err.message || "Request failed";

  return res.status(statusCode).json({
    success: false,
    message,
  });
};
