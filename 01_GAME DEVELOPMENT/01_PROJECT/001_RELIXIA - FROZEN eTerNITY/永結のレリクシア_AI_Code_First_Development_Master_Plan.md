# 永結のレリクシア --- AI / Code-First Development Master Plan

## 1. Project Goal

『永結のレリクシア』を、可能な限り
**コードとデータから生成・制御するゲーム/IP制作基盤** として開発する。

単にゲームを1本作るのではなく、以下を共通基盤から生成できる構成を目指す。

-   100キャラクター
-   3Dキャラクター
-   武器・衣装・アクセサリー
-   文明別建築・地形
-   戦闘
-   RELICシステム
-   CIVILIZATION SHIFT
-   ERA SHIFT
-   AI
-   UI
-   セーブ
-   PV / Shorts
-   自動レンダリング
-   将来的なオンライン対戦

基本方針：

> 人類の記憶は、少女となって永遠を戦う。

------------------------------------------------------------------------

## 2. Technology Stack

### Core

-   Unreal Engine 5
-   C++
-   Python
-   JSON / CSV
-   Git

### 3D / Asset Generation

-   Blender
-   Blender Python API
-   UE5 Procedural Mesh / PCG
-   UE5 Niagara
-   UE5 Material System

### Cinematic

-   UE5 Camera
-   Sequencer（可能な限りコード生成・コード制御）
-   Movie Render Queue
-   Pythonによるレンダリング自動化

### Development

-   Cursor
-   Git
-   Automated Tests

------------------------------------------------------------------------

## 3. Repository Structure

``` text
PROJECT_AETERNA/
│
├── Data/
│   ├── Characters/
│   ├── Civilizations/
│   ├── Eras/
│   ├── Skills/
│   ├── Weapons/
│   ├── Relationships/
│   └── Cinematics/
│
├── Generators/
│   ├── CharacterGenerator/
│   ├── FaceGenerator/
│   ├── HairGenerator/
│   ├── CostumeGenerator/
│   ├── WeaponGenerator/
│   ├── BuildingGenerator/
│   ├── TerrainGenerator/
│   ├── CivilizationGenerator/
│   └── VFXGenerator/
│
├── Game/
│   ├── Character/
│   ├── Combat/
│   ├── Skill/
│   ├── AI/
│   ├── Relic/
│   ├── CivilizationShift/
│   ├── EraShift/
│   ├── Camera/
│   ├── UI/
│   ├── Save/
│   └── Audio/
│
├── Cinematic/
│   ├── ShotGenerator/
│   ├── CameraDirector/
│   ├── LightingDirector/
│   ├── TrailerGenerator/
│   └── Renderer/
│
├── Pipeline/
│   ├── Build/
│   ├── Validate/
│   ├── Test/
│   ├── Export/
│   └── Render/
│
└── Output/
    ├── YouTube/
    ├── Shorts/
    └── Screenshots/
```

------------------------------------------------------------------------

# 4. Phase 1 --- 100 Character Database

100キャラクターを文章ではなく、共通Schemaを持つ構造化データとして管理する。

## Character Schema Example

``` json
{
  "id": "amaterasu",
  "name_ja": "天照",
  "name_en": "AMATERASU",
  "era": "MYTH",
  "civilization": "YAMATO",
  "class": "DIVINE",
  "role": "SUPPORT_ATTACKER",
  "element": "SUN",
  "weapon": "YATA_MIRROR",
  "height": 165,

  "appearance": {
    "hair": "long_black_gold",
    "eyes": "solar_gold",
    "costume": "yamato_divine"
  },

  "stats": {
    "hp": 850,
    "attack": 82,
    "defense": 65,
    "speed": 72
  },

  "skills": [
    "solar_ray",
    "divine_domain",
    "ama_no_iwato"
  ],

  "civilization_tags": [
    "JAPAN",
    "SHINTO",
    "SUN",
    "MYTH"
  ]
}
```

## Character Data

各キャラクターに以下を定義する。

-   ID
-   日本語名
-   英語名
-   出自
-   時代
-   文明
-   Class
-   Role
-   属性
-   身長・体格
-   髪
-   瞳
-   衣装
-   武器
-   Stats
-   Normal Attack
-   Skill 1
-   Skill 2
-   Ultimate
-   Passive
-   Civilization Tags
-   Relationships
-   Voice Type
-   Music Theme
-   Civilization Shift Effect

## Validator

``` bash
python validate_characters.py
```

以下を自動検査する。

