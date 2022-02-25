import { NextFunction, Request, Response } from "express";
import { SECTION_STATE } from "../job/utils/section-state";
import { getSectionById, getSections, updateSectionStatus } from "./section.service";

export async function getSectionsController(req: Request, res: Response, next: NextFunction) {
    try {
        const status = req.body.status as SECTION_STATE;
        const sections = await getSections(status);
        res.json(sections);
    } catch(err) {
        next(err);
    }
}

export async function getSectionController(req: Request, res: Response, next: NextFunction) {
    try {
        const id = parseInt(req.params.id);
        const section = await getSectionById(id);
        res.json(section);
    } catch(err) {
        next(err);
    }
}

export async function updateSectionController(req: Request, res: Response, next: NextFunction) {
    try {
        const id = parseInt(req.params.id);
        const status = req.body.status as SECTION_STATE;
        const section = await updateSectionStatus(id, status);
        res.json(section);
    } catch(err) {
        next(err);
    }
}