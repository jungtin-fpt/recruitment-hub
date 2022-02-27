import { FindOneOptions } from 'typeorm';
import { Job } from '../entity/Job';
import { Section } from '../entity/Section';
import { EntityNotFoundError } from '../error/entity-not-found.error';
import { SECTION_STATE } from '../job/utils/section-state';

export async function createSection(keyword: string) {
	const section = new Section();
	section.keyword = keyword;
	section.status = SECTION_STATE.PROCESSING;
	return await section.save();
}

export async function updateSectionStatus(id: number, state: SECTION_STATE) {
	const section = await Section.findOne(id);
	if (!section) throw new EntityNotFoundError('section', id);

	section.status = state;
	return await section.save();
}

export async function getSectionById(id: number, options?: FindOneOptions<Section>) {
	const section = await Section.findOne(id, options);
	if (!section) throw new EntityNotFoundError('section', id);

	return section;
}

export async function getSections(status: SECTION_STATE) {
	const option = !!status ? {
		status,
	} : {} ;
	const sections = await Section.find({
		order: {
			createdAt: 'DESC'
		},
		where: option,
		take: 15
	});
	return await Promise.all(sections.map(async section => {
		return {
			...section,
			jobs: await Job.count({
				where: {
					section
				}
			})
		}
	}));
}
