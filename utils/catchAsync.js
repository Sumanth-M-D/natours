//? Function to handle the errors caught in asynchronous functions (of controllers)
export default function catchAsync(fn) {
   return function (req, res, next) {
      fn(req, res, next).catch((err) => next(err));
   };
}
