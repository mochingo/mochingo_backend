import { Response } from 'express';

export interface ApiResponse<T = unknown> {
    status: boolean;
    message: string;
    data?: T;
}

export const sendSuccess = <T>(
    res: Response,
    data?: T,
    message = 'Success',
    statusCode = 200
): Response<ApiResponse<T>> => {
    return res.status(statusCode).json({
        status: true,
        message,
        data,
    });
};

export const sendError = (
    res: Response,
    message = 'An error occurred',
    data: unknown = null,
    statusCode = 500
): Response<ApiResponse> => {
    return res.status(statusCode).json({
        status: false,
        message,
        data,
    });
};
