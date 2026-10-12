# キャラデザ画像

Master Plan の文明ごとに保存する。日本由来は漢字、海外由来はカタカナ／現地音。

| 文明 | フォルダ |
|---|---|
| YAMATO | `yamato/` |
| TOKYO | `tokyo/` |
| HELLAS | `hellas/` |
| ROME | `rome/` |
| KEMET | `kemet/` |
| HUAXIA | `huaxia/` |
| NORSE | `norse/` |
| MESOPOTAMIA | `mesopotamia/` |
| MEDIEVAL | `medieval/` |
| MODERN | `modern/` |
| CONTEMPORARY | `contemporary/` |
| FUTURE | `future/` |
| VOID | `void/` |

| まとめ | 場所 |
|---|---|
| 文明シート | `_sheets/<文明>.png` |
| 100体の全体まとめ | `_sheets/roster_all.png` |
| 文明キービジュアル | `_keyart/<文明>.png` |
| Founders / 初期互換 | `amaterasu.png` ほか直下 |

Founders Six: 天照、アテナ、イシス、ローマ、西施、江戸。

```powershell
python tools/export_roster.py --all
python tools/export_roster.py --belt yamato
python validate_characters.py
```
