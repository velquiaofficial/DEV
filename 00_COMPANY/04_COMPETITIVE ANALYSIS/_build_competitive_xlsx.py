# -*- coding: utf-8 -*-
"""Build VELQUIA competitive-analysis workbook from curated public sources.
Does NOT scrape Google Play / App Store / Steam in bulk (ToS + infeasible).
"""
from __future__ import annotations

from datetime import date
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

OUT_DIR = Path(__file__).resolve().parent
AS_OF = "2026-10-13"
TODAY = date(2026, 10, 13)

# Shared column schema for product sheets
COLUMNS = [
    ("product_id", "内部ID"),
    ("name", "製品名"),
    ("publisher_developer", "パブリッシャー / 開発"),
    ("category", "カテゴリ"),
    ("subgenre", "サブジャンル"),
    ("platform_primary", "主プラットフォーム"),
    ("platforms_all", "対応プラットフォーム"),
    ("store_google_play", "Google Play URL"),
    ("store_app_store", "App Store URL"),
    ("store_steam", "Steam URL"),
    ("store_other", "その他ストア / Web"),
    ("launch_date", "ローンチ日 (初出)"),
    ("launch_date_confidence", "ローンチ日確度"),
    ("rating_google", "評価 Google (★)"),
    ("ratings_count_google", "評価件数 Google"),
    ("rating_apple", "評価 Apple (★)"),
    ("ratings_count_apple", "評価件数 Apple"),
    ("rating_steam_pct", "Steam好評%"),
    ("steam_review_count", "Steamレビュー件数"),
    ("steam_review_label", "Steamレビュー帯"),
    ("downloads_all_time_note", "累計DL / 導入メモ"),
    ("downloads_2025_mm", "2025年DL (百万・推定)"),
    ("downloads_period", "DL期間メモ"),
    ("steam_peak_ccu", "Steamピーク同時接続"),
    ("monetization", "マネタイズ"),
    ("price_usd_note", "価格メモ (USD等)"),
    ("region_focus", "主な地域"),
    ("velquia_relevance", "VELQUIA関連度"),
    ("velquia_angle", "競合として見る切り口"),
    ("data_confidence", "データ確度"),
    ("source_primary", "主出典"),
    ("source_urls", "出典URL"),
    ("notes", "メモ"),
    ("last_reviewed", "最終確認日"),
]

HEADER_FILL = PatternFill("solid", fgColor="1F3A5F")
HEADER_FONT = Font(color="FFFFFF", bold=True, name="Calibri", size=11)
THIN = Border(
    left=Side(style="thin", color="D0D7DE"),
    right=Side(style="thin", color="D0D7DE"),
    top=Side(style="thin", color="D0D7DE"),
    bottom=Side(style="thin", color="D0D7DE"),
)
ZEBRA = PatternFill("solid", fgColor="F6F8FA")
TITLE_FONT = Font(name="Calibri", size=18, bold=True, color="1F3A5F")
SUB_FONT = Font(name="Calibri", size=11, color="57606A")


def style_header(ws, ncols: int):
    for col in range(1, ncols + 1):
        cell = ws.cell(1, col)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
        cell.border = THIN
    ws.row_dimensions[1].height = 36
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = f"A1:{get_column_letter(ncols)}1"


def autosize(ws, min_w=10, max_w=42):
    for col in ws.columns:
        letter = get_column_letter(col[0].column)
        length = 0
        for cell in col[:80]:
            if cell.value is None:
                continue
            length = max(length, min(max_w, len(str(cell.value)) + 2))
        ws.column_dimensions[letter].width = max(min_w, length)


def write_rows(ws, rows: list[dict]):
    keys = [c[0] for c in COLUMNS]
    for j, (en, ja) in enumerate(COLUMNS, 1):
        ws.cell(1, j, f"{en}\n{ja}")
    style_header(ws, len(COLUMNS))
    for i, row in enumerate(rows, 2):
        for j, key in enumerate(keys, 1):
            cell = ws.cell(i, j, row.get(key, ""))
            cell.border = THIN
            cell.alignment = Alignment(wrap_text=True, vertical="top")
            if i % 2 == 0:
                cell.fill = ZEBRA
    autosize(ws)


def base(**kwargs):
    d = {k: "" for k, _ in COLUMNS}
    d["last_reviewed"] = AS_OF
    d.update(kwargs)
    return d


