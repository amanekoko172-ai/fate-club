import { getStore } from "@netlify/blobs";
import { getUser, verifyRequestOrigin } from "@netlify/identity";

const articles = {
  "article-fate-stay-night": "Fate/stay nightはどこから始める？3ルートの入口ガイド",
  "article-fgo-beginner": "FGOのストーリーを楽しむための初心者ガイド",
  "article-kara-no-kyoukai-guide": "空の境界を初めて楽しむための作品ガイド",
  "article-mahoyo-guide": "魔法使いの夜はどんな作品？ネタバレなし入門ガイド",
  "article-thread-7495232": "「ウス、姉さんはどう見たって」ぐだぐだサーヴァントの儚さ談義",
  "article-thread-7504514": "「【考察】オベロンって実は」スレまとめ",
  "article-thread-7506039": "「変な夢を見たでちゅ…」スレまとめ",
  "article-thread-7507546": "「三千世界の鴉を殺し」スレまとめ",
  "article-thread-7507604": "「先輩、わたしたちのパン屋の名前ですが」スレまとめ",
  "article-thread-7507938": "「青子と有珠の恋愛下手ばかりネタにされるけど」スレまとめ",
  "article-thread-7509300": "「はかないマスターです」スレまとめ",
  "article-thread-7512539": "「【閲覧注意】大変だ！カルデアが内部分裂した！」スレまとめ",
  "article-thread-7513381": "「オーロラって汎人類史では醜悪になるらしいけど」スレまとめ",
  "article-thread-7517628": "カルナ「緊急事態だったぞマスター、緊急事態だったぞ」スレまとめ",
  "article-thread-7517811": "「カルデア大運動会か！！」スレまとめ",
  "article-thread-7518908": "伊織「今日はもうこれ以上の買い食いはダメだセイバー」スレまとめ",
  "article-thread-7522266": "遠野志貴「アルクェイドは女の子だから戦っちゃダメだ！」スレまとめ",
  "article-thread-7524790": "「うぅ………」スレまとめ",
  "article-thread-7525451": "「先輩！この特異点は女々しくならなくてはなりません！」スレまとめ",
  poison: "「これ毒かも！？」静謐ちゃんの手洗いスレまとめ",
  tenoch: "「儚い女！？」都市としてのテノチをめぐるスレッドまとめ",
};

const allowedOrigins = new Set(["https://amanekoko172-ai.github.io"]);
const store = () => getStore("article-comments");
const json = (body, status = 200, origin = "") => {
  const headers = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" };
  if (allowedOrigins.has(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers.Vary = "Origin";
  }
  return Response.json(body, { status, headers });
};
const isAdmin = (user) => Boolean(user?.roles?.includes("admin"));

async function listEntries(prefix) {
  const { blobs } = await store().list({ prefix });
  const values = await Promise.all(blobs.map(({ key }) => store().get(key, { type: "json" })));
  return values.filter(Boolean);
}

async function requireAdmin() {
  const user = await getUser();
  return isAdmin(user) ? user : null;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET") {
      const article = url.searchParams.get("article");
      if (article && Object.hasOwn(articles, article)) {
        const comments = (await listEntries("approved/"))
          .filter((entry) => entry.article === article)
          .sort((a, b) => a.approvedAt.localeCompare(b.approvedAt))
          .map(({ id, name, comment, approvedAt }) => ({ id, name, comment, approvedAt }));
        return json({ comments }, 200, request.headers.get("origin"));
      }

      if (url.searchParams.get("queue") === "pending") {
        if (!await requireAdmin()) return json({ error: "管理者ログインが必要です。" }, 401);
        const comments = (await listEntries("pending/"))
          .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
        return json({ comments });
      }

      return json({ error: "記事を指定してください。" }, 400);
    }

    if (request.method === "POST") {
      verifyRequestOrigin(request);
      if (!await requireAdmin()) return json({ error: "承認権限がありません。" }, 403);

      let body;
      try { body = await request.json(); }
      catch { return json({ error: "リクエストを読み取れませんでした。" }, 400); }

      const action = String(body?.action ?? "");
      if (action === "create") {
        const article = String(body?.article ?? "");
        const comment = String(body?.comment ?? "").trim();
        const name = String(body?.name ?? "").trim().slice(0, 30) || "管理人";
        if (!Object.hasOwn(articles, article) || !comment || comment.length > 1000) {
          return json({ error: "記事、表示名、コメントを確認してください。" }, 400);
        }

        const createdAt = new Date().toISOString();
        const published = {
          id: crypto.randomUUID(),
          article,
          articleTitle: articles[article],
          name,
          comment,
          submittedAt: createdAt,
          approvedAt: createdAt,
          status: "approved",
        };
        await store().setJSON(`approved/${published.id}`, published);
        return json({ ok: true }, 201);
      }

      const id = String(body?.id ?? "");
      if (!/^[a-f0-9-]{20,64}$/i.test(id) || !["approve", "reject"].includes(action)) {
        return json({ error: "操作内容が正しくありません。" }, 400);
      }

      const pendingKey = `pending/${id}`;
      const comment = await store().get(pendingKey, { type: "json" });
      if (!comment) return json({ error: "この投稿は見つかりません。" }, 404);

      if (action === "approve") {
        const published = { ...comment, status: "approved", approvedAt: new Date().toISOString() };
        await store().setJSON(`approved/${id}`, published);
      }
      await store().delete(pendingKey);
      return json({ ok: true });
    }

    return json({ error: "この操作には対応していません。" }, 405);
  },

  async formSubmitted(event) {
    const fields = event.data ?? {};
    if (fields["form-name"] !== "article-comments" || String(fields["bot-field"] ?? "").trim()) return;

    const article = Object.keys(articles).find((key) => articles[key] === fields.article);
    const comment = String(fields.comment ?? "").trim();
    const name = String(fields.name ?? "").trim().slice(0, 30) || "匿名";
    if (!article || !comment || comment.length > 1000) return;

    const id = crypto.randomUUID();
    const submittedAt = new Date().toISOString();
    await store().setJSON(`approved/${id}`, {
      id,
      article,
      articleTitle: articles[article],
      name,
      comment,
      submittedAt,
      approvedAt: submittedAt,
      status: "approved",
    });
  },
};

export const config = { path: "/api/comments" };
