-- config.lua
-- 从文件加载密钥配置信息

local _M = {}

-- 密钥文件路径（相对于 lua 目录）
local KEY_BASE_PATH = "/usr/local/openresty/nginx/lua/keys"
local PUBLIC_KEY_FILE = KEY_BASE_PATH .. "/public-key.der"  -- 修改为DER格式
local PRIVATE_KEY_FILE = KEY_BASE_PATH .. "/private-key.der"  -- 修改为DER格式

-- 读取文件内容
local function read_file(file_path)
    local file, err = io.open(file_path, "rb")  -- 以二进制模式读取文件
    if not file then
        ngx.log(ngx.ERR, "Failed to open file: ", file_path, " Error: ", err)
        return nil
    end

    local content = file:read("*all")
    file:close()

    if content then
        ngx.log(ngx.ERR, "Successfully read file: ", file_path)
    else
        ngx.log(ngx.ERR, "Failed to read content from file: ", file_path)
    end

    return content
end

-- 加载密钥配置
local function load_keys()
    local public_key = read_file(PUBLIC_KEY_FILE)
    local private_key = read_file(PRIVATE_KEY_FILE)

    if not public_key or not private_key then
        ngx.log(ngx.ERR, "Failed to load keys from files")
        return nil
    end

    -- 从环境变量读取 applicationCode，如果没有则使用默认值
    -- 注意：在 OpenResty 中，os.getenv 可能不可用，可以通过配置文件或 nginx 变量提供
    local application_code = "g2rain-main-shell"
    local ok, env_value = pcall(function()
        return os.getenv("APPLICATION_CODE")
    end)
    if ok and env_value then
        application_code = env_value
    end

    -- 密钥配置（从 application.yml 获取的其他信息）
    return {
        {
            ["key-id"] = "yEMzeGLlhMpK5GxQKP5Fhg7JH9eALB7BK2BkadTOUxw",
            algorithm = "ES256",
            active = true,
            applicationCode = application_code,
            ["public-key"] = public_key,
            ["private-key"] = private_key
        }
    }
end

-- 缓存密钥配置（避免每次调用都读取文件）
local cached_keys = nil

-- 获取活动的密钥
function _M.get_active_key()
    -- 如果缓存不存在，加载密钥
    if not cached_keys then
        cached_keys = load_keys()
        if not cached_keys then
            ngx.log(ngx.ERR, "Failed to load keys from files.")
            return nil
        end
    end

    -- 查找活动的密钥
    for _, key in ipairs(cached_keys) do
        if key.active then
            return key
        end
    end

    ngx.log(ngx.ERR, "No active key found.")
    return nil
end

-- 重新加载密钥（用于密钥轮换）
function _M.reload_keys()
    cached_keys = nil
    return _M.get_active_key() ~= nil
end

-- 获取 DER 格式的公钥
function _M.get_public_key_der()
    local public_key = _M.get_active_key()["public-key"]
    if not public_key then
        ngx.log(ngx.ERR, "No public key found in active key configuration.")
        return nil
    end
    ngx.log(ngx.ERR, "Returning public key (DER format).")
    return public_key
end

-- 获取 DER 格式的私钥
function _M.get_private_key_der()
    local private_key = _M.get_active_key()["private-key"]
    if not private_key then
        ngx.log(ngx.ERR, "No private key found in active key configuration.")
        return nil
    end
    ngx.log(ngx.ERR, "Returning private key (DER format).")
    return private_key
end

return _M
