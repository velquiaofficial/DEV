"use strict";
/**
 * Generate README.md for each playable game and standalone app (Relixia skipped).
 */
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;

const ARCADE = {
  "01_DOTMUNCH": {
    title: "DOTMUNCH",
    genre: "迷路アクション（パックマン系）",
    overview:
      "格子迷路を移動し、粒を食べてスコアを稼ぐアーケードゲーム。パワークックでゴーストを一時的に追い返せる。",
    content: [
      "28×24 タイルの迷路（壁・通常粒・パワークック）",
      "プレイヤーは矢印キーで移動。口の開閉アニメあり",
      "ゴースト最大4体：通常は追跡/散開、パワー中は逃走色",
      "残機制。全粒クリアでステージクリア、接触で残機減",
      "ベストスコアを localStorage に保存"
    ],
    controls: "←↑→↓ 移動 / P 一時停止 / はじめるでスタート",
    win: "マップ上の粒・パワークックをすべて食べる",
    lose: "残機0でゲームオーバー"
  },
  "02_BRICKPULSE": {
    title: "BRICKPULSE",
    genre: "ブロック崩し",
    overview: "パドルで弾を跳ね返し、色付きレンガをすべて壊すクラシックなブレイクアウト系。",
    content: [
      "6行×10列のレンガ配置",
      "スペースで発射、左右でパドル操作",
      "落とすと残機減。全消しでクリアボーナス",
      "ベストスコア保存"
    ],
    controls: "←→ パドル / Space 発射",
    win: "レンガ全滅",
    lose: "残機0"
  },
  "03_SNAKEBIT": {
    title: "SNAKEBIT",
    genre: "スネーク",
    overview: "餌を食べて体を伸ばす。壁や自分の体に当たると終了。",
    content: ["グリッド移動", "スコアに応じてテンポ上昇", "長さが残機欄に表示される"],
    controls: "←↑→↓ 方向転換（逆向き不可）",
    win: "ハイスコア更新（エンドレス）",
    lose: "壁・自己衝突"
  },
  "04_STARSWARM": {
    title: "STARSWARM",
    genre: "シューティング（インベーダー系）",
    overview: "自機を左右に動かし弾を撃ってエイリアンの群れを倒す。",
    content: ["4行×8列の敵編隊", "敵も射撃。接地or被弾で残機減", "全滅でクリア"],
    controls: "←→ 移動 / Space 射撃",
    win: "敵全滅",
    lose: "残機0または侵入"
  },
  "05_LILYPAD": {
    title: "LILYPAD",
    genre: "ロードクロス（フロッガー系）",
    overview: "車道と川を渡ってゴールへ。丸太に乗らないと川で落ちる。制限時間あり。",
    content: ["ジャンプ移動（クールダウン付き）", "車ヒット・水没・時間切れで残機減", "上端到達で得点"],
    controls: "←↑→↓ ジャンプ",
    win: "ゴール繰り返しでスコア稼ぎ",
    lose: "残機0"
  },
  "06_PADDLEDUEL": {
    title: "PADDLEDUEL",
    genre: "対戦スポーツ（ポン系）",
    overview: "左右パドルでボールを打ち合い、先に7点取った方が勝ち。右はAI。",
    content: ["物理的な跳ね返り角度", "AIはボール追跡", "ベストは自スコアを記録"],
    controls: "↑↓ または W/S",
    win: "7点先取",
    lose: "AIが7点"
  },
  "07_ROCKFIELD": {
    title: "ROCKFIELD",
    genre: "シューティング（アステロイド系）",
    overview: "宇宙空間で旋回・加速・射撃し、岩を砕く。大きい岩は分裂する。",
    content: ["画面ラップ移動", "岩石の分裂", "衝突で残機減"],
    controls: "←→ 旋回 / ↑ 加速 / Space 射撃",
    win: "岩をすべて破壊",
    lose: "残機0"
  },
  "08_FLAPGLIDE": {
    title: "FLAPGLIDE",
    genre: "アクション（フラッピー系）",
    overview: "羽ばたいて柱の隙間を抜け、距離＝スコアを伸ばす。",
    content: ["重力と上昇パルス", "通過で加点", "クリックでも羽ばたき可"],
    controls: "Space / クリック",
    win: "ハイスコア更新",
    lose: "柱・地面・天井接触"
  },
  "09_GEMTRI": {
    title: "GEMTRI",
    genre: "パズル（マッチ3）",
    overview: "隣り合う宝石を入れ替え、3つ以上そろえて消す。手数制限あり。",
    content: ["8×8盤", "連鎖ボーナス", "そろわない交換はロールバック", "30手"],
    controls: "クリック2回で入替",
    win: "高スコア（手数内）",
    lose: "手数切れ"
  },
  "10_SWEEPFIELD": {
    title: "SWEEPFIELD",
    genre: "論理パズル（マインスイーパ）",
    overview: "数字を手がかりに地雷以外をすべて開く。",
    content: ["12×12・地雷18", "0連鎖オープン", "右クリックで旗", "クリア時にタイムボーナス"],
    controls: "左クリック開く / 右クリック旗",
    win: "地雷以外をすべて開く",
    lose: "地雷を踏む"
  },
  "11_STACKDROP": {
    title: "STACKDROP",
    genre: "落ちもの（テトリス系）",
    overview: "七種の四角ブロックを積み、横一列を消す。",
    content: ["10×20フィールド", "回転・ハードドロップ", "NEXT表示", "レベル＝消去数で速度上昇"],
    controls: "←→ 移動 / ↑ 回転 / ↓ ソフト / Space ハード",
    win: "ハイスコア更新",
    lose: "天井到達"
  },
  "12_MEMORYFLIP": {
    title: "MEMORYFLIP",
    genre: "神経衰弱",
    overview: "カードをめくり同じ絵柄のペアを揃える。手数少ないほど高得点。",
    content: ["4×3・6ペア", "不一致は自動で裏返し", "全ペアでクリアボーナス"],
    controls: "クリックでめくる",
    win: "全ペア完成",
    lose: "なし（手数でスコア差）"
  },
  "13_WHACKBURST": {
    title: "WHACKBURST",
    genre: "リアクション",
    overview: "穴から出るターゲットを制限時間内に叩く。金は高得点、爆弾は減点。",
    content: ["3×3ホール", "30秒", "同時出現上限あり"],
    controls: "クリック",
    win: "タイムアップ時のハイスコア",
    lose: "時間切れ（対戦ではない）"
  },
  "14_AIRHOCK": {
    title: "AIRHOCK",
    genre: "エアホッケー",
    overview: "マレットでパックを打ち、相手ゴールに入れる。右はAI。先に5点。",
    content: ["マウス追従＋矢印", "ゴール判定ゾーン", "摩擦あり"],
    controls: "マウス / ←↑→↓",
    win: "5点先取",
    lose: "AIが5点"
  },
  "15_TUNNELRUN": {
    title: "TUNNELRUN",
    genre: "ランナー（レーン回避）",
    overview: "3レーンを走り、障害物を避けて距離を稼ぐ。",
    content: ["レーン切替", "速度が距離で上昇", "衝突で即終了"],
    controls: "←→ または A/D",
    win: "ハイスコア（メートル）",
    lose: "障害物ヒット"
  }
};

