import type { VideoLesson } from './types.ts'

// コンテンツのバージョン。構成を破壊的に変更したら上げる（識別子の再利用はしない）。
export const VIDEO_CONTENT_VERSION = '2026-11-pilot-1'

function text(value: string) {
  return { kind: 'text' as const, text: value }
}

function blank(blankId: string) {
  return { kind: 'blank' as const, blankId }
}

export const videoLessons: VideoLesson[] = [
  {
    step: 1,
    subject: 'science',
    title: '身近な生物の観察とルーペの使い方',
    videoId: 'H5c2dAgo56g',
    summary: [
      text('ルーペは必ず'), blank('eye'), text('に近づけて持つ。観察するものが動かせるときは、'),
      blank('target'), text('を前後に動かしてピントを合わせる。動かせないとき（木の葉など）は、'),
      blank('face'), text('を前後に動かしてピントを合わせる。スケッチをするときは、目的のものだけを'),
      blank('line'), text('の線で、濃淡をつけずにはっきりと描く。'),
    ],
    blanks: [
      { id: 'eye', answer: '目', choices: ['目', 'ルーペ', '観察するもの'] },
      { id: 'target', answer: '観察するもの', choices: ['観察するもの', 'ルーペ', '顔'] },
      { id: 'face', answer: '顔', choices: ['顔', '手', 'ルーペ'] },
      { id: 'line', answer: '一本', choices: ['一本', '二重', '点線'] },
    ],
    practice: [
      {
        id: 'science-1-1', label: '問題1', prompt: 'ルーペを使うとき、ルーペと目の距離はどうする？',
        options: [
          { id: 'a', text: 'できるだけ離す', correct: false },
          { id: 'b', text: '目に近づけて固定する', correct: true },
          { id: 'c', text: '観察するものに近づける', correct: false },
        ],
        hints: ['ルーペは「目」の近くに置いて動かさないようにします。'],
        explanation: '正解！ルーペは目に近づけて固定し、観察するものや顔の方を動かしてピントを合わせます。',
      },
      {
        id: 'science-1-2', label: '問題2', prompt: '観察するものが動かせないとき、ピントを合わせるにはどうする？',
        options: [
          { id: 'a', text: 'ルーペを動かす', correct: false },
          { id: 'b', text: '顔を前後に動かす', correct: true },
          { id: 'c', text: '観察するものを動かす', correct: false },
        ],
        hints: ['ルーペは目に近づけたまま動かしません。'],
        explanation: '正解！動かせないものを観察するときは、顔（＝自分の体）を前後に動かしてピントを合わせます。',
      },
    ],
  },
  {
    step: 2,
    subject: 'science',
    title: '花のつくり（被子植物）',
    videoId: 'dH6LQu8dXJU',
    summary: [
      text('花は外側から、'), blank('calyx'), text('・花弁・おしべ・めしべの順についている。めしべの先端のふくらんでいない部分を'),
      blank('stigma'), text('、根元の膨らんだ部分を'), blank('ovary'), text('という。'), blank('ovary'),
      text('の中には'), blank('ovule'), text('という粒が入っている。被子植物は、'), blank('ovule'),
      text('が'), blank('ovary'), text('の中にある（包まれている）植物のことである。'),
    ],
    blanks: [
      { id: 'calyx', answer: 'がく', choices: ['がく', '花弁', 'めしべ'] },
      { id: 'stigma', answer: '柱頭', choices: ['柱頭', '子房', '胚珠'] },
      { id: 'ovary', answer: '子房', choices: ['子房', '柱頭', '胚珠'] },
      { id: 'ovule', answer: '胚珠', choices: ['胚珠', '花粉', '柱頭'] },
    ],
    practice: [
      {
        id: 'science-2-1', label: '問題1', prompt: '花の一番外側にあるつくりは？',
        options: [
          { id: 'a', text: 'がく', correct: true },
          { id: 'b', text: '花弁', correct: false },
          { id: 'c', text: 'めしべ', correct: false },
        ],
        hints: ['外側から「がく・花弁・おしべ・めしべ」の順です。'],
        explanation: '正解！花の一番外側にあるのはがくです。',
      },
      {
        id: 'science-2-2', label: '問題2', prompt: '被子植物の胚珠はどこにある？',
        options: [
          { id: 'a', text: '子房の中にある', correct: true },
          { id: 'b', text: 'むき出しになっている', correct: false },
          { id: 'c', text: '花弁の中にある', correct: false },
        ],
        hints: ['「被」子植物の「被」は包まれているという意味です。'],
        explanation: '正解！被子植物は胚珠が子房の中に包まれています。',
      },
    ],
  },
  {
    step: 3,
    subject: 'science',
    title: 'マツのつくり（裸子植物）',
    videoId: 'Ea0FKurJdFo',
    summary: [
      text('マツには'), blank('male'), text('と'), blank('female'), text('があり、'), blank('male'),
      text('のりん片には花粉が入った花粉のうがついている。'), blank('female'), text('のりん片には'),
      blank('ovule'), text('がついているが、子房がなく'), blank('ovule'), text('が'), blank('exposed'),
      text('。このように子房がなく胚珠がむき出しになっている植物を'), blank('gymno'), text('という。'),
    ],
    blanks: [
      { id: 'male', answer: '雄花', choices: ['雄花', '雌花', 'がく'] },
      { id: 'female', answer: '雌花', choices: ['雌花', '雄花', '花弁'] },
      { id: 'ovule', answer: '胚珠', choices: ['胚珠', '花粉のう', '子房'] },
      { id: 'exposed', answer: 'むき出しになっている', choices: ['むき出しになっている', '子房に包まれている', '見えなくなっている'] },
      { id: 'gymno', answer: '裸子植物', choices: ['裸子植物', '被子植物', 'シダ植物'] },
    ],
    practice: [
      {
        id: 'science-3-1', label: '問題1', prompt: 'マツのように胚珠が子房に包まれず、むき出しになっている植物を何という？',
        options: [
          { id: 'a', text: '裸子植物', correct: true },
          { id: 'b', text: '被子植物', correct: false },
          { id: 'c', text: 'シダ植物', correct: false },
        ],
        hints: ['「裸」の字に注目しましょう。むき出し＝裸、ということです。'],
        explanation: '正解！胚珠がむき出しの植物を裸子植物といいます。',
      },
      {
        id: 'science-3-2', label: '問題2', prompt: 'マツの雌花のりん片についているのは？',
        options: [
          { id: 'a', text: '胚珠', correct: true },
          { id: 'b', text: '花粉のう', correct: false },
          { id: 'c', text: '柱頭', correct: false },
        ],
        hints: ['花粉のうがついているのは雄花の方です。'],
        explanation: '正解！雌花のりん片には胚珠がついています。',
      },
    ],
  },
  {
    step: 4,
    subject: 'science',
    title: '単子葉類と双子葉類',
    videoId: 'W3Zeefa5VW8',
    summary: [
      text('被子植物は、子葉が1枚の'), blank('mono'), text('と、子葉が2枚の'), blank('di'),
      text('に分けられる。'), blank('mono'), text('の葉脈は'), blank('parallel'), text('、根は'),
      blank('fibrous'), text('とよばれるひげのような根が広がる。'), blank('di'), text('の葉脈は'),
      blank('net'), text('、根は太い'), blank('main'), text('と細い'), blank('lateral'), text('からなる。'),
    ],
    blanks: [
      { id: 'mono', answer: '単子葉類', choices: ['単子葉類', '双子葉類', '裸子植物'] },
      { id: 'di', answer: '双子葉類', choices: ['双子葉類', '単子葉類', '裸子植物'] },
      { id: 'parallel', answer: '平行脈', choices: ['平行脈', '網状脈', '主脈'] },
      { id: 'fibrous', answer: 'ひげ根', choices: ['ひげ根', '主根', '側根'] },
      { id: 'net', answer: '網状脈', choices: ['網状脈', '平行脈', '単脈'] },
      { id: 'main', answer: '主根', choices: ['主根', 'ひげ根', '側根'] },
      { id: 'lateral', answer: '側根', choices: ['側根', '主根', 'ひげ根'] },
    ],
    practice: [
      {
        id: 'science-4-1', label: '問題1', prompt: '単子葉類の葉脈の特徴は？',
        options: [
          { id: 'a', text: '平行脈', correct: true },
          { id: 'b', text: '網状脈', correct: false },
          { id: 'c', text: '枝分かれした脈', correct: false },
        ],
        hints: ['子葉が1枚の植物の葉脈は、線が並行に並んでいます。'],
        explanation: '正解！単子葉類の葉脈は平行脈です。',
      },
      {
        id: 'science-4-2', label: '問題2', prompt: '双子葉類の根のつくりは？',
        options: [
          { id: 'a', text: '主根と側根', correct: true },
          { id: 'b', text: 'ひげ根のみ', correct: false },
          { id: 'c', text: '葉脈と同じつくり', correct: false },
        ],
        hints: ['太い根が1本あり、そこから細い根が枝分かれします。'],
        explanation: '正解！双子葉類は太い主根と細い側根からなります。',
      },
    ],
  },
  {
    step: 1,
    subject: 'english',
    title: '「主語」と「動詞」とは？',
    videoId: 'v0QcicHfYiM',
    summary: [
      text('英語の文には、「だれが」「何が」にあたる'), blank('subject'), text('と、「どうする」「どんなだ」にあたる'),
      blank('verb'), text('が必ず含まれる。例えば "I play soccer." では、'), blank('subject'), text('は"'),
      blank('subjectWord'), text('"で、'), blank('verb'), text('は"'), blank('verbWord'), text('"である。'),
    ],
    blanks: [
      { id: 'subject', answer: '主語', choices: ['主語', '動詞', '目的語'] },
      { id: 'verb', answer: '動詞', choices: ['動詞', '主語', '形容詞'] },
      { id: 'subjectWord', answer: 'I', choices: ['I', 'play', 'soccer'] },
      { id: 'verbWord', answer: 'play', choices: ['play', 'I', 'soccer'] },
    ],
    practice: [
      {
        id: 'english-1-1', label: '問題1', prompt: '"She likes music." の主語はどれ？',
        options: [
          { id: 'a', text: 'She', correct: true },
          { id: 'b', text: 'likes', correct: false },
          { id: 'c', text: 'music', correct: false },
        ],
        hints: ['「だれが」にあたる単語を探しましょう。'],
        explanation: '正解！「だれが」にあたる She が主語です。',
      },
      {
        id: 'english-1-2', label: '問題2', prompt: '"They run fast." の動詞はどれ？',
        options: [
          { id: 'a', text: 'run', correct: true },
          { id: 'b', text: 'They', correct: false },
          { id: 'c', text: 'fast', correct: false },
        ],
        hints: ['「どうする」にあたる単語を探しましょう。'],
        explanation: '正解！「走る」という動作を表す run が動詞です。',
      },
    ],
  },
  {
    step: 2,
    subject: 'english',
    title: '「be動詞」とは？',
    videoId: 'Xj_tLtNnyFc',
    summary: [
      text('be動詞は「＝」の意味を持ち、主語の状態や性質を説明するときに使う。主語が"I"のときは'),
      blank('am'), text('、"you"や複数のときは'), blank('are'), text('、それ以外の単数（he, she, itなど）のときは'),
      blank('is'), text('を使う。'),
    ],
    blanks: [
      { id: 'am', answer: 'am', choices: ['am', 'are', 'is'] },
      { id: 'are', answer: 'are', choices: ['are', 'am', 'is'] },
      { id: 'is', answer: 'is', choices: ['is', 'am', 'are'] },
    ],
    practice: [
      {
        id: 'english-2-1', label: '問題1', prompt: '"He ___ a student." に入るbe動詞は？',
        options: [
          { id: 'a', text: 'is', correct: true },
          { id: 'b', text: 'am', correct: false },
          { id: 'c', text: 'are', correct: false },
        ],
        hints: ['He は単数で、"I" でも "you" でもありません。'],
        explanation: '正解！He・She・It などの単数には is を使います。',
      },
      {
        id: 'english-2-2', label: '問題2', prompt: '"They ___ happy." に入るbe動詞は？',
        options: [
          { id: 'a', text: 'are', correct: true },
          { id: 'b', text: 'is', correct: false },
          { id: 'c', text: 'am', correct: false },
        ],
        hints: ['They は複数を表す主語です。'],
        explanation: '正解！複数の主語には are を使います。',
      },
    ],
  },
  {
    step: 3,
    subject: 'english',
    title: 'am, are, isの使い分け①',
    videoId: 'ZGKX59Sw3bk',
    summary: [
      text('主語が"I"のときは必ず'), blank('am'), text('を使う。主語が"you"のとき、または主語が複数（we, they, 複数名詞など）のときは'),
      blank('are'), text('を使う。主語がそれ以外の単数（he, she, it, 単数名詞）のときは'), blank('is'), text('を使う。'),
    ],
    blanks: [
      { id: 'am', answer: 'am', choices: ['am', 'is', 'are'] },
      { id: 'are', answer: 'are', choices: ['are', 'is', 'am'] },
      { id: 'is', answer: 'is', choices: ['is', 'are', 'am'] },
    ],
    practice: [
      {
        id: 'english-3-1', label: '問題1', prompt: '"My brother ___ tall." に入るbe動詞は？',
        options: [
          { id: 'a', text: 'is', correct: true },
          { id: 'b', text: 'are', correct: false },
          { id: 'c', text: 'am', correct: false },
        ],
        hints: ['my brother は単数の人を指します。'],
        explanation: '正解！単数の主語には is を使います。',
      },
      {
        id: 'english-3-2', label: '問題2', prompt: '"We ___ good friends." に入るbe動詞は？',
        options: [
          { id: 'a', text: 'are', correct: true },
          { id: 'b', text: 'is', correct: false },
          { id: 'c', text: 'am', correct: false },
        ],
        hints: ['We は複数を表す主語です。'],
        explanation: '正解！複数の主語には are を使います。',
      },
    ],
  },
  {
    step: 4,
    subject: 'english',
    title: 'am, are, isの使い分け②',
    videoId: 'Yp7kPCepS9A',
    summary: [
      text('be動詞を使うときは、主語の人称と数（単数・複数）に注目する。複数の人や物が主語のときは、人称に関わらず'),
      blank('are'), text('を使う。"I"だけは特別で、単数でも'), blank('am'), text('を使う。'),
    ],
    blanks: [
      { id: 'are', answer: 'are', choices: ['are', 'is', 'am'] },
      { id: 'am', answer: 'am', choices: ['am', 'is', 'are'] },
    ],
    practice: [
      {
        id: 'english-4-1', label: '問題1', prompt: '"The cats ___ cute." に入るbe動詞は？',
        options: [
          { id: 'a', text: 'are', correct: true },
          { id: 'b', text: 'is', correct: false },
          { id: 'c', text: 'am', correct: false },
        ],
        hints: ['cats は複数形です。'],
        explanation: '正解！複数の主語には are を使います。',
      },
      {
        id: 'english-4-2', label: '問題2', prompt: '"I ___ happy today." に入るbe動詞は？',
        options: [
          { id: 'a', text: 'am', correct: true },
          { id: 'b', text: 'is', correct: false },
          { id: 'c', text: 'are', correct: false },
        ],
        hints: ['主語が "I" のときは特別な形を使います。'],
        explanation: '正解！"I" のときは必ず am を使います。',
      },
    ],
  },
]
