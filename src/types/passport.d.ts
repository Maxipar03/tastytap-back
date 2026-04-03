import { UserDB } from './user.types.js';

declare global {
  namespace Express {
    interface User extends UserDB {}
  }
}

declare module 'passport' {
  interface User extends UserDB {}
}