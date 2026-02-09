import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import ItemQRPageClient from './ItemQRPageClient'

interface Props {
  params: Promise<{ id: string }>
}

async function getItem(id: string) {
  const item = await prisma.item.findUnique({
    where: { id },
    include: {
      category: true,
    },
  })

  return item
}

export default async function ItemQRPage({ params }: Props) {
  const { id } = await params
  const item = await getItem(id)

  if (!item) {
    notFound()
  }

  return <ItemQRPageClient item={item} />
}
