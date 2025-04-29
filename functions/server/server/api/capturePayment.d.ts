import { Request, Response } from 'express';
export declare const capturePaymentHandler: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
