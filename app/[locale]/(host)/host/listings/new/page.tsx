import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ListingWizard } from '@/components/host/ListingWizard'

export default async function NewListingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/${locale}/auth/login`)

  return <ListingWizard locale={locale} />
}
