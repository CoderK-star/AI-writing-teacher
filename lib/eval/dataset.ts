import type { EvalCase } from '@/lib/types';

/**
 * 評価テストケースデータセット。
 * docs/evaluation-rubric.md の5ケースを構造化し、追加ケースで計10件を定義する。
 */
export const evalDataset: EvalCase[] = [
  // ── ルーブリック文書の5初期テストケース ──────────────────────────

  {
    id: 'tc-01',
    name: '冒頭が説明っぽい',
    input: {
      mode: 'lecture',
      messages: [
        {
          role: 'user',
          content:
            '冒頭で世界観の説明を書いているのですが、読み手が入ってきてくれない気がします。最初の段落をどう改善すれば良いですか？',
        },
      ],
    },
    expectedTraits: {
      clarity: '初心者にも分かる言葉で、冒頭の改善方法が説明されている',
      actionability: '具体的な書き直しの方向性が1〜3つ示されている',
      beginnerFit: '否定的な断定でなく、改善可能な観点として伝えている',
      grounding: '教材の「冒頭では変化か疑問を置く」等の知識が活かされている',
      copyrightSafety: '特定作品の模倣指示がなく一般的な作法として説明している',
    },
  },

  {
    id: 'tc-02',
    name: 'キャラの差が出ない',
    input: {
      mode: 'lecture',
      messages: [
        {
          role: 'user',
          content:
            '登場人物が3人いるのに、会話を読んでも誰が話しているか分かりにくいと言われました。キャラクターの差を出すにはどうすればいいですか？',
        },
      ],
    },
    expectedTraits: {
      clarity: '口調・語尾・話す長さなど具体的な差別化手段が説明されている',
      actionability: 'すぐ試せる方法が提示されている',
      beginnerFit: '初心者を萎縮させない優しい言い回しになっている',
      grounding: '教材の「会話文は情報より声の違いを出す」が反映されている',
      copyrightSafety: '特定キャラや作品の模倣ではなく抽象的な手法として説明している',
    },
  },

  {
    id: 'tc-03',
    name: '会話が不自然',
    input: {
      mode: 'revision',
      messages: [
        {
          role: 'user',
          content:
            '以下の会話文を改善してください。\n「田中さん、あなたはご存知ですか？この村では百年前から幽霊が出ると言われており、その原因は先代村長の不正にあるのです」',
        },
      ],
    },
    expectedTraits: {
      clarity: '何が不自然かが分かりやすく説明されている',
      actionability: '改善後の会話文が実際に出力されている',
      beginnerFit: '原文の問題を責めず改善点として伝えている',
      grounding: '情報の一気出しを避ける教材知識が活かされている',
      copyrightSafety: '特定作品のスタイル模倣を求めていないし応答もしていない',
    },
  },

  {
    id: 'tc-04',
    name: '中盤がだれる',
    input: {
      mode: 'plot',
      messages: [
        {
          role: 'user',
          content:
            '主人公が目的地を目指して旅をしている話なのですが、第2章から第4章にかけてダレてしまいます。どうすれば緊張感を保てますか？',
        },
      ],
    },
    expectedTraits: {
      clarity: '中盤のだれを防ぐ理由と手法が明確に説明されている',
      actionability: '第2〜4章に何を入れればよいか具体案がある',
      beginnerFit: '問題を断定せず、解決策として提示している',
      grounding: '教材の「中盤では選択か代償を入れる」が活かされている',
      copyrightSafety: '具体的な実在作品の構成コピーを勧めていない',
    },
  },

  {
    id: 'tc-05',
    name: '短編のオチが弱い',
    input: {
      mode: 'plot',
      messages: [
        {
          role: 'user',
          content: '3000字の短編小説を書いたのですが、友人から「オチが弱い」と言われました。短編の結末はどう作れば良いですか？',
        },
      ],
    },
    expectedTraits: {
      clarity: '短編のオチに必要な要素が分かりやすく説明されている',
      actionability: 'オチを強化するための具体的な手法が示されている',
      beginnerFit: '「弱い」という批評に寄り添いながら前向きに指導している',
      grounding: '物語の転換点や選択に関する知識が回答に反映されている',
      copyrightSafety: '実在する短編のオチを模倣するよう促していない',
    },
  },

  // ── 追加テストケース ──────────────────────────────────────

  {
    id: 'tc-06',
    name: '感情の説明過多',
    input: {
      mode: 'revision',
      messages: [
        {
          role: 'user',
          content:
            '以下の文を改善してください。\n「彼女はとても悲しかった。悲しみで胸が痛く、もう何もしたくなかった。本当に悲しかったのだ。」',
        },
      ],
    },
    expectedTraits: {
      clarity: '説明から描写への切り替え方が説明されている',
      actionability: '改善後の文が実際に出力されている',
      beginnerFit: '原文を否定せずに改善観点として伝えている',
      grounding: '「説明と描写の比率」教材が反映されている',
      copyrightSafety: '著作権的に問題のある内容が含まれていない',
    },
  },

  {
    id: 'tc-07',
    name: '推敲の進め方が分からない',
    input: {
      mode: 'lecture',
      messages: [
        {
          role: 'user',
          content: '書き上げた後の推敲のやり方が分かりません。どこから手をつければいいですか？',
        },
      ],
    },
    expectedTraits: {
      clarity: '推敲の手順がステップで分かりやすく説明されている',
      actionability: '最初にやること・次にやることが明確に示されている',
      beginnerFit: '圧迫感なく段階的なアドバイスになっている',
      grounding: '「推敲では一度に一つの観点だけを見る」教材が活かされている',
      copyrightSafety: '著作権的に問題のある内容が含まれていない',
    },
  },

  {
    id: 'tc-08',
    name: 'シーンに目的がない',
    input: {
      mode: 'lecture',
      messages: [
        {
          role: 'user',
          content:
            '書いているうちに、なんとなく出来事を並べているだけになっている気がします。面白いシーンにするにはどうすればいいですか？',
        },
      ],
    },
    expectedTraits: {
      clarity: 'シーンに目的・障害を設定する概念が分かりやすく説明されている',
      actionability: 'シーンを見直すための具体的な質問や手順が示されている',
      beginnerFit: '否定せずに「こうすると良くなる」という前向きな表現になっている',
      grounding: '「シーンごとに目的を置く」教材が反映されている',
      copyrightSafety: '著作権的に問題のある内容が含まれていない',
    },
  },

  {
    id: 'tc-09',
    name: 'プロットの転換点が作れない',
    input: {
      mode: 'plot',
      messages: [
        {
          role: 'user',
          content: '物語の転換点をどこに置けばいいか分かりません。起承転結の「転」はどう作ればいいですか？',
        },
      ],
    },
    expectedTraits: {
      clarity: '転換点の役割と作り方が分かりやすく説明されている',
      actionability: '転を作るための具体的なパターンや問いかけが示されている',
      beginnerFit: '初心者を萎縮させない丁寧な説明になっている',
      grounding: '教材の「中盤では選択か代償を入れる」が反映されている',
      copyrightSafety: '実在作品の転換点の完全模倣を勧めていない',
    },
  },

  {
    id: 'tc-10',
    name: '視点が混乱している',
    input: {
      mode: 'revision',
      messages: [
        {
          role: 'user',
          content:
            '「太郎は花子が悲しんでいるのが分かった。花子の心の中は嵐のようだった。」という文章で視点がおかしいと言われました。どう直せばいいですか？',
        },
      ],
    },
    expectedTraits: {
      clarity: '視点の問題が何かが明確に説明されている',
      actionability: '修正案または修正後の文が具体的に示されている',
      beginnerFit: '間違いを責めずに改善方法を優しく伝えている',
      grounding: '視点に関する教材知識が回答に活かされている',
      copyrightSafety: '著作権的に問題のある内容が含まれていない',
    },
  },
];
