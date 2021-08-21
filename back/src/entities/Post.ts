import { Field, Int, ObjectType } from "type-graphql";
import { BaseEntity, ManyToOne, Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn, CreateDateColumn } from "typeorm";
import { User } from "./User";

@ObjectType()
@Entity()
export class Post extends BaseEntity {

    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;


    @Field(() => Int)
    @Column()
    creatorId: number;

    @Field()
    @ManyToOne(() => User, user => user.posts)
    creator: User


    @Field()
    @Column({ type: "text" })
    title!: string;


    @Field()
    @Column({ default: 0, type: "int" })
    points: number


    @Field()
    @Column({ type: 'text', default: 0 })
    text!: string

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(()=>String)
    @UpdateDateColumn()
    updatedAt: Date;

}
