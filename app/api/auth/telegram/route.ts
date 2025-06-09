import { type NextRequest, NextResponse } from "next/server";
import { createUser, getUserByTelegramId, updateUser } from "@/lib/models/user";
import { createHmac } from "crypto";
import { createJWTToken, setSecureCookies } from "@/lib/auth";

// -------------------------------------------------------------
// Telegram Mini App auth helper
// -------------------------------------------------------------
// Spec: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
// secret_key = HMAC_SHA256(<bot_token>, "WebAppData")
// hash       = hex( HMAC_SHA256(data_check_string, secret_key) )
// data_check_string = all fields except hash, sorted alphabetically,
//                     joined with "\n" in key=value form (values decoded as in Python parse_qsl)
// -------------------------------------------------------------

function verifyTelegramWebAppData(initData: string): boolean {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error("❌ TELEGRAM_BOT_TOKEN is not defined");
      return false;
    }

    // 1. Extract hash value
    const hashMatch = initData.match(/(?:^|&)hash=([^&]*)/);
    if (!hashMatch) {
      console.error("❌ No hash field found in initData");
      return false;
    }
    const hash = hashMatch[1];

    // 2. Build data_check_string: keep signature, remove only hash
    const dataPairs = initData
      .split("&")
      .map((p) => p.split("="))
      .filter(([k]) => k !== "hash") // Remove only hash, keep signature
      .map(([k, raw]) => [k, decodeURIComponent(raw || "")])
      .sort(([a], [b]) => a.localeCompare(b));

    const dataCheckString = dataPairs.map(([k, v]) => `${k}=${v}`).join("\n");

    // 3. Create secret key using WebAppData
    const secretKey = createHmac("sha256", "WebAppData").update(botToken).digest();

    // 4. Calculate hash
    const calculatedHash = createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

    return calculatedHash === hash;
  } catch (error) {
    console.error("❌ Error verifying Telegram WebApp data:", error);
    return false;
  }
}

// -------------------------------------------------------------
// POST /api/auth/telegram  – main entry point called from the Mini App
// -------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { initData, user } = data;

    if (!user || !user.id) {
      return NextResponse.json({ error: "User data is missing" }, { status: 400 });
    }

    const isDevelopment = process.env.NODE_ENV === "development";

    if (!isDevelopment && initData) {
      if (!verifyTelegramWebAppData(initData)) {
        return NextResponse.json({ error: "Invalid authentication data" }, { status: 401 });
      }

      // Prevent replay attacks (>24 h old)
      const authDate = Number(new URLSearchParams(initData).get("auth_date")) * 1000;
      if (Date.now() - authDate > 86_400_000) {
        return NextResponse.json({ error: "Authentication data expired" }, { status: 401 });
      }
    }

    // -------------------------------------------------------------------
    // Find or create user – business logic unchanged
    // -------------------------------------------------------------------
    let dbUser = await getUserByTelegramId(user.id.toString());

    if (!dbUser) {
      const isAdmin = user.id.toString() === process.env.ADMIN_TELEGRAM_ID;
      dbUser = await createUser({
        telegram_id: user.id.toString(),
        username: user.username || null,
        first_name: user.first_name,
        last_name: user.last_name || null,
        avatar_url: user.photo_url || null,
        is_admin: isAdmin,
      });
    } else {
      dbUser =
        (await updateUser(dbUser.id, {
          username: user.username || null,
          first_name: user.first_name,
          last_name: user.last_name || null,
          avatar_url: user.photo_url || null,
        })) || dbUser;
    }

    if (dbUser.is_blocked) {
      return NextResponse.json({ error: "Your account has been blocked" }, { status: 403 });
    }

    const token = createJWTToken({
      userId: dbUser.id,
      telegramId: dbUser.telegram_id,
      isAdmin: dbUser.is_admin,
    });

    await setSecureCookies(dbUser.telegram_id, initData || "", token);

    return NextResponse.json({
      user: {
        id: dbUser.id,
        telegram_id: dbUser.telegram_id,
        username: dbUser.username,
        first_name: dbUser.first_name,
        last_name: dbUser.last_name,
        avatar_url: dbUser.avatar_url,
        is_admin: dbUser.is_admin,
        is_blocked: dbUser.is_blocked,
      },
      token,
    });
  } catch (error) {
    console.error("❌ Error during Telegram authentication:", error);
    return NextResponse.json(
      {
        error: "Authentication failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
