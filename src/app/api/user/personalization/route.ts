import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PERSONALIZATION_KEYS } from '@/lib/nutrition/personalizationQuestions'

const MAX_NOTES_LENGTH = 1000
const MAX_FIELD_LENGTH = 200

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { notes: true, mealCountPref: true, cookTimePref: true, proteinPref: true },
  })

  return NextResponse.json({ success: true, data: user })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const data: Record<string, string | null> = {}

  if ('notes' in body) {
    const notes = body.notes
    if (notes !== null && (typeof notes !== 'string' || notes.length > MAX_NOTES_LENGTH)) {
      return NextResponse.json(
        { success: false, error: `notes must be a string of at most ${MAX_NOTES_LENGTH} characters, or null` },
        { status: 400 }
      )
    }
    data.notes = notes
  }

  for (const key of PERSONALIZATION_KEYS) {
    if (!(key in body)) continue
    const value = body[key]
    if (value !== null && (typeof value !== 'string' || value.length > MAX_FIELD_LENGTH)) {
      return NextResponse.json(
        { success: false, error: `${key} must be a string of at most ${MAX_FIELD_LENGTH} characters, or null` },
        { status: 400 }
      )
    }
    data[key] = value
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { notes: true, mealCountPref: true, cookTimePref: true, proteinPref: true },
  })

  return NextResponse.json({ success: true, data: user })
}
