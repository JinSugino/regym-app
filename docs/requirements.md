# 杉野ジム予約システム（案件管理）

---

> 🏷️ **ステータス**: v1.0 確定（2026-09-08）
💡 **プロジェクト方針**: 「二重予約の絶対防止」と「3ヶ月でのMVP稼働」を最優先事項とし、極めてシンプルなWebアプリケーションとして構築する。
> 

---

## 1. プロジェクト概要

- **目的**: 電話・LINE・手書きの紙管理による二重予約や空き枠確認の手間を解消し、会員がスマホから24時間空き枠確認・予約・キャンセルを行える環境を整備する。
- **ターゲット顧客**: 杉野パーソナルジム（オーナー1名、トレーナー2名、会員数数十名規模）
- **開発規模**: 納期3ヶ月（MVP） / 運用コスト 月額数千円以内（Vercel + Supabase等の無料〜低価格帯インフラ）

---

## 2. 登場人物（ロール）と権限設定

- **会員（ユーザー）**
- 会員専用URL（スマホブラウザ）からアクセス。
- 担当トレーナーを選択し、リアルタイムの空き枠を確認して予約・キャンセルを実行。
- **オーナー（管理者）**
- 全トレーナー（3名分）の予約状況を一元管理（ダッシュボード閲覧・手動予約・代理キャンセル・シフト設定）。
- 会員のアカウント登録（手動招待）を発行。
- **トレーナー（スタッフ2名）**
- ※MVP（初期開発）ではログイン権限を与えず、オーナーがシフト・予約を一括管理する。

---

## 3. 機能要件（In Scope）

### 【会員向け機能】

- **ログイン・認証**: 招待されたメールアドレス/パスワードでログインできること。
- **トレーナー指名選択**: 予約時に希望する担当トレーナー（3名）を選択できること。
- **空き枠検索・予約**: 選択したトレーナーの空き枠（60分枠＋15分準備＝75分間隔）を検索し予約を確定できること。
- **予約一覧・詳細確認**: 自身の現在の予約状況（日時、担当トレーナー）を一覧で確認できること。
- **キャンセル処理（24時間前制御）**:
- **予約日時の24時間前まで**: 画面上から1タップで自由にキャンセルが可能。
- **予約日時の24時間未満**: 画面上のキャンセルを非活性化し、店舗への直接連絡案内を表示。

### 【オーナー/管理者向け機能】

- **会員招待・発行**: 会員のメールアドレスを登録し、ログインアカウントを発行できること。
- **全体予約ダッシュボード**: 全トレーナーの予約状況を日別・週別などで一覧表示・管理できること。
- **手動予約登録・代理キャンセル**: 電話や店頭で受けた予約・キャンセルを管理者が代理操作できること。
- **シフト・空き枠管理機能**: 曜日ごとの基本出勤枠を設定し、個別の時間枠を1タップで「予約不可」に切り替えられること。

### 【共通/システム基盤機能】

- **二重予約防止（排他制御）**: 同一トレーナーの同一時間枠に対し、同時アクセスが発生しても重複予約を物理的に遮断すること。

---

## 4. やらないこと（Out of Scope）

> ⚠️ **以下は初期フェーズ（MVP）の対象外とします（追加要望時は要再見積もり）**
> 
> - **LINE公式アカウント連携（Lステップ/LINEミニアプリ化等）**: ブラウザベースのWebアプリ（URL共有）として提供。
> - **オンライン決済機能（Stripe連携等）**: 月額会費制のため予約時の決済処理は行わない。
> - **複数店舗管理機能**: 1店舗のみ対応。
> - **会員の自動入退会・CRM連携**: 基本プロフィール管理のみ。
> - **トレーナー個別のログインアカウント機能**: オーナー一括管理とする。

---

## 5. 非機能要件

- **二重予約の絶対防止**: データベース制約レベルでの厳密な排他制御。
- **モバイルファースト設計**: 会員操作の9割以上がスマホ前提のUI/UX。
- **運用体制・営業時間仕様**: 平日 10:00〜20:00 / 土曜 10:00〜18:00 / 日曜定休。

---

## 6. 画面構造一覧