const LEGACY_GAMES = {
  "02_PUZZLE/01_TETORIS": {
    title: "三角テトリス",
    genre: "落ちものパズル",
    overview:
      "正三角形の盤に、三角形4〜5枚のピースを60度回転で積み、横一列を消す独自テトリス。",
    content: [
      "三角グリッドと重力落下",
      "ホールド・ネクストキュー",
      "連鎖・レベル・スコア",
      "左右レイアウト（盤面大＋右レール）"
    ],
    controls: "←→ 移動 / ↑・Z 右回転 / X 左回転 / C ホールド / ↓ 軟降 / Space 硬降 / P 一時停止",
    run: "start-server.bat（port.txt 参照、既定 5102）",
    files: "index.html, style.css, game.js, vq-server.js, port.txt, start-server.bat"
  },
  "04_RPG/01_RPG": {
    title: "RPG（Aeterna 系試作）",
    genre: "RPG",
    overview: "RPG カテゴリの大規模試作ライン。データ・シネマティック等を含む開発用ツリー。",
    content: ["コア／データ／アセット構成", "トレーラー・クロニクル等の資料データ"],
    controls: "プロジェクト固有（ビルド手順は当該フォルダの構成に従う）",
    run: "当該フォルダの開発手順に従う（簡易 vq-server がある場合は port 参照）",
    files: "src/, data/, game/ ほか — 詳細はディレクトリ内を参照"
  },
  "03_RHYTHM/01_RYTHOM": {
    title: "RYTHOM",
    genre: "リズムゲーム",
    overview: "レーン上のノーツをタイミングよく取るリズムアクション試作。",
    content: ["チャート再生", "スコア・判定", "ステージ気分の演出余地"],
    controls: "画面/キー操作（タイトル画面の案内に従う）",
    run: "start-server.bat（port 5103）",
    files: "index.html, game.js, style.css, vq-server.js ほか"
  },
  "05_PARTY/01_BOARD GAME": {
    title: "PARTY BOARD GAME",
    genre: "パーティ／ボード",
    overview: "パーティ向け卓上ルールのデジタル試作ボード。",
    content: ["ローカルプレイ導線", "ルール説明UI"],
    controls: "画面内ボタン",
    run: "start-server.bat（port 5105）",
    files: "index.html, vq-server.js, port.txt ほか"
  },
  "05_PARTY/02_JINRO": {
    title: "JINRO",
    genre: "人狼・ソーシャル推理",
    overview: "人狼パーティーゲームの進行支援／プレイ用フロント。",
    content: ["役職・夜フェーズ進行", "議論用UI", "AI補助スクリプトの余地"],
    controls: "画面操作",
    run: "start-server.bat（port 5106）",
    files: "js/, index 系, vq-server.js"
  },
  "05_PARTY/03_WORD WOLF": {
    title: "WORD WOLF",
    genre: "ワードウルフ",
    overview: "多数派と少数派で異なるお題を持ち議論するパーティゲーム。",
    content: ["お題配布", "議論タイマー的進行", "投票"],
    controls: "画面操作",
    run: "start-server.bat（port 5107）",
    files: "index / js, vq-server.js"
  },
  "06_CARD/001_MUSUKING": {
    title: "MUSUKING",
    genre: "キャラカード",
    overview: "キャラクターカード収集・対戦を想定したカードゲーム試作。",
    content: ["カード一覧", "レアリティ感", "セット構成"],
    controls: "画面操作",
    run: "start-server.bat（port 5108）",
    files: "index.html, vq-server.js ほか"
  },
  "07_MATCHING/matching": {
    title: "MATCHING",
    genre: "マッチング",
    overview: "スワイプ／プロフィール型マッチング体験の試作。",
    content: ["プロフィール提示", "マッチング導線"],
    controls: "画面操作",
    run: "start-server.bat（port 5109）",
    files: "matching 配下"
  },
  "08_AISHO": {
    title: "AISHO（相性）",
    genre: "相性診断・マッチ",
    overview: "キャラクター同士の相性を楽しむ診断／マッチング系アプリ。",
    content: ["セットアップ", "キャラデータ", "相性結果"],
    controls: "画面操作（React 構成）",
    run: "start-server.bat（port 5110）※ node 依存あり",
    files: "src/, package.json, vq-server.js"
  },
  "09_COOKING": {
    title: "COOKING",
    genre: "料理ゲーム",
    overview: "レシピ・材料・調理手順を扱う料理ゲーム／体験。",
    content: ["レシピ進行", "UIシェル"],
    controls: "画面操作",
    run: "start-server.bat（port 5111）",
    files: "src/, public/, vq-server.js"
  },
  "10_FASHION": {
    title: "FASHION",
    genre: "ファッション",
    overview: "コーデやドロップを扱うファッションゲーム試作。",
    content: ["ルック選択", "コレクション感"],
    controls: "画面操作",
    run: "start-server.bat（port 5112）",
    files: "src/, vq-server.js"
  },
  "11_MATCHING": {
    title: "MATCHING（11）",
    genre: "マッチング",
    overview: "マッチング系の別実装ライン（data/public 構成）。",
    content: ["データ駆動プロフィール", "公開用フロント"],
    controls: "画面操作",
    run: "start-server.bat（port 5113）",
    files: "data/, public/, scripts/"
  },
  "12_PRESENT": {
    title: "PRESENT",
    genre: "プレゼント／ギフト",
    overview: "贈り物の選定・演出を扱う体験アプリ。",
    content: ["ギフト導線", "演出"],
    controls: "画面操作",
    run: "start-server.bat（port 5114）",
    files: "src/, vq-server.js"
  },
  "13_TRAVEL": {
    title: "TRAVEL",
    genre: "旅行クエスト",
    overview: "ルート・スポットを辿る旅行／軽い冒険体験。",
    content: ["ルート", "スポット", "クエスト感"],
    controls: "画面操作",
    run: "start-server.bat（port 5115）",
    files: "src/, public/, scripts/"
  },
  "14_BOARDGAME/01_ISLEBOUND": {
    title: "ISLEBOUND",
    genre: "開拓ボード（カタン系）",
    overview: "サイコロで資源を得て道・集落・都市を広げ、VP7先取を目指す1人vsAI卓上トライアル。",
    content: ["ヘクス盤", "配置フェーズ→通常ターン", "盗賊（7）", "建設コスト"],
    controls: "画面ボタン（サイコロ・建設・ターン終了）",
    run: "start-server.bat（port 5141）",
    files: "index.html, style.css, game.js, vq-server.js"
  },
  "14_BOARDGAME/02_GLINTBAZAAR": {
    title: "GLINTBAZAAR",
    genre: "取引ボード",
    overview: "市場と資源のやりとりを軸にしたボードゲーム試作。",
    content: ["取引", "スコア", "AI対戦余地"],
    controls: "画面操作",
    run: "start-server.bat（port 5142）",
    files: "index.html, game.js, style.css, vq-server.js"
  },
  "14_BOARDGAME/03_RAILSPAN": {
    title: "RAILSPAN",
    genre: "路線構築",
    overview: "線路を繋いでネットワークを広げる路線系ボード試作。",
    content: ["路線配置", "接続スコア"],
    controls: "画面操作",
    run: "start-server.bat（port 5143）",
    files: "index.html, game.js, style.css, vq-server.js"
  },
  "14_BOARDGAME/04_MOSAICCOURT": {
    title: "MOSAICCOURT",
    genre: "タイル配置",
    overview: "モザイク／コートを埋める配置系ボード試作。",
    content: ["タイル配置", "模様得点"],
    controls: "画面操作",
    run: "start-server.bat（port 5144）",
    files: "index.html, game.js, style.css, vq-server.js"
  },
  "14_BOARDGAME/05_CROWNSTACK": {
    title: "CROWNSTACK",
    genre: "スタック／王冠争奪",
    overview: "スタックと得点地帯を巡る軽量ボード試作。",
    content: ["配置", "得点競り"],
    controls: "画面操作",
    run: "start-server.bat（port 5145）",
    files: "index.html, game.js, style.css, vq-server.js"
  }
};

