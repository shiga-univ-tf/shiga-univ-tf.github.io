# 滋賀大学陸上競技部 公式Webサイト

滋賀大学陸上競技部（彦根キャンパス・大津キャンパス）の公式Webサイトリポジトリです。
[滋賀大陸上部ホームページ構成案.pdf](滋賀大陸上部ホームページ構成案.pdf) の方針に基づき、ビルド不要の静的構成＋Google スプレッドシート連携（CMS）＋ GitHub Pages で運用できるよう構築されています。

---

## 目次

1. [システム構成・技術スタック](#システム構成技術スタック)
2. [ページ構成とディレクトリ一覧](#ページ構成とディレクトリ一覧)
3. [ローカル環境での動作確認方法](#ローカル環境での動作確認方法)
4. [GitHub への公開と GitHub Pages デプロイ手順](#github-への公開と-github-pages-デプロイ手順)
5. [Googleスプレッドシート CMS の運用ガイド](#googleスプレッドシート-cms-の運用ガイド)
6. [お問い合わせフォームの設定](#お問い合わせフォームの設定)
7. [設計判断記録（ADR）](#設計判断記録adr)

---

## システム構成・技術スタック

* **フロントエンド**: HTML5 / CSS3 / Vanilla JavaScript（ビルドツール・フレームワーク不使用）
* **ホスティング**: GitHub Pages（GitHub Actions による自動デプロイ）
* **CMS / データ管理**: Google スプレッドシート（「ウェブに公開」CSV をブラウザ側から同期）
* **対象 GitHub Organization**: [`shiga-univ-tf`](https://github.com/shiga-univ-tf)（各自の個人アカウントを招待して運用）

```text
[ Google スプレッドシート ]
   ├─ ① お知らせシート ──────┐
   ├─ ② 部員紹介シート ──────┼─(公開CSVをブラウザが直接fetch)─▶ [ app.js ] ──▶ 画面描画
   └─ ③ 滋賀大記録シート ────┘

[ GitHub リポジトリ (main) ]
   └─ push ──▶ [ GitHub Actions (.github/workflows/deploy-pages.yml) ]
                  └─ 公開用ファイルのみステージング (_site) ──▶ [ GitHub Pages ]
```

> **定時実行（Cron）について**: スプレッドシートのデータ同期は閲覧者のブラウザから直接取得し、部員の学年進級もブラウザ側の現在日付から自動計算するため、定時実行バッチは使用していません（詳細は [ADR-0002](docs/adr/0002-spreadsheet-cms-and-cron-decision.md) を参照）。

---

## ページ構成とディレクトリ一覧

### 公開ページ（Webサイト本体）

| ファイル / ディレクトリ | 内容・役割 |
| :--- | :--- |
| [`index.html`](index.html) | **トップページ**：ファーストビュー、①お知らせ（スプレッドシート連動）、②〜④各ページへの案内カード、⑤よくある質問（FAQ）、⑥お問い合わせ（Instagram案内＋メールフォーム） |
| [`recruit.html`](recruit.html) | **新入生向けの情報**：彦根・大津キャンパスの練習時間・場所、練習見学・体験練習案内、主将・監督からのメッセージ |
| [`members.html`](members.html) | **部員紹介**：1〜4回生・大学院生タブ切り替え（入学年度から自動進級・卒業生非表示、選手/マネージャーバッジ表示） |
| [`records.html`](records.html) | **滋賀大記録**：トラック／フィールド／ロード・競歩／混成の男女別一覧と、各行・下部カードでの詳細表示（保持者・達成日・大会・会場） |
| [`style.css`](style.css) | PC・スマートフォン共通のスタイルシート（レスポンシブ・iPhone実画面プレビューUI含む） |
| [`app.js`](app.js) | メニュー開閉、タブ切り替え、FAQ、フォーム検証、GoogleスプレッドシートCSV同期、スマホ表示プレビュー機能 |
| [`data.js`](data.js) | サイト基本設定（`siteConfig`）、公式SNS設定（`socialConfig`）、Googleスプレッドシート公開CSV URL（`googleSheetConfig`）、お問い合わせ先設定（`contactConfig`） |
| [`assets/`](assets/) | トップ・新入生案内ページ用の画像アセット（PC / SP 用イメージ画像 7点） |

### 運用・開発用ファイル（GitHub Pages 公開対象外）

| ファイル / ディレクトリ | 内容・役割 |
| :--- | :--- |
| [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) | `main` ブランチへのプッシュ時に公開ファイルのみを GitHub Pages へデプロイするワークフロー |
| [`docs/adr/`](docs/adr/README.md) | 技術選定・デプロイ・データ連携方針の設計判断記録（Architecture Decision Records） |
| [`spreadsheet_templates/`](spreadsheet_templates/) | スプレッドシート作成時のインポート用 CSV テンプレート（3ファイル） |
| [`滋賀大陸上部ホームページ構成案.pdf`](滋賀大陸上部ホームページ構成案.pdf) | サイトの仕様・構成の元となる設計資料 |
| [`.gitignore`](.gitignore) | OS・エディタ・一時ビルドディレクトリ（`_site/` 等）の除外設定 |

---

## ローカル環境での動作確認方法

`fetch()` による Google スプレッドシート取得や、画面右下の「📱 スマホ表示で見る」プレビュー機能（`iframe`）を正しく確認するため、HTML ファイルを直接ダブルクリック（`file://`）するのではなく、**ローカル HTTP サーバー経由で開くこと**を推奨します。

### Python を使う場合（Windows / macOS 共通）

```bash
# リポジトリのルートディレクトリで実行
python -m http.server 8000
```

ブラウザで `http://localhost:8000` を開いて確認できます。

### VS Code を使う場合

拡張機能「Live Server」をインストールし、[`index.html`](index.html) を右クリックして **「Open with Live Server」** を選択してください。

---

## GitHub への公開と GitHub Pages デプロイ手順

### 1. GitHub 上で空のリポジトリを作成する

1. 自身の個人 GitHub アカウントでサインインした状態で [`https://github.com/shiga-univ-tf`](https://github.com/shiga-univ-tf)（Organization）を開き、**New repository** を開きます（※共有アカウントの使い回しはせず、各自のアカウントを Organization に招待して運用します）。
2. **Repository name** を入力します。
   * **推奨名**: `shiga-univ-tf.github.io`（公開 URL が `https://shiga-univ-tf.github.io/` になります）
   * 任意の名前（例：`website` 等）にした場合は `https://shiga-univ-tf.github.io/<リポジトリ名>/` で公開されます。本サイトは相対パス構成のため、どちらの名前でも動作します。
3. **Public** を選択し、`Add a README file` や `.gitignore` にはチェックを入れず（**空の状態のまま**）作成します。

### 2. ローカルリポジトリを GitHub へプッシュする

作成したリポジトリの URL を `origin` に登録し、`main` ブランチをプッシュします（以下は推奨リポジトリ名 `shiga-univ-tf.github.io` の例）。

```bash
git remote add origin https://github.com/shiga-univ-tf/shiga-univ-tf.github.io.git
git push -u origin main
```

### 3. GitHub Pages のデプロイ設定を有効化する

1. GitHub リポジトリ画面の **Settings** > 左メニュー **Pages** を開きます。
2. **Build and deployment** の **Source** を **`GitHub Actions`** に変更します。
3. **Actions** タブでワークフロー `Deploy static site to GitHub Pages` が完了すると、画面上部に公開 URL が表示されます。

> **公開対象ファイルについて**: [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) は、`index.html`・`recruit.html`・`members.html`・`records.html`・`style.css`・`app.js`・`data.js`・`assets/` および `.nojekyll` のみを `_site/` に集めて公開します。`README.md`・`docs/`・`spreadsheet_templates/`・`滋賀大陸上部ホームページ構成案.pdf` は本番サイトに公開されません。新しい公開ファイル（`favicon.ico` や `404.html` 等）を追加した際は、同ワークフローの `Stage public files` にも追加してください。

---

## Googleスプレッドシート CMS の運用ガイド

部活の Google アカウントで作成したスプレッドシートの「ウェブに公開（CSV形式）」URL を [`data.js`](data.js) の `SITE_DATA.googleSheetConfig` に設定することで、HTML/JS を触らずにコンテンツを更新できます。

### CSV 公開 URL の取得方法

1. Google スプレッドシートのメニューから **「ファイル」→「共有」→「ウェブに公開」** を開きます。
2. 公開対象として各シートを選択し、形式に **「カンマ区切り形式（.csv）」** を選んで「公開」をクリックします。
3. 生成された URL を [`data.js`](data.js) の対応する項目（`newsCsvUrl` / `membersCsvUrl` / `recordsCsvUrl`）へ設定します。

### 各シートの列仕様（`app.js` 対応フォーマット）

#### ① お知らせシート (`newsCsvUrl`)

| 列名 | 内容・入力例 |
| :--- | :--- |
| `カテゴリ` | `新歓` / `大会` / `競技情報` など |
| `タイトル` | 表示される見出し（例：`新入生向け 練習見学・体験のご案内`） |
| `状態・日付` | 右端のステータス文言や日付（例：`2026.04.01` / `詳細は順次公開 →`） |
| `リンク先` | 遷移先パスまたは URL（例：`recruit.html`, `records.html`, `members.html`, `https://...`） |

#### ② 部員紹介シート (`membersCsvUrl`)

* **学年自動計算**: `入学年度` と現在日時（`currentAcademicYear` が `null` の場合は 4月〜翌3月を1年度として自動計算）から「1回生〜4回生」「大学院生（院生）」へ自動振り分けし、学部5年目以上・大学院3年目以上は自動で非表示になります。
* **役割バッジと自己ベスト欄**: `役割` 列に `マネージャー`（または `MG` 等）が含まれる場合はマネージャーバッジを表示し、種目・記録が未入力の場合は `PERSONAL BEST` 枠を非表示にします。

| 列名 | 内容・入力例 |
| :--- | :--- |
| `入学年度` | 西暦4桁の半角数字（例：`2025`） |
| `課程・区分` | `学部` または `大学院` |
| `氏名` | 例：`山田 翔太` |
| `フリガナ` | 例：`ヤマダ ショウタ` |
| `学部・研究科` | 例：`経済学部` / `データサイエンス学部` / `教育学部` |
| `出身高校` | 例：`彦根東高校` |
| `役割` | `選手` または `マネージャー`（省略時は `選手`） |
| `種目1` / `記録1` 〜 `種目5` / `記録5` | 複数種目の自己ベスト（例：`種目1`=`100m`, `記録1`=`11秒07`）。`自己ベスト` 列によるテキスト入力にも対応 |
| `一言` | コメント（`「` で始まっていない場合は自動で `「...」` で囲まれます） |

> **注記**: [`spreadsheet_templates/02_部員紹介テンプレート.csv`](spreadsheet_templates/02_部員紹介テンプレート.csv) は旧仕様列（`見出し種目,専門種目,自己ベスト`）のまま残っています。新規シート作成時は上記表の列構成（`役割,種目1,記録1,...`）を使用してください。

#### ③ 滋賀大記録シート (`recordsCsvUrl`)

| 列名 | 内容・入力例 |
| :--- | :--- |
| `カテゴリ` | `トラック` / `フィールド` / `ロード・競歩` / `混成` のいずれか |
| `性別` | `男子` または `女子` |
| `種目` | 例：`100m（電動）` / `走高跳` / `十種競技` |
| `記録` | 例：`10秒80` / `1m94` / `4655点` |
| `記録保持者` | 例：`太田 成宣` |
| `達成日` | 例：`2009年10月20日` |
| `大会` | 例：`学年別` / `関西インカレ` |
| `会場` | 例：`長居第二` / `皇子山` |

> **運用上の注意**: 現在、`data.js` には初期フォールバック用の部員・記録データが保持されておらず、公開ページの HTML（`index.html` / `members.html` / `records.html`）にはデザイン確認用の仮注記が残っています。非エンジニア向け入稿のミス防止（バリデーション・追記形式化など）とあわせて今後改善予定です。

---

## お問い合わせフォームの設定

[`data.js`](data.js) の `SITE_DATA.contactConfig` で送信方法を切り替えます。

* **現状（`endpointUrl: ""`）**: フォームの「送信する」を押すと、閲覧者端末のメールソフトが起動し、`yahooEmail`（`shiga_univ_tf@yahoo.co.jp`）宛の `mailto:` メール作成画面が開きます。
* **直接送信へ切り替える場合**: Formspree または Google Apps Script（GAS）Web アプリを作成し、その POST 受信 URL を `contactConfig.endpointUrl` に設定してください（JSON `{ name, email, message }` が POST されます）。

---

## 設計判断記録（ADR）

アーキテクチャや運用方法の決定理由・比較検討した代替案は [`docs/adr/`](docs/adr/README.md) に記録しています。

* [ADR-0001: 静的サイト構成と GitHub Pages によるホスティング採用](docs/adr/0001-github-pages-hosting.md)
* [ADR-0002: GoogleスプレッドシートCMS連携方式と定時実行バッチ（Cron）の採否](docs/adr/0002-spreadsheet-cms-and-cron-decision.md)
