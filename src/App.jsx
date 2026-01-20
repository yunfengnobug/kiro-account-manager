import { useState, useEffect, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import Sidebar from './components/Sidebar'
import AccountManager from './components/AccountManager/index'
import Settings from './components/Settings'
import KiroConfig from './components/KiroConfig/index'
import About from './components/About'
import UpdateChecker from './components/UpdateChecker'

import { useTheme } from './contexts/ThemeContext'
import { TOKEN_EXPIRY_THRESHOLD_MS } from './constants/config'

function App() {
  const [loading, setLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState('token')
  const { colors } = useTheme()
  const refreshTimerRef = useRef(null)

  // 启动时只刷新 token（不获取 usage，快速启动）
  const refreshExpiredTokensOnly = async () => {
    try {
      const settings = await invoke('get_app_settings').catch(() => ({}))
      if (!settings.autoRefresh) return
      
      const accounts = await invoke('get_accounts')
      if (!accounts || accounts.length === 0) return
      
      const now = new Date()
      
      const expiredAccounts = accounts.filter(acc => {
        // 跳过已封禁账号
        if (acc.status === '已封禁' || acc.status === '封禁') return false
        if (!acc.expiresAt) return false
        const expiresAt = new Date(acc.expiresAt.replace(/\//g, '-'))
        return (expiresAt.getTime() - now.getTime()) < TOKEN_EXPIRY_THRESHOLD_MS
      })
      
      if (expiredAccounts.length === 0) {
        return
      }
      
      // 并发刷新
      await Promise.allSettled(
        expiredAccounts.map(async (account) => {
          try {
            await invoke('refresh_account_token', { id: account.id })
          } catch (e) {
            // 静默处理错误
          }
        })
      )
    } catch (e) {
      console.error('[AutoRefresh] 刷新失败:', e)
    }
  }

  // 定时刷新：只刷新 token
  const checkAndRefreshExpiringTokens = async () => {
    try {
      const settings = await invoke('get_app_settings').catch(() => ({}))
      if (!settings.autoRefresh) return
      
      const accounts = await invoke('get_accounts')
      if (!accounts || accounts.length === 0) return
      
      const now = new Date()
      
      const expiredAccounts = accounts.filter(acc => {
        // 跳过已封禁账号
        if (acc.status === '已封禁' || acc.status === '封禁') return false
        if (!acc.expiresAt) return false
        const expiresAt = new Date(acc.expiresAt.replace(/\//g, '-'))
        return (expiresAt.getTime() - now.getTime()) < TOKEN_EXPIRY_THRESHOLD_MS
      })
      
      if (expiredAccounts.length === 0) {
        return
      }
      
      await Promise.allSettled(
        expiredAccounts.map(async (account) => {
          try {
            await invoke('refresh_account_token', { id: account.id })
          } catch (e) {
            // 静默处理错误
          }
        })
      )
    } catch (e) {
      console.error('[AutoRefresh] 刷新失败:', e)
    }
  }

  // 启动自动刷新定时器
  const startAutoRefreshTimer = async () => {
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current)
    }
    
    // 启动时只刷新 token（快速启动）
    refreshExpiredTokensOnly()
    
    // 从设置读取刷新间隔
    const settings = await invoke('get_app_settings').catch(() => ({}))
    const intervalMs = (settings.autoRefreshInterval || 50) * 60 * 1000
    
    refreshTimerRef.current = setInterval(checkAndRefreshExpiringTokens, intervalMs)
  }

  useEffect(() => {
    setLoading(false)
    
    // 监听设置变化，重启定时器
    const unlistenSettings = listen('settings-changed', () => {
      startAutoRefreshTimer()
    })
    
    // 启动自动刷新定时器
    startAutoRefreshTimer()
    
    return () => { 
      unlistenSettings.then(fn => fn())
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
      }
    }
  }, [])

  const renderContent = () => {
    switch (activeMenu) {
      case 'token': return <AccountManager />
      case 'kiro-config': return <KiroConfig />
      case 'settings': return <Settings />
      case 'about': return <About />
      default: return <AccountManager />
    }
  }

  if (loading) {
    return (
      <div className="h-screen bg-[#0d0d0d] flex items-center justify-center">
        <div className="text-white">加载中...</div>
      </div>
    )
  }

  return (
    <div className={`flex h-screen ${colors.main}`}>
      <Sidebar 
        activeMenu={activeMenu} 
        onMenuChange={setActiveMenu}
      />
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
      
      <UpdateChecker />
    </div>
  )
}

export default App