MOBILE_GAMES = [
    base(
        product_id="MG-001",
        name="Block Blast!",
        publisher_developer="Hungry Studio",
        category="Game",
        subgenre="Puzzle / Block",
        platform_primary="Mobile",
        platforms_all="iOS; Android",
        launch_date="2022 (approx global scale-up earlier soft launches vary)",
        launch_date_confidence="Medium",
        rating_google="~4.5–4.8 (region varies)",
        rating_apple="",
        downloads_2025_mm=356.2,
        downloads_period="2025-01-01 → 2025-12-22 (App Store+GP, AppMagic via PocketGamer)",
        downloads_all_time_note="2025 most-downloaded mobile game (est.)",
        monetization="F2P / IAP / ads",
        region_focus="Global",
        velquia_relevance="High",
        velquia_angle="Casual puzzle retention / live-ops cadence vs VELQUIA puzzle titles",
        data_confidence="High (download rank); Medium (rating)",
        source_primary="PocketGamer / AppMagic 2025 downloads; Business of Apps",
        source_urls="https://www.pocketgamer.biz/the-most-downloaded-mobile-games-of-2025/; https://www.businessofapps.com/data/most-popular-mobile-games/",
        notes="iOS 2025 ~89M DL (Business of Apps); GP ~213M",
    ),
    base(
        product_id="MG-002",
        name="Roblox",
        publisher_developer="Roblox Corporation",
        category="Game",
        subgenre="UGC / Metaverse",
        platform_primary="Mobile",
        platforms_all="iOS; Android; Windows; Console",
        store_other="https://www.roblox.com/",
        launch_date="2006-09 (platform); mobile later",
        launch_date_confidence="High",
        rating_google="4.4",
        ratings_count_google="~44.7M (cited Jul 2025 secondary)",
        rating_apple="",
        downloads_2025_mm=286,
        downloads_period="2025 YTD (PocketGamer/AppMagic)",
        downloads_all_time_note="All-time installs reported ~1.28B+ (secondary Jul 2025)",
        monetization="F2P / Robux IAP",
        region_focus="Global",
        velquia_relevance="Medium",
        velquia_angle="UGC platform gravity; not direct genre clone",
        data_confidence="High",
        source_primary="PocketGamer; SplitMetrics Jul 2025 GP snapshot",
        source_urls="https://www.pocketgamer.biz/the-most-downloaded-mobile-games-of-2025/; https://splitmetrics.com/blog/most-downloaded-games-in-google-play/",
    ),
    base(
        product_id="MG-003",
        name="Free Fire / Free Fire MAX",
        publisher_developer="Garena",
        category="Game",
        subgenre="Battle Royale",
        platform_primary="Mobile",
        platforms_all="iOS; Android",
        launch_date="2017-12-04 (Free Fire)",
        launch_date_confidence="High",
        rating_google="4.4",
        ratings_count_google="~125M (cited Jul 2025 secondary)",
        downloads_2025_mm=279.6,
        downloads_period="2025 combined FF+MAX (PocketGamer)",
        downloads_all_time_note="All-time ~1.87B+ (secondary)",
        monetization="F2P / IAP / battle pass",
        region_focus="SEA; LATAM; IN; Global emerging",
        velquia_relevance="Low",
        velquia_angle="Scale benchmark only",
        data_confidence="High",
        source_primary="PocketGamer; SplitMetrics",
        source_urls="https://www.pocketgamer.biz/the-most-downloaded-mobile-games-of-2025/",
        notes="FF 150.2M + MAX 129.4M in 2025 period cited",
    ),
    base(
        product_id="MG-004",
        name="Subway Surfers",
        publisher_developer="SYBO Games",
        category="Game",
        subgenre="Endless runner",
        platform_primary="Mobile",
        platforms_all="iOS; Android",
        launch_date="2012-05-24",
        launch_date_confidence="High",
        rating_google="4.4",
        ratings_count_google="~42.1M (cited Jul 2025)",
        downloads_2025_mm=186.7,
        downloads_period="2025 YTD PocketGamer",
        downloads_all_time_note="All-time ~2.65B+ (secondary Jul 2025)",
        monetization="F2P / ads / IAP",
        region_focus="Global",
        velquia_relevance="Medium",
        velquia_angle="Arcade simplicity + seasonal skins (cf. TUNNELRUN / FLAPGLIDE)",
        data_confidence="High",
        source_primary="PocketGamer; SplitMetrics",
        source_urls="https://www.pocketgamer.biz/the-most-downloaded-mobile-games-of-2025/; https://splitmetrics.com/blog/most-downloaded-games-in-google-play/",
    ),
    base(
        product_id="MG-005",
        name="Pizza Ready!",
        publisher_developer="Supercent",
        category="Game",
        subgenre="Idle / Hypercasual sim",
        platform_primary="Mobile",
        platforms_all="iOS; Android",
        launch_date="2024 (scale year 2025)",
        launch_date_confidence="Medium",
        downloads_2025_mm=161,
        downloads_period="2025 YTD PocketGamer",
        monetization="F2P / IAP / ads",
        region_focus="Global",
        velquia_relevance="Medium",
        velquia_angle="Idle cooking / ops fantasy vs COOKING line",
        data_confidence="High (DL); Medium (launch)",
        source_primary="PocketGamer / AppMagic",
        source_urls="https://www.pocketgamer.biz/the-most-downloaded-mobile-games-of-2025/",
    ),
    base(
        product_id="MG-006",
        name="Candy Crush Saga",
        publisher_developer="King (Microsoft)",
        category="Game",
        subgenre="Match-3",
        platform_primary="Mobile",
        platforms_all="iOS; Android; Web",
        launch_date="2012-04-12",
        launch_date_confidence="High",
        rating_google="4.6",
        ratings_count_google="~38.9M (cited Jul 2025)",
        downloads_2025_mm=98,
        downloads_period="2025 Business of Apps table",
        downloads_all_time_note="All-time ~1.99B+ (secondary)",
        monetization="F2P / IAP",
        region_focus="Global",
        velquia_relevance="High",
        velquia_angle="Match-3 economy & live-ops vs GEMTRI",
        data_confidence="High",
        source_primary="Business of Apps; SplitMetrics",
        source_urls="https://www.businessofapps.com/data/most-popular-mobile-games/; https://splitmetrics.com/blog/most-downloaded-games-in-google-play/",
    ),
    base(
        product_id="MG-007",
        name="Vita Mahjong",
        publisher_developer="Vita Studio",
        category="Game",
        subgenre="Mahjong solitaire",
        platform_primary="Mobile",
        platforms_all="iOS; Android",
        launch_date="2023–2024 (est.)",
        launch_date_confidence="Low",
        downloads_2025_mm=121.9,
        downloads_period="2025 YTD PocketGamer (#7)",
        monetization="F2P / ads / IAP",
        region_focus="Global",
        velquia_relevance="Medium",
        velquia_angle="Tile / solitaire wave",
        data_confidence="High (DL)",
        source_primary="PocketGamer",
        source_urls="https://www.pocketgamer.biz/the-most-downloaded-mobile-games-of-2025/",
    ),
    base(
        product_id="MG-008",
        name="Hole.io",
        publisher_developer="Voodoo",
        category="Game",
        subgenre="IO / Arcade",
        platform_primary="Mobile",
        platforms_all="iOS; Android",
        launch_date="2018",
        launch_date_confidence="High",
        downloads_2025_mm=111,
        downloads_period="2025 Business of Apps / PocketGamer mentions",
        monetization="F2P / ads",
        region_focus="Global",
        velquia_relevance="Low",
        velquia_angle="Hypercasual distribution benchmark",
        data_confidence="Medium",
        source_primary="Business of Apps; PocketGamer",
        source_urls="https://www.businessofapps.com/data/most-popular-mobile-games/",
    ),
    base(
        product_id="MG-009",
        name="PUBG Mobile",
        publisher_developer="Tencent / Krafton",
        category="Game",
        subgenre="Battle Royale",
        platform_primary="Mobile",
        platforms_all="iOS; Android",
        launch_date="2018-03-19",
        launch_date_confidence="High",
        downloads_2025_mm=93,
        downloads_period="2025 Business of Apps",
        monetization="F2P / IAP / Royale Pass",
        region_focus="Global (ex some regions)",
        velquia_relevance="Low",
        velquia_angle="Scale / esports benchmark",
        data_confidence="High",
        source_primary="Business of Apps",
        source_urls="https://www.businessofapps.com/data/most-popular-mobile-games/",
    ),
    base(
        product_id="MG-010",
        name="Mobile Legends: Bang Bang",
        publisher_developer="Moonton (ByteDance)",
        category="Game",
        subgenre="MOBA",
        platform_primary="Mobile",
        platforms_all="iOS; Android",
        launch_date="2016-07",
        launch_date_confidence="High",
        downloads_2025_mm=90,
        downloads_period="2025 Business of Apps",
        monetization="F2P / IAP / skins",
        region_focus="SEA; Global",
        velquia_relevance="Low",
        velquia_angle="Live-ops + esports",
        data_confidence="High",
        source_primary="Business of Apps",
        source_urls="https://www.businessofapps.com/data/most-popular-mobile-games/",
    ),
    base(
        product_id="MG-011",
        name="Ludo King",
        publisher_developer="Gametion",
        category="Game",
        subgenre="Board / Party",
        platform_primary="Mobile",
        platforms_all="iOS; Android",
        launch_date="2016",
        launch_date_confidence="High",
        rating_google="4.0",
        ratings_count_google="~10.1M (cited Jul 2025)",
        downloads_2025_mm=138,
        downloads_period="2025 Business of Apps",
        downloads_all_time_note="All-time ~1.28B+ (secondary)",
        monetization="F2P / ads / IAP",
        region_focus="India; Global",
        velquia_relevance="Medium",
        velquia_angle="Party / board digitalization vs BOARDGAME / party titles",
        data_confidence="High",
        source_primary="Business of Apps; SplitMetrics",
        source_urls="https://www.businessofapps.com/data/most-popular-mobile-games/",
    ),
    base(
        product_id="MG-012",
        name="8 Ball Pool",
        publisher_developer="Miniclip",
        category="Game",
        subgenre="Sports / Casual",
        platform_primary="Mobile",
        platforms_all="iOS; Android; Web",
        launch_date="2010 (web); mobile later",
        launch_date_confidence="Medium",
        rating_google="4.8",
        ratings_count_google="~30.4M (cited Jul 2025)",
        downloads_2025_mm=102,
        downloads_period="2025 Business of Apps",
        monetization="F2P / IAP / ads",
        region_focus="Global",
        velquia_relevance="Low",
        velquia_angle="Long-tail retention",
        data_confidence="High",
        source_primary="Business of Apps; SplitMetrics",
        source_urls="https://www.businessofapps.com/data/most-popular-mobile-games/",
    ),
    base(
        product_id="MG-013",
        name="EA Sports FC Mobile",
        publisher_developer="EA",
        category="Game",
        subgenre="Sports",
        platform_primary="Mobile",
        platforms_all="iOS; Android",
        launch_date="2016 as FIFA Mobile; rebrand 2023–24",
        launch_date_confidence="Medium",
        downloads_2025_mm=100,
        downloads_period="2025 Business of Apps",
        monetization="F2P / IAP / Ultimate Team",
        region_focus="Global",
        velquia_relevance="Low",
        velquia_angle="Sports live-ops",
        data_confidence="Medium",
        source_primary="Business of Apps",
        source_urls="https://www.businessofapps.com/data/most-popular-mobile-games/",
    ),
    base(
        product_id="MG-014",
        name="My Talking Tom 2",
        publisher_developer="Outfit7",
        category="Game",
        subgenre="Virtual pet",
        platform_primary="Mobile",
        platforms_all="iOS; Android",
        launch_date="2018-11",
        launch_date_confidence="High",
        rating_google="4.3",
        downloads_2025_mm=106,
        downloads_period="2025 Business of Apps",
        monetization="F2P / ads / IAP",
        region_focus="Global kids/family",
        velquia_relevance="Low",
        velquia_angle="Character IP + kids funnel",
        data_confidence="High",
        source_primary="Business of Apps; SplitMetrics",
        source_urls="https://www.businessofapps.com/data/most-popular-mobile-games/",
    ),
    base(
        product_id="MG-015",
        name="Among Us",
        publisher_developer="Innersloth",
        category="Game",
        subgenre="Social deduction",
        platform_primary="Mobile",
        platforms_all="iOS; Android; Steam; Console",
        launch_date="2018-06-15",
        launch_date_confidence="High",
        downloads_2025_mm=25,
        downloads_period="iOS 2025 list mention (Business of Apps)",
        monetization="F2P mobile / paid cosmetics; Steam paid",
        region_focus="Global",
        velquia_relevance="High",
        velquia_angle="Social deduction vs JINRO / WORD WOLF / NightScript tooling",
        data_confidence="Medium (2025 DL); High (launch)",
        source_primary="Business of Apps iOS list; public launch history",
        source_urls="https://www.businessofapps.com/data/most-popular-mobile-games/",
    ),
]