const APP_BLURBS = {
  "15_SOCIAL_POST": ["SNS投稿の企画・下書き・ハッシュタグ案をまとめるスタジオツール。", ["投稿ボード", "AI下書き", "チャネル別メモ"]],
  "16_SHORT_VIDEO": ["縦動画の構成・カット案・フックを整理するツール。", ["構成", "フック", "書き出し"]],
  "17_CHAT_SUPPORT": ["カスタマーサポート返信の下書きとFAQ整理。", ["返信", "FAQ", "トーン"]],
  "18_HOMEPAGE": ["ホームページ構成とセクション文案の下書き。", ["構成", "コピー", "CTA"]],
  "19_EC_ASSET_GEN": ["EC用の商品説明・画像指示アセット生成。", ["商品文", "アセット指示"]],
  "20_WORKFLOW": ["業務ワークフローのステップ設計。", ["フロー", "担当", "期限"]],
  "21_LANGUAGE": ["多言語コピーと用語の整理。", ["用語", "翻訳メモ"]],
  "22_RESUME": ["職務経歴・履歴書の構成支援。", ["経歴", "要約"]],
  "23_EXPENSE_BUDGET": ["経費と予算の簡易トラッキング。", ["予算", "支出"]],
  "24_BOOKING_CRM": ["予約と顧客メモのCRMライト。", ["予約", "顧客"]],
  "25_MEETING_NOTES": ["会議メモとアクション抽出。", ["メモ", "ToDo"]],
  "26_EMAIL_SALES": ["営業メールの下書きと件名案。", ["件名", "本文"]],
  "27_SHIFT_BOARD": ["シフト表の簡易編成。", ["シフト", "空き"]],
  "28_REVIEW_REPLY": ["口コミ返信の下書き。", ["返信", "トーン"]],
  "29_INVOICE_QUICK": ["請求の線表と合計のクイック作成。", ["明細", "合計"]],
  "30_CONTENT_CAL": ["編集カレンダーとアイデアバックログ。", ["週次ボード", "アイデア", "CSV"]],
  "31_COMPETITOR": ["競合スキャンとバトルカード。", ["ライバル", "カード"]],
  "32_FORM_STUDIO": ["フォーム／アンケートビルダー。", ["項目", "プレビュー"]],
  "33_KNOWLEDGE": ["社内Wiki・SOP・FAQ。", ["記事", "FAQ"]],
  "34_PROPOSAL": ["提案書と見積ライン。", ["ブリーフ", "価格"]],
  "35_INVENTORY": ["在庫と発注アラート。", ["SKU", "発注"]],
  "36_LOYALTY": ["ポイント・ランク・キャンペーン。", ["会員", "特典"]],
  "37_NEWSLETTER": ["メルマガ号の下書きと件名。", ["号", "件名"]],
  "38_ANALYTICS": ["KPIダッシュと週次ナラティブ。", ["KPI", "レポート"]],
  "39_ONBOARDING": ["オンボーディング旅程とメール。", ["ステップ", "健全性"]],
  "40_CAST_BIBLE": ["文明別キャスト聖書（Relixia非破壊）。", ["ロスター", "文明", "CSV"]],
  "41_PUZZLE_LAB": ["三角ピースと難易度カーブ設計。", ["ピース", "カーブ"]],
  "42_BEAT_FORGE": ["リズムチャートとBPM設計。", ["チャート", "ステージ"]],
  "43_NIGHT_SCRIPT": ["人狼／ワードウルフ用シナリオ。", ["役職", "夜台本"]],
  "44_DECKLOOM": ["カードセットとレア配分。", ["カード", "バランス"]],
  "45_SPARK_MATCH": ["マッチングプロフィールと相性文。", ["プロフ", "タグ"]],
  "46_PANTRY_QUEST": ["料理クエストのレシピ設計。", ["レシピ", "材料"]],
  "47_ATELIER_DROP": ["ファッションDrop計画。", ["ルック", "パレット"]],
  "48_TABLE_FORGE": ["ボドゲ・プレイテスト記録。", ["タイトル", "セッション"]],
  "49_WAYFARE": ["旅行ルートとギフトクエスト。", ["ルート", "クエスト"]],
  "50_LORE_ATLAS": ["世界観ロア図鑑。", ["条目", "関係"]],
  "51_DIALOG_BENCH": ["セリフと分岐の作業台。", ["セリフ", "トーン"]],
  "52_LEVEL_CURVE": ["難易度カーブ設計。", ["圧力", "帯"]],
  "53_LOCALE_PACK": ["EN/JA文字列と用語集。", ["キー", "リスク"]],
  "54_BUG_TRIAGE": ["バグトリアージボード。", ["深刻度", "再現"]],
  "55_PATCH_NOTES": ["パッチノート仕分け。", ["公開", "社内"]],
  "56_ECONOMY_SIM": ["ソフトカレンシー経済試算。", ["入手", "消費"]],
  "57_NPC_SCHEDULE": ["NPCの一日行動表。", ["時刻", "地区"]],
  "58_CUTSCENE_BOARD": ["カットシーン絵コンテ。", ["ショット", "尺"]],
  "59_VOICE_CAST": ["ボイスキャスティングメモ。", ["役", "優先度"]],
  "60_THUMB_LAB": ["サムネ概念と採点。", ["フック", "文字"]],
  "61_PODCAST_RUN": ["ポッドキャスト進行表。", ["コーナー", "提供"]],
  "62_STREAM_HUD": ["配信HUD配置。", ["ウィジェット", "セーフゾーン"]],
  "63_CLIP_MINE": ["切り抜きアイデア採掘。", ["角度", "タイムスタンプ"]],
  "64_MERCH_SPEC": ["グッズSKU仕様。", ["印刷", "Drop"]],
  "65_PRICE_MATRIX": ["価格プラン比較。", ["ティア", "上限"]],
  "66_CHURN_WATCH": ["解約シグナル監視。", ["危険口座", "オファー"]],
  "67_SLA_DESK": ["サポートSLA台。", ["優先度", "違反"]],
  "68_RFP_ROOM": ["RFP要件と回答。", ["要件", "ギャップ"]],
  "69_VENDOR_SCORE": ["ベンダー採点。", ["コスト", "リスク"]],
  "70_POLICY_DRAFT": ["ポリシー下書き。", ["担当", "見直し"]],
  "71_AUDIT_TRAIL": ["監査チェックリスト。", ["証跡", "合否"]],
  "72_CAP_TABLE": ["キャップテーブルメモ（デモ）。", ["保有", "クラス"]],
  "73_OKR_BOARD": ["OKRボード。", ["目標", "確信度"]],
  "74_HIRING_SCORE": ["採用スコアカード。", ["観点", "判定"]],
  "75_EVENT_FLOOR": ["イベント会場配置。", ["動線", "人員"]],
  "76_MENU_COST": ["メニュー原価。", ["原価", "粗利"]],
  "77_RENTAL_LEDGER": ["賃貸台帳デモ。", ["部屋", "修繕"]],
  "78_CLINIC_FLOW": ["クリニック動線。", ["工程", "待ち"]],
  "79_SCHOOL_UNIT": ["授業ユニット設計。", ["目標", "宿題"]],
  "80_FARM_LOG": ["栽培ログ。", ["区画", "収穫"]],
  "81_PET_CARE": ["ペットケア予定。", ["日課", "病院"]],
  "82_MOVE_CHECK": ["引越しチェック。", ["届出", "ライフライン"]],
  "83_WEDDING_RUN": ["結婚式進行表。", ["合図", "業者"]],
  "84_SPORT_DRILL": ["練習ドリル帳。", ["強度", "時間"]],
  "85_API_CATALOG": ["APIカタログ。", ["認証", "サンプル"]],
  "86_ERROR_TAXONOMY": ["エラーコード体系。", ["文言", "担当"]],
  "87_FEATURE_FLAG": ["フィーチャーフラグ。", ["ロールアウト"]],
  "88_RELEASE_TRAIN": ["リリーストレイン。", ["凍結", "項目"]],
  "89_DESIGN_TOKEN": ["デザイントークン。", ["色", "余白"]],
  "90_A11Y_AUDIT": ["a11y監査。", ["深刻度", "修正"]],
  "91_PERF_BUDGET": ["パフォーマンス予算。", ["実測", "対策"]],
  "92_DATA_DICT": ["データ辞書。", ["PII", "項目"]],
  "93_PROMPT_LAB": ["プロンプト庫。", ["版", "評価"]],
  "94_EVAL_SET": ["評価セット。", ["ケース", "期待"]],
  "95_MOD_QUEUE": ["モデレーション待ち。", ["対応", "異議"]],
  "96_AMBASSADOR": ["アンバサダー台帳。", ["特典", "任務"]],
  "97_SURVEY_PULSE": ["パルス調査。", ["テーマ", "施策"]],
  "98_ROADMAP_VOTE": ["ロードマップ投票。", ["票", "状態"]],
  "99_CHANGELOG": ["公開チェンジログ。", ["タグ", "公開"]]
};

