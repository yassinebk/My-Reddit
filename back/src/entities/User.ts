import { Field, Int, ObjectType } from "type-graphql";
import { OneToMany, BaseEntity, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Post } from "./Post";

@ObjectType()
@Entity()
export class User extends BaseEntity {

    @Field(() => Int)
    @PrimaryGeneratedColumn()
    id!: number;

    @Field(() => String)
    @Column({ unique: true })
    username!: string;


    @Field(() => String)
    @Column({ unique: true })
    email!: string;


    @Column()
    password!: string;


    @OneToMany(() => Post, post => post.creator)
    posts: string[]


    @Field(() => String)
    @CreateDateColumn()
    createdAt = new Date();

    @Field(() => String)
    @UpdateDateColumn()
    updatedAt = Date;



}

