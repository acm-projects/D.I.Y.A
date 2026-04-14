declare module 'express' {
    export interface Request {
        body: any
        params: any
        query: any
    }

    export interface Response {
        json: (body?: any) => Response
        status: (code: number) => Response
        send: (body?: any) => Response
    }

    export interface Router {
        get: (path: string, handler: (req: Request, res: Response) => any) => Router
        post: (path: string, handler: (req: Request, res: Response) => any) => Router
        put: (path: string, handler: (req: Request, res: Response) => any) => Router
        delete: (path: string, handler: (req: Request, res: Response) => any) => Router
        use: (...args: any[]) => any
    }

    export function Router(): Router

    interface ExpressApp {
        use: (...args: any[]) => any
        get: (path: string, handler: (req: Request, res: Response) => any) => any
        listen: (port: number, callback?: () => void) => any
    }

    interface ExpressStatic {
        (): ExpressApp
        json: (options?: any) => any
        Router: typeof Router
    }

    const express: ExpressStatic
    export default express
}
