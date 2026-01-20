# GitHub 发布配置指南

## 一、前置准备

### 1. 生成 Tauri 签名密钥

自动更新需要对安装包进行签名验证。运行以下命令生成密钥对：

```bash
npm run tauri signer generate -- -w ~/.tauri/myapp.key
```

这会生成：
- 私钥文件：`~/.tauri/myapp.key`
- 公钥：会在命令行输出

**重要：** 
- 私钥要保密，不要提交到 Git
- 公钥需要配置到 `tauri.conf.json` 中（已配置）

### 2. 配置 GitHub Secrets

进入你的 GitHub 仓库：`https://github.com/yunfengnobug/kiro-account-manager/settings/secrets/actions`

添加以下 Secrets：

#### 必需的 Secrets：

1. **TAURI_SIGNING_PRIVATE_KEY**
   - 值：打开 `~/.tauri/myapp.key` 文件，复制完整内容
   - 用途：对发布的安装包进行签名

2. **TAURI_SIGNING_PRIVATE_KEY_PASSWORD**
   - 值：生成密钥时设置的密码（如果没设置密码，留空）
   - 用途：解密私钥

#### 可选的 Secrets（如果你有私有仓库）：

3. **PRIVATE_REPO** - 私有仓库地址（格式：`owner/repo`）
4. **PRIVATE_REPO_REF** - 分支名（如：`main`）
5. **PRIVATE_REPO_TOKEN** - GitHub Personal Access Token

> 注意：如果你的仓库是公开的，可以删除 `release.yml` 中的 "Checkout from private repo" 步骤，改用普通的 checkout。

---

## 二、发布新版本流程

### 方式 1：通过 Git Tag 自动发布（推荐）

1. **更新版本号**
   
   修改以下文件中的版本号（保持一致）：
   - `package.json` → `"version": "1.5.2"`
   - `src-tauri/tauri.conf.json` → `"version": "1.5.2"`
   - `src-tauri/Cargo.toml` → `version = "1.5.2"`

2. **提交代码**
   ```bash
   git add .
   git commit -m "chore: bump version to 1.5.2"
   git push
   ```

3. **创建并推送 Tag**
   ```bash
   git tag v1.5.2
   git push origin v1.5.2
   ```

4. **自动构建**
   
   推送 Tag 后，GitHub Actions 会自动：
   - 在 Windows、macOS (Intel/ARM)、Linux 上构建应用
   - 创建 GitHub Release
   - 上传安装包和 `latest.json` 文件
   - 生成 `latest-deb.json`（Linux deb 包专用）

5. **检查发布**
   
   访问：`https://github.com/yunfengnobug/kiro-account-manager/releases`
   
   确认以下文件已上传：
   - Windows: `.msi` 和 `.exe` 文件
   - macOS: `.dmg` 文件（Intel 和 ARM 版本）
   - Linux: `.AppImage` 和 `.deb` 文件
   - `latest.json` - 自动更新配置文件
   - `latest-deb.json` - Linux deb 专用更新配置

### 方式 2：手动触发构建

如果只想测试构建，不发布：

1. 进入 Actions 页面：`https://github.com/yunfengnobug/kiro-account-manager/actions`
2. 选择 "Build (Fork)" workflow
3. 点击 "Run workflow"
4. 构建完成后，在 Artifacts 中下载安装包

---

## 三、验证自动更新

### 1. 检查更新配置文件

发布后，访问：
```
https://github.com/yunfengnobug/kiro-account-manager/releases/latest/download/latest.json
```

应该能看到类似这样的 JSON：
```json
{
  "version": "1.5.2",
  "notes": "更新说明",
  "pub_date": "2025-01-20T12:00:00Z",
  "platforms": {
    "windows-x86_64-nsis": {
      "signature": "...",
      "url": "https://github.com/yunfengnobug/kiro-account-manager/releases/download/v1.5.2/..."
    },
    ...
  }
}
```

### 2. 测试应用内更新

1. 安装旧版本的应用
2. 打开应用，等待几秒
3. 如果有新版本，右下角会弹出更新提示
4. 点击"立即更新"下载并安装

---

## 四、常见问题

### Q1: 构建失败，提示签名错误
**A:** 检查 GitHub Secrets 中的 `TAURI_SIGNING_PRIVATE_KEY` 和密码是否正确配置。

### Q2: 应用检测不到更新
**A:** 
- 确认 `latest.json` 文件已正确上传到 Release
- 检查应用版本号是否低于最新版本
- 查看浏览器控制台是否有网络错误

### Q3: 如何修改发布说明？
**A:** 编辑 `.github/workflows/release.yml` 中的 `releaseBody` 字段。

### Q4: 如何跳过某个平台的构建？
**A:** 在 `release.yml` 的 `matrix.include` 中删除对应平台。

### Q5: 私有仓库如何配置？
**A:** 
1. 创建 Personal Access Token (需要 `repo` 权限)
2. 配置 Secrets: `PRIVATE_REPO`, `PRIVATE_REPO_REF`, `PRIVATE_REPO_TOKEN`
3. 保持 `release.yml` 中的 "Checkout from private repo" 步骤

---

## 五、更新公钥（如果需要）

如果你重新生成了签名密钥，需要更新 `tauri.conf.json` 中的公钥：

```json
{
  "plugins": {
    "updater": {
      "pubkey": "你的新公钥"
    }
  }
}
```

**注意：** 更新公钥后，旧版本应用将无法验证新版本的签名，需要用户手动下载安装。

---

## 六、快速检查清单

发布前确认：
- [ ] 三个文件的版本号已同步更新
- [ ] GitHub Secrets 已正确配置
- [ ] 代码已提交并推送
- [ ] Tag 格式正确（`v` + 版本号）
- [ ] 仓库地址已改为 `yunfengnobug/kiro-account-manager`

发布后确认：
- [ ] GitHub Actions 构建成功
- [ ] Release 页面有新版本
- [ ] `latest.json` 文件可访问
- [ ] 各平台安装包已上传
- [ ] 旧版本应用能检测到更新
