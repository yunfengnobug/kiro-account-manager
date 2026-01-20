import { useState, useEffect } from 'react'
import { Github, Heart, Coffee, ExternalLink, Sparkles, Code2, Palette, Cpu, RefreshCw, X, Download } from 'lucide-react'
import { getVersion } from '@tauri-apps/api/app'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { useTheme } from '../contexts/ThemeContext'
import alipayQR from '../assets/donate/alipay.jpg'
import wechatQR from '../assets/donate/wechat.jpg'

function About() {
  const { theme, colors } = useTheme()
  const isDark = theme === 'dark'
  const [version, setVersion] = useState('')
  const [checking, setChecking] = useState(false)
  const [updateStatus, setUpdateStatus] = useState(null)
  const [previewImg, setPreviewImg] = useState(null)

  useEffect(() => {
    getVersion().then(setVersion)
  }, [])

  const [updateInfo, setUpdateInfo] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)

  const checkUpdate = async () => {
    setChecking(true)
    setUpdateStatus(null)
    setUpdateInfo(null)
    try {
      const update = await check()
      if (update) {
        setUpdateInfo(update)
        setUpdateStatus({ type: 'update', message: `发现新版本 ${update.version}`, update })
      } else {
        setUpdateStatus({ type: 'latest', message: '已是最新版本' })
      }
    } catch (e) {
      console.error('检查更新失败:', e)
      // 显示真实的错误信息，便于诊断问题
      setUpdateStatus({ type: 'error', message: `检查更新失败: ${e.message || e}` })
    } finally {
      setChecking(false)
    }
  }

  const doUpdate = async () => {
    const update = updateInfo || updateStatus?.update
    if (!update) return
    setDownloading(true)
    setDownloadProgress(0)
    let downloaded = 0
    let total = 0
    try {
      await update.downloadAndInstall((event) => {
        if (event.event === 'Started') {
          total = event.data.contentLength || 0
          downloaded = 0
        } else if (event.event === 'Progress') {
          downloaded += event.data.chunkLength
          if (total > 0) {
            setDownloadProgress(Math.round((downloaded / total) * 100))
          }
        } else if (event.event === 'Finished') {
          setDownloadProgress(100)
        }
      })
      await relaunch()
    } catch (e) {
      console.error('更新失败:', e)
      setUpdateStatus({ type: 'error', message: '更新失败: ' + e })
      setDownloading(false)
    }
  }

  const techStack = [
    { icon: Code2, label: "前端技术", value: 'React + Vite', color: 'text-cyan-500' },
    { icon: Palette, label: "UI 框架", value: 'TailwindCSS', color: 'text-pink-500' },
    { icon: Cpu, label: "后端技术", value: 'Tauri + Rust', color: 'text-orange-500' },
  ]

  return (
    <div className={`h-full ${colors.main} p-6 overflow-auto`}>
      <div className="bg-glow bg-glow-1" />
      <div className="bg-glow bg-glow-2" />
      
      <div className="max-w-2xl mx-auto">
        {/* 头部卡片 */}
        <div className={`card-glow ${colors.card} rounded-2xl p-8 shadow-lg border ${colors.cardBorder} text-center mb-6 opacity-0 animate-scale-in`}>
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl blur-xl opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-[#4361ee] to-[#7c3aed] rounded-3xl flex items-center justify-center shadow-lg transform group-hover:scale-105 transition-all animate-float">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                  <path d="M20 4C12 4 6 10 6 18C6 22 8 25 8 25C8 25 7 28 7 30C7 32 8 34 10 34C11 34 12 33 13 32C14 33 16 34 20 34C24 34 26 33 27 32C28 33 29 34 30 34C32 34 33 32 33 30C33 28 32 25 32 25C32 25 34 22 34 18C34 10 28 4 20 4ZM14 20C12.5 20 11 18.5 11 17C11 15.5 12.5 14 14 14C15.5 14 17 15.5 17 17C17 18.5 15.5 20 14 20ZM26 20C24.5 20 23 18.5 23 17C23 15.5 24.5 14 26 14C27.5 14 29 15.5 29 17C29 18.5 27.5 20 26 20Z" fill="white"/>
                </svg>
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center shadow-md">
                <Sparkles size={14} className="text-white" />
              </div>
            </div>
          </div>

          <h1 className={`text-2xl font-bold ${colors.text} mb-3`}>{"Kiro Account Manager"}</h1>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className={`px-3 py-1 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'} rounded-full text-sm font-medium`}>
              v{version || '...'}
            </span>
            <button
              onClick={checkUpdate}
              disabled={checking}
              className={`btn-icon px-3 py-1 ${isDark ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-100 text-green-600 hover:bg-green-200'} rounded-full text-sm font-medium flex items-center gap-1.5 transition-colors`}
            >
              <RefreshCw size={12} className={checking ? 'animate-spin' : ''} />
              {checking ? "检查中..." : "检查更新"}
            </button>
          </div>

          {updateStatus && (
            <div className={`mb-4 px-4 py-2 rounded-lg text-sm ${
              updateStatus.type === 'latest' ? (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600') :
              updateStatus.type === 'update' ? (isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600') :
              (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600')
            }`}>
              {downloading ? (
                <span>{"下载中..."} {downloadProgress}%</span>
              ) : (
                <>
                  {updateStatus.type === 'latest' ? "已是最新版本" : 
                   updateStatus.type === 'update' ? `发现新版本 ${updateInfo?.version || updateStatus.update?.version }` :
                   "检查失败，请稍后重试"}
                  {updateStatus.type === 'update' && (updateInfo || updateStatus.update) && (
                    <button 
                      onClick={doUpdate} 
                      className="ml-3 px-2 py-0.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors inline-flex items-center gap-1"
                    >
                      <Download size={12} />
                      {"立即更新"}
                    </button>
                  )}
                </>
              )}
            </div>
          )}

          <p className={`${colors.textMuted} text-sm`}>{"智能管理 Kiro 访问令牌，一键切换，配额监控"}</p>
        </div>

        {/* 技术栈 + 链接 */}
        <div className="grid grid-cols gap-6 mb-6">
          {/* 技术栈 */}
          <div className={`card-glow ${colors.card} rounded-2xl p-6 shadow-lg border ${colors.cardBorder} opacity-0 animate-fade-in-up delay-100`}>
            <h3 className={`text-sm font-medium ${colors.text} mb-4 text-center`}>{"技术栈"}</h3>
            <div className="space-y-3">
              {techStack.map(({ icon: Icon, label, value, color }) => (
                <div key={label} className={`flex items-center gap-3 ${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-3`}>
                  <Icon size={18} className={color} />
                  <span className={`text-sm ${colors.textMuted}`}>{label}</span>
                  <span className={`text-sm font-medium ${colors.text} ml-auto`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
         </div>
      </div>

      
    </div>
  )
}

export default About
