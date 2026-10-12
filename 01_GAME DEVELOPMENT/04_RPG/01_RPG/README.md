# 永結のレリクシア / PROJECT AETERNA

ローカル完成版（2D / Godot + C++）: ロードマップどおり RELIC 起動で同じ東京が別文明へ書き換わる。初期シードは天照・アテナ・アヌビス・イシュタル・スカアハ。Civilization Fusion、探索／交流／発掘、100体データ。3D / UE5 は次段。

人類の記憶は、少女となって永遠を戦う。  
歴史を選べ。文明を結べ。世界を取り戻せ。  
Reclaim the Memories. Rewrite Eternity.

## 必要環境

- Godot 4.7.x（同梱想定: `C:\Users\NEC-PCuser\tools\godot-4.7.2\Godot_v4.7.2-stable_win64.exe`）
- Visual Studio Build Tools 2022（MSVC）
- Python 3.10+ と `pip install scons`
- `godot-cpp`（このリポジトリ直下）

## ビルド

```powershell
.\build.ps1
```

成功すると `bin/libaeterna.windows.template_debug.x86_64.dll` が生成される。

## 起動

Godot でこのフォルダを開き、F5。または:

```powershell
& "C:\Users\NEC-PCuser\tools\godot-4.7.2\Godot_v4.7.2-stable_win64.exe" --path .
```

## 操作

- WASD: 移動
- J / 左クリック: 通常攻撃
- Space: 回避
- E: 浄光（範囲攻撃）
- Q: 鏡光（回復と加速）
- R: 黎明（Ultimate。RELIC を強制確保）

勝利条件: RELIC を 3 つ確保、または忘却を撃破。

## 言語分担

- C++ GDExtension: セッション、戦闘、RELIC、文明復元、CPU
- GDScript: タイトル、HUD、結果、カメラ
- JSON: `data/characters/*.json` の Character Schema。`data/relicsia.json` はゲーム用の統合カタログ
- Python: `python tools/build_roster.py` でデータ生成、`python validate_characters.py` で検査
