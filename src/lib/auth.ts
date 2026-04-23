import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { connectDB } from './db'
import UserModel from '@/models/User'

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        await connectDB()
        const user = await UserModel.findOne({ email: credentials.email.toLowerCase() })
        
        if (!user) return null

        //check if account is currently locked 
        if (user.lockUntil && user.lockUntil > new Date()) {
          const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
          throw new Error(`Account locked. Try again in ${remainingMinutes} minutes.`);
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        
        //handle failed login attempts
        if (!isValid) {
          user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
          
          if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
            user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
          }
          
          await user.save();
          throw new Error('Invalid email or password');
        }

        // reset counter if successful login
        if (user.failedLoginAttempts > 0 || user.lockUntil) {
          user.failedLoginAttempts = 0;
          user.lockUntil = undefined;
          await user.save();
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}