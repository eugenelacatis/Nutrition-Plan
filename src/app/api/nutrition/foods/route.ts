import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const foods = await prisma.food.findMany({ orderBy: { name: 'asc' } })
  return NextResponse.json({ success: true, data: foods })
}