STEAM_GAMES = [
    base(
        product_id="ST-001",
        name="Counter-Strike 2",
        publisher_developer="Valve",
        category="Game",
        subgenre="FPS / Competitive",
        platform_primary="Steam",
        platforms_all="Windows; Linux",
        store_steam="https://store.steampowered.com/app/730/",
        launch_date="2023-09-27 (CS2); CS lineage 1999+",
        launch_date_confidence="High",
        rating_steam_pct="~87",
        steam_review_label="Very Positive (band varies)",
        steam_peak_ccu="~1M+ class historically; still top played",
        downloads_all_time_note="Free-to-play; owners in tens of millions+",
        monetization="F2P / cosmetics",
        region_focus="Global",
        velquia_relevance="Low",
        velquia_angle="PC concurrent benchmark",
        data_confidence="Medium (live CCU fluctuates)",
        source_primary="SteamCharts / SteamyData most-played snapshots",
        source_urls="https://steamydata.com/releases/2025/best",
    ),
    base(
        product_id="ST-002",
        name="Dota 2",
        publisher_developer="Valve",
        category="Game",
        subgenre="MOBA",
        platform_primary="Steam",
        platforms_all="Windows; macOS; Linux",
        store_steam="https://store.steampowered.com/app/570/",
        launch_date="2013-07-09",
        launch_date_confidence="High",
        rating_steam_pct="~87",
        steam_review_label="Very Positive",
        steam_peak_ccu="Often ~1M class on SteamyData snapshots",
        monetization="F2P / Battle Pass / cosmetics",
        region_focus="Global",
        velquia_relevance="Low",
        velquia_angle="Live service longevity",
        data_confidence="Medium",
        source_primary="SteamyData most-played",
        source_urls="https://steamydata.com/releases/2025/best",
    ),
    base(
        product_id="ST-003",
        name="PUBG: BATTLEGROUNDS",
        publisher_developer="KRAFTON",
        category="Game",
        subgenre="Battle Royale",
        platform_primary="Steam",
        platforms_all="Windows; Console",
        store_steam="https://store.steampowered.com/app/578080/",
        launch_date="2017-12-20 (1.0)",
        launch_date_confidence="High",
        rating_steam_pct="~55",
        steam_review_label="Mixed",
        steam_peak_ccu="Often top-3 concurrent",
        monetization="F2P / cosmetics (became F2P 2022)",
        region_focus="Global",
        velquia_relevance="Low",
        velquia_angle="PC F2P scale",
        data_confidence="Medium",
        source_primary="SteamyData",
        source_urls="https://steamydata.com/releases/2025/best",
    ),
    base(
        product_id="ST-004",
        name="Monster Hunter Wilds",
        publisher_developer="Capcom",
        category="Game",
        subgenre="Action RPG",
        platform_primary="Steam",
        platforms_all="Windows; PS5; Xbox",
        store_steam="https://store.steampowered.com/app/2246340/",
        launch_date="2025-02-28",
        launch_date_confidence="High",
        rating_steam_pct="~53",
        steam_review_count="~333000",
        steam_review_label="Mixed",
        steam_peak_ccu=1179869,
        monetization="Premium + DLC",
        price_usd_note="Premium AAA",
        region_focus="Global / JP strong",
        velquia_relevance="Medium",
        velquia_angle="Action RPG launch spike vs Relixia ambition (do not clone)",
        data_confidence="High (peak/review counts from SteamPeaks)",
        source_primary="SteamPeaks 2025 peaks; most-reviewed chart",
        source_urls="https://steampeaks.com/records?type=game&year=2025; https://steampeaks.com/charts/most-reviewed",
    ),
    base(
        product_id="ST-005",
        name="Hollow Knight: Silksong",
        publisher_developer="Team Cherry",
        category="Game",
        subgenre="Metroidvania",
        platform_primary="Steam",
        platforms_all="Windows; Console",
        store_steam="https://store.steampowered.com/app/1030300/",
        launch_date="2025-09-04",
        launch_date_confidence="High",
        rating_steam_pct="~89",
        steam_review_count="~424000",
        steam_review_label="Very Positive",
        steam_peak_ccu=462134,
        monetization="Premium",
        region_focus="Global",
        velquia_relevance="Medium",
        velquia_angle="Indie craft / narrative polish bar",
        data_confidence="High",
        source_primary="SteamPeaks",
        source_urls="https://steampeaks.com/records?type=game&year=2025; https://steampeaks.com/charts/most-reviewed",
    ),
    base(
        product_id="ST-006",
        name="PEAK",
        publisher_developer="Team PEAK / Aggro Crab et al.",
        category="Game",
        subgenre="Co-op / Climbing party",
        platform_primary="Steam",
        platforms_all="Windows",
        store_steam="https://store.steampowered.com/app/3527290/",
        launch_date="2025-06-16",
        launch_date_confidence="High",
        rating_steam_pct="94–95",
        steam_review_count="~378000",
        steam_review_label="Very Positive",
        steam_peak_ccu=169910,
        downloads_all_time_note="Third-party unit estimates exist (treat cautiously)",
        monetization="Premium",
        price_usd_note="~$8 class",
        region_focus="Global",
        velquia_relevance="High",
        velquia_angle="Party co-op hit; cf. party / board social loop",
        data_confidence="High",
        source_primary="SteamRanker / SteamPulse / SteamPeaks",
        source_urls="https://steamranker.com/game/3527290/peak; https://steampeaks.com/charts/most-reviewed",
    ),
    base(
        product_id="ST-007",
        name="R.E.P.O.",
        publisher_developer="semiwork",
        category="Game",
        subgenre="Co-op horror / physics",
        platform_primary="Steam",
        platforms_all="Windows",
        store_steam="https://store.steampowered.com/app/3241660/",
        launch_date="2025-02-26",
        launch_date_confidence="High",
        rating_steam_pct="~96",
        steam_review_count="~426000",
        steam_review_label="Overwhelmingly / Very Positive band",
        steam_peak_ccu=266908,
        monetization="Premium",
        region_focus="Global",
        velquia_relevance="Medium",
        velquia_angle="Small-team breakout on Steam",
        data_confidence="High",
        source_primary="SteamPeaks; SteamyData 2025 best",
        source_urls="https://steampeaks.com/charts/most-reviewed; https://steamydata.com/releases/2025/best",
    ),
    base(
        product_id="ST-008",
        name="Schedule I",
        publisher_developer="TVGS",
        category="Game",
        subgenre="Sim / Crime comedy",
        platform_primary="Steam",
        platforms_all="Windows",
        launch_date="2025-03-24",
        launch_date_confidence="High",
        rating_steam_pct="~98",
        steam_review_count="~319000",
        steam_review_label="Overwhelmingly Positive",
        steam_peak_ccu=455652,
        monetization="Premium",
        region_focus="Global",
        velquia_relevance="Low",
        velquia_angle="Indie viral loop",
        data_confidence="High",
        source_primary="SteamPeaks",
        source_urls="https://steampeaks.com/records?type=game&year=2025",
    ),
    base(
        product_id="ST-009",
        name="Clair Obscur: Expedition 33",
        publisher_developer="Sandfall Interactive",
        category="Game",
        subgenre="Turn-based RPG",
        platform_primary="Steam",
        platforms_all="Windows; Console",
        launch_date="2025-04-24",
        launch_date_confidence="High",
        rating_steam_pct="~95",
        steam_review_count="~280000",
        steam_review_label="Overwhelmingly / Very Positive",
        steam_peak_ccu=144901,
        monetization="Premium",
        region_focus="Global / West + JP interest",
        velquia_relevance="High",
        velquia_angle="Narrative RPG craft bar (Relixia reference class — do not copy assets)",
        data_confidence="High",
        source_primary="SteamPeaks",
        source_urls="https://steampeaks.com/charts/most-reviewed",
    ),
    base(
        product_id="ST-010",
        name="Marvel Rivals",
        publisher_developer="NetEase",
        category="Game",
        subgenre="Hero shooter",
        platform_primary="Steam",
        platforms_all="Windows; Console",
        launch_date="2024-12-06",
        launch_date_confidence="High",
        steam_review_count="~420000",
        steam_peak_ccu=642333,
        monetization="F2P / battle pass / cosmetics",
        region_focus="Global",
        velquia_relevance="Low",
        velquia_angle="F2P live-ops",
        data_confidence="High (peak); Medium (rating label)",
        source_primary="SteamPeaks 2025 peaks",
        source_urls="https://steampeaks.com/records?type=game&year=2025",
    ),
    base(
        product_id="ST-011",
        name="Stardew Valley",
        publisher_developer="ConcernedApe",
        category="Game",
        subgenre="Farm sim / Life sim",
        platform_primary="Steam",
        platforms_all="Multi",
        store_steam="https://store.steampowered.com/app/413150/",
        launch_date="2016-02-26",
        launch_date_confidence="High",
        rating_steam_pct="~98",
        steam_review_label="Overwhelmingly Positive",
        monetization="Premium",
        region_focus="Global",
        velquia_relevance="Medium",
        velquia_angle="Life-sim depth vs COOKING / FARM_LOG adjacent tools",
        data_confidence="High (qualitative); peak not re-pulled live",
        source_primary="Public Steam listing reputation",
        source_urls="https://store.steampowered.com/app/413150/",
        notes="Evergreen indie benchmark",
    ),
    base(
        product_id="ST-012",
        name="Among Us (Steam)",
        publisher_developer="Innersloth",
        category="Game",
        subgenre="Social deduction",
        platform_primary="Steam",
        platforms_all="Multi",
        store_steam="https://store.steampowered.com/app/945360/",
        launch_date="2018-11-16 (Steam)",
        launch_date_confidence="High",
        rating_steam_pct="~92",
        steam_review_label="Very / Overwhelmingly Positive historically",
        monetization="Premium + cosmetics DLC",
        region_focus="Global",
        velquia_relevance="High",
        velquia_angle="Party social deduction",
        data_confidence="Medium",
        source_primary="Steam store public page (qualitative)",
        source_urls="https://store.steampowered.com/app/945360/",
    ),
]

