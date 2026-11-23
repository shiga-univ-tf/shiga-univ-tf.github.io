/**
 * ============================================================================
 * 滋賀大学陸上競技部 ウェブサイト 動作スクリプト (app.js)
 * ============================================================================
 * 1. スマホ版 開閉式メニュー (Header)
 * 2. トップページ：FAQの開閉
 * 3. トップページ：お問い合わせ入力チェック・確認・完了／失敗表示（Yahoo!メール受信対応）
 * 4. 部員紹介ページ：1〜4回生・大学院生（院生）の切り替え
 * 5. 滋賀大記録ページ：カテゴリ切り替え ＆ 詳細から保持者・大会・達成日・会場の表示
 * 6. スマホ表示プレビュー機能
 */

document.addEventListener("DOMContentLoaded", () => {
  const siteData = typeof SITE_DATA !== "undefined" ? SITE_DATA : {};
  const APP_CONSTANTS = {
    defaultTeamName: "滋賀大学陸上競技部",
    defaultPreviewDomain: "shiga-univ-tf.jp",
    defaultFallbackHref: "recruit.html",
    emptyValuePlaceholder: "—",
    defaultGradeKey: "1回生",
    gradeKeys: ["1回生", "2回生", "3回生", "4回生", "院生"],
    defaultRecordCategory: "track",
    recordCategories: {
      track: { label: "トラック種目", aliases: ["トラック", "track"] },
      field: { label: "フィールド種目", aliases: ["フィールド", "field"] },
      road: { label: "ロード・競歩種目", aliases: ["ロード・競歩", "road"] },
      combined: { label: "混成・その他種目", aliases: ["混成", "combined"] }
    },
    headerFallbackHeight: 100,
    hashScrollDelayMs: 30,
    formAnnounceDelayMs: 350,
    maxExtraPbColumns: 5,
    previewDeviceSizes: {
      iphone15: { width: 417, height: 876 },
      iphone14: { width: 414, height: 868 },
      iphonese: { width: 399, height: 767 }
    }
  };

  // --------------------------------------------------------------------------
  // 0. data.js のサイト設定（SNSリンク・連絡先表記）をDOMへ反映
  // --------------------------------------------------------------------------
  function applySiteConfig() {
    const socialCfg = siteData.socialConfig || {};
    const contactCfg = siteData.contactConfig || {};
    const instagramCfg = socialCfg.instagram || {};

    document.querySelectorAll("[data-instagram-campus]").forEach((link) => {
      const campusKey = link.getAttribute("data-instagram-campus") || "";
      const info = instagramCfg[campusKey];
      if (!info) return;

      if (info.url && /^https?:\/\//i.test(info.url.trim())) {
        link.setAttribute("href", info.url.trim());
      }

      if (link.getAttribute("data-instagram-display") === "campus-handle") {
        const labelEl = link.querySelector(".insta-link-text");
        if (labelEl && info.campusLabel && info.handle) {
          labelEl.textContent = `${info.campusLabel} ${info.handle} ↗`;
        }
      }
    });

    document.querySelectorAll("[data-contact-email-note], .form-dest-note").forEach((note) => {
      if (contactCfg.yahooEmail) {
        note.textContent = `送信先：部のYahoo!メール（${contactCfg.yahooEmail}）`;
      } else if (contactCfg.endpointUrl) {
        note.textContent = "送信先：部のお問い合わせ窓口（フォーム送信）";
      }
    });
  }

  applySiteConfig();

  // --------------------------------------------------------------------------
  // 1. スマホ版 開閉式メニュー (Header) ＆ ページ内スクロール位置調整（色の別れ目に合わせる）
  // --------------------------------------------------------------------------
  const siteHeader = document.querySelector(".site-header");
  const menuBtn = document.getElementById("menu-btn");
  const menuBtnIcon = document.getElementById("menu-btn-icon");
  const headerNav = document.getElementById("header-nav");

  function getHeaderHeight() {
    return siteHeader ? Math.ceil(siteHeader.getBoundingClientRect().height) : APP_CONSTANTS.headerFallbackHeight;
  }

  function syncHeaderHeightVar() {
    document.documentElement.style.setProperty("--header-height", `${getHeaderHeight()}px`);
  }

  syncHeaderHeightVar();
  window.addEventListener("resize", syncHeaderHeightVar);

  function scrollToSectionBoundary(hash, smooth = true) {
    if (!hash || hash === "#") return false;
    const id = decodeURIComponent(hash.replace(/^#/, ""));
    const targetEl = document.getElementById(id);
    if (!targetEl) return false;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const headerH = getHeaderHeight();
    const targetTop = targetEl.getBoundingClientRect().top + window.scrollY - headerH;
    window.scrollTo({
      top: Math.max(0, targetTop),
      behavior: smooth && !prefersReducedMotion ? "smooth" : "auto"
    });
    return true;
  }

  function closeMobileMenu(restoreFocus = false) {
    if (!menuBtn || !headerNav) return;
    const wasOpen = headerNav.classList.contains("open");
    headerNav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    if (menuBtnIcon) {
      menuBtnIcon.textContent = "☰";
    }
    if (restoreFocus && wasOpen) {
      menuBtn.focus();
    }
  }

  if (menuBtn && headerNav) {
    menuBtn.addEventListener("click", () => {
      const isOpen = headerNav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(isOpen));
      if (menuBtnIcon) {
        menuBtnIcon.textContent = isOpen ? "✕" : "☰";
      }
    });

    headerNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => closeMobileMenu(false));
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && headerNav.classList.contains("open")) {
        closeMobileMenu(true);
      }
    });
  }

  // 同一ページ内のアンカーリンク押下時、上のセクターとの色の別れ目（ヘッダー直下）へ移動
  document.querySelectorAll('a[href*="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (e) => {
      const href = anchor.getAttribute("href") || "";
      if (href === "#") return;

      const url = new URL(href, window.location.href);
      const isSamePage =
        url.pathname === window.location.pathname ||
        url.pathname.replace(/\/index\.html$/, "/") === window.location.pathname.replace(/\/index\.html$/, "/");

      if (isSamePage && url.hash) {
        if (scrollToSectionBoundary(url.hash, true)) {
          e.preventDefault();
          history.pushState(null, "", url.hash);
        }
      }
    });
  });

  // 別ページからハッシュ付き（例: recruit.html#practice, index.html#faq）で遷移してきた場合の位置補正
  if (window.location.hash) {
    setTimeout(() => {
      scrollToSectionBoundary(window.location.hash, false);
    }, APP_CONSTANTS.hashScrollDelayMs);
  }

  // --------------------------------------------------------------------------
  // 2. FAQの開閉 (19:17 PC / 19:35 SP) ＆ ページ内検索(beforematch)連動
  // --------------------------------------------------------------------------
  const faqBoxes = document.querySelectorAll("[data-faq-box]");

  function setFaqState(box, open) {
    const trigger = box.querySelector(".faq-trigger");
    const answer = box.querySelector(".faq-answer");
    box.classList.toggle("is-open", open);
    if (trigger) {
      trigger.setAttribute("aria-expanded", String(open));
      const baseQ = trigger.getAttribute("data-faq-question") || "";
      if (baseQ) {
        trigger.textContent = `${baseQ}  ${open ? "−" : "＋"}`;
      }
    }
    if (answer) {
      answer.hidden = open ? false : "until-found";
    }
  }

  faqBoxes.forEach((box) => {
    const trigger = box.querySelector(".faq-trigger");
    const answer = box.querySelector(".faq-answer");
    if (!trigger) return;

    trigger.addEventListener("click", () => {
      const nextOpen = !box.classList.contains("is-open");
      setFaqState(box, nextOpen);
    });

    if (answer) {
      answer.addEventListener("beforematch", () => {
        setFaqState(box, true);
      });
    }
  });

  // --------------------------------------------------------------------------
  // 3. お問い合わせ：入力チェック → 確認 → 送信完了・失敗の表示 (Yahoo!メール受信対応)
  // --------------------------------------------------------------------------
  const contactForm = document.getElementById("contact-form");
  const confirmView = document.getElementById("form-confirm-view");
  const confirmHeading = document.getElementById("form-confirm-heading");
  const resultView = document.getElementById("form-result-view");
  const resultBanner = document.getElementById("form-result-banner");

  const nameInput = document.getElementById("contact-name");
  const emailInput = document.getElementById("contact-email");
  const messageInput = document.getElementById("contact-message");
  const consentInput = document.getElementById("contact-consent");

  const errName = document.getElementById("err-name");
  const errEmail = document.getElementById("err-email");
  const errMessage = document.getElementById("err-message");
  const errConsent = document.getElementById("err-consent");

  const confirmNameVal = document.getElementById("confirm-name-val");
  const confirmEmailVal = document.getElementById("confirm-email-val");
  const confirmMessageVal = document.getElementById("confirm-message-val");

  const btnBackEdit = document.getElementById("btn-back-edit");
  const btnSendFinal = document.getElementById("btn-send-final");
  const btnResetForm = document.getElementById("btn-reset-form");

  // フォームエラー用 aria-describedby / aria-invalid / ライブリージョン同期
  const formAnnouncer = document.createElement("div");
  formAnnouncer.setAttribute("aria-live", "polite");
  formAnnouncer.className = "visually-hidden";
  document.body.append(formAnnouncer);
  let formAnnounceTimer;

  function linkFieldError(el, shown) {
    if (!el) return;
    const errorId = el.dataset.error;
    if (!errorId) return;
    const ids = (el.getAttribute("aria-describedby") || "")
      .split(/\s+/)
      .filter((id) => id && id !== errorId);
    if (shown) ids.push(errorId);
    if (ids.length) el.setAttribute("aria-describedby", ids.join(" "));
    else el.removeAttribute("aria-describedby");
  }

  function setFieldErrorState(el, errorEl, isInvalid, announce = false) {
    if (!el) return;
    el.setAttribute("aria-invalid", isInvalid ? "true" : "false");
    el.classList.toggle("has-error", isInvalid);
    linkFieldError(el, isInvalid);
    if (errorEl) {
      errorEl.classList.toggle("visible", isInvalid);
      if (isInvalid && announce) {
        clearTimeout(formAnnounceTimer);
        formAnnouncer.textContent = "";
        formAnnounceTimer = setTimeout(() => {
          formAnnouncer.textContent = errorEl.textContent.trim();
        }, APP_CONSTANTS.formAnnounceDelayMs);
      }
    }
  }

  function validateSingleField(el) {
    if (el === nameInput) {
      return { valid: Boolean(nameInput.value.trim()), errorEl: errName };
    }
    if (el === emailInput) {
      const emailVal = emailInput.value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return { valid: Boolean(emailVal && emailRegex.test(emailVal)), errorEl: errEmail };
    }
    if (el === messageInput) {
      return { valid: Boolean(messageInput.value.trim()), errorEl: errMessage };
    }
    if (el === consentInput) {
      return { valid: Boolean(consentInput.checked), errorEl: errConsent };
    }
    return { valid: true, errorEl: null };
  }

  function validateForm() {
    const fields = [nameInput, emailInput, messageInput, consentInput].filter(Boolean);
    let firstInvalid = null;

    fields.forEach((field) => {
      const { valid, errorEl } = validateSingleField(field);
      setFieldErrorState(field, errorEl, !valid, false);
      if (!valid && !firstInvalid) {
        firstInvalid = field;
      }
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return false;
    }
    return true;
  }

  if (contactForm && confirmView && resultView) {
    [nameInput, emailInput, messageInput].forEach((input) => {
      if (!input) return;
      input.addEventListener("blur", () => {
        const { valid, errorEl } = validateSingleField(input);
        if (!valid || input.getAttribute("aria-invalid") === "true") {
          setFieldErrorState(input, errorEl, !valid, !valid);
        }
      });
      input.addEventListener("input", () => {
        if (input.getAttribute("aria-invalid") === "true") {
          const { valid, errorEl } = validateSingleField(input);
          if (valid) {
            setFieldErrorState(input, errorEl, false, false);
          }
        }
        input.classList.remove("has-error");
      });
    });

    if (consentInput) {
      consentInput.addEventListener("change", () => {
        const { valid, errorEl } = validateSingleField(consentInput);
        setFieldErrorState(consentInput, errorEl, !valid, !valid);
      });
    }

    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      confirmNameVal.textContent = nameInput.value.trim();
      confirmEmailVal.textContent = emailInput.value.trim();
      confirmMessageVal.textContent = messageInput.value.trim();

      contactForm.style.display = "none";
      confirmView.classList.add("active");
      if (confirmHeading) confirmHeading.focus();
    });

    if (btnBackEdit) {
      btnBackEdit.addEventListener("click", () => {
        confirmView.classList.remove("active");
        contactForm.style.display = "flex";
        if (nameInput) nameInput.focus();
      });
    }

    if (btnSendFinal) {
      btnSendFinal.addEventListener("click", async () => {
        const payload = {
          name: nameInput.value.trim(),
          email: emailInput.value.trim(),
          message: messageInput.value.trim()
        };

        const cfg = siteData.contactConfig || {};
        btnSendFinal.disabled = true;

        try {
          if (cfg.endpointUrl) {
            const response = await fetch(cfg.endpointUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json"
              },
              body: JSON.stringify(payload)
            });

            if (!response.ok) {
              throw new Error(`送信エラー (${response.status})`);
            }

            resultBanner.className = "status-banner status-banner--success";
            resultBanner.innerHTML =
              "<strong>送信が完了しました。</strong><br>お問い合わせありがとうございます。内容を確認のうえ、担当者よりご連絡いたします。";
          } else if (cfg.yahooEmail) {
            const teamName = (siteData.siteConfig && siteData.siteConfig.teamName) || APP_CONSTANTS.defaultTeamName;
            const subject = encodeURIComponent(`【${teamName}HP お問い合わせ】${payload.name}様`);
            const body = encodeURIComponent(
              `お名前: ${payload.name}\nメールアドレス: ${payload.email}\n\nお問い合わせ内容:\n${payload.message}`
            );
            window.location.href = `mailto:${cfg.yahooEmail}?subject=${subject}&body=${body}`;

            resultBanner.className = "status-banner status-banner--success";
            resultBanner.innerHTML =
              "<strong>メール作成画面を起動しました。</strong><br>メールソフトから送信を完了してください。";
          } else {
            resultBanner.className = "status-banner status-banner--success";
            resultBanner.innerHTML =
              "<strong>【確認モード】送信完了表示テスト</strong><br>入力チェックおよび確認ステップが完了しました（※現在、送信先の部のYahoo!メールは接続・宛先設定前です。data.js の contactConfig で接続後に実送信されます）。";
          }
        } catch (err) {
          resultBanner.className = "status-banner status-banner--error";
          resultBanner.innerHTML =
            "<strong>送信に失敗しました。</strong><br>通信環境をご確認のうえ再度お試しいただくか、各キャンパスのInstagramのDMよりご連絡ください。";
        } finally {
          btnSendFinal.disabled = false;
          confirmView.classList.remove("active");
          resultView.classList.add("active");
          if (resultBanner) resultBanner.focus();
        }
      });
    }

    if (btnResetForm) {
      btnResetForm.addEventListener("click", () => {
        contactForm.reset();
        [nameInput, emailInput, messageInput, consentInput].forEach((el) => {
          const { errorEl } = validateSingleField(el);
          setFieldErrorState(el, errorEl, false, false);
        });
        resultView.classList.remove("active");
        contactForm.style.display = "flex";
        if (nameInput) nameInput.focus();
      });
    }
  }

  // --------------------------------------------------------------------------
  // 共通ユーティリティ（HTMLエスケープ / URLサニタイズ / WAI-ARIAタブ制御）
  // --------------------------------------------------------------------------
  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeHref(rawUrl) {
    const trimmed = String(rawUrl || "").trim();
    if (!trimmed) return APP_CONSTANTS.defaultFallbackHref;
    if (/^(https?:\/\/|\/|\.\/|[a-zA-Z0-9_-]+\.html(#.*)?$|#)/.test(trimmed)) {
      return escapeHtml(trimmed);
    }
    return APP_CONSTANTS.defaultFallbackHref;
  }

  function setupTablist(tabs, panelEl, onSelect) {
    if (!tabs || tabs.length === 0) return;

    function activateTab(tab, moveFocus = false) {
      tabs.forEach((t) => {
        const active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", String(active));
        t.tabIndex = active ? 0 : -1;
      });
      if (panelEl && tab.id) {
        panelEl.setAttribute("aria-labelledby", tab.id);
      }
      if (moveFocus) {
        tab.focus();
      }
      if (typeof tab.scrollIntoView === "function") {
        tab.scrollIntoView({ block: "nearest", inline: "nearest" });
      }
      onSelect(tab);
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activateTab(tab, false));
      tab.addEventListener("keydown", (e) => {
        let nextIndex = null;
        if (e.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
        else if (e.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (e.key === "Home") nextIndex = 0;
        else if (e.key === "End") nextIndex = tabs.length - 1;

        if (nextIndex !== null) {
          e.preventDefault();
          activateTab(tabs[nextIndex], true);
        }
      });
    });
  }

  // --------------------------------------------------------------------------
  // 4. 部員紹介ページ：1〜4回生・大学院生（院生）で切り替える (19:82 PC / 19:102 SP)
  // --------------------------------------------------------------------------
  const gradeTabs = document.querySelectorAll("[data-grade-tab]");
  const membersPanel = document.getElementById("members-panel");
  const membersGradeHeading = document.getElementById("members-grade-heading");
  const membersCardsGrid = document.getElementById("members-cards-grid");

  function parseMemberPbs(rawList, fallbackEvent) {
    const inputs = Array.isArray(rawList) ? rawList : [rawList];
    const items = [];

    inputs.forEach((raw) => {
      if (raw && typeof raw === "object") {
        const ev = String(raw.event || fallbackEvent || "").trim();
        const val = String(raw.value || "").trim();
        if (val || ev) {
          items.push({ event: ev, value: val || APP_CONSTANTS.emptyValuePlaceholder });
        }
        return;
      }

      const text = String(raw || "").trim();
      if (!text) return;

      const entries = text
        .split(/\r?\n|[/／;；、]+|,\s*(?=\S+[\s　]+\S)/)
        .map((s) => s.trim())
        .filter(Boolean);

      entries.forEach((entry) => {
        const colonMatch = entry.match(/^([^:：\s　][^:：]*?)(?:\s*：\s*|:\s+)(.+)$/);
        if (colonMatch) {
          items.push({ event: colonMatch[1].trim(), value: colonMatch[2].trim() });
          return;
        }

        const spaceMatch = entry.match(/^(\S+)[\s　]+(.+)$/);
        if (spaceMatch) {
          const left = spaceMatch[1].trim();
          const right = spaceMatch[2].trim();
          const leftLooksLikeTimeWithWind = /^\d+(?:秒|['′"″分:.])/.test(left) && /^\(/.test(right);
          if (!leftLooksLikeTimeWithWind) {
            items.push({ event: left, value: right });
            return;
          }
        }

        items.push({ event: String(fallbackEvent || "").trim(), value: entry });
      });
    });

    if (items.length === 0) {
      return [{ event: String(fallbackEvent || "").trim(), value: APP_CONSTANTS.emptyValuePlaceholder }];
    }
    return items;
  }

  function resolveMemberRole(rawRole) {
    const text = String(rawRole || "").trim();
    if (!text) {
      return { label: "選手", isManager: false };
    }
    const normalized = text.toLowerCase();
    if (
      text.includes("マネ") ||
      normalized === "mg" ||
      normalized === "mgr" ||
      normalized.includes("manager")
    ) {
      return { label: "マネージャー", isManager: true };
    }
    return { label: text, isManager: false };
  }

  function renderMembersForGrade(gradeKey) {
    if (!membersCardsGrid || !siteData.membersByGrade) return;

    const list = siteData.membersByGrade[gradeKey] || [];
    if (membersGradeHeading) {
      membersGradeHeading.textContent = gradeKey === "院生" ? "大学院生（院生）" : gradeKey;
    }

    if (list.length === 0) {
      membersCardsGrid.innerHTML = `<p class="records-empty-msg">現在この学年の部員データは登録されていません。</p>`;
      return;
    }

    membersCardsGrid.innerHTML = list
      .map((m) => {
        const roleInfo = resolveMemberRole(m.role);
        const pbItems = Array.isArray(m.pbList)
          ? m.pbList
          : parseMemberPbs(m.pb, m.fallbackEvent || m.eventTag);

        const pbBoxHtml =
          pbItems.length > 0
            ? `
          <div class="member-pb-box">
            <p class="member-pb-label">PERSONAL BEST</p>
            <dl class="member-pb-list">
              ${pbItems
                .map(
                  (item) => `
              <div class="member-pb-item">
                ${item.event ? `<dt class="member-pb-event">${escapeHtml(item.event)}</dt>` : ""}
                <dd class="member-pb-value">${escapeHtml(item.value)}</dd>
              </div>
            `
                )
                .join("")}
            </dl>
          </div>`
            : "";

        const eventTagHtml = m.eventTag
          ? `<p class="member-event-tag">${escapeHtml(m.eventTag)}</p>`
          : "";

        return `
        <article class="member-card${roleInfo.isManager ? " member-card--manager" : ""}">
          <div class="member-card-top">
            <div class="member-card-tags">
              <span class="member-role-badge ${roleInfo.isManager ? "member-role-badge--manager" : "member-role-badge--athlete"}">${escapeHtml(roleInfo.label)}</span>
              ${eventTagHtml}
            </div>
            <p class="member-num">${escapeHtml(m.num)}</p>
          </div>
          <p class="member-kana">${escapeHtml(m.kana)}</p>
          <h3 class="member-name">${escapeHtml(m.name)}</h3>
          <p class="member-faculty">${escapeHtml(m.facultyGrade)}</p>
          <div class="member-details">
            <p>出身高校   ${escapeHtml(m.highSchool)}</p>
          </div>
          ${pbBoxHtml}
          <p class="member-comment">${escapeHtml(m.comment)}</p>
        </article>
      `;
      })
      .join("");
  }

  if (gradeTabs.length > 0 && membersCardsGrid) {
    setupTablist(Array.from(gradeTabs), membersPanel, (tab) => {
      const gradeKey = tab.getAttribute("data-grade-tab") || APP_CONSTANTS.defaultGradeKey;
      renderMembersForGrade(gradeKey);
    });
  }

  // --------------------------------------------------------------------------
  // 5. 滋賀大記録ページ：カテゴリ別切り替え ＆ 詳細表示 (19:118 PC / 19:138 SP)
  // --------------------------------------------------------------------------
  const recordCatTabs = document.querySelectorAll("[data-record-cat]");
  const recordsPanel = document.getElementById("records-panel");
  const recordsCatHeading = document.getElementById("records-cat-heading");
  const recordsMenList = document.getElementById("records-men-list");
  const recordsWomenList = document.getElementById("records-women-list");

  const recordDetailSection = document.getElementById("record-detail-section");
  const recordDetailCard = document.getElementById("record-detail-card");
  const detailEventTitle = document.getElementById("detail-event-title");
  const detailRecordValue = document.getElementById("detail-record-value");
  const detailHolder = document.getElementById("detail-holder");
  const detailDate = document.getElementById("detail-date");
  const detailTournament = document.getElementById("detail-tournament");
  const detailPlace = document.getElementById("detail-place");
  const detailCloseBtn = document.getElementById("detail-close-btn");

  let currentRecordCategory = APP_CONSTANTS.defaultRecordCategory;

  function updateDetailCard(genderLabel, item) {
    if (!item || !recordDetailCard) return;
    recordDetailCard.style.display = "flex";
    if (detailEventTitle) detailEventTitle.textContent = `${genderLabel} ${item.event}`;
    if (detailRecordValue) detailRecordValue.textContent = item.record;
    if (detailHolder) detailHolder.textContent = item.holder || APP_CONSTANTS.emptyValuePlaceholder;
    if (detailDate) detailDate.textContent = item.date || APP_CONSTANTS.emptyValuePlaceholder;
    if (detailTournament) detailTournament.textContent = item.tournament || APP_CONSTANTS.emptyValuePlaceholder;
    if (detailPlace) detailPlace.textContent = item.place || APP_CONSTANTS.emptyValuePlaceholder;
  }

  function renderRecordList(container, items, genderLabel, selectFirstByDefault) {
    if (!container) return;

    if (!items || items.length === 0) {
      container.innerHTML = `<p class="records-empty-msg">現在このカテゴリの${escapeHtml(genderLabel)}記録データは登録されていません。</p>`;
      return;
    }

    container.innerHTML = items
      .map((item, idx) => {
        const isFirstSelected = selectFirstByDefault && idx === 0;
        const inlineId = `record-inline-${genderLabel === "男子" ? "m" : "w"}-${idx}`;
        return `
          <div class="record-item-wrap">
            <button type="button" class="record-row-btn${isFirstSelected ? " is-selected" : ""}"
              data-gender="${escapeHtml(genderLabel)}"
              data-idx="${idx}"
              aria-controls="${inlineId}"
              aria-expanded="${isFirstSelected ? "true" : "false"}">
              <span class="record-row-event">${escapeHtml(item.event)}</span>
              <span class="record-row-val">${escapeHtml(item.record)}</span>
              <span class="record-row-plus" aria-hidden="true">${isFirstSelected ? "−" : "＋"}</span>
            </button>
            <div id="${inlineId}" class="record-inline-detail${isFirstSelected ? " is-open" : ""}">
              <div class="record-inline-line"><span>記録保持者</span><strong>${escapeHtml(item.holder || APP_CONSTANTS.emptyValuePlaceholder)}</strong></div>
              <div class="record-inline-line"><span>達成日</span><span>${escapeHtml(item.date || APP_CONSTANTS.emptyValuePlaceholder)}</span></div>
              <div class="record-inline-line"><span>大会</span><span>${escapeHtml(item.tournament || APP_CONSTANTS.emptyValuePlaceholder)}</span></div>
              <div class="record-inline-line"><span>会場</span><span>${escapeHtml(item.place || APP_CONSTANTS.emptyValuePlaceholder)}</span></div>
            </div>
          </div>
        `;
      })
      .join("");

    // 各行クリックでインライン詳細を開閉し、下部の RECORD DETAIL カードも同時更新
    container.querySelectorAll(".record-row-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = Number(btn.getAttribute("data-idx") || 0);
        const item = items[idx];
        const wrap = btn.closest(".record-item-wrap");
        const inlineDetail = wrap ? wrap.querySelector(".record-inline-detail") : null;
        const plusIcon = btn.querySelector(".record-row-plus");

        const wasOpen = inlineDetail ? inlineDetail.classList.contains("is-open") : false;

        // 他の行の選択状態をリセット
        document.querySelectorAll(".record-row-btn").forEach((b) => {
          b.classList.remove("is-selected");
          b.setAttribute("aria-expanded", "false");
          const p = b.querySelector(".record-row-plus");
          if (p) p.textContent = "＋";
        });
        document.querySelectorAll(".record-inline-detail").forEach((d) => {
          d.classList.remove("is-open");
        });

        if (!wasOpen) {
          btn.classList.add("is-selected");
          btn.setAttribute("aria-expanded", "true");
          if (plusIcon) plusIcon.textContent = "−";
          if (inlineDetail) inlineDetail.classList.add("is-open");
          updateDetailCard(genderLabel, item);
        }
      });
    });
  }

  function renderRecordsCategory(catKey) {
    if (!siteData.recordsByCategory) return;
    const catData = siteData.recordsByCategory[catKey];
    if (!catData) return;

    currentRecordCategory = catKey;
    if (recordsCatHeading) {
      recordsCatHeading.textContent = catData.label;
    }

    renderRecordList(recordsMenList, catData.men, "男子", true);
    renderRecordList(recordsWomenList, catData.women, "女子", false);

    // 初期詳細カードを先頭の記録にセット
    if (catData.men && catData.men.length > 0) {
      updateDetailCard("男子", catData.men[0]);
    } else if (catData.women && catData.women.length > 0) {
      updateDetailCard("女子", catData.women[0]);
    }
  }

  if (recordsMenList && recordsWomenList) {
    renderRecordsCategory(currentRecordCategory);

    setupTablist(Array.from(recordCatTabs), recordsPanel, (tab) => {
      const catKey = tab.getAttribute("data-record-cat") || APP_CONSTANTS.defaultRecordCategory;
      renderRecordsCategory(catKey);
    });

    if (detailCloseBtn && recordDetailCard) {
      detailCloseBtn.addEventListener("click", () => {
        recordDetailCard.style.display = "none";
        document.querySelectorAll(".record-row-btn").forEach((b) => {
          b.classList.remove("is-selected");
          b.setAttribute("aria-expanded", "false");
          const p = b.querySelector(".record-row-plus");
          if (p) p.textContent = "＋";
        });
        document.querySelectorAll(".record-inline-detail").forEach((d) => {
          d.classList.remove("is-open");
        });
      });
    }
  }

  // --------------------------------------------------------------------------
  // 5.5 Googleスプレッドシート（CSV公開URL）からの自動データ同期
  // --------------------------------------------------------------------------
  function parseCsv(text) {
    const rows = [];
    let current = [];
    let cell = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (inQuotes) {
        if (ch === '"' && next === '"') {
          cell += '"';
          i++;
        } else if (ch === '"') {
          inQuotes = false;
        } else {
          cell += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          current.push(cell.trim());
          cell = "";
        } else if (ch === "\n" || (ch === "\r" && next === "\n")) {
          if (ch === "\r") i++;
          current.push(cell.trim());
          if (current.some((v) => v !== "")) {
            rows.push(current);
          }
          current = [];
          cell = "";
        } else {
          cell += ch;
        }
      }
    }
    current.push(cell.trim());
    if (current.some((v) => v !== "")) {
      rows.push(current);
    }

    if (rows.length < 2) return [];
    const headers = rows[0].map((h) => h.replace(/^\uFEFF/, "").trim());
    return rows.slice(1).map((r) => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = r[idx] !== undefined ? r[idx] : "";
      });
      return obj;
    });
  }

  function getCurrentAcademicYear() {
    if (siteData.googleSheetConfig && siteData.googleSheetConfig.currentAcademicYear) {
      return Number(siteData.googleSheetConfig.currentAcademicYear);
    }
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1〜3月は前年度扱い
    return month >= 4 ? year : year - 1;
  }

  async function syncFromGoogleSheets() {
    if (!siteData.googleSheetConfig) return;
    const sheetCfg = siteData.googleSheetConfig;

    // ① お知らせシートの同期
    const topNewsListEl = document.getElementById("top-news-list");
    if (sheetCfg.newsCsvUrl && topNewsListEl) {
      try {
        const res = await fetch(sheetCfg.newsCsvUrl, { cache: "no-store" });
        if (res.ok) {
          const items = parseCsv(await res.text());
          if (items.length > 0) {
            topNewsListEl.innerHTML = items
              .map((row) => {
                const cat = escapeHtml(row["カテゴリ"] || row["category"] || "お知らせ");
                const title = escapeHtml(row["タイトル"] || row["title"] || "");
                const status = escapeHtml(row["状態・日付"] || row["statusText"] || "詳細を見る →");
                const href = safeHref(row["リンク先"] || row["href"] || APP_CONSTANTS.defaultFallbackHref);
                return `
                  <a href="${href}" class="news-row">
                    <span class="news-cat">${cat}</span>
                    <span class="news-title">${title}</span>
                    <span class="news-status">${status}</span>
                  </a>
                `;
              })
              .join("");
          }
        }
      } catch (e) {
        console.warn("お知らせCSVの取得に失敗したため初期データを表示します:", e);
      }
    }

    // ② 部員紹介シートの同期（入学年度から1〜4回生を自動計算、卒業生は自動除外）
    if (sheetCfg.membersCsvUrl && membersCardsGrid) {
      try {
        const res = await fetch(sheetCfg.membersCsvUrl, { cache: "no-store" });
        if (res.ok) {
          const rows = parseCsv(await res.text());
          if (rows.length > 0) {
            const academicYear = getCurrentAcademicYear();
            const grouped = Object.fromEntries(APP_CONSTANTS.gradeKeys.map((key) => [key, []]));

            rows.forEach((row) => {
              const course = (row["課程・区分"] || row["区分"] || "学部").trim();
              const admissionYear = Number(row["入学年度"] || row["admissionYear"] || 0);
              let gradeKey = row["学年"] || "";

              if (course.includes("院") || gradeKey.includes("院")) {
                const gradDiff = admissionYear ? academicYear - admissionYear + 1 : 1;
                if (gradDiff >= 1 && gradDiff <= 2) {
                  gradeKey = "院生";
                } else {
                  return; // 修了生は自動非表示
                }
              } else if (admissionYear > 0) {
                const gradeNum = academicYear - admissionYear + 1;
                if (gradeNum >= 1 && gradeNum <= 4) {
                  gradeKey = `${gradeNum}回生`;
                } else {
                  return; // 4回生を超えた卒業生は自動で非表示
                }
              }

              if (!grouped[gradeKey]) return;

              const idxNum = String(grouped[gradeKey].length + 1).padStart(2, "0");
              const faculty = row["学部・研究科"] || row["学部"] || "";
              const displayGrade = gradeKey === "院生" ? "大学院生" : gradeKey;
              const rawRole =
                row["役割"] ||
                row["選手・マネージャー"] ||
                row["選手/マネージャー"] ||
                row["役職"] ||
                row["種別"] ||
                "";
              const roleInfo = resolveMemberRole(rawRole);
              const specialty = row["専門種目"] || row["種目"] || "";
              const headingEvent = row["見出し種目"] || "";
              const fallbackEvent = headingEvent || specialty || "";
              const rawPbTexts = [
                row["自己ベスト"] || row["PB"] || row["パーソナルベスト"] || ""
              ];
              for (let n = 2; n <= APP_CONSTANTS.maxExtraPbColumns; n++) {
                const extraPb =
                  row[`自己ベスト${n}`] || row[`PB${n}`] || row[`パーソナルベスト${n}`];
                if (extraPb) rawPbTexts.push(extraPb);
              }

              const hasTextPb = rawPbTexts.some((t) => String(t || "").trim() !== "");
              const pbList = hasTextPb ? parseMemberPbs(rawPbTexts, fallbackEvent) : [];
              for (let n = 1; n <= APP_CONSTANTS.maxExtraPbColumns; n++) {
                const evCol = String(row[`種目${n}`] || "").trim();
                const recCol = String(row[`記録${n}`] || "").trim();
                if (evCol || recCol) {
                  pbList.push({ event: evCol || fallbackEvent, value: recCol || APP_CONSTANTS.emptyValuePlaceholder });
                }
              }
              if (pbList.length === 0 && !roleInfo.isManager) {
                pbList.push({ event: fallbackEvent, value: APP_CONSTANTS.emptyValuePlaceholder });
              }

              const pbEvents = Array.from(new Set(pbList.map((p) => p.event).filter(Boolean)));
              const resolvedEventTag =
                headingEvent ||
                (pbEvents.length > 0 ? pbEvents.join(" / ") : roleInfo.isManager ? "" : specialty || "TRACK & FIELD");

              const rawComment = row["一言"] || row["コメント"] || "";
              const formattedComment =
                rawComment && !rawComment.startsWith("「") ? `「${rawComment}」` : rawComment;

              grouped[gradeKey].push({
                num: idxNum,
                role: roleInfo.label,
                eventTag: resolvedEventTag,
                kana: row["フリガナ"] || row["カナ"] || "",
                name: row["氏名"] || row["名前"] || "",
                facultyGrade: faculty ? `${faculty}  /  ${displayGrade}` : displayGrade,
                highSchool: row["出身高校"] || APP_CONSTANTS.emptyValuePlaceholder,
                fallbackEvent,
                pbList,
                comment: formattedComment
              });
            });

            siteData.membersByGrade = grouped;
            const activeTab = document.querySelector(".grade-tab.is-active");
            const activeGrade = (activeTab && activeTab.getAttribute("data-grade-tab")) || APP_CONSTANTS.defaultGradeKey;
            renderMembersForGrade(activeGrade);
          }
        }
      } catch (e) {
        console.warn("部員紹介CSVの取得に失敗したため初期データを表示します:", e);
      }
    }

    // ③ 滋賀大記録シートの同期
    if (sheetCfg.recordsCsvUrl && recordsMenList && recordsWomenList) {
      try {
        const res = await fetch(sheetCfg.recordsCsvUrl, { cache: "no-store" });
        if (res.ok) {
          const rows = parseCsv(await res.text());
          if (rows.length > 0) {
            const catMap = {};
            const nextRecords = {};
            Object.entries(APP_CONSTANTS.recordCategories).forEach(([key, def]) => {
              def.aliases.forEach((alias) => {
                catMap[alias] = key;
              });
              nextRecords[key] = { label: def.label, men: [], women: [] };
            });

            rows.forEach((row) => {
              const rawCat = (row["カテゴリ"] || "トラック").trim();
              const catKey = catMap[rawCat] || APP_CONSTANTS.defaultRecordCategory;
              const gender = (row["性別"] || "男子").trim();
              const targetArr = gender.includes("女") ? nextRecords[catKey].women : nextRecords[catKey].men;

              targetArr.push({
                event: row["種目"] || "",
                record: row["記録"] || "",
                holder: row["記録保持者"] || "",
                date: row["達成日"] || "",
                tournament: row["大会"] || "",
                place: row["会場"] || ""
              });
            });

            siteData.recordsByCategory = nextRecords;
            renderRecordsCategory(currentRecordCategory);
          }
        }
      } catch (e) {
        console.warn("滋賀大記録CSVの取得に失敗したため初期データを表示します:", e);
      }
    }
  }

  syncFromGoogleSheets();

  // --------------------------------------------------------------------------
  // 6. スマホ表示プレビュー機能（iPhone Dynamic Island / ノッチ / Safari実画面再現）
  // --------------------------------------------------------------------------
  const previewBtn = document.getElementById("mobile-preview-btn");
  const previewModal = document.getElementById("mobile-preview-modal");

  // iframe内部で表示されている場合は右下のプレビューボタンを非表示にし、スクロールバーも消す
  if (window.self !== window.top || window.location.search.includes("mobile_preview=1")) {
    document.documentElement.classList.add("in-mobile-preview");
    if (previewBtn) {
      previewBtn.style.display = "none";
    }
  }

  if (previewBtn && previewModal && window.self === window.top) {
    const previewDomain =
      (siteData.siteConfig && siteData.siteConfig.previewDomain) || APP_CONSTANTS.defaultPreviewDomain;
    // 既存のモーダル内部を iPhone 実機シミュレーター構造へアップグレード
    previewModal.innerHTML = `
      <div class="mobile-preview-toolbar">
        <div class="preview-toolbar-group">
          <span>📱 機種切替：</span>
          <button type="button" class="preview-device-btn is-active" data-device-model="iphone15">
            iPhone 15/16（Dynamic Island）
          </button>
          <button type="button" class="preview-device-btn" data-device-model="iphone14">
            iPhone 13/14（ノッチ）
          </button>
          <button type="button" class="preview-device-btn" data-device-model="iphonese">
            iPhone SE
          </button>
        </div>
        <div class="preview-toolbar-group">
          <button type="button" id="preview-safari-toggle" class="preview-safari-toggle is-active">
            Safari下部バー：表示中
          </button>
          <button type="button" id="mobile-preview-close" class="mobile-preview-close">
            ✕ PC表示に戻る
          </button>
        </div>
      </div>

      <div id="iphone-stage" class="iphone-stage">
        <div id="mobile-device-frame" class="mobile-device-frame" data-model="iphone15">
          <div class="iphone-screen">
            <!-- 上部 iOSステータスバー ＆ Dynamic Island（内カメ） / ノッチ -->
            <div class="ios-status-bar">
              <span id="ios-clock" class="ios-time">9:41</span>
              <div class="ios-cutout" title="Dynamic Island / フロントカメラ領域">
                <span class="ios-camera-lens"></span>
              </div>
              <div class="ios-status-icons" aria-hidden="true">
                <!-- 電波・Wi-Fi・バッテリーアイコン -->
                <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
                  <rect x="0" y="7" width="3" height="4" rx="0.8"/>
                  <rect x="4.2" y="5" width="3" height="6" rx="0.8"/>
                  <rect x="8.4" y="2.5" width="3" height="8.5" rx="0.8"/>
                  <rect x="12.6" y="0" width="3" height="11" rx="0.8"/>
                </svg>
                <span style="font-size: 11px; font-weight: 700;">5G</span>
                <svg width="22" height="11" viewBox="0 0 22 11" fill="none">
                  <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" stroke="currentColor" stroke-opacity="0.85"/>
                  <rect x="2" y="2" width="14" height="7" rx="1.2" fill="currentColor"/>
                  <path d="M20 3.5V7.5C20.8 7.1 21.3 6.3 21.3 5.5C21.3 4.7 20.8 3.9 20 3.5Z" fill="currentColor" fill-opacity="0.85"/>
                </svg>
              </div>
            </div>

            <!-- Webサイト実表示領域（iframe） -->
            <div class="iphone-webview-wrap">
              <iframe id="mobile-preview-iframe" title="iPhone実画面プレビュー"></iframe>
            </div>

            <!-- 下部 iOS Safari アドレスバー・ナビバー・ホームインジケーター -->
            <div class="ios-safari-bottom">
              <div class="ios-address-pill">
                <span style="font-size: 11px; color: var(--text-muted);">ぁあ</span>
                <span id="ios-address-text" class="ios-address-domain">🔒 ${escapeHtml(previewDomain)}</span>
                <button type="button" id="ios-reload-btn" title="再読み込み" style="background:none;border:none;cursor:pointer;font-size:13px;color:var(--text-dark);">↻</button>
              </div>
              <div class="ios-nav-icons" aria-hidden="true">
                <span>‹</span>
                <span style="opacity:0.4;">›</span>
                <span>↑</span>
                <span>📖</span>
                <span>⧉</span>
              </div>
              <div class="ios-home-indicator"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    const previewClose = document.getElementById("mobile-preview-close");
    const previewIframe = document.getElementById("mobile-preview-iframe");
    const deviceFrame = document.getElementById("mobile-device-frame");
    const iphoneStage = document.getElementById("iphone-stage");
    const deviceBtns = previewModal.querySelectorAll("[data-device-model]");
    const safariToggle = document.getElementById("preview-safari-toggle");
    const reloadBtn = document.getElementById("ios-reload-btn");
    const addressText = document.getElementById("ios-address-text");
    const iosClock = document.getElementById("ios-clock");

    function updateClock() {
      if (!iosClock) return;
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      iosClock.textContent = `${hh}:${mm}`;
    }

    function fitDeviceToScreen() {
      if (!deviceFrame || !iphoneStage || !previewModal.open) return;
      const stageRect = iphoneStage.getBoundingClientRect();
      const model = deviceFrame.getAttribute("data-model") || "iphone15";
      const deviceSize = APP_CONSTANTS.previewDeviceSizes[model] || APP_CONSTANTS.previewDeviceSizes.iphone15;

      const scaleH = (stageRect.height - 16) / deviceSize.height;
      const scaleW = (stageRect.width - 16) / deviceSize.width;
      const scale = Math.min(1, Math.max(0.5, Math.min(scaleH, scaleW)));
      deviceFrame.style.setProperty("--device-scale", scale.toFixed(3));
    }

    function openPreviewModal() {
      updateClock();
      const baseUrl = window.location.href.split("?")[0].split("#")[0];
      const hash = window.location.hash || "";
      previewIframe.setAttribute("src", `${baseUrl}?mobile_preview=1${hash}`);
      if (typeof previewModal.showModal === "function") {
        if (!previewModal.open) previewModal.showModal();
      } else {
        previewModal.setAttribute("open", "");
      }
      requestAnimationFrame(fitDeviceToScreen);
    }

    function closePreviewModal() {
      if (typeof previewModal.close === "function") {
        if (previewModal.open) previewModal.close();
      } else {
        previewModal.removeAttribute("open");
      }
    }

    window.addEventListener("resize", fitDeviceToScreen);

    previewBtn.addEventListener("click", openPreviewModal);

    if (previewIframe && addressText) {
      previewIframe.addEventListener("load", () => {
        try {
          const loc = previewIframe.contentWindow.location;
          const pageName = loc.pathname.split("/").pop() || "index.html";
          addressText.textContent = `🔒 ${previewDomain}/${pageName === "index.html" ? "" : pageName}`;
        } catch (err) {
          addressText.textContent = `🔒 ${previewDomain}`;
        }
      });
    }

    if (reloadBtn && previewIframe) {
      reloadBtn.addEventListener("click", () => {
        if (previewIframe.contentWindow) {
          previewIframe.contentWindow.location.reload();
        }
      });
    }

    deviceBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const model = btn.getAttribute("data-device-model") || "iphone15";
        deviceFrame.setAttribute("data-model", model);
        deviceBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
        requestAnimationFrame(fitDeviceToScreen);
      });
    });

    if (safariToggle && deviceFrame) {
      safariToggle.addEventListener("click", () => {
        const hidden = deviceFrame.classList.toggle("hide-safari-bar");
        safariToggle.classList.toggle("is-active", !hidden);
        safariToggle.textContent = hidden ? "Safari下部バー：非表示（最大表示）" : "Safari下部バー：表示中";
      });
    }

    if (previewClose) {
      previewClose.addEventListener("click", closePreviewModal);
    }

    previewModal.addEventListener("click", (e) => {
      if (e.target === previewModal || e.target === iphoneStage) {
        closePreviewModal();
      }
    });
  }
});
