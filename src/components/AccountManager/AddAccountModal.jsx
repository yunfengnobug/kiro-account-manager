import { useState, useRef } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { X, Download, Key, Shield, ChevronDown, Upload, FileText, AlertCircle } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'

function AddAccountModal({ onClose, onSuccess }) {
  const { theme, colors } = useTheme()
  const isDark = theme === 'dark'
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [addType, setAddType] = useState('social')
  const [refreshTokens, setRefreshTokens] = useState('')
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [region, setRegion] = useState('us-east-1')
  const [batchProgress, setBatchProgress] = useState(null)
  const fileInputRef = useRef(null)

  const awsRegions = [
    { value: 'us-east-1', label: 'us-east-1 (N. Virginia)' },
    { value: 'us-west-2', label: 'us-west-2 (Oregon)' },
    { value: 'eu-west-1', label: 'eu-west-1 (Ireland)' },
  ]

  const handleSaveLocal = async () => {
    setAddLoading(true)
    setAddError('')
    try {
      await invoke('add_local_kiro_account')
      onSuccess()
      onClose()
    } catch (e) {
      setAddError(e.toString())
    } finally {
      setAddLoading(false)
    }
  }

  // 处理文件上传
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result
      if (typeof content === 'string') {
        setRefreshTokens(content)
      }
    }
    reader.readAsText(file)
  }

  // 解析 token 列表
  const parseTokens = (text) => {
    return text
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.startsWith('aor'))
  }

  const handleAddManual = async () => {
    if (!refreshTokens.trim()) {
      setAddError('请输入 Refresh Token')
      return
    }
    
    const tokens = parseTokens(refreshTokens)
    
    if (tokens.length === 0) {
      setAddError('未找到有效的 Refresh Token（必须以 aor 开头）')
      return
    }
    
    setAddLoading(true)
    setAddError('')
    
    // IDC 类型不支持批量
    if (addType === 'idc') {
      if (tokens.length > 1) {
        setAddError('IDC 账号不支持批量添加，请一次只输入一个 Token')
        setAddLoading(false)
        return
      }
      if (!clientId || !clientSecret) {
        setAddError('请输入 Client ID 和 Client Secret')
        setAddLoading(false)
        return
      }
      try {
        await invoke('add_account_by_idc', { refreshToken: tokens[0], clientId, clientSecret, region })
        onSuccess()
        onClose()
      } catch (e) {
        setAddError(e.toString())
      } finally {
        setAddLoading(false)
      }
      return
    }
    
    // Social 账号批量添加
    setBatchProgress({ current: 0, total: tokens.length, results: [] })
    const results = []
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i]
      let success = false
      let message = ''
      let email = ''
      let isBanned = false
      
      try {
        const account = await invoke('add_account_by_social', { refreshToken: token })
        success = true
        email = account.email || '未知'
        isBanned = account.status === '已封禁' || account.status === '封禁'
        message = isBanned ? '已添加（账号已封禁）' : '添加成功'
      } catch (e) {
        const errorMsg = String(e)
        // 检测是否是封禁错误
        if (errorMsg.includes('BANNED') || errorMsg.includes('封禁') || errorMsg.includes('AccountSuspendedException')) {
          isBanned = true
          message = '账号已被封禁'
        } else if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) {
          message = 'Token 无效或已过期'
        } else if (errorMsg.includes('网络') || errorMsg.includes('timeout')) {
          message = '网络请求失败'
        } else {
          message = errorMsg.slice(0, 50)
        }
      }
      
      results.push({ 
        token: token.slice(0, 20) + '...', 
        success, 
        message, 
        email,
        isBanned 
      })
      setBatchProgress({ current: i + 1, total: tokens.length, results: [...results] })
    }
    
    setAddLoading(false)
    
    // 如果全部成功（包括封禁的账号也算添加成功），关闭弹窗
    if (results.every(r => r.success)) {
      setTimeout(() => {
        onSuccess()
        onClose()
      }, 1000)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className={`${colors.card} rounded-2xl w-full max-w-[420px] shadow-2xl border ${colors.cardBorder} overflow-hidden animate-dialog-in`} 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 ${isDark ? 'bg-white/[0.02]' : 'bg-gray-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-blue-500/15' : 'bg-blue-50'} flex items-center justify-center`}>
              <Key size={20} className="text-blue-500" />
            </div>
            <h2 className={`text-base font-semibold ${colors.text}`}>添加账号</h2>
          </div>
          <button onClick={onClose} className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
            <X size={18} className={colors.textMuted} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 保存本地账号 */}
          <button 
            onClick={handleSaveLocal} 
            disabled={addLoading} 
            className={`w-full flex items-center gap-4 px-4 py-4 ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15' : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100'} border rounded-xl transition-all disabled:opacity-50 active:scale-[0.98]`}
          >
            <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'} flex items-center justify-center`}>
              <Download size={20} className="text-emerald-500" />
            </div>
            <div className="text-left">
              <div className={`font-medium ${colors.text}`}>{"从本地保存"}</div>
              <div className={`text-xs ${colors.textMuted}`}>{"从 Kiro IDE 本地存储导入账号"}</div>
            </div>
          </button>

          {/* 分隔线 */}
          <div className="flex items-center gap-3">
            <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
            <span className={`text-xs ${colors.textMuted}`}>{"或手动添加"}</span>
            <div className={`flex-1 h-px ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
          </div>

          {/* 类型切换 */}
          <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
            <button 
              type="button" 
              onClick={() => setAddType('social')} 
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${addType === 'social' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : `${colors.text} hover:bg-white/10`}`}
            >
              <Key size={14} />
              Google/GitHub
            </button>
            <button 
              type="button" 
              onClick={() => setAddType('idc')} 
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${addType === 'idc' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/25' : `${colors.text} hover:bg-white/10`}`}
            >
              <Shield size={14} />
              BuilderId/Enterprise
            </button>
          </div>

          {/* 表单 */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className={`text-xs font-medium ${colors.textMuted}`}>
                  {addType === 'social' ? 'Refresh Token（支持批量）' : 'Refresh Token'}
                </label>
                {addType === 'social' && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${isDark ? 'text-blue-400 hover:bg-blue-500/10' : 'text-blue-600 hover:bg-blue-50'}`}
                  >
                    <Upload size={12} />
                    上传 TXT
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <textarea
                placeholder={addType === 'social' 
                  ? "粘贴 Refresh Token，支持多个（一行一个）\n\naor_xxx...\naor_yyy...\naor_zzz..." 
                  : "粘贴 IDC 账号的 Refresh Token..."}
                value={refreshTokens}
                onChange={(e) => setRefreshTokens(e.target.value)}
                rows={addType === 'social' ? 6 : 3}
                className={`w-full px-4 py-3 border rounded-xl text-sm ${colors.text} ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all resize-none font-mono`}
              />
              {addType === 'social' && refreshTokens && (
                <div className={`text-xs ${colors.textMuted} mt-1 flex items-center gap-1`}>
                  <FileText size={12} />
                  检测到 {parseTokens(refreshTokens).length} 个有效 Token
                </div>
              )}
            </div>

            {addType === 'idc' && (
              <>
                <div>
                  <label className={`block text-xs font-medium ${colors.textMuted} mb-1.5`}>{"Client ID"}</label>
                  <input 
                    type="text" 
                    placeholder="OIDC Client ID" 
                    value={clientId} 
                    onChange={(e) => setClientId(e.target.value)} 
                    className={`w-full px-4 py-3 border rounded-xl text-sm ${colors.text} ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all`} 
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium ${colors.textMuted} mb-1.5`}>{"Client Secret"}</label>
                  <input 
                    type="password" 
                    placeholder="OIDC Client Secret" 
                    value={clientSecret} 
                    onChange={(e) => setClientSecret(e.target.value)} 
                    className={`w-full px-4 py-3 border rounded-xl text-sm ${colors.text} ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all`} 
                  />
                </div>
                <div>
                  <label className={`block text-xs font-medium ${colors.textMuted} mb-1.5`}>{"AWS Region"}</label>
                  <div className="relative">
                    <select 
                      value={region} 
                      onChange={(e) => setRegion(e.target.value)} 
                      className={`w-full px-4 py-3 border rounded-xl text-sm ${colors.text} ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all appearance-none cursor-pointer`}
                    >
                      {awsRegions.map((r) => (<option key={r.value} value={r.value} className="text-gray-900 bg-white">{r.label}</option>))}
                    </select>
                    <ChevronDown size={16} className={`absolute right-4 top-1/2 -translate-y-1/2 ${colors.textMuted} pointer-events-none`} />
                  </div>
                </div>
              </>
            )}

            <button 
              onClick={handleAddManual} 
              disabled={addLoading || !refreshTokens.trim()} 
              className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl text-sm font-medium shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {addLoading ? (
                batchProgress ? `添加中 ${batchProgress.current}/${batchProgress.total}...` : '验证中...'
              ) : (
                addType === 'social' && parseTokens(refreshTokens).length > 1 
                  ? `批量添加 ${parseTokens(refreshTokens).length} 个账号` 
                  : '添加账号'
              )}
            </button>
          </div>

          {/* 批量添加进度 */}
          {batchProgress && batchProgress.results.length > 0 && (
            <div className={`${isDark ? 'bg-white/5' : 'bg-gray-50'} rounded-xl p-4 max-h-48 overflow-y-auto`}>
              <div className={`text-xs font-medium ${colors.text} mb-2 flex items-center justify-between`}>
                <span>添加进度：{batchProgress.current}/{batchProgress.total}</span>
                <span className={`text-[10px] ${colors.textMuted}`}>
                  成功 {batchProgress.results.filter(r => r.success).length} · 
                  失败 {batchProgress.results.filter(r => !r.success).length}
                  {batchProgress.results.filter(r => r.isBanned).length > 0 && 
                    ` · 封禁 ${batchProgress.results.filter(r => r.isBanned).length}`
                  }
                </span>
              </div>
              <div className="space-y-2">
                {batchProgress.results.map((result, index) => (
                  <div 
                    key={index}
                    className={`flex items-start gap-2 text-xs p-2 rounded-lg ${
                      result.success 
                        ? result.isBanned
                          ? (isDark ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-orange-50 text-orange-700 border border-orange-200')
                          : (isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-700')
                        : (isDark ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-700')
                    }`}
                  >
                    <span className="flex-shrink-0 mt-0.5">
                      {result.success ? (result.isBanned ? '⚠' : '✓') : '✗'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {result.success ? result.email : result.token}
                      </div>
                      <div className={`text-[10px] truncate ${result.isBanned ? 'font-medium' : ''}`}>
                        {result.message}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {addError && (
            <div className={`text-sm ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'} border px-4 py-3 rounded-xl flex items-start gap-2`}>
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{addError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AddAccountModal