CONSUMER_APPS = [
    base(
        product_id="AP-001",
        name="ChatGPT",
        publisher_developer="OpenAI",
        category="App",
        subgenre="AI assistant",
        platform_primary="Mobile + Web",
        platforms_all="iOS; Android; Web",
        store_app_store="https://apps.apple.com/us/app/chatgpt/id6448311069",
        store_google_play="https://play.google.com/store/apps/details?id=com.openai.chatgpt",
        launch_date="2023-05 (iOS); 2023-07 (Android approx)",
        launch_date_confidence="High",
        rating_apple="4.8",
        ratings_count_apple="~11M",
        rating_google="~4.8",
        ratings_count_google="Large (reports cite tens of millions of ratings)",
        downloads_all_time_note="Third-party trackers cite 1B+ Android installs class — treat as estimate",
        monetization="Freemium / Plus / Pro",
        region_focus="Global",
        velquia_relevance="High",
        velquia_angle="AI assistant UX / distribution ceiling for VELQUIA AI app demos",
        data_confidence="High (App Store rating); Medium (DL)",
        source_primary="Apple App Store listing; AppBrain / AppDashboard secondary",
        source_urls="https://apps.apple.com/us/app/chatgpt/id6448311069; https://www.appbrain.com/appstore/chatgpt/ios-6448311069",
    ),
    base(
        product_id="AP-002",
        name="Claude by Anthropic",
        publisher_developer="Anthropic",
        category="App",
        subgenre="AI assistant",
        platform_primary="Mobile + Web",
        platforms_all="iOS; Android; Web",
        store_app_store="https://apps.apple.com/us/app/claude-by-anthropic/id6473753684",
        launch_date="2024-05-01",
        launch_date_confidence="High",
        rating_apple="4.7",
        ratings_count_apple="~278K",
        downloads_all_time_note="Sensor Tower-type estimates: ~8M downloads last month (WW) — estimate",
        monetization="Freemium / Pro / Max",
        region_focus="Global (availability varies)",
        velquia_relevance="High",
        velquia_angle="AI competitor UX & pricing ladder",
        data_confidence="High (rating/launch); Medium (DL est.)",
        source_primary="Apple App Store; Sensor Tower overview blurb",
        source_urls="https://apps.apple.com/us/app/claude-by-anthropic/id6473753684",
    ),
    base(
        product_id="AP-003",
        name="CapCut",
        publisher_developer="Bytedance / CapCut",
        category="App",
        subgenre="Video editor",
        platform_primary="Mobile",
        platforms_all="iOS; Android; Desktop",
        launch_date="2020-04-14 (often cited iOS)",
        launch_date_confidence="Medium",
        rating_apple="~4.6",
        ratings_count_apple="~1.1M (cited secondary)",
        downloads_all_time_note="Hundreds of millions installs class (secondary)",
        monetization="Freemium / Pro",
        region_focus="Global",
        velquia_relevance="High",
        velquia_angle="Short-video creation vs SHORT_VIDEO / ThumbLab tools",
        data_confidence="Medium",
        source_primary="Secondary app-intel snippets",
        source_urls="https://apps.apple.com/",
        notes="Confirm live store numbers before board use",
    ),
    base(
        product_id="AP-004",
        name="Canva",
        publisher_developer="Canva",
        category="App",
        subgenre="Design",
        platform_primary="Web + Mobile",
        platforms_all="iOS; Android; Web",
        store_other="https://www.canva.com/",
        launch_date="2013 (web); mobile later",
        launch_date_confidence="High",
        monetization="Freemium / Teams",
        region_focus="Global",
        velquia_relevance="High",
        velquia_angle="Creative ops / EC asset / social creative stack",
        data_confidence="Medium (rating not re-scraped)",
        source_primary="Company public history",
        source_urls="https://www.canva.com/",
        notes="Fill live ratings from stores before executive use",
    ),
    base(
        product_id="AP-005",
        name="Notion",
        publisher_developer="Notion Labs",
        category="App",
        subgenre="Workspace / Docs",
        platform_primary="Web + Mobile",
        platforms_all="iOS; Android; Desktop; Web",
        store_other="https://www.notion.so/",
        launch_date="2016 (public growth later)",
        launch_date_confidence="Medium",
        monetization="Freemium / Plus / Business",
        region_focus="Global",
        velquia_relevance="High",
        velquia_angle="Knowledge base / meeting notes / workflow apps",
        data_confidence="Medium",
        source_primary="Public product history",
        source_urls="https://www.notion.so/",
    ),
    base(
        product_id="AP-006",
        name="TikTok",
        publisher_developer="ByteDance",
        category="App",
        subgenre="Short video social",
        platform_primary="Mobile",
        platforms_all="iOS; Android",
        launch_date="2016 (Douyin) / 2018 intl TikTok merge era",
        launch_date_confidence="Medium",
        monetization="Ads / LIVE / e-commerce",
        region_focus="Global (ex some markets)",
        velquia_relevance="High",
        velquia_angle="Distribution channel for VELQUIA social automation",
        data_confidence="Medium",
        source_primary="Public company history",
        source_urls="https://www.tiktok.com/",
        notes="Store ratings fluctuate by country — fill per target market",
    ),
    base(
        product_id="AP-007",
        name="Instagram",
        publisher_developer="Meta",
        category="App",
        subgenre="Social / Reels",
        platform_primary="Mobile",
        platforms_all="iOS; Android; Web",
        launch_date="2010-10-06",
        launch_date_confidence="High",
        monetization="Ads / shopping",
        region_focus="Global",
        velquia_relevance="High",
        velquia_angle="Social posting / Reels vs SOCIAL_POST / IG automation",
        data_confidence="Medium (rating not freshly pulled)",
        source_primary="Public launch history",
        source_urls="https://www.instagram.com/",
    ),
    base(
        product_id="AP-008",
        name="X (Twitter)",
        publisher_developer="X Corp.",
        category="App",
        subgenre="Social / Microblog",
        platform_primary="Mobile + Web",
        platforms_all="iOS; Android; Web",
        launch_date="2006-07",
        launch_date_confidence="High",
        monetization="Ads / Premium",
        region_focus="Global",
        velquia_relevance="High",
        velquia_angle="Direct competitor channel for 03_SOCIAL_AUTO / X posting",
        data_confidence="Medium",
        source_primary="Public history",
        source_urls="https://x.com/",
    ),
    base(
        product_id="AP-009",
        name="Discord",
        publisher_developer="Discord Inc.",
        category="App",
        subgenre="Community chat",
        platform_primary="Multi",
        platforms_all="iOS; Android; Desktop; Web",
        launch_date="2015-05",
        launch_date_confidence="High",
        monetization="Nitro / ads experiments",
        region_focus="Global gaming + creators",
        velquia_relevance="Medium",
        velquia_angle="Community / mod queue tooling",
        data_confidence="Medium",
        source_primary="Public history",
        source_urls="https://discord.com/",
    ),
    base(
        product_id="AP-010",
        name="Figma",
        publisher_developer="Figma (Adobe)",
        category="App",
        subgenre="Design collaboration",
        platform_primary="Web",
        platforms_all="Web; Desktop shells",
        launch_date="2016",
        launch_date_confidence="High",
        monetization="Freemium / Org",
        region_focus="Global",
        velquia_relevance="Medium",
        velquia_angle="Design tokens / UI craft",
        data_confidence="Medium",
        source_primary="Public history",
        source_urls="https://www.figma.com/",
    ),
    base(
        product_id="AP-011",
        name="Midjourney",
        publisher_developer="Midjourney Inc.",
        category="App",
        subgenre="AI image",
        platform_primary="Web / Discord",
        platforms_all="Web; Discord",
        launch_date="2022",
        launch_date_confidence="Medium",
        monetization="Subscription",
        region_focus="Global",
        velquia_relevance="High",
        velquia_angle="Image gen for game/character pipelines",
        data_confidence="Medium",
        source_primary="Public product history",
        source_urls="https://www.midjourney.com/",
    ),
    base(
        product_id="AP-012",
        name="Unity",
        publisher_developer="Unity Technologies",
        category="App / Tool",
        subgenre="Game engine",
        platform_primary="Desktop",
        platforms_all="Windows; macOS",
        store_other="https://unity.com/",
        launch_date="2005",
        launch_date_confidence="High",
        monetization="Editor plans / Runtime fee history complex",
        region_focus="Global",
        velquia_relevance="High",
        velquia_angle="Engine choice for shipping VELQUIA games",
        data_confidence="High (qualitative)",
        source_primary="Company public history",
        source_urls="https://unity.com/",
    ),
]