-   ID重複
-   欠損値
-   Stats異常値
-   Skill参照切れ
-   Asset参照切れ
-   Civilization参照切れ
-   Relationship参照切れ

------------------------------------------------------------------------

# 5. Phase 2 --- Procedural 3D Character Generator

100体を完全に個別制作するのではなく、共通人体・共通Skeletonをベースに生成する。

``` text
Base Female Skeleton
        ↓
Body Parameters
        ↓
Face Parameters
        ↓
Hair
        ↓
Costume
        ↓
Accessories
        ↓
Weapon
        ↓
Materials
        ↓
Character
```

Blender Python APIを利用する。

``` python
character = CharacterGenerator("amaterasu")

character.generate_body()
character.generate_face()
character.generate_hair()
character.generate_costume()
character.generate_weapon()
character.generate_rig()
character.generate_materials()
character.export()
```

## Initial Priority

最初は以下の6体のみ高品質3D化する。

1.  天照
2.  アテナ
3.  イシス
4.  ローマ
5.  西施
6.  江戸

100体すべてはデータとして先に存在させる。

------------------------------------------------------------------------

# 6. Phase 3 --- Procedural Civilization Generator

文明ごとに世界生成ルールを定義する。

## YAMATO

``` text
Shrine
Torii
Sakura
Stone Lantern
Sacred Tree
Divine Light
Sacred Water
Mountain
```

## HELLAS

``` text
Temple
Column
Statue
Marble Road
Olive Tree
Agora
Sacred Flame
```

## ROME

``` text
Triumphal Arch
Aqueduct
Fortress
Roman Road
Forum
Column
Military Camp
```

## TOKYO

``` text
Skyscraper
Railway
Neon
Road
Digital Screen
Network
Station
Urban Infrastructure
```

C++ API例：

``` cpp
CivilizationGenerator.Generate(
    ECivilization::Yamato,
    Position,
    Radius
);
```

可能な範囲で建築物・道路・植生もProcedural Generationする。

------------------------------------------------------------------------

# 7. Phase 4 --- CIVILIZATION SHIFT

本作の中核システム。

初期状態：

``` text
THE FORGOTTEN WORLD

Colorless
Ruined
Silent
No Civilization
Lost Memories
```

RELICを起動すると文明が世界を復元する。

``` text
RELIC ACTIVATION
        ↓
Memory Wave
        ↓
Ground Illumination
        ↓
Color Restoration
        ↓
Vegetation Restoration
        ↓
Architecture Generation
        ↓
Lighting Transformation
        ↓
Civilization Domain
```

## 天照

``` text
廃墟
↓
光
↓
桜
↓
鳥居
↓
神社
↓
神木
↓
YAMATO DOMAIN
```

見た目だけでなくゲームルールも変える。

``` text
YAMATO DOMAIN

Amaterasu Power +15%
Healing +10%
Relic Generation +20%
```

敵文明が領域を奪えば別文明へ再構築される。

------------------------------------------------------------------------

# 8. Phase 5 --- Core Combat

実装する基本戦闘機能：

``` text
Movement
Camera
Lock-on
Normal Attack
Heavy Attack
Dash
Dodge
Guard
Hit Detection
Damage
HP
Stagger
Down
Death
Respawn
```

その上にキャラクター能力を載せる。

``` text
Skill 1
Skill 2
Ultimate
Passive
RELIC Skill
Civilization Skill
```

データ駆動化する。

``` cpp
SkillSystem.Execute(
    CharacterID,
    SkillID,
    Target
);
```

キャラクターごとの巨大な専用コードを可能な限り避ける。

------------------------------------------------------------------------

# 9. Phase 6 --- Complete Amaterasu

最初の完全実装キャラクターを天照にする。

``` text
3D Model
↓
Rig
↓
Animation
↓
Movement
↓
Normal Attack
↓
Skill 1
↓
Skill 2
↓
Ultimate
↓
Passive
↓
RELIC
↓
Civilization Shift
↓
VFX
↓
Sound
↓
AI
```

最初の成功条件：

> 天照1体だけでも5分以上遊んで面白い。

100キャラを先に実装しない。

------------------------------------------------------------------------

# 10. Phase 7 --- AI

CPU State Machine / Behavior Tree：

``` text
Idle
↓
Search
↓
Approach
↓
Attack
↓
Dodge
↓
Skill
↓
Retreat
↓
Capture RELIC
↓
Defend Civilization
```

Role別AI：

``` text
ATTACKER
DEFENDER
SUPPORT
CONTROLLER
TACTICIAN
```

------------------------------------------------------------------------

