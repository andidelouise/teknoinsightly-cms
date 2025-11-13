import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import NextAuth from 'next-auth';

import { authConfig } from './auth.config';
import { db } from './prisma/db.server';
import { User } from './app/lib/definitions';

async function getUser(email: string): Promise<User | null> {
  const user = await db.author.findUnique({ where: { email: email } });
  return user;
}

export const { handlers: { GET, POST }, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const { email, password } = credentials as {
          email: string;
          password: string;
        }

        const user = await getUser(email);
        if (user) return user;
        return null;

      },
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      return { ...token, ...user };
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      session.user.role = token.role;
      return session;
    }
  }
});