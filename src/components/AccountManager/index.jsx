import { useState, useCallback, useMemo, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { useTheme } from '../../contexts/ThemeContext'
import { useDialog } from '../../contexts/DialogContext'
import { useAccounts } from './hooks/useAccounts'
import AccountHeader from './AccountHeader'
import AccountTable from './AccountTable'
import AddAccountModal from './AddAccountModal'
import ImportAccountModal from './ImportAccountModal'
import RefreshProgressModal from './RefreshProgressModal'
import AccountDetailModal from '../AccountDetailModal'
import EditAccountModal from './EditAccountModal'
import ConfirmDialog from './ConfirmDialog'

function AccountManager() {
  const { colors } = useTheme()
  const { showConfirm } = useDialog()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [editingAccount, setEditingAccount] = useState(null)
  const [editingLabelAccount, setEditingLabelAccount] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  
  // 切换账号弹窗状态
  const [switchDialog, setSwitchDialog] = useState(null) // { type, title, message, account }
  
  // 当前登录的本地 token
  const [localToken, setLocalToken] = useState(null)
  
  useEffect(() => {
    invoke('get_kiro_local_token').then(setLocalToken).catch(() => setLocalToken(null))
  }, [])

  const {
    accounts,
    loadAccounts,
    autoRefreshing,
    refreshProgress,
    lastRefreshTime,
    refreshingId,
    switchingId,
    setSwitchingId,
    autoRefreshAll,
    handleRefreshStatus,
    handleExport,
  } = useAccounts()

  const filteredAccounts = useMemo(() => {
    const searchLower = searchTerm.toLowerCase()
    return accounts.filter(a =>
      a.email.toLowerCase().includes(searchLower) ||
      a.label.toLowerCase().includes(searchLower)
    )
  }, [accounts, searchTerm])

  const handleSearchChange = useCallback((term) => { setSearchTerm(term) }, [])
  const handleSelectAll = useCallback((checked) => { setSelectedIds(checked ? filteredAccounts.map(a => a.id) : []) }, [filteredAccounts])
  const handleSelectOne = useCallback((id, checked) => { setSelectedIds(prev => checked ? [...prev, id] : prev.filter(i => i !== id)) }, [])
  const handleCopy = useCallback((text, id) => { navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 1500) }, [])
  
  // 删除单个账号
  const handleDelete = useCallback(async (id) => {
    const confirmed = await showConfirm('删除', '确定要删除这个账号吗？')
    if (confirmed) {
      await invoke('delete_account', { id })
      loadAccounts()
    }
  }, [showConfirm, loadAccounts])

  // 批量删除
  const onBatchDelete = useCallback(async () => {
    if (selectedIds.length === 0) return
    const confirmed = await showConfirm('批量删除', `确定要删除选中的 ${selectedIds.length} 个账号吗？`)
    if (confirmed) {
      await invoke('delete_accounts', { ids: selectedIds })
      setSelectedIds([])
      loadAccounts()
    }
  }, [selectedIds, showConfirm, loadAccounts])

  // 切换账号 - 显示确认弹窗
  const handleSwitchAccount = useCallback((account) => {
    if (!account.accessToken || !account.refreshToken) {
      setSwitchDialog({ type: 'error', title: '切换失败', message: '缺少认证信息', account: null })
      return
    }
    setSwitchDialog({
      type: 'confirm',
      title: '切换账号',
      message: `确定切换到 ${account.email}？`,
      account,
    })
  }, [])

  // 确认切换
  const confirmSwitch = useCallback(async () => {
    const account = switchDialog?.account
    if (!account) return
    
    setSwitchDialog(null)
    setSwitchingId(account.id)
    
    try {
      // 读取设置，判断是否自动更换机器码
      const appSettings = await invoke('get_app_settings').catch(() => ({}))
      const autoChangeMachineId = appSettings.autoChangeMachineId ?? false
      const bindMachineIdToAccount = appSettings.bindMachineIdToAccount ?? false
      const useBoundMachineId = appSettings.useBoundMachineId ?? true
      
      // 处理账号绑定机器码逻辑
      if (autoChangeMachineId && bindMachineIdToAccount) {
        try {
          // 获取账号绑定的机器码
          let boundMachineId = await invoke('get_bound_machine_id', { accountId: account.id }).catch(() => null)
          
          if (!boundMachineId) {
            // 没有绑定机器码，生成一个新的并绑定
            boundMachineId = await invoke('generate_machine_guid')
            await invoke('bind_machine_id_to_account', { accountId: account.id, machineId: boundMachineId })
          }
          
          if (useBoundMachineId) {
            // 使用绑定的机器码
            await invoke('set_custom_machine_guid', { newGuid: boundMachineId })
          }
          // 如果不使用绑定的机器码，后面的 resetMachineId 会随机生成
        } catch (e) {
          console.error('[MachineId] Failed to handle bound machine ID:', e)
        }
      }
      
      const isIdC = account.provider === 'BuilderId' || account.provider === 'Enterprise' || account.clientIdHash
      const authMethod = isIdC ? 'IdC' : 'social'
      
      // 直接使用账号中的 token 进行切换，不再刷新
      // 如果启用了绑定机器码且使用绑定的，不需要再 resetMachineId
      const shouldResetMachineId = autoChangeMachineId && !(bindMachineIdToAccount && useBoundMachineId)
      const params = {
        accessToken: account.accessToken,
        refreshToken: account.refreshToken,
        provider: account.provider || 'Google',
        authMethod,
        resetMachineId: shouldResetMachineId,
        autoRestart: false
      }
      
      if (isIdC) {
        params.clientIdHash = account.clientIdHash || null
        params.region = account.region || 'us-east-1'
        params.clientId = account.clientId || null
        params.clientSecret = account.clientSecret || null
      } else {
        params.profileArn = account.profileArn || 'arn:aws:codewhisperer:us-east-1:699475941385:profile/EHGA3GRVQMUK'
      }
      
      await invoke('switch_kiro_account', { params })
      
      // 更新当前账号标识
      invoke('get_kiro_local_token').then(setLocalToken).catch(() => setLocalToken(null))
      
      // 从 usage_data 获取配额信息
      const usageData = account.usageData
      const breakdown = usageData?.usage_breakdown_list?.[0] || usageData?.usageBreakdownList?.[0]
      const used = breakdown?.current_usage ?? breakdown?.currentUsage ?? 0
      const limit = breakdown?.usage_limit ?? breakdown?.usageLimit ?? 50
      const remaining = limit - used
      const provider = account.provider || 'Unknown'
      setSwitchDialog({
        type: 'success',
        title: '切换成功',
        message: `${account.email}\n\n📊 配额: ${used}/${limit} (剩余 ${remaining})\n🏷️ 类型: ${provider}`,
        account: null,
      })
    } catch (e) {
      setSwitchDialog({
        type: 'error',
        title: '切换失败',
        message: String(e),
        account: null,
      })
    } finally {
      setSwitchingId(null)
    }
  }, [switchDialog, setSwitchingId])

  return (
    <div className={`h-full flex flex-col ${colors.main}`}>
      <AccountHeader
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        selectedCount={selectedIds.length}
        onBatchDelete={onBatchDelete}
        onAdd={() => setShowAddModal(true)}
        onImport={() => setShowImportModal(true)}
        onExport={() => handleExport(selectedIds)}
        onRefreshAll={() => autoRefreshAll(accounts, true)}
        autoRefreshing={autoRefreshing}
        lastRefreshTime={lastRefreshTime}
        refreshProgress={refreshProgress}
      />
      <div className="flex-1 overflow-auto">
        <AccountTable
          accounts={filteredAccounts}
          filteredAccounts={filteredAccounts}
          selectedIds={selectedIds}
          onSelectAll={handleSelectAll}
          onSelectOne={handleSelectOne}
          copiedId={copiedId}
          onCopy={handleCopy}
          onSwitch={handleSwitchAccount}
          onRefresh={handleRefreshStatus}
          onEdit={setEditingAccount}
          onEditLabel={setEditingLabelAccount}
          onDelete={handleDelete}
          onAdd={() => setShowAddModal(true)}
          refreshingId={refreshingId}
          switchingId={switchingId}
          localToken={localToken}
        />
      </div>
      {editingAccount && (
        <AccountDetailModal
          account={editingAccount}
          onClose={() => { setEditingAccount(null); loadAccounts() }}
        />
      )}
      {showAddModal && (<AddAccountModal onClose={() => setShowAddModal(false)} onSuccess={loadAccounts} />)}
      {editingLabelAccount && (<EditAccountModal account={editingLabelAccount} onClose={() => setEditingLabelAccount(null)} onSuccess={loadAccounts} />)}
      {showImportModal && (<ImportAccountModal onClose={() => setShowImportModal(false)} onSuccess={loadAccounts} />)}
      {autoRefreshing && (<RefreshProgressModal refreshProgress={refreshProgress} />)}
      
      {/* 切换账号弹窗 */}
      {switchDialog && (
        <ConfirmDialog
          type={switchDialog.type}
          title={switchDialog.title}
          message={switchDialog.message}
          onConfirm={switchDialog.type === 'confirm' ? confirmSwitch : () => setSwitchDialog(null)}
          onCancel={() => setSwitchDialog(null)}
          confirmText={switchDialog.type === 'confirm' ? '确定切换' : '确定'}
        />
      )}
    </div>
  )
}

export default AccountManager

