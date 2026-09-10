import { redirect } from 'next/navigation'

interface JoinDynamicParams {
  params: Promise<{ id: string }>
}

export default async function JoinDynamicPage({ params }: JoinDynamicParams) {
  const { id } = await params
  redirect(`/join?household_id=${encodeURIComponent(id)}`)
}
