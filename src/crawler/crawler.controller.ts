import { NextFunction, Request, Response } from "express";
import { startCrawling } from "./crawler.service";

export async function crawlController(req: Request, res: Response, next: NextFunction) {
    try {
        const keyword = req.body.keyword;
        startCrawling(keyword, req.body.headless);
        res.status(200).json({ message: `Crawl request for keyword ${keyword} has been started` });
    } catch(err) {
        next(err);
    }
}
