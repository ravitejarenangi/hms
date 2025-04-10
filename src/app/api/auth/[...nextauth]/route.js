import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { comparePassword, getUserByEmail, generateToken } from '@/lib/auth';
import prisma from '@/lib/db';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        twoFactorCode: { label: '2FA Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Find user by email
          const user = await getUserByEmail(credentials.email);
          
          if (!user) {
            return null;
          }

          // Verify password
          const isPasswordValid = await comparePassword(credentials.password, user.password);
          
          if (!isPasswordValid) {
            return null;
          }

          // Check if 2FA is enabled
          if (user.twoFactorEnabled) {
            // If 2FA is enabled but no code provided, return a special response
            if (!credentials.twoFactorCode) {
              return {
                id: user.id,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                requiresTwoFactor: true,
              };
            }

            // Verify 2FA code
            const isTwoFactorValid = verify2FAToken(credentials.twoFactorCode, user.twoFactorSecret);
            
            if (!isTwoFactorValid) {
              return null;
            }
          }

          // Return user data
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            image: user.profileImage || null,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        // For OAuth providers
        if (account.provider === 'google' || account.provider === 'facebook') {
          // Check if user exists in our database
          let dbUser = await getUserByEmail(user.email);
          
          // If user doesn't exist, create a new one
          if (!dbUser) {
            dbUser = await prisma.user.create({
              data: {
                email: user.email,
                firstName: user.name?.split(' ')[0] || '',
                lastName: user.name?.split(' ').slice(1).join(' ') || '',
                password: '', // Empty password for OAuth users
                role: 'PATIENT', // Default role for OAuth users
                profileImage: user.image,
                provider: account.provider,
                providerId: account.providerAccountId,
              },
            });
          }
          
          // Add user data to token
          token.id = dbUser.id;
          token.role = dbUser.role;
        } else {
          // For credentials provider
          token.id = user.id;
          token.role = user.role;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // Add user data to session
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
      }
      
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    signOut: '/auth/logout',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
    newUser: '/auth/register',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.JWT_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
