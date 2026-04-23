import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import UserModel from '@/models/User'
import { RegisterSchema } from '@/lib/validations'
import { registerRateLimit } from '@/lib/ratelimit'

export async function POST(req: NextRequest) {
  try {
    if (registerRateLimit) {
      const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
      const { success } = await registerRateLimit.limit(ip);
      
      if (!success) {
        return NextResponse.json({ 
          error: "Too many registration attempts. Please try again later." 
        }, { status: 429 });
      }
    }

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

    return NextResponse.json({ 
      id: user._id, 
      name: user.name, 
      email: user.email 
    }, { status: 201 })

  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}