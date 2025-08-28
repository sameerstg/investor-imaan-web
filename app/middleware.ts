import { auth } from "@/auth"

export default auth((req) => {
  const isAuth = !!req.auth
  const isPortfolioPage = req.nextUrl.pathname.startsWith('/portfolio')

  if (isPortfolioPage && !isAuth) {
    const signInUrl = new URL('/sign-in', req.url)
    return Response.redirect(signInUrl)
  }
})