1. **ログイン画面**（会員・オーナー共通）
2. **会員登録・招待画面**（オーナー用）
3. **トレーナー選択画面**（会員用）
4. **日時・空き枠選択カレンダー画面**（会員用）
5. **予約確認・完了画面**（会員用）
6. **マイページ（予約一覧・キャンセル）**（会員用）
7. **全体予約ダッシュボード**（オーナー用）
8. **シフト・予約不可枠設定画面**（オーナー用）

---

## 7. データベース設計書（v1.0）

### アーキテクチャ構成

```
[auth.users] (Supabase標準認証)
     │ (1:1)
     ▼
[profiles] (ユーザー情報: オーナー/会員)
     │
     │ (1:N)
     ▼
[bookings] (予約情報: 心臓部)
     ▲
     │ (1:N)
[trainers] (トレーナーマスタ)
     │
     │ (1:N)
     ▼
[trainer_schedules] (基本シフト設定)
```

> 💡 **枠管理ロジック**: 予約枠（slots）はテーブル化せず、`trainer_schedules`（基本枠）から `bookings`（予約済み枠）を動的に差し引いてリアルタイム算出する。
> 

---

### テーブル定義一覧

#### ① profiles （ユーザー情報）

| カラム名 (Column) | 型 (Type) | 制約 (Constraint) | 説明 (Description) |
| --- | --- | --- | --- |
| `id` | uuid | PRIMARY KEY, REFERENCES auth.users(id) | ユーザーID |
| `full_name` | text | NOT NULL | 氏名 |
| `role` | text | NOT NULL, CHECK (role IN ('member', 'owner')) | 権限（会員 / オーナー） |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | アカウント作成日時 |

#### ② trainers （トレーナーマスタ）

| カラム名 (Column) | 型 (Type) | 制約 (Constraint) | 説明 (Description) |
| --- | --- | --- | --- |
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | トレーナーID |
| `name` | text | NOT NULL | トレーナー名 |
| `is_active` | boolean | NOT NULL, DEFAULT true | 有効フラグ |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 作成日時 |

#### ③ trainer_schedules （基本シフト設定）

| カラム名 (Column) | 型 (Type) | 制約 (Constraint) | 説明 (Description) |
| --- | --- | --- | --- |
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | シフトID |
| `trainer_id` | uuid | NOT NULL, REFERENCES trainers(id) | トレーナーID |
| `day_of_week` | integer | NOT NULL, CHECK (day_of_week BETWEEN 0 AND 6) | 曜日（0:日, 1:月 ... 6:土） |
| `start_time` | time | NOT NULL | 開始時刻（例: 10:00） |
| `end_time` | time | NOT NULL | 終了時刻（例: 20:00） |

### ④ bookings （予約テーブル）

| カラム名 (Column) | 型 (Type) | 制約 (Constraint) | 説明 (Description) |
| --- | --- | --- | --- |
| `id` | uuid | PRIMARY KEY, DEFAULT gen_random_uuid() | 予約ID |
| `user_id` | uuid | REFERENCES profiles(id) | 予約会員ID（ブロック時はNULL可） |
| `trainer_id` | uuid | NOT NULL, REFERENCES trainers(id) | 指名トレーナーID |
| `start_time` | timestamptz | NOT NULL | 予約開始日時 |
| `end_time` | timestamptz | NOT NULL | 予約終了日時（開始+60分） |
| `status` | text | NOT NULL, CHECK (status IN ('confirmed', 'cancelled', 'blocked')) | 状態 ('confirmed': 確定, 'cancelled': キャンセル, 'blocked': 予約不可枠) |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | 申込日時 |

---

### 二重予約防止および予約不可枠（部分ユニークインデックス）

キャンセル済み (`status = 'cancelled'`) を除外した部分ユニークインデックスを構築し、有効な予約およびブロック枠（`confirmed`, `blocked`）のみ重複を物理的に防ぎます。

```sql
-- 有効な予約・ブロック枠のみで重複挿入を排他制御
CREATE UNIQUE INDEX unique_active_booking
ON bookings (trainer_id, start_time)
WHERE status IN ('confirmed', 'blocked');
```

---

### 二重予約防止SQL（複合ユニーク制約）

`bookings` テーブルに以下の制約を適用し、同一トレーナーかつ同一時刻の重複レコード挿入をデータベースの物理レベルで防止します。

```sql
ALTER TABLE bookings
ADD CONSTRAINT unique_trainer_start_time
UNIQUE (trainer_id, start_time);
```