# 01_GAME DEVELOPMENT — README 索引

各ゲーム／アプリフォルダに `README.md` があります。

## ゲーム

- [`300_MARKET_GAMES`](./300_MARKET_GAMES/README.md) … 需要ジャンル第3波 **100本**（dodge/catch 含む）
- [`200_MARKET_GAMES`](./200_MARKET_GAMES/README.md) … 需要ジャンル **100本**
- [`100_ARCADE`](./100_ARCADE/README.md) … アーケード **15本**
- `02_PUZZLE` … `14_BOARDGAME` 既存タイトル群

おおよそ **300本超**（マーケット200 + アーケード15 + アプリ85 + 既存）。

Relixia（`01_PROJECT`）は自動生成対象外。

## 再生成

```bash
node _gen_market_300.js
node _gen_market_200.js
node _gen_arcade_100.js
```
