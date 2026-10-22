import { useEffect, useMemo, useRef, useState } from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const taskProgressKey = (task, index) => `${index}:${task.title}`
function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function offsetDateKey(key, offset) {
  const date = new Date(`${key}T12:00:00`)
  date.setDate(date.getDate() + offset)
  return localDateKey(date)
}

const todayISO = () => localDateKey()
const DAILY_QUOTES = [
  'Start with the next small thing.',
  'A little progress still moves you forward.',
  'You do not need the whole plan figured out to begin.',
  'Make space for progress, not perfection.',
  'One finished task is proof you can keep going.',
  'Steady steps add up to meaningful change.',
  'Begin where you are. The next step is enough.',
  'A plan works best when it helps you start.',
  'Give your attention to one thing at a time.',
  'Today is a good day for one small win.',
]
const DEMO_CARDS = [
  { id: 'homework', mode: 'student', category: 'Homework', title: 'Biology worksheet', detail: 'Break a worksheet into a clear first step.', icon: '▤' },
  { id: 'assignment', mode: 'student', category: 'Assignment', title: 'History research paper', detail: 'Plan a paper with sources and a due date.', icon: '✎' },
  { id: 'test', mode: 'student', category: 'Test schedule', title: 'Chemistry midterm', detail: 'Turn topics into a focused study session.', icon: '◷' },
  { id: 'reading', mode: 'student', category: 'Reading list', title: 'Literature reading', detail: 'Make a reading deadline feel manageable.', icon: '⌑' },
  { id: 'project', mode: 'student', category: 'Group project', title: 'Science fair prototype', detail: 'Keep a team project and its dependencies clear.', icon: '◇' },
  { id: 'meeting', mode: 'professional', category: 'Meeting notes', title: 'Product sync follow-ups', detail: 'Turn decisions into owners and next steps.', icon: '◷' },
  { id: 'employee', mode: 'professional', category: 'Employee tracker', title: 'Team check-in tracker', detail: 'Track follow-ups and team 1:1s.', icon: '♧' },
  { id: 'project-work', mode: 'professional', category: 'Project work', title: 'Website launch checklist', detail: 'Sequence review, publishing, and launch work.', icon: '▦' },
  { id: 'follow-up', mode: 'professional', category: 'Follow-ups', title: 'Client follow-up list', detail: 'Keep replies and approvals moving.', icon: '↗' },
  { id: 'weekly', mode: 'universal', category: 'Weekly priorities', title: 'A bit of everything', detail: 'Mix study, work, and personal tasks.', icon: '✳' },
]

const iconMap = {
  leaf: '✳', home: '⌂', board: '▦', clock: '◷', settings: '⚙',
}

function Icon({ name, className = '' }) {
  return <span aria-hidden="true" className={`icon ${className}`}>{iconMap[name] || '·'}</span>
}

function formatDate(value, options = { month: 'short', day: 'numeric' }) {
  if (!value) return 'No date'
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, options)
}

function escapeICS(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replaceAll('\n', '\\n')
}

