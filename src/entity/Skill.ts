import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Skill extends BaseEntity {
    @PrimaryGeneratedColumn({
        unsigned: true,
    })
    id: number;

    @Column({
        unique: true,
    })
    name: string;

    @Column({
        default: 1,
    })
    suggests: number;

    @Column({
        default: false,
    })
    isOmit: boolean;

    @Column({
        default: false,
    })
    isVerified: boolean;
}