def sheet_readme(wb: Workbook):
    ws = wb.create_sheet("00_README", 0)
    ws["A1"] = "VELQUIA — Competitive Analysis Workbook"
    ws["A1"].font = TITLE_FONT
    ws.merge_cells("A1:B1")
    lines = [
        ("As-of", AS_OF),
        ("Owner folder", "00_COMPANY/04_COMPETITIVE ANALYSIS"),
        ("Purpose", "Track global apps/games that matter to VELQUIA (games + AI/creative/social tools)."),
        (
            "IMPORTANT — Scraping",
            "Google Play / Apple App Store / Steam の全件自動スクレイピングは各ストア利用規約に抵触し、"
            "件数も現実的でないため本ブックでは実施していません。"
            "数値は公開記事・ストア表示・第三者レポートのキュレーションです。"
        ),
        (
            "How to refresh (合法)",
            "1) 対象アプリを優先度付け 2) 各ストア公式ページを目視/公式APIで更新 "
            "3) Sensor Tower / data.ai / AppMagic / SteamCharts 等の有償・公開レポートを転記 "
            "4) last_reviewed と source_urls を必ず更新",
        ),
        ("Sheets", "01_COLUMNS / 02_MOBILE_GAMES / 03_STEAM / 04_CONSUMER_APPS / 05_VELQUIA_MAP / 06_SOURCES / 07_BLANK_TEMPLATE"),
        ("Confidence legend", "High = 複数出典または公式表示に近い / Medium = 二次推定 / Low = 要再調査"),
        ("Disclaimer", "ダウンロード・売上は多くが推定値。投資・契約判断の前に一次ソースを再確認すること。"),
    ]
    ws["A3"] = "Field"
    ws["B3"] = "Detail"
    style_header(ws, 2)
    for i, (a, b) in enumerate(lines, 4):
        ws.cell(i, 1, a).font = Font(bold=True)
        ws.cell(i, 2, b).alignment = Alignment(wrap_text=True)
        ws.row_dimensions[i].height = 48
    ws.column_dimensions["A"].width = 28
    ws.column_dimensions["B"].width = 100


