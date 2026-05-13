import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { connectDB } from './db'
import UserModel from '@/models/User'

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; 

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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

        if (user.lockUntil && user.lockUntil > new Date()) {
          const remainingMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
          throw new Error(`Account locked. Try again in ${remainingMinutes} minutes.`);
        }

        // safety check for google-created accounts
        if (!user.passwordHash) {
          throw new Error('This account was created via Google. Please use "Continue with Google".');
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)
        
        if (!isValid) {
          user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
          if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
            user.lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
          }
          await user.save();
          throw new Error('Invalid email or password');
        }

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
    async signIn({ user, account }) {
      // Just-In-Time mongoDB provisioning for google oauth
      if (account?.provider === 'google') {
        await connectDB()
        const existingUser = await UserModel.findOne({ email: user.email?.toLowerCase() })
        
        if (!existingUser) {
          await UserModel.create({
            name: user.name,
            email: user.email?.toLowerCase(),
          })
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === 'google') {
          await connectDB()
          const dbUser = await UserModel.findOne({ email: user.email?.toLowerCase() })
          if (dbUser) {
            token.id = dbUser._id.toString()
          }
        } else {
          token.id = user.id
        }
      }
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