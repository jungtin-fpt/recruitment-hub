import { Skill } from '../entity/Skill';
import { EntityNotFoundError } from '../error/entity-not-found.error';
import logger from '../logger';
import { convertToSkillMap } from './skill.converter';

export async function updateSkillVerification(id: number, isVerified: boolean) {
	const skill = await Skill.findOne(id);
	if (!skill) throw new EntityNotFoundError('skill', id);

	skill.isVerified = isVerified;
	await skill.save();
}

export async function updateSkillOmit(id: number, isOmit: boolean) {
	const skill = await Skill.findOne(id);
	if (!skill) throw new EntityNotFoundError('skill', id);

	skill.isOmit = isOmit;
	await skill.save();
}

export async function getSkills(isOmit?: boolean, isVerified?: boolean) {
	return await Skill.find({
		where: {
			isOmit: isOmit || false,
			isVerified: isVerified || false,
		},
	});
}

export async function getSkillById(
	id: number
) {
	const skill = await Skill.findOne(id);
	if (!skill) throw new EntityNotFoundError('skill', id);
	return skill;
}

export async function synchronizeSkills(descriptions: string[] | string) {
	const skillMap = convertToSkillMap(descriptions);
	for (const [name, count] of skillMap.entries()) {
		const kw = await Skill.findOne({
			select: ['id', 'name', 'suggests'],
			where: {
				name: name,
			},
		});

		if (kw) {
			kw.suggests += count;
			logger.info(`Found skill and increase count: ${name}/${count}`);
			await kw.save();
		} else {
			const skill = new Skill();
			skill.name = name;
			skill.suggests = count;
			logger.info(`Not found skill and inserting: ${name}/${count}`);
			await skill.save();
		}
	}
}