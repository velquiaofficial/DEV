const photo = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=70`

export const recipients = [
  { id: 'loverF', label: '恋人（女性）', icon: 'heart' },
  { id: 'loverM', label: '恋人（男性）', icon: 'heart' },
  { id: 'friend', label: '友達', icon: 'users' },
  { id: 'family', label: '家族', icon: 'home' },
  { id: 'work', label: '同僚・上司', icon: 'case' },
  { id: 'self', label: '自分へ', icon: 'spark' },
]

export const occasions = [
  { id: 'birthday', label: '誕生日' },
  { id: 'anniversary', label: '記念日' },
  { id: 'xmas', label: 'クリスマス' },
  { id: 'valentine', label: 'バレンタイン' },
  { id: 'whiteday', label: 'ホワイトデー' },
  { id: 'wedding', label: '結婚祝い' },
  { id: 'baby', label: '出産祝い' },
  { id: 'thanks', label: 'お礼' },
]

export const vibes = [
  { id: 'practical', label: '実用的' },
  { id: 'cute', label: 'かわいい' },
  { id: 'elegant', label: '上品' },
  { id: 'fun', label: 'おもしろい' },
  { id: 'calm', label: '癒やし' },
  { id: 'experience', label: '体験' },
]

export const hobbies = [
  { id: 'coffee', label: 'コーヒー' },
  { id: 'beauty', label: '美容' },
  { id: 'outdoor', label: 'アウトドア' },
  { id: 'reading', label: '読書' },
  { id: 'food', label: 'グルメ' },
  { id: 'interior', label: 'インテリア' },
  { id: 'fashion', label: 'ファッション' },
  { id: 'kids', label: '育児' },
  { id: 'music', label: '音楽' },
  { id: 'game', label: 'ゲーム' },
  { id: 'kitchen', label: '料理' },
]

export const budgets = [
  { id: 3000, label: '〜3,000円' },
  { id: 5000, label: '〜5,000円' },
  { id: 10000, label: '〜1万円' },
  { id: 20000, label: '〜2万円' },
  { id: 50000, label: '〜5万円' },
]

export const gifts = [
  {
    id: 'drip',
    name: '日日のハンドドリップセット',
    price: 4800,
    lead: '豆とドリッパーを、朝の習慣に。',
    description:
      '浅煎りのシングルオリジン200gと、陶器のドリッパー、フィルター20枚のセット。香りが立ちやすい中細挽きで、初めての人にも淹れ方カードが付きます。',
    hint: 'お礼や誕生日に。消費するものなので、気負わず渡せます。',
    image: photo('photo-1495474472287-4d71bcdd2085'),
    recipients: ['friend', 'work', 'family', 'self'],
    occasions: ['birthday', 'thanks', 'xmas'],
    vibes: ['practical', 'calm'],
    hobbies: ['coffee'],
    rank: 1,
  },
  {
    id: 'mask',
    name: '絹のアイマスク',
    price: 3200,
    lead: '光を遮って、眠りの質を上げる。',
    description:
      '表はやわらかいシルク、裏はコットンの立体マスク。鼻の形に沿い、横向き寝でもずれにくいカットです。ポーチ付き。',
    hint: '自分へのごほうびにも、忙しい相手への気遣いに。',
    image: photo('photo-1541781774459-bb2af2f05b55'),
    recipients: ['loverF', 'loverM', 'self', 'friend'],
    occasions: ['birthday', 'thanks', 'xmas'],
    vibes: ['calm', 'practical', 'elegant'],
    hobbies: ['beauty'],
    rank: 8,
  },
  {
    id: 'candle',
    name: '柑橘のアロマキャンドル',
    price: 2980,
    lead: '部屋に灯す、短いごほうび。',
    description:
      'ベルガモットと白檀を合わせたソイキャンドル。燃焼時間は約30時間。蓋をすれば小物入れになります。',
    hint: '引っ越し祝いや、ちょっとしたお礼に置きやすいサイズです。',
    image: photo('photo-1603006905003-be475563bc59'),
    recipients: ['friend', 'loverF', 'self', 'family'],
    occasions: ['thanks', 'birthday', 'xmas', 'anniversary'],
    vibes: ['calm', 'cute', 'elegant'],
    hobbies: ['interior', 'beauty'],
    rank: 4,
  },
  {
    id: 'cardcase',
    name: '薄型レザーカードケース',
    price: 8800,
    lead: 'ポケットに収まる、毎日の革。',
    description:
      '植物タンニンなめしの革を手縫いした4枚差し。使い込むほど色が深くなります。名入れは一文字まで対応。',
    hint: '同僚や上司には名入れを外し、無地で渡すと無難です。',
    image: photo('photo-1627123424574-724758594e93'),
    recipients: ['loverM', 'work', 'friend', 'family'],
    occasions: ['birthday', 'thanks', 'whiteday', 'anniversary'],
    vibes: ['practical', 'elegant'],
    hobbies: ['fashion'],
    rank: 6,
  },
  {
    id: 'flowers',
    name: '季節の花 1ヶ月便',
    price: 5500,
    lead: '週に一度、玄関が変わる。',
    description:
      'その週にいちばん状態のよい花を、小さめのブーケで4回お届けします。花瓶は不要の給水バッグ付き。',
    hint: '記念日の当日に1回目が届くよう、3日前までの申し込みが確実です。',
    image: photo('photo-1490750967868-88aa4486c946'),
    recipients: ['loverF', 'family', 'friend'],
    occasions: ['anniversary', 'birthday', 'valentine', 'thanks'],
    vibes: ['cute', 'elegant', 'calm'],
    hobbies: ['interior'],
    rank: 2,
  },
  {
    id: 'earbuds',
    name: 'ワイヤレスイヤホン Mini',
    price: 12800,
    lead: '通勤の30分を、自分の時間に。',
    description:
      '片耳4.2gのカナル型。連続再生は約6時間、ケース込みで24時間。通話ノイズ抑制付きで、仕事の相手にも使いやすい音です。',
    hint: '色はホワイトかブラック。相手のスマホがどちらでも繋がります。',
    image: photo('photo-1505740420928-5e560c06d30e'),
    recipients: ['loverM', 'friend', 'work', 'self'],
    occasions: ['birthday', 'xmas', 'whiteday'],
    vibes: ['practical', 'fun'],
    hobbies: ['music'],
    rank: 5,
  },
  {
    id: 'pen',
    name: '真鍮の万年筆',
    price: 15000,
    lead: 'サインが、少し丁寧になる。',
    description:
      '細字のスチールペン先と、カートリッジ・コンバーター両対応。真鍮は手の脂でゆっくり艶が出ます。インクは青黒の小瓶付き。',
    hint: '昇進祝いや退職の挨拶に。筆記具を普段使いしている人向けです。',
    image: photo('photo-1583485088034-697b5bc54ccd'),
    recipients: ['work', 'family', 'loverM'],
    occasions: ['birthday', 'thanks', 'anniversary'],
    vibes: ['elegant', 'practical'],
    hobbies: ['reading'],
    rank: 11,
  },
  {
    id: 'spa',
    name: '個室スパ 90分',
    price: 11000,
    lead: '予定を空けて渡す、休息の体験。',
    description:
      '都内と主要都市の提携サロンで使える90分コース。ボディかフェイシャルを当日選べます。有効期限は6ヶ月。',
    hint: '日時は相手に選んでもらうチケット型が、予定を聞き出しやすく親切です。',
    image: photo('photo-1544161515-4ab6ce6db874'),
    recipients: ['loverF', 'loverM', 'family', 'self'],
    occasions: ['birthday', 'anniversary', 'thanks', 'xmas'],
    vibes: ['experience', 'calm', 'elegant'],
    hobbies: ['beauty'],
    rank: 3,
  },
  {
    id: 'sweets',
    name: '焼き菓子の詰合せ',
    price: 3800,
    lead: '缶を開けたときが、本体。',
    description:
      'バターのフィナンシェ、塩キャラメルのサブレ、紅茶のマドレーヌを12個。常温で5日。のしとメッセージカードに対応。',
    hint: '職場に配りやすい個包装。手土産と誕生日の両方に使えます。',
    image: photo('photo-1558961363-fa8fdf82db35'),
    recipients: ['friend', 'work', 'family', 'loverF'],
    occasions: ['thanks', 'birthday', 'whiteday', 'valentine', 'xmas'],
    vibes: ['cute', 'elegant'],
    hobbies: ['food'],
    rank: 7,
  },
  {
    id: 'watch',
    name: '細身の腕時計',
    price: 22000,
    lead: 'スーツにも、休日の袖にも。',
    description:
      'ケース径36mm、厚さ7mm。ホワイトダイヤルにレザーベルト。クォーツで電池寿命は約3年。日常防水。',
    hint: '手首が細い人には36mm、しっかりした人には同じ型の40mmを選ぶと失敗が少ないです。',
    image: photo('photo-1524592094714-0f0654e20314'),
    recipients: ['loverM', 'loverF', 'work'],
    occasions: ['birthday', 'anniversary', 'xmas', 'whiteday'],
    vibes: ['elegant', 'practical'],
    hobbies: ['fashion'],
    rank: 9,
  },
  {
    id: 'picturebook',
    name: '絵本と紅茶のセット',
    price: 4200,
    lead: '読み聞かせの前に、一煎。',
    description:
      '繰り返し読める絵本1冊と、カフェインを抑えたルイボスのティーバッグ10包。親の分も一緒に淹れられます。',
    hint: '出産祝いの本は、生まれてすぐより半年後に楽しめるものが喜ばれます。',
    image: photo('photo-1512820790803-83ca734da794'),
    recipients: ['family', 'friend'],
    occasions: ['baby', 'birthday', 'thanks'],
    vibes: ['calm', 'cute'],
    hobbies: ['reading', 'kids'],
    rank: 14,
  },
  {
    id: 'lantern',
    name: '真鍮のランタン',
    price: 6500,
    lead: 'キャンプの夜と、部屋の隅に。',
    description:
      '充電式LEDで、暖色3段階。フック付きでタープにも吊れます。室内では間接照明として使えます。',
    hint: 'アウトドアをしない相手には、部屋使いを一言添えると用途が伝わります。',
    image: photo('photo-1478131143081-80f7f84ca84d'),
    recipients: ['loverM', 'friend', 'family'],
    occasions: ['birthday', 'xmas', 'anniversary'],
    vibes: ['fun', 'practical'],
    hobbies: ['outdoor', 'interior'],
    rank: 12,
  },
  {
    id: 'cream',
    name: 'ハンドクリーム トリオ',
    price: 2400,
    lead: '香り違いの、小さな三種。',
    description:
      '無香、白茶、柑橘の10gチューブ。バッグに入るサイズで、デスクにも置きやすい。アルコールフリー。',
    hint: '3,000円以下でちゃんと渡せるお礼。職場の共有には無香が無難です。',
    image: photo('photo-1556228720-195a672e8a03'),
    recipients: ['work', 'friend', 'loverF', 'self'],
    occasions: ['thanks', 'whiteday', 'birthday'],
    vibes: ['cute', 'practical', 'calm'],
    hobbies: ['beauty'],
    rank: 10,
  },
  {
    id: 'wine',
    name: '赤ワインとチーズ',
    price: 7800,
    lead: 'その夜に開けられる組み合わせ。',
    description:
      '果実味のあるピノ・ノワール1本と、コンテ、山羊乳のチーズ2種。クラッカー付きで、買い足しなしでテーブルができます。',
    hint: 'お酒を飲むかだけは確認を。飲まない相手にはカタログギフトへ。',
    image: photo('photo-1510812431401-41d2bd2722f3'),
    recipients: ['friend', 'loverM', 'loverF', 'family'],
    occasions: ['anniversary', 'birthday', 'xmas', 'wedding', 'thanks'],
    vibes: ['elegant', 'fun'],
    hobbies: ['food'],
    rank: 13,
  },
  {
    id: 'blanket',
    name: 'オーガニックコットンの毛布',
    price: 6900,
    lead: '洗いを重ねても、ふくらむ綿。',
    description:
      '70×100cmのベビーサイズ。ガーゼを6枚重ね、通気を残しています。生成りとグレーの2色。',
    hint: '出産祝いは白以外が実用的。抱っこ紐の上からかけられる大きさです。',
    image: photo('photo-1522771739844-6a9f6d5f14af'),
    recipients: ['family', 'friend'],
    occasions: ['baby', 'birthday'],
    vibes: ['calm', 'cute', 'practical'],
    hobbies: ['kids'],
    rank: 15,
  },
  {
    id: 'lamp',
    name: '調光デスクライト',
    price: 9800,
    lead: '夜の作業を、目にやさしく。',
    description:
      '電球色から昼白色まで無段階。アームは360度。USB給電で、在宅の机にも置ける幅12cmの台座です。',
    hint: '同僚の在宅環境が分からないときは、クランプ式より据え置きが安全です。',
    image: photo('photo-1507473885765-e6ed057f782c'),
    recipients: ['work', 'friend', 'family', 'self'],
    occasions: ['birthday', 'thanks'],
    vibes: ['practical'],
    hobbies: ['reading'],
    rank: 16,
  },
  {
    id: 'perfume',
    name: 'オードトワレ 30ml',
    price: 8500,
    lead: '花のように、近くで香る。',
    description:
      'トップにネロリ、中心にジャスミン、残り香に緑茶。主張しすぎない濃度で、職場のある日にも使えます。',
    hint: '香りは好みが割れます。以前褒めていた系統がある相手に。',
    image: photo('photo-1496062031456-07b8f162a322'),
    recipients: ['loverF', 'self'],
    occasions: ['valentine', 'anniversary', 'birthday', 'xmas'],
    vibes: ['elegant', 'cute'],
    hobbies: ['beauty', 'fashion'],
    rank: 6,
  },
  {
    id: 'game',
    name: '夜のボードゲーム',
    price: 4500,
    lead: '2人から6人、30分で1回。',
    description:
      '言葉を使わない協力ゲーム。説明は3分、年齢は10歳から。テーブルに広げると会話が始まるタイプです。',
    hint: '友達グループへのプレゼントに。誕生日本人だけでなく、その後の集まりで使われます。',
    image: photo('photo-1610890716171-6b1bb98ffd09'),
    recipients: ['friend', 'loverM', 'loverF', 'family'],
    occasions: ['birthday', 'xmas', 'thanks'],
    vibes: ['fun'],
    hobbies: ['game'],
    rank: 17,
  },
  {
    id: 'necklace',
    name: 'シルバーの小ぶりネックレス',
    price: 18000,
    lead: '鎖骨の上に、一粒だけ。',
    description:
      '直径4mmの淡水パールを、40cmのシルバーチェーンに。長さ調節が5cm分付きます。専用の薄箱入り。',
    hint: 'ゴールドを普段身につけている人には避け、シルバーの小物がある人に。',
    image: photo('photo-1515562141207-7a88fb7ce338'),
    recipients: ['loverF'],
    occasions: ['anniversary', 'birthday', 'valentine', 'xmas'],
    vibes: ['elegant'],
    hobbies: ['fashion'],
    rank: 8,
  },
  {
    id: 'knife',
    name: '三徳包丁',
    price: 14000,
    lead: '週に何度も使う、切れ味。',
    description:
      '刃渡り17cm、ステンレスモリブデン鋼。肉・野菜・魚をこれ1本で。朴の木の柄で、手に吸い付きます。',
    hint: '家庭の包丁は相手がすでに持っていることが多いので、一人暮らしの始まりや結婚祝いに。',
    image: photo('photo-1593618998160-e34014e67546'),
    recipients: ['family', 'friend', 'loverM'],
    occasions: ['wedding', 'birthday', 'thanks'],
    vibes: ['practical'],
    hobbies: ['kitchen', 'food'],
    rank: 18,
  },
  {
    id: 'fragrance',
    name: 'ルームフレグランス 白檀',
    price: 5200,
    lead: '帰宅した瞬間の、静かな匂い。',
    description:
      '白檀とヒノキのリードディフューザー、容量120mlで約3ヶ月。瓶はくすみガラスで、空になっても置けます。',
    hint: 'ペットがいる家にはリード式を避け、キャンドルを選ぶ方が安心なことがあります。',
    image: photo('photo-1594035910387-fea47794261f'),
    recipients: ['self', 'friend', 'family', 'loverF'],
    occasions: ['birthday', 'thanks', 'xmas', 'anniversary'],
    vibes: ['calm', 'elegant'],
    hobbies: ['interior'],
    rank: 11,
  },
  {
    id: 'bonbon',
    name: 'ボンボンショコラ 8粒',
    price: 3600,
    lead: '味の名前から、選んでもらう。',
    description:
      'カシス、ほうじ茶、ピスタチオ、塩。4種を2粒ずつ。冷蔵で7日。クール便で当日午前指定ができます。',
    hint: 'バレンタインは手作りでなくても、店の味を選んだ理由を一行書くと気持ちが届きます。',
    image: photo('photo-1481391319762-47dff72954d9'),
    recipients: ['loverM', 'loverF', 'friend', 'work'],
    occasions: ['valentine', 'whiteday', 'birthday', 'thanks'],
    vibes: ['cute', 'elegant'],
    hobbies: ['food'],
    rank: 4,
  },
  {
    id: 'cookies',
    name: 'クッキー缶 プレーン',
    price: 2800,
    lead: 'バターだけを、ちゃんと焼く。',
    description:
      '直径5cmのサブレを20枚。味はプレーンのみで、配っても好みが割れません。缶は小物入れに再利用できます。',
    hint: 'ホワイトデーの職場配りに。個包装なのでそのまま渡せます。',
    image: photo('photo-1499636136210-6f4ee915583e'),
    recipients: ['work', 'friend', 'family', 'loverF'],
    occasions: ['whiteday', 'thanks', 'valentine', 'birthday'],
    vibes: ['cute', 'practical'],
    hobbies: ['food'],
    rank: 9,
  },
  {
    id: 'glasses',
    name: 'ペアグラス',
    price: 9200,
    lead: '同じ形を、二つ並べる。',
    description:
      '口が薄く、底にだけ厚みを残したタンブラー2客。食洗機に対応。木箱入りで、式場から自宅への配送もできます。',
    hint: '結婚祝いの定番ですが、酒器に限らない水用なので飲まない相手にも渡せます。',
    image: photo('photo-1514362545857-3bc16c4c7d1b'),
    recipients: ['friend', 'family'],
    occasions: ['wedding', 'anniversary', 'birthday'],
    vibes: ['elegant', 'practical'],
    hobbies: ['food', 'interior'],
    rank: 14,
  },
  {
    id: 'bib',
    name: 'スタイとラトル',
    price: 4800,
    lead: '毎日洗うものと、握るもの。',
    description:
      '肌側がガーゼのスタイ2枚と、木のラトル。スタイは紐ではなくスナップで、首が窮屈になりません。',
    hint: 'ブランドの服より、洗濯回数が増えるものを。両家への被りも少ない組み合わせです。',
    image: photo('photo-1515488042361-ee00e0ddd4e4'),
    recipients: ['family', 'friend'],
    occasions: ['baby'],
    vibes: ['cute', 'practical'],
    hobbies: ['kids'],
    rank: 19,
  },
  {
    id: 'strap',
    name: 'レザーのカメラストラップ',
    price: 7200,
    lead: '首にかかる幅を、少し広く。',
    description:
      '幅20mmの革ストラップ。金具はブラックニッケルで、一眼にもコンパクトにも付きます。長さは穴で調整。',
    hint: 'すでにストラップを使っている人に。カメラ本体を贈るより、続きとして渡す品です。',
    image: photo('photo-1516035069371-29a1b244cc32'),
    recipients: ['loverM', 'friend', 'family'],
    occasions: ['birthday', 'xmas', 'anniversary'],
    vibes: ['practical', 'elegant'],
    hobbies: ['outdoor', 'fashion'],
    rank: 20,
  },
  {
    id: 'plant',
    name: 'モンステラ',
    price: 3900,
    lead: '鉢ごと、部屋の角に置く。',
    description:
      '高さ40cm前後。受け皿付きのマットな鉢に植え替えた状態でお届けします。水やりの目安カード付き。',
    hint: '旅行が多い人、日がほとんど入らない部屋には向きません。',
    image: photo('photo-1614594975525-e45190c55d0b'),
    recipients: ['friend', 'self', 'family', 'loverF'],
    occasions: ['birthday', 'thanks', 'wedding'],
    vibes: ['calm', 'cute'],
    hobbies: ['interior'],
    rank: 12,
  },
  {
    id: 'booklight',
    name: '文庫と読書灯',
    price: 5600,
    lead: '今夜から読める、一冊と灯り。',
    description:
      '今季の小説を1冊と、クリップ式の暖色ライト。ページを挟んでも影が広がりにくい角度です。',
    hint: '本は相手の既読を避けるため、発売1ヶ月以内のものにしています。変更もできます。',
    image: photo('photo-1495446815901-a7297e633e8d'),
    recipients: ['friend', 'family', 'loverM', 'loverF', 'self'],
    occasions: ['birthday', 'thanks', 'xmas'],
    vibes: ['calm', 'practical'],
    hobbies: ['reading'],
    rank: 13,
  },
  {
    id: 'towel',
    name: '今治のスポーツタオル',
    price: 3200,
    lead: '吸って、すぐ乾く綿。',
    description:
      '今治産のフェイスタオル2枚。糸を甘く撚ってあるので、ジムから帰った夜に乾きます。色は生成り。',
    hint: '趣味が運動の相手への、外さない実用ギフトです。',
    image: photo('photo-1563291074-2bf8677ac0e5'),
    recipients: ['friend', 'loverM', 'work', 'family'],
    occasions: ['thanks', 'birthday', 'whiteday'],
    vibes: ['practical'],
    hobbies: ['outdoor'],
    rank: 21,
  },
  {
    id: 'catalog',
    name: 'グルメカタログギフト',
    price: 10000,
    lead: '相手が、自分で選べる。',
    description:
      '全国の食料品から約120点。肉、米、調味料、スイーツ。申し込み期限は6ヶ月。冊子とカード、両方の使い方ができます。',
    hint: '好みが読めない相手、ご家族への結婚祝いの保険として強い一品です。',
    image: photo('photo-1549465220-1a8b9238cd48'),
    recipients: ['family', 'work', 'friend'],
    occasions: ['wedding', 'thanks', 'birthday', 'baby'],
    vibes: ['practical', 'elegant'],
    hobbies: ['food'],
    rank: 10,
  },
]

export const emptyFilters = {
  recipients: [],
  occasions: [],
  vibes: [],
  hobbies: [],
  budget: null,
}

const yen = new Intl.NumberFormat('ja-JP')

export function formatYen(price) {
  return `¥${yen.format(price)}`
}

export function activeCount(filters) {
  return (
    filters.recipients.length +
    filters.occasions.length +
    filters.vibes.length +
    filters.hobbies.length +
    (filters.budget ? 1 : 0)
  )
}

export function searchGifts(filters, sort) {
  const matched = gifts.filter((gift) => {
    if (filters.budget && gift.price > filters.budget) return false
    if (filters.recipients.length && !gift.recipients.some((id) => filters.recipients.includes(id))) return false
    if (filters.occasions.length && !gift.occasions.some((id) => filters.occasions.includes(id))) return false
    if (filters.vibes.length && !gift.vibes.some((id) => filters.vibes.includes(id))) return false
    if (filters.hobbies.length && !gift.hobbies.some((id) => filters.hobbies.includes(id))) return false
    return true
  })

  const scored = matched.map((gift) => ({ ...gift, fit: fitScore(gift, filters) }))

  if (sort === 'priceAsc') scored.sort((a, b) => a.price - b.price || a.rank - b.rank)
  else if (sort === 'priceDesc') scored.sort((a, b) => b.price - a.price || a.rank - b.rank)
  else scored.sort((a, b) => b.fit - a.fit || a.rank - b.rank)

  return scored
}

function fitScore(gift, filters) {
  let score = 70
  const groups = [
    filters.recipients.length && gift.recipients.some((id) => filters.recipients.includes(id)),
    filters.occasions.length && gift.occasions.some((id) => filters.occasions.includes(id)),
    filters.vibes.length && gift.vibes.some((id) => filters.vibes.includes(id)),
    filters.hobbies.length && gift.hobbies.some((id) => filters.hobbies.includes(id)),
    filters.budget && gift.price <= filters.budget,
  ].filter((value) => value !== 0 && value !== null && value !== false && value !== undefined)

  const active = [
    filters.recipients.length,
    filters.occasions.length,
    filters.vibes.length,
    filters.hobbies.length,
    filters.budget,
  ].filter(Boolean).length

  if (!active) return Math.max(62, 96 - gift.rank)
  score = Math.round(78 + (groups.length / active) * 18)
  if (filters.budget && gift.price <= filters.budget * 0.7) score += 2
  return Math.min(99, score)
}

export function labelOf(list, id) {
  return list.find((item) => item.id === id)?.label ?? ''
}

export function filterChips(filters) {
  return [
    ...filters.recipients.map((id) => ({ key: `recipients:${id}`, group: 'recipients', id, label: labelOf(recipients, id) })),
    ...filters.occasions.map((id) => ({ key: `occasions:${id}`, group: 'occasions', id, label: labelOf(occasions, id) })),
    ...filters.vibes.map((id) => ({ key: `vibes:${id}`, group: 'vibes', id, label: labelOf(vibes, id) })),
    ...filters.hobbies.map((id) => ({ key: `hobbies:${id}`, group: 'hobbies', id, label: labelOf(hobbies, id) })),
    ...(filters.budget
      ? [{ key: 'budget', group: 'budget', id: filters.budget, label: labelOf(budgets, filters.budget) }]
      : []),
  ]
}

export function reasonLine(gift, filters) {
  const bits = []
  filters.recipients.forEach((id) => {
    if (gift.recipients.includes(id)) bits.push(labelOf(recipients, id))
  })
  filters.occasions.forEach((id) => {
    if (gift.occasions.includes(id)) bits.push(labelOf(occasions, id))
  })
  filters.vibes.forEach((id) => {
    if (gift.vibes.includes(id)) bits.push(labelOf(vibes, id))
  })
  if (bits.length) return bits.slice(0, 3).join(' · ')
  return gift.lead
}

const STORAGE = 'okuru-picks-v1'

export function loadPicks() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE) || 'null')
    if (!raw || typeof raw !== 'object') return { ids: [], decided: null }
    return {
      ids: Array.isArray(raw.ids) ? raw.ids.filter((id) => gifts.some((gift) => gift.id === id)) : [],
      decided: gifts.some((gift) => gift.id === raw.decided) ? raw.decided : null,
    }
  } catch {
    return { ids: [], decided: null }
  }
}

export function savePicks(picks) {
  localStorage.setItem(STORAGE, JSON.stringify(picks))
}
