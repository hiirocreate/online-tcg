# オンライン対戦カードゲーム

1対1のオンライン対戦カードゲーム（Web / Android対応）。開発指示書（仕様書）に基づき実装する。

## 技術構成（確定）

| 領域 | 技術 |
|---|---|
| Webフロント | React + TypeScript + Vite（+ react-router-dom, Supabase Auth） |
| Androidアプリ | React Native (Expo SDK 57) + TypeScript |
| サーバー | Node.js + TypeScript + Fastify + Socket.io（自前ホスト） |
| データベース / 認証 | Supabase (PostgreSQL + Auth) |
| ORM | Prisma ORM v7（Rust-freeクライアント、`@prisma/adapter-pg`経由でPostgreSQLに接続） |
| ホスティング（サーバー） | Railway（推奨。GitHub連携で自動デプロイでき運用の手間が少ない） |
| カードマスター | **Supabase DBで管理**（`card_masters` / `player_masters` / `pack_masters`テーブル）。管理画面から追加・編集すると即座に反映される |

「Player」（体力・攻撃力を持つアバター要素、`player_masters`テーブル）は、ユーザーアカウントの識別子（Collection / Deck / Match で使う`playerId`）とは別概念として扱う。

Card Masterは当初仕様書47番の通りJSONファイル管理だったが、「管理画面から簡単に新カードを追加したい」という要望に基づきDB管理へ移行した（ユーザー確認済み）。`data/cards/*.json`は初期データ・バックアップ用途として残っており、`server/database/seed.ts`で一度だけDBへ投入する。

## ディレクトリ構成

```
project/
├─ client/
│  ├─ web/          # React + Vite + TypeScript（管理画面 /admin を含む）
│  └─ android/      # React Native (Expo) + TypeScript
├─ server/
│  ├─ api/          # Fastify REST routes（管理者用API: adminCards/adminPlayers/adminPacks/adminMe）
│  ├─ game/         # ターン/Energy/戦闘/効果解決などサーバー権威ロジック、Card Masterキャッシュ
│  ├─ matchmaking/  # マッチング処理（未実装）
│  ├─ database/     # Prisma schema・シードスクリプト
│  └─ services/     # Supabase JWT認証、Socket.ioハンドラ
├─ data/
│  ├─ cards/        # 初期データ/バックアップ用JSON（実行時の読み込み元ではない）
│  ├─ packs/        # 同上
│  └─ rules/
├─ shared/
│  ├─ types/        # Card / Instance / GameState / Action / Event / 管理画面入力 型定義
│  ├─ constants/    # フィールドスロット数、Energy上限、手札上限など
│  └─ validation/   # 管理画面の入力バリデーション（サーバー側で必ず実行）
├─ assets/
├─ tests/
└─ docs/
```

## セットアップ（あなたが行う必要がある手動作業）

コードはすべてこちらで用意済みです。以下はサービスアカウント作成やSQL実行など、こちら側では代行できない手順のみです。

1. このzipの中身をGitHubリポジトリのルートに配置し、コミット・プッシュする。
2. [Supabase](https://supabase.com) でプロジェクトを作成する。
3. Supabaseダッシュボードの `Project Settings > Database` から接続文字列を取得し、`server/.env.example` を `server/.env` にコピーして `DATABASE_URL`（Connection Pooling用）と `DIRECT_URL`（Direct connection用。分からなければ`DATABASE_URL`と同じ値でよい）を記入する。
4. `Project Settings > API` から `Project URL` と `anon key` を取得し、同じ`server/.env`の`SUPABASE_URL`等、および`client/web/.env.example`をコピーした`client/web/.env`の`VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`に記入する。
5. `npm install` （プロジェクトルートで実行）
6. `cd server && npx prisma generate --schema database/schema.prisma` でPrisma Clientを生成する（初回はエンジンのダウンロードで少し時間がかかります）。
7. `cd server && npx prisma migrate dev --name init --schema database/schema.prisma` でテーブルを作成する。
8. `cd server && npm run db:seed` で、`data/cards/*.json`の内容をDBへ投入する（初回のみ。以後は管理画面から追加する）。
9. Supabaseダッシュボードの **Authentication > Users** から自分のログイン用アカウント（メール・パスワード）を作成する。
10. サーバーを一度起動し（`npm run dev:server`）、Web側（`npm run dev:web`）で一度そのアカウントでログインする（`/login`画面）。これにより`users`テーブルに自分の行が作られる。
11. Supabaseダッシュボードの **SQL Editor** で以下を実行し、自分を管理者にする。

    ```sql
    update public.users set is_admin = true where email = 'あなたのログインemail';
    ```

12. カード画像をアップロードできるようにする場合は、Supabaseダッシュボードの **Storage** で `card-images` という名前の **Public** バケットを作成し、SQL Editorで以下を実行する（管理者だけがアップロードできるようにするポリシー）。

    ```sql
    create policy "Admins can upload card images"
    on storage.objects for insert
    to authenticated
    with check (
      bucket_id = 'card-images'
      and exists (select 1 from public.users where users.id = auth.uid() and users.is_admin = true)
    );

    create policy "Admins can update card images"
    on storage.objects for update
    to authenticated
    using (
      bucket_id = 'card-images'
      and exists (select 1 from public.users where users.id = auth.uid() and users.is_admin = true)
    );
    ```

13. 以降、`/admin`にログインしてカード・Playerアバター・パックの追加/編集/削除ができる。保存すると即座にサーバーのキャッシュが更新され、`GET /api/cards`（Web/Android両方が参照する公開API）にも反映される。
14. Android版は `cd client/android && npx expo start` で起動確認。APKビルドは `.github/workflows/android-build.yml` をGitHub Actionsで実行する。
15. （Phase4以降で対戦機能を使う場合）サーバーをRailway等にデプロイし、常時稼働環境を用意する。

## 管理画面（新規カード追加機能）

- `/admin/cards`：Subordinate/Spell/Fieldカードの一覧・作成・編集・削除
- `/admin/players`：Player（アバター/リーダー）マスターの一覧・作成・編集・削除
- `/admin/packs`：Packのスロット構成の一覧・作成・編集・削除（レアリティ区分・排出率の詳細は仕様書52番により未確定のため、スロット構成のみ）

保存時のバリデーション（`shared/validation`）はクライアント・サーバー両方から使われるが、実際に強制されるのはサーバー側（`server/api/adminCards.ts`等）。クライアントの入力をそのまま信用しないという仕様書全体の方針を管理画面にも適用している。

## テスト

`npm test --workspace shared`、`npm test --workspace server` で自動テストを実行できる（バリデーション・Card Masterキャッシュ・認証・管理者用APIのHTTPレベル結合テストを含む）。

## 開発フェーズ

仕様書49番のPhase 1〜9の順に実装する。今回追加した管理画面は仕様書には無い要素だが、Phase 2（ユーザー・カード所有）と合わせて実装した。現在の進捗は各Phase完了時の報告を参照。
