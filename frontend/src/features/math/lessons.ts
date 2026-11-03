import type { MathLesson } from './types.ts'

// 自作教材ZIPの数学のみを移植。教材・問題の識別子は版の途中で再利用しない。
export const MATH_CONTENT_VERSION = '1'
export const mathLessons: readonly MathLesson[] = [
  {
    "step": 1,
    "title": "正負の数の足し算・引き算",
    "narration": [
      "数直線の0を基準に、右へ進むと+、左へ進むと-の数を表します。",
      "加法は数直線上を「進む」こと、減法は「戻る」ことと考えると分かりやすいです。",
      "スライダーで点を動かして、数直線上の位置を確かめてみましょう。"
    ],
    "animation": {
      "type": "numberLine",
      "params": {
        "min": -10,
        "max": 10,
        "pointLabel": "点P"
      },
      "controls": [
        {
          "id": "p",
          "label": "点Pの位置",
          "min": -10,
          "max": 10,
          "step": 1,
          "def": 3
        }
      ]
    },
    "check": {
      "id": "math-1-check",
      "label": "確認問題",
      "prompt": "(-3)+(+5) の計算結果はどれですか？",
      "options": [
        {
          "id": "math-1-check-0",
          "text": "+2",
          "correct": true
        },
        {
          "id": "math-1-check-1",
          "text": "-2",
          "correct": false
        },
        {
          "id": "math-1-check-2",
          "text": "+8",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "数直線上で-3から+5だけ右へ進むと+2に着きます。"
    },
    "practice": [
      {
        "id": "math-1-practice-1",
        "label": "基礎",
        "prompt": "(-7)+(+4) を計算しなさい。",
        "options": [
          {
            "id": "math-1-practice-1-0",
            "text": "-3",
            "correct": true
          },
          {
            "id": "math-1-practice-1-1",
            "text": "3",
            "correct": false
          },
          {
            "id": "math-1-practice-1-2",
            "text": "-11",
            "correct": false
          },
          {
            "id": "math-1-practice-1-3",
            "text": "11",
            "correct": false
          }
        ],
        "hints": [
          "数直線で-7の位置からスタートします。",
          "+4は右へ4進むことを表します。",
          "-7から右へ4進むと-3になります。"
        ],
        "explanation": "正解！ (-7)+(+4)=-3 です。"
      },
      {
        "id": "math-1-practice-2",
        "label": "標準",
        "prompt": "(-5)-(-8) を計算しなさい。",
        "options": [
          {
            "id": "math-1-practice-2-0",
            "text": "3",
            "correct": true
          },
          {
            "id": "math-1-practice-2-1",
            "text": "-13",
            "correct": false
          },
          {
            "id": "math-1-practice-2-2",
            "text": "13",
            "correct": false
          },
          {
            "id": "math-1-practice-2-3",
            "text": "-3",
            "correct": false
          }
        ],
        "hints": [
          "「-を引く」は「+を足す」と同じ意味になります。",
          "(-5)-(-8) は (-5)+(+8) に直せます。",
          "-5から右へ8進むと3になります。"
        ],
        "explanation": "正解！ 負の数を引くことは、その数を足すことと同じです。"
      },
      {
        "id": "math-1-practice-3",
        "label": "発展",
        "prompt": "異なる3つの整数a,b,cについて a+b=-2, b+c=5, a+c=3 のとき、a+b+cの値を求めなさい。",
        "options": [
          {
            "id": "math-1-practice-3-0",
            "text": "3",
            "correct": true
          },
          {
            "id": "math-1-practice-3-1",
            "text": "6",
            "correct": false
          },
          {
            "id": "math-1-practice-3-2",
            "text": "1.5",
            "correct": false
          },
          {
            "id": "math-1-practice-3-3",
            "text": "-3",
            "correct": false
          }
        ],
        "hints": [
          "3つの式をすべて足してみましょう。",
          "左辺は2(a+b+c)になります。",
          "2(a+b+c)=-2+5+3=6 なので a+b+c=3 です。"
        ],
        "explanation": "正解！ 3式の和から 2(a+b+c)=6、よって a+b+c=3 です。"
      }
    ]
  },
  {
    "step": 2,
    "title": "正負の数の掛け算・割り算（符号のルール）",
    "narration": [
      "同符号どうしの積・商は+、異符号どうしの積・商は-になります。",
      "「+×+=+」「-×-=+」「+×-=-」の3パターンを覚えましょう。",
      "点の位置を動かして、答えの符号がどう変わるか確認してみましょう。"
    ],
    "animation": {
      "type": "numberLine",
      "params": {
        "min": -12,
        "max": 12,
        "pointLabel": "積"
      },
      "controls": [
        {
          "id": "p",
          "label": "積の値",
          "min": -12,
          "max": 12,
          "step": 1,
          "def": -4
        }
      ]
    },
    "check": {
      "id": "math-2-check",
      "label": "確認問題",
      "prompt": "(-4)×(-3) の符号はどうなりますか？",
      "options": [
        {
          "id": "math-2-check-0",
          "text": "正(プラス)",
          "correct": true
        },
        {
          "id": "math-2-check-1",
          "text": "負(マイナス)",
          "correct": false
        },
        {
          "id": "math-2-check-2",
          "text": "0になる",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "負×負は正になります。(-4)×(-3)=12 です。"
    },
    "practice": [
      {
        "id": "math-2-practice-1",
        "label": "基礎",
        "prompt": "(-6)×3 を計算しなさい。",
        "options": [
          {
            "id": "math-2-practice-1-0",
            "text": "-18",
            "correct": true
          },
          {
            "id": "math-2-practice-1-1",
            "text": "18",
            "correct": false
          },
          {
            "id": "math-2-practice-1-2",
            "text": "-3",
            "correct": false
          },
          {
            "id": "math-2-practice-1-3",
            "text": "3",
            "correct": false
          }
        ],
        "hints": [
          "異符号の積なので答えは負になります。",
          "6×3=18 を使います。",
          "符号は-なので-18です。"
        ],
        "explanation": "正解！ (-6)×3=-18 です。"
      },
      {
        "id": "math-2-practice-2",
        "label": "標準",
        "prompt": "(-24)÷(-8) を計算しなさい。",
        "options": [
          {
            "id": "math-2-practice-2-0",
            "text": "3",
            "correct": true
          },
          {
            "id": "math-2-practice-2-1",
            "text": "-3",
            "correct": false
          },
          {
            "id": "math-2-practice-2-2",
            "text": "8",
            "correct": false
          },
          {
            "id": "math-2-practice-2-3",
            "text": "-8",
            "correct": false
          }
        ],
        "hints": [
          "同符号どうしの商は正になります。",
          "24÷8=3 を使います。",
          "符号は+なので3です。"
        ],
        "explanation": "正解！ 負÷負は正になるので3です。"
      },
      {
        "id": "math-2-practice-3",
        "label": "発展",
        "prompt": "a<0, b>0 のとき、a²bの符号を答えなさい。",
        "options": [
          {
            "id": "math-2-practice-3-0",
            "text": "正(プラス)",
            "correct": true
          },
          {
            "id": "math-2-practice-3-1",
            "text": "負(マイナス)",
            "correct": false
          },
          {
            "id": "math-2-practice-3-2",
            "text": "0",
            "correct": false
          }
        ],
        "hints": [
          "a²は必ず0以上になります(aが0でなければ正)。",
          "正の数×正の数=正です。",
          "よってa²bは正になります。"
        ],
        "explanation": "正解！ a²は常に正、b>0なので積も正です。"
      }
    ]
  },
  {
    "step": 3,
    "title": "文字式のルール（×・÷の省略、文字の順番）",
    "narration": [
      "文字式では×を省略し、数を文字の前に書きます（例: 3×x → 3x）。",
      "÷は分数の形で書くのが基本です（例: a÷2 → a/2）。",
      "身近な場面を文字式に直すときは、まず日本語を数式の形に対応させましょう。"
    ],
    "animation": {
      "type": "generic",
      "params": {
        "label": "3 × x → 3x（×は省略し数字を前に）"
      },
      "controls": []
    },
    "check": {
      "id": "math-3-check",
      "label": "確認問題",
      "prompt": "1個x円のパンを3個買うときの合計金額を文字式で表すとどれですか？",
      "options": [
        {
          "id": "math-3-check-0",
          "text": "3x円",
          "correct": true
        },
        {
          "id": "math-3-check-1",
          "text": "x+3円",
          "correct": false
        },
        {
          "id": "math-3-check-2",
          "text": "x3円",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "同じ数の掛け算は数字を前に書いて3xと表します。"
    },
    "practice": [
      {
        "id": "math-3-practice-1",
        "label": "基礎",
        "prompt": "1本a円のペンを5本買う合計金額を文字式で表しなさい。",
        "options": [
          {
            "id": "math-3-practice-1-0",
            "text": "5a円",
            "correct": true
          },
          {
            "id": "math-3-practice-1-1",
            "text": "a5円",
            "correct": false
          },
          {
            "id": "math-3-practice-1-2",
            "text": "a+5円",
            "correct": false
          },
          {
            "id": "math-3-practice-1-3",
            "text": "5+a円",
            "correct": false
          }
        ],
        "hints": [
          "「5本分」は5をかけることを表します。",
          "数字は文字の前に書きます。",
          "a×5は5aと書きます。"
        ],
        "explanation": "正解！ 5aが正しい書き方です。"
      },
      {
        "id": "math-3-practice-2",
        "label": "標準",
        "prompt": "縦xcm、横(x+3)cmの長方形の面積を文字式で表しなさい。",
        "options": [
          {
            "id": "math-3-practice-2-0",
            "text": "x(x+3)cm²",
            "correct": true
          },
          {
            "id": "math-3-practice-2-1",
            "text": "x+3cm²",
            "correct": false
          },
          {
            "id": "math-3-practice-2-2",
            "text": "2x+3cm²",
            "correct": false
          },
          {
            "id": "math-3-practice-2-3",
            "text": "x²+3cm²",
            "correct": false
          }
        ],
        "hints": [
          "長方形の面積は縦×横です。",
          "x×(x+3)を考えます。",
          "かっこはそのまま×の形で表せます。"
        ],
        "explanation": "正解！ 面積=縦×横=x(x+3)cm²です。"
      },
      {
        "id": "math-3-practice-3",
        "label": "発展",
        "prompt": "ある数xを2倍して3を引いた数と、xに5を加えた数が等しいとき、次の式として正しいものはどれですか。",
        "options": [
          {
            "id": "math-3-practice-3-0",
            "text": "2x-3=x+5",
            "correct": true
          },
          {
            "id": "math-3-practice-3-1",
            "text": "2x+3=x+5",
            "correct": false
          },
          {
            "id": "math-3-practice-3-2",
            "text": "2x-3=x-5",
            "correct": false
          },
          {
            "id": "math-3-practice-3-3",
            "text": "x-3=2x+5",
            "correct": false
          }
        ],
        "hints": [
          "「2倍して3を引く」は2x-3です。",
          "「xに5を加える」はx+5です。",
          "2つが等しいので=でつなぎます。"
        ],
        "explanation": "正解！ 2x-3=x+5 が正しい式です。"
      }
    ]
  },
  {
    "step": 4,
    "title": "同類項をまとめる計算",
    "narration": [
      "文字の部分が同じ項（同類項）は、係数どうしを計算してまとめられます。",
      "例えば3xと-xは同類項なので、3x-x=2xとまとめられます。",
      "文字の項と数の項は別々に整理すると計算ミスが減ります。"
    ],
    "animation": {
      "type": "generic",
      "params": {
        "label": "3x と -x → 同類項なので 2x にまとめる"
      },
      "controls": []
    },
    "check": {
      "id": "math-4-check",
      "label": "確認問題",
      "prompt": "3x+5-x+2 を計算した結果はどれですか？",
      "options": [
        {
          "id": "math-4-check-0",
          "text": "2x+7",
          "correct": true
        },
        {
          "id": "math-4-check-1",
          "text": "2x+5",
          "correct": false
        },
        {
          "id": "math-4-check-2",
          "text": "4x+7",
          "correct": false
        },
        {
          "id": "math-4-check-3",
          "text": "3x+7",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "xの項どうし、数どうしをまとめると2x+7になります。"
    },
    "practice": [
      {
        "id": "math-4-practice-1",
        "label": "基礎",
        "prompt": "4a+3-2a+6 を計算しなさい。",
        "options": [
          {
            "id": "math-4-practice-1-0",
            "text": "2a+9",
            "correct": true
          },
          {
            "id": "math-4-practice-1-1",
            "text": "6a+9",
            "correct": false
          },
          {
            "id": "math-4-practice-1-2",
            "text": "2a+3",
            "correct": false
          },
          {
            "id": "math-4-practice-1-3",
            "text": "4a+9",
            "correct": false
          }
        ],
        "hints": [
          "aの項どうしをまとめます(4a-2a)。",
          "数どうしをまとめます(3+6)。",
          "4a-2a=2a, 3+6=9 です。"
        ],
        "explanation": "正解！ 2a+9です。"
      },
      {
        "id": "math-4-practice-2",
        "label": "標準",
        "prompt": "(5x-2)-(3x-7) を計算しなさい。",
        "options": [
          {
            "id": "math-4-practice-2-0",
            "text": "2x+5",
            "correct": true
          },
          {
            "id": "math-4-practice-2-1",
            "text": "2x-9",
            "correct": false
          },
          {
            "id": "math-4-practice-2-2",
            "text": "8x-9",
            "correct": false
          },
          {
            "id": "math-4-practice-2-3",
            "text": "2x+9",
            "correct": false
          }
        ],
        "hints": [
          "かっこを外すとき、符号に注意しましょう。",
          "-(3x-7)は-3x+7になります。",
          "5x-3x=2x, -2+7=5 です。"
        ],
        "explanation": "正解！ 2x+5です。"
      },
      {
        "id": "math-4-practice-3",
        "label": "発展",
        "prompt": "2(x-3)-3(x-1) を計算しなさい。",
        "options": [
          {
            "id": "math-4-practice-3-0",
            "text": "-x-3",
            "correct": true
          },
          {
            "id": "math-4-practice-3-1",
            "text": "x-3",
            "correct": false
          },
          {
            "id": "math-4-practice-3-2",
            "text": "-x+3",
            "correct": false
          },
          {
            "id": "math-4-practice-3-3",
            "text": "-5x-3",
            "correct": false
          }
        ],
        "hints": [
          "まず2と-3をそれぞれかっこの中にかけます。",
          "2(x-3)=2x-6, -3(x-1)=-3x+3 です。",
          "2x-6-3x+3=-x-3 となります。"
        ],
        "explanation": "正解！ -x-3です。"
      }
    ]
  },
  {
    "step": 5,
    "title": "文字式の乗法・除法",
    "narration": [
      "文字式に数をかけるときは、係数だけをかけます。",
      "文字式を数で割るときも、係数だけを割ります。",
      "符号の計算は正負の数のルールと同じです。"
    ],
    "animation": {
      "type": "generic",
      "params": {
        "label": "3x × 4 → 係数だけを計算して 12x"
      },
      "controls": []
    },
    "check": {
      "id": "math-5-check",
      "label": "確認問題",
      "prompt": "3x×4 の計算結果はどれですか？",
      "options": [
        {
          "id": "math-5-check-0",
          "text": "12x",
          "correct": true
        },
        {
          "id": "math-5-check-1",
          "text": "7x",
          "correct": false
        },
        {
          "id": "math-5-check-2",
          "text": "34x",
          "correct": false
        },
        {
          "id": "math-5-check-3",
          "text": "x12",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "係数の3と4をかけて12x になります。"
    },
    "practice": [
      {
        "id": "math-5-practice-1",
        "label": "基礎",
        "prompt": "(-2a)×(-5) を計算しなさい。",
        "options": [
          {
            "id": "math-5-practice-1-0",
            "text": "10a",
            "correct": true
          },
          {
            "id": "math-5-practice-1-1",
            "text": "-10a",
            "correct": false
          },
          {
            "id": "math-5-practice-1-2",
            "text": "7a",
            "correct": false
          },
          {
            "id": "math-5-practice-1-3",
            "text": "-7a",
            "correct": false
          }
        ],
        "hints": [
          "係数の-2と-5をかけます。",
          "負×負なので答えは正です。",
          "2×5=10なので10aです。"
        ],
        "explanation": "正解！ 10aです。"
      },
      {
        "id": "math-5-practice-2",
        "label": "標準",
        "prompt": "12x÷4 を計算しなさい。",
        "options": [
          {
            "id": "math-5-practice-2-0",
            "text": "3x",
            "correct": true
          },
          {
            "id": "math-5-practice-2-1",
            "text": "8x",
            "correct": false
          },
          {
            "id": "math-5-practice-2-2",
            "text": "3",
            "correct": false
          },
          {
            "id": "math-5-practice-2-3",
            "text": "48x",
            "correct": false
          }
        ],
        "hints": [
          "係数12を4で割ります。",
          "xはそのまま残ります。",
          "12÷4=3なので3xです。"
        ],
        "explanation": "正解！ 3xです。"
      },
      {
        "id": "math-5-practice-3",
        "label": "発展",
        "prompt": "-18a÷(-6)×(-2) を計算しなさい。",
        "options": [
          {
            "id": "math-5-practice-3-0",
            "text": "-6a",
            "correct": true
          },
          {
            "id": "math-5-practice-3-1",
            "text": "6a",
            "correct": false
          },
          {
            "id": "math-5-practice-3-2",
            "text": "-3a",
            "correct": false
          },
          {
            "id": "math-5-practice-3-3",
            "text": "3a",
            "correct": false
          }
        ],
        "hints": [
          "まず-18a÷(-6)を計算します。",
          "-18÷(-6)=3なので3aになります。",
          "3a×(-2)=-6aです。"
        ],
        "explanation": "正解！ -6aです。"
      }
    ]
  },
  {
    "step": 6,
    "title": "1次方程式を解く（移項の考え方）",
    "narration": [
      "天秤のように、方程式の両辺は常につり合っています。",
      "項を移項するときは、符号を変えて反対側に移します。",
      "xだけを左辺に残すように式を整理すれば、解が求まります。"
    ],
    "animation": {
      "type": "balance",
      "params": {
        "leftExpr": "2x+3",
        "rightExpr": "9"
      },
      "controls": [
        {
          "id": "tilt",
          "label": "つり合いの傾き",
          "min": -1,
          "max": 1,
          "step": 0.1,
          "def": 0
        }
      ]
    },
    "check": {
      "id": "math-6-check",
      "label": "確認問題",
      "prompt": "方程式 2x+3=9 の解はどれですか？",
      "options": [
        {
          "id": "math-6-check-0",
          "text": "x=3",
          "correct": true
        },
        {
          "id": "math-6-check-1",
          "text": "x=6",
          "correct": false
        },
        {
          "id": "math-6-check-2",
          "text": "x=12",
          "correct": false
        },
        {
          "id": "math-6-check-3",
          "text": "x=4",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "2x=6 となり、両辺を2で割るとx=3です。"
    },
    "practice": [
      {
        "id": "math-6-practice-1",
        "label": "基礎",
        "prompt": "x-5=8 を解きなさい。",
        "options": [
          {
            "id": "math-6-practice-1-0",
            "text": "x=13",
            "correct": true
          },
          {
            "id": "math-6-practice-1-1",
            "text": "x=3",
            "correct": false
          },
          {
            "id": "math-6-practice-1-2",
            "text": "x=-3",
            "correct": false
          },
          {
            "id": "math-6-practice-1-3",
            "text": "x=40",
            "correct": false
          }
        ],
        "hints": [
          "-5を右辺に移項します。",
          "符号が変わって+5になります。",
          "x=8+5=13です。"
        ],
        "explanation": "正解！ x=13です。"
      },
      {
        "id": "math-6-practice-2",
        "label": "標準",
        "prompt": "3x+4=2x+10 を解きなさい。",
        "options": [
          {
            "id": "math-6-practice-2-0",
            "text": "x=6",
            "correct": true
          },
          {
            "id": "math-6-practice-2-1",
            "text": "x=14",
            "correct": false
          },
          {
            "id": "math-6-practice-2-2",
            "text": "x=2",
            "correct": false
          },
          {
            "id": "math-6-practice-2-3",
            "text": "x=-6",
            "correct": false
          }
        ],
        "hints": [
          "文字の項を左辺にまとめます(2xを移項)。",
          "数の項を右辺にまとめます(4を移項)。",
          "x=10-4=6です。"
        ],
        "explanation": "正解！ x=6です。"
      },
      {
        "id": "math-6-practice-3",
        "label": "発展",
        "prompt": "0.3x-1=0.2x+0.5 を解きなさい。",
        "options": [
          {
            "id": "math-6-practice-3-0",
            "text": "x=15",
            "correct": true
          },
          {
            "id": "math-6-practice-3-1",
            "text": "x=1.5",
            "correct": false
          },
          {
            "id": "math-6-practice-3-2",
            "text": "x=5",
            "correct": false
          },
          {
            "id": "math-6-practice-3-3",
            "text": "x=-15",
            "correct": false
          }
        ],
        "hints": [
          "両辺を10倍すると小数が消えます。",
          "3x-10=2x+5 になります。",
          "x=5+10=15です。"
        ],
        "explanation": "正解！ 両辺×10で3x-10=2x+5、x=15です。"
      }
    ]
  },
  {
    "step": 7,
    "title": "文章題を方程式で解く手順",
    "narration": [
      "求めたいものをxと置くのが最初のステップです。",
      "問題文の関係を、そのままxを使った等式に直します。",
      "方程式を解いたら、答えが問題の条件に合っているか必ず確認します。"
    ],
    "animation": {
      "type": "balance",
      "params": {
        "leftExpr": "わからない数",
        "rightExpr": "条件から求めた式"
      },
      "controls": [
        {
          "id": "tilt",
          "label": "つり合いの傾き",
          "min": -1,
          "max": 1,
          "step": 0.1,
          "def": 0
        }
      ]
    },
    "check": {
      "id": "math-7-check",
      "label": "確認問題",
      "prompt": "文章題を方程式で解く最初のステップとして最も適切なのはどれですか？",
      "options": [
        {
          "id": "math-7-check-0",
          "text": "求めたいものをxと置く",
          "correct": true
        },
        {
          "id": "math-7-check-1",
          "text": "すぐに計算する",
          "correct": false
        },
        {
          "id": "math-7-check-2",
          "text": "答えを先に決める",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "まず求めたいものを文字で置くことが文章題攻略の第一歩です。"
    },
    "practice": [
      {
        "id": "math-7-practice-1",
        "label": "基礎",
        "prompt": "ある数xに7を加えると20になる。xを求めなさい。",
        "options": [
          {
            "id": "math-7-practice-1-0",
            "text": "13",
            "correct": true
          },
          {
            "id": "math-7-practice-1-1",
            "text": "27",
            "correct": false
          },
          {
            "id": "math-7-practice-1-2",
            "text": "3",
            "correct": false
          },
          {
            "id": "math-7-practice-1-3",
            "text": "140",
            "correct": false
          }
        ],
        "hints": [
          "式にするとx+7=20です。",
          "7を右辺に移項します。",
          "x=20-7=13です。"
        ],
        "explanation": "正解！ x=13です。"
      },
      {
        "id": "math-7-practice-2",
        "label": "標準",
        "prompt": "1本150円のジュースをx本買い、50円の割引券を使ったら合計850円だった。xを求めなさい。",
        "options": [
          {
            "id": "math-7-practice-2-0",
            "text": "6本",
            "correct": true
          },
          {
            "id": "math-7-practice-2-1",
            "text": "5本",
            "correct": false
          },
          {
            "id": "math-7-practice-2-2",
            "text": "7本",
            "correct": false
          },
          {
            "id": "math-7-practice-2-3",
            "text": "9本",
            "correct": false
          }
        ],
        "hints": [
          "式にすると150x-50=850です。",
          "50を右辺に移項すると150x=900です。",
          "x=900÷150=6です。"
        ],
        "explanation": "正解！ 6本です。"
      },
      {
        "id": "math-7-practice-3",
        "label": "発展",
        "prompt": "兄は妹より5歳年上で、2人の年齢の合計は31歳である。10年後の兄の年齢を求めなさい。",
        "options": [
          {
            "id": "math-7-practice-3-0",
            "text": "28歳",
            "correct": true
          },
          {
            "id": "math-7-practice-3-1",
            "text": "18歳",
            "correct": false
          },
          {
            "id": "math-7-practice-3-2",
            "text": "23歳",
            "correct": false
          },
          {
            "id": "math-7-practice-3-3",
            "text": "31歳",
            "correct": false
          }
        ],
        "hints": [
          "妹をx歳とすると、兄はx+5歳です。",
          "x+(x+5)=31 を解きます。",
          "2x=26よりx=13、兄は18歳、10年後は28歳です。"
        ],
        "explanation": "正解！ 妹13歳・兄18歳なので10年後は28歳です。"
      }
    ]
  },
  {
    "step": 8,
    "title": "比例 y=axの性質",
    "narration": [
      "比例のグラフは必ず原点(0,0)を通る直線になります。",
      "xの値が2倍、3倍になると、yの値も同じ比率で2倍、3倍になります。",
      "スライダーで比例定数aを変えて、グラフの傾き方を確かめましょう。"
    ],
    "animation": {
      "type": "graph",
      "params": {
        "kind": "linear",
        "scale": 16
      },
      "controls": [
        {
          "id": "a",
          "label": "比例定数 a",
          "min": -5,
          "max": 5,
          "step": 1,
          "def": 2
        },
        {
          "id": "b",
          "label": "切片(通常0)",
          "min": 0,
          "max": 0,
          "step": 1,
          "def": 0
        }
      ]
    },
    "check": {
      "id": "math-8-check",
      "label": "確認問題",
      "prompt": "y=4xのグラフの特徴として正しいものはどれですか？",
      "options": [
        {
          "id": "math-8-check-0",
          "text": "原点を通る直線",
          "correct": true
        },
        {
          "id": "math-8-check-1",
          "text": "y軸に平行な直線",
          "correct": false
        },
        {
          "id": "math-8-check-2",
          "text": "放物線",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "比例のグラフは必ず原点を通る直線です。"
    },
    "practice": [
      {
        "id": "math-8-practice-1",
        "label": "基礎",
        "prompt": "yはxに比例し、x=3のときy=12である。比例定数を求めなさい。",
        "options": [
          {
            "id": "math-8-practice-1-0",
            "text": "4",
            "correct": true
          },
          {
            "id": "math-8-practice-1-1",
            "text": "3",
            "correct": false
          },
          {
            "id": "math-8-practice-1-2",
            "text": "12",
            "correct": false
          },
          {
            "id": "math-8-practice-1-3",
            "text": "36",
            "correct": false
          }
        ],
        "hints": [
          "y=axに数を当てはめます。",
          "12=a×3です。",
          "a=12÷3=4です。"
        ],
        "explanation": "正解！ a=4です。"
      },
      {
        "id": "math-8-practice-2",
        "label": "標準",
        "prompt": "yはxに比例し、x=-2のときy=8である。x=5のときのyを求めなさい。",
        "options": [
          {
            "id": "math-8-practice-2-0",
            "text": "-20",
            "correct": true
          },
          {
            "id": "math-8-practice-2-1",
            "text": "20",
            "correct": false
          },
          {
            "id": "math-8-practice-2-2",
            "text": "-10",
            "correct": false
          },
          {
            "id": "math-8-practice-2-3",
            "text": "10",
            "correct": false
          }
        ],
        "hints": [
          "まず比例定数aを求めます。",
          "8=a×(-2)よりa=-4です。",
          "y=-4×5=-20です。"
        ],
        "explanation": "正解！ a=-4なのでy=-20です。"
      },
      {
        "id": "math-8-practice-3",
        "label": "発展",
        "prompt": "yはxに比例し、xの値が3増えるとyの値は12増える。比例定数を求めなさい。",
        "options": [
          {
            "id": "math-8-practice-3-0",
            "text": "4",
            "correct": true
          },
          {
            "id": "math-8-practice-3-1",
            "text": "12",
            "correct": false
          },
          {
            "id": "math-8-practice-3-2",
            "text": "3",
            "correct": false
          },
          {
            "id": "math-8-practice-3-3",
            "text": "0.25",
            "correct": false
          }
        ],
        "hints": [
          "比例定数はyの増加量÷xの増加量です。",
          "12÷3を計算します。",
          "a=4です。"
        ],
        "explanation": "正解！ a=12÷3=4です。"
      }
    ]
  },
  {
    "step": 9,
    "title": "反比例 y=a/xの性質",
    "narration": [
      "反比例のグラフは双曲線という、原点を通らない滑らかな2本のカーブになります。",
      "xとyの積xyは常に一定の値aになります。",
      "スライダーで比例定数aを変えて、カーブの形がどう変わるか確かめましょう。"
    ],
    "animation": {
      "type": "graph",
      "params": {
        "kind": "inverse",
        "scale": 16
      },
      "controls": [
        {
          "id": "a",
          "label": "比例定数 a",
          "min": -20,
          "max": 20,
          "step": 1,
          "def": 12
        }
      ]
    },
    "check": {
      "id": "math-9-check",
      "label": "確認問題",
      "prompt": "y=12/xのグラフの形として正しいものはどれですか?",
      "options": [
        {
          "id": "math-9-check-0",
          "text": "双曲線(2つのカーブ)",
          "correct": true
        },
        {
          "id": "math-9-check-1",
          "text": "原点を通る直線",
          "correct": false
        },
        {
          "id": "math-9-check-2",
          "text": "放物線",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "反比例のグラフは双曲線と呼ばれる2つのカーブになります。"
    },
    "practice": [
      {
        "id": "math-9-practice-1",
        "label": "基礎",
        "prompt": "yはxに反比例し、x=2のときy=9である。比例定数(xy=a)を求めなさい。",
        "options": [
          {
            "id": "math-9-practice-1-0",
            "text": "18",
            "correct": true
          },
          {
            "id": "math-9-practice-1-1",
            "text": "4.5",
            "correct": false
          },
          {
            "id": "math-9-practice-1-2",
            "text": "11",
            "correct": false
          },
          {
            "id": "math-9-practice-1-3",
            "text": "9",
            "correct": false
          }
        ],
        "hints": [
          "反比例ではxy=aが一定です。",
          "2×9を計算します。",
          "a=18です。"
        ],
        "explanation": "正解！ a=18です。"
      },
      {
        "id": "math-9-practice-2",
        "label": "標準",
        "prompt": "yはxに反比例し、xy=24である。x=6のときのyを求めなさい。",
        "options": [
          {
            "id": "math-9-practice-2-0",
            "text": "4",
            "correct": true
          },
          {
            "id": "math-9-practice-2-1",
            "text": "18",
            "correct": false
          },
          {
            "id": "math-9-practice-2-2",
            "text": "144",
            "correct": false
          },
          {
            "id": "math-9-practice-2-3",
            "text": "30",
            "correct": false
          }
        ],
        "hints": [
          "xy=24を使います。",
          "6×y=24です。",
          "y=24÷6=4です。"
        ],
        "explanation": "正解！ y=4です。"
      },
      {
        "id": "math-9-practice-3",
        "label": "発展",
        "prompt": "yはxに反比例する。x=3のときy=8であるとき、y=6となるxの値を求めなさい。",
        "options": [
          {
            "id": "math-9-practice-3-0",
            "text": "4",
            "correct": true
          },
          {
            "id": "math-9-practice-3-1",
            "text": "2",
            "correct": false
          },
          {
            "id": "math-9-practice-3-2",
            "text": "18",
            "correct": false
          },
          {
            "id": "math-9-practice-3-3",
            "text": "12",
            "correct": false
          }
        ],
        "hints": [
          "まずa=xyを求めます。",
          "a=3×8=24です。",
          "x=24÷6=4です。"
        ],
        "explanation": "正解！ a=24なのでx=4です。"
      }
    ]
  },
  {
    "step": 10,
    "title": "垂直二等分線・角の二等分線の作図",
    "narration": [
      "垂直二等分線上の点は、線分の両端から等しい距離にあります。",
      "角の二等分線上の点は、角をつくる2辺から等しい距離にあります。",
      "コンパスと定規だけを使って正確な図形を作図する技術が「作図」です。"
    ],
    "animation": {
      "type": "shape",
      "params": {
        "kind": "circle",
        "caption": "コンパスを使った作図のイメージ"
      },
      "controls": [
        {
          "id": "s",
          "label": "円の半径",
          "min": 30,
          "max": 90,
          "step": 5,
          "def": 60
        }
      ]
    },
    "check": {
      "id": "math-10-check",
      "label": "確認問題",
      "prompt": "線分の垂直二等分線上の点はどんな性質を持ちますか？",
      "options": [
        {
          "id": "math-10-check-0",
          "text": "線分の両端から等しい距離にある",
          "correct": true
        },
        {
          "id": "math-10-check-1",
          "text": "線分の長さを2倍する",
          "correct": false
        },
        {
          "id": "math-10-check-2",
          "text": "線分と平行になる",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "垂直二等分線上の点は、線分の両端から等しい距離にあります。"
    },
    "practice": [
      {
        "id": "math-10-practice-1",
        "label": "基礎",
        "prompt": "角の二等分線上の点が持つ性質として正しいものはどれですか？",
        "options": [
          {
            "id": "math-10-practice-1-0",
            "text": "角の両辺から等しい距離にある",
            "correct": true
          },
          {
            "id": "math-10-practice-1-1",
            "text": "頂点から最も遠い",
            "correct": false
          },
          {
            "id": "math-10-practice-1-2",
            "text": "常に90度である",
            "correct": false
          }
        ],
        "hints": [
          "「二等分」は角を半分に分けることです。",
          "二等分線上の点から2辺に垂線を引くと長さが等しくなります。",
          "つまり両辺から等距離です。"
        ],
        "explanation": "正解！ 角の両辺から等しい距離にあります。"
      },
      {
        "id": "math-10-practice-2",
        "label": "標準",
        "prompt": "点Pから直線lに下ろした垂線の長さは何を表しますか？",
        "options": [
          {
            "id": "math-10-practice-2-0",
            "text": "点Pと直線lの距離",
            "correct": true
          },
          {
            "id": "math-10-practice-2-1",
            "text": "直線lの長さ",
            "correct": false
          },
          {
            "id": "math-10-practice-2-2",
            "text": "点Pのx座標",
            "correct": false
          }
        ],
        "hints": [
          "「距離」は最短のつなぎ方で考えます。",
          "直線に垂直な線が最短になります。",
          "よって垂線の長さが距離です。"
        ],
        "explanation": "正解！ 点と直線の距離は垂線の長さで表されます。"
      },
      {
        "id": "math-10-practice-3",
        "label": "発展",
        "prompt": "3点A,B,Cから等しい距離にある点の作図方法として正しいものはどれですか？",
        "options": [
          {
            "id": "math-10-practice-3-0",
            "text": "2辺の垂直二等分線の交点を求める",
            "correct": true
          },
          {
            "id": "math-10-practice-3-1",
            "text": "3辺の中点を結ぶ",
            "correct": false
          },
          {
            "id": "math-10-practice-3-2",
            "text": "角の二等分線を1本引く",
            "correct": false
          }
        ],
        "hints": [
          "「等しい距離」は垂直二等分線の性質です。",
          "AB,BCそれぞれの垂直二等分線を考えます。",
          "2本の交点が3点から等距離な点(外心)です。"
        ],
        "explanation": "正解！ 2本の垂直二等分線の交点が外心になります。"
      }
    ]
  },
  {
    "step": 11,
    "title": "いろいろな立体（多面体とオイラーの定理）",
    "narration": [
      "立体は平面だけで囲まれた「多面体」と、曲面を含む立体に分けられます。",
      "角柱・角錐・円柱・円錐・球など、代表的な立体の形を整理しましょう。",
      "多面体では「頂点-辺+面=2」というオイラーの定理が成り立ちます。"
    ],
    "animation": {
      "type": "shape",
      "params": {
        "kind": "polygon",
        "sides": 6,
        "caption": "多面体の見取り図イメージ（六角柱）"
      },
      "controls": [
        {
          "id": "s",
          "label": "大きさ",
          "min": 30,
          "max": 90,
          "step": 5,
          "def": 60
        }
      ]
    },
    "check": {
      "id": "math-11-check",
      "label": "確認問題",
      "prompt": "次のうち、底面が円である立体はどれですか？",
      "options": [
        {
          "id": "math-11-check-0",
          "text": "円柱・円錐",
          "correct": true
        },
        {
          "id": "math-11-check-1",
          "text": "三角柱",
          "correct": false
        },
        {
          "id": "math-11-check-2",
          "text": "立方体",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "円柱・円錐は底面が円の立体です。"
    },
    "practice": [
      {
        "id": "math-11-practice-1",
        "label": "基礎",
        "prompt": "正四面体の面の数はいくつですか？",
        "options": [
          {
            "id": "math-11-practice-1-0",
            "text": "4",
            "correct": true
          },
          {
            "id": "math-11-practice-1-1",
            "text": "6",
            "correct": false
          },
          {
            "id": "math-11-practice-1-2",
            "text": "8",
            "correct": false
          },
          {
            "id": "math-11-practice-1-3",
            "text": "5",
            "correct": false
          }
        ],
        "hints": [
          "正四面体は三角形4枚でできています。",
          "「四面体」という名前がヒントです。",
          "面の数は4です。"
        ],
        "explanation": "正解！ 4面です。"
      },
      {
        "id": "math-11-practice-2",
        "label": "標準",
        "prompt": "六角柱の頂点の数はいくつですか？",
        "options": [
          {
            "id": "math-11-practice-2-0",
            "text": "12",
            "correct": true
          },
          {
            "id": "math-11-practice-2-1",
            "text": "6",
            "correct": false
          },
          {
            "id": "math-11-practice-2-2",
            "text": "18",
            "correct": false
          },
          {
            "id": "math-11-practice-2-3",
            "text": "24",
            "correct": false
          }
        ],
        "hints": [
          "角柱の頂点は底面の頂点×2です。",
          "六角形の頂点は6個です。",
          "6×2=12です。"
        ],
        "explanation": "正解！ 6×2=12個です。"
      },
      {
        "id": "math-11-practice-3",
        "label": "発展",
        "prompt": "オイラーの多面体定理 v-e+f=2 を用いて、辺の数が9、面の数が5である多面体の頂点の数を求めなさい。",
        "options": [
          {
            "id": "math-11-practice-3-0",
            "text": "6",
            "correct": true
          },
          {
            "id": "math-11-practice-3-1",
            "text": "8",
            "correct": false
          },
          {
            "id": "math-11-practice-3-2",
            "text": "4",
            "correct": false
          },
          {
            "id": "math-11-practice-3-3",
            "text": "14",
            "correct": false
          }
        ],
        "hints": [
          "v-e+f=2に数を当てはめます。",
          "v-9+5=2 です。",
          "v=2+9-5=6です。"
        ],
        "explanation": "正解！ v=6です。"
      }
    ]
  },
  {
    "step": 12,
    "title": "円柱・円錐・球の体積と表面積",
    "narration": [
      "円柱の体積は「底面積×高さ」で求められます。",
      "円錐の体積は、同じ底面・高さの円柱の体積の3分の1になります。",
      "球の表面積は4πr²、体積は(4/3)πr³という公式を使います。"
    ],
    "animation": {
      "type": "shape",
      "params": {
        "kind": "circle",
        "caption": "円柱・円錐の底面（半径）"
      },
      "controls": [
        {
          "id": "s",
          "label": "底面の半径",
          "min": 20,
          "max": 90,
          "step": 5,
          "def": 50
        }
      ]
    },
    "check": {
      "id": "math-12-check",
      "label": "確認問題",
      "prompt": "円柱の体積を求める公式はどれですか？",
      "options": [
        {
          "id": "math-12-check-0",
          "text": "底面積×高さ",
          "correct": true
        },
        {
          "id": "math-12-check-1",
          "text": "底面積×高さ÷3",
          "correct": false
        },
        {
          "id": "math-12-check-2",
          "text": "周の長さ×高さ",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "円柱の体積は底面積×高さで求めます。"
    },
    "practice": [
      {
        "id": "math-12-practice-1",
        "label": "基礎",
        "prompt": "底面の半径3cm、高さ5cmの円柱の体積を求めなさい。(πを使う)",
        "options": [
          {
            "id": "math-12-practice-1-0",
            "text": "45π cm³",
            "correct": true
          },
          {
            "id": "math-12-practice-1-1",
            "text": "15π cm³",
            "correct": false
          },
          {
            "id": "math-12-practice-1-2",
            "text": "30π cm³",
            "correct": false
          },
          {
            "id": "math-12-practice-1-3",
            "text": "90π cm³",
            "correct": false
          }
        ],
        "hints": [
          "底面積はπ×3²=9πです。",
          "体積=底面積×高さです。",
          "9π×5=45πです。"
        ],
        "explanation": "正解！ 45π cm³です。"
      },
      {
        "id": "math-12-practice-2",
        "label": "標準",
        "prompt": "底面が半径6cmの円で、高さ10cmの円錐の体積を求めなさい。",
        "options": [
          {
            "id": "math-12-practice-2-0",
            "text": "120π cm³",
            "correct": true
          },
          {
            "id": "math-12-practice-2-1",
            "text": "360π cm³",
            "correct": false
          },
          {
            "id": "math-12-practice-2-2",
            "text": "60π cm³",
            "correct": false
          },
          {
            "id": "math-12-practice-2-3",
            "text": "1080π cm³",
            "correct": false
          }
        ],
        "hints": [
          "円錐は円柱の体積の1/3です。",
          "底面積=π×36=36πです。",
          "36π×10÷3=120πです。"
        ],
        "explanation": "正解！ 120π cm³です。"
      },
      {
        "id": "math-12-practice-3",
        "label": "発展",
        "prompt": "半径6cmの球の表面積を求めなさい。(表面積=4πr²)",
        "options": [
          {
            "id": "math-12-practice-3-0",
            "text": "144π cm²",
            "correct": true
          },
          {
            "id": "math-12-practice-3-1",
            "text": "36π cm²",
            "correct": false
          },
          {
            "id": "math-12-practice-3-2",
            "text": "288π cm²",
            "correct": false
          },
          {
            "id": "math-12-practice-3-3",
            "text": "72π cm²",
            "correct": false
          }
        ],
        "hints": [
          "公式4πr²に6を当てはめます。",
          "r²=36です。",
          "4π×36=144πです。"
        ],
        "explanation": "正解！ 144π cm²です。"
      }
    ]
  },
  {
    "step": 13,
    "title": "ヒストグラムの読み方",
    "narration": [
      "データをいくつかの階級(区間)に分けて、個数(度数)を棒の高さで表したグラフがヒストグラムです。",
      "一番高い棒の階級が、データが最も集中している範囲を表します。",
      "スライダーでデータの個数を変えて、グラフの形の変化を確かめましょう。"
    ],
    "animation": {
      "type": "barData",
      "params": {
        "bars": [
          {
            "label": "60-69",
            "value": 3,
            "color": "#38bdf8"
          },
          {
            "label": "70-79",
            "value": 6,
            "color": "#38bdf8"
          },
          {
            "label": "80-89",
            "value": 4,
            "color": "#38bdf8"
          },
          {
            "label": "90-99",
            "value": 2,
            "color": "#38bdf8"
          }
        ]
      },
      "controls": [
        {
          "id": "adj",
          "label": "90-99点の人数",
          "min": 0,
          "max": 10,
          "step": 1,
          "def": 2
        }
      ]
    },
    "check": {
      "id": "math-13-check",
      "label": "確認問題",
      "prompt": "ヒストグラムの縦軸が表すものはどれですか？",
      "options": [
        {
          "id": "math-13-check-0",
          "text": "度数(個数)",
          "correct": true
        },
        {
          "id": "math-13-check-1",
          "text": "階級値",
          "correct": false
        },
        {
          "id": "math-13-check-2",
          "text": "累積相対度数のみ",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "ヒストグラムの縦軸は各階級の度数(個数)を表します。"
    },
    "practice": [
      {
        "id": "math-13-practice-1",
        "label": "基礎",
        "prompt": "あるクラスの小テストの点数データで、最頻値(モード)とは何ですか？",
        "options": [
          {
            "id": "math-13-practice-1-0",
            "text": "最も多く現れる値",
            "correct": true
          },
          {
            "id": "math-13-practice-1-1",
            "text": "中央の値",
            "correct": false
          },
          {
            "id": "math-13-practice-1-2",
            "text": "平均値",
            "correct": false
          }
        ],
        "hints": [
          "「頻」は「頻度」つまり回数を表します。",
          "最も「頻繁」に出てくる値を探します。",
          "これを最頻値(モード)と言います。"
        ],
        "explanation": "正解！ 最も多く出てくる値が最頻値です。"
      },
      {
        "id": "math-13-practice-2",
        "label": "標準",
        "prompt": "度数分布表で階級の幅が5、階級値が17.5のとき、その階級の範囲はどれですか？",
        "options": [
          {
            "id": "math-13-practice-2-0",
            "text": "15以上20未満",
            "correct": true
          },
          {
            "id": "math-13-practice-2-1",
            "text": "17以上18未満",
            "correct": false
          },
          {
            "id": "math-13-practice-2-2",
            "text": "12.5以上22.5未満",
            "correct": false
          }
        ],
        "hints": [
          "階級値は階級の中央の値です。",
          "幅5の半分2.5を階級値の前後に取ります。",
          "17.5-2.5=15, 17.5+2.5=20です。"
        ],
        "explanation": "正解！ 15以上20未満です。"
      },
      {
        "id": "math-13-practice-3",
        "label": "発展",
        "prompt": "5人のテストの点数が60,70,70,80,90のとき、平均値と最頻値の組み合わせとして正しいものはどれですか？",
        "options": [
          {
            "id": "math-13-practice-3-0",
            "text": "平均74点・最頻値70点",
            "correct": true
          },
          {
            "id": "math-13-practice-3-1",
            "text": "平均70点・最頻値74点",
            "correct": false
          },
          {
            "id": "math-13-practice-3-2",
            "text": "平均74点・最頻値80点",
            "correct": false
          },
          {
            "id": "math-13-practice-3-3",
            "text": "平均80点・最頻値70点",
            "correct": false
          }
        ],
        "hints": [
          "平均は合計を人数で割ります。",
          "合計は370なので370÷5=74です。",
          "最も多く出てくるのは70です。"
        ],
        "explanation": "正解！ 平均74点、最頻値70点です。"
      }
    ]
  },
  {
    "step": 14,
    "title": "代表値（平均値・中央値・最頻値）",
    "narration": [
      "平均値はデータの合計を個数で割った値です。",
      "中央値は、データを大きさの順に並べたときの真ん中の値です。",
      "データの個数が偶数のときは、中央の2つの値の平均が中央値になります。"
    ],
    "animation": {
      "type": "barData",
      "params": {
        "bars": [
          {
            "label": "Aさん",
            "value": 60,
            "color": "#38bdf8"
          },
          {
            "label": "Bさん",
            "value": 75,
            "color": "#38bdf8"
          },
          {
            "label": "Cさん",
            "value": 80,
            "color": "#38bdf8"
          },
          {
            "label": "Dさん",
            "value": 85,
            "color": "#38bdf8"
          },
          {
            "label": "Eさん",
            "value": 90,
            "color": "#38bdf8"
          }
        ]
      },
      "controls": [
        {
          "id": "adj",
          "label": "Eさんの点数",
          "min": 60,
          "max": 100,
          "step": 5,
          "def": 90
        }
      ]
    },
    "check": {
      "id": "math-14-check",
      "label": "確認問題",
      "prompt": "データの中央値(メジアン)の説明として正しいものはどれですか？",
      "options": [
        {
          "id": "math-14-check-0",
          "text": "大きさの順に並べたときの中央の値",
          "correct": true
        },
        {
          "id": "math-14-check-1",
          "text": "最も多く出てくる値",
          "correct": false
        },
        {
          "id": "math-14-check-2",
          "text": "最大値と最小値の平均",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "中央値は大きさの順に並べたときの真ん中の値です。"
    },
    "practice": [
      {
        "id": "math-14-practice-1",
        "label": "基礎",
        "prompt": "データ 3,7,9,10,21 の中央値を求めなさい。",
        "options": [
          {
            "id": "math-14-practice-1-0",
            "text": "9",
            "correct": true
          },
          {
            "id": "math-14-practice-1-1",
            "text": "10",
            "correct": false
          },
          {
            "id": "math-14-practice-1-2",
            "text": "7",
            "correct": false
          },
          {
            "id": "math-14-practice-1-3",
            "text": "10.0",
            "correct": false
          }
        ],
        "hints": [
          "すでに小さい順に並んでいます。",
          "5個のデータの真ん中は3番目です。",
          "3番目の値は9です。"
        ],
        "explanation": "正解！ 中央値は9です。"
      },
      {
        "id": "math-14-practice-2",
        "label": "標準",
        "prompt": "データ 4,8,8,10,15,20 (6個)の中央値を求めなさい。",
        "options": [
          {
            "id": "math-14-practice-2-0",
            "text": "9",
            "correct": true
          },
          {
            "id": "math-14-practice-2-1",
            "text": "8",
            "correct": false
          },
          {
            "id": "math-14-practice-2-2",
            "text": "10",
            "correct": false
          },
          {
            "id": "math-14-practice-2-3",
            "text": "9.5",
            "correct": false
          }
        ],
        "hints": [
          "6個は偶数個なので、中央の2つを使います。",
          "3番目と4番目は8と10です。",
          "(8+10)÷2=9です。"
        ],
        "explanation": "正解！ 中央値は9です。"
      },
      {
        "id": "math-14-practice-3",
        "label": "発展",
        "prompt": "あるデータの範囲(レンジ)が最大値40・最小値12のとき、範囲を求めなさい。",
        "options": [
          {
            "id": "math-14-practice-3-0",
            "text": "28",
            "correct": true
          },
          {
            "id": "math-14-practice-3-1",
            "text": "52",
            "correct": false
          },
          {
            "id": "math-14-practice-3-2",
            "text": "14",
            "correct": false
          },
          {
            "id": "math-14-practice-3-3",
            "text": "40",
            "correct": false
          }
        ],
        "hints": [
          "範囲=最大値-最小値です。",
          "40-12を計算します。",
          "28です。"
        ],
        "explanation": "正解！ 範囲は28です。"
      }
    ]
  },
  {
    "step": 15,
    "title": "単項式・多項式・次数の基礎",
    "narration": [
      "項が1つだけの式を単項式、複数の項の和で表された式を多項式と言います。",
      "次数とは、かけ合わされている文字の個数のことです。",
      "例えば3x²yは次数3の単項式(xが2個、yが1個)です。"
    ],
    "animation": {
      "type": "generic",
      "params": {
        "label": "3x²y → 係数3、次数は 2+1=3"
      },
      "controls": []
    },
    "check": {
      "id": "math-15-check",
      "label": "確認問題",
      "prompt": "単項式と多項式の違いとして正しい説明はどれですか？",
      "options": [
        {
          "id": "math-15-check-0",
          "text": "単項式は項が1つ、多項式は項が複数",
          "correct": true
        },
        {
          "id": "math-15-check-1",
          "text": "単項式は文字を含まない",
          "correct": false
        },
        {
          "id": "math-15-check-2",
          "text": "多項式は必ず次数が2以上",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "単項式は項が1つ、多項式は複数の項の和です。"
    },
    "practice": [
      {
        "id": "math-15-practice-1",
        "label": "基礎",
        "prompt": "3x²yの次数を答えなさい。",
        "options": [
          {
            "id": "math-15-practice-1-0",
            "text": "3",
            "correct": true
          },
          {
            "id": "math-15-practice-1-1",
            "text": "2",
            "correct": false
          },
          {
            "id": "math-15-practice-1-2",
            "text": "1",
            "correct": false
          },
          {
            "id": "math-15-practice-1-3",
            "text": "6",
            "correct": false
          }
        ],
        "hints": [
          "xが2個、yが1個かけ合わされています。",
          "次数はかけ合わされた文字の個数の合計です。",
          "2+1=3です。"
        ],
        "explanation": "正解！ 次数は3です。"
      },
      {
        "id": "math-15-practice-2",
        "label": "標準",
        "prompt": "多項式 2x²-3x+5 の次数と項の数を答えなさい。",
        "options": [
          {
            "id": "math-15-practice-2-0",
            "text": "次数2・項3つ",
            "correct": true
          },
          {
            "id": "math-15-practice-2-1",
            "text": "次数3・項2つ",
            "correct": false
          },
          {
            "id": "math-15-practice-2-2",
            "text": "次数2・項2つ",
            "correct": false
          },
          {
            "id": "math-15-practice-2-3",
            "text": "次数1・項3つ",
            "correct": false
          }
        ],
        "hints": [
          "最も高い次数の項を探します。",
          "2x²が次数2で最高です。",
          "項は2x², -3x, 5の3つです。"
        ],
        "explanation": "正解！ 次数2・項3つです。"
      },
      {
        "id": "math-15-practice-3",
        "label": "発展",
        "prompt": "単項式 -4x³y² の係数と次数を答えなさい。",
        "options": [
          {
            "id": "math-15-practice-3-0",
            "text": "係数-4・次数5",
            "correct": true
          },
          {
            "id": "math-15-practice-3-1",
            "text": "係数4・次数5",
            "correct": false
          },
          {
            "id": "math-15-practice-3-2",
            "text": "係数-4・次数6",
            "correct": false
          },
          {
            "id": "math-15-practice-3-3",
            "text": "係数-4・次数3",
            "correct": false
          }
        ],
        "hints": [
          "係数は数字の部分(符号も含む)です。",
          "次数はxの個数3とyの個数2の合計です。",
          "3+2=5です。"
        ],
        "explanation": "正解！ 係数-4・次数5です。"
      }
    ]
  },
  {
    "step": 16,
    "title": "文字式を使った整数の証明",
    "narration": [
      "「連続する整数」はnとn+1のように文字で表すと一般的に扱えます。",
      "文字式で変形して「2の倍数」や「3の倍数」の形に整理すると性質が証明できます。",
      "10の倍数を表すときは10a+bのように十の位・一の位に分けて考えます。"
    ],
    "animation": {
      "type": "integerGrid",
      "params": {
        "rangeMax": 30,
        "rule": "multiple"
      },
      "controls": [
        {
          "id": "n",
          "label": "何の倍数?",
          "min": 2,
          "max": 9,
          "step": 1,
          "def": 3
        }
      ]
    },
    "check": {
      "id": "math-16-check",
      "label": "確認問題",
      "prompt": "2つの連続する整数の和はどんな数になりますか？",
      "options": [
        {
          "id": "math-16-check-0",
          "text": "必ず奇数になる",
          "correct": true
        },
        {
          "id": "math-16-check-1",
          "text": "必ず偶数になる",
          "correct": false
        },
        {
          "id": "math-16-check-2",
          "text": "必ず3の倍数になる",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "n+(n+1)=2n+1となり、必ず奇数になります。"
    },
    "practice": [
      {
        "id": "math-16-practice-1",
        "label": "基礎",
        "prompt": "連続する2つの整数のうち小さい方をnとするとき、その和を文字式で表しなさい。",
        "options": [
          {
            "id": "math-16-practice-1-0",
            "text": "2n+1",
            "correct": true
          },
          {
            "id": "math-16-practice-1-1",
            "text": "2n",
            "correct": false
          },
          {
            "id": "math-16-practice-1-2",
            "text": "n+1",
            "correct": false
          },
          {
            "id": "math-16-practice-1-3",
            "text": "2n-1",
            "correct": false
          }
        ],
        "hints": [
          "大きい方はn+1です。",
          "n+(n+1)を計算します。",
          "2n+1になります。"
        ],
        "explanation": "正解！ 2n+1です。"
      },
      {
        "id": "math-16-practice-2",
        "label": "標準",
        "prompt": "連続する3つの整数の和が3の倍数になることを示すとき、中央の整数をnとした式はどれですか？",
        "options": [
          {
            "id": "math-16-practice-2-0",
            "text": "3n",
            "correct": true
          },
          {
            "id": "math-16-practice-2-1",
            "text": "3n+1",
            "correct": false
          },
          {
            "id": "math-16-practice-2-2",
            "text": "n³",
            "correct": false
          },
          {
            "id": "math-16-practice-2-3",
            "text": "3n-1",
            "correct": false
          }
        ],
        "hints": [
          "3つの整数はn-1,n,n+1と表せます。",
          "これらを足します。",
          "(n-1)+n+(n+1)=3nです。"
        ],
        "explanation": "正解！ 3nとなり3の倍数です。"
      },
      {
        "id": "math-16-practice-3",
        "label": "発展",
        "prompt": "2桁の整数(十の位a、一の位b、10a+b)と、十の位と一の位を入れ替えた整数の和が11の倍数になることを示す過程で正しいものはどれですか？",
        "options": [
          {
            "id": "math-16-practice-3-0",
            "text": "11(a+b)となり11の倍数",
            "correct": true
          },
          {
            "id": "math-16-practice-3-1",
            "text": "10(a+b)となり10の倍数",
            "correct": false
          },
          {
            "id": "math-16-practice-3-2",
            "text": "11a+bとなり必ず11の倍数ではない",
            "correct": false
          },
          {
            "id": "math-16-practice-3-3",
            "text": "(a+b)²となる",
            "correct": false
          }
        ],
        "hints": [
          "入れ替えた数は10b+aと表せます。",
          "(10a+b)+(10b+a)を計算します。",
          "11a+11b=11(a+b)になります。"
        ],
        "explanation": "正解！ 11(a+b)となり11の倍数です。"
      }
    ]
  },
  {
    "step": 17,
    "title": "加減法・代入法で解く連立方程式",
    "narration": [
      "2つの式を足すか引くことで、1つの文字を消す方法が加減法です。",
      "どちらかの式をもう一方に代入して文字を消す方法が代入法です。",
      "文字を1つ消したら、残りはこれまでの1次方程式と同じ手順で解けます。"
    ],
    "animation": {
      "type": "balance",
      "params": {
        "leftExpr": "x+y",
        "rightExpr": "7"
      },
      "controls": [
        {
          "id": "tilt",
          "label": "つり合いの傾き",
          "min": -1,
          "max": 1,
          "step": 0.1,
          "def": 0
        }
      ]
    },
    "check": {
      "id": "math-17-check",
      "label": "確認問題",
      "prompt": "連立方程式を加減法で解くときの基本操作はどれですか？",
      "options": [
        {
          "id": "math-17-check-0",
          "text": "片方の文字の係数をそろえて足すか引く",
          "correct": true
        },
        {
          "id": "math-17-check-1",
          "text": "両方の式をそのまま掛け合わせる",
          "correct": false
        },
        {
          "id": "math-17-check-2",
          "text": "片方の式を無視する",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "係数をそろえて足し引きすることで1つの文字を消すのが加減法です。"
    },
    "practice": [
      {
        "id": "math-17-practice-1",
        "label": "基礎",
        "prompt": "x+y=7, x-y=3 を解きなさい。",
        "options": [
          {
            "id": "math-17-practice-1-0",
            "text": "x=5,y=2",
            "correct": true
          },
          {
            "id": "math-17-practice-1-1",
            "text": "x=2,y=5",
            "correct": false
          },
          {
            "id": "math-17-practice-1-2",
            "text": "x=4,y=3",
            "correct": false
          },
          {
            "id": "math-17-practice-1-3",
            "text": "x=7,y=0",
            "correct": false
          }
        ],
        "hints": [
          "2つの式を足すとyが消えます。",
          "2x=10になります。",
          "x=5、これをx+y=7に入れるとy=2です。"
        ],
        "explanation": "正解！ x=5, y=2です。"
      },
      {
        "id": "math-17-practice-2",
        "label": "標準",
        "prompt": "2x+y=8, x+y=5 を解きなさい。",
        "options": [
          {
            "id": "math-17-practice-2-0",
            "text": "x=3,y=2",
            "correct": true
          },
          {
            "id": "math-17-practice-2-1",
            "text": "x=2,y=3",
            "correct": false
          },
          {
            "id": "math-17-practice-2-2",
            "text": "x=4,y=0",
            "correct": false
          },
          {
            "id": "math-17-practice-2-3",
            "text": "x=1,y=4",
            "correct": false
          }
        ],
        "hints": [
          "2つの式を引くとyが消えます。",
          "(2x+y)-(x+y)=8-5よりx=3です。",
          "x+y=5にx=3を入れるとy=2です。"
        ],
        "explanation": "正解！ x=3, y=2です。"
      },
      {
        "id": "math-17-practice-3",
        "label": "発展",
        "prompt": "3x+2y=16, 2x+3y=19 を解きなさい。",
        "options": [
          {
            "id": "math-17-practice-3-0",
            "text": "x=2,y=5",
            "correct": true
          },
          {
            "id": "math-17-practice-3-1",
            "text": "x=5,y=2",
            "correct": false
          },
          {
            "id": "math-17-practice-3-2",
            "text": "x=4,y=2",
            "correct": false
          },
          {
            "id": "math-17-practice-3-3",
            "text": "x=2,y=4",
            "correct": false
          }
        ],
        "hints": [
          "1つ目の式を3倍、2つ目の式を2倍してyの係数を揃えます。",
          "9x+6y=48, 4x+6y=38となり引くと5x=10です。",
          "x=2、3x+2y=16に入れてy=5です。"
        ],
        "explanation": "正解！ x=2, y=5です。"
      }
    ]
  },
  {
    "step": 18,
    "title": "連立方程式で文章題を解く（鶴亀算など）",
    "narration": [
      "2つの未知数がある文章題では、2つの文字(x,yなど)を使って式を2本立てます。",
      "「個数の関係」と「合計(金額や足の数など)の関係」をそれぞれ式にします。",
      "2本の式を連立方程式として解けば、両方の未知数が求まります。"
    ],
    "animation": {
      "type": "balance",
      "params": {
        "leftExpr": "合計金額",
        "rightExpr": "920円"
      },
      "controls": [
        {
          "id": "tilt",
          "label": "つり合いの傾き",
          "min": -1,
          "max": 1,
          "step": 0.1,
          "def": 0
        }
      ]
    },
    "check": {
      "id": "math-18-check",
      "label": "確認問題",
      "prompt": "鶴亀算のように2つの数量が関係する文章題を解くコツはどれですか？",
      "options": [
        {
          "id": "math-18-check-0",
          "text": "「個数の関係」と「合計の関係」の2本の式を立てる",
          "correct": true
        },
        {
          "id": "math-18-check-1",
          "text": "1本の式だけで必ず解ける",
          "correct": false
        },
        {
          "id": "math-18-check-2",
          "text": "式を立てずに暗算する",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "2つの関係式を連立方程式にして解くのが基本です。"
    },
    "practice": [
      {
        "id": "math-18-practice-1",
        "label": "基礎",
        "prompt": "鶴と亀が合計10匹いて、足の数が合計28本である。鶴(足2本)と亀(足4本)の数を求めなさい。",
        "options": [
          {
            "id": "math-18-practice-1-0",
            "text": "鶴6羽・亀4匹",
            "correct": true
          },
          {
            "id": "math-18-practice-1-1",
            "text": "鶴4羽・亀6匹",
            "correct": false
          },
          {
            "id": "math-18-practice-1-2",
            "text": "鶴5羽・亀5匹",
            "correct": false
          },
          {
            "id": "math-18-practice-1-3",
            "text": "鶴8羽・亀2匹",
            "correct": false
          }
        ],
        "hints": [
          "鶴をx羽、亀をy匹とするとx+y=10です。",
          "足の数は2x+4y=28です。",
          "2式を解くとx=6, y=4です。"
        ],
        "explanation": "正解！ 鶴6羽・亀4匹です。"
      },
      {
        "id": "math-18-practice-2",
        "label": "標準",
        "prompt": "1個120円のりんごと1個80円のみかんを合計10個買って合計920円だった。りんごの個数を求めなさい。",
        "options": [
          {
            "id": "math-18-practice-2-0",
            "text": "3個",
            "correct": true
          },
          {
            "id": "math-18-practice-2-1",
            "text": "5個",
            "correct": false
          },
          {
            "id": "math-18-practice-2-2",
            "text": "7個",
            "correct": false
          },
          {
            "id": "math-18-practice-2-3",
            "text": "4個",
            "correct": false
          }
        ],
        "hints": [
          "りんごx個、みかん(10-x)個とします。",
          "120x+80(10-x)=920を解きます。",
          "40x=120よりx=3です。"
        ],
        "explanation": "正解！ りんご3個です。"
      },
      {
        "id": "math-18-practice-3",
        "label": "発展",
        "prompt": "A地点からB地点まで、行きは時速4km、帰りは時速6kmで歩いたところ、往復で5時間かかった。A-B間の距離を求めなさい。",
        "options": [
          {
            "id": "math-18-practice-3-0",
            "text": "12km",
            "correct": true
          },
          {
            "id": "math-18-practice-3-1",
            "text": "10km",
            "correct": false
          },
          {
            "id": "math-18-practice-3-2",
            "text": "15km",
            "correct": false
          },
          {
            "id": "math-18-practice-3-3",
            "text": "20km",
            "correct": false
          }
        ],
        "hints": [
          "距離をdkmとすると、行きの時間はd/4、帰りはd/6です。",
          "d/4+d/6=5を解きます。",
          "分母を12にそろえると5d=60、d=12です。"
        ],
        "explanation": "正解！ 12kmです。"
      }
    ]
  },
  {
    "step": 19,
    "title": "1次関数 y=ax+b の基礎",
    "narration": [
      "1次関数y=ax+bのaは「変化の割合(傾き)」、bは「切片」を表します。",
      "傾きaは、xが1増えるとyがいくつ変化するかを表します。",
      "スライダーでa,bを変えて、グラフの傾きと位置がどう変わるか確かめましょう。"
    ],
    "animation": {
      "type": "graph",
      "params": {
        "kind": "linear",
        "scale": 16
      },
      "controls": [
        {
          "id": "a",
          "label": "傾き a",
          "min": -5,
          "max": 5,
          "step": 1,
          "def": 3
        },
        {
          "id": "b",
          "label": "切片 b",
          "min": -5,
          "max": 5,
          "step": 1,
          "def": -2
        }
      ]
    },
    "check": {
      "id": "math-19-check",
      "label": "確認問題",
      "prompt": "1次関数y=ax+bのaは何を表しますか？",
      "options": [
        {
          "id": "math-19-check-0",
          "text": "変化の割合(傾き)",
          "correct": true
        },
        {
          "id": "math-19-check-1",
          "text": "y軸との交点",
          "correct": false
        },
        {
          "id": "math-19-check-2",
          "text": "x軸との交点",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "aは変化の割合(傾き)を表します。"
    },
    "practice": [
      {
        "id": "math-19-practice-1",
        "label": "基礎",
        "prompt": "y=3x-2のとき、xが2増えるとyはいくつ増えますか？",
        "options": [
          {
            "id": "math-19-practice-1-0",
            "text": "6",
            "correct": true
          },
          {
            "id": "math-19-practice-1-1",
            "text": "3",
            "correct": false
          },
          {
            "id": "math-19-practice-1-2",
            "text": "2",
            "correct": false
          },
          {
            "id": "math-19-practice-1-3",
            "text": "5",
            "correct": false
          }
        ],
        "hints": [
          "yの増加量=傾き×xの増加量です。",
          "傾きは3です。",
          "3×2=6です。"
        ],
        "explanation": "正解！ 6増えます。"
      },
      {
        "id": "math-19-practice-2",
        "label": "標準",
        "prompt": "1次関数y=-2x+5の切片を答えなさい。",
        "options": [
          {
            "id": "math-19-practice-2-0",
            "text": "5",
            "correct": true
          },
          {
            "id": "math-19-practice-2-1",
            "text": "-2",
            "correct": false
          },
          {
            "id": "math-19-practice-2-2",
            "text": "2",
            "correct": false
          },
          {
            "id": "math-19-practice-2-3",
            "text": "-5",
            "correct": false
          }
        ],
        "hints": [
          "切片はbの値です。",
          "y=ax+bの形を確認します。",
          "bは5です。"
        ],
        "explanation": "正解！ 切片は5です。"
      },
      {
        "id": "math-19-practice-3",
        "label": "発展",
        "prompt": "1次関数で、x=1のときy=4、x=3のときy=10である。この関数の式を求めなさい。",
        "options": [
          {
            "id": "math-19-practice-3-0",
            "text": "y=3x+1",
            "correct": true
          },
          {
            "id": "math-19-practice-3-1",
            "text": "y=3x+4",
            "correct": false
          },
          {
            "id": "math-19-practice-3-2",
            "text": "y=2x+2",
            "correct": false
          },
          {
            "id": "math-19-practice-3-3",
            "text": "y=3x-1",
            "correct": false
          }
        ],
        "hints": [
          "傾き=yの増加量÷xの増加量です。",
          "(10-4)÷(3-1)=3です。",
          "y=3x+bにx=1,y=4を入れるとb=1です。"
        ],
        "explanation": "正解！ y=3x+1です。"
      }
    ]
  },
  {
    "step": 20,
    "title": "通る点から1次関数の式を求める",
    "narration": [
      "通る2点が分かれば、傾きと切片の両方を求めることができます。",
      "傾きは「yの増加量÷xの増加量」で計算します。",
      "傾きが分かったら、1点の座標を代入してbを求めます。"
    ],
    "animation": {
      "type": "graph",
      "params": {
        "kind": "linear",
        "scale": 16
      },
      "controls": [
        {
          "id": "a",
          "label": "傾き a",
          "min": -5,
          "max": 5,
          "step": 1,
          "def": 2
        },
        {
          "id": "b",
          "label": "切片 b",
          "min": -5,
          "max": 5,
          "step": 1,
          "def": 3
        }
      ]
    },
    "check": {
      "id": "math-20-check",
      "label": "確認問題",
      "prompt": "1次関数の式を求めるために最低限必要な情報はどれですか？",
      "options": [
        {
          "id": "math-20-check-0",
          "text": "通る2点の座標、または傾きと1点",
          "correct": true
        },
        {
          "id": "math-20-check-1",
          "text": "x軸との交点だけ",
          "correct": false
        },
        {
          "id": "math-20-check-2",
          "text": "yの値1つだけ",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "2点の座標、または傾きと1点があれば式を求められます。"
    },
    "practice": [
      {
        "id": "math-20-practice-1",
        "label": "基礎",
        "prompt": "傾きが2で点(1,5)を通る1次関数の式を求めなさい。",
        "options": [
          {
            "id": "math-20-practice-1-0",
            "text": "y=2x+3",
            "correct": true
          },
          {
            "id": "math-20-practice-1-1",
            "text": "y=2x+5",
            "correct": false
          },
          {
            "id": "math-20-practice-1-2",
            "text": "y=2x-3",
            "correct": false
          },
          {
            "id": "math-20-practice-1-3",
            "text": "y=5x+2",
            "correct": false
          }
        ],
        "hints": [
          "y=2x+bに(1,5)を代入します。",
          "5=2×1+bです。",
          "b=3なのでy=2x+3です。"
        ],
        "explanation": "正解！ y=2x+3です。"
      },
      {
        "id": "math-20-practice-2",
        "label": "標準",
        "prompt": "2点(0,-3)と(4,5)を通る1次関数の式を求めなさい。",
        "options": [
          {
            "id": "math-20-practice-2-0",
            "text": "y=2x-3",
            "correct": true
          },
          {
            "id": "math-20-practice-2-1",
            "text": "y=2x+3",
            "correct": false
          },
          {
            "id": "math-20-practice-2-2",
            "text": "y=-2x-3",
            "correct": false
          },
          {
            "id": "math-20-practice-2-3",
            "text": "y=8x-3",
            "correct": false
          }
        ],
        "hints": [
          "傾き=(5-(-3))÷(4-0)です。",
          "8÷4=2です。",
          "x=0のときy=-3なので切片は-3です。"
        ],
        "explanation": "正解！ y=2x-3です。"
      },
      {
        "id": "math-20-practice-3",
        "label": "発展",
        "prompt": "1次関数y=ax+bが点(2,1)と点(-1,7)を通るとき、aとbの値を求めなさい。",
        "options": [
          {
            "id": "math-20-practice-3-0",
            "text": "a=-2,b=5",
            "correct": true
          },
          {
            "id": "math-20-practice-3-1",
            "text": "a=2,b=5",
            "correct": false
          },
          {
            "id": "math-20-practice-3-2",
            "text": "a=-2,b=-5",
            "correct": false
          },
          {
            "id": "math-20-practice-3-3",
            "text": "a=2,b=-3",
            "correct": false
          }
        ],
        "hints": [
          "傾き=(7-1)÷(-1-2)を計算します。",
          "6÷(-3)=-2です。",
          "1=-2×2+bよりb=5です。"
        ],
        "explanation": "正解！ a=-2, b=5です。"
      }
    ]
  },
  {
    "step": 21,
    "title": "2直線の交点と連立方程式",
    "narration": [
      "2つの1次関数のグラフの交点は、両方の式が同時に成り立つ点です。",
      "つまり交点の座標は、2つの式を連立方程式として解くことで求められます。",
      "グラフとグラフの交点を見れば、連立方程式の解を視覚的に確認できます。"
    ],
    "animation": {
      "type": "graph",
      "params": {
        "kind": "linear",
        "scale": 16
      },
      "controls": [
        {
          "id": "a",
          "label": "傾き a",
          "min": -5,
          "max": 5,
          "step": 1,
          "def": 1
        },
        {
          "id": "b",
          "label": "切片 b",
          "min": -5,
          "max": 5,
          "step": 1,
          "def": 1
        }
      ]
    },
    "check": {
      "id": "math-21-check",
      "label": "確認問題",
      "prompt": "2直線の交点の座標は、2つの式を連立方程式として解くことで求められる。これは正しいですか？",
      "options": [
        {
          "id": "math-21-check-0",
          "text": "正しい",
          "correct": true
        },
        {
          "id": "math-21-check-1",
          "text": "誤り",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "交点では2つの式が両方成り立つので、連立方程式として解けます。"
    },
    "practice": [
      {
        "id": "math-21-practice-1",
        "label": "基礎",
        "prompt": "直線y=x+1とy=-x+5の交点のx座標を求めなさい。",
        "options": [
          {
            "id": "math-21-practice-1-0",
            "text": "x=2",
            "correct": true
          },
          {
            "id": "math-21-practice-1-1",
            "text": "x=4",
            "correct": false
          },
          {
            "id": "math-21-practice-1-2",
            "text": "x=1",
            "correct": false
          },
          {
            "id": "math-21-practice-1-3",
            "text": "x=3",
            "correct": false
          }
        ],
        "hints": [
          "2つの式のyが等しいとおきます。",
          "x+1=-x+5です。",
          "2x=4よりx=2です。"
        ],
        "explanation": "正解！ x=2です。"
      },
      {
        "id": "math-21-practice-2",
        "label": "標準",
        "prompt": "y=2x-1のグラフとx軸の交点の座標を求めなさい。",
        "options": [
          {
            "id": "math-21-practice-2-0",
            "text": "(0.5, 0)",
            "correct": true
          },
          {
            "id": "math-21-practice-2-1",
            "text": "(0, -1)",
            "correct": false
          },
          {
            "id": "math-21-practice-2-2",
            "text": "(1, 1)",
            "correct": false
          },
          {
            "id": "math-21-practice-2-3",
            "text": "(-0.5, 0)",
            "correct": false
          }
        ],
        "hints": [
          "x軸上ではy=0です。",
          "0=2x-1を解きます。",
          "x=0.5です。"
        ],
        "explanation": "正解！ (0.5, 0)です。"
      },
      {
        "id": "math-21-practice-3",
        "label": "発展",
        "prompt": "直線y=ax+3とy=2x-1が点(2,k)で交わるとき、aとkの値を求めなさい。",
        "options": [
          {
            "id": "math-21-practice-3-0",
            "text": "a=0,k=3",
            "correct": true
          },
          {
            "id": "math-21-practice-3-1",
            "text": "a=2,k=3",
            "correct": false
          },
          {
            "id": "math-21-practice-3-2",
            "text": "a=1,k=5",
            "correct": false
          },
          {
            "id": "math-21-practice-3-3",
            "text": "a=0,k=5",
            "correct": false
          }
        ],
        "hints": [
          "まずy=2x-1にx=2を入れてkを求めます。",
          "k=2×2-1=3です。",
          "3=2a+3よりa=0です。"
        ],
        "explanation": "正解！ a=0, k=3です。"
      }
    ]
  },
  {
    "step": 22,
    "title": "1次関数を使った文章題（水槽・移動など）",
    "narration": [
      "時間とともに一定の割合で増減する量は、1次関数y=ax+bで表せます。",
      "bは「はじめの量」、aは「1分あたりの変化量」を表すことが多いです。",
      "グラフや式ができたら、特定のyの値になるxを方程式として解きます。"
    ],
    "animation": {
      "type": "graph",
      "params": {
        "kind": "linear",
        "scale": 16
      },
      "controls": [
        {
          "id": "a",
          "label": "1分あたりの変化 a",
          "min": 0,
          "max": 10,
          "step": 1,
          "def": 3
        },
        {
          "id": "b",
          "label": "はじめの量 b",
          "min": 0,
          "max": 20,
          "step": 1,
          "def": 10
        }
      ]
    },
    "check": {
      "id": "math-22-check",
      "label": "確認問題",
      "prompt": "時間とともに一定の割合で変化する量を表すのに適した関数はどれですか？",
      "options": [
        {
          "id": "math-22-check-0",
          "text": "1次関数",
          "correct": true
        },
        {
          "id": "math-22-check-1",
          "text": "反比例",
          "correct": false
        },
        {
          "id": "math-22-check-2",
          "text": "y=ax²の関数",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "一定の割合で変化する量は1次関数で表せます。"
    },
    "practice": [
      {
        "id": "math-22-practice-1",
        "label": "基礎",
        "prompt": "水槽に毎分3Lずつ水を入れる。はじめに10L入っていた。x分後の水量yLを式で表しなさい。",
        "options": [
          {
            "id": "math-22-practice-1-0",
            "text": "y=3x+10",
            "correct": true
          },
          {
            "id": "math-22-practice-1-1",
            "text": "y=10x+3",
            "correct": false
          },
          {
            "id": "math-22-practice-1-2",
            "text": "y=3x",
            "correct": false
          },
          {
            "id": "math-22-practice-1-3",
            "text": "y=13x",
            "correct": false
          }
        ],
        "hints": [
          "はじめの量が切片になります。",
          "1分あたりの変化が傾きになります。",
          "y=3x+10です。"
        ],
        "explanation": "正解！ y=3x+10です。"
      },
      {
        "id": "math-22-practice-2",
        "label": "標準",
        "prompt": "上の水槽が70Lになるのは何分後か求めなさい。",
        "options": [
          {
            "id": "math-22-practice-2-0",
            "text": "20分後",
            "correct": true
          },
          {
            "id": "math-22-practice-2-1",
            "text": "13分後",
            "correct": false
          },
          {
            "id": "math-22-practice-2-2",
            "text": "25分後",
            "correct": false
          },
          {
            "id": "math-22-practice-2-3",
            "text": "18分後",
            "correct": false
          }
        ],
        "hints": [
          "y=3x+10に70を当てはめます。",
          "70=3x+10です。",
          "3x=60よりx=20です。"
        ],
        "explanation": "正解！ 20分後です。"
      },
      {
        "id": "math-22-practice-3",
        "label": "発展",
        "prompt": "A君は家から学校まで一定の速さで歩く。出発してx分後の進んだ距離をymとすると、y=80xの関係がある。学校までの距離が2000mのとき、家を出て何分後に学校に着くか求めなさい。",
        "options": [
          {
            "id": "math-22-practice-3-0",
            "text": "25分後",
            "correct": true
          },
          {
            "id": "math-22-practice-3-1",
            "text": "20分後",
            "correct": false
          },
          {
            "id": "math-22-practice-3-2",
            "text": "30分後",
            "correct": false
          },
          {
            "id": "math-22-practice-3-3",
            "text": "16分後",
            "correct": false
          }
        ],
        "hints": [
          "y=80xに2000を当てはめます。",
          "2000=80xです。",
          "x=2000÷80=25です。"
        ],
        "explanation": "正解！ 25分後です。"
      }
    ]
  },
  {
    "step": 23,
    "title": "同位角・錯角・対頂角の性質",
    "narration": [
      "2本の平行線に1本の直線が交わるとき、同じ位置にできる角を「同位角」と呼び、常に等しくなります。",
      "平行線の内側で斜め向きにできる角を「錯角」と呼び、これも常に等しくなります。",
      "対頂角(向かい合う角)も、交わる直線が平行でなくても常に等しくなります。"
    ],
    "animation": {
      "type": "shape",
      "params": {
        "kind": "parallelogram",
        "caption": "平行線と角のイメージ"
      },
      "controls": [
        {
          "id": "s",
          "label": "大きさ",
          "min": 30,
          "max": 90,
          "step": 5,
          "def": 60
        }
      ]
    },
    "check": {
      "id": "math-23-check",
      "label": "確認問題",
      "prompt": "平行線が1つの直線に交わるとき、同位角はどうなりますか？",
      "options": [
        {
          "id": "math-23-check-0",
          "text": "等しくなる",
          "correct": true
        },
        {
          "id": "math-23-check-1",
          "text": "足して180度になる",
          "correct": false
        },
        {
          "id": "math-23-check-2",
          "text": "必ず90度になる",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "平行線の同位角は常に等しくなります。"
    },
    "practice": [
      {
        "id": "math-23-practice-1",
        "label": "基礎",
        "prompt": "平行線に1本の直線が交わるとき、錯角の関係にある角は？",
        "options": [
          {
            "id": "math-23-practice-1-0",
            "text": "等しい",
            "correct": true
          },
          {
            "id": "math-23-practice-1-1",
            "text": "補角の関係",
            "correct": false
          },
          {
            "id": "math-23-practice-1-2",
            "text": "常に異なる",
            "correct": false
          }
        ],
        "hints": [
          "錯角は平行線の内側で斜めにできる角です。",
          "平行線の性質として覚えましょう。",
          "錯角は等しくなります。"
        ],
        "explanation": "正解！ 錯角は等しくなります。"
      },
      {
        "id": "math-23-practice-2",
        "label": "標準",
        "prompt": "同側内角(同旁内角)の和はどうなりますか？",
        "options": [
          {
            "id": "math-23-practice-2-0",
            "text": "180度になる",
            "correct": true
          },
          {
            "id": "math-23-practice-2-1",
            "text": "90度になる",
            "correct": false
          },
          {
            "id": "math-23-practice-2-2",
            "text": "等しくなる",
            "correct": false
          }
        ],
        "hints": [
          "同側内角は平行線の内側、同じ側にできる角です。",
          "同位角と足して180度の関係にあります。",
          "よって和は180度です。"
        ],
        "explanation": "正解！ 180度になります。"
      },
      {
        "id": "math-23-practice-3",
        "label": "発展",
        "prompt": "平行な2直線ℓ,mに1直線が交わり、ℓ側の角が65度のとき、同位角にあたるm側の角の大きさを求めなさい。",
        "options": [
          {
            "id": "math-23-practice-3-0",
            "text": "65度",
            "correct": true
          },
          {
            "id": "math-23-practice-3-1",
            "text": "115度",
            "correct": false
          },
          {
            "id": "math-23-practice-3-2",
            "text": "25度",
            "correct": false
          },
          {
            "id": "math-23-practice-3-3",
            "text": "155度",
            "correct": false
          }
        ],
        "hints": [
          "同位角は平行線なら等しくなります。",
          "ℓ側が65度です。",
          "よってm側の同位角も65度です。"
        ],
        "explanation": "正解！ 65度です。"
      }
    ]
  },
  {
    "step": 24,
    "title": "多角形の内角の和・外角の和",
    "narration": [
      "n角形の内角の和は(n-2)×180度という公式で求められます。",
      "多角形の外角の和は、辺の数に関係なくいつも360度になります。",
      "スライダーで多角形の辺の数を変えて、形の変化を確かめましょう。"
    ],
    "animation": {
      "type": "shape",
      "params": {
        "kind": "polygon",
        "sides": 5,
        "caption": "多角形の内角・外角"
      },
      "controls": [
        {
          "id": "sides",
          "label": "辺の数",
          "min": 3,
          "max": 10,
          "step": 1,
          "def": 5
        },
        {
          "id": "s",
          "label": "大きさ",
          "min": 40,
          "max": 80,
          "step": 5,
          "def": 60
        }
      ]
    },
    "check": {
      "id": "math-24-check",
      "label": "確認問題",
      "prompt": "多角形の外角の和は常にいくらですか？",
      "options": [
        {
          "id": "math-24-check-0",
          "text": "360度",
          "correct": true
        },
        {
          "id": "math-24-check-1",
          "text": "180度",
          "correct": false
        },
        {
          "id": "math-24-check-2",
          "text": "辺の数による",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "多角形の外角の和は辺の数に関わらず常に360度です。"
    },
    "practice": [
      {
        "id": "math-24-practice-1",
        "label": "基礎",
        "prompt": "五角形の内角の和を求めなさい。",
        "options": [
          {
            "id": "math-24-practice-1-0",
            "text": "540度",
            "correct": true
          },
          {
            "id": "math-24-practice-1-1",
            "text": "360度",
            "correct": false
          },
          {
            "id": "math-24-practice-1-2",
            "text": "720度",
            "correct": false
          },
          {
            "id": "math-24-practice-1-3",
            "text": "450度",
            "correct": false
          }
        ],
        "hints": [
          "公式(n-2)×180を使います。",
          "n=5なので(5-2)×180です。",
          "3×180=540です。"
        ],
        "explanation": "正解！ 540度です。"
      },
      {
        "id": "math-24-practice-2",
        "label": "標準",
        "prompt": "正八角形の1つの内角の大きさを求めなさい。",
        "options": [
          {
            "id": "math-24-practice-2-0",
            "text": "135度",
            "correct": true
          },
          {
            "id": "math-24-practice-2-1",
            "text": "120度",
            "correct": false
          },
          {
            "id": "math-24-practice-2-2",
            "text": "144度",
            "correct": false
          },
          {
            "id": "math-24-practice-2-3",
            "text": "150度",
            "correct": false
          }
        ],
        "hints": [
          "まず内角の和を求めます。(8-2)×180=1080です。",
          "正八角形なので8等分します。",
          "1080÷8=135です。"
        ],
        "explanation": "正解！ 135度です。"
      },
      {
        "id": "math-24-practice-3",
        "label": "発展",
        "prompt": "内角の和が1440度である多角形は何角形か求めなさい。",
        "options": [
          {
            "id": "math-24-practice-3-0",
            "text": "十角形",
            "correct": true
          },
          {
            "id": "math-24-practice-3-1",
            "text": "九角形",
            "correct": false
          },
          {
            "id": "math-24-practice-3-2",
            "text": "十二角形",
            "correct": false
          },
          {
            "id": "math-24-practice-3-3",
            "text": "八角形",
            "correct": false
          }
        ],
        "hints": [
          "(n-2)×180=1440とおきます。",
          "n-2=8になります。",
          "n=10です。"
        ],
        "explanation": "正解！ 十角形です。"
      }
    ]
  },
  {
    "step": 25,
    "title": "三角形の合同条件(SSS・SAS・ASA)",
    "narration": [
      "3辺がそれぞれ等しいとき(SSS)、2つの三角形は合同になります。",
      "2辺とその間の角がそれぞれ等しいとき(SAS)も合同になります。",
      "1辺とその両端の角がそれぞれ等しいとき(ASA)も合同になります。"
    ],
    "animation": {
      "type": "shape",
      "params": {
        "kind": "triangle",
        "caption": "三角形の合同条件のイメージ"
      },
      "controls": [
        {
          "id": "s",
          "label": "大きさ",
          "min": 30,
          "max": 90,
          "step": 5,
          "def": 60
        }
      ]
    },
    "check": {
      "id": "math-25-check",
      "label": "確認問題",
      "prompt": "三角形の合同条件のうち、「3辺がそれぞれ等しい」ものを何といいますか？",
      "options": [
        {
          "id": "math-25-check-0",
          "text": "3辺相等(SSS)",
          "correct": true
        },
        {
          "id": "math-25-check-1",
          "text": "2辺夾角相等(SAS)",
          "correct": false
        },
        {
          "id": "math-25-check-2",
          "text": "1辺両端角相等(ASA)",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "3辺がそれぞれ等しい条件はSSS(3辺相等)です。"
    },
    "practice": [
      {
        "id": "math-25-practice-1",
        "label": "基礎",
        "prompt": "2辺とその間の角がそれぞれ等しいとき成り立つ合同条件はどれですか？",
        "options": [
          {
            "id": "math-25-practice-1-0",
            "text": "2辺夾角相等(SAS)",
            "correct": true
          },
          {
            "id": "math-25-practice-1-1",
            "text": "3辺相等(SSS)",
            "correct": false
          },
          {
            "id": "math-25-practice-1-2",
            "text": "1辺両端角相等(ASA)",
            "correct": false
          }
        ],
        "hints": [
          "「間の角」がヒントです。",
          "2辺とその間の角です。",
          "SAS(2辺夾角相等)です。"
        ],
        "explanation": "正解！ SASです。"
      },
      {
        "id": "math-25-practice-2",
        "label": "標準",
        "prompt": "合同な図形において対応する角はどうなりますか？",
        "options": [
          {
            "id": "math-25-practice-2-0",
            "text": "それぞれ等しい",
            "correct": true
          },
          {
            "id": "math-25-practice-2-1",
            "text": "必ず異なる",
            "correct": false
          },
          {
            "id": "math-25-practice-2-2",
            "text": "足して180度になる",
            "correct": false
          }
        ],
        "hints": [
          "合同とは「全く同じ形」という意味です。",
          "対応する辺も角もすべて等しくなります。",
          "よって角も等しいです。"
        ],
        "explanation": "正解！ 対応する角は等しくなります。"
      },
      {
        "id": "math-25-practice-3",
        "label": "発展",
        "prompt": "△ABCと△DEFにおいて、AB=DE, BC=EF, ∠B=∠Eが成り立つとき、この2つの三角形が合同であると言える条件はどれですか？",
        "options": [
          {
            "id": "math-25-practice-3-0",
            "text": "2辺夾角相等(SAS)により合同",
            "correct": true
          },
          {
            "id": "math-25-practice-3-1",
            "text": "3辺相等(SSS)により合同",
            "correct": false
          },
          {
            "id": "math-25-practice-3-2",
            "text": "条件不足で合同と言えない",
            "correct": false
          }
        ],
        "hints": [
          "AB=DE, BC=EFは2辺の情報です。",
          "∠B=∠Eはその間の角です。",
          "2辺夾角相等(SAS)に当たります。"
        ],
        "explanation": "正解！ SASにより合同です。"
      }
    ]
  },
  {
    "step": 26,
    "title": "平行四辺形の性質",
    "narration": [
      "平行四辺形の対角線は、互いの中点で交わります。",
      "平行四辺形の対角(向かい合う角)は、それぞれ等しくなります。",
      "隣り合う角の和は常に180度になります。"
    ],
    "animation": {
      "type": "shape",
      "params": {
        "kind": "parallelogram",
        "caption": "平行四辺形の性質（対角線・対角）"
      },
      "controls": [
        {
          "id": "s",
          "label": "大きさ",
          "min": 30,
          "max": 90,
          "step": 5,
          "def": 60
        }
      ]
    },
    "check": {
      "id": "math-26-check",
      "label": "確認問題",
      "prompt": "平行四辺形の対角線はどのような性質を持ちますか？",
      "options": [
        {
          "id": "math-26-check-0",
          "text": "互いの中点で交わる",
          "correct": true
        },
        {
          "id": "math-26-check-1",
          "text": "常に直角に交わる",
          "correct": false
        },
        {
          "id": "math-26-check-2",
          "text": "長さが必ず等しい",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "平行四辺形の対角線は互いの中点で交わります。"
    },
    "practice": [
      {
        "id": "math-26-practice-1",
        "label": "基礎",
        "prompt": "平行四辺形の対角はどうなりますか？",
        "options": [
          {
            "id": "math-26-practice-1-0",
            "text": "等しい",
            "correct": true
          },
          {
            "id": "math-26-practice-1-1",
            "text": "足して90度",
            "correct": false
          },
          {
            "id": "math-26-practice-1-2",
            "text": "常に直角",
            "correct": false
          }
        ],
        "hints": [
          "対角とは向かい合う角です。",
          "平行四辺形の性質の1つです。",
          "対角は等しくなります。"
        ],
        "explanation": "正解！ 対角は等しくなります。"
      },
      {
        "id": "math-26-practice-2",
        "label": "標準",
        "prompt": "平行四辺形の隣り合う角の和はいくらですか？",
        "options": [
          {
            "id": "math-26-practice-2-0",
            "text": "180度",
            "correct": true
          },
          {
            "id": "math-26-practice-2-1",
            "text": "90度",
            "correct": false
          },
          {
            "id": "math-26-practice-2-2",
            "text": "360度",
            "correct": false
          }
        ],
        "hints": [
          "隣り合う角は平行線の同側内角の関係です。",
          "同側内角の和は180度です。",
          "よって180度です。"
        ],
        "explanation": "正解！ 180度です。"
      },
      {
        "id": "math-26-practice-3",
        "label": "発展",
        "prompt": "長方形が平行四辺形の特別な形であると言える理由として正しいものはどれですか？",
        "options": [
          {
            "id": "math-26-practice-3-0",
            "text": "4つの角がすべて90度の平行四辺形だから",
            "correct": true
          },
          {
            "id": "math-26-practice-3-1",
            "text": "対角線の長さが異なるから",
            "correct": false
          },
          {
            "id": "math-26-practice-3-2",
            "text": "辺の長さがすべて等しいから",
            "correct": false
          }
        ],
        "hints": [
          "長方形も対辺が平行で等しいという平行四辺形の性質を満たします。",
          "さらに角がすべて90度という条件が加わります。",
          "よって平行四辺形の特別な形です。"
        ],
        "explanation": "正解！ 角がすべて90度の平行四辺形です。"
      }
    ]
  },
  {
    "step": 27,
    "title": "確率の求め方",
    "narration": [
      "確率は「求める場合の数 ÷ すべての場合の数」で求められます。",
      "すべての場合を整理するには、表や樹形図を使うと分かりやすいです。",
      "さいころやコインなど、身近な例で確率の考え方を練習しましょう。"
    ],
    "animation": {
      "type": "barData",
      "params": {
        "bars": [
          {
            "label": "表",
            "value": 1,
            "color": "#38bdf8"
          },
          {
            "label": "裏",
            "value": 1,
            "color": "#f59e0b"
          }
        ]
      },
      "controls": []
    },
    "check": {
      "id": "math-27-check",
      "label": "確認問題",
      "prompt": "さいころを1回投げて3の倍数が出る確率はどれですか？",
      "options": [
        {
          "id": "math-27-check-0",
          "text": "1/3",
          "correct": true
        },
        {
          "id": "math-27-check-1",
          "text": "1/6",
          "correct": false
        },
        {
          "id": "math-27-check-2",
          "text": "1/2",
          "correct": false
        },
        {
          "id": "math-27-check-3",
          "text": "2/3",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "3の倍数は3,6の2通りなので2/6=1/3です。"
    },
    "practice": [
      {
        "id": "math-27-practice-1",
        "label": "基礎",
        "prompt": "コインを1回投げて表が出る確率を求めなさい。",
        "options": [
          {
            "id": "math-27-practice-1-0",
            "text": "1/2",
            "correct": true
          },
          {
            "id": "math-27-practice-1-1",
            "text": "1",
            "correct": false
          },
          {
            "id": "math-27-practice-1-2",
            "text": "0",
            "correct": false
          },
          {
            "id": "math-27-practice-1-3",
            "text": "1/4",
            "correct": false
          }
        ],
        "hints": [
          "表裏の2通りがあります。",
          "表は1通りです。",
          "1/2です。"
        ],
        "explanation": "正解！ 1/2です。"
      },
      {
        "id": "math-27-practice-2",
        "label": "標準",
        "prompt": "2枚のコインを同時に投げたとき、両方とも表になる確率を求めなさい。",
        "options": [
          {
            "id": "math-27-practice-2-0",
            "text": "1/4",
            "correct": true
          },
          {
            "id": "math-27-practice-2-1",
            "text": "1/2",
            "correct": false
          },
          {
            "id": "math-27-practice-2-2",
            "text": "3/4",
            "correct": false
          },
          {
            "id": "math-27-practice-2-3",
            "text": "1/3",
            "correct": false
          }
        ],
        "hints": [
          "全体の場合は表表,表裏,裏表,裏裏の4通りです。",
          "両方とも表は1通りです。",
          "1/4です。"
        ],
        "explanation": "正解！ 1/4です。"
      },
      {
        "id": "math-27-practice-3",
        "label": "発展",
        "prompt": "大小2つのさいころを同時に投げるとき、出た目の和が8になる確率を求めなさい。",
        "options": [
          {
            "id": "math-27-practice-3-0",
            "text": "5/36",
            "correct": true
          },
          {
            "id": "math-27-practice-3-1",
            "text": "1/6",
            "correct": false
          },
          {
            "id": "math-27-practice-3-2",
            "text": "1/9",
            "correct": false
          },
          {
            "id": "math-27-practice-3-3",
            "text": "7/36",
            "correct": false
          }
        ],
        "hints": [
          "全体の場合は6×6=36通りです。",
          "和が8になる組は(2,6)(3,5)(4,4)(5,3)(6,2)の5通りです。",
          "5/36です。"
        ],
        "explanation": "正解！ 5/36です。"
      }
    ]
  },
  {
    "step": 28,
    "title": "多項式×多項式の展開",
    "narration": [
      "(x+a)(x+b)の展開は、面積図で4つのパーツに分けて考えると直感的に理解できます。",
      "展開すると x²+(a+b)x+ab という形になります。",
      "スライダーでa,bの大きさを変えて、各パーツの面積の変化を確かめましょう。"
    ],
    "animation": {
      "type": "areaModel",
      "params": {
        "mode": "sum"
      },
      "controls": [
        {
          "id": "a",
          "label": "長さ a",
          "min": 40,
          "max": 100,
          "step": 5,
          "def": 70
        },
        {
          "id": "b",
          "label": "長さ b",
          "min": 20,
          "max": 80,
          "step": 5,
          "def": 40
        }
      ]
    },
    "check": {
      "id": "math-28-check",
      "label": "確認問題",
      "prompt": "(x+2)(x+3)を展開した結果はどれですか？",
      "options": [
        {
          "id": "math-28-check-0",
          "text": "x²+5x+6",
          "correct": true
        },
        {
          "id": "math-28-check-1",
          "text": "x²+6x+5",
          "correct": false
        },
        {
          "id": "math-28-check-2",
          "text": "x²+5",
          "correct": false
        },
        {
          "id": "math-28-check-3",
          "text": "x²+x+6",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "(x+2)(x+3)=x²+(2+3)x+2×3=x²+5x+6です。"
    },
    "practice": [
      {
        "id": "math-28-practice-1",
        "label": "基礎",
        "prompt": "(x+4)(x+1)を展開しなさい。",
        "options": [
          {
            "id": "math-28-practice-1-0",
            "text": "x²+5x+4",
            "correct": true
          },
          {
            "id": "math-28-practice-1-1",
            "text": "x²+4x+5",
            "correct": false
          },
          {
            "id": "math-28-practice-1-2",
            "text": "x²+5",
            "correct": false
          },
          {
            "id": "math-28-practice-1-3",
            "text": "x²+4",
            "correct": false
          }
        ],
        "hints": [
          "(x+a)(x+b)=x²+(a+b)x+abの形を使います。",
          "a=4,b=1なのでa+b=5, ab=4です。",
          "x²+5x+4です。"
        ],
        "explanation": "正解！ x²+5x+4です。"
      },
      {
        "id": "math-28-practice-2",
        "label": "標準",
        "prompt": "(2x+1)(x+3)を展開しなさい。",
        "options": [
          {
            "id": "math-28-practice-2-0",
            "text": "2x²+7x+3",
            "correct": true
          },
          {
            "id": "math-28-practice-2-1",
            "text": "2x²+6x+3",
            "correct": false
          },
          {
            "id": "math-28-practice-2-2",
            "text": "2x²+7x+4",
            "correct": false
          },
          {
            "id": "math-28-practice-2-3",
            "text": "x²+7x+3",
            "correct": false
          }
        ],
        "hints": [
          "各項をすべてかけ合わせます。",
          "2x×x+2x×3+1×x+1×3です。",
          "2x²+6x+x+3=2x²+7x+3です。"
        ],
        "explanation": "正解！ 2x²+7x+3です。"
      },
      {
        "id": "math-28-practice-3",
        "label": "発展",
        "prompt": "(x+y)(x-y+2)を展開しなさい。",
        "options": [
          {
            "id": "math-28-practice-3-0",
            "text": "x²+2x-y²+2y",
            "correct": true
          },
          {
            "id": "math-28-practice-3-1",
            "text": "x²-2xy-y²",
            "correct": false
          },
          {
            "id": "math-28-practice-3-2",
            "text": "x²+2x+y²+2y",
            "correct": false
          },
          {
            "id": "math-28-practice-3-3",
            "text": "x²-y²+2x-2y",
            "correct": false
          }
        ],
        "hints": [
          "xとyを分配してすべての項をかけます。",
          "x²-xy+2x+xy-y²+2yになります。",
          "-xyと+xyが打ち消し合い、x²+2x-y²+2yです。"
        ],
        "explanation": "正解！ x²+2x-y²+2yです。"
      }
    ]
  },
  {
    "step": 29,
    "title": "乗法公式(a+b)²・(a-b)²・(a+b)(a-b)",
    "narration": [
      "(a+b)²=a²+2ab+b²は、面積図でa²,ab,ab,b²の4つのパーツに分けて確認できます。",
      "(a-b)²=a²-2ab+b²も同じ考え方で理解できます。",
      "(a+b)(a-b)=a²-b²は「和と差の積」と呼ばれる重要な公式です。"
    ],
    "animation": {
      "type": "areaModel",
      "params": {
        "mode": "sum"
      },
      "controls": [
        {
          "id": "a",
          "label": "長さ a",
          "min": 40,
          "max": 100,
          "step": 5,
          "def": 70
        },
        {
          "id": "b",
          "label": "長さ b",
          "min": 20,
          "max": 80,
          "step": 5,
          "def": 30
        }
      ]
    },
    "check": {
      "id": "math-29-check",
      "label": "確認問題",
      "prompt": "(a+b)²を展開した公式はどれですか？",
      "options": [
        {
          "id": "math-29-check-0",
          "text": "a²+2ab+b²",
          "correct": true
        },
        {
          "id": "math-29-check-1",
          "text": "a²+b²",
          "correct": false
        },
        {
          "id": "math-29-check-2",
          "text": "a²+ab+b²",
          "correct": false
        },
        {
          "id": "math-29-check-3",
          "text": "a²-2ab+b²",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "(a+b)²=a²+2ab+b²です。"
    },
    "practice": [
      {
        "id": "math-29-practice-1",
        "label": "基礎",
        "prompt": "(x+5)²を展開しなさい。",
        "options": [
          {
            "id": "math-29-practice-1-0",
            "text": "x²+10x+25",
            "correct": true
          },
          {
            "id": "math-29-practice-1-1",
            "text": "x²+25",
            "correct": false
          },
          {
            "id": "math-29-practice-1-2",
            "text": "x²+5x+25",
            "correct": false
          },
          {
            "id": "math-29-practice-1-3",
            "text": "x²+10x+5",
            "correct": false
          }
        ],
        "hints": [
          "(a+b)²=a²+2ab+b²を使います。",
          "a=x,b=5なので2ab=10xです。",
          "x²+10x+25です。"
        ],
        "explanation": "正解！ x²+10x+25です。"
      },
      {
        "id": "math-29-practice-2",
        "label": "標準",
        "prompt": "(x-7)²を展開しなさい。",
        "options": [
          {
            "id": "math-29-practice-2-0",
            "text": "x²-14x+49",
            "correct": true
          },
          {
            "id": "math-29-practice-2-1",
            "text": "x²-49",
            "correct": false
          },
          {
            "id": "math-29-practice-2-2",
            "text": "x²-7x+49",
            "correct": false
          },
          {
            "id": "math-29-practice-2-3",
            "text": "x²+14x+49",
            "correct": false
          }
        ],
        "hints": [
          "(a-b)²=a²-2ab+b²を使います。",
          "2ab=14x、b²=49です。",
          "x²-14x+49です。"
        ],
        "explanation": "正解！ x²-14x+49です。"
      },
      {
        "id": "math-29-practice-3",
        "label": "発展",
        "prompt": "(x+6)(x-6)を展開しなさい。",
        "options": [
          {
            "id": "math-29-practice-3-0",
            "text": "x²-36",
            "correct": true
          },
          {
            "id": "math-29-practice-3-1",
            "text": "x²+36",
            "correct": false
          },
          {
            "id": "math-29-practice-3-2",
            "text": "x²-12x+36",
            "correct": false
          },
          {
            "id": "math-29-practice-3-3",
            "text": "x²-6x-36",
            "correct": false
          }
        ],
        "hints": [
          "(a+b)(a-b)=a²-b²を使います。",
          "a=x,b=6です。",
          "x²-36です。"
        ],
        "explanation": "正解！ x²-36です。"
      }
    ]
  },
  {
    "step": 30,
    "title": "因数分解の基本（たすき掛けと平方の見分け）",
    "narration": [
      "因数分解は展開の逆操作で、多項式を因数の積の形に直すことです。",
      "x²+px+qの形は、積がq・和がpになる2数を見つけて(x+a)(x+b)にします。",
      "面積図を逆から見ることで、因数分解のイメージをつかみましょう。"
    ],
    "animation": {
      "type": "areaModel",
      "params": {
        "mode": "diff"
      },
      "controls": [
        {
          "id": "a",
          "label": "大きい正方形の辺 a",
          "min": 60,
          "max": 110,
          "step": 5,
          "def": 90
        },
        {
          "id": "b",
          "label": "切り取る正方形の辺 b",
          "min": 10,
          "max": 50,
          "step": 5,
          "def": 30
        }
      ]
    },
    "check": {
      "id": "math-30-check",
      "label": "確認問題",
      "prompt": "因数分解とは何をすることですか？",
      "options": [
        {
          "id": "math-30-check-0",
          "text": "多項式をいくつかの因数の積の形に表す",
          "correct": true
        },
        {
          "id": "math-30-check-1",
          "text": "式を展開して1つの多項式にする",
          "correct": false
        },
        {
          "id": "math-30-check-2",
          "text": "方程式を解くこと",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "因数分解は展開の逆で、積の形に表すことです。"
    },
    "practice": [
      {
        "id": "math-30-practice-1",
        "label": "基礎",
        "prompt": "x²+7x+12を因数分解しなさい。",
        "options": [
          {
            "id": "math-30-practice-1-0",
            "text": "(x+3)(x+4)",
            "correct": true
          },
          {
            "id": "math-30-practice-1-1",
            "text": "(x+2)(x+6)",
            "correct": false
          },
          {
            "id": "math-30-practice-1-2",
            "text": "(x+1)(x+12)",
            "correct": false
          },
          {
            "id": "math-30-practice-1-3",
            "text": "(x+4)(x+4)",
            "correct": false
          }
        ],
        "hints": [
          "積が12、和が7になる2数を探します。",
          "3と4です(3×4=12, 3+4=7)。",
          "(x+3)(x+4)です。"
        ],
        "explanation": "正解！ (x+3)(x+4)です。"
      },
      {
        "id": "math-30-practice-2",
        "label": "標準",
        "prompt": "x²-9を因数分解しなさい。",
        "options": [
          {
            "id": "math-30-practice-2-0",
            "text": "(x+3)(x-3)",
            "correct": true
          },
          {
            "id": "math-30-practice-2-1",
            "text": "(x-3)(x-3)",
            "correct": false
          },
          {
            "id": "math-30-practice-2-2",
            "text": "(x+9)(x-1)",
            "correct": false
          },
          {
            "id": "math-30-practice-2-3",
            "text": "(x+3)²",
            "correct": false
          }
        ],
        "hints": [
          "9=3²なので平方の差の形です。",
          "a²-b²=(a+b)(a-b)を使います。",
          "(x+3)(x-3)です。"
        ],
        "explanation": "正解！ (x+3)(x-3)です。"
      },
      {
        "id": "math-30-practice-3",
        "label": "発展",
        "prompt": "x²-6x+9を因数分解しなさい。",
        "options": [
          {
            "id": "math-30-practice-3-0",
            "text": "(x-3)²",
            "correct": true
          },
          {
            "id": "math-30-practice-3-1",
            "text": "(x+3)²",
            "correct": false
          },
          {
            "id": "math-30-practice-3-2",
            "text": "(x-9)(x+1)",
            "correct": false
          },
          {
            "id": "math-30-practice-3-3",
            "text": "(x-1)(x-9)",
            "correct": false
          }
        ],
        "hints": [
          "積が9、和が-6になる2数を探します。",
          "-3と-3です((-3)×(-3)=9, -3+-3=-6)。",
          "(x-3)²です。"
        ],
        "explanation": "正解！ (x-3)²です。"
      }
    ]
  },
  {
    "step": 31,
    "title": "共通因数をくくり出す因数分解",
    "narration": [
      "すべての項に共通する文字や数を見つけて、まず外にくくり出します。",
      "共通因数をくくり出した後、残りの式がさらに因数分解できるか確認します。",
      "複雑な式ほど「まず共通因数」を意識すると計算がシンプルになります。"
    ],
    "animation": {
      "type": "areaModel",
      "params": {
        "mode": "sum"
      },
      "controls": [
        {
          "id": "a",
          "label": "長さ a",
          "min": 40,
          "max": 100,
          "step": 5,
          "def": 60
        },
        {
          "id": "b",
          "label": "長さ b",
          "min": 20,
          "max": 80,
          "step": 5,
          "def": 30
        }
      ]
    },
    "check": {
      "id": "math-31-check",
      "label": "確認問題",
      "prompt": "2x²+8xを因数分解するとき、最初に取り出すべきものはどれですか？",
      "options": [
        {
          "id": "math-31-check-0",
          "text": "共通因数 2x",
          "correct": true
        },
        {
          "id": "math-31-check-1",
          "text": "共通因数 x²",
          "correct": false
        },
        {
          "id": "math-31-check-2",
          "text": "共通因数 8",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "2x²と8xに共通する2xをまずくくり出します。"
    },
    "practice": [
      {
        "id": "math-31-practice-1",
        "label": "基礎",
        "prompt": "3x²-12xを因数分解しなさい。",
        "options": [
          {
            "id": "math-31-practice-1-0",
            "text": "3x(x-4)",
            "correct": true
          },
          {
            "id": "math-31-practice-1-1",
            "text": "3x(x+4)",
            "correct": false
          },
          {
            "id": "math-31-practice-1-2",
            "text": "x(3x-12)",
            "correct": false
          },
          {
            "id": "math-31-practice-1-3",
            "text": "3(x²-4x)のまま",
            "correct": false
          }
        ],
        "hints": [
          "3x²と12xの共通因数を探します。",
          "共通因数は3xです。",
          "3x(x-4)です。"
        ],
        "explanation": "正解！ 3x(x-4)です。"
      },
      {
        "id": "math-31-practice-2",
        "label": "標準",
        "prompt": "x²-2x-15を因数分解しなさい。",
        "options": [
          {
            "id": "math-31-practice-2-0",
            "text": "(x-5)(x+3)",
            "correct": true
          },
          {
            "id": "math-31-practice-2-1",
            "text": "(x+5)(x-3)",
            "correct": false
          },
          {
            "id": "math-31-practice-2-2",
            "text": "(x-15)(x+1)",
            "correct": false
          },
          {
            "id": "math-31-practice-2-3",
            "text": "(x-1)(x+15)",
            "correct": false
          }
        ],
        "hints": [
          "積が-15、和が-2になる2数を探します。",
          "-5と3です(-5×3=-15, -5+3=-2)。",
          "(x-5)(x+3)です。"
        ],
        "explanation": "正解！ (x-5)(x+3)です。"
      },
      {
        "id": "math-31-practice-3",
        "label": "発展",
        "prompt": "ax²-aを因数分解した結果として正しいものはどれですか？(a≠0)",
        "options": [
          {
            "id": "math-31-practice-3-0",
            "text": "a(x+1)(x-1)",
            "correct": true
          },
          {
            "id": "math-31-practice-3-1",
            "text": "a(x-1)²",
            "correct": false
          },
          {
            "id": "math-31-practice-3-2",
            "text": "(ax+1)(ax-1)",
            "correct": false
          },
          {
            "id": "math-31-practice-3-3",
            "text": "a(x+1)²",
            "correct": false
          }
        ],
        "hints": [
          "まず共通因数aをくくり出します。",
          "a(x²-1)になります。",
          "x²-1はさらに(x+1)(x-1)に因数分解できます。"
        ],
        "explanation": "正解！ a(x+1)(x-1)です。"
      }
    ]
  },
  {
    "step": 32,
    "title": "平方根の意味と近似値",
    "narration": [
      "2乗するとaになる数をaの平方根と呼びます。aが正の数のとき、平方根は√aと-√aの2つあり、√aは正の平方根を表します。",
      "√2や√3のように整数にならない平方根は「無理数」と呼ばれます。",
      "スライダーで数直線上の点を動かし、√の近似値の感覚をつかみましょう。"
    ],
    "animation": {
      "type": "numberLine",
      "params": {
        "min": 0,
        "max": 10,
        "pointLabel": "√a ≈"
      },
      "controls": [
        {
          "id": "p",
          "label": "√の近似値",
          "min": 0,
          "max": 10,
          "step": 0.1,
          "def": 3
        }
      ]
    },
    "check": {
      "id": "math-32-check",
      "label": "確認問題",
      "prompt": "√16の値はいくつですか？",
      "options": [
        {
          "id": "math-32-check-0",
          "text": "4",
          "correct": true
        },
        {
          "id": "math-32-check-1",
          "text": "8",
          "correct": false
        },
        {
          "id": "math-32-check-2",
          "text": "±4",
          "correct": false
        },
        {
          "id": "math-32-check-3",
          "text": "2",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "4²=16なので√16=4です。"
    },
    "practice": [
      {
        "id": "math-32-practice-1",
        "label": "基礎",
        "prompt": "√49の値を求めなさい。",
        "options": [
          {
            "id": "math-32-practice-1-0",
            "text": "7",
            "correct": true
          },
          {
            "id": "math-32-practice-1-1",
            "text": "49",
            "correct": false
          },
          {
            "id": "math-32-practice-1-2",
            "text": "±7",
            "correct": false
          },
          {
            "id": "math-32-practice-1-3",
            "text": "14",
            "correct": false
          }
        ],
        "hints": [
          "7²はいくつか考えます。",
          "7×7=49です。",
          "√49=7です。"
        ],
        "explanation": "正解！ 7です。"
      },
      {
        "id": "math-32-practice-2",
        "label": "標準",
        "prompt": "√2の近似値はどれですか？(小数第2位まで)",
        "options": [
          {
            "id": "math-32-practice-2-0",
            "text": "約1.41",
            "correct": true
          },
          {
            "id": "math-32-practice-2-1",
            "text": "約1.21",
            "correct": false
          },
          {
            "id": "math-32-practice-2-2",
            "text": "約2.00",
            "correct": false
          },
          {
            "id": "math-32-practice-2-3",
            "text": "約1.73",
            "correct": false
          }
        ],
        "hints": [
          "1.4²=1.96、1.5²=2.25であることを確認します。",
          "1.41²=1.9881で2に近いです。",
          "約1.41が正解です。"
        ],
        "explanation": "正解！ √2≈1.41です。"
      },
      {
        "id": "math-32-practice-3",
        "label": "発展",
        "prompt": "√50を、根号の中の数ができるだけ小さい整数になる形に変形しなさい。",
        "options": [
          {
            "id": "math-32-practice-3-0",
            "text": "5√2",
            "correct": true
          },
          {
            "id": "math-32-practice-3-1",
            "text": "2√5",
            "correct": false
          },
          {
            "id": "math-32-practice-3-2",
            "text": "10√5",
            "correct": false
          },
          {
            "id": "math-32-practice-3-3",
            "text": "25√2",
            "correct": false
          }
        ],
        "hints": [
          "50を平方数×残りの数に分けます。",
          "50=25×2です。",
          "√25×√2=5√2です。"
        ],
        "explanation": "正解！ 5√2です。"
      }
    ]
  },
  {
    "step": 33,
    "title": "平方根の四則計算",
    "narration": [
      "√a×√b=√(ab)、√a÷√b=√(a/b)という計算規則があります。",
      "根号の中の数字が同じ項(同類の根号)は、足し算・引き算ができます。",
      "異なる根号どうしは、まず簡単な形に変形してから計算しましょう。"
    ],
    "animation": {
      "type": "numberLine",
      "params": {
        "min": 0,
        "max": 10,
        "pointLabel": "計算結果"
      },
      "controls": [
        {
          "id": "p",
          "label": "計算結果の近似値",
          "min": 0,
          "max": 10,
          "step": 0.1,
          "def": 2.4
        }
      ]
    },
    "check": {
      "id": "math-33-check",
      "label": "確認問題",
      "prompt": "√2×√3の計算結果はどれですか？",
      "options": [
        {
          "id": "math-33-check-0",
          "text": "√6",
          "correct": true
        },
        {
          "id": "math-33-check-1",
          "text": "√5",
          "correct": false
        },
        {
          "id": "math-33-check-2",
          "text": "6",
          "correct": false
        },
        {
          "id": "math-33-check-3",
          "text": "√2+√3のまま",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "√a×√b=√(ab)なので√2×√3=√6です。"
    },
    "practice": [
      {
        "id": "math-33-practice-1",
        "label": "基礎",
        "prompt": "√8を最も簡単な形に変形しなさい。",
        "options": [
          {
            "id": "math-33-practice-1-0",
            "text": "2√2",
            "correct": true
          },
          {
            "id": "math-33-practice-1-1",
            "text": "4√2",
            "correct": false
          },
          {
            "id": "math-33-practice-1-2",
            "text": "2√4",
            "correct": false
          },
          {
            "id": "math-33-practice-1-3",
            "text": "8",
            "correct": false
          }
        ],
        "hints": [
          "8=4×2に分けます。",
          "√4×√2=2√2です。",
          "2√2が正解です。"
        ],
        "explanation": "正解！ 2√2です。"
      },
      {
        "id": "math-33-practice-2",
        "label": "標準",
        "prompt": "3√2+5√2を計算しなさい。",
        "options": [
          {
            "id": "math-33-practice-2-0",
            "text": "8√2",
            "correct": true
          },
          {
            "id": "math-33-practice-2-1",
            "text": "15√2",
            "correct": false
          },
          {
            "id": "math-33-practice-2-2",
            "text": "8√4",
            "correct": false
          },
          {
            "id": "math-33-practice-2-3",
            "text": "2√15",
            "correct": false
          }
        ],
        "hints": [
          "同じ根号√2の項なので係数だけ足せます。",
          "3+5=8です。",
          "8√2です。"
        ],
        "explanation": "正解！ 8√2です。"
      },
      {
        "id": "math-33-practice-3",
        "label": "発展",
        "prompt": "(√3+√2)(√3-√2)を計算しなさい。",
        "options": [
          {
            "id": "math-33-practice-3-0",
            "text": "1",
            "correct": true
          },
          {
            "id": "math-33-practice-3-1",
            "text": "5",
            "correct": false
          },
          {
            "id": "math-33-practice-3-2",
            "text": "√1",
            "correct": false
          },
          {
            "id": "math-33-practice-3-3",
            "text": "-1",
            "correct": false
          }
        ],
        "hints": [
          "(a+b)(a-b)=a²-b²の形です。",
          "(√3)²-(√2)²=3-2です。",
          "1です。"
        ],
        "explanation": "正解！ 1です。"
      }
    ]
  },
  {
    "step": 34,
    "title": "因数分解・解の公式による2次方程式",
    "narration": [
      "2次方程式は因数分解できる場合、(x-a)(x-b)=0の形にしてx=a,bを求めます。",
      "因数分解できない場合は、解の公式 x=(-b±√(b²-4ac))/(2a) を使います。",
      "どちらの方法を使うかは、まず因数分解を試してから判断しましょう。"
    ],
    "animation": {
      "type": "balance",
      "params": {
        "leftExpr": "x²-5x+6",
        "rightExpr": "0"
      },
      "controls": [
        {
          "id": "tilt",
          "label": "つり合いの傾き",
          "min": -1,
          "max": 1,
          "step": 0.1,
          "def": 0
        }
      ]
    },
    "check": {
      "id": "math-34-check",
      "label": "確認問題",
      "prompt": "2次方程式 x²-5x+6=0 の解はどれですか？",
      "options": [
        {
          "id": "math-34-check-0",
          "text": "x=2, 3",
          "correct": true
        },
        {
          "id": "math-34-check-1",
          "text": "x=-2,-3",
          "correct": false
        },
        {
          "id": "math-34-check-2",
          "text": "x=1, 6",
          "correct": false
        },
        {
          "id": "math-34-check-3",
          "text": "x=5, 6",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "(x-2)(x-3)=0なのでx=2,3です。"
    },
    "practice": [
      {
        "id": "math-34-practice-1",
        "label": "基礎",
        "prompt": "x²-9=0を解きなさい。",
        "options": [
          {
            "id": "math-34-practice-1-0",
            "text": "x=±3",
            "correct": true
          },
          {
            "id": "math-34-practice-1-1",
            "text": "x=9",
            "correct": false
          },
          {
            "id": "math-34-practice-1-2",
            "text": "x=3のみ",
            "correct": false
          },
          {
            "id": "math-34-practice-1-3",
            "text": "x=-9",
            "correct": false
          }
        ],
        "hints": [
          "x²=9の形に直します。",
          "9の平方根を考えます。",
          "x=±3です。"
        ],
        "explanation": "正解！ x=±3です。"
      },
      {
        "id": "math-34-practice-2",
        "label": "標準",
        "prompt": "x²+2x-8=0を解きなさい。",
        "options": [
          {
            "id": "math-34-practice-2-0",
            "text": "x=-4, 2",
            "correct": true
          },
          {
            "id": "math-34-practice-2-1",
            "text": "x=4, -2",
            "correct": false
          },
          {
            "id": "math-34-practice-2-2",
            "text": "x=-4, -2",
            "correct": false
          },
          {
            "id": "math-34-practice-2-3",
            "text": "x=4, 2",
            "correct": false
          }
        ],
        "hints": [
          "積が-8、和が2になる2数を探します。",
          "4と-2です(4×(-2)=-8, 4+(-2)=2)。",
          "(x+4)(x-2)=0よりx=-4,2です。"
        ],
        "explanation": "正解！ x=-4, 2です。"
      },
      {
        "id": "math-34-practice-3",
        "label": "発展",
        "prompt": "2x²-3x-2=0を解の公式で解きなさい。",
        "options": [
          {
            "id": "math-34-practice-3-0",
            "text": "x=2, -1/2",
            "correct": true
          },
          {
            "id": "math-34-practice-3-1",
            "text": "x=2, 1/2",
            "correct": false
          },
          {
            "id": "math-34-practice-3-2",
            "text": "x=-2, 1/2",
            "correct": false
          },
          {
            "id": "math-34-practice-3-3",
            "text": "x=4, -1",
            "correct": false
          }
        ],
        "hints": [
          "判別式b²-4ac=9+16=25です。",
          "√25=5なのでx=(3±5)/4です。",
          "x=8/4=2 または x=-2/4=-1/2です。"
        ],
        "explanation": "正解！ x=2, -1/2です。"
      }
    ]
  },
  {
    "step": 35,
    "title": "2次方程式を使った文章題",
    "narration": [
      "面積や連続する整数の問題では、文字を1つ置いて2次方程式を立てます。",
      "方程式を解いたあとは、答えが問題の条件(正の数、長さなど)に合うか必ず確認します。",
      "2つの解が出ても、文章題の条件に合わない方は不適として除外します。"
    ],
    "animation": {
      "type": "balance",
      "params": {
        "leftExpr": "整数×整数",
        "rightExpr": "56"
      },
      "controls": [
        {
          "id": "tilt",
          "label": "つり合いの傾き",
          "min": -1,
          "max": 1,
          "step": 0.1,
          "def": 0
        }
      ]
    },
    "check": {
      "id": "math-35-check",
      "label": "確認問題",
      "prompt": "2次方程式を使った文章題で、2つの解が出たときに最初に確認すべきことは何ですか？",
      "options": [
        {
          "id": "math-35-check-0",
          "text": "問題の条件に合う解かどうか",
          "correct": true
        },
        {
          "id": "math-35-check-1",
          "text": "大きい方の解だけを使う",
          "correct": false
        },
        {
          "id": "math-35-check-2",
          "text": "小さい方の解だけを使う",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "長さや個数などの条件に合うかを必ず確認します。"
    },
    "practice": [
      {
        "id": "math-35-practice-1",
        "label": "基礎",
        "prompt": "連続する2つの正の整数の積が56であるとき、小さい方の整数を求めなさい。",
        "options": [
          {
            "id": "math-35-practice-1-0",
            "text": "7",
            "correct": true
          },
          {
            "id": "math-35-practice-1-1",
            "text": "8",
            "correct": false
          },
          {
            "id": "math-35-practice-1-2",
            "text": "6",
            "correct": false
          },
          {
            "id": "math-35-practice-1-3",
            "text": "9",
            "correct": false
          }
        ],
        "hints": [
          "小さい方をnとすると、大きい方はn+1です。",
          "n(n+1)=56を解きます。",
          "n²+n-56=0より(n+8)(n-7)=0、正の整数なのでn=7です。"
        ],
        "explanation": "正解！ 7です。"
      },
      {
        "id": "math-35-practice-2",
        "label": "標準",
        "prompt": "正方形の1辺をxcmとし、面積が64cm²であるとき、xの値を求めなさい。",
        "options": [
          {
            "id": "math-35-practice-2-0",
            "text": "8",
            "correct": true
          },
          {
            "id": "math-35-practice-2-1",
            "text": "16",
            "correct": false
          },
          {
            "id": "math-35-practice-2-2",
            "text": "32",
            "correct": false
          },
          {
            "id": "math-35-practice-2-3",
            "text": "4",
            "correct": false
          }
        ],
        "hints": [
          "x²=64とおきます。",
          "x=±8ですが、長さなので正の値です。",
          "x=8です。"
        ],
        "explanation": "正解！ 8cmです。"
      },
      {
        "id": "math-35-practice-3",
        "label": "発展",
        "prompt": "ある長方形の縦の長さは横の長さより3cm長く、面積が40cm²である。横の長さを求めなさい。",
        "options": [
          {
            "id": "math-35-practice-3-0",
            "text": "5cm",
            "correct": true
          },
          {
            "id": "math-35-practice-3-1",
            "text": "8cm",
            "correct": false
          },
          {
            "id": "math-35-practice-3-2",
            "text": "4cm",
            "correct": false
          },
          {
            "id": "math-35-practice-3-3",
            "text": "10cm",
            "correct": false
          }
        ],
        "hints": [
          "横をxcmとすると、縦はx+3cmです。",
          "x(x+3)=40を解きます。",
          "x²+3x-40=0より(x+8)(x-5)=0、正の値なのでx=5です。"
        ],
        "explanation": "正解！ 5cmです。"
      }
    ]
  },
  {
    "step": 36,
    "title": "関数y=ax²のグラフの特徴",
    "narration": [
      "y=ax²のグラフは「放物線」と呼ばれる、原点を頂点とする対称な曲線です。",
      "aが正のときは下に凸、aが負のときは上に凸になります。",
      "スライダーでaの値を変えて、放物線の開き方の変化を確かめましょう。"
    ],
    "animation": {
      "type": "graph",
      "params": {
        "kind": "quadratic",
        "scale": 40
      },
      "controls": [
        {
          "id": "a",
          "label": "a の値",
          "min": -3,
          "max": 3,
          "step": 0.5,
          "def": 1
        }
      ]
    },
    "check": {
      "id": "math-36-check",
      "label": "確認問題",
      "prompt": "y=ax²のグラフの形はどれですか？",
      "options": [
        {
          "id": "math-36-check-0",
          "text": "放物線",
          "correct": true
        },
        {
          "id": "math-36-check-1",
          "text": "直線",
          "correct": false
        },
        {
          "id": "math-36-check-2",
          "text": "双曲線",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "y=ax²のグラフは放物線です。"
    },
    "practice": [
      {
        "id": "math-36-practice-1",
        "label": "基礎",
        "prompt": "y=2x²のとき、x=3のときのyの値を求めなさい。",
        "options": [
          {
            "id": "math-36-practice-1-0",
            "text": "18",
            "correct": true
          },
          {
            "id": "math-36-practice-1-1",
            "text": "6",
            "correct": false
          },
          {
            "id": "math-36-practice-1-2",
            "text": "9",
            "correct": false
          },
          {
            "id": "math-36-practice-1-3",
            "text": "12",
            "correct": false
          }
        ],
        "hints": [
          "y=2x²にx=3を代入します。",
          "2×3²=2×9です。",
          "18です。"
        ],
        "explanation": "正解！ 18です。"
      },
      {
        "id": "math-36-practice-2",
        "label": "標準",
        "prompt": "y=ax²のグラフが点(2,12)を通るとき、aの値を求めなさい。",
        "options": [
          {
            "id": "math-36-practice-2-0",
            "text": "3",
            "correct": true
          },
          {
            "id": "math-36-practice-2-1",
            "text": "6",
            "correct": false
          },
          {
            "id": "math-36-practice-2-2",
            "text": "12",
            "correct": false
          },
          {
            "id": "math-36-practice-2-3",
            "text": "24",
            "correct": false
          }
        ],
        "hints": [
          "12=a×2²に当てはめます。",
          "12=4aです。",
          "a=3です。"
        ],
        "explanation": "正解！ a=3です。"
      },
      {
        "id": "math-36-practice-3",
        "label": "発展",
        "prompt": "y=-x²のグラフの特徴として正しいものはどれですか？",
        "options": [
          {
            "id": "math-36-practice-3-0",
            "text": "上に凸で原点が最大値",
            "correct": true
          },
          {
            "id": "math-36-practice-3-1",
            "text": "下に凸で原点が最小値",
            "correct": false
          },
          {
            "id": "math-36-practice-3-2",
            "text": "x軸に平行な直線",
            "correct": false
          }
        ],
        "hints": [
          "aの符号に注目します。",
          "a=-1なので負です。",
          "負のときは上に凸で原点が最大値になります。"
        ],
        "explanation": "正解！ 上に凸で原点が最大値です。"
      }
    ]
  },
  {
    "step": 37,
    "title": "y=ax²の変化の割合",
    "narration": [
      "y=ax²では、xが変わるとyの変化の割合も変わる点が1次関数と違います。",
      "変化の割合は「yの増加量÷xの増加量」で計算します。",
      "a>0のとき、xの変域に0を含むならyの最小値は0になります。"
    ],
    "animation": {
      "type": "graph",
      "params": {
        "kind": "quadratic",
        "scale": 40
      },
      "controls": [
        {
          "id": "a",
          "label": "a の値",
          "min": -3,
          "max": 3,
          "step": 0.5,
          "def": 1
        }
      ]
    },
    "check": {
      "id": "math-37-check",
      "label": "確認問題",
      "prompt": "y=ax²(a>0)で、xの値が2倍になるとyの値は何倍になりますか？",
      "options": [
        {
          "id": "math-37-check-0",
          "text": "4倍",
          "correct": true
        },
        {
          "id": "math-37-check-1",
          "text": "2倍",
          "correct": false
        },
        {
          "id": "math-37-check-2",
          "text": "8倍",
          "correct": false
        },
        {
          "id": "math-37-check-3",
          "text": "変わらない",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "xが2倍ならx²は4倍になるので、yも4倍になります。"
    },
    "practice": [
      {
        "id": "math-37-practice-1",
        "label": "基礎",
        "prompt": "y=3x²で、xが1から3まで増加するときの変化の割合を求めなさい。",
        "options": [
          {
            "id": "math-37-practice-1-0",
            "text": "12",
            "correct": true
          },
          {
            "id": "math-37-practice-1-1",
            "text": "6",
            "correct": false
          },
          {
            "id": "math-37-practice-1-2",
            "text": "9",
            "correct": false
          },
          {
            "id": "math-37-practice-1-3",
            "text": "24",
            "correct": false
          }
        ],
        "hints": [
          "x=1でy=3, x=3でy=27です。",
          "変化の割合=(27-3)÷(3-1)です。",
          "24÷2=12です。"
        ],
        "explanation": "正解！ 12です。"
      },
      {
        "id": "math-37-practice-2",
        "label": "標準",
        "prompt": "y=-2x²で、xの変域が-1≦x≦2のときのyの最大値を求めなさい。",
        "options": [
          {
            "id": "math-37-practice-2-0",
            "text": "0",
            "correct": true
          },
          {
            "id": "math-37-practice-2-1",
            "text": "-2",
            "correct": false
          },
          {
            "id": "math-37-practice-2-2",
            "text": "-8",
            "correct": false
          },
          {
            "id": "math-37-practice-2-3",
            "text": "2",
            "correct": false
          }
        ],
        "hints": [
          "a<0なので上に凸です。",
          "変域に0を含むので頂点(0,0)がyの最大値です。",
          "最大値は0です。"
        ],
        "explanation": "正解！ 最大値は0です。"
      },
      {
        "id": "math-37-practice-3",
        "label": "発展",
        "prompt": "y=ax²において、xの値が1から4まで増加するときの変化の割合が10である。aの値を求めなさい。",
        "options": [
          {
            "id": "math-37-practice-3-0",
            "text": "2",
            "correct": true
          },
          {
            "id": "math-37-practice-3-1",
            "text": "5",
            "correct": false
          },
          {
            "id": "math-37-practice-3-2",
            "text": "10",
            "correct": false
          },
          {
            "id": "math-37-practice-3-3",
            "text": "0.5",
            "correct": false
          }
        ],
        "hints": [
          "変化の割合はa(x1+x2)で表せます(x1=1,x2=4)。",
          "a×(1+4)=10です。",
          "5a=10よりa=2です。"
        ],
        "explanation": "正解！ a=2です。"
      }
    ]
  },
  {
    "step": 38,
    "title": "放物線と直線の交点を利用した問題",
    "narration": [
      "放物線と直線の交点のx座標は、2つの式を連立させて求めます。",
      "交点の座標が分かれば、三角形の面積や2点間の距離も計算できます。",
      "関数と図形を組み合わせる問題は、まず座標を正確に求めることが第一歩です。"
    ],
    "animation": {
      "type": "graph",
      "params": {
        "kind": "quadratic",
        "scale": 40
      },
      "controls": [
        {
          "id": "a",
          "label": "a の値",
          "min": -3,
          "max": 3,
          "step": 0.5,
          "def": 1
        }
      ]
    },
    "check": {
      "id": "math-38-check",
      "label": "確認問題",
      "prompt": "関数のグラフ上の点を用いて図形の面積を求める問題でまず行うべきことは？",
      "options": [
        {
          "id": "math-38-check-0",
          "text": "各点の座標を求める",
          "correct": true
        },
        {
          "id": "math-38-check-1",
          "text": "すぐに公式を当てはめる",
          "correct": false
        },
        {
          "id": "math-38-check-2",
          "text": "グラフを無視する",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "座標を正確に求めることが面積計算の第一歩です。"
    },
    "practice": [
      {
        "id": "math-38-practice-1",
        "label": "基礎",
        "prompt": "放物線y=x²上の点A(2,4)とy軸上の点B(0,4)との距離を求めなさい。",
        "options": [
          {
            "id": "math-38-practice-1-0",
            "text": "2",
            "correct": true
          },
          {
            "id": "math-38-practice-1-1",
            "text": "4",
            "correct": false
          },
          {
            "id": "math-38-practice-1-2",
            "text": "√20",
            "correct": false
          },
          {
            "id": "math-38-practice-1-3",
            "text": "6",
            "correct": false
          }
        ],
        "hints": [
          "AとBのy座標は同じ4です。",
          "よって水平方向の距離だけを考えます。",
          "x座標の差は2-0=2です。"
        ],
        "explanation": "正解！ 距離は2です。"
      },
      {
        "id": "math-38-practice-2",
        "label": "標準",
        "prompt": "直線y=x+2と放物線y=x²の交点のx座標を求めなさい。",
        "options": [
          {
            "id": "math-38-practice-2-0",
            "text": "x=2, -1",
            "correct": true
          },
          {
            "id": "math-38-practice-2-1",
            "text": "x=1, -2",
            "correct": false
          },
          {
            "id": "math-38-practice-2-2",
            "text": "x=2, 1",
            "correct": false
          },
          {
            "id": "math-38-practice-2-3",
            "text": "x=-2, -1",
            "correct": false
          }
        ],
        "hints": [
          "x²=x+2とおきます。",
          "x²-x-2=0です。",
          "(x-2)(x+1)=0よりx=2,-1です。"
        ],
        "explanation": "正解！ x=2, -1です。"
      },
      {
        "id": "math-38-practice-3",
        "label": "発展",
        "prompt": "放物線y=x²上に2点A(-1,1),B(2,4)がある。直線ABの式を求めなさい。",
        "options": [
          {
            "id": "math-38-practice-3-0",
            "text": "y=x+2",
            "correct": true
          },
          {
            "id": "math-38-practice-3-1",
            "text": "y=2x+3",
            "correct": false
          },
          {
            "id": "math-38-practice-3-2",
            "text": "y=x+1",
            "correct": false
          },
          {
            "id": "math-38-practice-3-3",
            "text": "y=3x-2",
            "correct": false
          }
        ],
        "hints": [
          "傾き=(4-1)÷(2-(-1))です。",
          "3÷3=1です。",
          "y=x+bにA(-1,1)を入れるとb=2です。"
        ],
        "explanation": "正解！ y=x+2です。"
      }
    ]
  },
  {
    "step": 39,
    "title": "相似な図形の辺の比・面積比・体積比",
    "narration": [
      "相似な図形では、対応するすべての辺の比(相似比)が等しくなります。",
      "相似な図形の面積比は、相似比の2乗になります。",
      "相似な立体の体積比は、相似比の3乗になります。"
    ],
    "animation": {
      "type": "ratio",
      "params": {
        "labelA": "小さい図形",
        "labelB": "大きい図形",
        "baseA": 40
      },
      "controls": [
        {
          "id": "scale",
          "label": "拡大倍率",
          "min": 0.5,
          "max": 3,
          "step": 0.1,
          "def": 1.5
        }
      ]
    },
    "check": {
      "id": "math-39-check",
      "label": "確認問題",
      "prompt": "相似な図形の対応する辺の比はどうなりますか？",
      "options": [
        {
          "id": "math-39-check-0",
          "text": "すべて等しい比(相似比)になる",
          "correct": true
        },
        {
          "id": "math-39-check-1",
          "text": "すべて異なる",
          "correct": false
        },
        {
          "id": "math-39-check-2",
          "text": "足すと180度になる",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "相似な図形の対応する辺はすべて同じ比(相似比)になります。"
    },
    "practice": [
      {
        "id": "math-39-practice-1",
        "label": "基礎",
        "prompt": "相似比が2:3の2つの図形がある。小さい方の図形の1辺が4cmのとき、対応する大きい図形の辺の長さを求めなさい。",
        "options": [
          {
            "id": "math-39-practice-1-0",
            "text": "6cm",
            "correct": true
          },
          {
            "id": "math-39-practice-1-1",
            "text": "8cm",
            "correct": false
          },
          {
            "id": "math-39-practice-1-2",
            "text": "4.5cm",
            "correct": false
          },
          {
            "id": "math-39-practice-1-3",
            "text": "9cm",
            "correct": false
          }
        ],
        "hints": [
          "比が2:3なので4cmに3/2をかけます。",
          "4×3÷2です。",
          "6cmです。"
        ],
        "explanation": "正解！ 6cmです。"
      },
      {
        "id": "math-39-practice-2",
        "label": "標準",
        "prompt": "相似な図形の面積比は相似比の何乗になりますか？",
        "options": [
          {
            "id": "math-39-practice-2-0",
            "text": "2乗(平方)",
            "correct": true
          },
          {
            "id": "math-39-practice-2-1",
            "text": "そのまま同じ",
            "correct": false
          },
          {
            "id": "math-39-practice-2-2",
            "text": "3乗",
            "correct": false
          }
        ],
        "hints": [
          "面積は長さ×長さで求まります。",
          "長さが2つ分なので2乗になります。",
          "2乗(平方)です。"
        ],
        "explanation": "正解！ 2乗です。"
      },
      {
        "id": "math-39-practice-3",
        "label": "発展",
        "prompt": "相似比3:5の2つの立体がある。小さい方の体積が54cm³のとき、大きい方の体積を求めなさい。",
        "options": [
          {
            "id": "math-39-practice-3-0",
            "text": "250cm³",
            "correct": true
          },
          {
            "id": "math-39-practice-3-1",
            "text": "90cm³",
            "correct": false
          },
          {
            "id": "math-39-practice-3-2",
            "text": "150cm³",
            "correct": false
          },
          {
            "id": "math-39-practice-3-3",
            "text": "162cm³",
            "correct": false
          }
        ],
        "hints": [
          "体積比は相似比の3乗、(5/3)³です。",
          "125/27になります。",
          "54×125/27=250です。"
        ],
        "explanation": "正解！ 250cm³です。"
      }
    ]
  },
  {
    "step": 40,
    "title": "三角形の相似条件(2角相等・2辺比夾角相等・3辺比相等)",
    "narration": [
      "2組の角がそれぞれ等しいとき(2角相等)、2つの三角形は相似になります。",
      "2組の辺の比が等しく、その間の角が等しいとき(2辺比夾角相等)も相似です。",
      "3組の辺の比がすべて等しいとき(3辺比相等)も相似になります。"
    ],
    "animation": {
      "type": "shape",
      "params": {
        "kind": "triangle",
        "caption": "相似な三角形(2角相等)のイメージ"
      },
      "controls": [
        {
          "id": "s",
          "label": "大きさ",
          "min": 30,
          "max": 90,
          "step": 5,
          "def": 60
        }
      ]
    },
    "check": {
      "id": "math-40-check",
      "label": "確認問題",
      "prompt": "三角形の相似条件のうち「2組の角がそれぞれ等しい」ものを何といいますか？",
      "options": [
        {
          "id": "math-40-check-0",
          "text": "2角相等",
          "correct": true
        },
        {
          "id": "math-40-check-1",
          "text": "3辺比相等",
          "correct": false
        },
        {
          "id": "math-40-check-2",
          "text": "2辺比夾角相等",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "2組の角がそれぞれ等しい条件は2角相等です。"
    },
    "practice": [
      {
        "id": "math-40-practice-1",
        "label": "基礎",
        "prompt": "2つの三角形で3辺の比がすべて等しいとき成り立つ相似条件はどれですか？",
        "options": [
          {
            "id": "math-40-practice-1-0",
            "text": "3辺比相等",
            "correct": true
          },
          {
            "id": "math-40-practice-1-1",
            "text": "2角相等",
            "correct": false
          },
          {
            "id": "math-40-practice-1-2",
            "text": "2辺比夾角相等",
            "correct": false
          }
        ],
        "hints": [
          "3組すべての辺の比が同じです。",
          "SSSの相似版と考えましょう。",
          "3辺比相等です。"
        ],
        "explanation": "正解！ 3辺比相等です。"
      },
      {
        "id": "math-40-practice-2",
        "label": "標準",
        "prompt": "△ABCと△DEFで、∠A=∠D, AB:DE=AC:DFが成り立つとき、成り立つ相似条件は？",
        "options": [
          {
            "id": "math-40-practice-2-0",
            "text": "2辺比夾角相等",
            "correct": true
          },
          {
            "id": "math-40-practice-2-1",
            "text": "2角相等",
            "correct": false
          },
          {
            "id": "math-40-practice-2-2",
            "text": "3辺比相等",
            "correct": false
          }
        ],
        "hints": [
          "2組の辺の比と、その間の角に注目します。",
          "∠Aは辺AB,ACに挟まれた角です。",
          "2辺比夾角相等です。"
        ],
        "explanation": "正解！ 2辺比夾角相等です。"
      },
      {
        "id": "math-40-practice-3",
        "label": "発展",
        "prompt": "△ABCにおいて、DE//BCのとき、△ADEと△ABCが相似であると言える理由として正しいものはどれですか？",
        "options": [
          {
            "id": "math-40-practice-3-0",
            "text": "2角がそれぞれ等しい(2角相等)",
            "correct": true
          },
          {
            "id": "math-40-practice-3-1",
            "text": "3辺の比が等しい",
            "correct": false
          },
          {
            "id": "math-40-practice-3-2",
            "text": "面積が等しい",
            "correct": false
          }
        ],
        "hints": [
          "DE//BCより同位角が等しくなります。",
          "∠A共通、∠ADE=∠ABCです。",
          "2角相等により相似です。"
        ],
        "explanation": "正解！ 2角相等により相似です。"
      }
    ]
  },
  {
    "step": 41,
    "title": "三角形と平行線の比の定理",
    "narration": [
      "△ABCでDE//BCのとき、AD:AB=AE:ACという比の関係が成り立ちます。",
      "さらにAD:AB=DE:BCという比の関係も成り立ちます。",
      "この性質を使うと、平行線を含む図形で未知の長さを求めることができます。"
    ],
    "animation": {
      "type": "ratio",
      "params": {
        "labelA": "AD:AB",
        "labelB": "AE:AC",
        "baseA": 40
      },
      "controls": [
        {
          "id": "scale",
          "label": "比の倍率",
          "min": 0.3,
          "max": 2,
          "step": 0.1,
          "def": 1.5
        }
      ]
    },
    "check": {
      "id": "math-41-check",
      "label": "確認問題",
      "prompt": "△ABCでDE//BCのとき、AD:AB=AE:ACが成り立つ。これは正しいですか？",
      "options": [
        {
          "id": "math-41-check-0",
          "text": "正しい",
          "correct": true
        },
        {
          "id": "math-41-check-1",
          "text": "誤り",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "DE//BCのとき、この比の関係は常に成り立ちます。"
    },
    "practice": [
      {
        "id": "math-41-practice-1",
        "label": "基礎",
        "prompt": "△ABCでDE//BC、AD=4,DB=2,AC=9のとき、AEの長さを求めなさい。",
        "options": [
          {
            "id": "math-41-practice-1-0",
            "text": "6",
            "correct": true
          },
          {
            "id": "math-41-practice-1-1",
            "text": "3",
            "correct": false
          },
          {
            "id": "math-41-practice-1-2",
            "text": "4.5",
            "correct": false
          },
          {
            "id": "math-41-practice-1-3",
            "text": "7.5",
            "correct": false
          }
        ],
        "hints": [
          "AB=AD+DB=6です。",
          "AD:AB=AE:ACより4:6=AE:9です。",
          "AE=9×4/6=6です。"
        ],
        "explanation": "正解！ AE=6です。"
      },
      {
        "id": "math-41-practice-2",
        "label": "標準",
        "prompt": "平行線に挟まれた3本の線分の比が2:3:4であるとき、全体を9等分した場合の各線分の割合を求めなさい。",
        "options": [
          {
            "id": "math-41-practice-2-0",
            "text": "2/9, 3/9, 4/9",
            "correct": true
          },
          {
            "id": "math-41-practice-2-1",
            "text": "等しい割合",
            "correct": false
          },
          {
            "id": "math-41-practice-2-2",
            "text": "2:3:4のまま変わらないので割合は出せない",
            "correct": false
          }
        ],
        "hints": [
          "比2:3:4の合計は9です。",
          "全体を9としたときの各部分の割合を考えます。",
          "2/9, 3/9, 4/9です。"
        ],
        "explanation": "正解！ 2/9, 3/9, 4/9です。"
      },
      {
        "id": "math-41-practice-3",
        "label": "発展",
        "prompt": "台形ABCDでAB//DCとし、対角線の交点をPとする。AP:PC=3:2のとき、AB:DCを求めなさい。",
        "options": [
          {
            "id": "math-41-practice-3-0",
            "text": "3:2",
            "correct": true
          },
          {
            "id": "math-41-practice-3-1",
            "text": "2:3",
            "correct": false
          },
          {
            "id": "math-41-practice-3-2",
            "text": "1:1",
            "correct": false
          },
          {
            "id": "math-41-practice-3-3",
            "text": "9:4",
            "correct": false
          }
        ],
        "hints": [
          "AB//DCの台形では、対角線の交点の比は上底・下底の比と同じになります。",
          "AP:PC=AB:DCという関係があります。",
          "よってAB:DC=3:2です。"
        ],
        "explanation": "正解！ AB:DC=3:2です。"
      }
    ]
  },
  {
    "step": 42,
    "title": "中点連結定理",
    "narration": [
      "三角形の2辺の中点を結ぶ線分は、残りの辺に平行でその長さは半分になります。",
      "これを「中点連結定理」と呼びます。",
      "四角形の各辺の中点を結ぶと、必ず平行四辺形ができるのもこの定理の応用です。"
    ],
    "animation": {
      "type": "ratio",
      "params": {
        "labelA": "底辺BC",
        "labelB": "中点連結線MN",
        "baseA": 60
      },
      "controls": [
        {
          "id": "scale",
          "label": "MNの比率",
          "min": 0.3,
          "max": 0.7,
          "step": 0.05,
          "def": 0.5
        }
      ]
    },
    "check": {
      "id": "math-42-check",
      "label": "確認問題",
      "prompt": "中点連結定理によると、三角形の2辺の中点を結ぶ線分は何と平行で、長さはどうなりますか？",
      "options": [
        {
          "id": "math-42-check-0",
          "text": "残りの辺と平行で長さは半分",
          "correct": true
        },
        {
          "id": "math-42-check-1",
          "text": "残りの辺と垂直で長さは2倍",
          "correct": false
        },
        {
          "id": "math-42-check-2",
          "text": "残りの辺と平行で長さは同じ",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "中点を結ぶ線分は残りの辺と平行で、長さは半分になります。"
    },
    "practice": [
      {
        "id": "math-42-practice-1",
        "label": "基礎",
        "prompt": "△ABCで辺BC=10cmのとき、辺AB,ACの中点を結ぶ線分MNの長さを求めなさい。(MN//BC)",
        "options": [
          {
            "id": "math-42-practice-1-0",
            "text": "5cm",
            "correct": true
          },
          {
            "id": "math-42-practice-1-1",
            "text": "10cm",
            "correct": false
          },
          {
            "id": "math-42-practice-1-2",
            "text": "20cm",
            "correct": false
          },
          {
            "id": "math-42-practice-1-3",
            "text": "2.5cm",
            "correct": false
          }
        ],
        "hints": [
          "中点連結定理より、MNはBCの半分の長さです。",
          "10÷2を計算します。",
          "5cmです。"
        ],
        "explanation": "正解！ 5cmです。"
      },
      {
        "id": "math-42-practice-2",
        "label": "標準",
        "prompt": "四角形の各辺の中点を結ぶと、必ずどんな図形ができますか？",
        "options": [
          {
            "id": "math-42-practice-2-0",
            "text": "平行四辺形",
            "correct": true
          },
          {
            "id": "math-42-practice-2-1",
            "text": "正方形",
            "correct": false
          },
          {
            "id": "math-42-practice-2-2",
            "text": "台形",
            "correct": false
          }
        ],
        "hints": [
          "四角形の対角線を考えると、各辺の中点を結ぶ線は対角線に平行になります。",
          "中点連結定理を対角線ごとに当てはめます。",
          "必ず平行四辺形になります。"
        ],
        "explanation": "正解！ 平行四辺形になります。"
      },
      {
        "id": "math-42-practice-3",
        "label": "発展",
        "prompt": "△ABCの辺AB,ACの中点をそれぞれM,Nとする。MN=6cmのとき、BCの長さを求めなさい。",
        "options": [
          {
            "id": "math-42-practice-3-0",
            "text": "12cm",
            "correct": true
          },
          {
            "id": "math-42-practice-3-1",
            "text": "6cm",
            "correct": false
          },
          {
            "id": "math-42-practice-3-2",
            "text": "18cm",
            "correct": false
          },
          {
            "id": "math-42-practice-3-3",
            "text": "24cm",
            "correct": false
          }
        ],
        "hints": [
          "中点連結定理より、MNはBCの半分です。",
          "BC=MN×2と考えます。",
          "6×2=12cmです。"
        ],
        "explanation": "正解！ 12cmです。"
      }
    ]
  },
  {
    "step": 43,
    "title": "円周角の定理",
    "narration": [
      "同じ弧に対する円周角は、どこから見てもすべて等しくなります。",
      "円周角は、同じ弧に対する中心角の半分の大きさになります。",
      "直径に対する円周角は、必ず90度になります。"
    ],
    "animation": {
      "type": "shape",
      "params": {
        "kind": "circle",
        "caption": "円周角の定理（同じ弧の円周角は等しい）"
      },
      "controls": [
        {
          "id": "s",
          "label": "円の半径",
          "min": 30,
          "max": 90,
          "step": 5,
          "def": 60
        }
      ]
    },
    "check": {
      "id": "math-43-check",
      "label": "確認問題",
      "prompt": "同じ弧に対する円周角はどうなりますか？",
      "options": [
        {
          "id": "math-43-check-0",
          "text": "すべて等しい",
          "correct": true
        },
        {
          "id": "math-43-check-1",
          "text": "足すと180度になる",
          "correct": false
        },
        {
          "id": "math-43-check-2",
          "text": "中心角の2倍になる",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "同じ弧に対する円周角はすべて等しくなります。"
    },
    "practice": [
      {
        "id": "math-43-practice-1",
        "label": "基礎",
        "prompt": "円の中心角が80度のとき、同じ弧に対する円周角を求めなさい。",
        "options": [
          {
            "id": "math-43-practice-1-0",
            "text": "40度",
            "correct": true
          },
          {
            "id": "math-43-practice-1-1",
            "text": "80度",
            "correct": false
          },
          {
            "id": "math-43-practice-1-2",
            "text": "160度",
            "correct": false
          },
          {
            "id": "math-43-practice-1-3",
            "text": "20度",
            "correct": false
          }
        ],
        "hints": [
          "円周角は中心角の半分です。",
          "80÷2を計算します。",
          "40度です。"
        ],
        "explanation": "正解！ 40度です。"
      },
      {
        "id": "math-43-practice-2",
        "label": "標準",
        "prompt": "直径に対する円周角の大きさはいくらですか？",
        "options": [
          {
            "id": "math-43-practice-2-0",
            "text": "90度",
            "correct": true
          },
          {
            "id": "math-43-practice-2-1",
            "text": "180度",
            "correct": false
          },
          {
            "id": "math-43-practice-2-2",
            "text": "45度",
            "correct": false
          },
          {
            "id": "math-43-practice-2-3",
            "text": "60度",
            "correct": false
          }
        ],
        "hints": [
          "直径に対する中心角は180度です。",
          "円周角は中心角の半分です。",
          "180÷2=90度です。"
        ],
        "explanation": "正解！ 90度です。"
      },
      {
        "id": "math-43-practice-3",
        "label": "発展",
        "prompt": "円に内接する四角形ABCDにおいて、∠A=70度のとき、対角の∠Cを求めなさい。(内接四角形の対角の和は180度)",
        "options": [
          {
            "id": "math-43-practice-3-0",
            "text": "110度",
            "correct": true
          },
          {
            "id": "math-43-practice-3-1",
            "text": "70度",
            "correct": false
          },
          {
            "id": "math-43-practice-3-2",
            "text": "90度",
            "correct": false
          },
          {
            "id": "math-43-practice-3-3",
            "text": "180度",
            "correct": false
          }
        ],
        "hints": [
          "円に内接する四角形の対角の和は180度です。",
          "180-70を計算します。",
          "110度です。"
        ],
        "explanation": "正解！ 110度です。"
      }
    ]
  },
  {
    "step": 44,
    "title": "円に関する相似・割線定理",
    "narration": [
      "円の2つの弦が交わるとき、できる2つの三角形は対頂角と円周角の性質から相似になります。",
      "相似な三角形の対応する辺の比から、PA×PB=PC×PDという関係(割線定理)が導けます。",
      "円周角の定理と相似の知識を組み合わせることで、複雑な図形の長さが求められます。"
    ],
    "animation": {
      "type": "shape",
      "params": {
        "kind": "circle",
        "caption": "円と相似の融合(交わる弦)"
      },
      "controls": [
        {
          "id": "s",
          "label": "円の半径",
          "min": 30,
          "max": 90,
          "step": 5,
          "def": 60
        }
      ]
    },
    "check": {
      "id": "math-44-check",
      "label": "確認問題",
      "prompt": "円周角の定理を利用して相似な三角形を見つける際、着目すべき角はどれですか？",
      "options": [
        {
          "id": "math-44-check-0",
          "text": "同じ弧に対する円周角",
          "correct": true
        },
        {
          "id": "math-44-check-1",
          "text": "中心からの距離",
          "correct": false
        },
        {
          "id": "math-44-check-2",
          "text": "円の半径の長さ",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "同じ弧に対する円周角が等しいことを利用して相似を示します。"
    },
    "practice": [
      {
        "id": "math-44-practice-1",
        "label": "基礎",
        "prompt": "円に内接する2つの三角形が、同じ弧に対する円周角を共有しているとき、これらは相似であると言えるか？",
        "options": [
          {
            "id": "math-44-practice-1-0",
            "text": "(他の角の条件も合わせれば)相似と言える",
            "correct": true
          },
          {
            "id": "math-44-practice-1-1",
            "text": "絶対に相似にならない",
            "correct": false
          }
        ],
        "hints": [
          "円周角が等しいことは相似条件の一部になります。",
          "もう1組の角が分かれば2角相等が使えます。",
          "条件が揃えば相似と言えます。"
        ],
        "explanation": "正解！ 条件が揃えば相似と言えます。"
      },
      {
        "id": "math-44-practice-2",
        "label": "標準",
        "prompt": "円の2つの弦が交わるとき、交点でできる2つの三角形が相似になる理由として正しいものはどれですか？",
        "options": [
          {
            "id": "math-44-practice-2-0",
            "text": "対頂角が等しく、円周角も等しいため",
            "correct": true
          },
          {
            "id": "math-44-practice-2-1",
            "text": "弦の長さが等しいため",
            "correct": false
          },
          {
            "id": "math-44-practice-2-2",
            "text": "円の半径が等しいため",
            "correct": false
          }
        ],
        "hints": [
          "交点では対頂角が必ず等しくなります。",
          "さらに同じ弧に対する円周角も等しくなります。",
          "2角相等により相似になります。"
        ],
        "explanation": "正解！ 対頂角と円周角が等しいためです。"
      },
      {
        "id": "math-44-practice-3",
        "label": "発展",
        "prompt": "円の割線定理PA×PB=PC×PDを用いて、PA=4,PB=6,PC=3のとき、PDを求めなさい。",
        "options": [
          {
            "id": "math-44-practice-3-0",
            "text": "8",
            "correct": true
          },
          {
            "id": "math-44-practice-3-1",
            "text": "6",
            "correct": false
          },
          {
            "id": "math-44-practice-3-2",
            "text": "4.5",
            "correct": false
          },
          {
            "id": "math-44-practice-3-3",
            "text": "12",
            "correct": false
          }
        ],
        "hints": [
          "PA×PB=PC×PDに数を当てはめます。",
          "4×6=3×PDです。",
          "PD=24÷3=8です。"
        ],
        "explanation": "正解！ PD=8です。"
      }
    ]
  },
  {
    "step": 45,
    "title": "三平方の定理 a²+b²=c²",
    "narration": [
      "直角三角形の直角をはさむ2辺をa,b、斜辺をcとすると、a²+b²=c²が成り立ちます。",
      "これを三平方の定理(ピタゴラスの定理)と呼びます。",
      "3,4,5や5,12,13のような組は「ピタゴラス数」として覚えておくと計算が速くなります。"
    ],
    "animation": {
      "type": "shape",
      "params": {
        "kind": "rightTriangle",
        "caption": "三平方の定理 a²+b²=c²"
      },
      "controls": [
        {
          "id": "s",
          "label": "大きさ",
          "min": 30,
          "max": 90,
          "step": 5,
          "def": 60
        }
      ]
    },
    "check": {
      "id": "math-45-check",
      "label": "確認問題",
      "prompt": "三平方の定理の式として正しいものはどれですか？(直角をはさむ辺a,b、斜辺c)",
      "options": [
        {
          "id": "math-45-check-0",
          "text": "a²+b²=c²",
          "correct": true
        },
        {
          "id": "math-45-check-1",
          "text": "a+b=c",
          "correct": false
        },
        {
          "id": "math-45-check-2",
          "text": "a²-b²=c²",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "三平方の定理はa²+b²=c²です。"
    },
    "practice": [
      {
        "id": "math-45-practice-1",
        "label": "基礎",
        "prompt": "直角をはさむ2辺が3cm,4cmの直角三角形の斜辺の長さを求めなさい。",
        "options": [
          {
            "id": "math-45-practice-1-0",
            "text": "5cm",
            "correct": true
          },
          {
            "id": "math-45-practice-1-1",
            "text": "7cm",
            "correct": false
          },
          {
            "id": "math-45-practice-1-2",
            "text": "12cm",
            "correct": false
          },
          {
            "id": "math-45-practice-1-3",
            "text": "25cm",
            "correct": false
          }
        ],
        "hints": [
          "3²+4²を計算します。",
          "9+16=25です。",
          "√25=5cmです。"
        ],
        "explanation": "正解！ 5cmです。(3,4,5のピタゴラス数)"
      },
      {
        "id": "math-45-practice-2",
        "label": "標準",
        "prompt": "斜辺13cm,他の1辺5cmの直角三角形の残りの辺の長さを求めなさい。",
        "options": [
          {
            "id": "math-45-practice-2-0",
            "text": "12cm",
            "correct": true
          },
          {
            "id": "math-45-practice-2-1",
            "text": "8cm",
            "correct": false
          },
          {
            "id": "math-45-practice-2-2",
            "text": "18cm",
            "correct": false
          },
          {
            "id": "math-45-practice-2-3",
            "text": "144cm",
            "correct": false
          }
        ],
        "hints": [
          "13²-5²を計算します。",
          "169-25=144です。",
          "√144=12cmです。"
        ],
        "explanation": "正解！ 12cmです。(5,12,13のピタゴラス数)"
      },
      {
        "id": "math-45-practice-3",
        "label": "発展",
        "prompt": "直角三角形の3辺がx,x+1,x+2(斜辺)であるとき、xの値を求めなさい。",
        "options": [
          {
            "id": "math-45-practice-3-0",
            "text": "3",
            "correct": true
          },
          {
            "id": "math-45-practice-3-1",
            "text": "4",
            "correct": false
          },
          {
            "id": "math-45-practice-3-2",
            "text": "5",
            "correct": false
          },
          {
            "id": "math-45-practice-3-3",
            "text": "1",
            "correct": false
          }
        ],
        "hints": [
          "x²+(x+1)²=(x+2)²とおきます。",
          "展開するとx²-2x-3=0になります。",
          "(x-3)(x+1)=0より正の値はx=3です。"
        ],
        "explanation": "正解！ x=3です。(3,4,5の直角三角形)"
      }
    ]
  },
  {
    "step": 46,
    "title": "三平方の定理の平面図形への応用",
    "narration": [
      "正方形の対角線の長さは、三平方の定理を使って1辺×√2で求められます。",
      "正三角形の高さも、三平方の定理を使って1辺×(√3/2)で求められます。",
      "長方形の対角線の長さも、縦・横の2辺から三平方の定理で求められます。"
    ],
    "animation": {
      "type": "shape",
      "params": {
        "kind": "rightTriangle",
        "caption": "平面図形での三平方の定理の利用"
      },
      "controls": [
        {
          "id": "s",
          "label": "大きさ",
          "min": 30,
          "max": 90,
          "step": 5,
          "def": 60
        }
      ]
    },
    "check": {
      "id": "math-46-check",
      "label": "確認問題",
      "prompt": "正方形の対角線の長さを求めるとき、使う考え方はどれですか？",
      "options": [
        {
          "id": "math-46-check-0",
          "text": "三平方の定理",
          "correct": true
        },
        {
          "id": "math-46-check-1",
          "text": "円周角の定理",
          "correct": false
        },
        {
          "id": "math-46-check-2",
          "text": "中点連結定理",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "対角線で直角三角形ができるので三平方の定理が使えます。"
    },
    "practice": [
      {
        "id": "math-46-practice-1",
        "label": "基礎",
        "prompt": "1辺6cmの正方形の対角線の長さを求めなさい。",
        "options": [
          {
            "id": "math-46-practice-1-0",
            "text": "6√2cm",
            "correct": true
          },
          {
            "id": "math-46-practice-1-1",
            "text": "12cm",
            "correct": false
          },
          {
            "id": "math-46-practice-1-2",
            "text": "6cm",
            "correct": false
          },
          {
            "id": "math-46-practice-1-3",
            "text": "3√2cm",
            "correct": false
          }
        ],
        "hints": [
          "対角線で直角三角形ができます。",
          "6²+6²=72です。",
          "√72=6√2cmです。"
        ],
        "explanation": "正解！ 6√2cmです。"
      },
      {
        "id": "math-46-practice-2",
        "label": "標準",
        "prompt": "1辺が8cmの正三角形の高さを求めなさい。",
        "options": [
          {
            "id": "math-46-practice-2-0",
            "text": "4√3cm",
            "correct": true
          },
          {
            "id": "math-46-practice-2-1",
            "text": "8√3cm",
            "correct": false
          },
          {
            "id": "math-46-practice-2-2",
            "text": "4cm",
            "correct": false
          },
          {
            "id": "math-46-practice-2-3",
            "text": "√3cm",
            "correct": false
          }
        ],
        "hints": [
          "正三角形を2つの直角三角形に分けます。",
          "底辺の半分4cmと高さhで8²=4²+h²です。",
          "h²=64-16=48よりh=4√3cmです。"
        ],
        "explanation": "正解！ 4√3cmです。"
      },
      {
        "id": "math-46-practice-3",
        "label": "発展",
        "prompt": "長方形の縦が5cm、対角線が13cmのとき、横の長さを求めなさい。",
        "options": [
          {
            "id": "math-46-practice-3-0",
            "text": "12cm",
            "correct": true
          },
          {
            "id": "math-46-practice-3-1",
            "text": "18cm",
            "correct": false
          },
          {
            "id": "math-46-practice-3-2",
            "text": "8cm",
            "correct": false
          },
          {
            "id": "math-46-practice-3-3",
            "text": "144cm",
            "correct": false
          }
        ],
        "hints": [
          "13²-5²を計算します。",
          "169-25=144です。",
          "√144=12cmです。"
        ],
        "explanation": "正解！ 12cmです。"
      }
    ]
  },
  {
    "step": 47,
    "title": "三平方の定理の空間図形への応用",
    "narration": [
      "直方体の対角線の長さは、縦・横・高さの3辺から√(a²+b²+c²)で求められます。",
      "円錐の母線の長さは、底面の半径と高さから三平方の定理で求められます。",
      "立方体の対角線は、1辺の長さの√3倍になります。"
    ],
    "animation": {
      "type": "shape",
      "params": {
        "kind": "rightTriangle",
        "caption": "空間図形での三平方の定理の利用(対角線)"
      },
      "controls": [
        {
          "id": "s",
          "label": "大きさ",
          "min": 30,
          "max": 90,
          "step": 5,
          "def": 60
        }
      ]
    },
    "check": {
      "id": "math-47-check",
      "label": "確認問題",
      "prompt": "直方体の対角線の長さを求める公式はどれですか？(縦a,横b,高さc)",
      "options": [
        {
          "id": "math-47-check-0",
          "text": "√(a²+b²+c²)",
          "correct": true
        },
        {
          "id": "math-47-check-1",
          "text": "a+b+c",
          "correct": false
        },
        {
          "id": "math-47-check-2",
          "text": "√(ab+bc+ca)",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "直方体の対角線は√(a²+b²+c²)で求められます。"
    },
    "practice": [
      {
        "id": "math-47-practice-1",
        "label": "基礎",
        "prompt": "縦3cm、横4cm、高さ12cmの直方体の対角線の長さを求めなさい。",
        "options": [
          {
            "id": "math-47-practice-1-0",
            "text": "13cm",
            "correct": true
          },
          {
            "id": "math-47-practice-1-1",
            "text": "19cm",
            "correct": false
          },
          {
            "id": "math-47-practice-1-2",
            "text": "12cm",
            "correct": false
          },
          {
            "id": "math-47-practice-1-3",
            "text": "15cm",
            "correct": false
          }
        ],
        "hints": [
          "3²+4²+12²を計算します。",
          "9+16+144=169です。",
          "√169=13cmです。"
        ],
        "explanation": "正解！ 13cmです。"
      },
      {
        "id": "math-47-practice-2",
        "label": "標準",
        "prompt": "底面の半径3cm、高さ4cmの円錐の母線の長さを求めなさい。",
        "options": [
          {
            "id": "math-47-practice-2-0",
            "text": "5cm",
            "correct": true
          },
          {
            "id": "math-47-practice-2-1",
            "text": "7cm",
            "correct": false
          },
          {
            "id": "math-47-practice-2-2",
            "text": "12cm",
            "correct": false
          },
          {
            "id": "math-47-practice-2-3",
            "text": "25cm",
            "correct": false
          }
        ],
        "hints": [
          "母線は半径と高さを2辺とする直角三角形の斜辺です。",
          "3²+4²=25です。",
          "√25=5cmです。"
        ],
        "explanation": "正解！ 5cmです。"
      },
      {
        "id": "math-47-practice-3",
        "label": "発展",
        "prompt": "立方体の1辺が6cmであるとき、対角線(空間対角線)の長さを求めなさい。",
        "options": [
          {
            "id": "math-47-practice-3-0",
            "text": "6√3cm",
            "correct": true
          },
          {
            "id": "math-47-practice-3-1",
            "text": "6√2cm",
            "correct": false
          },
          {
            "id": "math-47-practice-3-2",
            "text": "12cm",
            "correct": false
          },
          {
            "id": "math-47-practice-3-3",
            "text": "18cm",
            "correct": false
          }
        ],
        "hints": [
          "立方体の対角線は1辺×√3です。",
          "6×√3を計算します。",
          "6√3cmです。"
        ],
        "explanation": "正解！ 6√3cmです。"
      }
    ]
  },
  {
    "step": 48,
    "title": "標本調査と母集団",
    "narration": [
      "調査したい対象全体を「母集団」、その一部を取り出したものを「標本」と呼びます。",
      "標本から母集団全体の様子を推定するのが標本調査です。",
      "標本の取り方が偏っていると、推定結果も偏ってしまうため注意が必要です。"
    ],
    "animation": {
      "type": "barData",
      "params": {
        "bars": [
          {
            "label": "標本1",
            "value": 4,
            "color": "#38bdf8"
          },
          {
            "label": "標本2",
            "value": 6,
            "color": "#38bdf8"
          },
          {
            "label": "標本3",
            "value": 5,
            "color": "#38bdf8"
          }
        ]
      },
      "controls": [
        {
          "id": "adj",
          "label": "標本3の値",
          "min": 0,
          "max": 10,
          "step": 1,
          "def": 5
        }
      ]
    },
    "check": {
      "id": "math-48-check",
      "label": "確認問題",
      "prompt": "標本調査で、調査対象全体のことを何と呼びますか？",
      "options": [
        {
          "id": "math-48-check-0",
          "text": "母集団",
          "correct": true
        },
        {
          "id": "math-48-check-1",
          "text": "標本",
          "correct": false
        },
        {
          "id": "math-48-check-2",
          "text": "度数",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "調査対象全体を母集団と呼びます。"
    },
    "practice": [
      {
        "id": "math-48-practice-1",
        "label": "基礎",
        "prompt": "標本調査における「標本」とは何を指しますか？",
        "options": [
          {
            "id": "math-48-practice-1-0",
            "text": "母集団から取り出した一部のデータ",
            "correct": true
          },
          {
            "id": "math-48-practice-1-1",
            "text": "調査対象全体",
            "correct": false
          },
          {
            "id": "math-48-practice-1-2",
            "text": "調査結果の平均値",
            "correct": false
          }
        ],
        "hints": [
          "「標本」は英語でsample(サンプル)です。",
          "全体の一部を取り出したものです。",
          "母集団から取り出した一部のデータです。"
        ],
        "explanation": "正解！ 母集団から取り出した一部のデータです。"
      },
      {
        "id": "math-48-practice-2",
        "label": "標準",
        "prompt": "工場で作られた製品10000個から100個を抽出して検査した。この100個を何と呼びますか？",
        "options": [
          {
            "id": "math-48-practice-2-0",
            "text": "標本",
            "correct": true
          },
          {
            "id": "math-48-practice-2-1",
            "text": "母集団",
            "correct": false
          },
          {
            "id": "math-48-practice-2-2",
            "text": "度数分布",
            "correct": false
          }
        ],
        "hints": [
          "10000個全体が母集団です。",
          "そこから取り出した100個が標本です。",
          "標本です。"
        ],
        "explanation": "正解！ 標本です。"
      },
      {
        "id": "math-48-practice-3",
        "label": "発展",
        "prompt": "ある池の魚の数を推定するため、50匹を捕獲して印をつけ池に戻した。後日80匹を捕獲したところ、印のついた魚が4匹いた。池の魚の総数を推定しなさい。",
        "options": [
          {
            "id": "math-48-practice-3-0",
            "text": "約1000匹",
            "correct": true
          },
          {
            "id": "math-48-practice-3-1",
            "text": "約800匹",
            "correct": false
          },
          {
            "id": "math-48-practice-3-2",
            "text": "約160匹",
            "correct": false
          },
          {
            "id": "math-48-practice-3-3",
            "text": "約500匹",
            "correct": false
          }
        ],
        "hints": [
          "印のついた魚の割合は全体でも標本でも同じと考えます。",
          "50/N=4/80という式が立てられます。",
          "N=50×80÷4=1000です。"
        ],
        "explanation": "正解！ 約1000匹です。"
      }
    ]
  },
  {
    "step": 49,
    "title": "素因数分解・最大公約数・最小公倍数",
    "narration": [
      "整数を素数だけの積の形に表すことを「素因数分解」と言います。",
      "2つの数の最大公約数(GCD)は、共通する素因数をすべてかけ合わせた数です。",
      "最小公倍数(LCM)は、2数の積を最大公約数で割ることで求められます。"
    ],
    "animation": {
      "type": "integerGrid",
      "params": {
        "rangeMax": 60,
        "rule": "factor"
      },
      "controls": [
        {
          "id": "n",
          "label": "調べる数",
          "min": 12,
          "max": 60,
          "step": 1,
          "def": 36
        }
      ]
    },
    "check": {
      "id": "math-49-check",
      "label": "確認問題",
      "prompt": "60を素因数分解した結果はどれですか？",
      "options": [
        {
          "id": "math-49-check-0",
          "text": "2²×3×5",
          "correct": true
        },
        {
          "id": "math-49-check-1",
          "text": "2×3×5",
          "correct": false
        },
        {
          "id": "math-49-check-2",
          "text": "2³×5",
          "correct": false
        },
        {
          "id": "math-49-check-3",
          "text": "2²×3²",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "60=4×15=2²×3×5です。"
    },
    "practice": [
      {
        "id": "math-49-practice-1",
        "label": "基礎",
        "prompt": "36の正の約数の個数を求めなさい。",
        "options": [
          {
            "id": "math-49-practice-1-0",
            "text": "9個",
            "correct": true
          },
          {
            "id": "math-49-practice-1-1",
            "text": "6個",
            "correct": false
          },
          {
            "id": "math-49-practice-1-2",
            "text": "12個",
            "correct": false
          },
          {
            "id": "math-49-practice-1-3",
            "text": "8個",
            "correct": false
          }
        ],
        "hints": [
          "36=2²×3²と素因数分解します。",
          "約数の個数は(指数+1)の積です。",
          "(2+1)×(2+1)=9個です。"
        ],
        "explanation": "正解！ 9個です。"
      },
      {
        "id": "math-49-practice-2",
        "label": "標準",
        "prompt": "18と24の最大公約数(GCD)を求めなさい。",
        "options": [
          {
            "id": "math-49-practice-2-0",
            "text": "6",
            "correct": true
          },
          {
            "id": "math-49-practice-2-1",
            "text": "12",
            "correct": false
          },
          {
            "id": "math-49-practice-2-2",
            "text": "2",
            "correct": false
          },
          {
            "id": "math-49-practice-2-3",
            "text": "3",
            "correct": false
          }
        ],
        "hints": [
          "18=2×3², 24=2³×3です。",
          "共通する素因数は2と3です。",
          "2×3=6です。"
        ],
        "explanation": "正解！ 6です。"
      },
      {
        "id": "math-49-practice-3",
        "label": "発展",
        "prompt": "18と24の最小公倍数(LCM)を求めなさい。",
        "options": [
          {
            "id": "math-49-practice-3-0",
            "text": "72",
            "correct": true
          },
          {
            "id": "math-49-practice-3-1",
            "text": "36",
            "correct": false
          },
          {
            "id": "math-49-practice-3-2",
            "text": "144",
            "correct": false
          },
          {
            "id": "math-49-practice-3-3",
            "text": "432",
            "correct": false
          }
        ],
        "hints": [
          "LCM=(2数の積)÷GCDで求まります。",
          "18×24=432です。",
          "432÷6=72です。"
        ],
        "explanation": "正解！ 72です。"
      }
    ]
  },
  {
    "step": 50,
    "title": "偶数・奇数・倍数の証明",
    "narration": [
      "偶数は2n、奇数は2n+1(nは整数)という文字式で表すことができます。",
      "文字式に変形して、ある数でくくれる形になれば倍数であることが証明できます。",
      "証明問題では、最後に必ず「〇〇は整数だから、これは△の倍数である」とまとめます。"
    ],
    "animation": {
      "type": "integerGrid",
      "params": {
        "rangeMax": 30,
        "rule": "multiple"
      },
      "controls": [
        {
          "id": "n",
          "label": "何の倍数?",
          "min": 2,
          "max": 9,
          "step": 1,
          "def": 3
        }
      ]
    },
    "check": {
      "id": "math-50-check",
      "label": "確認問題",
      "prompt": "偶数と奇数の和は必ずどんな数になりますか？",
      "options": [
        {
          "id": "math-50-check-0",
          "text": "奇数",
          "correct": true
        },
        {
          "id": "math-50-check-1",
          "text": "偶数",
          "correct": false
        },
        {
          "id": "math-50-check-2",
          "text": "0になる",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "偶数2n+奇数(2m+1)=2(n+m)+1となり奇数です。"
    },
    "practice": [
      {
        "id": "math-50-practice-1",
        "label": "基礎",
        "prompt": "2つの奇数の和は必ず偶数になることを文字式2n+1, 2m+1を用いて示すとき、和はどのように表せますか？",
        "options": [
          {
            "id": "math-50-practice-1-0",
            "text": "2(n+m+1)となり偶数",
            "correct": true
          },
          {
            "id": "math-50-practice-1-1",
            "text": "2n+2mのままで偶数とは言えない",
            "correct": false
          },
          {
            "id": "math-50-practice-1-2",
            "text": "4nm+1となり奇数",
            "correct": false
          }
        ],
        "hints": [
          "2つの式を足します。",
          "(2n+1)+(2m+1)=2n+2m+2です。",
          "2(n+m+1)とくくれるので偶数です。"
        ],
        "explanation": "正解！ 2(n+m+1)となり偶数です。"
      },
      {
        "id": "math-50-practice-2",
        "label": "標準",
        "prompt": "3の倍数と3の倍数の和は必ず3の倍数になる。これを文字式3a,3bを用いて示すとどうなりますか？",
        "options": [
          {
            "id": "math-50-practice-2-0",
            "text": "3(a+b)となり3の倍数",
            "correct": true
          },
          {
            "id": "math-50-practice-2-1",
            "text": "6(a+b)となる",
            "correct": false
          },
          {
            "id": "math-50-practice-2-2",
            "text": "ab²となる",
            "correct": false
          }
        ],
        "hints": [
          "3aと3bを足します。",
          "3a+3bです。",
          "3(a+b)とくくれるので3の倍数です。"
        ],
        "explanation": "正解！ 3(a+b)となり3の倍数です。"
      },
      {
        "id": "math-50-practice-3",
        "label": "発展",
        "prompt": "連続する2つの奇数の積に1を加えると、必ずある数の2乗になることを示すとき、連続する奇数を2n-1, 2n+1とすると積+1はどう変形できますか？",
        "options": [
          {
            "id": "math-50-practice-3-0",
            "text": "(2n)²となり平方数",
            "correct": true
          },
          {
            "id": "math-50-practice-3-1",
            "text": "4n+1となる",
            "correct": false
          },
          {
            "id": "math-50-practice-3-2",
            "text": "2n²となる",
            "correct": false
          }
        ],
        "hints": [
          "(2n-1)(2n+1)を展開します。",
          "4n²-1になります。",
          "+1すると4n²=(2n)²になります。"
        ],
        "explanation": "正解！ (2n)²となり平方数です。"
      }
    ]
  },
  {
    "step": 51,
    "title": "おうぎ形の弧の長さと面積の公式",
    "narration": [
      "おうぎ形の弧の長さは、円周×(中心角/360)で求められます。",
      "おうぎ形の面積は、円の面積×(中心角/360)で求められます。",
      "中心角が大きくなるほど、弧の長さも面積も大きくなります。"
    ],
    "animation": {
      "type": "shape",
      "params": {
        "kind": "circle",
        "caption": "おうぎ形(中心角と弧の関係)"
      },
      "controls": [
        {
          "id": "s",
          "label": "円の半径",
          "min": 30,
          "max": 90,
          "step": 5,
          "def": 60
        }
      ]
    },
    "check": {
      "id": "math-51-check",
      "label": "確認問題",
      "prompt": "おうぎ形の弧の長さを求める公式はどれですか？(半径r、中心角a°)",
      "options": [
        {
          "id": "math-51-check-0",
          "text": "2πr × a/360",
          "correct": true
        },
        {
          "id": "math-51-check-1",
          "text": "πr² × a/360",
          "correct": false
        },
        {
          "id": "math-51-check-2",
          "text": "2πr",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "弧の長さ=円周×(中心角÷360)=2πr×a/360です。"
    },
    "practice": [
      {
        "id": "math-51-practice-1",
        "label": "基礎",
        "prompt": "半径6cm、中心角120°のおうぎ形の弧の長さを求めなさい。(πを使う)",
        "options": [
          {
            "id": "math-51-practice-1-0",
            "text": "4π cm",
            "correct": true
          },
          {
            "id": "math-51-practice-1-1",
            "text": "2π cm",
            "correct": false
          },
          {
            "id": "math-51-practice-1-2",
            "text": "12π cm",
            "correct": false
          },
          {
            "id": "math-51-practice-1-3",
            "text": "6π cm",
            "correct": false
          }
        ],
        "hints": [
          "2πr×a/360に数を当てはめます。",
          "2π×6×120/360です。",
          "12π×1/3=4πです。"
        ],
        "explanation": "正解！ 4π cmです。"
      },
      {
        "id": "math-51-practice-2",
        "label": "標準",
        "prompt": "半径9cm、中心角60°のおうぎ形の面積を求めなさい。",
        "options": [
          {
            "id": "math-51-practice-2-0",
            "text": "13.5π cm²",
            "correct": true
          },
          {
            "id": "math-51-practice-2-1",
            "text": "27π cm²",
            "correct": false
          },
          {
            "id": "math-51-practice-2-2",
            "text": "9π cm²",
            "correct": false
          },
          {
            "id": "math-51-practice-2-3",
            "text": "40.5π cm²",
            "correct": false
          }
        ],
        "hints": [
          "πr²×a/360に数を当てはめます。",
          "π×81×60/360です。",
          "81π×1/6=13.5πです。"
        ],
        "explanation": "正解！ 13.5π cm²です。"
      },
      {
        "id": "math-51-practice-3",
        "label": "発展",
        "prompt": "半径5cmのおうぎ形の弧の長さが4πcmであるとき、中心角を求めなさい。",
        "options": [
          {
            "id": "math-51-practice-3-0",
            "text": "144度",
            "correct": true
          },
          {
            "id": "math-51-practice-3-1",
            "text": "72度",
            "correct": false
          },
          {
            "id": "math-51-practice-3-2",
            "text": "180度",
            "correct": false
          },
          {
            "id": "math-51-practice-3-3",
            "text": "90度",
            "correct": false
          }
        ],
        "hints": [
          "2π×5×a/360=4πとおきます。",
          "10a/360=4です。",
          "a=4×360÷10=144です。"
        ],
        "explanation": "正解！ 144度です。"
      }
    ]
  },
  {
    "step": 52,
    "title": "相似を使って直接測れない高さ・距離を求める",
    "narration": [
      "同じ時刻の光(太陽光など)は、どの物体に対しても同じ角度で当たります。",
      "そのため、棒とその影、木とその影は相似な直角三角形になります。",
      "縮図を利用すれば、縮尺をかけて実際の距離を求めることができます。"
    ],
    "animation": {
      "type": "ratio",
      "params": {
        "labelA": "棒の高さと影",
        "labelB": "木の高さと影",
        "baseA": 15
      },
      "controls": [
        {
          "id": "scale",
          "label": "影の比率",
          "min": 0.5,
          "max": 3,
          "step": 0.1,
          "def": 1.5
        }
      ]
    },
    "check": {
      "id": "math-52-check",
      "label": "確認問題",
      "prompt": "木の高さを影の長さと相似を利用して求める方法の基本的な考え方はどれですか？",
      "options": [
        {
          "id": "math-52-check-0",
          "text": "同じ時刻の影は光源からの角度が同じなので相似な三角形ができる",
          "correct": true
        },
        {
          "id": "math-52-check-1",
          "text": "影の長さは常に物の高さと同じ",
          "correct": false
        },
        {
          "id": "math-52-check-2",
          "text": "太陽の位置は関係ない",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "同じ時刻の影は同じ角度で作られるため、相似な三角形が利用できます。"
    },
    "practice": [
      {
        "id": "math-52-practice-1",
        "label": "基礎",
        "prompt": "高さ1.5mの棒の影が2mで、同じ時刻の木の影が10mのとき、木の高さを求めなさい。",
        "options": [
          {
            "id": "math-52-practice-1-0",
            "text": "7.5m",
            "correct": true
          },
          {
            "id": "math-52-practice-1-1",
            "text": "13.3m",
            "correct": false
          },
          {
            "id": "math-52-practice-1-2",
            "text": "6.7m",
            "correct": false
          },
          {
            "id": "math-52-practice-1-3",
            "text": "15m",
            "correct": false
          }
        ],
        "hints": [
          "棒の高さ:影=木の高さ:影 の比を使います。",
          "1.5:2=h:10です。",
          "h=1.5×10÷2=7.5mです。"
        ],
        "explanation": "正解！ 7.5mです。"
      },
      {
        "id": "math-52-practice-2",
        "label": "標準",
        "prompt": "縮図を利用して、実際の距離が地図上2cmで縮尺1:5000のとき、実際の距離を求めなさい。",
        "options": [
          {
            "id": "math-52-practice-2-0",
            "text": "100m",
            "correct": true
          },
          {
            "id": "math-52-practice-2-1",
            "text": "50m",
            "correct": false
          },
          {
            "id": "math-52-practice-2-2",
            "text": "200m",
            "correct": false
          },
          {
            "id": "math-52-practice-2-3",
            "text": "10m",
            "correct": false
          }
        ],
        "hints": [
          "2cm×5000を計算します。",
          "10000cmになります。",
          "100mです。"
        ],
        "explanation": "正解！ 100mです。"
      },
      {
        "id": "math-52-practice-3",
        "label": "発展",
        "prompt": "ある塔から20m離れた地点で、相似な模型(高さ3cm,底辺4cm)を使って測定したところ、模型に対応する実際の底辺が20mだった。塔の高さ(目の高さ1.5mを加えた値)を求めなさい。",
        "options": [
          {
            "id": "math-52-practice-3-0",
            "text": "16.5m",
            "correct": true
          },
          {
            "id": "math-52-practice-3-1",
            "text": "15m",
            "correct": false
          },
          {
            "id": "math-52-practice-3-2",
            "text": "20m",
            "correct": false
          },
          {
            "id": "math-52-practice-3-3",
            "text": "26.7m",
            "correct": false
          }
        ],
        "hints": [
          "3:4=h:20の比を使います。",
          "h=3×20÷4=15mです。",
          "目の高さ1.5mを加えて16.5mです。"
        ],
        "explanation": "正解！ 16.5mです。"
      }
    ]
  },
  {
    "step": 53,
    "title": "1次関数と2次関数が混ざった総合問題",
    "narration": [
      "放物線と直線が組み合わされた問題では、まず交点の座標を求めることが基本です。",
      "2点を通る直線の式は、傾きの公式を使って求められます。",
      "座標が分かれば、図形の面積や長さなど、さまざまな値を計算できます。"
    ],
    "animation": {
      "type": "graph",
      "params": {
        "kind": "quadratic",
        "scale": 40
      },
      "controls": [
        {
          "id": "a",
          "label": "a の値",
          "min": -3,
          "max": 3,
          "step": 0.5,
          "def": 1
        }
      ]
    },
    "check": {
      "id": "math-53-check",
      "label": "確認問題",
      "prompt": "放物線と直線が組み合わされた融合問題で、最初に求めるべきものは何ですか？",
      "options": [
        {
          "id": "math-53-check-0",
          "text": "交点の座標",
          "correct": true
        },
        {
          "id": "math-53-check-1",
          "text": "グラフの色",
          "correct": false
        },
        {
          "id": "math-53-check-2",
          "text": "式の長さ",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "交点の座標を求めることが融合問題を解く第一歩です。"
    },
    "practice": [
      {
        "id": "math-53-practice-1",
        "label": "基礎",
        "prompt": "直線y=2x+1と放物線y=x²の交点のx座標を求めなさい。",
        "options": [
          {
            "id": "math-53-practice-1-0",
            "text": "x=1±√2",
            "correct": true
          },
          {
            "id": "math-53-practice-1-1",
            "text": "x=1±2",
            "correct": false
          },
          {
            "id": "math-53-practice-1-2",
            "text": "x=2±1",
            "correct": false
          },
          {
            "id": "math-53-practice-1-3",
            "text": "x=±1",
            "correct": false
          }
        ],
        "hints": [
          "x²=2x+1とおきます。",
          "x²-2x-1=0です。",
          "解の公式でx=1±√2です。"
        ],
        "explanation": "正解！ x=1±√2です。"
      },
      {
        "id": "math-53-practice-2",
        "label": "標準",
        "prompt": "2点A(1,1),B(3,9)が放物線y=x²上にあるとき、直線ABの傾きを求めなさい。",
        "options": [
          {
            "id": "math-53-practice-2-0",
            "text": "4",
            "correct": true
          },
          {
            "id": "math-53-practice-2-1",
            "text": "8",
            "correct": false
          },
          {
            "id": "math-53-practice-2-2",
            "text": "2",
            "correct": false
          },
          {
            "id": "math-53-practice-2-3",
            "text": "9",
            "correct": false
          }
        ],
        "hints": [
          "傾き=(9-1)÷(3-1)です。",
          "8÷2です。",
          "4です。"
        ],
        "explanation": "正解！ 4です。"
      },
      {
        "id": "math-53-practice-3",
        "label": "発展",
        "prompt": "放物線y=x²上の2点A(-1,1),B(2,4)と、直線ABに平行で原点を通る直線の式を求めなさい。",
        "options": [
          {
            "id": "math-53-practice-3-0",
            "text": "y=x",
            "correct": true
          },
          {
            "id": "math-53-practice-3-1",
            "text": "y=x+2",
            "correct": false
          },
          {
            "id": "math-53-practice-3-2",
            "text": "y=2x",
            "correct": false
          },
          {
            "id": "math-53-practice-3-3",
            "text": "y=-x",
            "correct": false
          }
        ],
        "hints": [
          "直線ABの傾きを求めます。(4-1)÷(2-(-1))=1です。",
          "原点を通るので切片は0です。",
          "y=xです。"
        ],
        "explanation": "正解！ y=xです。"
      }
    ]
  },
  {
    "step": 54,
    "title": "入試でよく出る整数の証明パターン",
    "narration": [
      "「連続する整数の積は偶数になる」など、整数の性質はパターンで覚えると強力です。",
      "3桁の整数を100a+10b+cのように位ごとに文字で表すと、倍数の証明がしやすくなります。",
      "素数を使った証明では、具体的な数を当てはめて確認する練習も効果的です。"
    ],
    "animation": {
      "type": "integerGrid",
      "params": {
        "rangeMax": 40,
        "rule": "multiple"
      },
      "controls": [
        {
          "id": "n",
          "label": "何の倍数?",
          "min": 2,
          "max": 9,
          "step": 1,
          "def": 3
        }
      ]
    },
    "check": {
      "id": "math-54-check",
      "label": "確認問題",
      "prompt": "nを整数とするとき、n²-nが常に偶数になることを示す式の変形として正しいものはどれですか？",
      "options": [
        {
          "id": "math-54-check-0",
          "text": "n(n-1)となり連続2整数の積だから必ず偶数",
          "correct": true
        },
        {
          "id": "math-54-check-1",
          "text": "2n-1となり奇数",
          "correct": false
        },
        {
          "id": "math-54-check-2",
          "text": "n²のみを考えればよい",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "n²-n=n(n-1)は連続する2整数の積なので必ず偶数です。"
    },
    "practice": [
      {
        "id": "math-54-practice-1",
        "label": "基礎",
        "prompt": "3桁の整数で、各位の数の和が3の倍数ならば、その整数自体も3の倍数になる。100a+10b+cを使ってこれを示す式変形として正しいものはどれですか？",
        "options": [
          {
            "id": "math-54-practice-1-0",
            "text": "9(11a+b)+(a+b+c)と変形でき、(a+b+c)が3の倍数なら全体も3の倍数",
            "correct": true
          },
          {
            "id": "math-54-practice-1-1",
            "text": "100a+10b+cのままでは何も言えない",
            "correct": false
          },
          {
            "id": "math-54-practice-1-2",
            "text": "a+b+cを無視してよい",
            "correct": false
          }
        ],
        "hints": [
          "100a+10b+cを99a+9b+(a+b+c)に分けます。",
          "99a+9b=9(11a+b)とくくれます。",
          "残りの(a+b+c)が3の倍数なら全体も3の倍数です。"
        ],
        "explanation": "正解！ 9(11a+b)+(a+b+c)の形に変形できます。"
      },
      {
        "id": "math-54-practice-2",
        "label": "標準",
        "prompt": "pを素数とするとき、p²+p+1の値について、p=2のときの値を求めなさい。",
        "options": [
          {
            "id": "math-54-practice-2-0",
            "text": "7(奇数)",
            "correct": true
          },
          {
            "id": "math-54-practice-2-1",
            "text": "6(偶数)",
            "correct": false
          },
          {
            "id": "math-54-practice-2-2",
            "text": "8(偶数)",
            "correct": false
          },
          {
            "id": "math-54-practice-2-3",
            "text": "5(奇数だが誤り)",
            "correct": false
          }
        ],
        "hints": [
          "p=2を代入します。",
          "4+2+1です。",
          "7になります。"
        ],
        "explanation": "正解！ 7(奇数)です。"
      },
      {
        "id": "math-54-practice-3",
        "label": "発展",
        "prompt": "3辺の長さが3、4、5の三角形について、3²+4²=5²が成り立つか確かめなさい。",
        "options": [
          {
            "id": "math-54-practice-3-0",
            "text": "3²+4²=5²が成り立つ(ピタゴラス数)",
            "correct": true
          },
          {
            "id": "math-54-practice-3-1",
            "text": "3²+4²=5²は成り立たない",
            "correct": false
          },
          {
            "id": "math-54-practice-3-2",
            "text": "3²+4²は偶数にしかならない",
            "correct": false
          }
        ],
        "hints": [
          "3²=9, 4²=16を計算します。",
          "9+16=25です。",
          "5²=25なので成り立ちます。"
        ],
        "explanation": "正解！ 3²+4²=5²が成り立ちます。"
      }
    ]
  },
  {
    "step": 55,
    "title": "入試総合問題の解き方（図形×関数×文章題）",
    "narration": [
      "入試の総合問題は、図形・関数・文章題の知識が組み合わさって出題されます。",
      "問題文を読んだら、まず図や式に情報を整理することが大切です。",
      "これまで学んだ55段階の知識を総動員して、最後の総合演習に挑戦しましょう！"
    ],
    "animation": {
      "type": "graph",
      "params": {
        "kind": "quadratic",
        "scale": 40
      },
      "controls": [
        {
          "id": "a",
          "label": "a の値",
          "min": -3,
          "max": 3,
          "step": 0.5,
          "def": 1
        }
      ]
    },
    "check": {
      "id": "math-55-check",
      "label": "確認問題",
      "prompt": "入試の総合問題を解くときに最も大切な手順はどれですか？",
      "options": [
        {
          "id": "math-55-check-0",
          "text": "問題文を図や式に整理してから解く",
          "correct": true
        },
        {
          "id": "math-55-check-1",
          "text": "公式をすべて暗記していれば図は不要",
          "correct": false
        },
        {
          "id": "math-55-check-2",
          "text": "難しい問題から先に手を付ける",
          "correct": false
        }
      ],
      "hints": [],
      "explanation": "図や式に整理することで、どの知識を使うべきかが見えてきます。"
    },
    "practice": [
      {
        "id": "math-55-practice-1",
        "label": "基礎",
        "prompt": "関数y=x²のグラフ上に点A(2,4)がある。原点Oとの距離OAを求めなさい。",
        "options": [
          {
            "id": "math-55-practice-1-0",
            "text": "2√5",
            "correct": true
          },
          {
            "id": "math-55-practice-1-1",
            "text": "4√2",
            "correct": false
          },
          {
            "id": "math-55-practice-1-2",
            "text": "20",
            "correct": false
          },
          {
            "id": "math-55-practice-1-3",
            "text": "6",
            "correct": false
          }
        ],
        "hints": [
          "三平方の定理を使います。",
          "OA²=2²+4²=4+16=20です。",
          "√20=2√5です。"
        ],
        "explanation": "正解！ 2√5です。"
      },
      {
        "id": "math-55-practice-2",
        "label": "標準",
        "prompt": "縦20cm、横30cmの長方形の紙の四隅から1辺xcmの正方形を切り取り、ふたのない箱を作る。底面積を文字式で表しなさい。",
        "options": [
          {
            "id": "math-55-practice-2-0",
            "text": "(20-2x)(30-2x)",
            "correct": true
          },
          {
            "id": "math-55-practice-2-1",
            "text": "20×30-x²",
            "correct": false
          },
          {
            "id": "math-55-practice-2-2",
            "text": "(20-x)(30-x)",
            "correct": false
          },
          {
            "id": "math-55-practice-2-3",
            "text": "4x²",
            "correct": false
          }
        ],
        "hints": [
          "四隅から切り取ると、縦横それぞれ2xずつ短くなります。",
          "縦は20-2x、横は30-2xになります。",
          "底面積=縦×横です。"
        ],
        "explanation": "正解！ (20-2x)(30-2x)です。"
      },
      {
        "id": "math-55-practice-3",
        "label": "発展",
        "prompt": "直角三角形の直角をはさむ2辺の比が3:4で、斜辺が20cmであるとき、2辺の長さをそれぞれ求めなさい。(3:4:5の相似を利用)",
        "options": [
          {
            "id": "math-55-practice-3-0",
            "text": "12cmと16cm",
            "correct": true
          },
          {
            "id": "math-55-practice-3-1",
            "text": "15cmと20cm",
            "correct": false
          },
          {
            "id": "math-55-practice-3-2",
            "text": "9cmと12cm",
            "correct": false
          },
          {
            "id": "math-55-practice-3-3",
            "text": "6cmと8cm",
            "correct": false
          }
        ],
        "hints": [
          "3:4:5の直角三角形の相似形と考えます。",
          "斜辺20は5の何倍か考えます。(20÷5=4倍)",
          "3×4=12cm, 4×4=16cmです。"
        ],
        "explanation": "正解！ 12cmと16cmです。"
      }
    ]
  }
]
