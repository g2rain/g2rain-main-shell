# 密钥文件说明

## 文件位置

密钥文件应放置在 `lua/keys/` 目录下：
- `public-key.pem` - 公钥文件
- `private-key.pem` - 私钥文件

## 文件格式

密钥文件应为 PEM 格式，包含完整的 BEGIN 和 END 标记。

### 公钥示例格式
```
-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEDwZbuQCoqp/oUrv4uWRgCW329J5A
a5HpunjEjttgwHFZicDa6fUJNi7Djj8eZ8TdFotc0II0mLc1BVDdEkN8MA==
-----END PUBLIC KEY-----
```

### 私钥示例格式
```
-----BEGIN PRIVATE KEY-----
MEECAQAwEwYHKoZIzj0CAQYIKoZIzj0DAQcEJzAlAgEBBCC41ZiW3UJ946ZSuqy6
WfOJB45cXeoji3tqcgAoZqki2Q==
-----END PRIVATE KEY-----
```

## 生成密钥对

如果需要生成新的 ES256 密钥对，可以使用以下命令：

```bash
# 生成私钥
openssl ecparam -genkey -name prime256v1 -noout -out private-key.pem

# 从私钥提取公钥
openssl ec -in private-key.pem -pubout -out public-key.pem
```

## 安全注意事项

1. **私钥安全**：私钥文件包含敏感信息，请确保：
   - 不要将私钥提交到版本控制系统
   - 在生产环境中使用适当的文件权限（建议 600）
   - 使用密钥管理服务（如 Kubernetes Secrets、AWS Secrets Manager 等）

2. **文件权限**：建议设置适当的文件权限：
   ```bash
   chmod 600 lua/keys/private-key.pem
   chmod 644 lua/keys/public-key.pem
   ```

3. **Docker 部署**：在 Docker 容器中，可以通过以下方式提供密钥：
   - 使用 Docker secrets
   - 使用环境变量（不推荐，因为可能泄露）
   - 使用挂载卷（volume mount）
   - 在构建时复制（注意安全）

## 配置更新

`config.lua` 会在首次调用时加载密钥文件，并缓存结果以提高性能。
如果需要重新加载密钥（例如密钥轮换），可以调用 `config.reload_keys()` 函数。

