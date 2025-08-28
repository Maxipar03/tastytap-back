export interface CreateUserDto {
    name: string;
    email: string;
    password?: string | null;
    phone?: string;
    profileImage?: string;
    isGoogle?: boolean;
}

export interface LoginUserDto {
    email: string;
    password: string;
}