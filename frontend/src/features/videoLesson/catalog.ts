import type { Subject, VideoStep } from './types.ts'

export const videoSteps: readonly VideoStep[] = [
  // 理科（中1理科・ぽにょんの中学理科あにめ！を参考に作成）
  { id: 1, subject: 'science', grade: '中1', unit: '身近な生物の観察とルーペの使い方', category: 'biology' },
  { id: 2, subject: 'science', grade: '中1', unit: '花のつくり（被子植物）', category: 'biology' },
  { id: 3, subject: 'science', grade: '中1', unit: 'マツのつくり（裸子植物）', category: 'biology' },
  { id: 4, subject: 'science', grade: '中1', unit: '単子葉類と双子葉類', category: 'biology' },

  // 英語（中1英語・ひとつひとつわかりやすくを参考に作成）
  { id: 1, subject: 'english', grade: '中1', unit: '「主語」と「動詞」とは？', category: 'grammar' },
  { id: 2, subject: 'english', grade: '中1', unit: '「be動詞」とは？', category: 'grammar' },
  { id: 3, subject: 'english', grade: '中1', unit: 'am, are, isの使い分け①', category: 'grammar' },
  { id: 4, subject: 'english', grade: '中1', unit: 'am, are, isの使い分け②', category: 'grammar' },

  // 国語（19ch.tv 文法を参考に単元のみ作成。動画素材は準備中）
  { id: 1, subject: 'japanese', grade: '中1', unit: '言葉の単位', category: 'grammar' },
  { id: 2, subject: 'japanese', grade: '中1', unit: '文節①', category: 'grammar' },
  { id: 3, subject: 'japanese', grade: '中1', unit: '文節②', category: 'grammar' },
  { id: 4, subject: 'japanese', grade: '中1', unit: '単語①', category: 'grammar' },

  // 社会（19ch.tv 歴史を参考に単元のみ作成。動画素材は準備中）
  { id: 1, subject: 'social', grade: '中1', unit: '人類の出現と進化', category: 'history' },
  { id: 2, subject: 'social', grade: '中1', unit: '四大文明①', category: 'history' },
  { id: 3, subject: 'social', grade: '中1', unit: '四大文明②', category: 'history' },
  { id: 4, subject: 'social', grade: '中1', unit: '縄文時代', category: 'history' },
]

export function stepsForSubject(subject: Subject): VideoStep[] {
  return videoSteps.filter(step => step.subject === subject)
}
