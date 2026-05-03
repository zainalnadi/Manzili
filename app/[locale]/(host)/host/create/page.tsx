import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ListingWizard } from '@/components/host/ListingWizard'

export default async function CreateListingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login?redirect=/${locale}/host/create`)

  return <ListingWizard locale={locale} />
}
