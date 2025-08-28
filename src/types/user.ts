import { Document, Types } from 'mongoose';
import { CreateUserDto } from '../DTO/userDto.js';

export type UserRole = 'user' | 'waiter' | 'chef' | 'admin';

export interface UserDB extends Document {
    _id: Types.ObjectId;
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    phone?: string;
    profileImage?: string;
    orders?: Types.ObjectId[];
    restaurant?: Types.ObjectId | null;
    active: boolean;
    isGoogle: boolean;
    lastLogin: Date;
}

export interface UserDao {
    getById: (id: string) => Promise<UserDB | null>;
    getByEmail: (email: string) => Promise<UserDB | null>;
    create: (userData: CreateUserDto) => Promise<UserDB>;
}

export interface UserService{
    register: (userData: any) => Promise<UserDB>;
    login: (email: string, password: string) => Promise<UserDB>;
}