//? Class to manually construct the Error
export default class AppError extends Error {
   constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
      this.isOperational = true;

      //? To capture the error.stack
      Error.captureStackTrace(this, this.contructor);
   }
}
