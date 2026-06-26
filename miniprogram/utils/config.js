module.exports = {
  CLOUD_ENV: 'cloudbase-d6glb6vib9fd20eb5',
  MAX_TAGS_PER_USER: 20,
  MAX_TAGS_PER_FRAGMENT: 5,
  MAX_CONTENT_LENGTH: 500,
  MOOD_MIN: 1,
  MOOD_MAX: 5,
  MOOD_EMOJI: ['', '\u{1F614}', '\u{1F615}', '\u{1F610}', '\u{1F642}', '\u{1F60C}'],
  MOOD_LABEL: ['', '很差', '较差', '一般', '较好', '很好'],
  DEFAULT_TAGS: [
    { name: '早起', icon: '\u{1F305}', params: [] },
    { name: '晚睡', icon: '\u{1F319}', params: [] },
    {
      name: '运动', icon: '\u{1F3C3}',
      params: [{ key: 'duration', label: '时长', type: 'number', unit: '分钟', required: false, options: [] }]
    },
    {
      name: '读书', icon: '\u{1F4D6}',
      params: [{ key: 'duration', label: '时长', type: 'number', unit: '分钟', required: false, options: [] }]
    },
    {
      name: '冲突', icon: '\u26A1',
      params: [{ key: 'object', label: '对象', type: 'text', unit: null, required: true, options: [] }]
    }
  ]
}
