import { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { getVersion } from '@tauri-apps/api/app'
import { Key, Settings, Info, User, Sun, Moon, Palette, Settings2 } from 'lucide-react'
import { useTheme, themes } from '../contexts/ThemeContext'

const menuItems = [
  { id: 'token', label: '账号管理', icon: Key },
  { id: 'kiro-config', label: '规则配置', icon: Settings2 },
  { id: 'settings', label: '设置', icon: Settings },
  { id: 'about', label: '关于', icon: Info },
]

function Sidebar({ activeMenu, onMenuChange }) {
  const [localToken, setLocalToken] = useState(null)
  const [showThemeMenu, setShowThemeMenu] = useState(false)
  const [version, setVersion] = useState('')
  const { theme, setTheme, colors } = useTheme()

  useEffect(() => {
    invoke('get_kiro_local_token').then(setLocalToken).catch(() => {})
    getVersion().then(setVersion)
  }, [])

  const themeIcons = { light: Sun, dark: Moon, purple: Palette, green: Palette }
  const ThemeIcon = themeIcons[theme] || Sun

  return (
    <div className={`w-56 ${colors.sidebar} ${colors.sidebarText} flex flex-col relative`}>
      {/* Logo */}
      <div className="p-5 pb-4">
        <div className="flex items-center gap-2.5 mb-1 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm transition-transform hover:scale-110 hover:rotate-3">
            <svg width="24" height="24" viewBox="0 0 40 40" fill="none">
              <path d="M20 4C12 4 6 10 6 18C6 22 8 25 8 25C8 25 7 28 7 30C7 32 8 34 10 34C11 34 12 33 13 32C14 33 16 34 20 34C24 34 26 33 27 32C28 33 29 34 30 34C32 34 33 32 33 30C33 28 32 25 32 25C32 25 34 22 34 18C34 10 28 4 20 4ZM14 20C12.5 20 11 18.5 11 17C11 15.5 12.5 14 14 14C15.5 14 17 15.5 17 17C17 18.5 15.5 20 14 20ZM26 20C24.5 20 23 18.5 23 17C23 15.5 24.5 14 26 14C27.5 14 29 15.5 29 17C29 18.5 27.5 20 26 20Z" fill="white"/>
            </svg>
          </div>
          <div>
            <span className="font-bold text-lg tracking-wide">KIRO</span>
            <p className={`text-xs ${colors.sidebarMuted}`}>Account Manager</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 px-3 space-y-1">
        {menuItems.map((item, index) => {
          const Icon = item.icon
          const isActive = activeMenu === item.id
          return (
            <button
              key={item.id}
              onClick={() => onMenuChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all rounded-xl group animate-slide-in-left ${
                isActive ? `${colors.sidebarActive} font-medium shadow-sm` : `${colors.sidebarText} ${colors.sidebarHover}`
              }`}
              style={{ animationDelay: `${0.15 + index * 0.05}s` }}
            >
              <div className={`transition-transform ${isActive ? '' : 'group-hover:scale-110'}`}>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm">{item.label}</span>
                {item.desc && <p className={`text-xs ${colors.sidebarMuted} truncate`}>{item.desc}</p>}
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
              )}
            </button>
          )
        })}
      </nav>

      {/* QQ 群链接 */}
      <div className={`mx-3 mb-3 ${colors.sidebarCard} rounded-xl p-3 animate-fade-in-up`} style={{ animationDelay: '0.45s' }}>
        <div className={`text-xs ${colors.sidebarMuted} mb-2`}>加入交流群</div>
        <a
          href="https://qm.qq.com/cgi-bin/qm/qr?k=lZHZYYTmrRrrqNkBB7sDUpPmcZJYuRak&jump_from=webapi&authKey=x2ZqJnFJLWGKb7b/1NypeNDGS++JHTpO18P4gZfruAW0hbw/w24hTcqCkKnLDak9"
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${colors.sidebarHover} transition-all hover:scale-105 group`}
        >
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center transition-transform group-hover:scale-110">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-blue-400">
              <path d="M21.395 15.035a39.548 39.548 0 0 0-.803-2.264l-1.079-2.695c.001-.032.014-.562.014-.836C19.526 4.632 17.351 0 12 0S4.474 4.632 4.474 9.241c0 .274.013.804.014.836l-1.08 2.695a39.548 39.548 0 0 0-.802 2.264c-1.021 3.283-.69 4.643-.438 4.673.54.065 2.103-2.472 2.103-2.472 0 1.469.756 3.387 2.394 4.771-.612.188-1.363.479-1.845.835-.434.32-.379.646-.301.778.343.578 5.883.369 7.482.189 1.6.18 7.14.389 7.483-.189.078-.132.132-.458-.301-.778-.483-.356-1.233-.646-1.846-.836 1.637-1.384 2.393-3.302 2.393-4.771 0 0 1.563 2.537 2.103 2.472.251-.03.581-1.39-.438-4.673z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium">Kiro 交流群</div>
            <div className={`text-xs ${colors.sidebarMuted}`}>点击加入</div>
          </div>
        </a>
      </div>

      {/* Kiro IDE 本地连接状态 */}
      {localToken && (
        <div className={`mx-3 mb-3 ${colors.sidebarCard} rounded-xl p-3 animate-fade-in-up card-glow`} style={{ animationDelay: '0.5s' }}>
          <div className={`text-xs ${colors.sidebarMuted} mb-2 flex items-center gap-1.5`}>
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
            Kiro IDE 已连接
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-sm font-medium text-green-300 transition-transform hover:scale-110">
              <User size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{localToken.provider || 'Local'}</div>
              <div className={`text-xs ${colors.sidebarMuted}`}>
                {localToken.expiresAt ? new Date(localToken.expiresAt).toLocaleTimeString() : ''}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Theme & Version */}
      <div className={`px-3 pb-3 flex items-center justify-between gap-2`}>
        {/* 主题切换 */}
        <div className="relative">
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className={`flex items-center gap-1.5 px-2 py-1.5 ${colors.sidebarCard} rounded-lg text-xs ${colors.sidebarMuted} hover:text-white transition-all hover:scale-105`}
          >
            <ThemeIcon size={14} />
          </button>
          
          {showThemeMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowThemeMenu(false)} />
              <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-1 min-w-[100px] z-50 animate-scale-in">
                {Object.entries(themes).map(([key, t]) => {
                  const TIcon = themeIcons[key] || Sun
                  return (
                    <button
                      key={key}
                      onClick={() => { setTheme(key); setShowThemeMenu(false) }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        theme === key ? 'text-blue-600 font-medium' : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <TIcon size={14} />
                      {t.name}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
        
        <span className={`text-xs ${colors.sidebarMuted} ml-auto`}>v{version || '...'}</span>
      </div>
    </div>
  )
}

export default Sidebar