# 11. Phase 8 --- Founders Six

天照のシステム完成後、以下へ拡張。

``` text
天照
アテナ
イシス
ローマ
西施
江戸
```

理想的には：

``` cpp
SpawnCharacter("athena");
```

だけでCharacter Dataから必要な情報をロードできる設計にする。

------------------------------------------------------------------------

# 12. Phase 9 --- ERA SHIFT

文明だけでなく時間そのものをゲームシステム化する。

``` text
MYTH
 ↓
ANCIENT
 ↓
MEDIEVAL
 ↓
EARLY MODERN
 ↓
MODERN
 ↓
CONTEMPORARY
 ↓
FUTURE
```

例：

``` text
天照
 ↓
江戸
 ↓
東京
 ↓
FUTURE TOKYO
```

別系統：

``` text
アテナ
 ↓
ローマ
 ↓
ビザンツ
 ↓
MODERN
 ↓
FUTURE
```

文明の継承そのものをゲームプレイにする。

------------------------------------------------------------------------

# 13. Phase 10 --- UI

コード中心で以下を実装する。

``` text
Title
Home
Character Select
Character Detail
Formation
Match
HUD
Skill UI
Civilization Meter
RELIC Meter
Era Indicator
Result
Settings
Codex
```

100キャラはCodex上に存在可能。

未実装キャラクターは：

``` text
ARCHIVED MEMORY
```

などとして扱う。

------------------------------------------------------------------------

# 14. Phase 11 --- Save System

保存対象：

``` text
Player Profile
Characters
Unlocks
Settings
Progress
Codex
Achievements
```

初期版はLocal Save。

将来Server
Authoritativeへ移行しやすいよう、ゲームロジックと保存処理を分離する。

------------------------------------------------------------------------

# 15. Phase 12 --- 30-Second Trailer Generator

最初のPV：

``` text
0–3秒
完全に色を失った東京

3–6秒
天照の目が開く

6–10秒
RELIC起動

10–15秒
地面から光が走る

15–20秒
廃墟 → 鳥居 → 桜 → 神域
リアルタイム世界再構築

20–24秒
アテナ降臨
反対側が古代ギリシャ文明へ変化

24–27秒
二つの文明領域が衝突

27–30秒
永結のレリクシア

「人類の記憶は、少女となって永遠を戦う。」
```

コード上では：

``` cpp
Trailer
    .Shot(0, 3, ForgottenTokyo)
    .Shot(3, 6, AmaterasuAwakening)
    .Shot(6, 10, RelicActivation)
    .Shot(10, 15, MemoryWave)
    .Shot(15, 20, YamatoShift)
    .Shot(20, 24, AthenaArrival)
    .Shot(24, 27, CivilizationCollision)
    .Shot(27, 30, TitleReveal);
```

PV専用の偽演出ではなく、本編のシステムを可能な限り使用する。

------------------------------------------------------------------------

# 16. Phase 13 --- Automatic Rendering

目標：

``` bash
python generate_trailer.py \
    --hero amaterasu \
    --enemy athena \
    --map forgotten_tokyo
```

実行フロー：

``` text
Build Project
↓
Load Map
↓
Spawn 天照
↓
Spawn Athena
↓
Generate Civilization
↓
Generate Cameras
↓
Generate Lighting
↓
Play Sequence
↓
Render
↓
Encode
↓
Save
```

Output：

``` text
Output/
├── YouTube/
│   └── Aeterna_Trailer_001.mp4
│
├── Shorts/
│   ├── Amaterasu_001.mp4
│   └── Athena_001.mp4
│
└── Screenshots/
    └── Amaterasu_KeyVisual_001.png
```

------------------------------------------------------------------------

# 17. Phase 14 --- 100 Character Trailer Generator

将来的には：

``` bash
python generate_character_trailers.py --all
```

でキャラクターPVを生成する。

``` text
天照 PV
アテナ PV
イシス PV
ローマ PV
西施 PV
江戸 PV
...
100キャラクター
```

キャラクター定義から以下を自動選択する。

-   Civilization
-   Stage
-   Camera Style
-   VFX
-   Weapon
-   Pose
-   Ultimate
-   Lighting
-   Background
-   Logo
-   Character Name

最終品質チェックは人間が行う。

------------------------------------------------------------------------

# 18. Phase 15 --- Online Multiplayer

オフライン版が面白くなってから実装する。

``` text
Account
Lobby
Party
Matchmaking
Dedicated Server
Replication
Prediction
Lag Compensation
Reconnection
Ranking
Anti-cheat
Season
Live Operations
```

