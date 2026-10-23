import { getUser, login, logout, verifyRequestOrigin } from "@netlify/identity";

const json = (body, status = 200) => Response.json(body, {
  status,
  headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
});
const isAdmin = (user) => Boolean(user?.roles?.includes("admin"));

export default async function handler(request) {
  if (request.method === "GET") {
    const user = await getUser();
    if (!isAdmin(user)) return json({ authenticated: false }, 401);
    return json({ authenticated: true, email: user.email });
  }

  if (request.method === "POST") {
    verifyRequestOrigin(request);
    let credentials;
    try { credentials = await request.json(); }
    catch { return json({ error: "入力内容を読み取れませんでした。" }, 400); }

    const email = String(credentials?.email ?? "").trim().toLowerCase();
    const password = String(credentials?.password ?? "");
    if (!email || !password || email.length > 254 || password.length > 512) {
      return json({ error: "メールアドレスとパスワードを入力してください。" }, 400);
    }

    try {
      await login(email, password);
      return json({ ok: true });
    } catch {
      return json({ error: "ログインできませんでした。招待メールの登録と入力内容を確認してください。" }, 401);
    }
  }

  if (request.method === "DELETE") {
    verifyRequestOrigin(request);
    await logout();
    return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
  }

  return json({ error: "この操作には対応していません。" }, 405);
}

export const config = { path: "/api/admin-auth" };
