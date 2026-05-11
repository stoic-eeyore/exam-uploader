import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

export const authOptions = {
  debug: true,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      //      authorization: {
      //        params: {
      //          prompt: "select_account", // or "consent" to force all permissions again
      //        }
      //      }
    }),
  ],

  callbacks: {
    async signIn({ profile }) {
      if (!profile?.email) {
        return false
      }
      const email = profile?.email || ''
      const name = profile?.name || ''

      // ✅ Restrict to school domain
      if (!email.endsWith('@sekolahbim.sch.id')) {
        return false
      }
      return true
    },

    async jwt({ token, profile }) {
      if (profile) {
        token.email = profile.email
        token.name = profile.name
      }
      return token
    },

    async session({ session, token }) {
      session.user.email = token.email
      session.user.name = token.name
      return session
    },
  },

  pages: {
    signIn: '/', // 👈 THIS makes your landing page the login page
  },
}
