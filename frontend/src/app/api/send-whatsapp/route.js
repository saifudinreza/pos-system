import { NextResponse } from "next/server";

export async function POST(request) {
  const { target, message } = await request.json();

  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    return NextResponse.json(
      { status: false, reason: "Token Fonnte belum dikonfigurasi di server." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ target, message, countryCode: "62" }),
    });
    const json = await res.json();
    return NextResponse.json(json);
  } catch (err) {
    return NextResponse.json(
      { status: false, reason: err.message },
      { status: 500 }
    );
  }
}
