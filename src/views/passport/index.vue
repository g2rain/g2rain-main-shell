<template>
  <div class="passport-page">
    <!-- 页面标题 -->
    <div class="passport-page__header">
      <h2>{{ $t('MS_PP_TITLE', '账号管理') }}</h2>
    </div>

    <!-- 用户信息展示 -->
    <el-card class="passport-page__info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>{{ $t('MS_PP_USER_INFO', '用户信息') }}</span>
        </div>
      </template>
      <el-descriptions :column="2" border v-loading="loading">
        <el-descriptions-item :label="$t('G2_FIELD_REAL_NAME', '真实姓名')">
          {{ userInfo?.realName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('G2_FIELD_MOBILE', '手机号')">
          {{ userInfo?.mobile || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('G2_FIELD_EMAIL', '邮箱')">
          {{ userInfo?.email || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('G2_FIELD_ADMIN', '管理员')">
          {{ userInfo?.admin ? $t('G2_OPT_YES', '是') : $t('G2_OPT_NO', '否') }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('G2_FIELD_CREATE_TIME', '创建时间')">
          {{ userInfo?.createTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('G2_FIELD_UPDATE_TIME', '更新时间')">
          {{ userInfo?.updateTime || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- Passport信息展示 -->
    <el-card class="passport-page__info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>{{ $t('MS_PP_ACCOUNT_INFO', '账号信息') }}</span>
        </div>
      </template>
      <el-descriptions :column="2" border v-loading="loading">
        <el-descriptions-item :label="$t('G2_FIELD_USERNAME', '用户名')">
          {{ passportInfo?.username || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('G2_FIELD_REAL_NAME', '真实姓名')">
          {{ passportInfo?.realName || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('G2_FIELD_SEX', '性别')">
          {{ formatSex(passportInfo?.sex) }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('G2_FIELD_BIRTHDAY', '生日')">
          {{ passportInfo?.birthday || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('G2_FIELD_ID_NO', '身份证号')">
          {{ passportInfo?.idNo || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('G2_FIELD_MOBILE', '手机号')">
          {{ passportInfo?.mobile || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('G2_FIELD_EMAIL', '邮箱')">
          {{ passportInfo?.email || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('G2_FIELD_STATUS', '状态')">
          {{ passportInfo?.status || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('G2_FIELD_CREATE_TIME', '创建时间')">
          {{ passportInfo?.createTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('G2_FIELD_UPDATE_TIME', '更新时间')">
          {{ passportInfo?.updateTime || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 三方身份源绑定 -->
    <el-card class="passport-page__info-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>{{ $t('MS_PP_IDP_BIND', '三方应用绑定') }}</span>
          <el-button type="primary" link :loading="idpBindingLoading" @click="loadIdpBindings">
            {{ $t('G2_BTN_REFRESH', '刷新') }}
          </el-button>
        </div>
      </template>
      <el-table
        v-loading="idpBindingLoading"
        :data="idpBindingList"
        border
        stripe
        :empty-text="$t('MS_PP_IDP_EMPTY', '暂未绑定任何三方应用')"
        style="width: 100%"
      >
        <el-table-column prop="idpType" :label="$t('MS_PP_IDP_TYPE', '身份源')" width="120">
          <template #default="{ row }">
            <el-tag effect="light" type="info">{{ formatIdpType(row?.idpType) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="bindMode" :label="$t('MS_PP_BIND_MODE', '接入形态')" width="130">
          <template #default="{ row }">
            {{ formatBindMode(row?.bindMode) }}
          </template>
        </el-table-column>
        <el-table-column
          prop="corpId"
          :label="$t('MS_PP_CORP_ID', '企业 ID')"
          min-width="160"
          show-overflow-tooltip
        />
        <el-table-column
          prop="idpSubject"
          :label="$t('MS_PP_IDP_SUBJECT', '主体标识 (unionId)')"
          min-width="180"
          show-overflow-tooltip
        />
        <el-table-column
          prop="idpUserId"
          :label="$t('MS_PP_IDP_USER', '用户 ID')"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column
          prop="idpApplicationCode"
          :label="$t('MS_PP_APP_CODE', '应用标识')"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column
          prop="createTime"
          :label="$t('MS_PP_BIND_TIME', '绑定时间')"
          width="170"
        />
        <el-table-column :label="$t('G2_FIELD_ACTION', '操作')" width="90" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openIdpBindingDetail(row)">
              {{ $t('G2_BTN_DETAIL', '详情') }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 功能按钮区域 -->
    <div class="passport-page__actions">
      <el-button type="primary" @click="handleEditPassport">
        {{ $t('MS_PP_UPDATE_ACCOUNT', '更新账号信息') }}
      </el-button>
      <el-button type="warning" @click="handleChangePassword">
        {{ $t('MS_PP_CHANGE_PWD', '修改密码') }}
      </el-button>
      <el-button type="success" :loading="dingTalkBindLoading" @click="openDingTalkBind">
        {{ $t('MS_PP_BIND_DING', '绑定钉钉') }}
      </el-button>
    </div>

    <!-- 更新Passport信息弹窗 -->
    <el-dialog
      v-model="dingTalkBindVisible"
      :title="$t('MS_PP_BIND_DING', '绑定钉钉')"
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

    <!-- 修改密码弹窗 -->
    <el-dialog
      v-model="idpBindingDetailVisible"
      :title="$t('MS_PP_BIND_DETAIL', '绑定详情')"
      width="560px"
      destroy-on-close
    >
      <el-descriptions v-if="idpBindingDetail" :column="1" border>
        <el-descriptions-item :label="$t('MS_PP_IDP_TYPE', '身份源')">
          {{ formatIdpType(idpBindingDetail.idpType) }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('MS_PP_BIND_MODE', '接入形态')">
          {{ formatBindMode(idpBindingDetail.bindMode) }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('MS_PP_CORP_ID', '企业 ID')">
          {{ idpBindingDetail.corpId || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('MS_PP_IDP_SUBJECT', '主体标识')">
          {{ idpBindingDetail.idpSubject || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('MS_PP_IDP_USER', '用户 ID')">
          {{ idpBindingDetail.idpUserId || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('MS_PP_APP_CODE', '应用标识')">
          {{ idpBindingDetail.idpApplicationCode || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('MS_PP_BIND_TIME', '绑定时间')">
          {{ idpBindingDetail.createTime || '-' }}
        </el-descriptions-item>
        <el-descriptions-item :label="$t('G2_FIELD_UPDATE_TIME', '更新时间')">
          {{ idpBindingDetail.updateTime || '-' }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <el-dialog
      v-model="editPassportDialogVisible"
      :title="$t('MS_PP_UPDATE_ACCOUNT', '更新账号信息')"
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
          <el-form-item :label="$t('G2_FIELD_USERNAME', '用户名')" prop="username">
            <el-input
              v-model="editPassportForm.username"
              :placeholder="$t('G2_PH_USERNAME', '请输入用户名')"
              maxlength="64"
              show-word-limit
            />
          </el-form-item>
          <el-form-item :label="$t('G2_FIELD_REAL_NAME', '真实姓名')" prop="realName">
            <el-input
              v-model="editPassportForm.realName"
              :placeholder="$t('G2_PH_REALNAME', '请输入真实姓名')"
              maxlength="128"
              show-word-limit
            />
          </el-form-item>
          <el-form-item :label="$t('G2_FIELD_SEX', '性别')" prop="sex">
            <el-select
              v-model="editPassportForm.sex"
              :placeholder="$t('G2_PH_SEX', '请选择性别')"
              style="width: 100%"
            >
              <el-option :label="$t('G2_OPT_SEX_MALE', '男性')" value="MALE" />
              <el-option :label="$t('G2_OPT_SEX_FEMALE', '女性')" value="FEMALE" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('G2_FIELD_BIRTHDAY', '生日')" prop="birthday">
            <el-date-picker
              v-model="editPassportForm.birthday"
              type="date"
              :placeholder="$t('G2_PH_BIRTHDAY', '请选择生日')"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item :label="$t('G2_FIELD_ID_NO', '身份证号')" prop="idNo">
            <el-input
              v-model="editPassportForm.idNo"
              :placeholder="$t('G2_PH_IDNO', '请输入身份证号')"
              maxlength="32"
              show-word-limit
            />
          </el-form-item>
          <el-form-item :label="$t('G2_FIELD_MOBILE', '手机号')" prop="mobile">
            <el-input
              v-model="editPassportForm.mobile"
              :placeholder="$t('G2_PH_MOBILE', '请输入手机号')"
              maxlength="32"
            />
          </el-form-item>
          <el-form-item :label="$t('G2_FIELD_EMAIL', '邮箱')" prop="email">
            <el-input
              v-model="editPassportForm.email"
              :placeholder="$t('G2_PH_EMAIL', '请输入邮箱')"
              maxlength="128"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </el-config-provider>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="editPassportDialogVisible = false">
            {{ $t('G2_BTN_CANCEL', '取消') }}
          </el-button>
          <el-button type="primary" @click="submitEditPassport" :loading="submitting">
            {{ $t('G2_BTN_SAVE', '保存') }}
          </el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog
      v-model="changePasswordDialogVisible"
      :title="$t('MS_PP_CHANGE_PWD', '修改密码')"
      width="500px"
      @close="handleChangePasswordClose"
    >
      <el-form
        ref="changePasswordFormRef"
        :model="changePasswordForm"
        :rules="changePasswordRules"
        label-width="100px"
      >
        <el-form-item :label="$t('G2_FIELD_OLD_PWD', '原密码')" prop="oldPassword">
          <el-input
            v-model="changePasswordForm.oldPassword"
            type="password"
            :placeholder="$t('G2_PH_OLD_PWD', '请输入原密码')"
            show-password
          />
        </el-form-item>
        <el-form-item :label="$t('G2_FIELD_NEW_PWD', '新密码')" prop="newPassword">
          <el-input
            v-model="changePasswordForm.newPassword"
            type="password"
            :placeholder="$t('G2_PH_NEW_PWD', '请输入新密码')"
            show-password
          />
        </el-form-item>
        <el-form-item :label="$t('G2_FIELD_CONFIRM_PWD', '确认密码')" prop="confirmPassword">
          <el-input
            v-model="changePasswordForm.confirmPassword"
            type="password"
            :placeholder="$t('G2_PH_CONFIRM_PWD', '请再次输入新密码')"
            show-password
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="changePasswordDialogVisible = false">
            {{ $t('G2_BTN_CANCEL', '取消') }}
          </el-button>
          <el-button type="primary" @click="submitChangePassword" :loading="submitting">
            {{ $t('G2_BTN_CONFIRM', '确定') }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import { ElMessage } from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn';
import { t } from '@platform/i18n';
import { env } from '@shared/env';
import { PassportApi, PassportIdpBindingApi } from './api';
import { useDingTalkPassportBind } from './dingTalk';
import { getAuthorityUser } from '@/runtime/api/user.api';
import type { UserVo, PassportVo } from '@/runtime/api/user.api';
import type { PassportIdpBinding } from './type';

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
  loadIdpBindings();
};

const idpBindingLoading = ref(false);
const idpBindingList = ref<PassportIdpBinding[]>([]);
const idpBindingDetailVisible = ref(false);
const idpBindingDetail = ref<PassportIdpBinding | null>(null);

const IDP_TYPE_KEYS: Record<string, [string, string]> = {
  DINGTALK: ['MS_PP_IDP_DINGTALK', '钉钉'],
  FEISHU: ['MS_PP_IDP_FEISHU', '飞书'],
  WECHAT_WORK: ['MS_PP_IDP_WECHAT', '企业微信'],
};

const BIND_MODE_KEYS: Record<string, [string, string]> = {
  INTERNAL: ['MS_PP_MODE_INTERNAL', '企业内部应用'],
  THIRD_PARTY: ['MS_PP_MODE_THIRD', '第三方企业应用'],
};

function formatIdpType(value?: string) {
  if (!value) return '-';
  const entry = IDP_TYPE_KEYS[value];
  if (entry) return t(entry[0], entry[1]);
  return value;
}

function formatBindMode(value?: string) {
  if (!value) return '-';
  const entry = BIND_MODE_KEYS[value];
  if (entry) return t(entry[0], entry[1]);
  return value;
}

function formatSex(value?: string) {
  if (value === 'MALE') return t('G2_OPT_SEX_MALE', '男性');
  if (value === 'FEMALE') return t('G2_OPT_SEX_FEMALE', '女性');
  return value || '-';
}

function openIdpBindingDetail(row: PassportIdpBinding) {
  idpBindingDetail.value = row;
  idpBindingDetailVisible.value = true;
}

async function loadIdpBindings() {
  const passportId = passportInfo.value?.id;
  if (passportId == null) {
    idpBindingList.value = [];
    return;
  }
  idpBindingLoading.value = true;
  try {
    idpBindingList.value = await PassportIdpBindingApi.listByPassport(Number(passportId));
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('MS_PP_IDP_LOAD_FAIL', '加载三方绑定信息失败');
    ElMessage.error(msg);
    idpBindingList.value = [];
  } finally {
    idpBindingLoading.value = false;
  }
}

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

const editPassportRules = computed<FormRules>(() => ({
  username: [
    { required: true, message: t('G2_VLD_REQ_USERNAME', '请输入用户名'), trigger: 'blur' },
    { max: 64, message: t('G2_VLD_USERNAME_LEN', '用户名长度不能超过64个字符'), trigger: 'blur' },
  ],
  realName: [
    { max: 128, message: t('G2_VLD_REALNAME_LEN', '真实姓名长度不能超过128个字符'), trigger: 'blur' },
  ],
  sex: [
    {
      validator: (_rule, value: string, callback) => {
        if (value && value !== 'MALE' && value !== 'FEMALE') {
          callback(new Error(t('G2_VLD_SEX', '性别只能是MALE（男性）或FEMALE（女性）')));
        } else {
          callback();
        }
      },
      trigger: 'change',
    },
  ],
  birthday: [
    { max: 16, message: t('G2_VLD_BIRTHDAY_LEN', '生日长度不能超过16个字符'), trigger: 'blur' },
  ],
  idNo: [
    { max: 32, message: t('G2_VLD_IDNO_LEN', '身份证号长度不能超过32个字符'), trigger: 'blur' },
  ],
  mobile: [
    { max: 32, message: t('G2_VLD_MOBILE_LEN', '手机号长度不能超过32个字符'), trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        if (value && !/^1[3-9]\d{9}$/.test(value)) {
          callback(new Error(t('G2_VLD_MOBILE_FMT', '请输入正确的手机号格式')));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
  email: [
    { max: 128, message: t('G2_VLD_EMAIL_LEN', '邮箱长度不能超过128个字符'), trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        if (value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            callback(new Error(t('G2_VLD_EMAIL_FMT', '请输入正确的邮箱格式')));
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
}));

// 修改密码相关
const changePasswordDialogVisible = ref(false);
const changePasswordFormRef = ref<FormInstance | null>(null);
const changePasswordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const changePasswordRules = computed<FormRules>(() => ({
  oldPassword: [{ required: true, message: t('G2_VLD_REQ_OLD_PWD', '请输入原密码'), trigger: 'blur' }],
  newPassword: [
    { required: true, message: t('G2_VLD_REQ_NEW_PWD', '请输入新密码'), trigger: 'blur' },
    { min: 6, message: t('G2_VLD_PWD_MIN', '密码长度不能少于6位'), trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: t('G2_VLD_REQ_CONFIRM_PWD', '请确认新密码'), trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
// 验证确认密码是否与新密码一致
        if (value !== changePasswordForm.newPassword) {
          callback(new Error(t('G2_VLD_PWD_MISMATCH', '两次输入的密码不一致')));
        } else {
          callback();
        }
      },
      trigger: 'blur',
    },
  ],
}));

/**
 * 加载当前用户信息
 */
const loadUserInfo = async () => {
  loading.value = true;
  try {
    const authorityUser = await getAuthorityUser();
    userInfo.value = authorityUser;
    passportInfo.value = authorityUser.passport;
    await loadIdpBindings();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('MS_PP_LOAD_FAIL', '加载Passport信息失败');
    ElMessage.error(msg);
  } finally {
    loading.value = false;
  }
};

 * 处理更新Passport信息
const handleEditPassport = () => {
  if (!passportInfo.value) {
    ElMessage.warning(t('MS_PP_NOT_LOADED', 'Passport信息未加载，请稍后再试'));
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

 * 关闭更新Passport信息弹窗
const handleEditPassportClose = () => {
  editPassportFormRef.value?.resetFields();
};

 * 提交更新Passport信息
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
    ElMessage.success(t('G2_MSG_SAVE_OK', '保存成功'));
    editPassportDialogVisible.value = false;
    // 重新加载用户信息
    await loadUserInfo();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('MS_PP_UPDATE_FAIL', '更新Passport信息失败');
    ElMessage.error(msg);
  } finally {
    submitting.value = false;
  }
};

 * 处理修改密码
const handleChangePassword = () => {
  changePasswordDialogVisible.value = true;
};

 * 关闭修改密码弹窗
const handleChangePasswordClose = () => {
  changePasswordFormRef.value?.resetFields();
  changePasswordForm.oldPassword = '';
  changePasswordForm.newPassword = '';
  changePasswordForm.confirmPassword = '';
};

 * 提交修改密码
const submitChangePassword = async () => {
  if (!changePasswordFormRef.value) return;
  const valid = await changePasswordFormRef.value.validate();
  if (!valid) return;

  if (!passportInfo.value?.id) {
    ElMessage.warning(t('MS_PP_NOT_LOADED', 'Passport信息未加载，请稍后再试'));
    return;
  }

  submitting.value = true;
  try {
    await PassportApi.changePassword(passportInfo.value.id, {
      oldPassword: changePasswordForm.oldPassword,
      newPassword: changePasswordForm.newPassword,
    });
    ElMessage.success(t('MS_PP_PWD_OK', '密码修改成功，请重新登录'));
    changePasswordDialogVisible.value = false;
    // 清空表单
    handleChangePasswordClose();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : t('MS_PP_PWD_FAIL', '修改密码失败');
    ElMessage.error(msg);
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
