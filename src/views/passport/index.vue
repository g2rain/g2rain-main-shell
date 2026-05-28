<template>
  <div class="passport-page">
    <!-- 页面标题 -->
    <div class="passport-page__header">
      <h2>{{ $t('PASSPORT_MANAGER', '账号管理') }}</h2>
    </div>

    <!-- 用户信息展示 -->
    <el-card class="passport-page__info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>用户信息</span>
        </div>
      </template>
      <el-descriptions :column="2" border v-loading="loading">
        <el-descriptions-item label="真实姓名">{{ userInfo?.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ userInfo?.mobile || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ userInfo?.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="管理员">
          {{ userInfo?.admin ? '是' : '否' }}
        </el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ userInfo?.createTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ userInfo?.updateTime || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- Passport信息展示 -->
    <el-card class="passport-page__info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>账号信息</span>
        </div>
      </template>
      <el-descriptions :column="2" border v-loading="loading">
        <el-descriptions-item label="用户名">{{ passportInfo?.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ passportInfo?.realName || '-' }}</el-descriptions-item>
        <el-descriptions-item label="性别">
          {{ passportInfo?.sex === 'MALE' ? '男性' : passportInfo?.sex === 'FEMALE' ? '女性' : passportInfo?.sex || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="生日">{{ passportInfo?.birthday || '-' }}</el-descriptions-item>
        <el-descriptions-item label="身份证号">{{ passportInfo?.idNo || '-' }}</el-descriptions-item>
        <el-descriptions-item label="手机号">{{ passportInfo?.mobile || '-' }}</el-descriptions-item>
        <el-descriptions-item label="邮箱">{{ passportInfo?.email || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ passportInfo?.status || '-' }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ passportInfo?.createTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ passportInfo?.updateTime || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 功能按钮区域 -->
    <div class="passport-page__actions">
      <el-button type="primary" @click="handleEditPassport">更新账号信息</el-button>
      <el-button type="warning" @click="handleChangePassword">修改密码</el-button>
      <el-button type="success" :loading="dingTalkBindLoading" @click="openDingTalkBind">
        绑定钉钉
      </el-button>
    </div>

    <el-dialog
      v-model="dingTalkBindVisible"
      title="绑定钉钉"
      width="420px"
      destroy-on-close
      @open="onDingTalkBindOpen"
      @closed="onDingTalkBindClosed"
    >
      <div class="dingtalk-bind-dialog">
        <div
          :id="dingTalkBindQrId"
          class="dingtalk-bind-dialog__qr"
          v-loading="dingTalkBindLoading"
        />
        <p class="dingtalk-bind-dialog__status">{{ dingTalkBindStatus }}</p>
      </div>
    </el-dialog>

    <!-- 更新Passport信息弹窗 -->
    <el-dialog
      v-model="editPassportDialogVisible"
      title="更新账号信息"
      width="600px"
      @close="handleEditPassportClose"
    >
      <el-config-provider :locale="zhCn">
        <el-form
          ref="editPassportFormRef"
          :model="editPassportForm"
          :rules="editPassportRules"
          label-width="100px"
        >
          <el-form-item label="用户名" prop="username">
            <el-input v-model="editPassportForm.username" placeholder="请输入用户名" maxlength="64" show-word-limit />
          </el-form-item>
          <el-form-item label="真实姓名" prop="realName">
            <el-input v-model="editPassportForm.realName" placeholder="请输入真实姓名" maxlength="128" show-word-limit />
          </el-form-item>
          <el-form-item label="性别" prop="sex">
            <el-select v-model="editPassportForm.sex" placeholder="请选择性别" style="width: 100%">
              <el-option label="男性" value="MALE" />
              <el-option label="女性" value="FEMALE" />
            </el-select>
          </el-form-item>
          <el-form-item label="生日" prop="birthday">
            <el-date-picker
              v-model="editPassportForm.birthday"
              type="date"
              placeholder="请选择生日"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item label="身份证号" prop="idNo">
            <el-input v-model="editPassportForm.idNo" placeholder="请输入身份证号" maxlength="32" show-word-limit />
          </el-form-item>
          <el-form-item label="手机号" prop="mobile">
            <el-input v-model="editPassportForm.mobile" placeholder="请输入手机号" maxlength="32" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="editPassportForm.email" placeholder="请输入邮箱" maxlength="128" show-word-limit />
          </el-form-item>
        </el-form>
      </el-config-provider>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editPassportDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitEditPassport" :loading="submitting">保 存</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="changePasswordDialogVisible"
      title="修改密码"
      width="500px"
      @close="handleChangePasswordClose"
    >
      <el-form
        ref="changePasswordFormRef"
        :model="changePasswordForm"
        :rules="changePasswordRules"
        label-width="100px"
      >
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="changePasswordForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="changePasswordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="changePasswordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="changePasswordDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitChangePassword" :loading="submitting">确 定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { t } from '@platform/i18n';
import { env } from '@shared/env';
import { PassportApi } from './api';
import { useDingTalkPassportBind } from './useDingTalkPassportBind';
import { getAuthorityUser } from '@/runtime/api/user.api';
import type { UserVo, PassportVo } from '@/runtime/api/user.api';

const dingTalkBindMode = env.VITE_DINGTALK_BIND_MODE || 'INTERNAL';
const {
  statusText: dingTalkBindStatus,
  loading: dingTalkBindLoading,
  qrContainerId: dingTalkBindQrId,
  initQr: initDingTalkBindQr,
  teardown: teardownDingTalkBind,
} = useDingTalkPassportBind(dingTalkBindMode);
const dingTalkBindVisible = ref(false);

const openDingTalkBind = () => {
  dingTalkBindVisible.value = true;
};

const onDingTalkBindOpen = () => {
  initDingTalkBindQr();
};

const onDingTalkBindClosed = () => {
  teardownDingTalkBind();
};

const loading = ref(false);
const submitting = ref(false);
const userInfo = ref<UserVo | null>(null);
const passportInfo = ref<PassportVo | null>(null);

// 更新Passport信息相关
const editPassportDialogVisible = ref(false);
const editPassportFormRef = ref<FormInstance | null>(null);
const editPassportForm = reactive({
  username: '',
  realName: '',
  sex: '',
  birthday: '',
  idNo: '',
  mobile: '',
  email: '',
});

const editPassportRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { max: 64, message: '用户名长度不能超过64个字符', trigger: 'blur' },
  ],
  realName: [
    { max: 128, message: '真实姓名长度不能超过128个字符', trigger: 'blur' },
  ],
  sex: [
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value && value !== 'MALE' && value !== 'FEMALE') {
          callback(new Error('性别只能是MALE（男性）或FEMALE（女性）'));
        } else {
          callback();
        }
      },
      trigger: 'change',
    },
  ],
  birthday: [
    { max: 16, message: '生日长度不能超过16个字符', trigger: 'blur' },
  ],
  idNo: [
    { max: 32, message: '身份证号长度不能超过32个字符', trigger: 'blur' },
  ],
  mobile: [
    { max: 32, message: '手机号长度不能超过32个字符', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value && !/^1[3-9]\d{9}$/.test(value)) {
          callback(new Error('请输入正确的手机号格式'));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
  email: [
    { max: 128, message: '邮箱长度不能超过128个字符', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            callback(new Error('请输入正确的邮箱格式'));
          } else {
            callback();
          }
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
};

// 修改密码相关
const changePasswordDialogVisible = ref(false);
const changePasswordFormRef = ref<FormInstance | null>(null);
const changePasswordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

// 验证确认密码是否与新密码一致
const validateConfirmPassword = (rule: any, value: string, callback: any) => {
  if (value !== changePasswordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'));
  } else {
    callback();
  }
};

const changePasswordRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
};

/**
 * 加载当前用户信息
 */
const loadUserInfo = async () => {
  loading.value = true;
  try {
    const authorityUser = await getAuthorityUser();
    userInfo.value = authorityUser;
    passportInfo.value = authorityUser.passport;
  } catch (error: any) {
    ElMessage.error(error?.message || '加载Passport信息失败');
  } finally {
    loading.value = false;
  }
};

/**
 * 处理更新Passport信息
 */
const handleEditPassport = () => {
  if (!passportInfo.value) {
    ElMessage.warning('Passport信息未加载，请稍后再试');
    return;
  }

  // 填充表单数据
  editPassportForm.username = passportInfo.value.username || '';
  editPassportForm.realName = passportInfo.value.realName || '';
  editPassportForm.sex = passportInfo.value.sex || '';
  editPassportForm.birthday = passportInfo.value.birthday || '';
  editPassportForm.idNo = passportInfo.value.idNo || '';
  editPassportForm.mobile = passportInfo.value.mobile || '';
  editPassportForm.email = passportInfo.value.email || '';

  editPassportDialogVisible.value = true;
};

/**
 * 关闭更新Passport信息弹窗
 */
const handleEditPassportClose = () => {
  editPassportFormRef.value?.resetFields();
};

/**
 * 提交更新Passport信息
 */
const submitEditPassport = async () => {
  if (!editPassportFormRef.value) return;
  const valid = await editPassportFormRef.value.validate();
  if (!valid) return;

  submitting.value = true;
  try {
    await PassportApi.save({
      // 使用当前加载的用户 ID 进行更新
      id: passportInfo.value?.id,
      ...editPassportForm,
    });
    ElMessage.success(t('PASSPORT_SAVE_SUCCESS', '保存成功'));
    editPassportDialogVisible.value = false;
    // 重新加载用户信息
    await loadUserInfo();
  } catch (error: any) {
    ElMessage.error(error?.message || '更新Passport信息失败');
  } finally {
    submitting.value = false;
  }
};

/**
 * 处理修改密码
 */
const handleChangePassword = () => {
  changePasswordDialogVisible.value = true;
};

/**
 * 关闭修改密码弹窗
 */
const handleChangePasswordClose = () => {
  changePasswordFormRef.value?.resetFields();
  changePasswordForm.oldPassword = '';
  changePasswordForm.newPassword = '';
  changePasswordForm.confirmPassword = '';
};

/**
 * 提交修改密码
 */
const submitChangePassword = async () => {
  if (!changePasswordFormRef.value) return;
  const valid = await changePasswordFormRef.value.validate();
  if (!valid) return;

  if (!passportInfo.value?.id) {
    ElMessage.warning('Passport信息未加载，请稍后再试');
    return;
  }

  submitting.value = true;
  try {
    await PassportApi.changePassword(passportInfo.value.id, {
      oldPassword: changePasswordForm.oldPassword,
      newPassword: changePasswordForm.newPassword,
    });
    ElMessage.success('密码修改成功，请重新登录');
    changePasswordDialogVisible.value = false;
    // 清空表单
    handleChangePasswordClose();
  } catch (error: any) {
    ElMessage.error(error?.message || '修改密码失败');
  } finally {
    submitting.value = false;
  }
};

onMounted(() => {
  loadUserInfo();
});
</script>

<style scoped>
.passport-page {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100%;
  box-sizing: border-box;
}

.passport-page__header {
  margin-bottom: 20px;
  padding: 16px 20px;
  background-color: #fff;
  border-radius: 4px;
}

.passport-page__header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
}

.passport-page__info-card {
  margin-bottom: 20px;
  background-color: #fff;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.passport-page__actions {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.dingtalk-bind-dialog__qr {
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  border-radius: 8px;
}

.dingtalk-bind-dialog__status {
  margin: 12px 0 0;
  text-align: center;
  font-size: 14px;
  color: #64748b;
}
</style>