function listFiles(dir) {
  try {
    return fs
      .readdirSync(dir)
      .filter((n) => !n.startsWith(".") && n !== "node_modules" && n !== "src")
      .slice(0, 24);
  } catch {
    return [];
  }
}

function writeReadme(dest, body) {
  fs.writeFileSync(path.join(dest, "README.md"), body.replace(/\n{3,}/g, "\n\n"), "utf8");
}

function arcadeReadme(dir, meta, port) {
  const files = listFiles(path.join(ROOT, "100_ARCADE", dir));
  return `# ${meta.title}

> VELQUIA / 100_ARCADE · ${meta.genre}

## 概要

${meta.overview}

## ゲームの中身

${meta.content.map((x) => `- ${x}`).join("\n")}

| 項目 | 内容 |
|------|------|
| クリア条件 | ${meta.win} |
| 終了条件 | ${meta.lose} |
| 操作 | ${meta.controls} |
| ポート | ${port} |

## 起動方法

1. このフォルダで \`start-server.bat\` を実行（または \`node vq-server.js\`）
2. ブラウザで \`http://127.0.0.1:${port}/\` を開く
3. **はじめる** を押してプレイ

\`port.txt\` にポート番号があります。ゲームごとにサーバーは独立しています。

## フォルダ構成

\`\`\`
${files.map((f) => f).join("\n")}
\`\`\`

| ファイル | 役割 |
|----------|------|
| \`index.html\` | シェルUI |
| \`style.css\` | 見た目 |
| \`game.js\` | ルール・描画・入力 |
| \`vq-server.js\` | ローカル静的サーバ |
| \`start-server.bat\` | Windows起動 |
| \`product.json\` | メタデータ |

## 技術メモ

- Canvas 2D + リクエストアニメーションフレーム
- スコアベストは \`localStorage\` に保存
- 依存パッケージなし（Node はサーバ起動のみ）

## 関連

- 生成スクリプト: \`_gen_arcade_100.js\`
- 同系統のツールアプリ: \`41_PUZZLE_LAB\` など（ゲーム本体とは別）
`;
}