function download(name, content, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function App() {
  const [source, setSource] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [mode, setMode] = useState('student')
  const [date, setDate] = useState(todayISO())
  const [hours, setHours] = useState(3)
  const [plan, setPlan] = useState(null)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedRecentId, setSelectedRecentId] = useState(null)
  const [selectedRecentPlan, setSelectedRecentPlan] = useState(null)
  const [recentPlanLoading, setRecentPlanLoading] = useState(false)
  const [recentPlanError, setRecentPlanError] = useState('')
  const [health, setHealth] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [view, setView] = useState('planner')
  const [demoOpen, setDemoOpen] = useState(false)
  const [recentQuery, setRecentQuery] = useState('')
  const [elapsed, setElapsed] = useState(0)
  const [uploadHover, setUploadHover] = useState(false)
  const [useGemma, setUseGemma] = useState(true)
  const [completedTasks, setCompletedTasks] = useState(new Set())
  const [completionTimes, setCompletionTimes] = useState({})
  const [celebrating, setCelebrating] = useState(false)
  const [todayKey, setTodayKey] = useState(() => localDateKey())
  const fileRef = useRef(null)
  const demoCloseRef = useRef(null)
  const celebrationTimerRef = useRef(null)

  const grouped = useMemo(() => {
    const names = ['Do Today', 'This Week', 'Later', 'Needs clarification']
    return Object.fromEntries(names.map((name) => [name, plan?.tasks?.filter((task) => task.bucket === name) || []]))
  }, [plan])

  useEffect(() => {
    refreshHealth()
    refreshHistory()
  }, [])

  useEffect(() => {
    if (!busy) { setElapsed(0); return }
    const timer = window.setInterval(() => setElapsed((value) => value + 1), 1000)
    return () => window.clearInterval(timer)
  }, [busy])

  useEffect(() => {
    if (!demoOpen) return
    const dismissOnEscape = (event) => { if (event.key === 'Escape') setDemoOpen(false) }
    window.addEventListener('keydown', dismissOnEscape)
    demoCloseRef.current?.focus()
    return () => window.removeEventListener('keydown', dismissOnEscape)
  }, [demoOpen])

  useEffect(() => {
    if (!plan?.id) return
    try {
      const saved = JSON.parse(localStorage.getItem(`sloth-done-${plan.id}`) || '[]')
      // Migrate older title-based progress while using per-task keys so repeated titles stay distinct.
      const savedCompleted = Array.isArray(saved) ? saved : (saved.completed || [])
      const savedTimes = Array.isArray(saved) ? {} : (saved.completedAt || {})
      const isCurrentFormat = saved.version === 2
      const completed = isCurrentFormat
        ? savedCompleted
        : plan.tasks.flatMap((task, index) => savedCompleted.includes(task.title) ? [taskProgressKey(task, index)] : [])
      const times = isCurrentFormat
        ? savedTimes
        : Object.fromEntries(plan.tasks.flatMap((task, index) => savedTimes[task.title] ? [[taskProgressKey(task, index), savedTimes[task.title]]] : []))
      setCompletedTasks(new Set(completed))
      setCompletionTimes(times)
    } catch {
      setCompletedTasks(new Set())
      setCompletionTimes({})
    }
    setCelebrating(false)
    window.clearTimeout(celebrationTimerRef.current)
  }, [plan?.id])

  useEffect(() => () => window.clearTimeout(celebrationTimerRef.current), [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const nextDay = localDateKey()
      setTodayKey((current) => current === nextDay ? current : nextDay)
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  async function refreshHealth() {
    try {
      const response = await fetch(`${API}/api/health`)
      setHealth(await response.json())
    } catch {
      setHealth({ api: 'offline', ollama_available: false, model_installed: false })
    }
  }

  async function refreshHistory() {
    setHistoryLoading(true)
    try {
      const response = await fetch(`${API}/api/plans`)
      if (response.ok) setHistory(await response.json())
    } catch { /* the demo still works if the API has not started yet */ }
    finally { setHistoryLoading(false) }
  }

  function chooseFile(file) {
    if (!file) return
    const allowed = ['.txt', '.md', '.pdf']
    if (!allowed.some((ext) => file.name.toLowerCase().endsWith(ext))) {
      setError('Choose a .txt, .md, or PDF file.')
      return
    }
    setSelectedFile(file)
    setError('')
  }

  async function generate(sourceMode = 'gemma', demoType = 'homework') {
    if (sourceMode === 'gemma' && !useGemma) {
      setError('Turn on local Gemma to make a plan from your own text. The built-in demos work without AI.')
      return
    }
    setBusy(true)
    setError('')
    setToast('')
    try {
      const body = new FormData()
      body.set('current_date', date)
      body.set('available_hours', String(hours))
      body.set('user_mode', mode)
      body.set('source_mode', sourceMode)
      body.set('demo_type', demoType)
      body.set('text', source)
      if (selectedFile && sourceMode !== 'demo') body.set('upload', selectedFile)
      const response = await fetch(`${API}/api/plan`, { method: 'POST', body })
      const result = await response.json()
      if (!response.ok) throw new Error(result.detail || 'Could not create your plan.')
      setPlan(result)
      if (sourceMode === 'demo') {
        const demo = DEMO_CARDS.find((item) => item.id === demoType)
        const demoMode = demo?.mode === 'professional' ? 'professional' : demo?.mode || 'student'
        setMode(demoMode)
        const demoInputs = {
          homework: 'Biology worksheet: answer questions 1–12 on cell division. Due October 24, 2026. About 90 minutes.',
          assignment: 'History research paper on the Industrial Revolution. Due October 29, 2026. Write 1,500 words with four sources.',
          test: 'Chemistry midterm on October 27, 2026. Topics: bonding, reactions, stoichiometry. Study in four sessions.',
          reading: 'Read chapters 4–7 and bring three discussion questions to seminar on October 26, 2026.',
          project: 'Science fair prototype demo due November 3, 2026. Working sensor, 5-slide explanation, and practice run.',
          meeting: 'Product sync follow-ups: share roadmap recap, confirm onboarding copy, and schedule customer feedback review.',
          employee: 'Team check-in tracker: follow up on QA checklist, review analytics events, and book team 1:1s.',
          'project-work': 'Website launch: accessibility review by Oct 24, final copy by Oct 27, and launch Nov 2.',
          'follow-up': 'Client follow-ups: share revised estimate, send security questionnaire, and ask legal to approve terms.',
          weekly: 'This week: book a dentist appointment; finish the statistics assignment; prepare the Monday team update; plan two evening walks.',
        }
        setSource(demoInputs[demoType] || '')
        setDemoOpen(false)
      }
      setToast(sourceMode === 'demo' ? 'Demo plan ready. No model needed.' : 'Your plan is ready.')
      refreshHistory()
      window.setTimeout(() => setToast(''), 3600)
    } catch (err) {
      setError(err.message || 'Could not reach the planner API. Start the backend and try again.')
    } finally {
      setBusy(false)
    }
  }

  async function toggleRecentPlan(id) {
    if (selectedRecentId === id) {
      setSelectedRecentId(null)
      setSelectedRecentPlan(null)
      setRecentPlanError('')
      return
    }
    setSelectedRecentId(id)
    setSelectedRecentPlan(null)
    setRecentPlanError('')
    setRecentPlanLoading(true)
    try {
      const response = await fetch(`${API}/api/plans/${id}`)
      if (!response.ok) throw new Error('Could not load this plan’s details.')
      const saved = await response.json()
      setSelectedRecentPlan(saved)
    } catch (err) { setRecentPlanError(err.message) }
    finally { setRecentPlanLoading(false) }
  }

  function recentCompletion(item) {
    try {
      const saved = JSON.parse(localStorage.getItem(`sloth-done-${item.id}`) || '[]')
      const completed = Array.isArray(saved) ? saved : (saved.completed || [])
      const count = Math.min(item.task_count, new Set(completed).size)
      return { count, label: count >= item.task_count && item.task_count > 0 ? 'Completed' : count ? `${count}/${item.task_count} done` : 'Not started', complete: count >= item.task_count && item.task_count > 0 }
    } catch {
      return { count: 0, label: 'Not started', complete: false }
    }
  }

  function recentTaskCompleted(planDetails, task, index) {
    try {
      const saved = JSON.parse(localStorage.getItem(`sloth-done-${planDetails.id}`) || '[]')
      const completed = Array.isArray(saved) ? saved : (saved.completed || [])
      return saved.version === 2
        ? completed.includes(taskProgressKey(task, index))
        : completed.includes(task.title)
    } catch { return false }
  }

  function exportPlan(format) {
    if (!plan) return
    const basename = `deadline-sloth-${plan.current_date}`
    const tasksWithProgress = plan.tasks.map((task, index) => ({
      ...task,
      completed: completedTasks.has(taskProgressKey(task, index)),
      completed_at: completionTimes[taskProgressKey(task, index)] || null,
    }))
    if (format === 'json') download(`${basename}.json`, JSON.stringify({ ...plan, tasks: tasksWithProgress }, null, 2), 'application/json')
    if (format === 'csv') {
      const rows = [['Title', 'Type', 'Due date', 'Priority', 'Hours', 'Bucket', 'Next action', 'Completed', 'Completed at']]
      tasksWithProgress.forEach((t) => rows.push([t.title, t.type, t.due_date || '', t.priority, t.estimated_hours ?? '', t.bucket, t.next_action, t.completed ? 'Yes' : 'No', t.completed_at || '']))
      download(`${basename}.csv`, rows.map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n'), 'text/csv')
    }
    if (format === 'markdown') {
      const sections = ['Do Today', 'This Week', 'Later', 'Needs clarification']
      const lines = [`# Deadline Sloth plan — ${formatDate(plan.current_date, { year: 'numeric', month: 'long', day: 'numeric' })}`, '']
      sections.forEach((section) => {
        lines.push(`## ${section}`, '')
        const tasks = plan.tasks.map((task, index) => ({ task, index })).filter(({ task }) => task.bucket === section)
        if (!tasks.length) lines.push('_Nothing here._', '')
        tasks.forEach(({ task: t, index }) => {
          const key = taskProgressKey(t, index)
          lines.push(`- [${completedTasks.has(key) ? 'x' : ' '}] **${t.title}** — ${t.due_date ? formatDate(t.due_date) : 'date needed'} · ${t.priority} priority · ${t.estimated_hours ?? '?'}h${completionTimes[key] ? ` · completed ${new Date(completionTimes[key]).toLocaleString()}` : ''}`, `  Next: ${t.next_action}`)
        })
        lines.push('')
      })
      download(`${basename}.md`, lines.join('\n'), 'text/markdown')
    }
    if (format === 'ics') {
      const events = plan.tasks.map((task, index) => ({ task, index })).filter(({ task }) => task.due_date).map(({ task: t, index }) => {
        const day = t.due_date.replaceAll('-', '')
        const completedAt = completionTimes[taskProgressKey(t, index)]
        const completedStamp = completedAt ? `\r\nCOMPLETED:${new Date(completedAt).toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d+Z$/, 'Z')}` : ''
        const completionProperties = completedAt ? `\r\nX-DEADLINE-SLOTH-COMPLETED:TRUE${completedStamp ? `\r\nX-DEADLINE-SLOTH-COMPLETED-AT:${completedStamp.slice('\r\nCOMPLETED:'.length)}` : ''}` : ''
        return `BEGIN:VEVENT\r\nUID:${t.title.length}-${day}@deadline-sloth\r\nDTSTAMP:${new Date().toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d+Z$/, 'Z')}\r\nDTSTART;VALUE=DATE:${day}\r\nSUMMARY:${escapeICS(t.title)}\r\nDESCRIPTION:${escapeICS(t.next_action)}${completionProperties}\r\nSTATUS:CONFIRMED\r\nEND:VEVENT`
      })
      download(`${basename}.ics`, `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Deadline Sloth//Planner//EN\r\n${events.join('\r\n')}\r\nEND:VCALENDAR`, 'text/calendar')
    }
  }

  const urgentCount = plan?.tasks?.filter((t) => t.urgent || t.overdue).length || 0
  const totalHours = plan?.tasks?.reduce((sum, task) => sum + (task.estimated_hours || 0), 0) || 0
  const completedCount = plan?.tasks?.filter((task, index) => completedTasks.has(taskProgressKey(task, index))).length || 0
  const taskCount = plan?.tasks?.length || 0
  const allTasksComplete = taskCount > 0 && completedCount === taskCount
  const hasDueDates = Boolean(plan?.tasks?.some((task) => task.due_date))
  const finishedOnTime = allTasksComplete && hasDueDates && plan.tasks.every((task, index) => {
    if (!task.due_date) return true
    const completedAt = completionTimes[taskProgressKey(task, index)]
    return Boolean(completedAt && localDateKey(new Date(completedAt)) <= task.due_date)
  })
  const completedRecords = plan?.tasks?.map((task, index) => [taskProgressKey(task, index), task.title, completionTimes[taskProgressKey(task, index)]])
    .filter(([key, , completedAt]) => completedTasks.has(key) && completedAt)
    .sort((a, b) => new Date(b[2]).getTime() - new Date(a[2]).getTime()) || []
  const completedActivity = completedRecords.slice(0, 4)
  const activityByDay = completedRecords.reduce((counts, [, , completedAt]) => {
    const day = localDateKey(new Date(completedAt))
    counts[day] = (counts[day] || 0) + 1
    return counts
  }, {})
  const activeDays = [...new Set(completedRecords.map(([, , completedAt]) => localDateKey(new Date(completedAt))))].sort()
  const activeDaySet = new Set(activeDays)
  const streakStart = activeDaySet.has(todayKey) ? todayKey : activeDaySet.has(offsetDateKey(todayKey, -1)) ? offsetDateKey(todayKey, -1) : null
  let currentStreak = 0
  if (streakStart) {
    let day = streakStart
    while (activeDaySet.has(day)) {
      currentStreak += 1
      day = offsetDateKey(day, -1)
    }
  }
  let bestStreak = 0
  let runningStreak = 0
  let priorActiveDay = null
  activeDays.forEach((day) => {
    runningStreak = priorActiveDay && offsetDateKey(priorActiveDay, 1) === day ? runningStreak + 1 : 1
    bestStreak = Math.max(bestStreak, runningStreak)
    priorActiveDay = day
  })
  const weekActivity = Array.from({ length: 7 }, (_, index) => {
    const day = offsetDateKey(todayKey, index - 6)
    return { day, count: activityByDay[day] || 0, label: new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' }) }
  })
  const weekMax = Math.max(1, ...weekActivity.map((day) => day.count))
  const dayNumber = Math.floor(new Date(`${todayKey}T00:00:00`).getTime() / 86_400_000)
  const dailyQuote = DAILY_QUOTES[((dayNumber % DAILY_QUOTES.length) + DAILY_QUOTES.length) % DAILY_QUOTES.length]
  const dueDates = plan?.tasks?.map((task) => task.due_date).filter(Boolean).sort() || []
  const timeframeLabel = dueDates.length
    ? `${formatDate(plan.current_date)}${dueDates[dueDates.length - 1] !== plan.current_date ? ` – ${formatDate(dueDates[dueDates.length - 1])}` : ''}`
    : null
  const nextTask = plan?.tasks?.find((task, index) => !completedTasks.has(taskProgressKey(task, index)) && task.bucket === 'Do Today')
    || plan?.tasks?.find((task, index) => !completedTasks.has(taskProgressKey(task, index)) && task.bucket === 'This Week')
    || plan?.tasks?.find((task, index) => !completedTasks.has(taskProgressKey(task, index)))
  const filteredHistory = history.filter((item) => `${item.summary} ${item.current_date}`.toLowerCase().includes(recentQuery.toLowerCase()))

  function toggleTaskDone(task, index) {
    if (!plan?.id) return
    const key = taskProgressKey(task, index)
    const next = new Set(completedTasks)
    const nextTimes = { ...completionTimes }
    if (next.has(key)) {
      next.delete(key)
      delete nextTimes[key]
      setCelebrating(false)
    } else {
      next.add(key)
      nextTimes[key] = new Date().toISOString()
    }
    setCompletedTasks(next)
    setCompletionTimes(nextTimes)
    localStorage.setItem(`sloth-done-${plan.id}`, JSON.stringify({ version: 2, completed: [...next], completedAt: nextTimes }))
    const isNowComplete = plan.tasks.length > 0 && plan.tasks.every((task, taskIndex) => next.has(taskProgressKey(task, taskIndex)))
    if (isNowComplete) {
      setCelebrating(true)
      window.clearTimeout(celebrationTimerRef.current)
      celebrationTimerRef.current = window.setTimeout(() => setCelebrating(false), 4200)
    }
  }

  return (
    <div className="app-shell" data-theme={mode}>
      <aside className="sidebar">
        <a className="brand" href="#top" aria-label="Deadline Sloth home"><span className="brand-mark"><Icon name="leaf" /></span><span>deadline<span className="brand-light">sloth</span></span></a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="nav-list">
          <button className={`nav-item ${view === 'planner' ? 'active' : ''}`} onClick={() => setView('planner')}><Icon name="home" /> <span>Planner</span>{view === 'planner' && <span className="nav-dot" />}</button>
          <button className={`nav-item ${view === 'recent' ? 'active' : ''}`} onClick={() => { setView('recent'); refreshHistory() }}><Icon name="clock" /> <span>Recent plans</span><span className="nav-count">{history.length || '—'}</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-card"><div className="privacy-icon">⌁</div><div><strong>Your work stays yours</strong><p>Uploads are processed in memory, not saved.</p></div></div>
          <div className="profile-row"><div className="avatar">S</div><div className="profile-copy"><strong>Solo workspace</strong><span>Local planner</span></div><span className="more-dots">···</span></div>
        </div>
      </aside>

      <main className="main-area" id="top">
        <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{view === 'recent' ? 'Recent plans' : 'Planner'}</strong></div><div className="top-actions"><div className={`connection-pill ${health?.ollama_available && health?.model_installed ? 'connected' : ''}`}><span className="status-dot" />{health?.ollama_available ? health?.model_installed ? 'Gemma ready' : 'Ollama online · model missing' : 'Demo ready'}</div><button className="help-button" title="Help" aria-label="Help and run instructions" onClick={() => { setView('planner'); window.setTimeout(() => document.getElementById('run-help')?.scrollIntoView({ behavior: 'smooth' }), 0) }}>?</button></div></header>

        {view === 'recent' ? <div className="content-wrap recent-view">
          <section className="recent-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> YOUR WORK, SAVED</div><h1>Pick up where<br /><em>you left off.</em></h1><p className="hero-copy">Your latest plans are stored on this device.</p></div><button className="secondary-button" onClick={() => refreshHistory()} disabled={historyLoading}>{historyLoading ? 'Refreshing…' : '↻ Refresh'}</button></section>
          <section className="recent-card"><div className="recent-toolbar"><div><div className="section-kicker">RECENT PLANS</div><h2>{history.length} saved {history.length === 1 ? 'plan' : 'plans'}</h2></div><label className="search-field"><span aria-hidden="true">⌕</span><input value={recentQuery} onChange={(event) => setRecentQuery(event.target.value)} placeholder="Search plans" aria-label="Search recent plans" /></label></div>
            {historyLoading && !history.length ? <div className="recent-empty"><span className="loading-orbit" /><strong>Loading your plans…</strong></div> : filteredHistory.length ? <div className="recent-list">{filteredHistory.map((item) => {
              const completion = recentCompletion(item)
              const expanded = selectedRecentId === item.id
              return <article className={`recent-entry ${expanded ? 'expanded' : ''}`} key={item.id}>
                <button className="recent-item" aria-expanded={expanded} aria-controls={`recent-detail-${item.id}`} onClick={() => toggleRecentPlan(item.id)}>
                  <span className="recent-symbol">▤</span>
                  <span className="recent-item-copy"><strong>{item.summary}</strong><span>{formatDate(item.current_date, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · {item.task_count} {item.task_count === 1 ? 'task' : 'tasks'}</span></span>
                  <span className={`recent-status ${completion.complete ? 'complete' : ''}`}>{completion.complete && <b aria-hidden="true">✓</b>}{completion.label}</span>
                  <span className="recent-chevron" aria-hidden="true">{expanded ? '−' : '+'}</span>
                </button>
                {expanded && <div className="recent-detail" id={`recent-detail-${item.id}`}>
                  {recentPlanLoading && <div className="recent-detail-loading"><span className="loading-orbit" /> Loading plan details…</div>}
                  {recentPlanError && <p className="recent-detail-error" role="alert">{recentPlanError}</p>}
                  {selectedRecentPlan?.id === item.id && <>
                    <div className="recent-detail-heading"><span>PLAN SNAPSHOT</span><strong>{selectedRecentPlan.tasks?.length || 0} tasks · {completion.count} complete</strong></div>
                    {selectedRecentPlan.tasks?.length ? <ul className="recent-task-preview">{selectedRecentPlan.tasks.slice(0, 4).map((task, index) => { const done = recentTaskCompleted(selectedRecentPlan, task, index); return <li key={`${task.title}-${index}`}><span className={`preview-task-mark ${done ? 'done' : ''}`} aria-hidden="true">{done ? '✓' : '•'}</span><span><strong>{task.title}</strong><small>{task.type || 'Task'}{task.due_date ? ` · Due ${formatDate(task.due_date)}` : ''}</small></span></li> })}</ul> : <p className="recent-detail-empty">No task details were saved with this plan.</p>}
                    {(selectedRecentPlan.tasks?.length || 0) > 4 && <span className="recent-more-tasks">+ {selectedRecentPlan.tasks.length - 4} more tasks</span>}
                  </>}
                </div>}
              </article>
            })}</div> : <div className="recent-empty"><span className="recent-empty-icon">◷</span><strong>{history.length ? 'No plans match that search.' : 'Your next plan will show up here.'}</strong><p>{history.length ? 'Try another search term.' : 'Build a plan or add sample data to get started.'}</p>{!history.length && <button className="primary-button" onClick={() => { setView('planner'); setDemoOpen(true) }}>Browse demo data <span className="button-arrow">↗</span></button>}</div>}
          </section>
        </div> : <div className="content-wrap">
          <section className="hero-row">
            <div className="hero-copy-block"><div className="eyebrow"><span className="eyebrow-line" /> YOUR DAY, UNCOMPLICATED <span className="hero-mode-chip">{mode === 'student' ? 'Study made manageable' : mode === 'professional' ? 'Work with a little more room' : 'Space for all of it'}</span></div><h1>A calmer plan for<br /><em>everything ahead.</em></h1><p className="hero-copy">Drop in assignments, meeting notes, or everyday tasks. Get a clear next step without carrying it all in your head.</p><a className="hero-cta" href="#composer-card">Build a calmer plan <span aria-hidden="true">↓</span></a><div className="hero-trust-line"><span aria-hidden="true">✓</span> Your tasks stay yours · Plans are saved on this device</div></div>
            <div className="hero-visual" aria-hidden="true"><div className="hero-ambient ambient-one" /><div className="hero-ambient ambient-two" /><div className="hero-sloth"><span className="sun-disc" /><span className="sloth-emoji">🦥</span><span className="floating-spark">✳</span></div><div className="hero-plan-card"><div className="hero-plan-top"><span><i /> A SIMPLE FLOW</span><b>01 — 03</b></div><div className="hero-plan-title">From full mind<br />to first step.</div><div className="hero-plan-step"><b>01</b><span>Add what’s on your mind</span><i>✓</i></div><div className="hero-plan-step"><b>02</b><span>Find a calmer order</span><i>✓</i></div><div className="hero-plan-step"><b>03</b><span>Start with one clear task</span><i>↗</i></div></div><span className="hero-float-tag">small steps count <b>✦</b></span></div>
          </section>

          <section className="composer-card" id="composer-card">
            <div className="flow-steps" aria-label="Three steps to a plan"><span className={`flow-step ${plan || source.trim() || selectedFile ? 'complete' : 'current'}`}><b>{plan || source.trim() || selectedFile ? '✓' : '1'}</b><span>Add your list</span></span><i>›</i><span className={`flow-step ${plan ? 'complete' : source.trim() || selectedFile ? 'current' : ''}`}><b>{plan ? '✓' : '2'}</b><span>Shape your day</span></span><i>›</i><span className={`flow-step ${plan ? 'current' : ''}`}><b>3</b><span>Get your plan</span></span></div>
            <div className="composer-heading"><div><div className="section-kicker">01 — START WITH THE MESS</div><h2>What’s on your mind?</h2></div><div className="mode-selector"><label className="mode-label" htmlFor="mode">I’m planning for</label><select id="mode" value={mode} onChange={(e) => setMode(e.target.value)}><option value="student">Student</option><option value="professional">Personal / professional</option><option value="universal">A bit of everything</option></select></div></div>
            <div className="input-grid">
              <div className={`source-box ${uploadHover ? 'drag-active' : ''}`} onDragOver={(e) => { e.preventDefault(); setUploadHover(true) }} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setUploadHover(false) }} onDrop={(e) => { e.preventDefault(); setUploadHover(false); chooseFile(e.dataTransfer.files?.[0]) }}><textarea value={source} onChange={(e) => setSource(e.target.value)} placeholder="Paste an assignment brief, meeting notes, or your running list of things to do…" aria-label="Paste your tasks" />
                <div className="source-footer"><div className="source-tools"><button className="tool-button" onClick={() => fileRef.current?.click()}><span>＋</span> Add a file</button>{selectedFile && <span className="file-chip">{selectedFile.name}<button aria-label="Remove file" onClick={() => setSelectedFile(null)}>×</button></span>}<span className="file-hint">PDF, TXT, MD · up to 15 MB</span></div><span className="char-count">{source.length.toLocaleString()} chars</span></div>
                <input ref={fileRef} className="visually-hidden" type="file" accept=".txt,.md,.pdf,application/pdf,text/plain,text/markdown" onChange={(e) => chooseFile(e.target.files?.[0])} />
                <div className={`drop-overlay ${uploadHover ? 'show' : ''}`}>Drop your file to add it</div>
              </div>
              <div className="settings-box"><div className="settings-title"><span className="settings-glyph">◷</span><div><strong>Shape your day</strong><span>A little context makes a better plan.</span></div></div><label className="field-label" htmlFor="date">TODAY’S DATE</label><input id="date" className="date-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /><div className="hours-heading"><label className="field-label" htmlFor="hours">AVAILABLE FOCUS TIME</label><strong>{hours} <small>hrs</small></strong></div><input id="hours" className="range-input" type="range" min="1" max="10" step="0.5" value={hours} onChange={(e) => setHours(Number(e.target.value))} /><div className="range-labels"><span>1 hour</span><span>10 hours</span></div><div className="local-toggle-row"><div><strong>Use local Gemma</strong><span>{health?.ollama_available && health?.model_installed ? `Ready · ${health.model}` : 'AI runs on your computer'}</span></div><button className={`switch ${useGemma ? 'on' : ''}`} onClick={() => setUseGemma((value) => !value)} aria-label="Toggle local Gemma" aria-pressed={useGemma}><span /></button></div>{health && !health.ollama_available && <p className="local-hint">Start Ollama to extract your own text. Demos work right away.</p>}{health?.ollama_available && !health?.model_installed && <p className="local-hint">Install {health.model} with <code>ollama pull {health.model}</code>. Demos work right away.</p>}</div>
            </div>
            {error && <div className="error-banner"><span>!</span>{error}<button onClick={() => setError('')}>Dismiss</button></div>}
            <div className="composer-bottom"><button className="demo-launch" onClick={() => setDemoOpen(true)}><span className="demo-launch-icon">✦</span><span><strong>Add demo data</strong><small>10 ready-to-use examples</small></span><b>↗</b></button><button className="primary-button" disabled={busy || (!source.trim() && !selectedFile)} onClick={() => generate('gemma')}><span>{busy ? `Building · ${elapsed}s` : 'Build my plan'}</span><span className="button-arrow">↗</span></button></div>
            {busy && <div className="generation-status" role="status" aria-live="polite"><span className="loading-orbit" /><span><strong>{elapsed < 5 ? 'Waking up your local model…' : 'Gemma is organizing your list…'}</strong><small>First run can take longer while Gemma loads. This usually speeds up while the model stays warm.</small></span><time>{elapsed}s</time></div>}
          </section>

          {toast && <div className="toast"><span>✓</span>{toast}</div>}

          {plan && <section className="results-section">
            <div className="results-heading"><div><div className="section-kicker">02 — YOUR PLAN IS READY</div><h2>A lighter list for today.</h2><p>One step at a time. You’ve got this.</p></div><div className="export-wrap"><details><summary>Export plan <span>⌄</span></summary><div className="export-menu">{[['markdown', 'Markdown'], ['csv', 'CSV spreadsheet'], ['json', 'JSON'], ['ics', 'Calendar (.ics)']].map(([key, label]) => <button key={key} onClick={() => exportPlan(key)}>{label}</button>)}</div></details></div></div>
            <div className="metric-grid"><div className="metric-card"><span className="metric-icon lilac">▤</span><div><span>TOTAL TASKS</span><strong>{plan.tasks.length}</strong></div><small>across your list</small></div><div className="metric-card"><span className="metric-icon coral">↗</span><div><span>OVERDUE OR DUE SOON</span><strong>{urgentCount}</strong></div><small>needs a look first</small></div><div className="metric-card"><span className="metric-icon mint">◷</span><div><span>ESTIMATED EFFORT</span><strong>{Number(totalHours.toFixed(1))}<small>h</small></strong></div><small>across all tasks</small></div><div className="metric-card today-metric"><span className="metric-icon peach">☼</span><div><span>YOUR FOCUS WINDOW</span><strong>{plan.available_hours}<small>h</small></strong></div><small>available today</small></div></div>
            <section className={`activity-tracker ${allTasksComplete ? 'is-complete' : ''}`} aria-label="Task progress, streak, and recent activity">
              {allTasksComplete && <div className={`reward-banner ${celebrating ? 'success-entry' : ''}`} role="status" aria-live="polite">
                <span className="reward-mark" aria-hidden="true">✦</span>
                <div><strong>{finishedOnTime ? 'Right on time — you did it!' : 'Plan complete — look at you go!'}</strong><span>{finishedOnTime ? `Every dated task was checked off by its deadline. You finished all ${taskCount} tasks${timeframeLabel ? ` in your plan window (${timeframeLabel})` : ''}.` : `You checked off all ${taskCount} ${taskCount === 1 ? 'task' : 'tasks'}${timeframeLabel ? ` in your plan window (${timeframeLabel})` : ' in your plan'}. Take a moment to enjoy that.`}</span></div>
              </div>}
              <div className="progress-strip"><div className="progress-copy"><span className="progress-icon">✓</span><div><span className="progress-eyebrow">PLAN COMPLETION</span><strong>Your progress</strong><span>{taskCount ? `${completedCount} of ${taskCount} tasks complete · ${taskCount - completedCount} left` : 'No tasks in this plan yet'}</span></div></div><div className="progress-track" role="progressbar" aria-label="Tasks completed in this plan" aria-valuenow={completedCount} aria-valuemin="0" aria-valuemax={Math.max(1, taskCount)} aria-valuetext={`${completedCount} of ${taskCount} tasks complete`}><span style={{ width: `${taskCount ? (completedCount / taskCount) * 100 : 0}%` }} /></div><strong className="progress-percent">{taskCount ? Math.round((completedCount / taskCount) * 100) : 0}<small>%</small></strong><span className="progress-source-note">Based only on the tasks in this plan</span></div>
              <div className="activity-row">
                <div className="recent-activity"><div className="activity-heading"><span className="activity-pulse" /><strong>Recent activity</strong><span>{completedCount ? `${completedCount} completed` : 'Your check-ins will show here'}</span></div>
                  {completedActivity.length ? <ol className="activity-list">{completedActivity.map(([key, title, completedAt]) => <li key={key}><span className="activity-check" aria-hidden="true">✓</span><span className="activity-task">{title}</span><time dateTime={completedAt}>{new Date(completedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time></li>)}</ol> : <p className="activity-empty">{completedCount ? 'These saved checkmarks are from before activity times were tracked. New check-ins will appear here.' : 'Check off a task to start your activity trail. You can undo any checkmark anytime.'}</p>}
                </div>
                <section className="streak-card" aria-label={`${currentStreak} day task completion streak; best streak ${bestStreak} days`}>
                  <div className="streak-top"><div><span className="streak-symbol" aria-hidden="true">✦</span><strong>Task streak</strong></div><span className="streak-best">Best {bestStreak} {bestStreak === 1 ? 'day' : 'days'}</span></div>
                  <div className="streak-count"><strong>{currentStreak}</strong><span>{currentStreak === 1 ? 'day' : 'days'} in a row</span><small>{currentStreak ? 'Keep your rhythm going' : 'A checkoff today starts a streak'}</small></div>
                  <div className="streak-chart" role="img" aria-label={`Tasks completed per day over the last seven days: ${weekActivity.map((day) => `${day.label} ${day.count}`).join(', ')}`}>
                    {weekActivity.map(({ day, count, label }) => <div className={`streak-day ${count ? 'has-activity' : ''} ${day === todayKey ? 'is-today' : ''}`} key={day} title={`${label}: ${count} ${count === 1 ? 'task' : 'tasks'} completed`}><span className="streak-day-count">{count || '·'}</span><div className="streak-bar-track"><i style={{ height: `${count ? Math.max(14, (count / weekMax) * 100) : 5}%` }} /></div><span className="streak-day-label">{label}</span></div>)}
                  </div>
                  <span className="streak-footnote">Daily checkoffs from this plan · last 7 days</span>
                </section>
              </div>
            </section>
            <section className={`next-step-card ${!nextTask ? 'all-done' : ''}`}><div className="next-step-icon">{nextTask ? '↗' : '✓'}</div><div className="next-step-copy"><span className="section-kicker">{nextTask ? 'YOUR NEXT STEP' : 'NICELY DONE'}</span><h3>{nextTask?.title || 'You’re all caught up.'}</h3><p>{nextTask?.next_action || 'Everything in this plan is marked complete.'}</p></div>{nextTask && <div className="next-step-action"><span>Due {formatDate(nextTask.due_date)} · {nextTask.priority} priority</span><button onClick={() => toggleTaskDone(nextTask, plan.tasks.indexOf(nextTask))}>Mark done <b>✓</b></button></div>}</section>
            <div className="board-heading"><div><h3>The big picture</h3><span>{plan.tasks.length} things, in a calmer order</span></div><span className="board-date">{formatDate(plan.current_date, { weekday: 'long', month: 'long', day: 'numeric' })}</span></div>
            <div className="board-grid">{[['Do Today', 'TODAY', 'today'], ['This Week', 'UP NEXT', 'week'], ['Later', 'WHEN THERE’S ROOM', 'later'], ['Needs clarification', 'NEEDS A DATE', 'clarify']].map(([name, eyebrow, css]) => <div className={`board-column ${css}`} key={name}><div className="column-heading"><span className="column-mark" /><div><span>{eyebrow}</span><h4>{name}</h4></div><b>{grouped[name]?.length || 0}</b></div><div className="task-stack">{grouped[name]?.length ? grouped[name].map((task, idx) => {
              const taskIndex = plan.tasks.indexOf(task)
              const key = taskProgressKey(task, taskIndex)
              const isComplete = completedTasks.has(key)
              const completedAt = completionTimes[key]
              return <article className={`task-card ${task.overdue ? 'overdue' : ''} ${isComplete ? 'completed' : ''}`} key={`${task.title}-${idx}`}><div className="task-topline"><button className={`task-check ${isComplete ? 'checked' : ''}`} aria-label={isComplete ? `Mark ${task.title} incomplete` : `Mark ${task.title} complete`} aria-pressed={isComplete} onClick={() => toggleTaskDone(task, taskIndex)}>{isComplete ? '✓' : ''}</button><span className={`priority-dot ${task.priority}`} /><span className={`priority-label ${task.priority}`}>{task.priority}</span>{task.overdue ? <span className="due-label danger">Overdue</span> : <span className="due-label">{formatDate(task.due_date)}</span>}{isComplete && <span className="done-label">Done</span>}<span className="confidence" title="Extraction confidence">{Math.round(task.confidence * 100)}%</span></div><h5>{task.title}</h5><div className="task-meta"><span>{task.type}</span><span>·</span><span>{task.estimated_hours ?? '—'}h</span></div>{isComplete && completedAt && <time className="task-completed-at" dateTime={completedAt}>Completed {new Date(completedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</time>}<div className="next-action"><span>↳</span><p>{task.next_action}</p></div>{task.clarification && <div className="clarification">{task.clarification}</div>}</article>
            }) : <div className="empty-column"><span>✳</span><p>Nothing to do here yet.</p></div>}</div></div>)}</div>
            <section className="daily-quote" aria-label="Daily motivation"><span className="daily-quote-kicker">A DAILY NUDGE</span><span className="daily-quote-mark" aria-hidden="true">“</span><blockquote>{dailyQuote}</blockquote><div className="daily-quote-rule" /><span className="daily-quote-credit">A small reminder from Deadline Sloth</span><span className="daily-quote-date">{new Date(`${todayKey}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span></section>
          </section>}

          {!plan && <section className="empty-state"><div className="empty-illustration">☁</div><div><strong>Your plan will find its place here.</strong><span>Paste a brief or try a demo to begin.</span></div><span className="empty-arrow">↘</span></section>}

          <footer id="run-help"><span>Developed by Creta</span></footer>
        </div>}
      </main>
      {demoOpen && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDemoOpen(false) }}><section className="demo-modal" role="dialog" aria-modal="true" aria-labelledby="demo-title"><div className="demo-modal-head"><div><div className="section-kicker">A QUICK PLACE TO START</div><h2 id="demo-title">Choose some demo data</h2><p>Pick a sample and we’ll turn it into a ready-to-explore plan.</p></div><button ref={demoCloseRef} className="icon-button" aria-label="Close demo picker" onClick={() => setDemoOpen(false)}>×</button></div><div className="demo-group"><div className="demo-group-title"><span>01</span><div><strong>Student</strong><small>Study life, made a little clearer</small></div><b>5 examples</b></div><div className="demo-grid">{DEMO_CARDS.filter((item) => item.mode === 'student').map((item) => <button key={item.id} className="demo-card" onClick={() => generate('demo', item.id)} disabled={busy}><span className="demo-card-icon">{item.icon}</span><span className="demo-category">{item.category}</span><strong>{item.title}</strong><small>{item.detail}</small><span className="demo-card-arrow">Use sample ↗</span></button>)}</div></div><div className="demo-group"><div className="demo-group-title"><span>02</span><div><strong>Personal & professional</strong><small>Meetings, people, projects, follow-ups</small></div><b>4 examples</b></div><div className="demo-grid">{DEMO_CARDS.filter((item) => item.mode === 'professional').map((item) => <button key={item.id} className="demo-card" onClick={() => generate('demo', item.id)} disabled={busy}><span className="demo-card-icon">{item.icon}</span><span className="demo-category">{item.category}</span><strong>{item.title}</strong><small>{item.detail}</small><span className="demo-card-arrow">Use sample ↗</span></button>)}</div></div><div className="demo-group mixed-demo"><div className="demo-group-title"><span>03</span><div><strong>A bit of everything</strong><small>Mix personal, work, and study</small></div></div><div className="demo-grid">{DEMO_CARDS.filter((item) => item.mode === 'universal').map((item) => <button key={item.id} className="demo-card" onClick={() => generate('demo', item.id)} disabled={busy}><span className="demo-card-icon">{item.icon}</span><span className="demo-category">{item.category}</span><strong>{item.title}</strong><small>{item.detail}</small><span className="demo-card-arrow">Use sample ↗</span></button>)}</div></div></section></div>}
      {celebrating && <div className="confetti-screen" aria-hidden="true">{Array.from({ length: 150 }, (_, i) => <i key={i} style={{ '--confetti-x': `${(i * 41) % 100}%`, '--confetti-delay': `${(i % 19) * 30}ms`, '--confetti-hue': `${(i * 47) % 360}deg`, '--confetti-drift': `${(i % 2 ? 1 : -1) * (24 + (i % 8) * 15)}px`, '--confetti-size': `${5 + (i % 6)}px`, '--confetti-turn': `${360 + (i % 5) * 160}deg` }} />)}</div>}
    </div>
  )
}

export default App