def sheet_columns(wb: Workbook):
    ws = wb.create_sheet("01_COLUMNS", 1)
    ws.append(["column_key", "日本語", "説明", "例"])
    style_header(ws, 4)
    docs = {
        "downloads_2025_mm": ("2025年の推定ダウンロード数（百万単位）", "356.2"),
        "steam_peak_ccu": ("Steam同時接続ピーク", "169910"),
        "rating_google": ("Google Play 星評価", "4.4"),
        "rating_apple": ("App Store 星評価", "4.8"),
        "rating_steam_pct": ("Steam 好評パーセンテージ", "94"),
        "launch_date": ("初回ローンチまたはリブランド日", "2012-05-24"),
        "velquia_relevance": ("自社との関連度 High/Medium/Low", "High"),
        "data_confidence": ("行全体の確度", "High"),
    }
    for key, ja in COLUMNS:
        ex = docs.get(key, ("—", ""))
        ws.append([key, ja, ex[0] if isinstance(ex, tuple) else "", ex[1] if isinstance(ex, tuple) else ""])
    autosize(ws)


def sheet_velquia_map(wb: Workbook):
    ws = wb.create_sheet("05_VELQUIA_MAP")
    headers = ["velquia_asset", "type", "watch_competitors", "why", "priority"]
    ws.append(headers)
    style_header(ws, len(headers))
    rows = [
        ("02_PUZZLE / TETORIS + GEMTRI/STACKDROP", "Game", "Block Blast!; Candy Crush; Vita Mahjong", "Puzzle retention & monetization patterns", "P0"),
        ("05_PARTY / JINRO / WORD WOLF", "Game", "Among Us", "Social deduction UX & party loop", "P0"),
        ("100_ARCADE / DOTMUNCH etc.", "Game", "Subway Surfers; Hole.io; classic arcade genre leaders", "Arcade session length & simplicity", "P1"),
        ("01_PROJECT / RELIXIA (do not scrape/edit assets)", "Game", "Clair Obscur; MH Wilds; narrative RPGs", "Production quality bar only", "P1"),
        ("15_SOCIAL_POST + 03_SOCIAL_AUTO", "App", "CapCut; Canva; Instagram; TikTok; X", "Content ops & distribution", "P0"),
        ("16_SHORT_VIDEO / ThumbLab", "App", "CapCut; TikTok", "Short-form creation", "P0"),
        ("AI demo apps 17–39 / PromptLab", "App", "ChatGPT; Claude", "Assistant UX & pricing", "P0"),
        ("14_BOARDGAME suite", "Game", "Ludo King; digital board hits", "Tabletop → digital conversion", "P2"),
        ("08_AISHO / matching", "App/Game", "dating/match apps (fill per market)", "Affinity UX", "P2"),
    ]
    for r in rows:
        ws.append(list(r))
    autosize(ws)


