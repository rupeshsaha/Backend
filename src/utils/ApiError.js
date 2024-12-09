class ApiError extends Error {
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ''

    ){
        super(message)
        this.statusCode = statusCode
        this.data = null
        this.message = message
        this.success = false;
        this.errors = errors;

        if(stack){
            this.stack = stack;
        } else {
            Error.captureStackTrace(this,this.constructor)
        }
    }

    toJSON() {
        return {
          statusCode: this.statusCode,
          success: this.success,
          message: this.message,
          errors: this.errors,
          stack: process.env.NODE_ENV === "development" ? this.stack : undefined, // Include stack only in dev
        };
      }
}

export {ApiError }