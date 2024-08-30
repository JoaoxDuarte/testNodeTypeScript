import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Measure {
    @PrimaryGeneratedColumn('uuid')
    uuid!: string;

    @Column()
    customerCode!: string;

    @Column('text')
    measureDatetime!: string;

    @Column()
    measureType!: 'WATER' | 'GAS';

    @Column('float')
    measureValue!: number;

    @Column({ default: false })
    hasConfirmed!: boolean;
}