function legacyReadme(rel, meta) {
  return `# ${meta.title}

> VELQUIA / ${rel} · ${meta.genre}

## 概要

${meta.overview}

## ゲームの中身

${meta.content.map((x) => `- ${x}`).join("\n")}

## 操作

${meta.controls}

## 起動方法

${meta.run}

## 主なファイル

${meta.files}

## メモ

- Relixia（\`01_PROJECT\`）のアセットは変更しません
- サーバはゲームフォルダ単位（共有コントロールパネルなし）
`;
}

function appReadme(dir, product) {
  const brand = product.brand || dir.replace(/^\d+_/, "");
  const blur = APP_BLURBS[dir] || [`${brand} のスタンドアロン業務／制作デモ。`, ["メインボード", "AI実行", "エクスポート"]];
  const [overview, features] = blur;
  const files = listFiles(path.join(ROOT, dir));
  const based = product.basedOn || product.sub || product.angle || "standalone demo";
  return `# ${brand}

> VELQUIA スタンドアロンアプリ · \`${dir}\`

## 概要

${overview}

- **ID**: \`${product.id || dir}\`
- **バージョン**: ${product.version || "1.0.0"}
- **系統**: ${based}
- **保存**: ブラウザ \`localStorage\`（サーバ不要で \`index.html\` 直接も可）

## 中身・できること

${features.map((x) => `- ${x}`).join("\n")}
- **Run AI**: デモ用の自動投入・提案
- **Seed demo**: 初期データ投入
- 右ペイン／下部の pro desk（スナップショット・メモ）がある場合あり

## 画面構成

サイドナビの各ビュー（\`index.html\` の \`data-view\`）を切り替えて使います。文言は \`strings.js\`（EN/JA）。

## 起動方法

1. \`index.html\` をブラウザで開く、または任意の静的サーバでフォルダを配信
2. 初回は **Seed demo** → **Run AI** で中身を確認

\`_APP_SHARED\` はテンプレート専用。このアプリは \`shell.css\` / \`ai.js\` / \`i18n.js\` / \`app-kit.js\` を**自フォルダに同梱**しています。

## フォルダ構成

\`\`\`
${files.join("\n")}
\`\`\`

| ファイル | 役割 |
|----------|------|
| \`index.html\` | UIシェル |
| \`app.js\` | 画面ロジック |
| \`features.js\` | 追加パネル |
| \`ai.js\` | デモAIユーティリティ |
| \`strings.js\` / \`i18n.js\` | 多言語 |
| \`shell.css\` | 共通見た目 |
| \`product.json\` | メタデータ |

## 注意

- 本アプリはローカルデモです。本番APIや課金は含みません
- フォルダ名に \`AI_\` / \`GAME_\` 接頭辞は使いません
`;
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return {};
  }
}

