(() => {
  const container = document.getElementById("comments-widget");
  if (!container) return;

  const backendOrigin = "https://symphonious-griffin-6489ff.netlify.app";
  const pageId = decodeURIComponent(window.location.pathname.split("/").pop() || "")
    .replace(/\.html$/i, "");
  const articleAliases = {
    "article-thread-poison": "poison",
    "article-thread-tenochititlan": "tenoch",
  };
  const articleId = articleAliases[pageId] || pageId;
  const articleTitle = document.querySelector("h1")?.textContent.replace(/\s+/g, " ").trim();

  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = new URL("./comments.css", window.location.href).href;
  document.head.append(stylesheet);

  if (!articleId || !articleTitle) {
    const message = document.createElement("p");
    message.className = "comment-note";
    message.textContent = "コメント欄を読み込めませんでした。";
    container.replaceChildren(message);
    return;
  }

  const note = document.createElement("p");
  note.className = "comment-note";
  note.textContent = "投稿は内容を確認後に掲載します。名前は任意です。個人情報は入力しないでください。";

  const published = document.createElement("div");
  published.className = "published-comments";
  published.setAttribute("aria-live", "polite");

  const heading = document.createElement("h3");
  heading.textContent = "掲載コメント";

  const list = document.createElement("div");
  list.className = "published-comment-list";
  list.setAttribute("aria-live", "polite");
  const loading = document.createElement("p");
  loading.className = "comment-loading";
  loading.textContent = "コメントを読み込んでいます。";
  list.append(loading);
  published.append(heading, list);

  const form = document.createElement("form");
  form.className = "comment-form";
  form.name = "article-comments";
  form.method = "POST";
  form.action = `${backendOrigin}/comment-thanks.html?article=${encodeURIComponent(articleId)}`;
  form.target = "fate-club-comment-frame";
  form.setAttribute("accept-charset", "UTF-8");
  form.setAttribute("data-netlify", "true");
  form.setAttribute("netlify-honeypot", "bot-field");

  const formName = document.createElement("input");
  formName.type = "hidden";
  formName.name = "form-name";
  formName.defaultValue = "article-comments";
  formName.value = "article-comments";

  const article = document.createElement("input");
  article.type = "hidden";
  article.name = "article";
  article.defaultValue = articleTitle;
  article.value = articleTitle;

  const honeypot = document.createElement("div");
  honeypot.className = "comment-honeypot";
  honeypot.setAttribute("aria-hidden", "true");
  const honeypotLabel = document.createElement("label");
  honeypotLabel.textContent = "この欄には入力しないでください";
  const honeypotInput = document.createElement("input");
  honeypotInput.type = "text";
  honeypotInput.name = "bot-field";
  honeypotInput.tabIndex = -1;
  honeypotInput.autocomplete = "off";
  honeypotLabel.append(honeypotInput);
  honeypot.append(honeypotLabel);

  const nameLabel = document.createElement("label");
  nameLabel.htmlFor = "comment-name";
  nameLabel.textContent = "お名前（任意・空欄は匿名）";
  const nameInput = document.createElement("input");
  nameInput.id = "comment-name";
  nameInput.name = "name";
  nameInput.type = "text";
  nameInput.maxLength = 30;
  nameInput.autocomplete = "nickname";
  nameInput.placeholder = "匿名";

  const textLabel = document.createElement("label");
  textLabel.htmlFor = "comment-text";
  textLabel.textContent = "コメント（1000文字まで）";
  const textInput = document.createElement("textarea");
  textInput.id = "comment-text";
  textInput.name = "comment";
  textInput.rows = 5;
  textInput.maxLength = 1000;
  textInput.required = true;
  textInput.placeholder = "記事への感想を書いてください";

  const policy = document.createElement("p");
  policy.className = "comment-policy";
  policy.textContent = "投稿は確認後に掲載します。送信内容に個人情報を含めないでください。";

  const submit = document.createElement("button");
  submit.type = "submit";
  submit.textContent = "コメントを送信";

  const status = document.createElement("p");
  status.className = "comment-submit-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  form.append(formName, article, honeypot, nameLabel, nameInput, textLabel, textInput, policy, submit, status);

  const frame = document.createElement("iframe");
  frame.name = "fate-club-comment-frame";
  frame.title = "コメント送信結果";
  frame.className = "comment-submit-frame";
  frame.setAttribute("aria-hidden", "true");
  frame.tabIndex = -1;

  container.replaceChildren(note, published, form, frame);

  async function loadComments() {
    list.replaceChildren();
    const placeholder = document.createElement("p");
    placeholder.className = "comment-loading";
    placeholder.textContent = "コメントを読み込んでいます。";
    list.append(placeholder);

    try {
      const url = new URL("/api/comments", backendOrigin);
      url.searchParams.set("article", articleId);
      const response = await fetch(url, {cache: "no-store", mode: "cors"});
      if (!response.ok) throw new Error("comments request failed");
      const result = await response.json();
      const comments = Array.isArray(result.comments) ? result.comments : [];
      list.replaceChildren();

      if (!comments.length) {
        const empty = document.createElement("p");
        empty.className = "comment-loading";
        empty.textContent = "掲載コメントはまだありません。";
        list.append(empty);
        return;
      }

      comments.forEach((comment) => {
        const card = document.createElement("article");
        card.className = "published-comment";

        const meta = document.createElement("div");
        meta.className = "published-comment-meta";

        const author = document.createElement("span");
        author.className = "published-comment-author";
        author.textContent = comment.name || "匿名";

        const date = document.createElement("time");
        if (comment.approvedAt) {
          date.dateTime = comment.approvedAt;
          date.textContent = new Date(comment.approvedAt).toLocaleDateString("ja-JP");
        }
        meta.append(author, date);

        const body = document.createElement("p");
        body.className = "published-comment-body";
        body.textContent = comment.comment || "";
        card.append(meta, body);
        list.append(card);
      });
    } catch {
      list.replaceChildren();
      const error = document.createElement("p");
      error.className = "comment-loading";
      error.textContent = "コメントを読み込めませんでした。しばらくしてから再読み込みしてください。";
      list.append(error);
    }
  }

  let submissionTimer;
  form.addEventListener("submit", () => {
    submit.disabled = true;
    status.classList.remove("is-error");
    status.textContent = "送信しています。";
    window.clearTimeout(submissionTimer);
    submissionTimer = window.setTimeout(() => {
      if (!submit.disabled) return;
      submit.disabled = false;
      status.classList.add("is-error");
      status.textContent = "送信を確認できませんでした。時間をおいて、もう一度お試しください。";
    }, 15000);
  });

  window.addEventListener("message", (event) => {
    if (event.origin !== backendOrigin) return;
    if (event.data?.type !== "fate-club-comment-submitted" || event.data.article !== articleId) return;
    window.clearTimeout(submissionTimer);
    submit.disabled = false;
    form.reset();
    status.classList.remove("is-error");
    status.textContent = "投稿を受け付けました。内容を確認後、掲載します。";
  });

  loadComments();
})();
