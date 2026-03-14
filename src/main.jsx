import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import MissionControl from './components/MissionControl.jsx'
import CustomCursor from './components/Customcursor.jsx'
import './index.css'

function Root() {
  const [booted, setBooted] = useState(() =>
    sessionStorage.getItem('dos-booted') === '1'
  )

  const handleComplete = () => {
    sessionStorage.setItem('dos-booted', '1')
    setBooted(true)
  }

  return (
    <>
      <CustomCursor />
      {!booted ? <MissionControl onComplete={handleComplete} /> : <App />}
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Root /></React.StrictMode>
)