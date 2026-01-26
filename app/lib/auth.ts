import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

// Function to get Google SSO config from database
export async function getGoogleSSOConfig() {
  try {
    const config = await prisma.googleSSOConfig.findFirst({
      where: { enabled: true },
      orderBy: { updatedAt: 'desc' }
    });
    return config;
  } catch (error) {
    console.error('Error fetching Google SSO config:', error);
    return null;
  }
}

// Credentials provider (shared)
const credentialsProvider = CredentialsProvider({
  name: 'credentials',
  credentials: {
    email: { label: 'Email', type: 'email' },
    password: { label: 'Password', type: 'password' }
  },
  async authorize(credentials) {
    if (!credentials?.email || !credentials?.password) {
      throw new Error('Invalid credentials');
    }

    const user = await prisma.user.findUnique({
      where: { email: credentials.email }
    });

    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(credentials.password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      image: user.image
    };
  }
});

// Function to create dynamic auth options with Google SSO from database
export async function createAuthOptions(): Promise<NextAuthOptions> {
  const providers: any[] = [credentialsProvider];

  // Try to get Google config from database first
  const googleConfig = await getGoogleSSOConfig();
  
  if (googleConfig && googleConfig.clientId && googleConfig.clientSecret && 
      !googleConfig.clientId.includes('PLACEHOLDER') && !googleConfig.clientSecret.includes('PLACEHOLDER')) {
    providers.push(
      GoogleProvider({
        clientId: googleConfig.clientId,
        clientSecret: googleConfig.clientSecret,
        allowDangerousEmailAccountLinking: true
      })
    );
  } else if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET &&
             !process.env.GOOGLE_CLIENT_ID.includes('PLACEHOLDER')) {
    // Fallback to env variables
    providers.push(
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true
      })
    );
  }

  return {
    adapter: PrismaAdapter(prisma),
    providers,
    session: {
      strategy: 'jwt'
    },
    pages: {
      signIn: '/login',
      error: '/login'
    },
    callbacks: {
      async jwt({ token, user, account }) {
        if (user) {
          token.id = user.id;
          token.role = (user as any).role || 'USER';
        }
        // Fetch role from database for OAuth users
        if (account?.provider === 'google' && token.email) {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email }
          });
          if (dbUser) {
            token.role = dbUser.role;
            token.id = dbUser.id;
          }
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          (session.user as any).id = token.id;
          (session.user as any).role = token.role;
        }
        return session;
      },
      async signIn({ account, profile }) {
        if (account?.provider === 'google') {
          return !!((profile as any)?.email_verified ?? true);
        }
        return true;
      }
    },
    secret: process.env.NEXTAUTH_SECRET
  };
}

// Static authOptions for places that need it (credentials only fallback)
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [credentialsProvider],
  session: {
    strategy: 'jwt'
  },
  pages: {
    signIn: '/login',
    error: '/login'
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || 'USER';
      }
      if (account?.provider === 'google' && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email }
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.id = dbUser.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
    async signIn({ account, profile }) {
      if (account?.provider === 'google') {
        return !!((profile as any)?.email_verified ?? true);
      }
      return true;
    }
  },
  secret: process.env.NEXTAUTH_SECRET
};