最初からオンラインを最優先にしない。

------------------------------------------------------------------------

# 19. Phase 16 --- Automated Testing

Cursor / AI開発ではテストを重要視する。

``` text
Unit Test
Integration Test
Character Data Test
Skill Test
Damage Test
Save Test
AI Test
Civilization Test
Performance Test
Build Test
```

例：

``` bash
python test_all_characters.py
```

自動処理：

``` text
100 Characters
↓
Spawn
↓
Animation
↓
Attack
↓
Skill 1
↓
Skill 2
↓
Ultimate
↓
Civilization Shift
↓
Missing Asset Check
↓
Crash Check
↓
Report
```

------------------------------------------------------------------------

# 20. Phase 17 --- Performance Optimization

Procedural Generationを使うため最適化する。

``` text
Object Pooling
LOD
HLOD
Instancing
Async Loading
Asset Streaming
Culling
Niagara Optimization
Memory Management
Shader Optimization
Texture Streaming
Animation Optimization
```

文明生成時に大量Actorを単純Spawnし続ける設計は避ける。

------------------------------------------------------------------------

# 21. Phase 18 --- Git Strategy

初日からGitを利用する。

``` text
main
develop

feature/character-system
feature/amaterasu
feature/combat
feature/ai
feature/relic
feature/civilization-shift
feature/era-shift
feature/trailer
```

Cursorに大規模変更を行わせる前には必ずCommitする。

------------------------------------------------------------------------

# 22. Coding Rules

## Rule 1

巨大な単一ファイルを作らない。

## Rule 2

キャラクター固有値をハードコードしない。

## Rule 3

データ駆動設計を優先する。

## Rule 4

Game SystemとCinematic Systemを可能な限り共通化する。

## Rule 5

AIに一度に巨大な変更をさせない。

## Rule 6

変更前にGit Commit。

## Rule 7

生成後はBuild / Testを必ず実行。

## Rule 8

重複コードを増やさない。

## Rule 9

100キャラクターへ拡張できる設計を維持する。

## Rule 10

コード行数そのものを目的にしない。

------------------------------------------------------------------------

# 23. Cursor Development Method

悪い指示：

``` text
永結のレリクシアを全部作って。
```

良い指示：

``` text
Implement the CharacterData loader.

Requirements:
- Read character JSON files from Data/Characters.
- Validate required fields.
- Do not modify CombatSystem.
- Do not modify Network code.
- Add automated tests.
- Build after implementation.
- Report all modified files.
```

一回の指示は一つの責務に限定する。

------------------------------------------------------------------------

# 24. First 30 Days

## Week 1 --- Foundation

-   UE5プロジェクト作成
-   Git初期化
-   Directory構築
-   Coding Rules作成
-   Character Schema確定
-   100キャラJSON化
-   Character Validator
-   Character Loader
-   Civilization Schema
-   Skill Schema
-   Automated Build

### Goal

``` text
100キャラのデータをゲーム側から正常に読み込める。
```

------------------------------------------------------------------------

## Week 2 --- Amaterasu Vertical Slice

-   天照3Dモデル
-   Skeleton
-   Rig
-   Animation
-   Movement
-   Camera
-   Normal Attack
-   Damage
-   HP
-   Skill 1
-   Skill 2
-   Ultimate
-   Dummy Enemy
-   Basic AI

### Goal

``` text
天照を操作して敵と戦える。
```

------------------------------------------------------------------------

## Week 3 --- RELIC / Civilization Shift

-   RELIC
-   Memory Wave
-   Civilization Domain
-   YAMATO Generator
-   鳥居生成
-   桜
-   神社
-   Lighting Shift
-   Domain Buff
-   Civilization Capture

### Goal

``` text
天照がRELICを起動すると、
灰色の廃墟が神域へ変化する。
```

------------------------------------------------------------------------

## Week 4 --- Athena + Trailer

-   アテナ実装
-   HELLAS Generator
-   Greek Architecture
-   Athena AI
-   Civilization Conflict
-   Camera Director
-   Trailer Timeline
-   Automatic Render
-   YouTube / Shorts Output

### Goal

30秒PVを完成させる。

``` text
Ruined Tokyo
↓
Amaterasu
↓
RELIC
↓
Yamato Restoration
↓
Athena
↓
Hellas Restoration
↓
Civilization Collision
↓
RELICXIA
```

------------------------------------------------------------------------

# 25. Milestone 1

最初の大目標：

## RELIXIA --- FIRST MEMORY

内容：

