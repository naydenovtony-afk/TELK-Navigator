import { signIn } from '@/auth'
import { useTranslations } from 'next-intl'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('telk.auth.login')
  return { title: t('title') }
}

export default function SignInPage() {
  return <SignInForm />
}

function SignInForm() {
  const t = useTranslations('telk.auth.login')

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-medical-surface]">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 border border-[--color-medical-border]">
        <h1 className="font-display text-3xl text-[--color-medical-navy] mb-2 text-center">
          ТЕЛК Навигатор
        </h1>
        <p className="text-[--color-medical-slate] text-center mb-8 text-sm">
          {t('title')}
        </p>

        <form
          action={async () => {
            'use server'
            await signIn('google', { redirectTo: '/dashboard' })
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-white border border-[--color-medical-border] text-[--color-dark-text] font-medium py-3 px-4 rounded-xl hover:bg-[--color-medical-surface] transition-colors"
          >
            <GoogleIcon />
            Вход с Google
          </button>
        </form>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  )
}
