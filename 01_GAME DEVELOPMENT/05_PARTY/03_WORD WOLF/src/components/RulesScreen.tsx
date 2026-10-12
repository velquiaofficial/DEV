import { TopBar } from "./Bits";

export function RulesScreen({ muted, onToggleMute, onBack }: { muted: boolean; onToggleMute: () => void; onBack: () => void }) {
  return (
    <section className="screen rules">
      <TopBar title="ルール" muted={muted} onToggleMute={onToggleMute} onBack={onBack} />
      <p className="kicker">遊び方</p>
      <h1>言葉を隠したまま、狼を探す</h1>
      <p>市民には同じ言葉、ウルフには似ている別の言葉が渡されます。自分の言葉をそのまま言わずに話し合い、だれがウルフかを投票で決めます。</p>

      <h2>流れ</h2>
      <ol>
        <li>人数とCPUの人数、ウルフの人数、制限時間を決める。</li>
        <li>端末を人間へ1人ずつ渡し、自分の札だけ見る。CPUは札を見ない。</li>
        <li>言葉そのもの、字の一部、イニシャルは出さない。</li>
        <li>制限時間が来たら、ウルフだと思う人に投票する。</li>
        <li>役とふたつの言葉を公開して、得点を加える。</li>
      </ol>

      <h2>役</h2>
      <ul>
        <li>市民は同じ言葉を持つ。自分が市民かどうかは知らされない。</li>
        <li>ウルフは似た別の言葉を持つ。自分だけ違うことは知らされない。</li>
        <li>空白は、言葉がないことだけ知らされる。会話から言葉を探す。</li>
        <li>CPUは短い意見を出し、投票もする。人間が1人いれば遊べる。</li>
      </ul>

      <h2>勝ち</h2>
      <ul>
        <li>ウルフを追放し、ウルフが市民の言葉を外せば市民の勝ち。</li>
        <li>市民か空白を追放すると、ウルフの勝ち。</li>
        <li>同票のまま決まらなければ、ウルフの勝ち。</li>
        <li>追放されたウルフが市民の言葉を言い当てると、逆転でウルフの勝ち。</li>
        <li>その推理が外れ、生き残った空白が市民の言葉を当てると、空白の勝ち。</li>
        <li>「全員追放」のときは、市民を誤って出すまで投票が続く。</li>
      </ul>

      <h2>得点</h2>
      <ul>
        <li>市民の勝ち: 市民はそれぞれ2点</li>
        <li>ウルフの勝ち: ウルフはそれぞれ3点</li>
        <li>逆転: ウルフはそれぞれ4点</li>
        <li>空白の勝ち: 空白5点、市民はそれぞれ1点</li>
      </ul>

      <h2>場の約束</h2>
      <p>札を見たらすぐ伏せる。疑い合うのは言葉だけで、人のことはからかいで終わらせる。同じお題は、言葉が重ならないうちはもう一度出ない。</p>
      <div className="dock">
        <button type="button" className="btn btn-primary" onClick={onBack}>
          戻る
        </button>
      </div>
    </section>
  );
}
