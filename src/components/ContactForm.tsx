"use client";

import { FormEvent, useState } from "react";

import { SITE_NAME } from "@/lib/siteStructure";

/** Google Forms の formResponse エンドポイント（回答はスプレッドシート等に蓄積） */
const GOOGLE_FORM_ACTION =
  "https://docs.google.com/forms/d/e/1FAIpQLSczZGiMPRcn_E-ofuxD1FG7Mf-RKRyoM-LOJD0DEVJSxeM42Q/formResponse";

const ENTRY = {
  name: "entry.1181480557",
  email: "entry.190049114",
  message: "entry.1527384860",
} as const;

type Status = "idle" | "submitting" | "done" | "error";

/**
 * Google の iframe UI（アカウント表示など）を出さず、
 * サイト内フォームから Google Forms へ送信し、完了メッセージだけ表示する。
 */
export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus("submitting");
    try {
      // no-cors: レスポンスは読めないが送信自体は到達する
      await fetch(GOOGLE_FORM_ACTION, {
        method: "POST",
        mode: "no-cors",
        body: data,
      });
      form.reset();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="contact-form contact-form--done" role="status">
        <p className="contact-form__thanks-title">送信が完了しました</p>
        <p className="contact-form__thanks-body">
          お問い合わせありがとうございます。担当者より順次メールにてご連絡差し上げます。
        </p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <p className="contact-form__lead">
        【{SITE_NAME}】へのご質問やご相談はこちらのフォームよりお寄せください。
        担当者より順次メールにてご連絡差し上げます。
      </p>

      <label className="contact-form__field">
        <span className="contact-form__label">
          お名前 <span className="contact-form__required">必須</span>
        </span>
        <input
          className="contact-form__input"
          type="text"
          name={ENTRY.name}
          required
          autoComplete="name"
          disabled={status === "submitting"}
        />
      </label>

      <label className="contact-form__field">
        <span className="contact-form__label">
          メールアドレス <span className="contact-form__required">必須</span>
        </span>
        <input
          className="contact-form__input"
          type="email"
          name={ENTRY.email}
          required
          autoComplete="email"
          disabled={status === "submitting"}
        />
      </label>

      <label className="contact-form__field">
        <span className="contact-form__label">
          お問い合わせ内容 <span className="contact-form__required">必須</span>
        </span>
        <textarea
          className="contact-form__textarea"
          name={ENTRY.message}
          required
          rows={8}
          disabled={status === "submitting"}
        />
      </label>

      {status === "error" ? (
        <p className="contact-form__error" role="alert">
          送信に失敗しました。時間をおいて再度お試しください。
        </p>
      ) : null}

      <button
        type="submit"
        className="contact-form__submit"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "送信中…" : "送信する"}
      </button>
    </form>
  );
}
