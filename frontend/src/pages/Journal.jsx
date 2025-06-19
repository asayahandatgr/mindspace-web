import { useState } from 'react'

function Journal() {
  const [entries, setEntries] = useState([
    {
      id: 1,
      date: '2024-02-20',
      content: 'Today was a productive day. I felt more focused and accomplished my goals.',
      mood: 'happy'
    },
    {
      id: 2,
      date: '2024-02-19',
      content: 'Feeling a bit anxious about the upcoming presentation, but I know I can handle it.',
      mood: 'anxious'
    }
  ])

  const [newEntry, setNewEntry] = useState({
    content: '',
    mood: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const entry = {
      id: entries.length + 1,
      date: new Date().toISOString().split('T')[0],
      content: newEntry.content,
      mood: newEntry.mood
    }
    setEntries([entry, ...entries])
    setNewEntry({ content: '', mood: '' })
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setNewEntry(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const getMoodEmoji = (mood) => {
    const emojis = {
      happy: '😊',
      calm: '😌',
      neutral: '😐',
      anxious: '😰',
      sad: '😢'
    }
    return emojis[mood] || '😐'
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* New Entry Form */}
      <section className="bg-white rounded-xl p-6 shadow-lg">
        <h2 className="text-2xl font-bold mb-6">New Journal Entry</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="mood" className="block text-sm font-medium text-gray-700 mb-2">
              How are you feeling?
            </label>
            <select
              id="mood"
              name="mood"
              value={newEntry.mood}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              required
            >
              <option value="">Select your mood</option>
              <option value="happy">😊 Happy</option>
              <option value="calm">😌 Calm</option>
              <option value="neutral">😐 Neutral</option>
              <option value="anxious">😰 Anxious</option>
              <option value="sad">😢 Sad</option>
            </select>
          </div>
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Write your thoughts
            </label>
            <textarea
              id="content"
              name="content"
              value={newEntry.content}
              onChange={handleChange}
              rows="6"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="How was your day? What's on your mind?"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition duration-300"
          >
            Save Entry
          </button>
        </form>
      </section>

      {/* Journal Entries List */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold mb-6">Previous Entries</h2>
        {entries.map(entry => (
          <div key={entry.id} className="bg-white rounded-xl p-6 shadow-lg">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                <h3 className="text-lg font-semibold capitalize">{entry.mood}</h3>
              </div>
              <span className="text-sm text-gray-500">{entry.date}</span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{entry.content}</p>
          </div>
        ))}
      </section>
    </div>
  )
}

export default Journal 