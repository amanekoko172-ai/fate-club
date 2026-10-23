import { acceptInvite, handleAuthCallback } from "@netlify/identity";

const parameters = new URLSearchParams(window.location.hash.slice(1));
if (parameters.has("invite_token")) {
  const dialog = document.getElementById("invite-dialog");
  const form = document.getElementById("invite-form");
  const status = document.getElementById("invite-status");
  const submit = document.getElementById("invite-submit");
  const success = document.getElementById("invite-success");
  let token = "";

  dialog.showModal();
  (async () => {
    try {
      const result = await handleAuthCallback();
      if (result?.type !== "invite" || !result.token) throw new Error("招待リンクを確認できませんでした。招待メールからもう一度開いてください。");
      token = result.token;
      document.getElementById("invite-password").focus();
    } catch {
      form.hidden = true;
      document.getElementById("invite-description").textContent = "招待リンクを確認できませんでした。リンクの期限切れの可能性があります。サイト管理者に招待の再送を依頼してください。";
    }
  })();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = document.getElementById("invite-password").value;
    const confirmation = document.getElementById("invite-password-confirm").value;
    if (!token) return;
    if (password !== confirmation) {
      status.textContent = "2つのパスワードが一致しません。";
      return;
    }

    submit.disabled = true;
    status.textContent = "招待を受け付けています。";
    try {
      await acceptInvite(token, password);
      form.hidden = true;
      status.textContent = "";
      success.style.display = "block";
      document.getElementById("invite-title").textContent = "登録が完了しました";
      document.getElementById("invite-description").textContent = "管理者アカウントを設定しました。コメント管理画面へ進めます。";
    } catch {
      status.textContent = "登録できませんでした。招待の期限やパスワードを確認し、もう一度お試しください。";
      submit.disabled = false;
    }
  });
}
