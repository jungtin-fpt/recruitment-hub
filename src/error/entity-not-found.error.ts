export class EntityNotFoundError extends Error {
	name: string = 'ENTITY_NOT_FOUND';
	constructor(entity: string, id: number) {
		super(`Not found any ${entity.toLowerCase().trim()} with id: ${id}`);
	}
}