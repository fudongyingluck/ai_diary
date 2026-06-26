let _db = null
function db() {
  if (!_db) _db = wx.cloud.database()
  return _db
}

// ---- Tags ----

async function getTags(includeArchived) {
  const query = includeArchived
    ? db().collection('tags')
    : db().collection('tags').where({ archived: false })
  const res = await query.orderBy('createdAt', 'asc').get()
  return res.data
}

async function addTag(tag) {
  const res = await db().collection('tags').add({
    data: {
      name: tag.name,
      icon: tag.icon,
      params: tag.params || [],
      archived: false,
      createdAt: db().serverDate()
    }
  })
  return res._id
}

async function deleteTag(tagId) {
  await db().collection('tags').doc(tagId).remove()
}

async function isTagUsed(tagId) {
  const res = await db().collection('fragments')
    .where({ 'tags.tagId': tagId })
    .count()
  return res.total > 0
}

async function updateTagOptions(tagId, paramIndex, newOption) {
  const _ = db().command
  const updateKey = `params.${paramIndex}.options`
  await db().collection('tags').doc(tagId).update({
    data: { [updateKey]: _.push([newOption]) }
  })
}

// ---- Fragments ----

async function getFragmentsByDate(date) {
  const res = await db().collection('fragments')
    .where({ date })
    .orderBy('datetime', 'asc')
    .get()
  return res.data
}

async function getRecentFragments(limit) {
  limit = limit || 20
  const res = await db().collection('fragments')
    .orderBy('datetime', 'desc')
    .limit(limit)
    .get()
  return res.data
}

async function getFragmentsByDateRange(startDate, endDate) {
  const _ = db().command
  const res = await db().collection('fragments')
    .where({ date: _.gte(startDate).and(_.lte(endDate)) })
    .orderBy('datetime', 'asc')
    .get()
  return res.data
}

async function addFragment(frag) {
  const dateObj = new Date(frag.date.replace(/-/g, '/'))
  let datetime = dateObj
  if (frag.time) {
    const parts = frag.time.split(':')
    datetime = new Date(dateObj)
    datetime.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0)
  }

  const res = await db().collection('fragments').add({
    data: {
      date: frag.date,
      time: frag.time || null,
      datetime: datetime,
      mood: frag.mood || null,
      content: frag.content || '',
      tags: frag.tags || [],
      createdAt: db().serverDate(),
      updatedAt: db().serverDate()
    }
  })
  return res._id
}

async function updateFragment(fragId, data) {
  const updateData = { updatedAt: db().serverDate() }
  if (data.mood !== undefined) updateData.mood = data.mood
  if (data.content !== undefined) updateData.content = data.content
  if (data.tags !== undefined) updateData.tags = data.tags
  if (data.date !== undefined) {
    updateData.date = data.date
    const dateObj = new Date(data.date.replace(/-/g, '/'))
    let datetime = dateObj
    if (data.time) {
      const parts = data.time.split(':')
      datetime = new Date(dateObj)
      datetime.setHours(parseInt(parts[0]), parseInt(parts[1]), 0, 0)
    }
    updateData.datetime = datetime
    updateData.time = data.time || null
  } else if (data.time !== undefined) {
    updateData.time = data.time || null
  }

  await db().collection('fragments').doc(fragId).update({ data: updateData })
}

async function deleteFragment(fragId) {
  await db().collection('fragments').doc(fragId).remove()
}

async function getMonthMoods(year, month) {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const endDay = new Date(year, month + 1, 0).getDate()
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`

  const fragments = await getFragmentsByDateRange(startDate, endDate)
  const moodMap = {}
  fragments.forEach(f => {
    if (!moodMap[f.date]) moodMap[f.date] = []
    if (f.mood) moodMap[f.date].push(f.mood)
  })

  const result = {}
  Object.keys(moodMap).forEach(date => {
    const moods = moodMap[date]
    result[date] = moods.reduce((a, b) => a + b, 0) / moods.length
  })
  return result
}

async function getAllFragments() {
  const MAX = 100
  let all = []
  let skip = 0
  while (true) {
    const res = await db().collection('fragments')
      .orderBy('datetime', 'asc')
      .skip(skip)
      .limit(MAX)
      .get()
    all = all.concat(res.data)
    if (res.data.length < MAX) break
    skip += MAX
  }
  return all
}

module.exports = {
  db,
  getTags,
  addTag,
  deleteTag,
  isTagUsed,
  updateTagOptions,
  getFragmentsByDate,
  getRecentFragments,
  getFragmentsByDateRange,
  addFragment,
  updateFragment,
  deleteFragment,
  getMonthMoods,
  getAllFragments
}