let n = 0;

// Arcade
for (const [dir, meta] of Object.entries(ARCADE)) {
  const dest = path.join(ROOT, "100_ARCADE", dir);
  if (!fs.existsSync(dest)) continue;
  const pj = readJson(path.join(dest, "product.json"));
  writeReadme(dest, arcadeReadme(dir, meta, pj.port || "?"));
  n++;
  console.log("README", "100_ARCADE/" + dir);
}

// Category readme for arcade
writeReadme(
  path.join(ROOT, "100_ARCADE"),
  `# 100_ARCADE

VELQUIA のクラシック系アーケード／パズル小品集です。各タイトルは **独立フォルダ** で、\`start-server.bat\` から個別起動します。

| フォルダ | タイトル | ポート | 系統 |
|----------|----------|--------|------|
${Object.entries(ARCADE)
  .map(([dir, m]) => {
    const port = readJson(path.join(ROOT, "100_ARCADE", dir, "product.json")).port || "";
    return `| ${dir} | ${m.title} | ${port} | ${m.genre} |`;
  })
  .join("\n")}

詳細は各フォルダの \`README.md\` を参照。
`
);
n++;

// Legacy games
for (const [rel, meta] of Object.entries(LEGACY_GAMES)) {
  const dest = path.join(ROOT, ...rel.split("/"));
  if (!fs.existsSync(dest)) {
    console.warn("skip missing", rel);
    continue;
  }
  writeReadme(dest, legacyReadme(rel, meta));
  n++;
  console.log("README", rel);
}

