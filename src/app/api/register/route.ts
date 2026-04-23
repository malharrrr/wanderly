import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import UserModel from '@/models/User'
import { RegisterSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const validation = RegisterSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json({
        error: validation.error.issues[0].message
      }, { status: 400 })
    }

    const { name, email, password } = validation.data

    await connectDB()

    const existing = await UserModel.findOne({ email: email.toLowerCase() })
    if (existing) {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await UserModel.create({ 
      name, 
      email: email.toLowerCase(), 
      passwordHash 
    })

    return NextResponse.json({ id: user._id, name: user.name, email: user.email }, { status: 201 })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}