import { useState, useRef, useEffect } from 'react'
import { Search, Download, Upload, RefreshCw, Trash2, Plus, Sparkles, ShoppingCart } from 'lucide-react'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useTheme } from '../../contexts/ThemeContext'

// 店铺配置
const SHOP_LINKS = [
  { id: 'xianyu', name: '闲鱼', icon: '🐟', url: 'https://m.tb.cn/h.7NbpL0t?tk=MIGPUfJRePq' },
  // { id: 'xiaodian', name: '链动小铺', icon: '🏪', url: 'https://h5.m.goofish.com/wow/moyu/moyu-project/new-shelves-page/pages/shop?spm=a21ybx.item.itemWrap.1.5b6d3da69D0KCl&shopId=AAGrX7lsEHRMJb6a08YY8hKw' },
]

function AccountHeader({
  searchTerm,
  onSearchChange,
  selectedCount,
  onBatchDelete,
  onAdd,
  onImport,
  onExport,
  onRefreshAll,
  autoRefreshing,
  lastRefreshTime,
  refreshProgress,
}) {
  const { theme, colors } = useTheme()
  const isDark = theme === 'dark'
  const [showShopMenu, setShowShopMenu] = useState(false)
  const shopMenuRef = useRef(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (shopMenuRef.current && !shopMenuRef.current.contains(event.target)) {
        setShowShopMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // 打开店铺链接
  const handleOpenShop = async (url) => {
    try {
      await openUrl(url)
    } catch (e) {
      console.error('Failed to open URL:', e)
    }
    setShowShopMenu(false)
  }

  return (
    <div className={`${colors.card} border-b ${colors.cardBorder} px-6 py-4 relative z-10`}>
      {/* 背景装饰 */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      
      <div className="flex items-center justify-between relative">
        <div className="flex items-center gap-6">
          <div className="animate-slide-in-right">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 animate-float">
                <Sparkles size={20} className="text-white" />
              </div>
              <h1 className={`text-xl font-bold ${colors.text}`}>账号管理</h1>
              
              {/* 购买按钮 */}
              <div className="relative" ref={shopMenuRef}>
                <button
                  onClick={() => setShowShopMenu(!showShopMenu)}
                  className="btn-icon px-3 py-1.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-pink-600 flex items-center gap-1.5 shadow-md shadow-orange-500/25 transition-all hover:shadow-orange-500/40"
                >
                  <ShoppingCart size={14} />
                  <span>购买</span>
                </button>
                
                {/* 下拉菜单 */}
                {showShopMenu && (
                  <div className={`absolute top-full left-0 mt-2 w-36 rounded-xl shadow-2xl overflow-hidden z-[999999] animate-scale-in ${isDark ? 'bg-[#1a1a2e] border border-gray-700' : 'bg-white border border-gray-200'}`}>
                    {SHOP_LINKS.map((shop) => (
                      <button
                        key={shop.id}
                        onClick={() => handleOpenShop(shop.url)}
                        className={`w-full px-3 py-2.5 flex items-center gap-2 ${isDark ? 'hover:bg-white/15' : 'hover:bg-gray-100'} transition-colors text-left`}
                      >
                        <span className="text-base">{shop.icon}</span>
                        <span className={`text-sm font-medium ${colors.text}`}>{shop.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <p className={`text-sm ${colors.textMuted}`}>管理你的 Kiro IDE 账号</p>
          </div>

        </div>
        <div className="flex items-center gap-3 animate-fade-in delay-400">
          {lastRefreshTime && !autoRefreshing && (
            <span className={`text-xs ${colors.textMuted}`}>{lastRefreshTime}</span>
          )}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-blue-500" size={16} />
            <input
              type="text"
              placeholder="搜索账号..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`pl-9 pr-4 py-2 ${isDark ? 'bg-white/5' : 'bg-gray-50'} border-0 rounded-xl text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500/30 ${colors.text} transition-all focus:w-56`}
            />
          </div>
          {selectedCount > 0 && (
            <button 
              onClick={onBatchDelete} 
              className="btn-icon px-3 py-2 bg-red-500 text-white rounded-xl text-sm hover:bg-red-600 flex items-center gap-1 animate-scale-in"
            >
              <Trash2 size={14} />删除 ({selectedCount})
            </button>
          )}
          <button 
            onClick={onAdd} 
            className="btn-icon px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-blue-600 hover:to-blue-700 flex items-center gap-1.5 shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40"
          >
            <Plus size={16} />添加
          </button>
          <button 
            onClick={onImport} 
            className={`btn-icon px-3 py-2 ${colors.card} border ${colors.cardBorder} rounded-xl ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-all flex items-center gap-1.5`} 
            title="导入"
          >
            <Download size={16} className={colors.textMuted} />
            <span className={`text-sm ${colors.textMuted}`}>导入</span>
          </button>
          <button 
            onClick={onExport} 
            className={`btn-icon px-3 py-2 ${colors.card} border ${colors.cardBorder} rounded-xl ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-all flex items-center gap-1.5`} 
            title="导出"
          >
            <Upload size={16} className={colors.textMuted} />
            <span className={`text-sm ${colors.textMuted}`}>导出</span>
          </button>
          <button 
            onClick={onRefreshAll} 
            disabled={autoRefreshing} 
            className={`btn-icon p-2 ${colors.card} border ${colors.cardBorder} rounded-xl ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} disabled:opacity-50 transition-all`} 
            title="刷新全部"
          >
            <RefreshCw size={18} className={`${colors.textMuted} ${autoRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
      {autoRefreshing && refreshProgress.total > 0 && (
        <div className="mt-3 flex items-center gap-3 animate-fade-in">
          <div className={`flex-1 h-1.5 ${isDark ? 'bg-white/10' : 'bg-gray-200'} rounded-full overflow-hidden`}>
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-300" 
              style={{ width: `${(refreshProgress.current / refreshProgress.total) * 100}%` }} 
            />
          </div>
          <span className="text-xs text-blue-600 font-medium">{refreshProgress.current}/{refreshProgress.total}</span>
        </div>
      )}
    </div>
  )
}

export default AccountHeader