// Category READMEs for 02-14
const cats = {
  "02_PUZZLE": "パズルゲーム",
  "03_RHYTHM": "リズムゲーム",
  "05_PARTY": "パーティゲーム",
  "06_CARD": "カードゲーム",
  "07_MATCHING": "マッチング",
  "08_AISHO": "相性・マッチ",
  "09_COOKING": "料理",
  "10_FASHION": "ファッション",
  "11_MATCHING": "マッチング（別ライン）",
  "12_PRESENT": "プレゼント",
  "13_TRAVEL": "旅行",
  "14_BOARDGAME": "ボードゲーム試作"
};
for (const [cat, label] of Object.entries(cats)) {
  const dest = path.join(ROOT, cat);
  if (!fs.existsSync(dest)) continue;
  const subs = fs
    .readdirSync(dest)
    .filter((n) => fs.statSync(path.join(dest, n)).isDirectory() && n !== "node_modules");
  writeReadme(
    dest,
    `# ${cat}

${label}カテゴリ。子フォルダごとに README と（あれば）ローカルサーバを持ちます。

## 収録

${subs.map((s) => `- [\`${s}\`](./${encodeURIComponent(s)}/README.md)`).join("\n") || "- （ルート直下が本体）"}

Relixia（\`01_PROJECT\`）は本カテゴリに含まれません。
`
  );
  n++;
}