def sheet_sources(wb: Workbook):
    ws = wb.create_sheet("06_SOURCES")
    ws.append(["source_id", "name", "type", "url", "used_for", "accessed"])
    style_header(ws, 6)
    rows = [
        ("S01", "PocketGamer — most downloaded mobile games 2025", "Article / AppMagic", "https://www.pocketgamer.biz/the-most-downloaded-mobile-games-of-2025/", "Mobile DL ranks 2025", AS_OF),
        ("S02", "Business of Apps — most popular mobile games", "Industry data page", "https://www.businessofapps.com/data/most-popular-mobile-games/", "Mobile DL splits iOS/GP", AS_OF),
        ("S03", "SplitMetrics — GP most downloaded (Jul 2025)", "Article", "https://splitmetrics.com/blog/most-downloaded-games-in-google-play/", "Ratings + all-time DL cites", AS_OF),
        ("S04", "Sensor Tower blog — Dec 2025 mobile games", "Vendor blog", "https://sensortower.com/blog/top-10-worldwide-mobile-games-by-revenue-and-downloads-in-december-2025", "Monthly rank context", AS_OF),
        ("S05", "SteamPeaks records / most reviewed", "Steam analytics", "https://steampeaks.com/records?type=game&year=2025", "Steam peaks & reviews", AS_OF),
        ("S06", "SteamyData 2025 best / most played", "Steam analytics", "https://steamydata.com/releases/2025/best", "Steam concurrent snapshots", AS_OF),
        ("S07", "Apple App Store — ChatGPT / Claude pages", "Official store", "https://apps.apple.com/", "Ratings & launch", AS_OF),
        ("S08", "Steam store pages", "Official store", "https://store.steampowered.com/", "Links / qualitative", AS_OF),
    ]
    for r in rows:
        ws.append(list(r))
    autosize(ws)


