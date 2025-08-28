import { UserDB } from './user.ts';

declare global {
  namespace Express {
    interface User extends UserDB {}
  }
}

declare module 'passport' {
  interface User extends UserDB {}
}