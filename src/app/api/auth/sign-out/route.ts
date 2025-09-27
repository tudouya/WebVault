import { NextResponse } from "next/server"

import { jsendError, jsendFail, jsendSuccess } from "@/lib/utils/jsend"
import { auth, clerkClient } from "@clerk/nextjs/server"

export const runtime = "edge"

export async function POST() {
  try {
    const { sessionId } = await auth()

    if (!sessionId) {
      return NextResponse.json(jsendFail({ message: "未登录或会话已失效" }), { status: 401 })
    }

    const client = await clerkClient()
    await client.sessions.revokeSession(sessionId)

    const response = NextResponse.json(jsendSuccess({ redirectUrl: "/sign-in" }))
    response.cookies.set("__session", "", { expires: new Date(0), path: "/" })
    response.headers.set("Cache-Control", "no-store")
    return response
  } catch (error) {
    console.error("POST /api/auth/sign-out", error)
    return NextResponse.json(jsendError("退出失败", "sign_out_failed"), { status: 500 })
  }
}