// Apps 15-99
for (const ent of fs.readdirSync(ROOT, { withFileTypes: true })) {
  if (!ent.isDirectory()) continue;
  if (!/^(1[5-9]|[2-9]\d)_/.test(ent.name)) continue;
  const num = parseInt(ent.name.slice(0, 2), 10);
  if (num < 15 || num > 99) continue;
  const dest = path.join(ROOT, ent.name);
  const product = readJson(path.join(dest, "product.json"));
  writeReadme(dest, appReadme(ent.name, product));
  n++;
  console.log("README", ent.name);
}

// Root index of READMEs
writeReadme(
  ROOT,
  `# 01_GAME DEVELOPMENT — README 索引

各ゲーム／アプリフォルダに \`README.md\`（概要・中身・起動方法）があります。

## ゲーム

- [\`100_ARCADE\`](./100_ARCADE/README.md) … アーケード15本
- [\`02_PUZZLE\`](./02_PUZZLE/README.md) … 三角テトリス など
- [\`03_RHYTHM\`](./03_RHYTHM/README.md)
- [\`05_PARTY\`](./05_PARTY/README.md) … 人狼・ワードウルフ など
- [\`06_CARD\`](./06_CARD/README.md)
- [\`07_MATCHING\`](./07_MATCHING/README.md) / [\`11_MATCHING\`](./11_MATCHING/README.md)
- [\`08_AISHO\`](./08_AISHO/README.md) … [\`09_COOKING\`](./09_COOKING/README.md) … [\`10_FASHION\`](./10_FASHION/README.md)
- [\`12_PRESENT\`](./12_PRESENT/README.md) / [\`13_TRAVEL\`](./13_TRAVEL/README.md)
- [\`14_BOARDGAME\`](./14_BOARDGAME/README.md)

\`01_PROJECT / RELIXIA\` は本索引の自動生成対象外（本体アセット非破壊方針）。

## スタンドアロンアプリ（15–99）

各 \`NN_NAME/README.md\` を参照。\`index.html\` を開けばローカルデモが動きます。

## 生成

\`node _gen_readmes.js\` で README を再生成できます。
`
);

console.log("done READMEs", n);