``` text
Playable Characters: 2
天照
アテナ

Maps: 1
Forgotten Tokyo

Civilizations: 2
YAMATO
HELLAS

Game Modes:
CPU Battle

Systems:
Combat
RELIC
Civilization Shift
AI
UI
Save

Cinematic:
30-second Trailer
```

------------------------------------------------------------------------

# 26. Milestone 2

## FOUNDERS SIX

``` text
Playable Characters: 6

天照
アテナ
イシス
ローマ
西施
江戸
```

追加：

-   6 Civilization Domains
-   Character Select
-   Codex
-   Better AI
-   Better Combat
-   Better VFX
-   Better Audio
-   Multiple Battle Rules

------------------------------------------------------------------------

# 27. Milestone 3

## CIVILIZATION WAR

追加：

``` text
3v3
Civilization Territory
Multiple RELICs
ERA SHIFT
Civilization Links
Advanced AI
Multiple Maps
```

------------------------------------------------------------------------

# 28. Milestone 4

## ONLINE ALPHA

追加：

``` text
Account
Lobby
Matchmaking
Network Battle
Ranking
Reconnect
Server
```

------------------------------------------------------------------------

# 29. 100 Character Expansion

本編システム完成後に段階的に追加する。

``` text
6
↓
12
↓
24
↓
50
↓
100
```

100キャラを最初から完全実装しない。

------------------------------------------------------------------------

# 30. YouTube Development Strategy

開発自体をコンテンツ化する。

例：

``` text
Day 1
AIと1人で100キャラのゲームを作り始める

Day 7
天照を3Dで動かした

Day 14
戦闘が完成

Day 21
世界が日本神話に変わるシステムを作った

Day 30
天照 vs アテナ
```

Shorts：

``` text
15–30 seconds
```

長編：

``` text
5–15 minutes
```

見る指標：

-   Views
-   Retention
-   Likes
-   Comments
-   Subscribers
-   「遊びたい」というコメント
-   人気キャラクター
-   人気文明
-   人気演出

------------------------------------------------------------------------

# 31. Core Differentiation

『永結のレリクシア』を単なる歴史・神話美少女ゲームにしない。

中心概念：

> プレイヤーが戦うことで、人類の歴史そのものが世界へ復元される。

ゲームループ：

``` text
Explore
↓
Fight
↓
Capture RELIC
↓
Restore Memory
↓
Generate Civilization
↓
Expand Domain
↓
Connect History
↓
Shift Era
↓
Rewrite World
```

------------------------------------------------------------------------

# 32. Signature System

## CIVILIZATION SHIFT

キャッチコピー：

> 戦うほど、世界が歴史を取り戻す。

例：

``` text
Forgotten World
     ↓
天照
     ↓
YAMATO
     ↓
江戸
     ↓
東京
     ↓
Future Tokyo
```

ゲームプレイと世界観を同じシステムで表現する。

------------------------------------------------------------------------

# 33. Final Vision

最終的には：

``` text
Character Data
       ↓
Character Generator
       ↓
3D Character

Civilization Data
       ↓
Civilization Generator
       ↓
3D World

Skill Data
       ↓
Combat System
       ↓
Gameplay

Cinematic Data
       ↓
Trailer Generator
       ↓
Video

All Systems
       ↓
PROJECT AETERNA
       ↓
永結のレリクシア
```

を成立させる。

------------------------------------------------------------------------

# 34. Development Principle

目標は「10万行書くこと」ではない。

目標は：

> 少ない人員とAIを使い、従来なら大人数を必要とした制作工程をコード・データ・自動生成によって統合すること。

コード量より以下を重視する。

-   実際に遊べる
-   面白い
-   見た目が良い
-   安定して動く
-   自動テストできる
-   新キャラクターを追加しやすい
-   新文明を追加しやすい
-   PVを自動生成できる
-   YouTubeで第三者に魅力が伝わる
-   将来的に商用展開できる

------------------------------------------------------------------------

# 35. Immediate Next Task

最初に実行すること：

``` text
1. Repository作成
2. UE5 Project作成
3. Git初期化
4. Directory作成
5. CHARACTER_SCHEMA.json作成
6. 100キャラをJSONへ変換
7. validate_characters.py作成
8. UE5 CharacterData Loader作成
9. 天照だけ3D生成開始
10. 天照Vertical Sliceへ進む
```

最初の技術的ゴール：

> `amaterasu.json` を読み込み、UE5上に天照をSpawnできる状態を作る。

そこから『永結のレリクシア』全体を段階的に構築する。
