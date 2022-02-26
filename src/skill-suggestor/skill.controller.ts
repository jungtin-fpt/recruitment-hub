import { NextFunction, Request, Response } from 'express';
import { getSkillById, getSkills, updateSkillOmit, updateSkillVerification } from './skill.service';

export const getSkillsController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body;
        const skills = await getSkills(body.isOmit, body.isVerified );
        res.json(skills);
    } catch(err) {
        next(err);
    }
}

export const getSkillController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const skill = await getSkillById(parseInt(req.params.id));
        res.json(skill);
    } catch(err) {
        next(err);
    }
}

export const updateSkillController = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const body = req.body;
        let skill;
        if(body.method === 'omit')
            skill = await updateSkillOmit(parseInt(req.params.id), body.value);
        if(body.method === 'verify')
            skill = await updateSkillVerification(parseInt(req.params.id), body.value);
        res.json(skill);
    } catch(err) {
        next(err);
    }
}