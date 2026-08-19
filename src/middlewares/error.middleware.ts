import type { Request, Response, NextFunction } from "express";
import {ZodError} from "zod";
import env from "../config/env.js";

const zodErrorHandler = (err: ZodError, res: Response) => {

    const formattedErrors = err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,      
    }));

    return res.status(400).json({
        status: "fail",
        message: "Validation Error",
        errors: formattedErrors,
    });
}

const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {


  if(err instanceof ZodError) {
    return zodErrorHandler(err, res);
  }

  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";


  if (env.NODE_ENV == "development") {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      err: err,
      stack: err.stack,
    });
  } else {
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        } else {
            console.error('FATAL ERROR:', err);
            res.status(500).json({
                status: 'error',
                message: 'Something went wrong on our end.'
            });
        }
  }
};

export default globalErrorHandler;