def sheet_blank(wb: Workbook):
    ws = wb.create_sheet("07_BLANK_TEMPLATE")
    write_rows(ws, [])
    # add 25 empty formatted rows for manual entry
    for i in range(2, 27):
        for j in range(1, len(COLUMNS) + 1):
            cell = ws.cell(i, j, "")
            cell.border = THIN
    dv = DataValidation(type="list", formula1='"High,Medium,Low"', allow_blank=True)
    ws.add_data_validation(dv)
    # velquia_relevance col and data_confidence
    keys = [c[0] for c in COLUMNS]
    for key in ("velquia_relevance", "data_confidence", "launch_date_confidence"):
        col = keys.index(key) + 1
        dv.add(f"{get_column_letter(col)}2:{get_column_letter(col)}200")


def main():
    wb = Workbook()
    # remove default
    default = wb.active
    wb.remove(default)

    sheet_readme(wb)
    sheet_columns(wb)

    ws_m = wb.create_sheet("02_MOBILE_GAMES")
    write_rows(ws_m, MOBILE_GAMES)

    ws_s = wb.create_sheet("03_STEAM")
    write_rows(ws_s, STEAM_GAMES)

    ws_a = wb.create_sheet("04_CONSUMER_APPS")
    write_rows(ws_a, CONSUMER_APPS)

    sheet_velquia_map(wb)
    sheet_sources(wb)
    sheet_blank(wb)

    out = OUT_DIR / f"VELQUIA_Competitive_Analysis_{TODAY.isoformat()}.xlsx"
    wb.save(out)

    # Also CSV flat merge for git-friendly diff
    import csv

    flat = OUT_DIR / "competitive_landscape_flat.csv"
    with flat.open("w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=[c[0] for c in COLUMNS])
        w.writeheader()
        for row in MOBILE_GAMES + STEAM_GAMES + CONSUMER_APPS:
            w.writerow({k: row.get(k, "") for k in w.fieldnames})

    print("wrote", out)
    print("wrote", flat)
    print("rows", len(MOBILE_GAMES) + len(STEAM_GAMES) + len(CONSUMER_APPS))


if __name__ == "__main__":
    main()
